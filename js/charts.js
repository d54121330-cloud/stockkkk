/**
 * Taiwan Stock Institutional Investor Research & Analytics System
 * ECharts Analytics & Visualization Module (js/charts.js)
 */

window.ChartsManager = (function () {
  'use strict';

  let radarInstance = null;
  let techInstance = null;

  /**
   * Render 5-Axis Capability Radar Chart
   */
  function renderRadarChart(domId, stock) {
    const dom = document.getElementById(domId);
    if (!dom) return;

    if (typeof echarts === 'undefined') {
      dom.innerHTML = `<div style="color:var(--text-muted); font-size:12px; text-align:center; padding-top:100px;">圖表引擎載入中或連線不穩定...</div>`;
      return;
    }

    try {
      if (radarInstance) {
        radarInstance.dispose();
        radarInstance = null;
      }

      radarInstance = echarts.init(dom);

      const scores = stock.radarScores || {
        revenueGrowth: 88,
        technicalPattern: 85,
        institutionalFlow: 88,
        industryOutlook: 90,
        safetyMargin: 82
      };

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: '#12141d',
          borderColor: '#d97706',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12 },
          formatter: function () {
            return `
              <div style="font-weight:bold; color:#d97706; margin-bottom:4px;">${stock.symbol} ${stock.name} - 評估分數</div>
              <div style="font-family:monospace; font-size:12px; line-height:1.6;">
                營收成長性: <b>${scores.revenueGrowth}</b>/100<br/>
                技術型態: <b>${scores.technicalPattern}</b>/100<br/>
                法人籌碼: <b>${scores.institutionalFlow}</b>/100<br/>
                產業前景: <b>${scores.industryOutlook}</b>/100<br/>
                估值邊際: <b>${scores.safetyMargin}</b>/100
              </div>
            `;
          }
        },
        radar: {
          indicator: [
            { name: '營收成長', max: 100 },
            { name: '技術型態', max: 100 },
            { name: '法人籌碼', max: 100 },
            { name: '產業前景', max: 100 },
            { name: '估值邊際', max: 100 }
          ],
          shape: 'polygon',
          splitNumber: 4,
          axisName: {
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: '700'
          },
          splitLine: {
            lineStyle: { color: ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] }
          },
          splitArea: {
            areaStyle: { color: ['transparent', 'rgba(255,255,255,0.02)'] }
          },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } }
        },
        series: [
          {
            type: 'radar',
            data: [
              {
                value: [
                  scores.revenueGrowth,
                  scores.technicalPattern,
                  scores.institutionalFlow,
                  scores.industryOutlook,
                  scores.safetyMargin
                ],
                name: stock.name
              }
            ],
            symbol: 'circle',
            symbolSize: 5,
            itemStyle: { color: '#d97706' },
            lineStyle: { color: '#d97706', width: 2 },
            areaStyle: { color: 'rgba(217, 119, 6, 0.25)' }
          }
        ]
      };

      radarInstance.setOption(option);
    } catch (e) {
      console.warn('[ChartsManager] Radar Chart Render Error:', e);
    }
  }

  /**
   * Render Candlestick & 5 MA Lines (MA5/10/20/30/50) + Volume
   */
  function renderTechnicalChart(domId, stock) {
    const dom = document.getElementById(domId);
    if (!dom) return;

    if (typeof echarts === 'undefined') {
      dom.innerHTML = `<div style="color:var(--text-muted); font-size:12px; text-align:center; padding-top:100px;">圖表引擎載入中或連線不穩定...</div>`;
      return;
    }

    try {
      if (domId === 'technical-chart' && techInstance) {
        techInstance.dispose();
        techInstance = null;
      }

      const instance = echarts.init(dom);
      if (domId === 'technical-chart') techInstance = instance;

      const fullHist = stock.priceHistory || [];
      const startIdx = Math.max(0, fullHist.length - 30);
      const priceHist30 = fullHist.slice(startIdx);

      const dates = priceHist30.map(item => item.date);
      const kData = priceHist30.map(item => [item.open, item.close, item.low, item.high]);

      const ma5Data = calcMovingAverage(5, fullHist).slice(startIdx);
      const ma10Data = calcMovingAverage(10, fullHist).slice(startIdx);
      const ma20Data = calcMovingAverage(20, fullHist).slice(startIdx);
      const ma30Data = calcMovingAverage(30, fullHist).slice(startIdx);
      const ma50Data = calcMovingAverage(50, fullHist).slice(startIdx);

      const volumes = priceHist30.map((item, idx) => [idx, item.volume, item.close >= item.open ? 1 : -1]);

      const option = {
        backgroundColor: 'transparent',
        animation: true,
        legend: {
          data: ['K線', 'MA5', 'MA10', 'MA20', 'MA30', 'MA50'],
          top: '0%',
          right: '2%',
          textStyle: { color: '#94a3b8', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
          itemGap: 12
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          backgroundColor: '#12141d',
          borderColor: '#d97706',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }
        },
        grid: [
          { left: '6%', right: '3%', top: '14%', height: '60%' },
          { left: '6%', right: '3%', top: '78%', height: '18%' }
        ],
        xAxis: [
          {
            type: 'category',
            data: dates,
            boundaryGap: true,
            axisLine: { lineStyle: { color: '#475569' } },
            axisLabel: { fontSize: 10, color: '#94a3b8' }
          },
          {
            type: 'category',
            gridIndex: 1,
            data: dates,
            boundaryGap: true,
            axisLine: { lineStyle: { color: '#475569' } },
            axisLabel: { show: false }
          }
        ],
        yAxis: [
          {
            scale: true,
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
            axisLabel: { fontSize: 10, color: '#94a3b8' }
          },
          {
            scale: true,
            gridIndex: 1,
            splitLine: { show: false },
            axisLabel: { show: false }
          }
        ],
        series: [
          {
            name: 'K線',
            type: 'candlestick',
            data: kData,
            itemStyle: {
              color: '#22c55e',
              color0: '#f43f5e',
              borderColor: '#22c55e',
              borderColor0: '#f43f5e'
            }
          },
          {
            name: 'MA5',
            type: 'line',
            data: ma5Data,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#f59e0b', width: 1.5 }
          },
          {
            name: 'MA10',
            type: 'line',
            data: ma10Data,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#38bdf8', width: 1.5 }
          },
          {
            name: 'MA20',
            type: 'line',
            data: ma20Data,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#22c55e', width: 1.5 }
          },
          {
            name: 'MA30',
            type: 'line',
            data: ma30Data,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#a855f7', width: 1.5 }
          },
          {
            name: 'MA50',
            type: 'line',
            data: ma50Data,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#d97706', width: 2 }
          },
          {
            name: '成交量',
            type: 'bar',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: volumes.map(v => v[1]),
            itemStyle: {
              color: function (params) {
                return volumes[params.dataIndex][2] > 0 ? '#22c55e' : '#f43f5e';
              }
            }
          }
        ]
      };

      instance.setOption(option);
    } catch (e) {
      console.warn('[ChartsManager] Technical Chart Render Error:', e);
    }
  }

  function calcMovingAverage(dayCount, priceHist) {
    const result = [];
    for (let i = 0; i < priceHist.length; i++) {
      if (i < dayCount - 1) {
        result.push('-');
        continue;
      }
      let sum = 0;
      for (let j = 0; j < dayCount; j++) {
        sum += priceHist[i - j].close;
      }
      result.push(Number((sum / dayCount).toFixed(1)));
    }
    return result;
  }

  return {
    renderRadarChart,
    renderTechnicalChart
  };
})();
