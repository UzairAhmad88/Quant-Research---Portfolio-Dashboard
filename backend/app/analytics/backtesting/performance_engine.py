from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import numpy as np


class PerformanceEngine:
    """
    Quantitative Evaluation Engine for Backtest Simulation Results.
    Decoupled analytics layer interpreting raw simulation trajectory data.
    """

    @staticmethod
    def calculate_performance_metrics(
        initial_capital: float,
        portfolio_states: List[Dict[str, Any]],
        completed_trades: List[Dict[str, Any]],
        trade_events: Optional[List[Dict[str, Any]]] = None,
        risk_free_rate: float = 0.0,
        annualization_factor: int = 252
    ) -> Dict[str, Any]:
        if not portfolio_states:
            return {
                "returns": {
                    "total_return": 0.0,
                    "annualized_return": None,
                    "observation_count": 0,
                    "elapsed_days": 0.0,
                },
                "risk": {
                    "volatility": None,
                    "annualized_volatility": None,
                    "sharpe_ratio": None,
                    "sortino_ratio": None,
                    "risk_free_rate": risk_free_rate,
                    "annualization_factor": annualization_factor,
                },
                "drawdown": {
                    "max_drawdown": 0.0,
                    "max_drawdown_duration_days": 0.0,
                    "calmar_ratio": None,
                },
                "trading": {
                    "trade_count": 0,
                    "win_rate": None,
                    "average_win": None,
                    "average_loss": None,
                    "profit_factor": None,
                    "average_trade_return": None,
                    "best_trade": None,
                    "worst_trade": None,
                },
                "costs_and_exposure": {
                    "exposure": 0.0,
                    "turnover": 0.0,
                    "total_commission": 0.0,
                    "total_slippage_cost": 0.0,
                    "total_transaction_costs": 0.0,
                },
                "equity_series": [],
            }

        # 1. Sort portfolio states chronologically
        states = sorted(portfolio_states, key=lambda s: s["timestamp"])
        values = [float(s["portfolio_value"]) for s in states]
        timestamps_raw = [s["timestamp"] for s in states]
        cash_list = [float(s["cash"]) for s in states]
        pos_val_list = [float(s["position_value"]) for s in states]
        pos_qty_list = [float(s["position_quantity"]) for s in states]

        v_0 = float(initial_capital)
        v_n = values[-1]
        total_return = (v_n / v_0) - 1.0 if v_0 > 0 else 0.0

        # Parse timestamps to datetime objects
        parsed_timestamps = []
        for ts in timestamps_raw:
            if isinstance(ts, str):
                parsed_timestamps.append(datetime.fromisoformat(ts.replace("Z", "+00:00")))
            else:
                parsed_timestamps.append(ts)

        t_start = parsed_timestamps[0]
        t_end = parsed_timestamps[-1]
        delta_total = t_end - t_start
        elapsed_days = max(0.0, delta_total.total_seconds() / 86400.0) if hasattr(delta_total, "total_seconds") else 0.0
        elapsed_years = elapsed_days / 365.25

        if elapsed_years > 0 and v_n > 0 and v_0 > 0:
            annualized_return = (v_n / v_0) ** (1.0 / elapsed_years) - 1.0
        else:
            annualized_return = None

        # 2. Periodic returns & Risk Metrics
        periodic_returns = []
        for i in range(1, len(values)):
            prev = values[i - 1]
            curr = values[i]
            periodic_returns.append((curr / prev) - 1.0 if prev > 0 else 0.0)

        arr_returns = np.array(periodic_returns, dtype=float)
        n_returns = len(arr_returns)

        if n_returns >= 2:
            volatility = float(np.std(arr_returns, ddof=1))
            annualized_volatility = float(volatility * np.sqrt(annualization_factor))

            rf_period = risk_free_rate / float(annualization_factor)
            excess_returns = arr_returns - rf_period
            mean_excess = float(np.mean(excess_returns))

            if volatility > 1e-12:
                sharpe_ratio = float((mean_excess / volatility) * np.sqrt(annualization_factor))
            else:
                sharpe_ratio = None

            downside_diffs = np.minimum(arr_returns - 0.0, 0.0)
            downside_variance = float(np.mean(downside_diffs ** 2))
            downside_dev = float(np.sqrt(downside_variance))

            if downside_dev > 1e-12:
                mean_return = float(np.mean(arr_returns))
                sortino_ratio = float((mean_return / downside_dev) * np.sqrt(annualization_factor))
            else:
                sortino_ratio = None
        else:
            volatility = None
            annualized_volatility = None
            sharpe_ratio = None
            sortino_ratio = None

        # 3. Drawdown & Equity Series
        running_peak = v_0
        max_drawdown = 0.0
        max_dd_duration_days = 0.0
        peak_ts = parsed_timestamps[0]

        equity_series = []
        for i in range(len(values)):
            val = values[i]
            ts_dt = parsed_timestamps[i]

            if val > running_peak:
                running_peak = val
                peak_ts = ts_dt

            dd = (val / running_peak) - 1.0 if running_peak > 0 else 0.0
            if dd < max_drawdown:
                max_drawdown = dd

            if val < running_peak:
                dur_delta = ts_dt - peak_ts
                dur_days = dur_delta.total_seconds() / 86400.0 if hasattr(dur_delta, "total_seconds") else 0.0
                if dur_days > max_dd_duration_days:
                    max_dd_duration_days = dur_days

            equity_series.append({
                "timestamp": ts_dt,
                "portfolio_value": val,
                "cumulative_return": (val / v_0) - 1.0 if v_0 > 0 else 0.0,
                "running_peak": running_peak,
                "drawdown": dd,
                "cash": cash_list[i],
                "position_value": pos_val_list[i],
                "position_quantity": pos_qty_list[i]
            })

        max_drawdown = float(max_drawdown)
        if max_drawdown < 0 and abs(max_drawdown) > 1e-12 and annualized_return is not None:
            calmar_ratio = float(annualized_return / abs(max_drawdown))
        else:
            calmar_ratio = None

        # 4. Completed Trade Metrics
        trade_count = len(completed_trades)
        if trade_count == 0:
            win_rate = None
            average_win = None
            average_loss = None
            profit_factor = None
            average_trade_return = None
            best_trade = None
            worst_trade = None
        else:
            winning_trades = [t for t in completed_trades if float(t.get("net_pnl", 0.0)) > 0]
            losing_trades = [t for t in completed_trades if float(t.get("net_pnl", 0.0)) < 0]

            win_rate = float(len(winning_trades) / trade_count)

            win_pnls = [float(t["net_pnl"]) for t in winning_trades]
            average_win = float(np.mean(win_pnls)) if win_pnls else None

            loss_pnls = [float(t["net_pnl"]) for t in losing_trades]
            average_loss = float(np.mean(loss_pnls)) if loss_pnls else None

            gross_profits = sum(win_pnls)
            gross_losses = abs(sum(loss_pnls))

            if gross_losses > 1e-12:
                profit_factor = float(gross_profits / gross_losses)
            else:
                profit_factor = None

            trade_returns = [float(t.get("trade_return", 0.0)) for t in completed_trades]
            average_trade_return = float(np.mean(trade_returns)) if trade_returns else None

            best_t = max(completed_trades, key=lambda t: float(t.get("net_pnl", 0.0)))
            worst_t = min(completed_trades, key=lambda t: float(t.get("net_pnl", 0.0)))

            best_trade = {
                "trade_id": str(best_t.get("id", "")),
                "net_pnl": float(best_t.get("net_pnl", 0.0)),
                "trade_return": float(best_t.get("trade_return", 0.0)),
                "entry_timestamp": best_t.get("entry_timestamp"),
                "exit_timestamp": best_t.get("exit_timestamp"),
            }
            worst_trade = {
                "trade_id": str(worst_t.get("id", "")),
                "net_pnl": float(worst_t.get("net_pnl", 0.0)),
                "trade_return": float(worst_t.get("trade_return", 0.0)),
                "entry_timestamp": worst_t.get("entry_timestamp"),
                "exit_timestamp": worst_t.get("exit_timestamp"),
            }

        # 5. Exposure, Turnover & Transaction Costs
        open_bars = sum(1 for q in pos_qty_list if q > 0)
        exposure = float(open_bars / len(pos_qty_list)) if pos_qty_list else 0.0

        if trade_events:
            total_comm = sum(float(e.get("commission", 0.0)) for e in trade_events)
            total_slip = sum(float(e.get("slippage", 0.0)) for e in trade_events)
            total_notional = sum(float(e.get("notional_value", 0.0)) for e in trade_events)
        else:
            total_comm = sum(float(t.get("entry_commission", 0.0)) + float(t.get("exit_commission", 0.0)) for t in completed_trades)
            total_slip = sum(float(t.get("entry_slippage", 0.0)) + float(t.get("exit_slippage", 0.0)) for t in completed_trades)
            total_notional = sum(float(t.get("entry_notional", 0.0)) + float(t.get("exit_notional", 0.0)) for t in completed_trades)

        total_transaction_costs = total_comm + total_slip
        mean_portfolio_val = float(np.mean(values)) if values else 0.0
        turnover = float(total_notional / mean_portfolio_val) if mean_portfolio_val > 0 else 0.0

        return {
            "returns": {
                "total_return": total_return,
                "annualized_return": annualized_return,
                "observation_count": len(states),
                "elapsed_days": elapsed_days,
            },
            "risk": {
                "volatility": volatility,
                "annualized_volatility": annualized_volatility,
                "sharpe_ratio": sharpe_ratio,
                "sortino_ratio": sortino_ratio,
                "risk_free_rate": risk_free_rate,
                "annualization_factor": annualization_factor,
            },
            "drawdown": {
                "max_drawdown": max_drawdown,
                "max_drawdown_duration_days": max_dd_duration_days,
                "calmar_ratio": calmar_ratio,
            },
            "trading": {
                "trade_count": trade_count,
                "win_rate": win_rate,
                "average_win": average_win,
                "average_loss": average_loss,
                "profit_factor": profit_factor,
                "average_trade_return": average_trade_return,
                "best_trade": best_trade,
                "worst_trade": worst_trade,
            },
            "costs_and_exposure": {
                "exposure": exposure,
                "turnover": turnover,
                "total_commission": total_comm,
                "total_slippage_cost": total_slip,
                "total_transaction_costs": total_transaction_costs,
            },
            "equity_series": equity_series,
        }
