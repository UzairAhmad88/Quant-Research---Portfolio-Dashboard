from datetime import datetime
from typing import List, Dict, Any, Optional
from app.analytics.backtesting.execution_model import NextOpenExecutionModel
from app.analytics.backtesting.position_sizer import FullCapitalPositionSizing
from app.analytics.backtesting.cost_model import FixedCostModel
from app.analytics.backtesting.position_state import PositionState
from app.analytics.backtesting.execution_scheduler import ExecutionScheduler
from app.analytics.backtesting.execution_service import ExecutionService
from app.analytics.backtesting.trade_service import TradeLifecycleService


def normalize_timestamp_key(ts: Any) -> str:
    if isinstance(ts, str):
        return ts.replace(" ", "T").split(".")[0].replace("Z", "")
    if hasattr(ts, "isoformat"):
        return ts.isoformat().replace(" ", "T").split(".")[0].replace("Z", "")
    return str(ts).replace(" ", "T").split(".")[0].replace("Z", "")


def extract_signal_type_str(val: Any) -> str:
    if hasattr(val, "value"):
        val = val.value
    raw = str(val or "").upper().strip()
    if "BUY" in raw:
        return "BUY"
    if "SELL" in raw:
        return "SELL"
    return raw


def run_backtest_simulation(
    bars: List[Dict[str, Any]],
    signals: Dict[datetime, Dict[str, Any]],
    initial_capital: float = 100000.0,
    execution_timing: str = "NEXT_OPEN",
    position_sizing: str = "FULL_CAPITAL",
    commission: float = 0.0,
    slippage: float = 0.0,
    direction: str = "LONG_ONLY",
    force_close_at_end: bool = True,
    instrument_id: str = "SIMULATED_INSTRUMENT"
) -> Dict[str, Any]:
    if not bars:
        return {
            "status": "COMPLETED_WITH_WARNINGS",
            "final_cash": initial_capital,
            "final_position": 0.0,
            "final_portfolio_value": initial_capital,
            "trade_events": [],
            "completed_trades": [],
            "portfolio_states": [],
            "rejection_logs": [],
            "message": "No price observations available for backtest."
        }

    sizer = FullCapitalPositionSizing()
    execution_model = NextOpenExecutionModel()
    
    pos_state = PositionState(instrument_id=instrument_id)
    scheduler = ExecutionScheduler()
    exec_service = ExecutionService()
    trade_service = TradeLifecycleService()

    cash = float(initial_capital)
    trade_events: List[Dict[str, Any]] = []
    portfolio_states: List[Dict[str, Any]] = []

    n = len(bars)
    for i in range(n):
        curr_bar = bars[i]
        curr_ts = curr_bar["timestamp"]
        curr_open = float(curr_bar.get("open", curr_bar["close"]))
        curr_close = float(curr_bar["close"])

        # 1. Process Pending Scheduled Execution from prior signal
        if scheduler.pending_signal is not None:
            pending_sig = scheduler.pending_signal
            sig_type = extract_signal_type_str(pending_sig.get("signal_type"))
            sig_id = pending_sig.get("id")
            sig_ts = pending_sig.get("timestamp")

            exec_details = execution_model.determine_execution(
                signal_timestamp=sig_ts,
                next_bar=curr_bar,
                reason="SIGNAL"
            )

            if exec_details:
                mkt_price = exec_details.execution_price  # Open price of next bar

                # A. Execute BUY Entry
                if sig_type == "BUY" and pos_state.status == "FLAT":
                    qty = sizer.calculate_quantity(
                        available_cash=cash,
                        execution_price=mkt_price,
                        current_position=pos_state.quantity,
                        commission_rate=commission,
                        slippage_rate=slippage
                    )
                    
                    if qty > 0:
                        exec_res = exec_service.calculate_execution(
                            side="BUY",
                            market_price=mkt_price,
                            quantity=qty,
                            commission_rate=commission,
                            slippage_rate=slippage
                        )
                        total_cash_required = exec_res["notional_value"] + exec_res["commission"]

                        if (cash + 1e-5) >= total_cash_required:
                            cash = max(0.0, cash - total_cash_required)
                            pos_state.open_position(
                                quantity=qty,
                                entry_price=exec_res["execution_price"],
                                entry_timestamp=curr_ts,
                                entry_signal_id=sig_id,
                                entry_trade_event_id=None,
                                commission=exec_res["commission"],
                                slippage=exec_res["slippage"]
                            )

                            trade_events.append({
                                "signal_id": sig_id,
                                "side": "BUY",
                                "signal_timestamp": sig_ts,
                                "execution_timestamp": curr_ts,
                                "execution_reason": "SIGNAL",
                                "execution_price": exec_res["execution_price"],
                                "quantity": qty,
                                "notional_value": exec_res["notional_value"],
                                "commission": exec_res["commission"],
                                "slippage": exec_res["slippage"],
                                "cash_after": cash
                            })
                        else:
                            scheduler.record_rejection(
                                signal_id=sig_id,
                                timestamp=curr_ts,
                                side="BUY",
                                reason="INSUFFICIENT_CASH"
                            )

                # B. Execute SELL Exit
                elif sig_type == "SELL" and pos_state.status == "OPEN":
                    qty = pos_state.quantity
                    if qty > 0:
                        exec_res = exec_service.calculate_execution(
                            side="SELL",
                            market_price=mkt_price,
                            quantity=qty,
                            commission_rate=commission,
                            slippage_rate=slippage
                        )
                        net_cash = exec_res["notional_value"] - exec_res["commission"]
                        cash += net_cash

                        completed_trade = pos_state.close_position(
                            exit_price=exec_res["execution_price"],
                            exit_timestamp=curr_ts,
                            exit_signal_id=sig_id,
                            exit_trade_event_id=None,
                            exit_commission=exec_res["commission"],
                            exit_slippage=exec_res["slippage"],
                            exit_reason="SIGNAL"
                        )
                        trade_service.record_completed_trade(completed_trade)

                        trade_events.append({
                            "signal_id": sig_id,
                            "side": "SELL",
                            "signal_timestamp": sig_ts,
                            "execution_timestamp": curr_ts,
                            "execution_reason": "SIGNAL",
                            "execution_price": exec_res["execution_price"],
                            "quantity": qty,
                            "notional_value": exec_res["notional_value"],
                            "commission": exec_res["commission"],
                            "slippage": exec_res["slippage"],
                            "cash_after": cash
                        })

            # Clear scheduled signal
            scheduler.clear_pending()

        # 2. Value Portfolio at Current Observation (End-of-bar valuation)
        market_price = curr_close
        pos_state.update_valuation(market_price)
        portfolio_value = cash + pos_state.current_value

        portfolio_states.append({
            "timestamp": curr_ts,
            "cash": cash,
            "position_quantity": pos_state.quantity,
            "market_price": market_price,
            "position_value": pos_state.current_value,
            "portfolio_value": portfolio_value,
            "unrealized_pnl": pos_state.unrealized_pnl
        })

        # 3. Check for New Signal at Current Observation
        ts_key = normalize_timestamp_key(curr_ts)
        sig = signals.get(ts_key) or signals.get(curr_ts)
        if sig:
            sig_type = extract_signal_type_str(sig.get("signal_type"))

            if sig_type == "BUY":
                if pos_state.status == "FLAT":
                    scheduler.schedule_signal(sig)
                else:
                    scheduler.record_rejection(
                        signal_id=sig.get("id"),
                        timestamp=curr_ts,
                        side="BUY",
                        reason="ALREADY_LONG"
                    )
            elif sig_type == "SELL":
                if pos_state.status == "OPEN":
                    scheduler.schedule_signal(sig)
                else:
                    scheduler.record_rejection(
                        signal_id=sig.get("id"),
                        timestamp=curr_ts,
                        side="SELL",
                        reason="NO_OPEN_POSITION"
                    )

    # 4. Handle Open Position at Simulation Boundary (Forced Liquidation)
    if pos_state.status == "OPEN" and pos_state.quantity > 0 and force_close_at_end:
        last_bar = bars[-1]
        last_ts = last_bar["timestamp"]
        last_close = float(last_bar["close"])
        qty = pos_state.quantity

        exec_res = exec_service.calculate_execution(
            side="SELL",
            market_price=last_close,
            quantity=qty,
            commission_rate=commission,
            slippage_rate=slippage
        )
        net_cash = exec_res["notional_value"] - exec_res["commission"]
        cash += net_cash

        completed_trade = pos_state.close_position(
            exit_price=exec_res["execution_price"],
            exit_timestamp=last_ts,
            exit_signal_id=None,
            exit_trade_event_id=None,
            exit_commission=exec_res["commission"],
            exit_slippage=exec_res["slippage"],
            exit_reason="FORCED_END"
        )
        trade_service.record_completed_trade(completed_trade)

        trade_events.append({
            "signal_id": None,
            "side": "SELL",
            "signal_timestamp": last_ts,
            "execution_timestamp": last_ts,
            "execution_reason": "FORCED_END",
            "execution_price": exec_res["execution_price"],
            "quantity": qty,
            "notional_value": exec_res["notional_value"],
            "commission": exec_res["commission"],
            "slippage": exec_res["slippage"],
            "cash_after": cash
        })

        # Update final portfolio state snapshot
        if portfolio_states:
            portfolio_states[-1]["cash"] = cash
            portfolio_states[-1]["position_quantity"] = 0.0
            portfolio_states[-1]["position_value"] = 0.0
            portfolio_states[-1]["portfolio_value"] = cash
            portfolio_states[-1]["unrealized_pnl"] = 0.0

    return {
        "status": "COMPLETED",
        "final_cash": cash,
        "final_position": pos_state.quantity,
        "final_portfolio_value": cash if pos_state.status == "FLAT" else portfolio_states[-1]["portfolio_value"],
        "trade_events": trade_events,
        "completed_trades": trade_service.get_completed_trades(),
        "portfolio_states": portfolio_states,
        "rejection_logs": scheduler.rejection_logs,
        "message": None
    }
