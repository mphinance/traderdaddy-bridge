(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function s(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerPolicy&&(n.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?n.credentials="include":a.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(a){if(a.ep)return;a.ep=!0;const n=s(a);fetch(a.href,n)}})();const V={balances:{balances:{account_number:"VA000001",total_equity:44e3,total_cash:25e3,buying_power:5e4}},positions:{positions:{position:[{symbol:"AAPL",quantity:100,cost_basis:18e3,date_acquired:"2026-01-05T00:00:00.000Z"}]}},quotes:{quotes:{quote:{symbol:"AAPL",description:"Apple Inc",last:190,bid:189.95,ask:190.05,volume:51234567}}}},z={balances:{data:{"account-number":"5WX12345","net-liquidating-value":"44000.00","cash-balance":"25000.00","equity-buying-power":"50000.00"}},positions:{data:{items:[{symbol:"AAPL","instrument-type":"Equity",quantity:"100","quantity-direction":"Long","average-open-price":"180.00","created-at":"2026-01-05T14:30:00.000Z"}]}},quotes:{AAPL:{Quote:{event_symbol:"AAPL",bid_price:"189.95",ask_price:"190.05",bid_size:"200",ask_size:"300"},Trade:{event_symbol:"AAPL",price:"190.00",day_volume:"51234567"}}}},ae={account:{id:"snap-abc-123",balance:{total:{amount:44e3,currency:"USD"}}},balances:[{currency:{code:"USD",name:"US Dollar"},cash:25e3,buying_power:5e4}],positions:[{symbol:{symbol:{raw_symbol:"AAPL",description:"Apple Inc."}},units:100,price:190,average_purchase_price:180}],quotes:[{symbol:{raw_symbol:"AAPL",description:"Apple Inc."},last_trade_price:190,bid_price:189.95,ask_price:190.05}]},Y={account:{account_number:"PA0ABCDEFGHI",equity:"44000",cash:"25000",buying_power:"50000",portfolio_value:"44000"},positions:[{symbol:"AAPL",qty:"100",side:"long",avg_entry_price:"180.00",cost_basis:"18000",market_value:"19000",current_price:"190.00"}],snapshots:{AAPL:{latestTrade:{p:190,s:100},latestQuote:{bp:189.95,ap:190.05,bs:2,as:3},dailyBar:{o:188,h:191,l:187.5,c:190,v:51234567}}}},G={account:{securitiesAccount:{accountNumber:"98765432",type:"MARGIN",currentBalances:{liquidationValue:44e3,cashBalance:25e3,buyingPower:5e4},positions:[{instrument:{symbol:"AAPL",assetType:"EQUITY"},longQuantity:100,shortQuantity:0,averagePrice:180,marketValue:19e3}]}},quotes:{AAPL:{assetMainType:"EQUITY",quote:{lastPrice:190,bidPrice:189.95,askPrice:190.05,totalVolume:51234567},reference:{description:"APPLE INC"}}}},K={account:{acctId:"U1234567",buyingpower:5e4,ledger:{USD:{currency:"USD",cashbalance:25e3,netliquidationvalue:44e3,settledcash:25e3}}},positions:[{conid:265598,contractDesc:"AAPL",assetClass:"STK",position:100,avgCost:180,mktPrice:190,mktValue:19e3,currency:"USD"}],snapshot:[{conid:265598,55:"AAPL",31:"190.00",84:"189.95",86:"190.05",87:"51234567"}]},X={snapshot:{ticker:{ticker:"AAPL",lastTrade:{p:190,s:100,x:4,t:175e16},lastQuote:{P:190.05,S:3,p:189.95,s:2,t:175e16},day:{o:188,h:191,l:187.5,c:190,v:51234567,vw:189.6}}}},Z={symbology:{9001:"AAPL"},tbbo:[{instrument_id:9001,ts_event:175e16,price:19e10,size:100,side:"B",bid_px_00:18995e7,ask_px_00:19005e7,bid_sz_00:200,ask_sz_00:300}]},J=[184,183.6,183.2,182.7,182.2,181.6,181,180.5,180,179.5,179,178.6,178.2,177.8,177.4,177,176.7,176.4,176.1,176,176.2,177.5,179,181,183,185,186.8,188.2,189.2,190],I=t=>Math.round(t*100)/100;function oe(t,e){const s=[],o=new Date(e+"T00:00:00Z");let a=0;for(;s.length<t&&a++<5e3;){const n=o.getUTCDay();n!==0&&n!==6&&s.unshift(o.toISOString().slice(0,10)),o.setUTCDate(o.getUTCDate()-1)}return s}const x=oe(J.length,"2026-06-12"),v=J.map((t,e,s)=>{const o=e===0?t:s[e-1];return{date:x[e],ms:Date.parse(x[e]+"T00:00:00Z"),open:I(o),high:I(Math.max(o,t)+.4),low:I(Math.min(o,t)-.4),close:t,volume:5e7+e*1e5}});V.history={history:{day:v.map(t=>({date:t.date,open:t.open,high:t.high,low:t.low,close:t.close,volume:t.volume}))}};z.candles={AAPL:v.map(t=>({time:t.ms,open:t.open,high:t.high,low:t.low,close:t.close,"day-volume":t.volume}))};Y.bars={AAPL:v.map(t=>({t:t.date+"T00:00:00Z",o:t.open,h:t.high,l:t.low,c:t.close,v:t.volume}))};G.priceHistory={symbol:"AAPL",candles:v.map(t=>({datetime:t.ms,open:t.open,high:t.high,low:t.low,close:t.close,volume:t.volume}))};K.historyData={symbol:"AAPL",data:v.map(t=>({t:t.ms,o:t.open,h:t.high,l:t.low,c:t.close,v:t.volume}))};X.aggregates={ticker:"AAPL",results:v.map(t=>({t:t.ms,o:t.open,h:t.high,l:t.low,c:t.close,v:t.volume}))};const P=t=>Math.round(t*1e9);Z.ohlcv=v.map(t=>({instrument_id:9001,ts_event:t.ms*1e6,open:P(t.open),high:P(t.high),low:P(t.low),close:P(t.close),volume:t.volume}));const ne=[{key:"massive",label:"massive.com",raw:X,blurb:"Polygon.io rebranded. Terse snapshot keys (lastTrade.p, lastQuote.p/P, day.v). A pure data feed: no accounts."},{key:"databento",label:"Databento",raw:Z,blurb:"Raw market data. Prices are int64 scaled by 1e-9 and symbols are numeric instrument ids resolved via a symbology map. A pure data feed: no accounts."}],h=[{key:"tradier",label:"Tradier",raw:V,blurb:"Clean flat JSON. The canonical reference shape."},{key:"tastytrade",label:"tastytrade",raw:z,blurb:"Hyphenated keys, string numbers, direction word. Quotes via DXLink WebSocket (Quote + Trade events merged)."},{key:"snaptrade",label:"SnapTrade",raw:ae,blurb:"Aggregator. Ticker nested three deep at symbol.symbol.raw_symbol. No volume on quotes."},{key:"alpaca",label:"Alpaca",raw:Y,blurb:"Every number a string. Snapshot quotes with one-letter keys (p, bp, ap, v)."},{key:"schwab",label:"Schwab",raw:G,blurb:"Everything under securitiesAccount. Size split across longQuantity / shortQuantity."},{key:"ibkr",label:"IBKR",raw:K,blurb:"Ledger keyed by currency. Market data by NUMERIC field code: 31=last, 84=bid, 86=ask, 87=volume."}];function R(t){return t.quantity?b(t.cost_basis/t.quantity,6):null}function b(t,e){const s=Math.pow(10,e);return Math.round(t*s)/s}function A(t){return{id:null,symbol:t.symbol,side:t.side,quantity:t.quantity,type:t.type??"market",status:"preview",price:t.price??null,duration:t.duration??"day",klass:t.klass??"equity"}}const d=t=>t==null?null:Number(t),g=t=>t==null?null:Math.trunc(Number(t)),C=t=>new Date(t).toISOString().slice(0,10),y=t=>t==null?null:Number(t)/1e9,re=t=>new Date(Math.floor(Number(t)/1e9)*1e3).toISOString().slice(0,10);function w(t){return new Error(`${t} is a market data feed, not a broker: no accounts, positions, or orders. Use getQuotes / getCandles.`)}class ie{constructor(e){this.raw=e,this.name="tradier"}getBalances(){const e=this.raw.balances.balances;return{total_equity:Number(e.total_equity),total_cash:Number(e.total_cash),buying_power:e.buying_power!=null?Number(e.buying_power):null,account_number:e.account_number??null}}getPositions(){let e=this.raw.positions.positions.position;return Array.isArray(e)||(e=[e]),e.map(s=>({symbol:s.symbol,quantity:Number(s.quantity),cost_basis:Number(s.cost_basis),date_acquired:s.date_acquired?String(s.date_acquired).split("T")[0]:null}))}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase()));let o=this.raw.quotes.quotes.quote;return Array.isArray(o)||(o=[o]),o.filter(a=>s.has(String(a.symbol).toUpperCase())).map(a=>({symbol:a.symbol,description:a.description??null,last:d(a.last),bid:d(a.bid),ask:d(a.ask),volume:g(a.volume)}))}getCandles(e){var s,o;return(((o=(s=this.raw.history)==null?void 0:s.history)==null?void 0:o.day)??[]).map(a=>({date:a.date,open:Number(a.open),high:Number(a.high),low:Number(a.low),close:Number(a.close),volume:Number(a.volume)}))}previewOrder(e){return A(e)}}class ce{constructor(e){this.raw=e,this.name="tastytrade"}getBalances(){const e=this.raw.balances.data;return{total_equity:Number(e["net-liquidating-value"]),total_cash:Number(e["cash-balance"]),buying_power:e["equity-buying-power"]?Number(e["equity-buying-power"]):null,account_number:e["account-number"]??null}}getPositions(){return this.raw.positions.data.items.map(e=>{let s=Number(e.quantity);String(e["quantity-direction"]??"Long").toLowerCase()==="short"&&(s=-s);const o=Number(e["average-open-price"]),a=e["created-at"]?String(e["created-at"]).split("T")[0]:null;return{symbol:e.symbol,quantity:s,cost_basis:b(s*o,6),date_acquired:a}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const[a,n]of Object.entries(this.raw.quotes)){if(!s.has(a.toUpperCase()))continue;const r=n.Quote??{},i=n.Trade??{};o.push({symbol:a,description:null,last:d(i.price),bid:d(r.bid_price),ask:d(r.ask_price),volume:g(i.day_volume)})}return o}getCandles(e){var o;return(((o=this.raw.candles)==null?void 0:o[e.toUpperCase()])??[]).map(a=>({date:C(Number(a.time)),open:Number(a.open),high:Number(a.high),low:Number(a.low),close:Number(a.close),volume:Number(a["day-volume"])}))}previewOrder(e){return A(e)}}function j(t){let e=t.symbol??t;if(e&&typeof e=="object"){if("raw_symbol"in e)return e.raw_symbol;const s=e.symbol;if(s&&typeof s=="object")return s.raw_symbol??""}return String(e)}class le{constructor(e){this.raw=e,this.name="snaptrade"}getBalances(){const e=this.raw.account,s=this.raw.balances[0];return{total_equity:Number(e.balance.total.amount),total_cash:Number(s.cash),buying_power:s.buying_power!=null?Number(s.buying_power):null,account_number:e.id??null}}getPositions(){return this.raw.positions.map(e=>{const s=Number(e.units),o=Number(e.average_purchase_price);return{symbol:j(e),quantity:s,cost_basis:b(s*o,6),date_acquired:null}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const a of this.raw.quotes){const n=j(a);if(!s.has(n.toUpperCase()))continue;let r=null;a.symbol&&typeof a.symbol=="object"&&(r=a.symbol.description??null),o.push({symbol:n,description:r,last:d(a.last_trade_price),bid:d(a.bid_price),ask:d(a.ask_price),volume:g(a.volume)})}return o}getCandles(e){return[]}previewOrder(e){return A(e)}}class de{constructor(e){this.raw=e,this.name="alpaca"}getBalances(){const e=this.raw.account;return{total_equity:Number(e.equity),total_cash:Number(e.cash),buying_power:e.buying_power!=null?Number(e.buying_power):null,account_number:e.account_number??null}}getPositions(){return this.raw.positions.map(e=>{let s=Number(e.qty);String(e.side??"long").toLowerCase()==="short"&&(s=-Math.abs(s));const o=Number(e.avg_entry_price);return{symbol:e.symbol,quantity:s,cost_basis:b(s*o,6),date_acquired:null}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const[a,n]of Object.entries(this.raw.snapshots)){if(!s.has(a.toUpperCase()))continue;const r=n.latestTrade??{},i=n.latestQuote??{},c=n.dailyBar??{};o.push({symbol:a,description:null,last:d(r.p),bid:d(i.bp),ask:d(i.ap),volume:g(c.v)})}return o}getCandles(e){var o;return(((o=this.raw.bars)==null?void 0:o[e.toUpperCase()])??[]).map(a=>({date:String(a.t).split("T")[0],open:Number(a.o),high:Number(a.h),low:Number(a.l),close:Number(a.c),volume:Number(a.v)}))}previewOrder(e){return A(e)}}class ue{constructor(e){this.raw=e,this.name="schwab"}acct(){return this.raw.account.securitiesAccount}getBalances(){const e=this.acct(),s=e.currentBalances;return{total_equity:Number(s.liquidationValue),total_cash:Number(s.cashBalance),buying_power:s.buyingPower!=null?Number(s.buyingPower):null,account_number:e.accountNumber??null}}getPositions(){return(this.acct().positions??[]).map(e=>{const s=Number(e.longQuantity??0)-Number(e.shortQuantity??0),o=Number(e.averagePrice);return{symbol:e.instrument.symbol,quantity:s,cost_basis:b(s*o,6),date_acquired:null}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const[a,n]of Object.entries(this.raw.quotes)){if(!s.has(a.toUpperCase()))continue;const r=n.quote??{},i=n.reference??{};o.push({symbol:a,description:i.description??null,last:d(r.lastPrice),bid:d(r.bidPrice),ask:d(r.askPrice),volume:g(r.totalVolume)})}return o}getCandles(e){var s;return(((s=this.raw.priceHistory)==null?void 0:s.candles)??[]).map(o=>({date:C(Number(o.datetime)),open:Number(o.open),high:Number(o.high),low:Number(o.low),close:Number(o.close),volume:Number(o.volume)}))}previewOrder(e){return A(e)}}const f={LAST:"31",BID:"84",ASK:"86",VOLUME:"87",SYMBOL:"55"},pe={K:1e3,M:1e6,B:1e9};function O(t){if(t==null)return null;let e=String(t).trim();return e&&/[a-zA-Z]/.test(e[0])&&(e=e.slice(1)),e?Number(e):null}function me(t){if(t==null)return null;const e=String(t).trim();if(!e)return null;const s=pe[e[e.length-1].toUpperCase()];return s!=null?Math.trunc(Number(e.slice(0,-1))*s):Math.trunc(Number(e))}class be{constructor(e){this.raw=e,this.name="ibkr"}getBalances(){const e=this.raw.account,s=e.ledger.USD;return{total_equity:Number(s.netliquidationvalue),total_cash:Number(s.cashbalance),buying_power:e.buyingpower!=null?Number(e.buyingpower):null,account_number:e.acctId??null}}getPositions(){return this.raw.positions.map(e=>{const s=Number(e.position),o=Number(e.avgCost);return{symbol:e.contractDesc,quantity:s,cost_basis:b(s*o,6),date_acquired:null}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const a of this.raw.snapshot){const n=String(a[f.SYMBOL]??"").toUpperCase();s.has(n)&&o.push({symbol:a[f.SYMBOL],description:null,last:O(a[f.LAST]),bid:O(a[f.BID]),ask:O(a[f.ASK]),volume:me(a[f.VOLUME])})}return o}getCandles(e){var s;return(((s=this.raw.historyData)==null?void 0:s.data)??[]).map(o=>({date:C(Number(o.t)),open:Number(o.o),high:Number(o.h),low:Number(o.l),close:Number(o.c),volume:Number(o.v)}))}previewOrder(e){return A(e)}}class he{constructor(e){this.raw=e,this.name="massive"}getBalances(){throw w("massive.com")}getPositions(){throw w("massive.com")}getQuotes(e){var i;const s=new Set(e.map(c=>c.toUpperCase())),o=(i=this.raw.snapshot)==null?void 0:i.ticker;if(!o||!s.has(String(o.ticker).toUpperCase()))return[];const a=o.lastTrade??{},n=o.lastQuote??{},r=o.day??{};return[{symbol:o.ticker,description:null,last:d(a.p),bid:d(n.p),ask:d(n.P),volume:g(r.v)}]}getCandles(e){var s;return(((s=this.raw.aggregates)==null?void 0:s.results)??[]).map(o=>({date:C(Number(o.t)),open:Number(o.o),high:Number(o.h),low:Number(o.l),close:Number(o.c),volume:Number(o.v)}))}previewOrder(e){throw w("massive.com")}}class ye{constructor(e){this.raw=e,this.name="databento"}symbology(){const e={};for(const[s,o]of Object.entries(this.raw.symbology??{}))e[Number(s)]=o;return e}getBalances(){throw w("Databento")}getPositions(){throw w("Databento")}getQuotes(e){const s=new Set(e.map(r=>r.toUpperCase())),o=this.symbology(),a={};for(const r of this.raw.ohlcv??[])a[r.instrument_id]=r.volume;const n=[];for(const r of this.raw.tbbo??[]){const i=o[r.instrument_id];!i||!s.has(i.toUpperCase())||n.push({symbol:i,description:null,last:y(r.price),bid:y(r.bid_px_00),ask:y(r.ask_px_00),volume:g(a[r.instrument_id])})}return n}getCandles(e){const s=this.symbology();let o=null;for(const[a,n]of Object.entries(s))n.toUpperCase()===e.toUpperCase()&&(o=Number(a));return(this.raw.ohlcv??[]).filter(a=>o===null||a.instrument_id===o).map(a=>({date:re(a.ts_event),open:y(a.open),high:y(a.high),low:y(a.low),close:y(a.close),volume:Number(a.volume)}))}previewOrder(e){throw w("Databento")}}const ee={tradier:ie,tastytrade:ce,snaptrade:le,alpaca:de,schwab:ue,ibkr:be,massive:he,databento:ye},ve=new Set(["massive","databento"]);function _(t,e){const s=ee[t.toLowerCase()];if(!s)throw new Error(`unknown broker '${t}'`);return new s(e)}function te(){return Object.keys(ee).filter(t=>!ve.has(t)).sort()}function ge(t){const e=t.getPositions(),s=new Map(t.getQuotes(e.map(r=>r.symbol)).map(r=>[r.symbol,r])),o=t.getBalances();let a=0;const n=[];for(const r of e){const i=s.get(r.symbol),c=i?i.last:null;if(c===null)continue;a+=c*r.quantity;const l=R(r);n.push({symbol:r.symbol,qty:r.quantity,avgPrice:l,last:c,unrealizedPnl:b((c-(l??0))*r.quantity,2),aboveCost:c>(l??0)})}return{broker:t.name,totalCash:o.total_cash,marketValue:b(a,2),signals:n}}function fe(t,e=.05){const s=t.getPositions(),o=new Map(t.getQuotes(s.map(n=>n.symbol)).map(n=>[n.symbol,n])),a=[];for(const n of s){const r=o.get(n.symbol),i=R(n);if(!r||r.last===null||i===null)continue;const c=(r.last-i)/i;c>=e&&a.push([n.symbol,n.quantity,b(c*100,1)])}return a}const we=[{who:"Bob",broker:"tastytrade",sdk:"tastytrade (async SDK)",before:`session = Session(user, pw)
account = (await Account.get(session))[0]
positions = await account.get_positions(session)   # CurrentPosition objs
sym, avg = positions[0].symbol, positions[0].average_open_price
async with DXLinkStreamer(session) as streamer:     # quotes via WebSocket
    await streamer.subscribe(Trade, [sym])
    last = (await streamer.get_event(Trade)).price`},{who:"Jim",broker:"schwab",sdk:"schwab-py",before:`c = easy_client(api_key, app_secret, callback_url, token_path)
acct_hash = c.get_account_numbers().json()[0]['hashValue']
acct = c.get_account(acct_hash, fields=[Client.Account.Fields.POSITIONS]).json()
p = acct['securitiesAccount']['positions'][0]
sym, avg = p['instrument']['symbol'], p['averagePrice']
last = c.get_quote(sym).json()[sym]['quote']['lastPrice']`},{who:"Fred",broker:"alpaca",sdk:"alpaca-py",before:`trading = TradingClient(key, secret)
data = StockHistoricalDataClient(key, secret)
p = trading.get_all_positions()[0]
sym, avg = p.symbol, float(p.avg_entry_price)        # strings on the wire
snap = data.get_stock_snapshot(StockSnapshotRequest(symbol_or_symbols=sym))
last = snap[sym].latest_trade.price`},{who:"Dana",broker:"snaptrade",sdk:"snaptrade-python-sdk",before:`st = SnapTrade(consumer_key=ck, client_id=cid)
pos = st.account_information.get_all_account_positions(
    user_id=uid, user_secret=us, account_id=aid).body
p = pos[0]
sym = p['symbol']['symbol']['raw_symbol']            # nested 3 deep
avg, last = p['average_purchase_price'], p['price']`},{who:"Will",broker:"ibkr",sdk:"ib_insync (TWS/Gateway)",before:`ib = IB(); ib.connect('127.0.0.1', 7497, clientId=1)
pos = ib.positions()[0]
sym, avg = pos.contract.symbol, pos.avgCost
[ticker] = ib.reqTickers(Stock(sym, 'SMART', 'USD'))
last = ticker.last`}],_e=`positions = broker.get_positions()
quotes = {q.symbol: q for q in broker.get_quotes([p.symbol for p in positions])}
for p in positions:
    gain = (quotes[p.symbol].last - p.avg_price) / p.avg_price
    if gain >= threshold:
        flag(p.symbol, p.quantity, gain)   # same math, any broker`;function H(t,e){const s=t.length,o=new Array(s).fill(NaN);if(e<=0||s<e)return o;const a=2/(e+1);let n=0;for(let i=0;i<e;i++)n+=t[i];let r=n/e;o[e-1]=r;for(let i=e;i<s;i++)r=a*t[i]+(1-a)*r,o[i]=r;return o}function ke(t,e,s){if(s<1)return!1;const o=a=>!Number.isNaN(a);return!o(t[s])||!o(e[s])||!o(t[s-1])||!o(e[s-1])?!1:t[s]>e[s]&&t[s-1]<=e[s-1]}function Ae(t,e,s){if(s<1)return!1;const o=a=>!Number.isNaN(a);return!o(t[s])||!o(e[s])||!o(t[s-1])||!o(e[s-1])?!1:t[s]<e[s]&&t[s-1]>=e[s-1]}function D(t,e=8,s=21){const o=t.map(p=>p.close),a=t.map(p=>p.date),n=H(o,e),r=H(o,s);let i=-1,c=null;for(let p=1;p<o.length;p++)ke(n,r,p)?(i=p,c="golden"):Ae(n,r,p)&&(i=p,c="death");const l=o.length-1;let S="FLAT";!Number.isNaN(n[l])&&!Number.isNaN(r[l])&&(S=n[l]>=r[l]?"BULLISH":"BEARISH");let T="HOLD";i===l&&(T=c==="golden"?"BUY":"SELL");const N=i>=0?l-i:null;return{fast:e,slow:s,closes:o,dates:a,emaFast:n,emaSlow:r,signal:T,stance:S,crossIndex:i,crossType:c,barsSinceCross:N}}const Se=`# EMA momentum crossover. Fast 8 over slow 21.
# Math is Michael's mur quantlab: Pine-seeded EMA + ta.crossover.
ema_fast = ema(closes, 8)
ema_slow = ema(closes, 21)
if crossover(ema_fast, ema_slow):   # golden cross
    signal = "BUY"
elif crossunder(ema_fast, ema_slow):  # death cross
    signal = "SELL"
# closes come from broker.get_candles(symbol) -> identical on every broker`,M="https://github.com/mphinance/traderdaddy-bridge";function u(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const Q=3;function k(t,e=0){const s="  ".repeat(e),o="  ".repeat(e+1);if(t===null)return'<span class="j-null">null</span>';if(typeof t=="number")return`<span class="j-num">${t}</span>`;if(typeof t=="boolean")return`<span class="j-bool">${t}</span>`;if(typeof t=="string")return`<span class="j-str">"${u(t)}"</span>`;if(Array.isArray(t)){if(t.length===0)return"[]";const c=(t.length>Q?t.slice(0,2):t).map(l=>o+k(l,e+1));return t.length>Q&&c.push(`${o}<span class="j-null">... ${t.length-2} more (${t.length} total)</span>`),`[
${c.join(`,
`)}
${s}]`}const a=t,n=Object.keys(a);return n.length===0?"{}":`{
${n.map(i=>`${o}<span class="j-key">"${u(i)}"</span>: ${k(a[i],e+1)}`).join(`,
`)}
${s}}`}function $e(t){const e=h.find(r=>r.key===t),s=_(t,e.raw),o=s.getBalances(),a=s.getPositions().map(r=>({symbol:r.symbol,quantity:r.quantity,cost_basis:r.cost_basis,avg_price:R(r),date_acquired:r.date_acquired})),n=s.getQuotes(["AAPL"]);return{balance:o,positions:a,quotes:n}}const Te="http://localhost:8787/api/live?symbol=AAPL";function Ne(){return`
  <section id="live">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Live, read-only</div>
        <h2>Read a real Tradier account through the same adapter.</h2>
        <p>Everything above runs on sample data. This reads a real Tradier account live, balances, positions, quotes, and candles, mapped by the exact same canonical adapter. It runs against a local read-only backend (your token never leaves your machine, orders are never called). Start it with <code>python -m server.live_tradier</code>, then connect.</p>
      </div>
      <div style="display:flex;gap:0.8rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
        <button class="btn btn-primary" id="live-btn">Connect live (local backend)</button>
        <span id="live-status" style="font-size:0.85rem;color:var(--fg-3)"></span>
      </div>
      <div id="live-result"></div>
    </div>
  </section>`}function W(t){return`<div class="note"><b>Backend not reachable.</b> ${u(t)}<br/>Start the local read-only server from the repo root, then click Connect:
    <pre class="code" style="margin-top:0.6rem">BRIDGE_SECRETS=/path/to/secrets.env python -m server.live_tradier</pre></div>`}function qe(t){var n,r;const e=((n=t.momentum)==null?void 0:n.stance)==="BULLISH"?"var(--bull-bright)":((r=t.momentum)==null?void 0:r.stance)==="BEARISH"?"var(--bear-bright)":"var(--fg-3)",s=(t.positions??[]).map(i=>{var c,l;return`<div class="strip-row"><div class="strip-broker">${u(i.symbol)}</div><div class="strip-data">${i.quantity} @ avg ${((l=(c=i.avg_price)==null?void 0:c.toFixed)==null?void 0:l.call(c,2))??i.avg_price} &middot; cost $${Number(i.cost_basis).toLocaleString()}</div></div>`}).join(""),o=(t.quotes??[])[0],a=t.momentum;return`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" class="strat-grid">
      <div class="card">
        <div class="panel-label"><span><span class="live-dot"></span> LIVE &middot; ${u(t.source)}</span><span>acct ${u(t.account??"n/a")}</span></div>
        <div style="font-family:var(--font-mono);font-size:0.9rem;line-height:1.9">
          <div>total equity <span class="j-num">$${Number(t.balance.total_equity).toLocaleString()}</span></div>
          <div>total cash <span class="j-num">$${Number(t.balance.total_cash).toLocaleString()}</span></div>
          ${o?`<div>${u(o.symbol)} last <span class="j-num">${o.last}</span> &middot; bid ${o.bid} &middot; ask ${o.ask}</div>`:""}
          ${a?`<div style="margin-top:0.4rem">momentum EMA ${a.fast}/${a.slow}: <span style="color:${e};font-weight:700">${a.stance}</span> &middot; ${a.cross_type??"no"} cross ${a.bars_since_cross!=null?a.bars_since_cross+" bars ago":""} &middot; ${t.candle_count} bars</div>`:""}
        </div>
      </div>
      <div class="strip">
        <div class="strip-row" style="background:rgba(59,130,246,0.06)"><div class="strip-broker" style="color:var(--fg-4);font-size:0.7rem;letter-spacing:0.08em">CANONICAL POSITIONS (LIVE)</div><div></div></div>
        ${s||'<div class="strip-row"><div class="strip-data" style="color:var(--fg-4)">no open positions</div></div>'}
      </div>
    </div>`}async function Le(){const t=document.querySelector("#live-status"),e=document.querySelector("#live-result");t.textContent="connecting...";try{const s=await fetch(Te,{cache:"no-store"}),o=await s.json();if(!s.ok||o.error){t.textContent="",e.innerHTML=W(o.detail||o.error||`HTTP ${s.status}`);return}t.textContent="connected, read-only",e.innerHTML=qe(o)}catch(s){t.textContent="",e.innerHTML=W(String(s))}}function Pe(){return`
  <section id="transform">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Live transform</div>
        <h2>Six native shapes in. One Tradier shape out.</h2>
        <p>Pick a broker. The left is the raw payload that broker actually returns, verified against its docs. The right is what your code sees after the adapter runs: the canonical, Tradier-shaped object. The transform is real TypeScript running in your browser, not a recording.</p>
      </div>
      <div class="pills" id="pills">
        ${h.map((t,e)=>`<button class="pill ${e===0?"active":""}" data-broker="${t.key}">${t.label}</button>`).join("")}
      </div>
      <div class="transformer">
        <div class="card">
          <div class="panel-label"><span class="tag-native">Native payload</span><span id="native-name"></span></div>
          <pre class="code" id="native"></pre>
        </div>
        <div class="arrow-col"><span class="glyph">&#10142;</span></div>
        <div class="card">
          <div class="panel-label"><span class="tag-canon">Canonical (Tradier shape)</span><span>contract.ts</span></div>
          <pre class="code" id="canon"></pre>
        </div>
      </div>
      <div class="blurb" id="blurb"></div>
    </div>
  </section>`}function F(t){const e=h.find(s=>s.key===t);document.querySelector("#native-name").textContent=e.label,document.querySelector("#native").innerHTML=k(e.raw),document.querySelector("#canon").innerHTML=k($e(t)),document.querySelector("#blurb").innerHTML=`<b>${e.label}:</b> ${u(e.blurb)}`,document.querySelectorAll("#pills .pill").forEach(s=>{s.classList.toggle("active",s.dataset.broker===t)})}function Ce(){return`
  <section id="proof">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Conformance</div>
        <h2>The same algo, every broker, identical result.</h2>
        <p>One read-only momentum check runs against all six brokers with zero code changes. Every divergent payload collapses to the same canonical answer: AAPL 100 @ avg 180, last 190, unrealized PnL $1,000. The algo never moves.</p>
      </div>
      <div class="strip">${te().map(e=>{var r,i;const s=h.find(c=>c.key===e),o=ge(_(e,s.raw)),a=o.signals[0],n=`cash $${o.totalCash.toLocaleString()}  ${a.symbol} ${a.qty} @ avg ${(r=a.avgPrice)==null?void 0:r.toFixed(2)} last ${(i=a.last)==null?void 0:i.toFixed(2)}  uPnL $${a.unrealizedPnl.toLocaleString()}`;return`<div class="strip-row"><div class="strip-broker">${s.label}</div><div class="strip-data"><span class="chk">&#10003;</span> ${n}</div></div>`}).join("")}</div>
    </div>
  </section>`}function Ee(t){const i=t.closes.length,c=[...t.closes,...t.emaFast,...t.emaSlow].filter(m=>!Number.isNaN(m)),l=Math.min(...c),S=Math.max(...c),T=S-l||1,N=m=>10+m*1020/(i-1),p=m=>18+(S-m)/T*254,E=(m,B,q)=>{const $=m.map((L,se)=>Number.isNaN(L)?null:`${N(se).toFixed(1)},${p(L).toFixed(1)}`).filter(Boolean).join(" ");return`<polyline fill="none" stroke="${B}" stroke-width="${q}" points="${$}" />`};let U="";if(t.crossIndex>=0){const m=N(t.crossIndex),B=p(t.emaSlow[t.crossIndex]),q=t.crossType==="golden",$=q?"#10b981":"#ef4444",L=Math.min(m+8,920);U=`
      <line x1="${m}" y1="18" x2="${m}" y2="272" stroke="${$}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
      <circle cx="${m}" cy="${B}" r="5" fill="${$}" />
      <text x="${L}" y="30" fill="${$}" font-family="Space Mono, monospace" font-size="12" font-weight="700">${q?"GOLDEN CROSS":"DEATH CROSS"}</text>`}return`
    <svg viewBox="0 0 1040 300" width="100%" role="img" aria-label="EMA crossover chart">
      ${E(t.closes,"#93c5fd",1.5)}
      ${E(t.emaSlow,"#a855f7",2)}
      ${E(t.emaFast,"#f59e0b",2)}
      ${U}
    </svg>`}function Be(){const t=_("tradier",h.find(n=>n.key==="tradier").raw),e=D(t.getCandles("AAPL")),s=e.stance==="BULLISH"?"var(--bull-bright)":e.stance==="BEARISH"?"var(--bear-bright)":"var(--fg-3)",o=e.crossIndex>=0?`${e.crossType==="golden"?"Golden cross":"Death cross"} ${e.barsSinceCross===0?"on the latest bar":`${e.barsSinceCross} bars ago`}`:"no cross in window",a=te().map(n=>{const r=h.find(l=>l.key===n),i=_(n,r.raw).getCandles("AAPL");if(i.length===0)return`<div class="strip-row"><div class="strip-broker">${r.label}</div><div class="strip-data" style="color:var(--fg-4)">no history endpoint (aggregator) &middot; quotes + positions only</div></div>`;const c=D(i);return`<div class="strip-row"><div class="strip-broker">${r.label}</div><div class="strip-data"><span class="chk">&#10003;</span> ${c.stance} &middot; ${c.crossType??"no"} cross &middot; ${i.length} bars</div></div>`}).join("");return`
  <section id="strategy">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Real strategy</div>
        <h2>A momentum crossover, running on every broker.</h2>
        <p>An EMA 8 over EMA 21 crossover. The exact math is Michael's mur quantlab: a Pine-seeded EMA and ta.crossover semantics. It is written once against the canonical candle shape, so it runs identically on any broker that serves history. SnapTrade, an aggregator with no history endpoint, is shown honestly as unsupported for candle strategies.</p>
      </div>
      <div class="card">
        <div class="panel-label">
          <span>AAPL daily &middot; EMA 8 (<span style="color:var(--gold)">gold</span>) vs EMA 21 (<span style="color:var(--purple)">purple</span>) &middot; close (<span style="color:var(--blue-300)">blue</span>)</span>
          <span style="color:${s};font-weight:700">${e.stance} &middot; ${o}</span>
        </div>
        ${Ee(e)}
      </div>
      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:1rem;margin-top:1rem" class="strat-grid">
        <div class="card">
          <div class="panel-label"><span class="tag-canon">The strategy, written once</span></div>
          <pre class="code">${u(Se)}</pre>
        </div>
        <div class="strip">${a}</div>
      </div>
    </div>
  </section>`}function Ie(){return`
  <section id="feeds">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Beyond brokers</div>
        <h2>Market data feeds, the same Tradier shape.</h2>
        <p>The contract is not just for brokers. massive.com (Polygon.io rebranded) and Databento are pure market-data feeds with no accounts. They map quotes and daily candles into the exact same canonical shapes, so Tradier becomes the market-data lingua franca too, not only the broker one. Databento is the most divergent source here: prices are int64 scaled by 1e-9 and symbols are numeric instrument ids. Both still collapse to the identical canonical quote and the identical 30-bar candle series the brokers produce.</p>
      </div>
      ${ne.map(e=>{const s=_(e.key,e.raw),o=s.getQuotes(["AAPL"])[0],a=s.getCandles("AAPL"),n=D(a),r=n.stance==="BULLISH"?"var(--bull-bright)":n.stance==="BEARISH"?"var(--bear-bright)":"var(--fg-3)";return`
      <div style="margin-bottom:1.4rem">
        <div class="transformer">
          <div class="card">
            <div class="panel-label"><span class="tag-native">Native payload</span><span>${u(e.label)}</span></div>
            <pre class="code">${k(e.raw)}</pre>
          </div>
          <div class="arrow-col"><span class="glyph">&#10142;</span></div>
          <div class="card">
            <div class="panel-label"><span class="tag-canon">Canonical (Tradier shape)</span><span>quotes + candles</span></div>
            <pre class="code">${k({quote:o,candles:a})}</pre>
          </div>
        </div>
        <div class="blurb"><b>${e.label}:</b> ${u(e.blurb)} Maps to AAPL last ${o.last} / bid ${o.bid} / ask ${o.ask}, ${a.length} canonical candles, momentum <span style="color:${r};font-weight:700">${n.stance}</span> (${n.crossType??"no"} cross). No accounts: a data feed, so balances, positions, and orders raise by design.</div>
      </div>`}).join("")}
    </div>
  </section>`}function Oe(){const t=we.map(e=>{const s=h.find(n=>n.key===e.broker),a=fe(_(e.broker,s.raw)).map(n=>`${n[0]} x${n[1]} +${n[2]}%`).join(", ");return`
      <div class="card person">
        <h4>${e.who} <span style="color:var(--fg-4);font-weight:400">on ${s.label}</span></h4>
        <div class="meta">${u(e.sdk)}</div>
        <pre class="code">${u(e.before)}</pre>
        <div class="result">converted &#10142; trim: [ ${u(a)} ]</div>
      </div>`}).join("");return`
  <section id="onboard">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Onboarding</div>
        <h2>Their code, pointed at your contract.</h2>
        <p>Five traders, five brokers, five SDKs, one strategy welded to each broker. Onboarding is mechanical: write one adapter, swap the data-access lines for the canonical contract, leave the strategy math untouched. Every one of them then runs the identical algo below, and it runs on Tradier.</p>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <div class="panel-label"><span class="tag-canon">The one canonical algo they all converge on</span></div>
        <pre class="code">${u(_e)}</pre>
      </div>
      <div class="people">${t}</div>
    </div>
  </section>`}function Me(){const t=[{t:"Broker API",s:"native shape"},{t:"Adapter",s:"one file per broker"},{t:"Canonical",s:"Tradier contract"},{t:"Your algo / agent",s:"written once"}];return`
  <section id="how">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">How it flows</div>
        <h2>One pipe, any broker on the front.</h2>
        <p>Swap the broker at the front and nothing downstream changes. The adapter is the only broker-aware code in the system.</p>
      </div>
      <div class="pipe">${t.map((s,o)=>{const a=`<div class="pipe-node"><div class="n-title">${s.t}</div><div class="n-sub">${s.s}</div></div>`,n=o<t.length-1?'<div class="pipe-arrow">&#10142;</div>':"";return a+n}).join("")}</div>
    </div>
  </section>`}function De(){return`
  <section id="features">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Why Tradier-shaped</div>
        <h2>The easiest API becomes the standard.</h2>
        <p>Other brokers map INTO Tradier, so their users adopt Tradier-native tooling and migrate toward Tradier. Tradier becomes the lingua franca, the API every developer learns first.</p>
      </div>
      <div class="feat-grid">${[{ico:"&#128279;",h:"Six brokers, plus data feeds",p:"Tradier, tastytrade, Schwab, Alpaca, SnapTrade, IBKR, plus market-data feeds massive.com and Databento on the quote and candle side. Shapes verified against each provider's official docs."},{ico:"&#9889;",h:"One file per broker",p:"Adding a broker is a single adapter mapping its native responses into the contract. Nothing downstream changes."},{ico:"&#129302;",h:"Agent-ready",p:"The canonical layer makes a Tradier-shaped MCP broker-agnostic. One tool vocabulary, every broker, every agent."},{ico:"&#128274;",h:"Read-first, preview-only",p:"Reads are the universal surface. Order placement previews by design. Live execution is opt-in per adapter and never automatic."}].map(s=>`<div class="card feat"><div class="ico">${s.ico}</div><h4>${s.h}</h4><p>${s.p}</p></div>`).join("")}</div>
    </div>
  </section>`}function Re(){const t=document.querySelector("#app");t.innerHTML=`
    <nav class="nav">
      <div class="wrap nav-inner">
        <div class="brand"><span class="mark"></span> TraderDaddy <span style="color:var(--blue-300)">Bridge</span></div>
        <div class="nav-links">
          <a href="#transform">Transform</a>
          <a href="#live">Live</a>
          <a href="#proof">Conformance</a>
          <a href="#strategy">Strategy</a>
          <a href="#feeds">Feeds</a>
          <a href="#onboard">Onboard</a>
          <a href="#how">How</a>
          <a href="${M}">GitHub</a>
        </div>
      </div>
    </nav>

    <header class="hero">
      <div class="wrap">
        <span class="eyebrow"><span class="live-dot"></span> Universal broker adapter</span>
        <h1>Every broker, one<br /><span class="grad">Tradier-shaped contract</span></h1>
        <p class="sub">Write an algo once. Run it on any broker. Adding a broker is one file, not a rewrite. Tradier's API is the cleanest in the business, so it becomes the contract every other broker maps into.</p>
        <div class="cta-row">
          <button class="btn btn-primary" onclick="document.querySelector('#transform').scrollIntoView({behavior:'smooth'})">See the transform</button>
          <a class="btn btn-ghost" href="${M}">View on GitHub</a>
        </div>
      </div>
    </header>

    ${Pe()}
    ${Ne()}
    ${Ce()}
    ${Be()}
    ${Ie()}
    ${Oe()}
    ${Me()}
    ${De()}

    <section>
      <div class="wrap">
        <div class="note">
          <b>Honest status.</b> This is a working proof, not a live trading library. The canonical contract, all six adapters, and every transform you see above are real TypeScript running on doc-verified sample payloads. What is not wired yet: live authenticated REST calls to each broker. That step needs your credentials and a backend host, and is deliberately kept out of a static site. The mapping logic is done; the live transport is the next step.
        </div>
      </div>
    </section>

    <footer>
      <div class="wrap">
        TraderDaddy Bridge &middot; built on the Tradier canonical contract &middot;
        <a href="${M}">github.com/mphinance/traderdaddy-bridge</a><br />
        Equities and options &middot; reads universal, orders preview-only &middot; no em dashes were harmed
      </div>
    </footer>
  `,document.querySelector("#pills").addEventListener("click",e=>{const s=e.target.closest(".pill");s!=null&&s.dataset.broker&&F(s.dataset.broker)}),document.querySelector("#live-btn").addEventListener("click",Le),F(h[0].key)}Re();
