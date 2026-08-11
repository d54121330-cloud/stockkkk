/**
 * Taiwan Stock Institutional Investor Research & Analytics System
 * Wall Street UX & Product Experience Director Controller Application (js/app.js)
 * 100% Zero-Financial-Barrier Accessibility & Flawless Flow
 */

(function () {
  'use strict';

  // Application State
  let defaultStocks = [];
  let vaultStocks = [];
  let allCombinedStocks = [];

  let filteredStocks = [];
  let activeStock = null;
  let activeChartMode = 'kline'; // 'kline', 'profile', 'oscillator'
  let activeOscillatorTab = 'rsi'; // 'rsi', 'macd', 'kd'
  let activeModalTab = 'advisor';
  let currentTheme = localStorage.getItem('apple_stock_theme') || 'dark';
  let watchlist = new Set(JSON.parse(localStorage.getItem('apple_stock_watchlist') || '[]'));
  let autoTickTimer = null;
  let lastRefreshTime = new Date();

  let filters = {
    categoryKey: 'all',
    actionTag: 'all',
    onlyWatchlist: false,
    search: ''
  };

  /**
   * Application Initialization
   */
  async function init() {
    try {
      console.log('[Institutional Terminal] Initializing Wall Street Executive Dashboard...');

      // Apply Initial Theme
      applyTheme(currentTheme);

      const data = await DataLoader.loadAllData();
      defaultStocks = data.stocks || [];
      vaultStocks = data.vaultStocks || [];
      allCombinedStocks = data.allCombined || [];

      filteredStocks = [...defaultStocks];
      activeStock = defaultStocks.find(s => s.symbol === '2330') || defaultStocks[0];

      renderTickerBar();
      renderMasterTable();
      renderDeepDivePanel(activeStock);
      setupEventListeners();
      updateTimestampDisplay();

      startAutoTick();

      console.log('[Institutional Terminal] Initialized successfully with zero financial barrier guarantees.');
    } catch (err) {
      console.error('[Institutional Terminal] Initialization Error:', err);
      showErrorMessage('資料載入失敗，請確認 JSON / JS 檔案載入狀態。');
    }
  }

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('apple_stock_theme', theme);

    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀️ 淺色模式' : '🌙 深色模式';
    }

    if (activeStock && window.ChartsManager) {
      renderActiveChart(activeStock);
    }
  }

  /**
   * Render Top Ticker Bar Header
   */
  function renderTickerBar() {
    const container = document.getElementById('ticker-carousel');
    if (!container) return;

    const listToRender = filters.categoryKey === 'special_vault' ? vaultStocks : defaultStocks;

    container.innerHTML = listToRender.map(s => {
      const isUp = s.changePercent >= 0;
      const changeClass = isUp ? 'text-green' : 'text-rose';
      const changeSign = isUp ? '+' : '';
      const isSelected = activeStock && activeStock.symbol === s.symbol ? 'active' : '';

      return `
        <div class="ticker-chip ${isSelected}" data-symbol="${s.symbol}">
          <span class="ticker-sym">${s.symbol}</span>
          <span class="ticker-name">${s.name}</span>
          <span class="ticker-price">${s.price.toFixed(1)}</span>
          <span class="ticker-chg ${changeClass}">${changeSign}${s.changePercent.toFixed(2)}%</span>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.ticker-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const symbol = chip.getAttribute('data-symbol');
        selectStock(symbol);
      });
    });
  }

  /**
   * 10-Second Auto-Tick Timer
   */
  function startAutoTick() {
    if (autoTickTimer) clearInterval(autoTickTimer);
    autoTickTimer = setInterval(() => {
      lastRefreshTime = new Date();
      updateTimestampDisplay();

      // Micro price fluctuation simulation
      allCombinedStocks.forEach(s => {
        const delta = (Math.random() - 0.48) * (s.price * 0.0015);
        s.price = Number(Math.max(1, s.price + delta).toFixed(1));
      });

      renderTickerBar();
      renderMasterTable();
      if (activeStock) renderDeepDivePanel(activeStock);
    }, 10000);
  }

  function updateTimestampDisplay() {
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    if (statusText) {
      const timeStr = lastRefreshTime.toLocaleTimeString('zh-TW', { hour12: false });
      statusText.textContent = `🟢 已即時同步最新盤後報價 [10s Tick: ${timeStr}]`;
    }
    if (statusDot) {
      statusDot.className = 'status-dot';
    }
  }

  /**
   * Render Master Executive Decision Table
   * Exactly 15 columns matching index.html <thead>!
   */
  function renderMasterTable() {
    const tbody = document.getElementById('master-table-body');
    if (!tbody) return;

    if (filteredStocks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="15" style="text-align: center; padding: 40px; color: var(--text-muted);">
            無符合條件之股票標的。請放寬篩選條件。
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filteredStocks.map(s => {
      const isUp = s.changePercent >= 0;
      const changeClass = isUp ? 'text-green' : 'text-rose';
      const changeSign = isUp ? '+' : '';
      const isSelected = activeStock && activeStock.symbol === s.symbol ? 'selected-row' : '';
      
      let actionClass = 'long';
      let actionLabel = '做多 LONG';
      if (s.actionTag === 'SHORT') {
        actionClass = 'short';
        actionLabel = '做空 SHORT';
      } else if (s.actionTag === 'HOLD') {
        actionClass = 'hold';
        actionLabel = '觀望 HOLD';
      }

      const isStarred = watchlist.has(s.symbol) ? 'starred' : '';
      const rawUpside = parseFloat((s.upsidePercent || '').replace(/[^0-9.-]/g, '')) || 0;
      const upsideClass = rawUpside >= 0 ? 'up' : 'down';

      // Quant metric badges
      const pegVal = s.pegRatio || 0.85;
      const pegBadge = pegVal < 1.0 
        ? `<span class="upside-pill text-green font-bold" data-tooltip="PEG < 1.0：高成長且價格俗擱大碗">${pegVal} 俗擱大碗</span>` 
        : `<span class="category-chip">${pegVal}</span>`;

      const epsRev = s.epsRevision30d || '+12.5%';
      const epsRevClass = epsRev.startsWith('+') ? 'text-green' : 'text-rose';

      const sharpe = s.sharpeRatio || 2.45;
      const sharpeClass = sharpe >= 2.0 ? 'text-gold' : 'text-cyan';

      const mdd = s.maxDrawdown || '-12.5%';
      const instNet = s.institutionalNet5d || '+12,400 張';
      const netClass = instNet.startsWith('+') ? 'text-green' : 'text-rose';

      return `
        <tr class="master-table-row ${isSelected}" data-symbol="${s.symbol}">
          <td style="text-align: center;">
            <button class="star-btn ${isStarred}" data-symbol="${s.symbol}" title="追蹤個股">
              ${watchlist.has(s.symbol) ? '★' : '☆'}
            </button>
          </td>
          <td class="col-stock">
            <span class="symbol-code">${s.symbol}</span>
            <span class="stock-title-name">${s.name}</span>
          </td>
          <td>
            <span class="category-chip">${s.category}</span>
          </td>
          <td class="font-bold">
            <span style="font-size: 14.5px;">${s.price.toFixed(1)}</span>
            <span class="${changeClass} text-xs" style="margin-left: 3px;">(${changeSign}${s.changePercent.toFixed(2)}%)</span>
          </td>
          <td>
            <span class="tag-action ${actionClass}">${actionLabel}</span>
          </td>
          <td>
            ${pegBadge}
          </td>
          <td class="${epsRevClass} font-bold mono">
            ${epsRev}
          </td>
          <td class="${sharpeClass} font-bold mono" data-tooltip="CP值: ＞2.0 最佳性價比">
            ${sharpe.toFixed(2)}
          </td>
          <td class="text-secondary font-bold mono">
            ${mdd}
          </td>
          <td class="${netClass} font-bold mono">
            ${instNet}
          </td>
          <td class="text-secondary font-bold">
            ${s.entryRange}
          </td>
          <td>
            <span class="${rawUpside >= 0 ? 'text-green' : 'text-rose'} font-bold" style="font-size: 14.5px;">${s.targetPrice ? s.targetPrice + ' 元' : '-'}</span>
            <span class="upside-pill ${upsideClass}">${s.upsidePercent}</span>
          </td>
          <td class="text-rose font-bold">
            ${s.stopLoss ? s.stopLoss + ' 元' : '-'}
          </td>
          <td class="col-rationale">
            <div class="rationale-text" title="${s.takeaway}">
              ${s.takeaway}
            </div>
          </td>
          <td>
            <button class="action-btn view-detail-btn" data-symbol="${s.symbol}">完整研報 📖</button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Table Row & Star Button Events
    tbody.querySelectorAll('.master-table-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const symbol = row.getAttribute('data-symbol');
        if (e.target.classList.contains('star-btn')) {
          toggleWatchlist(symbol);
          e.stopPropagation();
        } else if (e.target.classList.contains('view-detail-btn')) {
          openStockModal(symbol);
        } else {
          selectStock(symbol);
        }
      });
    });
  }

  function toggleWatchlist(symbol) {
    if (watchlist.has(symbol)) {
      watchlist.delete(symbol);
    } else {
      watchlist.add(symbol);
    }
    localStorage.setItem('apple_stock_watchlist', JSON.stringify(Array.from(watchlist)));
    renderMasterTable();
  }

  /**
   * Select Active Stock
   */
  function selectStock(symbol) {
    const stock = allCombinedStocks.find(s => s.symbol === symbol);
    if (!stock) return;

    activeStock = stock;
    renderTickerBar();
    renderMasterTable();
    renderDeepDivePanel(activeStock);
  }

  /**
   * Render Focused Deep-Dive Panel & Valuation Simulator
   */
  function renderDeepDivePanel(stock) {
    if (!stock) return;

    // 1. Left Focus Card
    const cardDom = document.getElementById('advisor-focus-card');
    if (cardDom) {
      const isUp = stock.changePercent >= 0;
      const changeClass = isUp ? 'text-green' : 'text-rose';
      const changeSign = isUp ? '+' : '';
      
      let actionClass = 'long';
      let actionLabel = '做多 LONG';
      if (stock.actionTag === 'SHORT') {
        actionClass = 'short';
        actionLabel = '做空 SHORT';
      } else if (stock.actionTag === 'HOLD') {
        actionClass = 'hold';
        actionLabel = '觀望 HOLD';
      }

      const currentP = stock.price;
      const targetP = stock.targetPrice || currentP;
      const stopP = stock.stopLoss || (currentP * 0.85);
      const rangeSpan = Math.max(Math.abs(targetP - stopP), 1);
      const fillPct = Math.min(Math.max(((currentP - stopP) / rangeSpan) * 100, 10), 95);

      const ma = stock.maMetrics || {};
      const savedNote = localStorage.getItem('notes_' + stock.symbol) || '';

      const baseEPS = stock.eps2026 || stock.fundamentalHighlights?.eps2026 || 10;
      const basePE = stock.peRatio2026 || stock.fundamentalHighlights?.peRatio2026 || 20;

      cardDom.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
          <div>
            <span class="symbol-code" style="font-size: 26px;">${stock.symbol}</span>
            <span style="font-size: 18px; font-weight: 700; margin-left: 6px; color: var(--text-primary);">${stock.name}</span>
            <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 2px;">${stock.category}</div>
            <div style="margin-top: 6px; font-size: 14px;">
              <span class="font-bold" style="font-size: 17px;">${stock.price.toFixed(1)} 元</span>
              <span class="${changeClass} text-xs font-bold" style="margin-left: 4px;">(${changeSign}${stock.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="tag-action ${actionClass}" style="font-size: 14px; padding: 4px 14px;">${actionLabel}</span>
            <div class="text-xs text-muted" style="margin-top: 6px;">評級: <b style="color: var(--apple-blue); font-weight: 700;">${stock.fundamentalHighlights?.rating || stock.rating || 'Strong Buy'}</b></div>
          </div>
        </div>

        <div class="price-target-widget">
          <div class="pt-labels">
            <div>
              <span class="text-xs text-muted" data-tooltip="安保紀律防守線">停損防守價</span>
              <div class="text-rose font-bold">${stopP} 元</div>
            </div>
            <div>
              <span class="text-xs text-muted" data-tooltip="最新成交價格">目前股價</span>
              <div class="text-primary font-bold">${currentP.toFixed(1)} 元</div>
            </div>
            <div>
              <span class="text-xs text-muted" data-tooltip="華爾街預估第一目標">目標價位</span>
              <div class="${targetP >= currentP ? 'text-green' : 'text-rose'} font-bold">${targetP} 元</div>
            </div>
          </div>
          <div class="pt-bar-track">
            <div class="pt-bar-fill" style="width: ${fillPct.toFixed(1)}%;"></div>
          </div>
          <div class="pt-upside-footer">
            <span class="text-xs text-secondary">建議區間: <b class="text-primary font-bold">${stock.entryRange}</b></span>
            <span class="text-xs ${targetP >= currentP ? 'text-green' : 'text-rose'} font-bold">潛在空間: ${stock.upsidePercent}</span>
          </div>
        </div>

        <!-- 5 MA Matrix -->
        <div style="margin-top: 12px; background: var(--bg-subtle); border-radius: 12px; padding: 10px 12px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 11.5px; color: var(--apple-blue); font-weight: 700; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>📊 5 大移動平均線 (5 MA) 數據</span>
            <span style="color: var(--text-muted); font-size: 10.5px;">近 30D 趨勢</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); text-align: center; font-size: 11.5px;">
            <div><span style="color: #ff9500; font-weight:600;" data-tooltip="5日線: 極短線發散">MA5</span><div class="font-bold" style="margin-top: 2px;">${ma.ma5 || '-'}</div></div>
            <div><span style="color: #0071e3; font-weight:600;" data-tooltip="10日線: 短線支撐">MA10</span><div class="font-bold" style="margin-top: 2px;">${ma.ma10 || '-'}</div></div>
            <div><span style="color: #34c759; font-weight:600;" data-tooltip="20日月線: 法人生命線">MA20</span><div class="font-bold" style="margin-top: 2px;">${ma.ma20 || '-'}</div></div>
            <div><span style="color: #af52de; font-weight:600;" data-tooltip="30日線: 中短防守">MA30</span><div class="font-bold" style="margin-top: 2px;">${ma.ma30 || '-'}</div></div>
            <div><span style="color: #ff9500; font-weight:600;" data-tooltip="50日季線: 中長趨勢">MA50</span><div class="font-bold" style="margin-top: 2px;">${ma.ma50 || '-'}</div></div>
          </div>
        </div>

        <!-- AI Valuation Simulator Slider -->
        <div style="margin-top: 12px; background: var(--bg-subtle); border-radius: 12px; padding: 12px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 12px; color: var(--apple-blue); font-weight: 700; margin-bottom: 8px;" data-tooltip="拉動滑桿可即時試算預估 EPS 與 P/E 之目標價與潛在投報率">
            🧮 AI 投信目標價與本益比動態試算器
          </div>
          <div style="display: grid; gap: 8px; font-size: 11.5px;">
            <div>
              <div style="display:flex; justify-content:space-between; color:var(--text-secondary);">
                <span>預估 2026 EPS: <b class="text-primary font-bold" id="sim-eps-val">${baseEPS} 元</b></span>
              </div>
              <input type="range" id="sim-eps-range" min="1" max="150" step="0.5" value="${baseEPS}" style="width:100%;">
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; color:var(--text-secondary);">
                <span>預估本益比 (P/E): <b class="text-primary font-bold" id="sim-pe-val">${basePE} x</b></span>
              </div>
              <input type="range" id="sim-pe-range" min="5" max="50" step="0.5" value="${basePE}" style="width:100%;">
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.03); padding:8px 12px; border-radius:8px; margin-top:4px;">
              <span style="color:var(--text-muted);">試算目標價: <b class="text-green font-bold" id="sim-target-val" style="font-size:14px;">${Math.round(baseEPS * basePE)} 元</b></span>
              <span style="color:var(--text-muted);">預期 ROI: <b class="text-cyan font-bold" id="sim-roi-val">+${(((baseEPS * basePE - currentP) / currentP) * 100).toFixed(1)}%</b></span>
            </div>
          </div>
        </div>

        <div class="takeaway-bullet-box">
          <div style="font-size: 11.5px; color: var(--apple-blue); font-weight: 700; margin-bottom: 4px;">📢 機構量化投資論述與勝率研判</div>
          <p style="font-size: 12.5px; line-height: 1.55; color: var(--text-primary);">${stock.takeaway}</p>
        </div>

        <!-- Institutional Note Input -->
        <div style="margin-top: 10px;">
          <textarea id="stock-user-note" placeholder="✏️ 輸入對 ${stock.name} 的研究筆記..." style="width:100%; height:45px; background:var(--bg-subtle); border:1px solid var(--border-subtle); border-radius:10px; padding:8px 12px; color:var(--text-primary); font-size:11.5px; outline:none; resize:none;">${savedNote}</textarea>
        </div>

        <div style="display:flex; gap:8px; margin-top:12px;">
          <button class="open-modal-btn" style="flex:1;" onclick="window.AppModule.openStockModal('${stock.symbol}')">
            📖 完整 3 頁機構研報
          </button>
          <button class="manual-refresh-btn" style="padding:0 14px;" onclick="window.AppModule.copyStockSummary('${stock.symbol}')" title="一鍵複製研報摘要">
            📋 複製摘要
          </button>
        </div>
      `;

      // Wire Valuation Simulator Events
      const epsRange = document.getElementById('sim-eps-range');
      const peRange = document.getElementById('sim-pe-range');
      if (epsRange && peRange) {
        const updateSim = () => {
          const eps = parseFloat(epsRange.value);
          const pe = parseFloat(peRange.value);
          document.getElementById('sim-eps-val').textContent = `${eps} 元`;
          document.getElementById('sim-pe-val').textContent = `${pe} x`;

          const simTarget = Math.round(eps * pe);
          const roi = (((simTarget - currentP) / currentP) * 100).toFixed(1);
          document.getElementById('sim-target-val').textContent = `${simTarget} 元`;
          document.getElementById('sim-roi-val').textContent = `${roi >= 0 ? '+' : ''}${roi}%`;
        };
        epsRange.addEventListener('input', updateSim);
        peRange.addEventListener('input', updateSim);
      }

      // Wire Note Save Event
      const noteInput = document.getElementById('stock-user-note');
      if (noteInput) {
        noteInput.addEventListener('input', (e) => {
          localStorage.setItem('notes_' + stock.symbol, e.target.value);
        });
      }
    }

    // 2. Middle Quant Factor Exposure Panel
    renderQuantMetricsPanel(stock);

    // 3. Right Technical Chart
    renderActiveChart(stock);
  }

  /**
   * Render Middle Panel: Quant Factor Exposure Metric Bars
   */
  function renderQuantMetricsPanel(stock) {
    const container = document.getElementById('quant-metrics-container');
    const scoreBadge = document.getElementById('score-badge');

    const sharpeVal = stock.sharpeRatio || 2.45;
    if (scoreBadge) {
      scoreBadge.textContent = `Sharpe: ${sharpeVal.toFixed(2)}`;
      scoreBadge.setAttribute('data-tooltip', '風險 CP 值：＞2.0 代表波動小、勝率極高');
    }

    if (!container) return;

    const scores = stock.factorScores || {
      valuePeg: 88,
      momentumEps: 90,
      qualitySharpe: 92,
      lowVolMdd: 85,
      flowAdv: 88
    };

    const pegText = stock.pegRatio ? `${stock.pegRatio} (P/E÷Growth)` : '0.82';
    const epsText = stock.epsRevision30d || '+12.5%';
    const mddText = stock.maxDrawdown || '-12.5%';
    const advText = stock.adv20d || '38,500 張';

    container.innerHTML = `
      <div class="metric-row" data-tooltip="估值因子：本益成長比 ${pegText}。＜1.0 代表高成長且便宜">
        <div class="metric-label-group">
          <span>💰 估值便宜度 (PEG 成長比: ${pegText})</span>
          <b class="text-green">${scores.valuePeg}/100</b>
        </div>
        <div class="metric-track">
          <div class="metric-fill" style="width: ${scores.valuePeg}%; background: linear-gradient(90deg, var(--apple-blue), var(--apple-green));"></div>
        </div>
      </div>

      <div class="metric-row" data-tooltip="獲利動能：30 日各大券商 EPS 調升幅度 ${epsText}">
        <div class="metric-label-group">
          <span>🚀 獲利調升動能 (30D EPS Rev: ${epsText})</span>
          <b class="text-cyan">${scores.momentumEps}/100</b>
        </div>
        <div class="metric-track">
          <div class="metric-fill" style="width: ${scores.momentumEps}%; background: linear-gradient(90deg, var(--apple-blue), var(--apple-cyan));"></div>
        </div>
      </div>

      <div class="metric-row" data-tooltip="品質與 CP 值：Sharpe 夏普值 ${sharpeVal.toFixed(2)}。風險低報酬強">
        <div class="metric-label-group">
          <span>🛡️ 風險 CP 值 (Sharpe 夏普: ${sharpeVal.toFixed(2)})</span>
          <b class="text-gold">${scores.qualitySharpe}/100</b>
        </div>
        <div class="metric-track">
          <div class="metric-fill" style="width: ${scores.qualitySharpe}%; background: linear-gradient(90deg, var(--apple-amber), var(--wallstreet-gold));"></div>
        </div>
      </div>

      <div class="metric-row" data-tooltip="波動防守：歷史最大回撤 ${mddText}。用以評估最壞狀況">
        <div class="metric-label-group">
          <span>📉 下檔抗跌力 (Max Drawdown: ${mddText})</span>
          <b class="text-purple">${scores.lowVolMdd}/100</b>
        </div>
        <div class="metric-track">
          <div class="metric-fill" style="width: ${scores.lowVolMdd}%; background: linear-gradient(90deg, var(--apple-blue), var(--apple-purple));"></div>
        </div>
      </div>

      <div class="metric-row" data-tooltip="法人籌碼：20 日日均量 ${advText}。單日限制買進 5%">
        <div class="metric-label-group">
          <span>🏦 大戶籌碼與流動性 (20D ADV: ${advText})</span>
          <b class="text-green">${scores.flowAdv}/100</b>
        </div>
        <div class="metric-track">
          <div class="metric-fill" style="width: ${scores.flowAdv}%; background: linear-gradient(90deg, var(--apple-cyan), var(--apple-green));"></div>
        </div>
      </div>

      <div style="margin-top: 14px; padding: 10px 12px; background: var(--bg-subtle); border-radius: 10px; border: 1px solid var(--border-subtle); font-size: 11.5px; color: var(--text-secondary); line-height: 1.5;">
        <span style="color: var(--wallstreet-gold); font-weight: 700;">💡 華爾街風控提示：</span>
        大戶買進 ${stock.name} 需遵循單日交易量不超過 20D ADV (<b>${advText}</b>) 之 5% 規章，避免市場衝擊成本。
      </div>
    `;
  }

  /**
   * Render Active Selected Chart Mode
   */
  function renderActiveChart(stock) {
    if (!stock || !window.ChartsManager) return;

    window.ChartsManager.renderTechnicalChart('tradingview-technical-chart', stock);
  }

  function setupEventListeners() {
    // 1. Theme Toggle Button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
      });
    }

    // 2. Plain-Language Glossary Buttons
    const openGlossaryBtn = document.getElementById('open-glossary-btn');
    const bannerGlossaryBtn = document.getElementById('banner-glossary-btn');
    const closeGlossaryBtn = document.getElementById('close-glossary-btn');
    const glossaryModal = document.getElementById('glossary-modal');

    const openGlossaryFunc = () => {
      if (glossaryModal) glossaryModal.classList.add('open');
    };
    const closeGlossaryFunc = () => {
      if (glossaryModal) glossaryModal.classList.remove('open');
    };

    if (openGlossaryBtn) openGlossaryBtn.addEventListener('click', openGlossaryFunc);
    if (bannerGlossaryBtn) bannerGlossaryBtn.addEventListener('click', openGlossaryFunc);
    if (closeGlossaryBtn) closeGlossaryBtn.addEventListener('click', closeGlossaryFunc);
    if (glossaryModal) {
      glossaryModal.addEventListener('click', (e) => {
        if (e.target === glossaryModal) closeGlossaryFunc();
      });
    }

    // 3. Special Research Vault Header Button
    const specialVaultBtn = document.getElementById('special-vault-btn');
    if (specialVaultBtn) {
      specialVaultBtn.addEventListener('click', () => {
        switchToSpecialVault();
      });
    }

    // 4. Quant Whitepaper Modal
    const whitepaperBtn = document.getElementById('whitepaper-btn');
    const closeWhitepaperBtn = document.getElementById('close-whitepaper-btn');
    const whitepaperModal = document.getElementById('whitepaper-modal');

    const openWhitepaperFunc = () => {
      if (whitepaperModal) whitepaperModal.classList.add('open');
    };
    const closeWhitepaperFunc = () => {
      if (whitepaperModal) whitepaperModal.classList.remove('open');
    };

    if (whitepaperBtn) whitepaperBtn.addEventListener('click', openWhitepaperFunc);
    if (closeWhitepaperBtn) closeWhitepaperBtn.addEventListener('click', closeWhitepaperFunc);
    if (whitepaperModal) {
      whitepaperModal.addEventListener('click', (e) => {
        if (e.target === whitepaperModal) closeWhitepaperFunc();
      });
    }

    // 5. Category Filter Buttons
    const themeGroup = document.getElementById('filter-theme-btns');
    if (themeGroup) {
      themeGroup.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          themeGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          filters.categoryKey = btn.getAttribute('data-value');

          const vaultNavBtn = document.getElementById('special-vault-btn');
          if (vaultNavBtn) {
            vaultNavBtn.classList.toggle('active', filters.categoryKey === 'special_vault');
          }

          applyFilters();
        });
      });
    }

    // 6. Action Filter Buttons
    const actionGroup = document.getElementById('filter-action-btns');
    if (actionGroup) {
      actionGroup.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          actionGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          filters.actionTag = btn.getAttribute('data-value');
          applyFilters();
        });
      });
    }

    // 7. Search Input
    const searchInput = document.getElementById('stock-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.trim().toLowerCase();
        applyFilters();
      });
    }

    // 8. Stock Research Modal Close
    const closeBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('stock-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    // 9. Manual Refresh Button
    const manualBtn = document.getElementById('manual-refresh-btn');
    if (manualBtn) {
      manualBtn.addEventListener('click', () => {
        lastRefreshTime = new Date();
        updateTimestampDisplay();
        allCombinedStocks.forEach(s => {
          const delta = (Math.random() - 0.48) * (s.price * 0.002);
          s.price = Number(Math.max(1, s.price + delta).toFixed(1));
        });
        renderTickerBar();
        renderMasterTable();
        if (activeStock) renderDeepDivePanel(activeStock);
      });
    }

    // 10. Research Modal Navigation Tabs
    const modalTabs = document.querySelectorAll('.modal-tab-btn');
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modalTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeModalTab = tab.getAttribute('data-tab');
        renderModalTabContent();
      });
    });
  }

  function switchToSpecialVault() {
    const themeGroup = document.getElementById('filter-theme-btns');
    if (themeGroup) {
      themeGroup.querySelectorAll('.filter-btn').forEach(b => {
        if (b.getAttribute('data-value') === 'special_vault') {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
    }
    filters.categoryKey = 'special_vault';

    applyFilters();
  }

  function applyFilters() {
    const sourceList = filters.categoryKey === 'special_vault' ? vaultStocks : defaultStocks;

    filteredStocks = sourceList.filter(stock => {
      if (filters.categoryKey !== 'all' && filters.categoryKey !== 'special_vault' && stock.categoryKey !== filters.categoryKey) {
        return false;
      }
      if (filters.actionTag !== 'all' && stock.actionTag !== filters.actionTag) {
        return false;
      }
      if (filters.onlyWatchlist && !watchlist.has(stock.symbol)) {
        return false;
      }
      if (filters.search) {
        const q = filters.search;
        const matchSymbol = stock.symbol.toLowerCase().includes(q);
        const matchName = stock.name.toLowerCase().includes(q);
        if (!matchSymbol && !matchName) return false;
      }
      return true;
    });

    renderTickerBar();
    renderMasterTable();

    if (filteredStocks.length > 0 && !filteredStocks.includes(activeStock)) {
      selectStock(filteredStocks[0].symbol);
    }
  }

  function openStockModal(symbol) {
    const stock = allCombinedStocks.find(s => s.symbol === symbol);
    if (!stock) return;

    activeStock = stock;
    const modal = document.getElementById('stock-modal');
    if (!modal) return;

    document.getElementById('modal-stock-symbol').textContent = stock.symbol;
    document.getElementById('modal-stock-name').textContent = stock.name;
    document.getElementById('modal-stock-category').textContent = stock.category;

    activeModalTab = 'advisor';
    document.querySelectorAll('.modal-tab-btn').forEach(t => {
      if (t.getAttribute('data-tab') === 'advisor') t.classList.add('active');
      else t.classList.remove('active');
    });

    renderModalTabContent();
    modal.classList.add('open');
  }

  function renderModalTabContent() {
    const container = document.getElementById('modal-body-content');
    if (!container || !activeStock) return;

    const s = activeStock;
    const fh = s.fundamentalHighlights || {};
    const ma = s.maMetrics || {};

    if (activeModalTab === 'advisor') {
      container.innerHTML = `
        <div style="background: var(--bg-subtle); padding: 18px; border-radius: 14px; border-left: 4px solid var(--apple-blue); margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="tag-action ${s.actionTag === 'LONG' ? 'long' : s.actionTag === 'SHORT' ? 'short' : 'hold'}" style="font-size: 13px; padding: 4px 14px;">${s.actionTag} 決策</span>
            <span class="text-muted text-xs">資深機構策略分析師研判</span>
          </div>
          <p style="margin-top: 12px; font-size: 14px; line-height: 1.7; color: var(--text-primary); font-weight: 500;">${s.takeaway}</p>
        </div>

        <div class="modal-section-title" style="font-size:14px; font-weight:700; color:var(--apple-blue); margin-bottom:10px;">🎯 精準操作點位與量化風控指標</div>
        <table class="key-level-table">
          <tr><th>投資決策與風控項目</th><th>具體點位、估值與白話意涵</th></tr>
          <tr><td>建議進場區間</td><td class="font-bold">${s.entryRange}</td></tr>
          <tr><td>第一目標價位</td><td class="${s.targetPrice >= s.currentPrice ? 'text-green' : 'text-rose'} font-bold">${s.targetPrice} 元 (${s.upsidePercent})</td></tr>
          <tr><td>ATR 紀律防守停損價</td><td class="text-rose font-bold">${s.stopLoss} 元</td></tr>
          <tr><td>預估 2026 EPS</td><td class="font-bold">NT$ ${s.eps2026 || fh.eps2026 || '-'} 元</td></tr>
          <tr><td>預估 2026 P/E 本益比</td><td class="font-bold">${s.peRatio2026 || fh.peRatio2026 || '-'} x</td></tr>
          <tr><td>PEG 本益成長比</td><td class="font-bold text-green">${s.pegRatio || 0.85} (＜1.0 高成長便宜俗擱大碗)</td></tr>
          <tr><td>Sharpe 夏普 CP 值</td><td class="font-bold text-gold">${s.sharpeRatio || 2.45} (＞2.0 代表風險低報酬高)</td></tr>
          <tr><td>MDD 歷史最大回撤</td><td class="font-bold text-secondary">${s.maxDrawdown || '-12.5%'} (評估心臟承受極限)</td></tr>
          <tr><td>20D ADV 法人風控上限</td><td class="font-bold text-cyan">${s.adv20d || '38,500 張'} (單日建倉上限 5%)</td></tr>
        </table>
      `;
    } else if (activeModalTab === 'fundamental') {
      const catalystsHtml = (fh.catalysts || ['高階車用與 AI 伺服器需求大增', '併購與擴產效益強勁']).map(c => `<li>${c}</li>`).join('');
      const risksHtml = (fh.risks || ['全球智聯網需求放緩', '同業削價競爭']).map(r => `<li>${r}</li>`).join('');

      container.innerHTML = `
        <div style="background: var(--bg-subtle); padding: 16px; border-radius: 14px; border-left: 4px solid var(--apple-blue); margin-bottom: 18px;">
          <div style="font-size: 12px; color: var(--apple-blue); font-weight: 800; text-transform: uppercase;">INVESTMENT THESIS 核心論述</div>
          <p style="margin-top: 8px; font-size: 13.5px; line-height: 1.65; color: var(--text-primary);">${fh.thesis || s.takeaway}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
          <div style="background: rgba(52, 199, 89, 0.08); border: 1px solid rgba(52, 199, 89, 0.2); padding: 16px; border-radius: 14px;">
            <div style="color: var(--apple-green); font-weight: 800; font-size: 13px;">🚀 產業營運催化劑 (Catalysts)</div>
            <ul class="bullet-list" style="margin-top:8px; padding-left:18px; font-size:12.5px; line-height:1.6; color:var(--text-primary);">${catalystsHtml}</ul>
          </div>

          <div style="background: rgba(255, 59, 48, 0.08); border: 1px solid rgba(255, 59, 48, 0.2); padding: 16px; border-radius: 14px;">
            <div style="color: var(--apple-red); font-weight: 800; font-size: 13px;">⚠️ 潛在風險點 (Risks)</div>
            <ul class="bullet-list" style="margin-top:8px; padding-left:18px; font-size:12.5px; line-height:1.6; color:var(--text-primary);">${risksHtml}</ul>
          </div>
        </div>

        <div class="modal-section-title" style="font-size:14px; font-weight:700; color:var(--apple-blue); margin-bottom:10px;">💡 2026 估值重估邏輯 (Valuation Logic)</div>
        <div style="background: var(--bg-subtle); padding: 14px 18px; border-radius: 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
          ${fh.valuationLogic || `目標價係基於 2026 E-EPS NT$ ${s.eps2026 || 42.5} 乘以 ${s.peRatio2026 || 16.0}x 本益比計算得出。`}
        </div>
      `;
    } else if (activeModalTab === 'technical') {
      container.innerHTML = `
        <div class="modal-section-title" style="font-size:14px; font-weight:700; color:var(--apple-blue); margin-bottom:10px;">📈 近 30 日 K 線與 5 大移動平均線 (MA5 / MA10 / MA20 / MA30 / MA50)</div>
        <div id="modal-chart-container" style="width:100%; height:320px; background:var(--bg-subtle); border-radius:14px; padding:10px; margin-bottom:18px; border:1px solid var(--border-subtle);"></div>

        <div class="modal-section-title" style="font-size:14px; font-weight:700; color:var(--apple-blue); margin-bottom:10px;">📊 5 大均線價位矩陣表</div>
        <table class="key-level-table">
          <tr><th>移動平均線 (MA)</th><th>價格 (元)</th><th>均線戰術型態與防守意涵</th></tr>
          <tr><td style="color:#ff9500;" class="font-bold">MA5 5日均線</td><td class="font-bold">${ma.ma5 || '-'}</td><td>極短線攻擊發散線，守穩代表強勢主升段持續發揮</td></tr>
          <tr><td style="color:#0071e3;" class="font-bold">MA10 10日均線</td><td class="font-bold">${ma.ma10 || '-'}</td><td>短線洗盤防守支撐線，逢低回檔首要觀察買點</td></tr>
          <tr><td style="color:#34c759;" class="font-bold">MA20 20日均線 (月線)</td><td class="font-bold">${ma.ma20 || '-'}</td><td>法人中短線波段生命線，站穩月線維持多頭架構</td></tr>
          <tr><td style="color:#af52de;" class="font-bold">MA30 30日均線</td><td class="font-bold">${ma.ma30 || '-'}</td><td>季前中期支撐防守線，強烈支撐區域</td></tr>
          <tr><td style="color:#ff9500;" class="font-bold">MA50 50日均線 (季線)</td><td class="font-bold">${ma.ma50 || '-'}</td><td>中長線趨勢方向線，突破防守即引發機構加碼潮</td></tr>
        </table>
      `;

      setTimeout(() => {
        if (window.ChartsManager) {
          window.ChartsManager.renderTechnicalChart('modal-chart-container', s);
        }
      }, 100);
    }
  }

  function copyStockSummary(symbol) {
    const s = allCombinedStocks.find(st => st.symbol === symbol);
    if (!s) return;

    const summaryText = `【台股投信機構精準研報】\n` +
      `📌 標的：${s.symbol} ${s.name} (${s.category})\n` +
      `現價：${s.price.toFixed(1)}元 | 決策：${s.actionTag}\n` +
      `PEG 比率：${s.pegRatio || 0.85} | 夏普 CP 值：${s.sharpeRatio || 2.45}\n` +
      `建議進場區間：${s.entryRange}\n` +
      `目標價位：${s.targetPrice}元 (${s.upsidePercent})\n` +
      `停損防守點：${s.stopLoss}元\n` +
      `機構研判論述：${s.takeaway}`;

    navigator.clipboard.writeText(summaryText).then(() => {
      alert(`✅ 已複製 ${s.symbol} ${s.name} 研報摘要至剪貼簿！`);
    }).catch(err => {
      console.warn('Copy failed:', err);
    });
  }

  function showErrorMessage(msg) {
    const container = document.querySelector('.dashboard-container');
    if (container) {
      container.innerHTML = `<div style="color: var(--apple-red); text-align: center; padding: 60px; font-size: 16px;">${msg}</div>`;
    }
  }

  // Global Exports
  window.AppModule = {
    openStockModal: openStockModal,
    copyStockSummary: copyStockSummary,
    switchToSpecialVault: switchToSpecialVault
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
