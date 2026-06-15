export default function ScanResultPage({ params }: { params: { id: string } }) {
  return (
    <main>
      <aside className="card"><strong>TrustShield AI</strong><p>Overview • Security sections • AI recommendations</p></aside>
      <section className="panel">
        <p className="eyebrow">Scan result</p>
        <h1>Security Report</h1>
        <p>Report ID: {params.id}</p>
        <div className="grid">
          <article className="card"><h3>Trust Score</h3><p>Loaded from /api/scans/{params.id}</p></article>
          <article className="card"><h3>Risk Level</h3><p className="badges"><span>Responsive risk badge</span></p></article>
          <article className="card"><h3>Sections</h3><p>Glamsterdam, EVM, vulnerabilities, source, token, reputation, recommendations.</p></article>
        </div>
      </section>
    </main>
  );
}
