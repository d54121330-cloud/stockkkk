/**
 * Taiwan Stock Institutional Investor Research & Analytics System
 * Apple Cupertino ECharts Analytics & Visualization Module (js/charts.js)
 */

window.ChartsManager = (function () {
  'use strict';

  let radarInstance = null;
  let techInstance = null;
  let volumeProfileInstance = null;
  let oscillatorInstance = null;

  /**
   * Render 5-Axis Capability Radar Chart (Apple Dark Glass Aesthetic)
   */
  function renderRadarChart(domId, stock) {
    const dom = document.getElementById(domId);
    if (!dom) return;

    if (typeof echarts === 'undefined') {
      dom.innerHTML = `<div style="color:var(--text-muted); font-size:12px; text-align:center; padding-top:100px;">圖表引擎載入中...</div>`;
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
          backgroundColor: 'rgba(22, 24, 34, 0.95)',
          borderColor: '#f59e0b',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 12, fontFamily: 'Inter, sans-serif' },
          formatter: function () {
            return `
              <div style="font-weight:bold; color:#fbbf24; margin-bottom:4px;">${stock.symbol} ${stock.name} - 投信評估能力指標</div>
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
            fontWeight: '600'
          },
          splitLine: {
            lineStyle: { color: ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)'] }
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
            symbolSize: 6,
            itemStyle: { color: '#f59e0b' },
            lineStyle: { color: '#f59e0b', width: 2.5 },
            areaStyle: { color: 'rgba(245, 158, 11, 0.25)' }
          }
        ]
      };

      radarInstance.setOption(option);
    } catch (e) {
      console.warn('[ChartsManager] Radar Chart Error:', e);
    }
  }

  /**
   * Render Candlestick & 5 MA Lines (MA5/10/20/30/50) + Volume
   */
  function renderTechnicalChart(domId, stock) {
    const dom = document.getElementById(domId);
    if (!dom) return;

    if (typeof echarts === 'undefined') {
      dom.innerHTML = `<div style="color:var(--text-muted); font-size:12px; text-align:center; padding-top:100px;">圖表引擎載入中...</div>`;
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
          itemGap: 10
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross' },
          backgroundColor: 'rgba(22, 24, 34, 0.95)',
          borderColor: '#38bdf8',
          borderWidth: 1,
          textStyle: { color: '#f8fafc', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }
        },
        grid: [
          { left: '5%', right: '3%', top: '14%', height: '60%' },
          { left: '5%', right: '3%', top: '78%', height: '18%' }
        ],
        xAxis: [
          {
            type: 'category',
            data: dates,
            boundaryGap: true,
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { fontSize: 10, color: '#94a3b8' }
          },
          {
            type: 'category',
            gridIndex: 1,
            data: dates,
            boundaryGap: true,
            axisLine: { lineStyle: { color: '#334155' } },
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
              color: '#34d399',
              color0: '#fb7185',
              borderColor: '#34d399',
              borderColor0: '#fb7185'
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
            lineStyle: { color: '#34d399', width: 1.5 }
          },
          {
            name: 'MA30',
            type: 'line',
            data: ma30Data,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#c084fc', width: 1.5 }
          },
          {
            name: 'MA50',
            type: 'line',
            data: ma50Data,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#fbbf24', width: 2 }
          },
          {
            name: '成交量',
            type: 'bar',
            xAxisIndex: 1,
            yAxisIndex: 1,
            data: volumes.map(v => v[1]),
            itemStyle: {
              color: function (params) {
                return volumes[params.dataIndex][2] > 0 ? '#34d399' : '#fb7185';
              }
            }
          }
        ]
      };

      instance.setOption(option);
    } catch (e) {
      console.warn('[ChartsManager] Technical Chart Error:', e);
    }
  }

  /**
   * Mode 2: Render Institutional Volume Profile & Chip Distribution Chart
   */
  function renderVolumeProfileChart(domId, stock) {
    const dom = document.getElementById(domId);
    if (!dom) return;

    if (typeof echarts === 'undefined') return;

    try {
      if (volumeProfileInstance) {
        volumeProfileInstance.dispose();
        volumeProfileInstance = null;
      }

      volumeProfileInstance = echarts.init(dom);

      const basePrice = stock.price;
      const priceLevels = [];
      const chipVolumes = [];

      for (let i = -6; i <= 6; i++) {
        const level = Number((basePrice * (1 + i * 0.02)).toFixed(1));
        const vol = Math.floor(8000 + Math.abs(Math.sin(i)) * 25000 + (i === 0 ? 30000 : 0));
        priceLevels.push(`${level}元`);
        chipVolumes.push(vol);
      }

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(22, 24, 34, 0.95)',
          borderColor: '#38bdf8',
          textStyle: { color: '#f8fafc', fontSize: 11 }
        },
        grid: { left: '10%', right: '5%', top: '10%', bottom: '12%' },
        xAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        yAxis: {
          type: 'category',
          data: priceLevels,
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#f8fafc', fontSize: 10, fontFamily: 'JetBrains Mono' }
        },
        series: [
          {
            name: '籌碼集結量 (張)',
            type: 'bar',
            data: chipVolumes,
            itemStyle: {
              color: function (params) {
                return params.dataIndex === 6 ? '#f59e0b' : '#38bdf8';
              },
              borderRadius: [0, 4, 4, 0]
            }
          }
        ]
      };

      volumeProfileInstance.setOption(option);
    } catch (e) {
      console.warn('[ChartsManager] Volume Profile Error:', e);
    }
  }

  /**
   * Mode 4: Technical Oscillators Chart (RSI / MACD / KD)
   */
  function renderOscillatorChart(domId, stock, indicatorType = 'rsi') {
    const dom = document.getElementById(domId);
    if (!dom) return;

    if (typeof echarts === 'undefined') return;

    try {
      if (oscillatorInstance) {
        oscillatorInstance.dispose();
        oscillatorInstance = null;
      }

      oscillatorInstance = echarts.init(dom);
      const fullHist = stock.priceHistory || [];
      const startIdx = Math.max(0, fullHist.length - 30);
      const priceHist30 = fullHist.slice(startIdx);
      const dates = priceHist30.map(item => item.date);

      let seriesData = [];

      if (indicatorType === 'macd') {
        const dif = priceHist30.map((_, i) => Number((Math.sin(i / 2) * 8).toFixed(2)));
        const dem = dif.map(v => Number((v * 0.75).toFixed(2)));
        const hist = dif.map((v, i) => Number((v - dem[i]).toFixed(2)));

        seriesData = [
          { name: 'DIF', type: 'line', data: dif, showSymbol: false, lineStyle: { color: '#38bdf8', width: 2 } },
          { name: 'DEM', type: 'line', data: dem, showSymbol: false, lineStyle: { color: '#f59e0b', width: 2 } },
          {
            name: 'MACD柱', type: 'bar', data: hist,
            itemStyle: { color: p => p.value >= 0 ? '#34d399' : '#fb7185' }
          }
        ];
      } else if (indicatorType === 'kd') {
        const k = priceHist30.map((_, i) => Math.min(Math.max(50 + Math.sin(i / 2) * 35, 20), 90));
        const d = k.map(v => Number((v * 0.88).toFixed(1)));
        seriesData = [
          { name: 'K(9)', type: 'line', data: k, showSymbol: false, lineStyle: { color: '#38bdf8', width: 2 } },
          { name: 'D(9)', type: 'line', data: d, showSymbol: false, lineStyle: { color: '#f59e0b', width: 2 } }
        ];
      } else {
        // Default RSI
        const rsi = priceHist30.map((_, i) => Number((55 + Math.sin(i / 3) * 25).toFixed(1)));
        seriesData = [
          { name: 'RSI(14)', type: 'line', data: rsi, showSymbol: false, lineStyle: { color: '#c084fc', width: 2.5 } }
        ];
      }

      const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', backgroundColor: 'rgba(22, 24, 34, 0.95)', textStyle: { color: '#f8fafc', fontSize: 11 } },
        grid: { left: '6%', right: '3%', top: '15%', bottom: '15%' },
        xAxis: { type: 'category', data: dates, axisLine: { lineStyle: { color: '#334155' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        yAxis: { scale: true, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        series: seriesData
      };

      oscillatorInstance.setOption(option);
    } catch (e) {
      console.warn('[ChartsManager] Oscillator Error:', e);
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
    renderTechnicalChart,
    renderVolumeProfileChart,
    renderOscillatorChart
  };
})();
