(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))o(a);new MutationObserver(a=>{for(const r of a)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&o(n)}).observe(document,{childList:!0,subtree:!0});function s(a){const r={};return a.integrity&&(r.integrity=a.integrity),a.referrerPolicy&&(r.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?r.credentials="include":a.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(a){if(a.ep)return;a.ep=!0;const r=s(a);fetch(a.href,r)}})();const Q={balances:{balances:{account_number:"VA000001",total_equity:44e3,total_cash:25e3,buying_power:5e4}},positions:{positions:{position:[{symbol:"AAPL",quantity:100,cost_basis:18e3,date_acquired:"2026-01-05T00:00:00.000Z"}]}},quotes:{quotes:{quote:{symbol:"AAPL",description:"Apple Inc",last:190,bid:189.95,ask:190.05,volume:51234567}}}},V={balances:{data:{"account-number":"5WX12345","net-liquidating-value":"44000.00","cash-balance":"25000.00","equity-buying-power":"50000.00"}},positions:{data:{items:[{symbol:"AAPL","instrument-type":"Equity",quantity:"100","quantity-direction":"Long","average-open-price":"180.00","created-at":"2026-01-05T14:30:00.000Z"}]}},quotes:{AAPL:{Quote:{event_symbol:"AAPL",bid_price:"189.95",ask_price:"190.05",bid_size:"200",ask_size:"300"},Trade:{event_symbol:"AAPL",price:"190.00",day_volume:"51234567"}}}},Z={account:{id:"snap-abc-123",balance:{total:{amount:44e3,currency:"USD"}}},balances:[{currency:{code:"USD",name:"US Dollar"},cash:25e3,buying_power:5e4}],positions:[{symbol:{symbol:{raw_symbol:"AAPL",description:"Apple Inc."}},units:100,price:190,average_purchase_price:180}],quotes:[{symbol:{raw_symbol:"AAPL",description:"Apple Inc."},last_trade_price:190,bid_price:189.95,ask_price:190.05}]},W={account:{account_number:"PA0ABCDEFGHI",equity:"44000",cash:"25000",buying_power:"50000",portfolio_value:"44000"},positions:[{symbol:"AAPL",qty:"100",side:"long",avg_entry_price:"180.00",cost_basis:"18000",market_value:"19000",current_price:"190.00"}],snapshots:{AAPL:{latestTrade:{p:190,s:100},latestQuote:{bp:189.95,ap:190.05,bs:2,as:3},dailyBar:{o:188,h:191,l:187.5,c:190,v:51234567}}}},F={account:{securitiesAccount:{accountNumber:"98765432",type:"MARGIN",currentBalances:{liquidationValue:44e3,cashBalance:25e3,buyingPower:5e4},positions:[{instrument:{symbol:"AAPL",assetType:"EQUITY"},longQuantity:100,shortQuantity:0,averagePrice:180,marketValue:19e3}]}},quotes:{AAPL:{assetMainType:"EQUITY",quote:{lastPrice:190,bidPrice:189.95,askPrice:190.05,totalVolume:51234567},reference:{description:"APPLE INC"}}}},z={account:{acctId:"U1234567",buyingpower:5e4,ledger:{USD:{currency:"USD",cashbalance:25e3,netliquidationvalue:44e3,settledcash:25e3}}},positions:[{conid:265598,contractDesc:"AAPL",assetClass:"STK",position:100,avgCost:180,mktPrice:190,mktValue:19e3,currency:"USD"}],snapshot:[{conid:265598,55:"AAPL",31:"190.00",84:"189.95",86:"190.05",87:"51234567"}]},G=[184,183.6,183.2,182.7,182.2,181.6,181,180.5,180,179.5,179,178.6,178.2,177.8,177.4,177,176.7,176.4,176.1,176,176.2,177.5,179,181,183,185,186.8,188.2,189.2,190],P=t=>Math.round(t*100)/100;function J(t,e){const s=[],o=new Date(e+"T00:00:00Z");let a=0;for(;s.length<t&&a++<5e3;){const r=o.getUTCDay();r!==0&&r!==6&&s.unshift(o.toISOString().slice(0,10)),o.setUTCDate(o.getUTCDate()-1)}return s}const M=J(G.length,"2026-06-12"),_=G.map((t,e,s)=>{const o=e===0?t:s[e-1];return{date:M[e],ms:Date.parse(M[e]+"T00:00:00Z"),open:P(o),high:P(Math.max(o,t)+.4),low:P(Math.min(o,t)-.4),close:t,volume:5e7+e*1e5}});Q.history={history:{day:_.map(t=>({date:t.date,open:t.open,high:t.high,low:t.low,close:t.close,volume:t.volume}))}};V.candles={AAPL:_.map(t=>({time:t.ms,open:t.open,high:t.high,low:t.low,close:t.close,"day-volume":t.volume}))};W.bars={AAPL:_.map(t=>({t:t.date+"T00:00:00Z",o:t.open,h:t.high,l:t.low,c:t.close,v:t.volume}))};F.priceHistory={symbol:"AAPL",candles:_.map(t=>({datetime:t.ms,open:t.open,high:t.high,low:t.low,close:t.close,volume:t.volume}))};z.historyData={symbol:"AAPL",data:_.map(t=>({t:t.ms,o:t.open,h:t.high,l:t.low,c:t.close,v:t.volume}))};const y=[{key:"tradier",label:"Tradier",raw:Q,blurb:"Clean flat JSON. The canonical reference shape."},{key:"tastytrade",label:"tastytrade",raw:V,blurb:"Hyphenated keys, string numbers, direction word. Quotes via DXLink WebSocket (Quote + Trade events merged)."},{key:"snaptrade",label:"SnapTrade",raw:Z,blurb:"Aggregator. Ticker nested three deep at symbol.symbol.raw_symbol. No volume on quotes."},{key:"alpaca",label:"Alpaca",raw:W,blurb:"Every number a string. Snapshot quotes with one-letter keys (p, bp, ap, v)."},{key:"schwab",label:"Schwab",raw:F,blurb:"Everything under securitiesAccount. Size split across longQuantity / shortQuantity."},{key:"ibkr",label:"IBKR",raw:z,blurb:"Ledger keyed by currency. Market data by NUMERIC field code: 31=last, 84=bid, 86=ask, 87=volume."}];function I(t){return t.quantity?b(t.cost_basis/t.quantity,6):null}function b(t,e){const s=Math.pow(10,e);return Math.round(t*s)/s}function v(t){return{id:null,symbol:t.symbol,side:t.side,quantity:t.quantity,type:t.type??"market",status:"preview",price:t.price??null,duration:t.duration??"day",klass:t.klass??"equity"}}const d=t=>t==null?null:Number(t),k=t=>t==null?null:Math.trunc(Number(t)),B=t=>new Date(t).toISOString().slice(0,10);class ee{constructor(e){this.raw=e,this.name="tradier"}getBalances(){const e=this.raw.balances.balances;return{total_equity:Number(e.total_equity),total_cash:Number(e.total_cash),buying_power:e.buying_power!=null?Number(e.buying_power):null,account_number:e.account_number??null}}getPositions(){let e=this.raw.positions.positions.position;return Array.isArray(e)||(e=[e]),e.map(s=>({symbol:s.symbol,quantity:Number(s.quantity),cost_basis:Number(s.cost_basis),date_acquired:s.date_acquired?String(s.date_acquired).split("T")[0]:null}))}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase()));let o=this.raw.quotes.quotes.quote;return Array.isArray(o)||(o=[o]),o.filter(a=>s.has(String(a.symbol).toUpperCase())).map(a=>({symbol:a.symbol,description:a.description??null,last:d(a.last),bid:d(a.bid),ask:d(a.ask),volume:k(a.volume)}))}getCandles(e){var s,o;return(((o=(s=this.raw.history)==null?void 0:s.history)==null?void 0:o.day)??[]).map(a=>({date:a.date,open:Number(a.open),high:Number(a.high),low:Number(a.low),close:Number(a.close),volume:Number(a.volume)}))}previewOrder(e){return v(e)}}class te{constructor(e){this.raw=e,this.name="tastytrade"}getBalances(){const e=this.raw.balances.data;return{total_equity:Number(e["net-liquidating-value"]),total_cash:Number(e["cash-balance"]),buying_power:e["equity-buying-power"]?Number(e["equity-buying-power"]):null,account_number:e["account-number"]??null}}getPositions(){return this.raw.positions.data.items.map(e=>{let s=Number(e.quantity);String(e["quantity-direction"]??"Long").toLowerCase()==="short"&&(s=-s);const o=Number(e["average-open-price"]),a=e["created-at"]?String(e["created-at"]).split("T")[0]:null;return{symbol:e.symbol,quantity:s,cost_basis:b(s*o,6),date_acquired:a}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const[a,r]of Object.entries(this.raw.quotes)){if(!s.has(a.toUpperCase()))continue;const n=r.Quote??{},i=r.Trade??{};o.push({symbol:a,description:null,last:d(i.price),bid:d(n.bid_price),ask:d(n.ask_price),volume:k(i.day_volume)})}return o}getCandles(e){var o;return(((o=this.raw.candles)==null?void 0:o[e.toUpperCase()])??[]).map(a=>({date:B(Number(a.time)),open:Number(a.open),high:Number(a.high),low:Number(a.low),close:Number(a.close),volume:Number(a["day-volume"])}))}previewOrder(e){return v(e)}}function R(t){let e=t.symbol??t;if(e&&typeof e=="object"){if("raw_symbol"in e)return e.raw_symbol;const s=e.symbol;if(s&&typeof s=="object")return s.raw_symbol??""}return String(e)}class se{constructor(e){this.raw=e,this.name="snaptrade"}getBalances(){const e=this.raw.account,s=this.raw.balances[0];return{total_equity:Number(e.balance.total.amount),total_cash:Number(s.cash),buying_power:s.buying_power!=null?Number(s.buying_power):null,account_number:e.id??null}}getPositions(){return this.raw.positions.map(e=>{const s=Number(e.units),o=Number(e.average_purchase_price);return{symbol:R(e),quantity:s,cost_basis:b(s*o,6),date_acquired:null}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const a of this.raw.quotes){const r=R(a);if(!s.has(r.toUpperCase()))continue;let n=null;a.symbol&&typeof a.symbol=="object"&&(n=a.symbol.description??null),o.push({symbol:r,description:n,last:d(a.last_trade_price),bid:d(a.bid_price),ask:d(a.ask_price),volume:k(a.volume)})}return o}getCandles(e){return[]}previewOrder(e){return v(e)}}class ae{constructor(e){this.raw=e,this.name="alpaca"}getBalances(){const e=this.raw.account;return{total_equity:Number(e.equity),total_cash:Number(e.cash),buying_power:e.buying_power!=null?Number(e.buying_power):null,account_number:e.account_number??null}}getPositions(){return this.raw.positions.map(e=>{let s=Number(e.qty);String(e.side??"long").toLowerCase()==="short"&&(s=-Math.abs(s));const o=Number(e.avg_entry_price);return{symbol:e.symbol,quantity:s,cost_basis:b(s*o,6),date_acquired:null}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const[a,r]of Object.entries(this.raw.snapshots)){if(!s.has(a.toUpperCase()))continue;const n=r.latestTrade??{},i=r.latestQuote??{},c=r.dailyBar??{};o.push({symbol:a,description:null,last:d(n.p),bid:d(i.bp),ask:d(i.ap),volume:k(c.v)})}return o}getCandles(e){var o;return(((o=this.raw.bars)==null?void 0:o[e.toUpperCase()])??[]).map(a=>({date:String(a.t).split("T")[0],open:Number(a.o),high:Number(a.h),low:Number(a.l),close:Number(a.c),volume:Number(a.v)}))}previewOrder(e){return v(e)}}class oe{constructor(e){this.raw=e,this.name="schwab"}acct(){return this.raw.account.securitiesAccount}getBalances(){const e=this.acct(),s=e.currentBalances;return{total_equity:Number(s.liquidationValue),total_cash:Number(s.cashBalance),buying_power:s.buyingPower!=null?Number(s.buyingPower):null,account_number:e.accountNumber??null}}getPositions(){return(this.acct().positions??[]).map(e=>{const s=Number(e.longQuantity??0)-Number(e.shortQuantity??0),o=Number(e.averagePrice);return{symbol:e.instrument.symbol,quantity:s,cost_basis:b(s*o,6),date_acquired:null}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const[a,r]of Object.entries(this.raw.quotes)){if(!s.has(a.toUpperCase()))continue;const n=r.quote??{},i=r.reference??{};o.push({symbol:a,description:i.description??null,last:d(n.lastPrice),bid:d(n.bidPrice),ask:d(n.askPrice),volume:k(n.totalVolume)})}return o}getCandles(e){var s;return(((s=this.raw.priceHistory)==null?void 0:s.candles)??[]).map(o=>({date:B(Number(o.datetime)),open:Number(o.open),high:Number(o.high),low:Number(o.low),close:Number(o.close),volume:Number(o.volume)}))}previewOrder(e){return v(e)}}const h={LAST:"31",BID:"84",ASK:"86",VOLUME:"87",SYMBOL:"55"},re={K:1e3,M:1e6,B:1e9};function C(t){if(t==null)return null;let e=String(t).trim();return e&&/[a-zA-Z]/.test(e[0])&&(e=e.slice(1)),e?Number(e):null}function ne(t){if(t==null)return null;const e=String(t).trim();if(!e)return null;const s=re[e[e.length-1].toUpperCase()];return s!=null?Math.trunc(Number(e.slice(0,-1))*s):Math.trunc(Number(e))}class ie{constructor(e){this.raw=e,this.name="ibkr"}getBalances(){const e=this.raw.account,s=e.ledger.USD;return{total_equity:Number(s.netliquidationvalue),total_cash:Number(s.cashbalance),buying_power:e.buyingpower!=null?Number(e.buyingpower):null,account_number:e.acctId??null}}getPositions(){return this.raw.positions.map(e=>{const s=Number(e.position),o=Number(e.avgCost);return{symbol:e.contractDesc,quantity:s,cost_basis:b(s*o,6),date_acquired:null}})}getQuotes(e){const s=new Set(e.map(a=>a.toUpperCase())),o=[];for(const a of this.raw.snapshot){const r=String(a[h.SYMBOL]??"").toUpperCase();s.has(r)&&o.push({symbol:a[h.SYMBOL],description:null,last:C(a[h.LAST]),bid:C(a[h.BID]),ask:C(a[h.ASK]),volume:ne(a[h.VOLUME])})}return o}getCandles(e){var s;return(((s=this.raw.historyData)==null?void 0:s.data)??[]).map(o=>({date:B(Number(o.t)),open:Number(o.o),high:Number(o.h),low:Number(o.l),close:Number(o.c),volume:Number(o.v)}))}previewOrder(e){return v(e)}}const Y={tradier:ee,tastytrade:te,snaptrade:se,alpaca:ae,schwab:oe,ibkr:ie};function w(t,e){const s=Y[t.toLowerCase()];if(!s)throw new Error(`unknown broker '${t}'`);return new s(e)}function K(){return Object.keys(Y).sort()}function ce(t){const e=t.getPositions(),s=new Map(t.getQuotes(e.map(n=>n.symbol)).map(n=>[n.symbol,n])),o=t.getBalances();let a=0;const r=[];for(const n of e){const i=s.get(n.symbol),c=i?i.last:null;if(c===null)continue;a+=c*n.quantity;const l=I(n);r.push({symbol:n.symbol,qty:n.quantity,avgPrice:l,last:c,unrealizedPnl:b((c-(l??0))*n.quantity,2),aboveCost:c>(l??0)})}return{broker:t.name,totalCash:o.total_cash,marketValue:b(a,2),signals:r}}function le(t,e=.05){const s=t.getPositions(),o=new Map(t.getQuotes(s.map(r=>r.symbol)).map(r=>[r.symbol,r])),a=[];for(const r of s){const n=o.get(r.symbol),i=I(r);if(!n||n.last===null||i===null)continue;const c=(n.last-i)/i;c>=e&&a.push([r.symbol,r.quantity,b(c*100,1)])}return a}const de=[{who:"Bob",broker:"tastytrade",sdk:"tastytrade (async SDK)",before:`session = Session(user, pw)
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
last = ticker.last`}],ue=`positions = broker.get_positions()
quotes = {q.symbol: q for q in broker.get_quotes([p.symbol for p in positions])}
for p in positions:
    gain = (quotes[p.symbol].last - p.avg_price) / p.avg_price
    if gain >= threshold:
        flag(p.symbol, p.quantity, gain)   # same math, any broker`;function D(t,e){const s=t.length,o=new Array(s).fill(NaN);if(e<=0||s<e)return o;const a=2/(e+1);let r=0;for(let i=0;i<e;i++)r+=t[i];let n=r/e;o[e-1]=n;for(let i=e;i<s;i++)n=a*t[i]+(1-a)*n,o[i]=n;return o}function pe(t,e,s){if(s<1)return!1;const o=a=>!Number.isNaN(a);return!o(t[s])||!o(e[s])||!o(t[s-1])||!o(e[s-1])?!1:t[s]>e[s]&&t[s-1]<=e[s-1]}function me(t,e,s){if(s<1)return!1;const o=a=>!Number.isNaN(a);return!o(t[s])||!o(e[s])||!o(t[s-1])||!o(e[s-1])?!1:t[s]<e[s]&&t[s-1]>=e[s-1]}function U(t,e=8,s=21){const o=t.map(u=>u.close),a=t.map(u=>u.date),r=D(o,e),n=D(o,s);let i=-1,c=null;for(let u=1;u<o.length;u++)pe(r,n,u)?(i=u,c="golden"):me(r,n,u)&&(i=u,c="death");const l=o.length-1;let g="FLAT";!Number.isNaN(r[l])&&!Number.isNaN(n[l])&&(g=r[l]>=n[l]?"BULLISH":"BEARISH");let A="HOLD";i===l&&(A=c==="golden"?"BUY":"SELL");const S=i>=0?l-i:null;return{fast:e,slow:s,closes:o,dates:a,emaFast:r,emaSlow:n,signal:A,stance:g,crossIndex:i,crossType:c,barsSinceCross:S}}const be=`# EMA momentum crossover. Fast 8 over slow 21.
# Math is Michael's mur quantlab: Pine-seeded EMA + ta.crossover.
ema_fast = ema(closes, 8)
ema_slow = ema(closes, 21)
if crossover(ema_fast, ema_slow):   # golden cross
    signal = "BUY"
elif crossunder(ema_fast, ema_slow):  # death cross
    signal = "SELL"
# closes come from broker.get_candles(symbol) -> identical on every broker`,E="https://github.com/mphinance/traderdaddy-bridge";function p(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}const j=3;function q(t,e=0){const s="  ".repeat(e),o="  ".repeat(e+1);if(t===null)return'<span class="j-null">null</span>';if(typeof t=="number")return`<span class="j-num">${t}</span>`;if(typeof t=="boolean")return`<span class="j-bool">${t}</span>`;if(typeof t=="string")return`<span class="j-str">"${p(t)}"</span>`;if(Array.isArray(t)){if(t.length===0)return"[]";const c=(t.length>j?t.slice(0,2):t).map(l=>o+q(l,e+1));return t.length>j&&c.push(`${o}<span class="j-null">... ${t.length-2} more (${t.length} total)</span>`),`[
${c.join(`,
`)}
${s}]`}const a=t,r=Object.keys(a);return r.length===0?"{}":`{
${r.map(i=>`${o}<span class="j-key">"${p(i)}"</span>: ${q(a[i],e+1)}`).join(`,
`)}
${s}}`}function ye(t){const e=y.find(n=>n.key===t),s=w(t,e.raw),o=s.getBalances(),a=s.getPositions().map(n=>({symbol:n.symbol,quantity:n.quantity,cost_basis:n.cost_basis,avg_price:I(n),date_acquired:n.date_acquired})),r=s.getQuotes(["AAPL"]);return{balance:o,positions:a,quotes:r}}const he="http://localhost:8787/api/live?symbol=AAPL";function ve(){return`
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
  </section>`}function x(t){return`<div class="note"><b>Backend not reachable.</b> ${p(t)}<br/>Start the local read-only server from the repo root, then click Connect:
    <pre class="code" style="margin-top:0.6rem">BRIDGE_SECRETS=/path/to/secrets.env python -m server.live_tradier</pre></div>`}function ge(t){var r,n;const e=((r=t.momentum)==null?void 0:r.stance)==="BULLISH"?"var(--bull-bright)":((n=t.momentum)==null?void 0:n.stance)==="BEARISH"?"var(--bear-bright)":"var(--fg-3)",s=(t.positions??[]).map(i=>{var c,l;return`<div class="strip-row"><div class="strip-broker">${p(i.symbol)}</div><div class="strip-data">${i.quantity} @ avg ${((l=(c=i.avg_price)==null?void 0:c.toFixed)==null?void 0:l.call(c,2))??i.avg_price} &middot; cost $${Number(i.cost_basis).toLocaleString()}</div></div>`}).join(""),o=(t.quotes??[])[0],a=t.momentum;return`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" class="strat-grid">
      <div class="card">
        <div class="panel-label"><span><span class="live-dot"></span> LIVE &middot; ${p(t.source)}</span><span>acct ${p(t.account??"n/a")}</span></div>
        <div style="font-family:var(--font-mono);font-size:0.9rem;line-height:1.9">
          <div>total equity <span class="j-num">$${Number(t.balance.total_equity).toLocaleString()}</span></div>
          <div>total cash <span class="j-num">$${Number(t.balance.total_cash).toLocaleString()}</span></div>
          ${o?`<div>${p(o.symbol)} last <span class="j-num">${o.last}</span> &middot; bid ${o.bid} &middot; ask ${o.ask}</div>`:""}
          ${a?`<div style="margin-top:0.4rem">momentum EMA ${a.fast}/${a.slow}: <span style="color:${e};font-weight:700">${a.stance}</span> &middot; ${a.cross_type??"no"} cross ${a.bars_since_cross!=null?a.bars_since_cross+" bars ago":""} &middot; ${t.candle_count} bars</div>`:""}
        </div>
      </div>
      <div class="strip">
        <div class="strip-row" style="background:rgba(59,130,246,0.06)"><div class="strip-broker" style="color:var(--fg-4);font-size:0.7rem;letter-spacing:0.08em">CANONICAL POSITIONS (LIVE)</div><div></div></div>
        ${s||'<div class="strip-row"><div class="strip-data" style="color:var(--fg-4)">no open positions</div></div>'}
      </div>
    </div>`}async function fe(){const t=document.querySelector("#live-status"),e=document.querySelector("#live-result");t.textContent="connecting...";try{const s=await fetch(he,{cache:"no-store"}),o=await s.json();if(!s.ok||o.error){t.textContent="",e.innerHTML=x(o.detail||o.error||`HTTP ${s.status}`);return}t.textContent="connected, read-only",e.innerHTML=ge(o)}catch(s){t.textContent="",e.innerHTML=x(String(s))}}function we(){return`
  <section id="transform">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Live transform</div>
        <h2>Six native shapes in. One Tradier shape out.</h2>
        <p>Pick a broker. The left is the raw payload that broker actually returns, verified against its docs. The right is what your code sees after the adapter runs: the canonical, Tradier-shaped object. The transform is real TypeScript running in your browser, not a recording.</p>
      </div>
      <div class="pills" id="pills">
        ${y.map((t,e)=>`<button class="pill ${e===0?"active":""}" data-broker="${t.key}">${t.label}</button>`).join("")}
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
  </section>`}function H(t){const e=y.find(s=>s.key===t);document.querySelector("#native-name").textContent=e.label,document.querySelector("#native").innerHTML=q(e.raw),document.querySelector("#canon").innerHTML=q(ye(t)),document.querySelector("#blurb").innerHTML=`<b>${e.label}:</b> ${p(e.blurb)}`,document.querySelectorAll("#pills .pill").forEach(s=>{s.classList.toggle("active",s.dataset.broker===t)})}function _e(){return`
  <section id="proof">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Conformance</div>
        <h2>The same algo, every broker, identical result.</h2>
        <p>One read-only momentum check runs against all six brokers with zero code changes. Every divergent payload collapses to the same canonical answer: AAPL 100 @ avg 180, last 190, unrealized PnL $1,000. The algo never moves.</p>
      </div>
      <div class="strip">${K().map(e=>{var n,i;const s=y.find(c=>c.key===e),o=ce(w(e,s.raw)),a=o.signals[0],r=`cash $${o.totalCash.toLocaleString()}  ${a.symbol} ${a.qty} @ avg ${(n=a.avgPrice)==null?void 0:n.toFixed(2)} last ${(i=a.last)==null?void 0:i.toFixed(2)}  uPnL $${a.unrealizedPnl.toLocaleString()}`;return`<div class="strip-row"><div class="strip-broker">${s.label}</div><div class="strip-data"><span class="chk">&#10003;</span> ${r}</div></div>`}).join("")}</div>
    </div>
  </section>`}function ke(t){const i=t.closes.length,c=[...t.closes,...t.emaFast,...t.emaSlow].filter(m=>!Number.isNaN(m)),l=Math.min(...c),g=Math.max(...c),A=g-l||1,S=m=>10+m*1020/(i-1),u=m=>18+(g-m)/A*254,N=(m,L,$)=>{const f=m.map((T,X)=>Number.isNaN(T)?null:`${S(X).toFixed(1)},${u(T).toFixed(1)}`).filter(Boolean).join(" ");return`<polyline fill="none" stroke="${L}" stroke-width="${$}" points="${f}" />`};let O="";if(t.crossIndex>=0){const m=S(t.crossIndex),L=u(t.emaSlow[t.crossIndex]),$=t.crossType==="golden",f=$?"#10b981":"#ef4444",T=Math.min(m+8,920);O=`
      <line x1="${m}" y1="18" x2="${m}" y2="272" stroke="${f}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
      <circle cx="${m}" cy="${L}" r="5" fill="${f}" />
      <text x="${T}" y="30" fill="${f}" font-family="Space Mono, monospace" font-size="12" font-weight="700">${$?"GOLDEN CROSS":"DEATH CROSS"}</text>`}return`
    <svg viewBox="0 0 1040 300" width="100%" role="img" aria-label="EMA crossover chart">
      ${N(t.closes,"#93c5fd",1.5)}
      ${N(t.emaSlow,"#a855f7",2)}
      ${N(t.emaFast,"#f59e0b",2)}
      ${O}
    </svg>`}function Ae(){const t=w("tradier",y.find(r=>r.key==="tradier").raw),e=U(t.getCandles("AAPL")),s=e.stance==="BULLISH"?"var(--bull-bright)":e.stance==="BEARISH"?"var(--bear-bright)":"var(--fg-3)",o=e.crossIndex>=0?`${e.crossType==="golden"?"Golden cross":"Death cross"} ${e.barsSinceCross===0?"on the latest bar":`${e.barsSinceCross} bars ago`}`:"no cross in window",a=K().map(r=>{const n=y.find(l=>l.key===r),i=w(r,n.raw).getCandles("AAPL");if(i.length===0)return`<div class="strip-row"><div class="strip-broker">${n.label}</div><div class="strip-data" style="color:var(--fg-4)">no history endpoint (aggregator) &middot; quotes + positions only</div></div>`;const c=U(i);return`<div class="strip-row"><div class="strip-broker">${n.label}</div><div class="strip-data"><span class="chk">&#10003;</span> ${c.stance} &middot; ${c.crossType??"no"} cross &middot; ${i.length} bars</div></div>`}).join("");return`
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
        ${ke(e)}
      </div>
      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:1rem;margin-top:1rem" class="strat-grid">
        <div class="card">
          <div class="panel-label"><span class="tag-canon">The strategy, written once</span></div>
          <pre class="code">${p(be)}</pre>
        </div>
        <div class="strip">${a}</div>
      </div>
    </div>
  </section>`}function Se(){const t=de.map(e=>{const s=y.find(r=>r.key===e.broker),a=le(w(e.broker,s.raw)).map(r=>`${r[0]} x${r[1]} +${r[2]}%`).join(", ");return`
      <div class="card person">
        <h4>${e.who} <span style="color:var(--fg-4);font-weight:400">on ${s.label}</span></h4>
        <div class="meta">${p(e.sdk)}</div>
        <pre class="code">${p(e.before)}</pre>
        <div class="result">converted &#10142; trim: [ ${p(a)} ]</div>
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
        <pre class="code">${p(ue)}</pre>
      </div>
      <div class="people">${t}</div>
    </div>
  </section>`}function $e(){const t=[{t:"Broker API",s:"native shape"},{t:"Adapter",s:"one file per broker"},{t:"Canonical",s:"Tradier contract"},{t:"Your algo / agent",s:"written once"}];return`
  <section id="how">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">How it flows</div>
        <h2>One pipe, any broker on the front.</h2>
        <p>Swap the broker at the front and nothing downstream changes. The adapter is the only broker-aware code in the system.</p>
      </div>
      <div class="pipe">${t.map((s,o)=>{const a=`<div class="pipe-node"><div class="n-title">${s.t}</div><div class="n-sub">${s.s}</div></div>`,r=o<t.length-1?'<div class="pipe-arrow">&#10142;</div>':"";return a+r}).join("")}</div>
    </div>
  </section>`}function Te(){return`
  <section id="features">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Why Tradier-shaped</div>
        <h2>The easiest API becomes the standard.</h2>
        <p>Other brokers map INTO Tradier, so their users adopt Tradier-native tooling and migrate toward Tradier. Tradier becomes the lingua franca, the API every developer learns first.</p>
      </div>
      <div class="feat-grid">${[{ico:"&#128279;",h:"Six US brokers",p:"Tradier, tastytrade, Schwab, Alpaca, SnapTrade, IBKR. Equities and options. Shapes verified against each broker's official docs."},{ico:"&#9889;",h:"One file per broker",p:"Adding a broker is a single adapter mapping its native responses into the contract. Nothing downstream changes."},{ico:"&#129302;",h:"Agent-ready",p:"The canonical layer makes a Tradier-shaped MCP broker-agnostic. One tool vocabulary, every broker, every agent."},{ico:"&#128274;",h:"Read-first, preview-only",p:"Reads are the universal surface. Order placement previews by design. Live execution is opt-in per adapter and never automatic."}].map(s=>`<div class="card feat"><div class="ico">${s.ico}</div><h4>${s.h}</h4><p>${s.p}</p></div>`).join("")}</div>
    </div>
  </section>`}function qe(){const t=document.querySelector("#app");t.innerHTML=`
    <nav class="nav">
      <div class="wrap nav-inner">
        <div class="brand"><span class="mark"></span> TraderDaddy <span style="color:var(--blue-300)">Bridge</span></div>
        <div class="nav-links">
          <a href="#transform">Transform</a>
          <a href="#live">Live</a>
          <a href="#proof">Conformance</a>
          <a href="#strategy">Strategy</a>
          <a href="#onboard">Onboard</a>
          <a href="#how">How</a>
          <a href="${E}">GitHub</a>
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
          <a class="btn btn-ghost" href="${E}">View on GitHub</a>
        </div>
      </div>
    </header>

    ${we()}
    ${ve()}
    ${_e()}
    ${Ae()}
    ${Se()}
    ${$e()}
    ${Te()}

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
        <a href="${E}">github.com/mphinance/traderdaddy-bridge</a><br />
        Equities and options &middot; reads universal, orders preview-only &middot; no em dashes were harmed
      </div>
    </footer>
  `,document.querySelector("#pills").addEventListener("click",e=>{const s=e.target.closest(".pill");s!=null&&s.dataset.broker&&H(s.dataset.broker)}),document.querySelector("#live-btn").addEventListener("click",fe),H(y[0].key)}qe();
