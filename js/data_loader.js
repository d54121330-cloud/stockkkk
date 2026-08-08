/**
 * Taiwan Stock Institutional Investor Research & Analytics System
 * Data Loader Module (js/data_loader.js)
 */

window.DataLoader = (function () {
  'use strict';

  async function loadAllData() {
    console.log('[DataLoader] Loading Institutional Dataset & Market Quotes...');

    let rawData = null;

    if (window.EMBEDDED_STOCK_DATA) {
      console.log('[DataLoader] Loaded dataset from Embedded JS Window object.');
      rawData = window.EMBEDDED_STOCK_DATA;
    } else {
      try {
        const res = await fetch('data/advisor_recommendations.json');
        if (res.ok) {
          rawData = await res.json();
        }
      } catch (err) {
        console.warn('[DataLoader] Fetch JSON failed, trying fallback...', err);
      }
    }

    if (!rawData) {
      throw new Error('[DataLoader] Critical: Stock database not found.');
    }

    const defaultStocks = (rawData.recommendations || []).map(processStockMetrics);
    const vaultStocks = (rawData.vaultRecommendations || []).map(processStockMetrics);

    return {
      metadata: rawData.metadata || {},
      stocks: defaultStocks,
      vaultStocks: vaultStocks,
      allCombined: [...defaultStocks, ...vaultStocks]
    };
  }

  function processStockMetrics(stock) {
    const closes = (stock.priceHistory || []).map(h => h.close);
    if (closes.length > 0 && (!stock.maMetrics || !stock.maMetrics.ma5)) {
      stock.maMetrics = {
        ma5: calcMA(closes, 5),
        ma10: calcMA(closes, 10),
        ma20: calcMA(closes, 20),
        ma30: calcMA(closes, 30),
        ma50: calcMA(closes, 50)
      };
    }
    return stock;
  }

  function calcMA(closes, dayCount) {
    if (closes.length < dayCount) return null;
    const slice = closes.slice(closes.length - dayCount);
    const sum = slice.reduce((a, b) => a + b, 0);
    return Number((sum / dayCount).toFixed(2));
  }

  return {
    loadAllData: loadAllData
  };
})();
