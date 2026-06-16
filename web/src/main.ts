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

const REPO = "https://github.com/mphinance/traderdaddy-bridge";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Minimal JSON pretty-printer with syntax classes.
function renderJson(value: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  const padIn = "  ".repeat(indent + 1);
  if (value === null) return `<span class="j-null">null</span>`;
  if (typeof value === "number") return `<span class="j-num">${value}</span>`;
  if (typeof value === "boolean") return `<span class="j-bool">${value}</span>`;
  if (typeof value === "string") return `<span class="j-str">"${esc(value)}"</span>`;
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const items = value.map((v) => padIn + renderJson(v, indent + 1)).join(",\n");
    return `[\n${items}\n${pad}]`;
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
          <a href="#proof">Conformance</a>
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
    ${conformanceSection()}
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
  renderTransform(BROKERS[0].key);
}

render();
