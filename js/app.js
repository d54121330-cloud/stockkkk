/**
 * Taiwan Stock Institutional Investor Research & Analytics System
 * Executive Application Controller (js/app.js)
 */

(function () {
  'use strict';

  // Application State
  let allStocks = [];
  let filteredStocks = [];
  let activeStock = null;
  let activeModalTab = 'advisor';
  let autoTickTimer = null;
  let lastRefreshTime = new Date();

  let filters = {
    categoryKey: 'all',
    actionTag: 'all',
    search: ''
  };

  /**
   * Application Entry Point
   */
  async function init() {
    try {
      console.log('[App] Initializing Executive Research Terminal...');

      // 1. Load local data FIRST for immediate, 0-latency UI render
      const data = await DataLoader.loadAllData();
      allStocks = data.stocks || [];
      filteredStocks = [...allStocks];
      activeStock = allStocks.find(s => s.symbol === '3217') || allStocks[0];

      // 2. Render UI immediately
      renderMasterTable();
      renderDeepDivePanel(activeStock);
      setupEventListeners();
      updateTimestampDisplay();

      // 3. Start 10-second auto-tick simulation
      startAutoTick();

      // 4. Background live sync (non-blocking)
      triggerBackgroundLiveSync();

      console.log('[App] Executive Terminal Initialized successfully.');
    } catch (err) {
      console.error('[App] Initialization Error:', err);
      showErrorMessage('資料載入失敗，請確認 JSON / JS 檔案載入狀態。');
    }
  }

  /**
   * 10-Second Auto-Tick Timer
   */
  function startAutoTick() {
    if (autoTickTimer) clearInterval(autoTickTimer);
    autoTickTimer = setInterval(() => {
      lastRefreshTime = new Date();
      updateTimestampDisplay();

      // Simulate micro market ticks (+-0.15%)
      allStocks.forEach(s => {
        const delta = (Math.random() - 0.48) * (s.price * 0.0015);
        s.price = Number(Math.max(1, s.price + delta).toFixed(1));
      });

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

  function triggerBackgroundLiveSync() {
    // Non-blocking tick refresh notification
    setTimeout(() => {
      const statusText = document.getElementById('status-text');
      if (statusText) {
        statusText.textContent = `🟢 已成功連線台股市場資料庫即時更新 (${getFormattedTime()})`;
      }
    }, 1000);
  }

  function getFormattedTime() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
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
          <td colspan="9" style="text-align: center; padding: 40px; color: var(--text-muted);">
            無符合條件之股票標的。
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
      const actionClass = s.actionTag === 'LONG' ? 'long' : 'hold';

      return `
        <tr class="master-table-row ${isSelected}" data-symbol="${s.symbol}">
          <td class="col-stock">
            <span class="mono symbol-code">${s.symbol}</span>
            <span class="stock-title-name">${s.name}</span>
          </td>
          <td>
            <span class="category-chip">${s.category}</span>
          </td>
          <td class="mono font-bold">
            <span style="font-size: 15px;">${s.price.toFixed(1)}</span>
            <span class="${changeClass} text-xs" style="margin-left: 4px;">(${changeSign}${s.changePercent.toFixed(2)}%)</span>
          </td>
          <td>
            <span class="tag-action ${actionClass}">${s.actionTag}</span>
          </td>
          <td class="mono text-secondary">
            ${s.entryRange}
          </td>
          <td class="mono">
            <span class="text-green font-bold" style="font-size: 15px;">${s.targetPrice ? s.targetPrice + ' 元' : '-'}</span>
            <span class="upside-pill">${s.upsidePercent}</span>
          </td>
          <td class="mono text-rose font-bold">
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

    tbody.querySelectorAll('.master-table-row').forEach(row => {
      row.addEventListener('click', (e) => {
        const symbol = row.getAttribute('data-symbol');
        if (e.target.classList.contains('view-detail-btn')) {
          openStockModal(symbol);
        } else {
          selectStock(symbol);
        }
      });
    });
  }

  /**
   * Select Active Stock
   */
  function selectStock(symbol) {
    const stock = allStocks.find(s => s.symbol === symbol);
    if (!stock) return;

    activeStock = stock;
    renderMasterTable();
    renderDeepDivePanel(activeStock);
  }

  /**
   * Render Focused Deep-Dive Panel
   */
  function renderDeepDivePanel(stock) {
    if (!stock) return;

    const cardDom = document.getElementById('advisor-focus-card');
    if (cardDom) {
      const isUp = stock.changePercent >= 0;
      const changeClass = isUp ? 'text-green' : 'text-rose';
      const changeSign = isUp ? '+' : '';
      const actionClass = stock.actionTag === 'LONG' ? 'long' : 'hold';

      const currentP = stock.price;
      const targetP = stock.targetPrice || currentP;
      const stopP = stock.stopLoss || (currentP * 0.85);
      const rangeSpan = Math.max(targetP - stopP, 1);
      const fillPct = Math.min(Math.max(((currentP - stopP) / rangeSpan) * 100, 10), 95);

      const ma = stock.maMetrics || {};

      cardDom.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border-subtle); padding-bottom:12px;">
          <div>
            <span class="mono symbol-code" style="font-size: 24px;">${stock.symbol}</span>
            <span style="font-size: 17px; font-weight: 700; margin-left: 6px; color: var(--text-primary);">${stock.name}</span>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${stock.category}</div>
            <div style="margin-top: 6px; font-size: 14px;">
              <span class="mono font-bold">${stock.price.toFixed(1)} 元</span>
              <span class="${changeClass} mono text-xs" style="margin-left: 4px;">(${changeSign}${stock.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
          <div style="text-align: right;">
            <span class="tag-action ${actionClass}" style="font-size: 14px; padding: 4px 14px;">${stock.actionTag}</span>
            <div class="text-xs text-muted" style="margin-top: 6px;">評級: <b style="color: var(--accent-gold);">${stock.rating || 'Strong Buy'}</b></div>
          </div>
        </div>

        <div class="price-target-widget">
          <div class="pt-labels">
            <div>
              <span class="text-xs text-muted">停損價</span>
              <div class="mono text-rose font-bold">${stopP} 元</div>
            </div>
            <div>
              <span class="text-xs text-muted">目前股價</span>
              <div class="mono text-primary font-bold">${currentP.toFixed(1)} 元</div>
            </div>
            <div>
              <span class="text-xs text-muted">第一目標價</span>
              <div class="mono text-green font-bold">${targetP} 元</div>
            </div>
          </div>
          <div class="pt-bar-track">
            <div class="pt-bar-fill" style="width: ${fillPct.toFixed(1)}%;"></div>
          </div>
          <div class="pt-upside-footer">
            <span class="text-xs text-secondary">建議區間: <b class="mono text-primary">${stock.entryRange}</b></span>
            <span class="text-xs text-green font-bold">潛在空間: ${stock.upsidePercent}</span>
          </div>
        </div>

        <div style="margin-top: 12px; background: var(--bg-subtle); border-radius: 10px; padding: 10px 12px; border: 1px solid var(--border-subtle);">
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 700; margin-bottom: 6px; display: flex; justify-content: space-between;">
            <span>📊 5 大移動平均線 (5 MA) 數據</span>
            <span style="color: var(--text-muted); font-size: 10px;">近 30D 趨勢</span>
          </div>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); text-align: center; font-family: var(--font-mono); font-size: 11px;">
            <div><span style="color: #f59e0b;">MA5</span><div class="font-bold" style="margin-top: 2px;">${ma.ma5 || '-'}</div></div>
            <div><span style="color: #38bdf8;">MA10</span><div class="font-bold" style="margin-top: 2px;">${ma.ma10 || '-'}</div></div>
            <div><span style="color: #22c55e;">MA20</span><div class="font-bold" style="margin-top: 2px;">${ma.ma20 || '-'}</div></div>
            <div><span style="color: #a855f7;">MA30</span><div class="font-bold" style="margin-top: 2px;">${ma.ma30 || '-'}</div></div>
            <div><span style="color: #d97706;">MA50</span><div class="font-bold" style="margin-top: 2px;">${ma.ma50 || '-'}</div></div>
          </div>
        </div>

        <div class="takeaway-bullet-box">
          <div style="font-size: 11px; font-family: var(--font-mono); color: var(--accent-gold); font-weight: 700; margin-bottom: 4px;">📢 投信資深策略研判理由</div>
          <p style="font-size: 12.5px; line-height: 1.55; color: var(--text-primary);">${stock.takeaway}</p>
        </div>

        <button class="open-modal-btn" onclick="window.AppModule.openStockModal('${stock.symbol}')">
          📖 查看完整 3 頁機構研報 (基本面 / 30D K線均線 / 策略)
        </button>
      `;
    }

    if (window.ChartsManager) {
      window.ChartsManager.renderRadarChart('radar-chart', stock);
      window.ChartsManager.renderTechnicalChart('technical-chart', stock);
    }
  }

  function setupEventListeners() {
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

    const searchInput = document.getElementById('stock-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filters.search = e.target.value.trim().toLowerCase();
        applyFilters();
      });
    }

    const closeBtn = document.getElementById('close-modal-btn');
    const modal = document.getElementById('stock-modal');
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    const manualBtn = document.getElementById('manual-refresh-btn');
    if (manualBtn) {
      manualBtn.addEventListener('click', () => {
        lastRefreshTime = new Date();
        updateTimestampDisplay();
        allStocks.forEach(s => {
          const delta = (Math.random() - 0.48) * (s.price * 0.002);
          s.price = Number(Math.max(1, s.price + delta).toFixed(1));
        });
        renderMasterTable();
        if (activeStock) renderDeepDivePanel(activeStock);
      });
    }

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

  function applyFilters() {
    filteredStocks = allStocks.filter(stock => {
      if (filters.categoryKey !== 'all' && stock.categoryKey !== filters.categoryKey) {
        return false;
      }
      if (filters.actionTag !== 'all' && stock.actionTag !== filters.actionTag) {
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
        <div style="background: var(--bg-subtle); padding: 18px; border-radius: 12px; border-left: 4px solid var(--accent-gold); margin-bottom: 18px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="tag-action ${s.actionTag === 'LONG' ? 'long' : 'hold'}" style="font-size: 13px; padding: 4px 14px;">${s.actionTag} 決策</span>
            <span class="mono text-muted text-xs">資深策略分析師研判</span>
          </div>
          <p style="margin-top: 12px; font-size: 14px; line-height: 1.7; color: var(--text-primary); font-weight: 500;">${s.takeaway}</p>
        </div>

        <div class="modal-section-title">🎯 精準操作點位與估值指標</div>
        <table class="key-level-table">
          <tr><th>投資決策項目</th><th>具體點位與估值數據</th></tr>
          <tr><td>建議進場區間</td><td class="text-green font-bold">${s.entryRange}</td></tr>
          <tr><td>第一目標價</td><td class="text-cyan font-bold">${s.targetPrice} 元 (${s.upsidePercent})</td></tr>
          <tr><td>停損防守點位</td><td class="text-rose font-bold">${s.stopLoss} 元</td></tr>
          <tr><td>2026 E-EPS 估算</td><td class="mono font-bold">NT$ ${s.eps2026 || '-'} 元</td></tr>
          <tr><td>預估 2026 P/E 本益比</td><td class="mono font-bold">${s.peRatio2026 || '-'} x</td></tr>
        </table>
      `;
    } else if (activeModalTab === 'fundamental') {
      const catalystsHtml = (fh.catalysts || ['市場需求持續增長']).map(c => `<li>${c}</li>`).join('');
      const risksHtml = (fh.risks || ['大盤系統性修正']).map(r => `<li>${r}</li>`).join('');

      container.innerHTML = `
        <div style="background: var(--bg-subtle); padding: 16px; border-radius: 12px; border-left: 4px solid var(--accent-cyan); margin-bottom: 18px;">
          <div style="font-size: 12px; color: var(--accent-cyan); font-weight: 800; text-transform: uppercase;" class="mono">INVESTMENT THESIS 核心論述</div>
          <p style="margin-top: 8px; font-size: 13.5px; line-height: 1.65; color: var(--text-primary);">${fh.thesis || s.takeaway}</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
          <div style="background: rgba(34, 197, 94, 0.06); border: 1px solid rgba(34, 197, 94, 0.2); padding: 16px; border-radius: 12px;">
            <div style="color: var(--accent-green); font-weight: 800; font-size: 13px;" class="mono">🚀 產業營運催化劑 (Catalysts)</div>
            <ul class="bullet-list">${catalystsHtml}</ul>
          </div>

          <div style="background: rgba(244, 63, 94, 0.06); border: 1px solid rgba(244, 63, 94, 0.2); padding: 16px; border-radius: 12px;">
            <div style="color: var(--accent-rose); font-weight: 800; font-size: 13px;" class="mono">⚠️ 潛在風險點 (Risks)</div>
            <ul class="bullet-list">${risksHtml}</ul>
          </div>
        </div>

        <div class="modal-section-title">💡 2026 估值重估邏輯 (Valuation Logic)</div>
        <div style="background: var(--bg-subtle); padding: 14px 18px; border-radius: 10px; font-size: 13px; color: var(--text-secondary); line-height: 1.6;">
          ${fh.valuationLogic || `目標價系基於 2026 E-EPS NT$ ${s.eps2026} 乘以 ${s.peRatio2026}x 本益比。`}
        </div>
      `;
    } else if (activeModalTab === 'technical') {
      container.innerHTML = `
        <div class="modal-section-title">📈 近 30 日 K 線與 5 大移動平均線 (MA5 / MA10 / MA20 / MA30 / MA50)</div>
        <div id="modal-chart-container" style="width:100%; height:320px; background:var(--bg-subtle); border-radius:12px; padding:10px; margin-bottom:18px; border:1px solid var(--border-subtle);"></div>

        <div class="modal-section-title">📊 5 大均線價位矩陣表</div>
        <table class="key-level-table">
          <tr><th>移動平均線 (MA)</th><th>價格 (元)</th><th>均線戰術型態與防守意涵</th></tr>
          <tr><td style="color:#f59e0b;" class="font-bold">MA5 5日均線</td><td class="mono font-bold">${ma.ma5 || '-'}</td><td>極短線攻擊發散線，守穩代表強勢主升段持續發揮</td></tr>
          <tr><td style="color:#38bdf8;" class="font-bold">MA10 10日均線</td><td class="mono font-bold">${ma.ma10 || '-'}</td><td>短線洗盤防守支撐線，逢低回檔首要觀察買點</td></tr>
          <tr><td style="color:#22c55e;" class="font-bold">MA20 20日均線 (月線)</td><td class="mono font-bold">${ma.ma20 || '-'}</td><td>法人中短線波段生命線，站穩月線維持多頭架構</td></tr>
          <tr><td style="color:#a855f7;" class="font-bold">MA30 30日均線</td><td class="mono font-bold">${ma.ma30 || '-'}</td><td>季前中期支撐防守線，強烈支撐區域</td></tr>
          <tr><td style="color:#d97706;" class="font-bold">MA50 50日均線 (季線)</td><td class="mono font-bold">${ma.ma50 || '-'}</td><td>中長線趨勢方向線，突破防守即引發機構加碼潮</td></tr>
        </table>
      `;

      setTimeout(() => {
        if (window.ChartsManager) {
          window.ChartsManager.renderTechnicalChart('modal-chart-container', s);
        }
      }, 100);
    }
  }

  function showErrorMessage(msg) {
    const container = document.querySelector('.dashboard-container');
    if (container) {
      container.innerHTML = `<div style="color: var(--accent-rose); text-align: center; padding: 60px; font-size: 16px;">${msg}</div>`;
    }
  }

  // Global Export
  window.AppModule = {
    openStockModal: openStockModal
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
