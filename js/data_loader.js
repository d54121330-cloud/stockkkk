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
      console.warn('[DataLoader] Stock database missing in window and fetch. Using built-in fail-safe dataset.');
      rawData = getFallbackStockDataset();
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

  function getFallbackStockDataset() {
    return {
      metadata: { generatedAt: "2026-08-11 15:00:00", systemTitle: "Taiwan Stock Institutional Terminal" },
      recommendations: [
        { symbol: "2330", name: "台積電", category: "先進封裝與半導體轉型", categoryKey: "adv_pkg", actionTag: "LONG", currentPrice: 2405.0, changePercent: 3.66, targetPrice: 2800.0, stopLoss: 2180.0, entryRange: "2,330 - 2,370 元", upsidePercent: "+16.4%", takeaway: "★ A16/N2 先進製程與 CoWoS 產能預約至 2027 年，代工價調漲，預估 2026 EPS NT$70.0。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 70.0, peRatio2026: 34.3 } },
        { symbol: "3217", name: "優群", category: "SOCAMM2 次世代記憶體", categoryKey: "socamm2", actionTag: "LONG", currentPrice: 143.5, changePercent: 1.77, targetPrice: 185.0, stopLoss: 122.0, entryRange: "136.0 - 141.0 元", upsidePercent: "+28.9%", takeaway: "★ AI PC / NB 與伺服器 SOCAMM2 / CAMM2 新型高頻記憶體插槽連接器全球龍頭，毛利率逾 48%，預估 2026 EPS NT$12.50。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 12.5, peRatio2026: 14.8 } },
        { symbol: "6451", name: "訊芯-KY", category: "矽光子與 CPO 共封裝", categoryKey: "cpo_photonics", actionTag: "LONG", currentPrice: 430.0, changePercent: 9.97, targetPrice: 530.0, stopLoss: 365.0, entryRange: "405.0 - 420.0 元", upsidePercent: "+23.3%", takeaway: "★ 鴻海集團 CPO 矽光子先進封裝主力廠商，博通 800G/1.6T 光引擎訂單放量，預估 2026 EPS NT$16.80。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 16.8, peRatio2026: 25.6 } },
        { symbol: "3017", name: "奇鋐", category: "AI 伺服器水冷散熱", categoryKey: "liquid_cooling", actionTag: "LONG", currentPrice: 2730.0, changePercent: 5.00, targetPrice: 3300.0, stopLoss: 2350.0, entryRange: "2,600 - 2,680 元", upsidePercent: "+20.9%", takeaway: "★ NVIDIA Blackwell GB200/NVL72 液冷水冷板 (Cold Plate) 與快拆氣密分流管線獨家大單，預估 2026 EPS NT$110.0。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 110.0, peRatio2026: 24.8 } },
        { symbol: "3324", name: "雙鴻", category: "AI 伺服器水冷散熱", categoryKey: "liquid_cooling", actionTag: "LONG", currentPrice: 965.0, changePercent: 2.22, targetPrice: 1180.0, stopLoss: 840.0, entryRange: "920.0 - 950.0 元", upsidePercent: "+22.3%", takeaway: "★ 水冷散熱 CDUs 與水冷板產能放量，美系雲端 CSP 大廠水冷滲透率達 45%，預估 2026 EPS NT$48.50。", fundamentalHighlights: { rating: "Buy", eps2026: 48.5, peRatio2026: 19.9 } },
        { symbol: "2313", name: "華通", category: "低軌衛星與衛星通訊", categoryKey: "leo_sat", actionTag: "LONG", currentPrice: 208.5, changePercent: -5.44, targetPrice: 260.0, stopLoss: 187.7, entryRange: "204.8 - 206.4 元", upsidePercent: "+24.7%", takeaway: "★ 星鏈衛星與地面站 HDI 板市佔逾 65%，Gen3 衛星單價提升 25%，預估 2026 EPS NT$11.50。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 11.5, peRatio2026: 18.9 } },
        { symbol: "6285", name: "啟碁", category: "低軌衛星與衛星通訊", categoryKey: "leo_sat", actionTag: "LONG", currentPrice: 260.0, changePercent: 2.97, targetPrice: 298.0, stopLoss: 232.0, entryRange: "248.0 - 253.0 元", upsidePercent: "+14.6%", takeaway: "★ 握有 Starlink 企業/車用終端大單，受益美國 BEAD 420 億美元基建法案撥款，預估 2026 EPS NT$14.20。", fundamentalHighlights: { rating: "Buy", eps2026: 14.2, peRatio2026: 18.1 } },
        { symbol: "6271", name: "同欣電", category: "低軌衛星與衛星通訊", categoryKey: "leo_sat", actionTag: "LONG", currentPrice: 190.0, changePercent: 5.85, targetPrice: 225.0, stopLoss: 168.0, entryRange: "180.0 - 185.0 元", upsidePercent: "+18.4%", takeaway: "★ SpaceX 高頻 RF 模組封裝與車用 CIS 復甦雙引擎驅動，預估 2026 EPS NT$10.80。", fundamentalHighlights: { rating: "Buy", eps2026: 10.8, peRatio2026: 17.5 } },
        { symbol: "3491", name: "昇達科", category: "低軌衛星與衛星通訊", categoryKey: "leo_sat", actionTag: "LONG", currentPrice: 1285.0, changePercent: 9.83, targetPrice: 1540.0, stopLoss: 1080.0, entryRange: "1,220 - 1,260 元", upsidePercent: "+19.8%", takeaway: "★ E-band 毫米波元件毛利率超 60%，為衛星直連技術最高純度受惠股，預估 2026 EPS NT$58.0。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 58.0, peRatio2026: 22.2 } },
        { symbol: "6239", name: "力成", category: "先進封裝與半導體轉型", categoryKey: "adv_pkg", actionTag: "HOLD", currentPrice: 256.5, changePercent: 0.0, targetPrice: 302.0, stopLoss: 235.0, entryRange: "250.0 - 254.0 元", upsidePercent: "+17.7%", takeaway: "★ FOPOL 面板級封裝產能佈局完善，短線面臨高點壓力，建議暫時觀望。", fundamentalHighlights: { rating: "Hold", eps2026: 15.1, peRatio2026: 17.2 } },
        { symbol: "3481", name: "群創", category: "先進封裝與半導體轉型", categoryKey: "adv_pkg", actionTag: "LONG", currentPrice: 47.8, changePercent: 0.0, targetPrice: 62.0, stopLoss: 42.0, entryRange: "46.0 - 47.5 元", upsidePercent: "+29.7%", takeaway: "★ 舊世代面板線轉型 FOPOL 封裝具高度資產重估效益，跨足半導體封裝轉型明確。", fundamentalHighlights: { rating: "Buy", eps2026: 2.8, peRatio2026: 17.4 } },
        { symbol: "2345", name: "智邦", category: "AI 網通與次世代 DPU", categoryKey: "ai_dpu", actionTag: "LONG", currentPrice: 2385.0, changePercent: 2.8, targetPrice: 2850.0, stopLoss: 2150.0, entryRange: "2,320 - 2,370 元", upsidePercent: "+19.5%", takeaway: "★ 800G 網通交換器與 AI DPU 加速卡訂單排至 2027，毛利率穩定維持 23%+。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 95.0, peRatio2026: 25.3 } },
        { symbol: "3363", name: "上詮", category: "矽光子與 CPO 共封裝", categoryKey: "cpo_photonics", actionTag: "LONG", currentPrice: 600.0, changePercent: 6.57, targetPrice: 720.0, stopLoss: 495.0, entryRange: "560.0 - 585.0 元", upsidePercent: "+20.0%", takeaway: "★ 攜手台積電開發 CPO 矽光子保密光纖連接器，2026 迎接 CPO 量產元年。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 18.0, peRatio2026: 33.2 } }
      ],
      vaultRecommendations: [
        { symbol: "2327", name: "國巨", category: "專題研究庫 (高階被動元件)", categoryKey: "passive_components", actionTag: "LONG", currentPrice: 618.0, changePercent: 2.15, targetPrice: 780.0, stopLoss: 540.0, entryRange: "595.0 - 610.0 元", upsidePercent: "+26.2%", takeaway: "★ 國巨為高階被動元件龍頭，AI 伺服器與車用元件需求大增，預估 2026 EPS NT$48.5。", fundamentalHighlights: { rating: "Strong Buy", eps2026: 48.5, peRatio2026: 16.1 } }
      ]
    };
  }

  return {
    loadAllData: loadAllData
  };
})();
