# API Specification

## Market Data

GET /api/market-data/{symbol}
POST /api/market-data/download

## Returns

POST /api/returns/calculate

## Portfolio

POST /api/portfolio/calculate
POST /api/portfolio/create
GET /api/portfolio/{portfolio_id}

## Analytics

POST /api/analytics/correlation
POST /api/analytics/volatility

## Strategies

POST /api/strategies/moving-average

## Backtesting

POST /api/backtest/run
GET /api/backtest/{backtest_id}
GET /api/backtest/{backtest_id}/trades

All endpoints should eventually return a consistent response envelope:

{
  "success": true,
  "data": {},
  "error": null,
  "metadata": {}
}
