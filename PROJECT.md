# Project: Taiwan Stock Institutional Investor Research & Visual Analytics System

## Architecture
- **Data & Research Layer**: Structured JSON data files containing institutional fundamental analysis (`data/fundamental_analysis.json`) and technical indicators/price series (`data/technical_analysis.json`) for all 9 stocks.
- **Visual Analytics Dashboard Layer**: Modern single-page Web application (`index.html`, `styles.css`, `app.js`) rendering a dark Bloomberg/institutional-grade interface using ECharts / Chart.js.
- **Component Breakdown**:
  - Top Navigation & Market Overview Banner (9 stocks quotes, daily gains/losses, market sentiment index).
  - Theme/Group Filter & Rating Matrix (SpaceX, FOPOL, DPU, CPO filterable tabs with Strong Buy / Buy / Neutral ratings).
  - Main Interactive Chart Panel: Multi-asset price series, Moving Averages (MA5, MA20, MA60), Volume bars, RSI/MACD/KD sub-charts.
  - Institutional Radar Chart: 5-axis capability radar (Revenue Growth, Technical Pattern, Institutional Flow, Industry Outlook, Valuation Safety Margin).
  - Advisor Recommendation Card (解釋員決策卡片): Action Tag (Long/Short/Hold), Target Price, Stop Loss, Entry Range, 1-minute key summary points.
  - Detailed Research Modal / Drawer: Investment Thesis, Operational Catalysts, Risk Factors, Key Support/Resistance Levels, Stop-loss targets.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Fundamental Analysis (9 stocks) | Industry position, Thesis, Catalysts, Risks, Ratings, Valuation logic for 2313, 6285, 6271, 3491, 2330, 6239, 3481, 2345, 3363 | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Technical Analysis (9 stocks) | K-line trends, MA5/20/60, Volume, RSI/MACD/KD, Support/Resistance, Trading Strategy | M2 | ORIGINAL_REQUEST §R1 |
| 3 | Market Overview Dashboard Header | Real-time quote ticker, daily % change, group cards, strength ordering | M3 | ORIGINAL_REQUEST §R2 |
| 4 | Detailed Stock Report Modal/Tab | Fundamental Thesis & Risk module + Technical levels table | M3 | ORIGINAL_REQUEST §R2 |
| 5 | Multi-dimensional Radar Chart | 5-axis institutional score radar chart per stock | M3 | ORIGINAL_REQUEST §R2 |
| 6 | Interactive Price & Indicator Chart | K-line / Price line + MA5/20/60 + RSI/MACD/KD sub-charts with tooltips & range selector | M3 | ORIGINAL_REQUEST §R2 |
| 7 | Group & Rating Matrix View | Group tabs (SpaceX, FOPOL, DPU, CPO) + Rating filters (Strong Buy, Buy, Neutral) | M3 | ORIGINAL_REQUEST §R2 |
| 8 | Dark Institutional UI Theme & UX | Dark tech design, micro-interactions, responsive design, zero JS errors | M3 | ORIGINAL_REQUEST §R3 |
| 9 | Verification & E2E Testing | Data validation, chart rendering test, cross-browser check, audit verification | M4 | ORIGINAL_REQUEST §Acceptance Criteria |
| 10 | Investment Explainer / Advisor Synthesis | Synthesize M1 & M2 into Long/Short/Hold action tags, Target Price, Stop Loss, Entry Range, 1-min summary | M2.5 | ORIGINAL_REQUEST §Follow-up |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Fundamental Analysis | Conduct fundamental analysis for all 9 stocks & produce `data/fundamental_analysis.json` | None | DONE |
| M2 | Technical Analysis | Conduct technical analysis & price series generation for all 9 stocks & produce `data/technical_analysis.json` | None | DONE |
| M2.5 | Investment Explainer Synthesis | Synthesize M1 & M2 into `data/advisor_recommendations.json` & `advisor_report.md` | M1, M2 | DONE |
| M3 | Institutional Web Dashboard | Implement `index.html`, `styles.css`, `app.js` using data from M1, M2 & M2.5 | M1, M2, M2.5 | DONE |
| M4 | Verification & E2E Testing | E2E testing, visual audit, and adversarial stress testing | M3 | DONE |

## Interface Contracts
### Data Layer (M1, M2, M2.5) ↔ Web Dashboard (M3)
- `data/fundamental_analysis.json`:
  ```json
  {
    "symbol": "2313",
    "name": "華通 (Compeq)",
    "category": "SpaceX / 低軌衛星",
    "price": 218.0,
    "changePercent": 9.82,
    "rating": "Strong Buy",
    "targetPrice": 260.0,
    "thesis": "...",
    "catalysts": ["..."],
    "risks": ["..."],
    "radarScores": {
      "revenueGrowth": 92,
      "technicalPattern": 95,
      "institutionalFlow": 88,
      "industryOutlook": 95,
      "safetyMargin": 80
    }
  }
  ```
- `data/technical_analysis.json`:
  ```json
  {
    "symbol": "2313",
    "ma5": 208.5,
    "ma20": 195.0,
    "ma60": 182.0,
    "support1": 205.0,
    "support2": 192.0,
    "resistance1": 225.0,
    "stopLoss": 188.0,
    "rsi": 72.4,
    "macd": "Bullish Crossover",
    "kd": "K:85 / D:78",
    "strategy": "強勢攻堅...",
    "priceHistory": [
      {"date": "2026-07-01", "close": 185.0, "volume": 12500, "ma5": 182.0, "ma20": 178.0, "ma60": 170.0}
    ]
  }
  ```
- `data/advisor_recommendations.json`:
  ```json
  {
    "symbol": "2313",
    "action": "做多 (Long)",
    "targetPrice": 260.0,
    "stopLoss": 188.0,
    "entryRange": "205.0 - 212.0",
    "summaryPoints": [
      "低軌衛星板獨家供應商，SpaceX Direct-to-Cell 規格大升級，營收爆發",
      "K 線均線多頭排列，突破前高後獲利拉回即為最佳進場買點"
    ],
    "fullRationale": "..."
  }
  ```


## Code Layout
```
stock_analysis_teamwork/
├── ORIGINAL_REQUEST.md
├── PROJECT.md
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── charts.js
│   └── data_loader.js
└── data/
    ├── fundamental_analysis.json
    └── technical_analysis.json
```
