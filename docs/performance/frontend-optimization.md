# Frontend Performance & Rendering Optimization

## 1. Route-Level Code Splitting

The React application uses dynamic imports (`React.lazy` + `Suspense`) to partition major analytical modules into independent asynchronous chunks:

```
dist/assets/
├── index-[hash].js              (Core shell, layout, global store)
├── OverviewPage-[hash].js       (Eagerly bundled for instant load)
├── MarketDataPage-[hash].js     (62 kB chunk)
├── ReturnsPage-[hash].js        (14 kB chunk)
├── PortfolioPage-[hash].js      (34 kB chunk)
├── CorrelationPage-[hash].js    (21 kB chunk)
├── VolatilityPage-[hash].js     (24 kB chunk)
├── StrategiesPage-[hash].js     (41 kB chunk)
├── BacktestingPage-[hash].js    (98 kB chunk)
└── SettingsPage-[hash].js       (9 kB chunk)
```

Users downloading the platform only fetch JavaScript for the module they actively navigate to, reducing initial bundle transfer by $> 60\%$.

---

## 2. Visualization Downsampling Strategy

Canvas charts (Lightweight Charts) downsample display series when point counts exceed viewport display resolutions ($> 2,000$ points) to prevent browser DOM and Canvas context degradation:

```
[Raw Validated Historical Bars (e.g. 5,040 bars)]
               │
               ▼
[Analytical Engine (100% Raw Data, Full Precision)]
               │
               ▼
[Chart Data Adapter (Downsampling / Decimation)]
               │
               ▼
[Canvas Renderer (< 2,000 Visual Nodes)]
```

> **Quantitative Invariant**: Downsampling is applied **strictly in the presentation adapter layer**. Quantitative return calculators, volatility estimators, risk metrics, and backtesting engines **always execute against 100% complete validated raw data**.

---

## 3. UI Debouncing & Responsive State

Keyboard search inputs and command palette lookups are throttled using `useDebounce(value, 300)` to eliminate rapid re-render thrashing and prevent unneeded network requests on intermediate keystrokes.
