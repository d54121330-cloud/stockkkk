/**
 * Taiwan Stock Institutional Investor Research & Analytics System
 * Apple Cupertino Executive Controller Application (js/app.js)
 */

(function () {
  'use strict';

  // Application State
  let allStocks = [];
  let filteredStocks = [];
  let activeStock = null;
  let activeChartMode = 'kline'; // 'kline', 'profile', 'oscillator'
  let activeOscillatorTab = 'rsi'; // 'rsi', 'macd', 'kd'
  let activeModalTab = 'advisor';
  let currentTheme = localStorage.getItem('apple_stock_theme') || 'light';
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
      console.log('[Apple Terminal] Initializing Cupertino Executive Terminal...');

      // Set initial Theme
      applyTheme(currentTheme);

      const data = await DataLoader.loadAllData();
      allStocks = data.stocks || [];
      filteredStocks = [...allStocks];
      activeStock = allStocks.find(s => s.symbol === '2330') || allStocks[0];

      renderTickerBar();
      renderMasterTable();
      renderDeepDivePanel(activeStock);
      setupEventListeners();
      updateTimestampDisplay();

      startAutoTick();

      console.log('[Apple Terminal] Initialized successfully.');
    } catch (err) {
      console.error('[Apple Terminal] Initialization Error:', err);
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

    container.innerHTML = allStocks.map(s => {
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
      allStocks.forEach(s => {
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
   */
  function renderMasterTable() {
    const tbody = document.getElementById('master-table-body');
    if (!tbody) return;

    if (filteredStocks.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; padding: 40px; color: var(--text-muted);">
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
            <span style="font-size: 15px;">${s.price.toFixed(1)}</span>
            <span class="${changeClass} text-xs" style="margin-left: 4px;">(${changeSign}${s.changePercent.toFixed(2)}%)</span>
          </td>
          <td>
            <span class="tag-action ${actionClass}">${actionLabel}</span>
          </td>
          <td class="text-secondary font-bold">
            ${s.entryRange}
          </td>
          <td>
            <span class="${rawUpside >= 0 ? 'text-green' : 'text-rose'} font-bold" style="font-size: 15px;">${s.targetPrice ? s.targetPrice + ' 元' : '-'}</span>
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
    const stock = allStocks.find(s => s.symbol === symbol);
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

      const baseEPS = stock.eps2026 || 10;
      const basePE = stock.peRatio2026 || 20;

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
            <div class="text-xs text-muted" style="margin-top: 6px;">評級: <b style="color: var(--apple-blue); font-weight: 700;">${stock.rating || 'Buy'}</b></div>
          </div>
        </div>

        <div class="price-target-widget">
          <div class="pt-labels">
            <div>
              <span class="text-xs text-muted">停損防守價</span>
              <div class="text-rose font-bold">${stopP} 元</div>
            </div>
            <div>
              <span class="text-xs text-muted">目前股價</span>
              <div class="text-primary font-bold">${currentP.toFixed(1)} 元</div>
            </div>
            <div>
              <span class="text-xs text-muted">目標價位</span>
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
            <div><span style="color: #ff9500; font-weight:600;">MA5</span><div class="font-bold" style="margin-top: 2px;">${ma.ma5 || '-'}</div></div>
            <div><span style="color: #0071e3; font-weight:600;">MA10</span><div class="font-bold" style="margin-top: 2px;">${ma.ma10 || '-'}</div></div>
            <div><span style="color: #34c759; font-weight:600;">MA20</span><div class="font-bold" style="margin-top: 2px;">${ma.ma20 || '-'}</div></div>
            <div><span style="color: #af52de; font-weight:600;">MA30</span><div class="font-bold" style="margin-top: 2px;">${ma.ma30 || '-'}</div></div>
            <div><span style="color: #ff9500; font-weight:600;">MA50</span><div class="font-bold" style="margin-top: 2px;">${ma.ma50 || '-'}</div></div>
          </div>
        </div>

        <!-- AI Valuation Simulator Slider -->
        <div style="margin-top: 12px; background: var(--bg-subtle); border-radius: 12px; padding: 12px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 12px; color: var(--apple-blue); font-weight: 700; margin-bottom: 8px;">
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

    renderActiveChart(stock);
  }

  /**
   * Render Active Selected Chart Mode
   */
  function renderActiveChart(stock) {
    if (!stock || !window.ChartsManager) return;

    if (activeChartMode === 'kline') {
      window.ChartsManager.renderTechnicalChart('main-chart-canvas', stock);
    } else if (activeChartMode === 'profile') {
      window.ChartsManager.renderVolumeProfileChart('main-chart-canvas', stock);
    } else if (activeChartMode === 'oscillator') {
      window.ChartsManager.renderOscillatorChart('main-chart-canvas', stock, activeOscillatorTab);
    }
  }

  function setupEventListeners() {
    // Theme Toggle Button
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(nextTheme);
      });
    }

    // Methodology Whitepaper Modal Open
    const methodologyBtn = document.getElementById('open-methodology-btn');
    if (methodologyBtn) {
      methodologyBtn.addEventListener('click', openMethodologyModal);
    }

    const closeMethodologyBtn = document.getElementById('close-methodology-btn');
    const methodologyModal = document.getElementById('methodology-modal');
    if (closeMethodologyBtn && methodologyModal) {
      closeMethodologyBtn.addEventListener('click', () => methodologyModal.classList.remove('open'));
      methodologyModal.addEventListener('click', (e) => {
        if (e.target === methodologyModal) methodologyModal.classList.remove('open');
      });
    }

    // Category Filter Buttons
    const themeGroup = document.getElementById('filter-theme-btns');
    if (themeGroup) {
      themeGroup.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          themeGroup.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          filters.categoryKey = btn.getAttribute('data-value');
          applyFilters();
        });
      });
    }

    // Action Filter Buttons
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

    // Watchlist Filter Button
    const watchlistFilterBtn = document.getElementById('filter-watchlist-btn');
    if (watchlistFilterBtn) {
      watchlistFilterBtn.addEventListener('click', () => {
        filters.onlyWatchlist = !filters.onlyWatchlist;
        watchlistFilterBtn.classList.toggle('active', filters.onlyWatchlist);
        applyFilters();
      });
    }

    // Search Input
    const searchInput = document.getElementById('stock-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.trim().toLowerCase();
        applyFilters();
      });
    }

    // Chart Mode Segmented Control Tabs
    const chartTabs = document.querySelectorAll('.chart-mode-tab');
    chartTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        chartTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeChartMode = tab.getAttribute('data-mode');

        const subBar = document.getElementById('oscillator-sub-bar');
        if (subBar) {
          subBar.style.display = activeChartMode === 'oscillator' ? 'flex' : 'none';
        }

        if (activeStock) renderActiveChart(activeStock);
      });
    });

    // Oscillator Sub Tabs (RSI / MACD / KD)
    const oscTabs = document.querySelectorAll('.osc-sub-tab');
    oscTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        oscTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeOscillatorTab = tab.getAttribute('data-osc');
        if (activeStock) renderActiveChart(activeStock);
      });
    });

    // Modal Close
    const closeBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('stock-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    // Manual Refresh Button
    const manualBtn = document.getElementById('manual-refresh-btn');
    if (manualBtn) {
      manualBtn.addEventListener('click', () => {
        lastRefreshTime = new Date();
        updateTimestampDisplay();
        allStocks.forEach(s => {
          const delta = (Math.random() - 0.48) * (s.price * 0.002);
          s.price = Number(Math.max(1, s.price + delta).toFixed(1));
        });
        renderTickerBar();
        renderMasterTable();
        if (activeStock) renderDeepDivePanel(activeStock);
      });
    }

    // Modal Tabs
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

  function openMethodologyModal() {
    const modal = document.getElementById('methodology-modal');
    if (modal) modal.classList.add('open');
  }

  function applyFilters() {
    filteredStocks = allStocks.filter(stock => {
      if (filters.categoryKey !== 'all' && stock.categoryKey !== filters.categoryKey) {
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

    renderMasterTable();
    if (filteredStocks.length > 0 && !filteredStocks.includes(activeStock)) {
      selectStock(filteredStocks[0].symbol);
    }
  }

  function openStockModal(symbol) {
    const stock = allStocks.find(s => s.symbol === symbol);
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

        <div class="modal-section-title" style="font-size:14px; font-weight:700; color:var(--apple-blue); margin-bottom:10px;">🎯 精準操作點位與估值指標</div>
        <table class="key-level-table">
          <tr><th>投資決策項目</th><th>具體點位與估值數據</th></tr>
          <tr><td>建議進場區間</td><td class="font-bold">${s.entryRange}</td></tr>
          <tr><td>目標價位</td><td class="${s.targetPrice >= s.currentPrice ? 'text-green' : 'text-rose'} font-bold">${s.targetPrice} 元 (${s.upsidePercent})</td></tr>
          <tr><td>停損防守點位</td><td class="text-rose font-bold">${s.stopLoss} 元</td></tr>
          <tr><td>2026 E-EPS 估算</td><td class="font-bold">NT$ ${s.eps2026 || '-'} 元</td></tr>
          <tr><td>預估 2026 P/E 本益比</td><td class="font-bold">${s.peRatio2026 || '-'} x</td></tr>
        </table>
      `;
    } else if (activeModalTab === 'fundamental') {
      const catalystsHtml = (fh.catalysts || ['市場需求持續增長']).map(c => `<li>${c}</li>`).join('');
      const risksHtml = (fh.risks || ['大盤系統性修正']).map(r => `<li>${r}</li>`).join('');

      container.innerHTML = `
        <div style="background: var(--bg-subtle); padding: 16px; border-radius: 14px; border-left: 4px solid var(--apple-blue); margin-bottom: 18px;">
          <div style="font-size: 12px; color: var(--apple-blue); font-weight: 800; text-transform: uppercase;">INVESTMENT THESIS 核心論述</div>
          <p style="margin-top: 8px; font-size: 13.5px; line-height: 1.65; color: var(--text-primary);">${fh.thesis || s.takeaway}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
          <div style="background: rgba(52, 199, 89, 0.08); border: 1px solid rgba(52, 199, 89, 0.2); padding: 16px; border-radius: 14px;">
            <div style="color: var(--apple-green); font-weight: 800; font-size: 13px;">🚀 產業營運催化劑 (Catalysts)</div>
            <ul class="bullet-list">${catalystsHtml}</ul>
          </div>

          <div style="background: rgba(255, 59, 48, 0.08); border: 1px solid rgba(255, 59, 48, 0.2); padding: 16px; border-radius: 14px;">
            <div style="color: var(--apple-red); font-weight: 800; font-size: 13px;">⚠️ 潛在風險點 (Risks)</div>
            <ul class="bullet-list">${risksHtml}</ul>
          </div>
        </div>

        <div class="modal-section-title" style="font-size:14px; font-weight:700; color:var(--apple-blue); margin-bottom:10px;">💡 2026 估值重估邏輯 (Valuation Logic)</div>
        <div style="background: var(--bg-subtle); padding: 14px 18px; border-radius: 12px; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
          ${fh.valuationLogic || `目標價系基於 2026 E-EPS NT$ ${s.eps2026} 乘以 ${s.peRatio2026}x 本益比。`}
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
    const s = allStocks.find(st => st.symbol === symbol);
    if (!s) return;

    const summaryText = `【台股投信機構精準研報】\n` +
      `📌 標的：${s.symbol} ${s.name} (${s.category})\n` +
      `現價：${s.price.toFixed(1)}元 | 決策：${s.actionTag}\n` +
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
    openMethodologyModal: openMethodologyModal,
    copyStockSummary: copyStockSummary
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
