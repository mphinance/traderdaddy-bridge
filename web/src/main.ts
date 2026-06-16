// TraderDaddy Bridge: interactive universal-broker-adapter demo. Everything
// runs client-side on doc-verified fixtures. The adapter transforms are the
// real TypeScript port of the engine, executing live in the browser.
//
// No em dashes anywhere in this file.

import "./theme.css";
import { BROKERS } from "./fixtures";
import { getAdapter, supportedBrokers } from "./adapters";
import { avgPrice } from "./contract";
import { runAlgo, trimCandidates } from "./algo";
import { PEOPLE, CANONICAL_AFTER } from "./onboarding";
import { emaCrossover, StrategyResult } from "./strategy";

const STRATEGY_CODE = `# EMA momentum crossover. Fast 8 over slow 21.
# Math is Michael's mur quantlab: Pine-seeded EMA + ta.crossover.
ema_fast = ema(closes, 8)
ema_slow = ema(closes, 21)
if crossover(ema_fast, ema_slow):   # golden cross
    signal = "BUY"
elif crossunder(ema_fast, ema_slow):  # death cross
    signal = "SELL"
# closes come from broker.get_candles(symbol) -> identical on every broker`;

const REPO = "https://github.com/mphinance/traderdaddy-bridge";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Minimal JSON pretty-printer with syntax classes. Long arrays (e.g. 30 bars
// of candle history) are truncated to keep the panel readable while still
// showing the real shape.
const MAX_ARR = 3;
function renderJson(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const padIn = "  ".repeat(indent + 1);
  if (value === null) return `<span class="j-null">null</span>`;
  if (typeof value === "number") return `<span class="j-num">${value}</span>`;
  if (typeof value === "boolean") return `<span class="j-bool">${value}</span>`;
  if (typeof value === "string") return `<span class="j-str">"${esc(value)}"</span>`;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const show = value.length > MAX_ARR ? value.slice(0, 2) : value;
    const lines = show.map((v) => padIn + renderJson(v, indent + 1));
    if (value.length > MAX_ARR) {
      lines.push(`${padIn}<span class="j-null">... ${value.length - 2} more (${value.length} total)</span>`);
    }
    return `[\n${lines.join(",\n")}\n${pad}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) return "{}";
  const items = keys
    .map((k) => `${padIn}<span class="j-key">"${esc(k)}"</span>: ${renderJson(obj[k], indent + 1)}`)
    .join(",\n");
  return `{\n${items}\n${pad}}`;
}

function canonicalView(brokerKey: string) {
  const meta = BROKERS.find((b) => b.key === brokerKey)!;
  const a = getAdapter(brokerKey, meta.raw);
  const bal = a.getBalances();
  const positions = a.getPositions().map((p) => ({
    symbol: p.symbol,
    quantity: p.quantity,
    cost_basis: p.cost_basis,
    avg_price: avgPrice(p),
    date_acquired: p.date_acquired,
  }));
  const quotes = a.getQuotes(["AAPL"]);
  return { balance: bal, positions, quotes };
}

const LIVE_URL = "http://localhost:8787/api/live?symbol=AAPL";

function liveSection(): string {
  return `
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
  </section>`;
}

function renderLiveError(detail: string): string {
  return `<div class="note"><b>Backend not reachable.</b> ${esc(detail)}<br/>Start the local read-only server from the repo root, then click Connect:
    <pre class="code" style="margin-top:0.6rem">BRIDGE_SECRETS=/path/to/secrets.env python -m server.live_tradier</pre></div>`;
}

function renderLive(d: any): string {
  const stanceColor = d.momentum?.stance === "BULLISH" ? "var(--bull-bright)" : d.momentum?.stance === "BEARISH" ? "var(--bear-bright)" : "var(--fg-3)";
  const positions = (d.positions ?? [])
    .map((p: any) => `<div class="strip-row"><div class="strip-broker">${esc(p.symbol)}</div><div class="strip-data">${p.quantity} @ avg ${p.avg_price?.toFixed?.(2) ?? p.avg_price} &middot; cost $${Number(p.cost_basis).toLocaleString()}</div></div>`)
    .join("");
  const q = (d.quotes ?? [])[0];
  const mom = d.momentum;
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem" class="strat-grid">
      <div class="card">
        <div class="panel-label"><span><span class="live-dot"></span> LIVE &middot; ${esc(d.source)}</span><span>acct ${esc(d.account ?? "n/a")}</span></div>
        <div style="font-family:var(--font-mono);font-size:0.9rem;line-height:1.9">
          <div>total equity <span class="j-num">$${Number(d.balance.total_equity).toLocaleString()}</span></div>
          <div>total cash <span class="j-num">$${Number(d.balance.total_cash).toLocaleString()}</span></div>
          ${q ? `<div>${esc(q.symbol)} last <span class="j-num">${q.last}</span> &middot; bid ${q.bid} &middot; ask ${q.ask}</div>` : ""}
          ${mom ? `<div style="margin-top:0.4rem">momentum EMA ${mom.fast}/${mom.slow}: <span style="color:${stanceColor};font-weight:700">${mom.stance}</span> &middot; ${mom.cross_type ?? "no"} cross ${mom.bars_since_cross != null ? mom.bars_since_cross + " bars ago" : ""} &middot; ${d.candle_count} bars</div>` : ""}
        </div>
      </div>
      <div class="strip">
        <div class="strip-row" style="background:rgba(59,130,246,0.06)"><div class="strip-broker" style="color:var(--fg-4);font-size:0.7rem;letter-spacing:0.08em">CANONICAL POSITIONS (LIVE)</div><div></div></div>
        ${positions || `<div class="strip-row"><div class="strip-data" style="color:var(--fg-4)">no open positions</div></div>`}
      </div>
    </div>`;
}

async function connectLive() {
  const status = document.querySelector("#live-status")!;
  const result = document.querySelector("#live-result")!;
  status.textContent = "connecting...";
  try {
    const res = await fetch(LIVE_URL, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data.error) {
      status.textContent = "";
      result.innerHTML = renderLiveError(data.detail || data.error || `HTTP ${res.status}`);
      return;
    }
    status.textContent = "connected, read-only";
    result.innerHTML = renderLive(data);
  } catch (e) {
    status.textContent = "";
    result.innerHTML = renderLiveError(String(e));
  }
}

function transformerSection(): string {
  return `
  <section id="transform">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Live transform</div>
        <h2>Six native shapes in. One Tradier shape out.</h2>
        <p>Pick a broker. The left is the raw payload that broker actually returns, verified against its docs. The right is what your code sees after the adapter runs: the canonical, Tradier-shaped object. The transform is real TypeScript running in your browser, not a recording.</p>
      </div>
      <div class="pills" id="pills">
        ${BROKERS.map((b, idx) => `<button class="pill ${idx === 0 ? "active" : ""}" data-broker="${b.key}">${b.label}</button>`).join("")}
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
  </section>`;
}

function renderTransform(brokerKey: string) {
  const meta = BROKERS.find((b) => b.key === brokerKey)!;
  document.querySelector("#native-name")!.textContent = meta.label;
  document.querySelector("#native")!.innerHTML = renderJson(meta.raw);
  document.querySelector("#canon")!.innerHTML = renderJson(canonicalView(brokerKey));
  document.querySelector("#blurb")!.innerHTML = `<b>${meta.label}:</b> ${esc(meta.blurb)}`;
  document.querySelectorAll<HTMLButtonElement>("#pills .pill").forEach((p) => {
    p.classList.toggle("active", p.dataset.broker === brokerKey);
  });
}

function conformanceSection(): string {
  const rows = supportedBrokers()
    .map((name) => {
      const meta = BROKERS.find((b) => b.key === name)!;
      const run = runAlgo(getAdapter(name, meta.raw));
      const s = run.signals[0];
      const data = `cash $${run.totalCash.toLocaleString()}  ${s.symbol} ${s.qty} @ avg ${s.avgPrice?.toFixed(2)} last ${s.last?.toFixed(2)}  uPnL $${s.unrealizedPnl.toLocaleString()}`;
      return `<div class="strip-row"><div class="strip-broker">${meta.label}</div><div class="strip-data"><span class="chk">&#10003;</span> ${data}</div></div>`;
    })
    .join("");
  return `
  <section id="proof">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Conformance</div>
        <h2>The same algo, every broker, identical result.</h2>
        <p>One read-only momentum check runs against all six brokers with zero code changes. Every divergent payload collapses to the same canonical answer: AAPL 100 @ avg 180, last 190, unrealized PnL $1,000. The algo never moves.</p>
      </div>
      <div class="strip">${rows}</div>
    </div>
  </section>`;
}

function chartSvg(r: StrategyResult): string {
  const W = 1040;
  const H = 300;
  const padL = 10;
  const padR = 10;
  const padT = 18;
  const padB = 28;
  const n = r.closes.length;
  const all = [...r.closes, ...r.emaFast, ...r.emaSlow].filter((v) => !Number.isNaN(v));
  const min = Math.min(...all);
  const max = Math.max(...all);
  const span = max - min || 1;
  const x = (i: number) => padL + (i * (W - padL - padR)) / (n - 1);
  const y = (v: number) => padT + ((max - v) / span) * (H - padT - padB);
  const poly = (series: number[], color: string, width: number) => {
    const pts = series
      .map((v, i) => (Number.isNaN(v) ? null : `${x(i).toFixed(1)},${y(v).toFixed(1)}`))
      .filter(Boolean)
      .join(" ");
    return `<polyline fill="none" stroke="${color}" stroke-width="${width}" points="${pts}" />`;
  };
  let marker = "";
  if (r.crossIndex >= 0) {
    const cx = x(r.crossIndex);
    const cy = y(r.emaSlow[r.crossIndex]);
    const isGolden = r.crossType === "golden";
    const color = isGolden ? "#10b981" : "#ef4444";
    const labelX = Math.min(cx + 8, W - 120);
    marker = `
      <line x1="${cx}" y1="${padT}" x2="${cx}" y2="${H - padB}" stroke="${color}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
      <circle cx="${cx}" cy="${cy}" r="5" fill="${color}" />
      <text x="${labelX}" y="${padT + 12}" fill="${color}" font-family="Space Mono, monospace" font-size="12" font-weight="700">${isGolden ? "GOLDEN CROSS" : "DEATH CROSS"}</text>`;
  }
  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="EMA crossover chart">
      ${poly(r.closes, "#93c5fd", 1.5)}
      ${poly(r.emaSlow, "#a855f7", 2)}
      ${poly(r.emaFast, "#f59e0b", 2)}
      ${marker}
    </svg>`;
}

function strategySection(): string {
  // The strategy runs on canonical candles, identical across every broker that
  // serves history. Compute the reference run from Tradier.
  const tradier = getAdapter("tradier", BROKERS.find((b) => b.key === "tradier")!.raw);
  const r = emaCrossover(tradier.getCandles("AAPL"));

  const stanceColor = r.stance === "BULLISH" ? "var(--bull-bright)" : r.stance === "BEARISH" ? "var(--bear-bright)" : "var(--fg-3)";
  const crossText =
    r.crossIndex >= 0
      ? `${r.crossType === "golden" ? "Golden cross" : "Death cross"} ${r.barsSinceCross === 0 ? "on the latest bar" : `${r.barsSinceCross} bars ago`}`
      : "no cross in window";

  // Per-broker agreement (brokers with no history endpoint are flagged).
  const rows = supportedBrokers()
    .map((name) => {
      const meta = BROKERS.find((b) => b.key === name)!;
      const candles = getAdapter(name, meta.raw).getCandles("AAPL");
      if (candles.length === 0) {
        return `<div class="strip-row"><div class="strip-broker">${meta.label}</div><div class="strip-data" style="color:var(--fg-4)">no history endpoint (aggregator) &middot; quotes + positions only</div></div>`;
      }
      const rr = emaCrossover(candles);
      return `<div class="strip-row"><div class="strip-broker">${meta.label}</div><div class="strip-data"><span class="chk">&#10003;</span> ${rr.stance} &middot; ${rr.crossType ?? "no"} cross &middot; ${candles.length} bars</div></div>`;
    })
    .join("");

  return `
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
          <span style="color:${stanceColor};font-weight:700">${r.stance} &middot; ${crossText}</span>
        </div>
        ${chartSvg(r)}
      </div>
      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:1rem;margin-top:1rem" class="strat-grid">
        <div class="card">
          <div class="panel-label"><span class="tag-canon">The strategy, written once</span></div>
          <pre class="code">${esc(STRATEGY_CODE)}</pre>
        </div>
        <div class="strip">${rows}</div>
      </div>
    </div>
  </section>`;
}

