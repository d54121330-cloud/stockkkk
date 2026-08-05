"""
Taiwan Stock Institutional Investor Research & Analytics Terminal
Zero-Token Automated Stock Data Update Engine (auto_update_stocks.py)

Fetches real-time / daily price data and updates JSON & JS datasets autonomously without AI tokens.
"""

import json
import os
import datetime
import urllib.request
import ssl

# Bypass SSL Certificate Verification on local environments
ssl_context = ssl._create_unverified_context()

STOCKS_CONFIG = [
    {"symbol": "2313", "name": "華通", "category": "SpaceX / 低軌衛星"},
    {"symbol": "6285", "name": "啟碁", "category": "SpaceX / 低軌衛星"},
    {"symbol": "6271", "name": "同欣電", "category": "SpaceX / 低軌衛星"},
    {"symbol": "3491", "name": "昇達科", "category": "SpaceX / 低軌衛星"},
    {"symbol": "2330", "name": "台積電", "category": "SpaceX / 低軌衛星"},
    {"symbol": "6239", "name": "力成", "category": "FOPOL 封裝"},
    {"symbol": "3481", "name": "群創", "category": "FOPOL 封裝"},
    {"symbol": "2345", "name": "智邦", "category": "DPU 處理器"},
    {"symbol": "3363", "name": "上詮", "category": "光通訊 / CPO"}
]

def fetch_twse_stock_quote(symbol):
    """
    Fetch real-time stock price from TWSE OpenAPI / Mis API (Zero AI tokens used).
    """
    try:
        url = f"https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_{symbol}.tw"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, context=ssl_context, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            msgArray = data.get('msgArray', [])
            if not msgArray:
                return None, None
            msg = msgArray[0]
            price = float(msg.get('z', 0) or msg.get('y', 0) or 0)
            yesterday_close = float(msg.get('y', 0) or price or 1)
            change_percent = ((price - yesterday_close) / yesterday_close) * 100 if yesterday_close else 0.0
            return price, round(change_percent, 2)
    except Exception as e:
        print(f"[AutoUpdate] Fetch failed for {symbol}: {e}")
        return None, None

def update_all_datasets():
    """
    Update advisor_recommendations.json AND stock_database.js with real-time prices & metrics.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "data", "advisor_recommendations.json")
    js_path = os.path.join(base_dir, "data", "stock_database.js")

    if not os.path.exists(json_path):
        print(f"[AutoUpdate] Error: {json_path} not found.")
        return

    with open(json_path, 'r', encoding='utf-8') as f:
        dataset = json.load(f)

    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    dataset['metadata']['generatedAt'] = now_str
    dataset['metadata']['updateMethod'] = "Zero-Token TWSE Pure Code Engine"

    recs = dataset.get('recommendations', [])
    updated_count = 0

    for rec in recs:
        symbol = rec.get('symbol')
        price, change_pct = fetch_twse_stock_quote(symbol)
        if price and price > 0:
            rec['currentPrice'] = price
            rec['changePercent'] = change_pct
            
            # Recalculate upside percentage
            tp = rec.get('targetPrice', price)
            upside = round(((tp - price) / price) * 100, 2)
            rec['upsidePercent'] = f"+{upside}%" if upside >= 0 else f"{upside}%"
            updated_count += 1
            print(f"[AutoUpdate] Updated {symbol} {rec.get('name')}: Price={price}, Change={change_pct}%, Upside={rec['upsidePercent']}")

    # 1. Save JSON
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    # 2. Save Standalone JS for 100% Zero-Server Browser Execution
    js_content = f"window.EMBEDDED_STOCK_DATA = {json.dumps(dataset, ensure_ascii=False, indent=2)};\n"
    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

    print(f"[Zero-Token Update Success] {updated_count}/9 stock data updated at {now_str}")

if __name__ == "__main__":
    update_all_datasets()
