# Research Management, Lineage & Reproducibility

## 1. Overview
The quantitative research platform treats backtests and strategy discovery as scientific experiments requiring full reproducibility, immutable parameter logging, and verifiable data provenance.

## 2. Experiment Tracking Schema (`ResearchExperiment`)
Every research iteration stores an immutable record:
- **Experiment ID**: Standardized identifier (e.g. `EXP-0042`).
- **Research Hypothesis**: Scientific rationale tested (e.g. "Does moving average crossover performance degrade during high-volatility regimes?").
- **Dataset Fingerprint**: Hash of historical OHLCV data slice, source provider, and adjustment rules.
- **Strategy & Parameters**: Fast window, slow window, risk controls, and execution assumptions.
- **Result Metrics**: Total return %, annualized volatility %, Sharpe ratio, Max Drawdown %, trade count.
- **Research Fingerprint**: SHA-256 cryptographic digest binding data, model, and results.

## 3. Data Lineage & Provenance
Answers the core institutional question: *"Where did this number come from?"*
- **Source Provider**: Exchange or data vendor (e.g., Yahoo Finance Engine, TwelveData).
- **Retrieval Protocol**: Ingestion timestamp, network endpoint, and caching state.
- **Data Adjustments**: Split adjustments, dividend cash distributions, and currency conversions.
- **Data Quality Audits**: Outlier identification, missing observation fills, and zero-volume filtering.