function onboardingSection(): string {
  const cards = PEOPLE.map((person) => {
    const meta = BROKERS.find((b) => b.key === person.broker)!;
    const result = trimCandidates(getAdapter(person.broker, meta.raw));
    const resultStr = result.map((r) => `${r[0]} x${r[1]} +${r[2]}%`).join(", ");
    return `
      <div class="card person">
        <h4>${person.who} <span style="color:var(--fg-4);font-weight:400">on ${meta.label}</span></h4>
        <div class="meta">${esc(person.sdk)}</div>
        <pre class="code">${esc(person.before)}</pre>
        <div class="result">converted &#10142; trim: [ ${esc(resultStr)} ]</div>
      </div>`;
  }).join("");
  return `
  <section id="onboard">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Onboarding</div>
        <h2>Their code, pointed at your contract.</h2>
        <p>Five traders, five brokers, five SDKs, one strategy welded to each broker. Onboarding is mechanical: write one adapter, swap the data-access lines for the canonical contract, leave the strategy math untouched. Every one of them then runs the identical algo below, and it runs on Tradier.</p>
      </div>
      <div class="card" style="margin-bottom:1rem">
        <div class="panel-label"><span class="tag-canon">The one canonical algo they all converge on</span></div>
        <pre class="code">${esc(CANONICAL_AFTER)}</pre>
      </div>
      <div class="people">${cards}</div>
    </div>
  </section>`;
}

