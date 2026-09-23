from dataclasses import dataclass
import pandas as pd

from app.analytics.performance import max_drawdown, total_return, sharpe_ratio
from app.services.strategies.moving_average import MovingAverageStrategy

@dataclass
class BacktestResult:
    equity: pd.Series
    trades: pd.DataFrame
    metrics: dict

class BacktestEngine:
    def run(self, data: pd.DataFrame, strategy: MovingAverageStrategy,
            initial_capital: float, commission_rate: float = 0.0,
            slippage_rate: float = 0.0) -> BacktestResult:
        df = strategy.signals(data["close"]).copy()
        position = df["signal"].shift(1).fillna(0)
        returns = df["close"].pct_change().fillna(0)
        strategy_returns = position * returns
        turnover = position.diff().abs().fillna(0)
        costs = turnover * (commission_rate + slippage_rate)
        net_returns = strategy_returns - costs
        equity = initial_capital * (1 + net_returns).cumprod()

        metrics = {
            "final_value": float(equity.iloc[-1]),
            "total_return": total_return(equity),
            "max_drawdown": max_drawdown(equity),
            "sharpe_ratio": sharpe_ratio(net_returns),
            "total_trades": int((turnover > 0).sum()),
        }
        return BacktestResult(
            equity=equity,
            trades=df.loc[turnover > 0, ["close", "signal"]].copy(),
            metrics=metrics,
        )
