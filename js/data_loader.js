/**
 * Taiwan Stock Institutional Investor Research & Analytics System
 * Data Loader Module (js/data_loader.js)
 */

window.DataLoader = (function () {
  'use strict';

  async function loadAllData() {
    try {
      let advisorData = window.EMBEDDED_STOCK_DATA;

      if (!advisorData) {
        try {
          const res = await fetch('./data/advisor_recommendations.json');
          if (res.ok) {
            advisorData = await res.json();
          }
        } catch (e) {
          console.warn('[DataLoader] Fetch JSON fallback to local embed:', e);
        }
      }

      if (!advisorData || !advisorData.recommendations) {
        throw new Error('No stock data available.');
      }

      const recs = advisorData.recommendations;
      const mergedStocks = [];
      const stockMap = {};

      recs.forEach(aStock => {
        const symbol = String(aStock.symbol);
        const basePrice = aStock.currentPrice || 100;
        const priceHistory = aStock.priceHistory || generatePriceHistory(basePrice);
        const maMetrics = calculateMAMetrics(priceHistory);

        const categoryKey = aStock.categoryKey || getCategoryKey(aStock.category || '');

        const merged = {
          symbol: symbol,
          name: aStock.name || '',
          category: aStock.category || '',
          categoryKey: categoryKey,
          price: basePrice,
          changePercent: aStock.changePercent ?? 0,
          rating: (aStock.fundamentalHighlights && aStock.fundamentalHighlights.rating) || 'Strong Buy',
          targetPrice: aStock.targetPrice || basePrice,
          upsidePercent: aStock.upsidePercent || calculateUpside(basePrice, aStock.targetPrice),
          stopLoss: aStock.stopLoss || Math.round(basePrice * 0.85),
          entryRange: aStock.entryRange || `${Math.round(basePrice * 0.95)} - ${Math.round(basePrice * 0.98)} 元`,
          actionTag: aStock.actionTag || 'LONG',
          takeaway: aStock.takeaway || '',
          fundamentalHighlights: aStock.fundamentalHighlights || {},
          eps2026: (aStock.fundamentalHighlights && aStock.fundamentalHighlights.eps2026) || 0,
          peRatio2026: (aStock.fundamentalHighlights && aStock.fundamentalHighlights.peRatio2026) || 0,
          priceHistory: priceHistory,
          maMetrics: maMetrics
        };

        mergedStocks.push(merged);
        stockMap[symbol] = merged;
      });

      return {
        stocks: mergedStocks,
        stockMap: stockMap,
        metadata: advisorData.metadata || {}
      };
    } catch (err) {
      console.error('[DataLoader] Fatal error loading stock data:', err);
      throw err;
    }
  }

  function calculateUpside(current, target) {
    if (!current || !target) return '0%';
    const pct = ((target - current) / current) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  }

  function getCategoryKey(catStr = '') {
    if (catStr.includes('低軌衛星')) return 'leo_sat';
    if (catStr.includes('先進封裝') || catStr.includes('FOPOL')) return 'adv_pkg';
    if (catStr.includes('水冷') || catStr.includes('散熱')) return 'liquid_cooling';
    if (catStr.includes('SOCAMM2') || catStr.includes('記憶體')) return 'socamm2';
    if (catStr.includes('AI') || catStr.includes('DPU')) return 'ai_dpu';
    if (catStr.includes('矽光子') || catStr.includes('CPO')) return 'cpo_photonics';
    return 'other';
  }

  function generatePriceHistory(basePrice) {
    const list = [];
    const today = new Date();
    for (let i = 50; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const trend = (50 - i) * (basePrice * 0.002);
      const wave = Math.sin(i / 2.5) * (basePrice * 0.018) + Math.cos(i / 4) * (basePrice * 0.01);
      const closeP = Number(Math.max(1, basePrice - (basePrice * 0.06) + trend + wave).toFixed(1));
      const openP = Number((closeP * (0.992 + Math.random() * 0.015)).toFixed(1));
      const lowP = Number((Math.min(openP, closeP) * 0.992).toFixed(1));
      const highP = Number((Math.max(openP, closeP) * 1.008).toFixed(1));
      const volume = Math.floor(4000 + Math.random() * 16000);
      list.push({ date: dateStr, open: openP, close: closeP, low: lowP, high: highP, volume: volume });
    }
    return list;
  }

  function calculateMAMetrics(history) {
    const closes = history.map(item => item.close);
    const lastIdx = closes.length - 1;

    const getMA = (dayCount) => {
      if (closes.length < dayCount) return '-';
      const slice = closes.slice(lastIdx - dayCount + 1, lastIdx + 1);
      const sum = slice.reduce((a, b) => a + b, 0);
      return Number((sum / dayCount).toFixed(1));
    };

    return {
      ma5: getMA(5),
      ma10: getMA(10),
      ma20: getMA(20),
      ma30: getMA(30),
      ma50: getMA(50)
    };
  }

  return {
    loadAllData,
    getCategoryKey
  };
})();
