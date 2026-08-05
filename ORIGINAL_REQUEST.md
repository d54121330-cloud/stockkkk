# Original User Request

## 2026-08-05T04:37:45Z

建立一套由專業投信機構 (Institutional Investor) 角度出發的台股研究與視覺化分析系統。系統需調動「基本面研究員」、「技術面分析師」與「視覺化前端工程師」多角色協同分工，針對截圖中 9 檔熱門台股進行深度剖析，並打造現代化、富科技感的互動式 Web 儀表板，將分析結果與多維度評級數據完美呈現。

Working directory: C:\Users\允中\.gemini\antigravity\scratch\stock_analysis_teamwork
Integrity mode: development

## Target Stocks List (9 檔標的)
1. **SpaceX / 低軌衛星族群**:
   - 2313 華通 (Compeq) — 現價 218.0 (+9.82%)
   - 6285 啟碁 (WNC) — 現價 257.0 (+1.78%)
   - 6271 同欣電 (Tong Hsing) — 現價 188.5 (+5.01%)
   - 3491 昇達科 (UMT) — 現價 1,285.0 (+9.83%)
   - 2330 台積電 (TSMC) — 現價 2,400.0 (+3.45%)
2. **FOPOL (扇出型面板級封裝)**:
   - 6239 力成 (Powertech) — 現價 260.5 (+1.56%)
   - 3481 群創 (Innolux) — 現價 48.65 (+1.78%)
3. **DPU (資料處理器)**:
   - 2345 智邦 (Accton) — 現價 2,405.0 (+3.66%)
4. **光通訊 / CPO**:
   - 3363 上詮 (FOCI) — 現價 598.0 (+6.22%)

---

## Requirements

### R1. 專業投信機構多角色分工分析 (Institutional Research Framework)
- **基本面分析師 (Fundamental Analyst)**：剖析 9 檔股票的產業地位、營運催化劑 (Catalysts)、產業趨勢（低軌衛星直連、FOPOL產能拓展、AI/DPU 需求、CPO 矽光子進展）、財務營收動向與機構籌碼看法，給出投資評級與目標估值邏輯。
- **技術面分析師 (Technical Analyst)**：分析各標的最新 K 線走勢型態、均線排列 (MA5/20/60)、成交量能變化、支撐壓力位階以及技術指標（RSI, MACD, KD），擬定短中線操作策略（強勢攻堅/拉回佈局/箱型區間）。
- **視覺化與前端工程師 (UI/UX Engineer)**：整合兩位分析師的觀點，設計打造視覺效果驚艷、極具彭博/投信研究終端質感的現代 Web 儀表板。

### R2. 互動式現代化視覺化儀表板 (Interactive Analytics Dashboard)
- **總覽儀表板 (Market Overview)**：展示 9 檔個股的當前報價、漲跌幅、族群分類卡片、總體強弱度排序。
- **個股深度研報頁面/模組 (Detailed Stock Report)**：
  - 投信多維度能力雷達圖（營收成長、技術型態、法人籌碼、產業前景、估值安全邊際）。
  - 價格與均線走勢視覺化圖表 (Interactive Price & Indicator Charts)。
  - 基本面 Investment Thesis、催化劑與潛在風險點專區。
  - 技術面關鍵點位表（第一支撐、第二支撐、突破壓力位、停損位）。
- **族群與評級比較 (Group & Rating Matrix)**：提供按 SpaceX、FOPOL、DPU、光通訊分類的矩陣視圖，支援評級篩選（強烈買進 / 買進 / 中立）。

### R3. Web 應用技術規範
- 採用 HTML / Modern CSS / JavaScript (或 Vite/React 前端架構)。
- 圖表使用 Chart.js / ECharts / Lightweight Charts 等庫渲染豐富圖表。
- 採用深色極致科技風 (Dark Institutional Theme) 與絕佳的視覺互動體驗 (Hover, Tab 切換, 微動畫)。

---

## Acceptance Criteria

### 分析專業度與完整度
- [ ] 完整涵蓋 9 檔指定股票（2313, 6285, 6271, 3491, 2330, 6239, 3481, 2345, 3363）。
- [ ] 每檔個股皆有投信等級的基本面（Thesis + Risks）與技術面（位階 + 指標 + 觀點）。
- [ ] 具備多角色協同產出的明確專業結構。

### Web 視覺化與互動體驗
- [ ] 建立完全可執行的現代 Web 應用，在瀏覽器中展現極致專業的深色投信終端風格。
- [ ] 雷達圖、價格/指標趨勢圖表均為動態互動式圖表（非靜態占位圖）。
- [ ] 支援標的切換、族群篩選與綜合比對功能。
- [ ] 頁面無 JS 報錯，響應流暢且排版符合專業投信研究報告品質。

## Follow-up — 2026-08-05T04:38:55Z

使用者新增需求：
請在團隊中新增「投資策略解釋員 (Investment Explainer / Advisor)」的角色！

任務細節：
1. 針對 9 檔個股（2313 華通、6285 啟碁、6271 同欣電、3491 昇達科、2330 台積電、6239 力成、3481 群創、2345 智邦、3363 上詮），解釋員需要整合基本面與技術面的結論，給出明確的操作方向：
   - 做多 (Long) / 避險放空 (Short) / 區間觀望 (Hold)
   - 具體目標價 (Target Price) 與停損價 (Stop Loss)
   - 建議進場點 (Entry Range)
   - 給投資人的白話文總結 (Key Takeaways & Rationale)

2. 視覺化前端工程師在 Web 儀表板中需顯眼呈效「解釋員決策卡片」(Advisor Recommendation Card)，包含做多/做空 Tag、目標價、停損點與一分鐘重點摘要。

請傳達給 Orchestrator 並更新開發與研報架構！

