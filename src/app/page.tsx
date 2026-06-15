const supportedChains = ["Ethereum", "Base", "Polygon", "Arbitrum"];
const features = [
  "Glamsterdam readiness scoring",
  "EVM opcode and gas-risk findings",
  "SWC/CWE vulnerability intelligence",
  "Source, token, and reputation signals",
];

export default function HomePage() {
  return (
    <main>
      <nav className="nav"><strong>TrustShield AI</strong><a href="#scan">Analyze Smart Contract</a></nav>
      <section className="hero">
        <p className="eyebrow">Web3 Security Platform</p>
        <h1>Production-grade smart contract intelligence for modern teams.</h1>
        <p>Scan contracts across Ethereum, Base, Polygon, and Arbitrum with persistent security reports and analytics.</p>
        <a className="cta" href="#scan">Analyze Smart Contract</a>
      </section>
      <section className="grid">
        {features.map((feature) => <article className="card" key={feature}><h3>{feature}</h3><p>Actionable intelligence powered by the existing TrustShield analysis engine.</p></article>)}
      </section>
      <section className="card"><h2>Supported chains</h2><div className="badges">{supportedChains.map((chain) => <span key={chain}>{chain}</span>)}</div></section>
      <section id="scan" className="panel"><h2>Contract scanner</h2><form action="/api/scan" method="post"><input name="contractAddress" placeholder="0x... contract address" /><select name="network"><option value="ethereum">Ethereum</option><option value="base">Base</option><option value="polygon">Polygon</option><option value="arbitrum">Arbitrum</option></select><button>Analyze Smart Contract</button></form></section>
    </main>
  );
}