function pipelineSection(): string {
  const nodes = [
    { t: "Broker API", s: "native shape" },
    { t: "Adapter", s: "one file per broker" },
    { t: "Canonical", s: "Tradier contract" },
    { t: "Your algo / agent", s: "written once" },
  ];
  const inner = nodes
    .map((n, idx) => {
      const node = `<div class="pipe-node"><div class="n-title">${n.t}</div><div class="n-sub">${n.s}</div></div>`;
      const arrow = idx < nodes.length - 1 ? `<div class="pipe-arrow">&#10142;</div>` : "";
      return node + arrow;
    })
    .join("");
  return `
  <section id="how">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">How it flows</div>
        <h2>One pipe, any broker on the front.</h2>
        <p>Swap the broker at the front and nothing downstream changes. The adapter is the only broker-aware code in the system.</p>
      </div>
      <div class="pipe">${inner}</div>
    </div>
  </section>`;
}

function featuresSection(): string {
  const feats = [
    { ico: "&#128279;", h: "Six US brokers", p: "Tradier, tastytrade, Schwab, Alpaca, SnapTrade, IBKR. Equities and options. Shapes verified against each broker's official docs." },
    { ico: "&#9889;", h: "One file per broker", p: "Adding a broker is a single adapter mapping its native responses into the contract. Nothing downstream changes." },
    { ico: "&#129302;", h: "Agent-ready", p: "The canonical layer makes a Tradier-shaped MCP broker-agnostic. One tool vocabulary, every broker, every agent." },
    { ico: "&#128274;", h: "Read-first, preview-only", p: "Reads are the universal surface. Order placement previews by design. Live execution is opt-in per adapter and never automatic." },
  ];
  const cards = feats.map((f) => `<div class="card feat"><div class="ico">${f.ico}</div><h4>${f.h}</h4><p>${f.p}</p></div>`).join("");
  return `
  <section id="features">
    <div class="wrap">
      <div class="sec-head">
        <div class="kicker">Why Tradier-shaped</div>
        <h2>The easiest API becomes the standard.</h2>
        <p>Other brokers map INTO Tradier, so their users adopt Tradier-native tooling and migrate toward Tradier. Tradier becomes the lingua franca, the API every developer learns first.</p>
      </div>
      <div class="feat-grid">${cards}</div>
    </div>
  </section>`;
}

function render() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
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
          <a href="${REPO}">GitHub</a>
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
          <a class="btn btn-ghost" href="${REPO}">View on GitHub</a>
        </div>
      </div>
    </header>

    ${transformerSection()}
    ${liveSection()}
    ${conformanceSection()}
    ${strategySection()}
    ${onboardingSection()}
    ${pipelineSection()}
    ${featuresSection()}

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
        <a href="${REPO}">github.com/mphinance/traderdaddy-bridge</a><br />
        Equities and options &middot; reads universal, orders preview-only &middot; no em dashes were harmed
      </div>
    </footer>
  `;

  document.querySelector("#pills")!.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(".pill");
    if (btn?.dataset.broker) renderTransform(btn.dataset.broker);
  });
  document.querySelector("#live-btn")!.addEventListener("click", connectLive);
  renderTransform(BROKERS[0].key);
}

render();
