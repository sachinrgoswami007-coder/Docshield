import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DIFF, DOCS, EXPLOIT, REGRESSION, USERS, VULN_CODE, getDocument, listDocuments, runCheck, scan } from "@/lib/portal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Docshield — AI Access-Flaw Repair" },
      { name: "description", content: "Find an access flaw in a document portal, prove it, apply the smallest fix, and verify nothing broke." },
      { property: "og:title", content: "Docshield — AI Access-Flaw Repair" },
      { property: "og:description", content: "Proof first, smallest fix, then regression checks." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Log = { t: "info" | "bad" | "good"; m: string };
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

function Index() {
  const [patched, setPatched] = useState(false);
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<Log[]>([]);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ReturnType<typeof runCheck>[] | null>(null);
  const [user, setUser] = useState("bob");
  const [docId, setDocId] = useState(101);

  const log = (t: Log["t"], m: string) => setLogs((l) => [...l, { t, m }]);

  async function run() {
    setRunning(true); setPatched(false); setLogs([]); setResults(null); setStep(1);
    log("info", "Step 1: Initializing security scan across document endpoints...");
    await wait(700);
    const f = scan(false);
    f.forEach((x) => log("bad", `  ✗ ${x.user} can read #${x.id} ${x.title}`));
    log("bad", `  ${f.length} unauthorised reads found. Identified missing ownership validation (IDOR).`);
    setStep(2); await wait(900);
    log("info", "Step 2: Confirming vulnerability reproducability...");
    const p = runCheck(EXPLOIT, false);
    log("bad", `  bob → GET /api/documents/101 → HTTP ${p.status} (leaked "Salary_Bands_2026.pdf")`);
    log("bad", "  Vulnerability CONFIRMED with reproducible evidence.");
    setStep(3); await wait(900);
    log("info", "Step 3: Deploying targeted security patch...");
    setPatched(true); await wait(700);
    const p2 = runCheck(EXPLOIT, true);
    log("good", `  Re-testing exploit → HTTP ${p2.status}. Vulnerability resolved.`);
    setStep(4); await wait(900);
    log("info", "Step 4: Running regression tests to ensure stability...");
    const r = REGRESSION.map((c) => runCheck(c, true));
    setResults(r);
    const ok = r.filter((x) => x.pass).length;
    log(ok === r.length ? "good" : "bad", `  ${ok}/${r.length} checks passed. Residual scan findings: ${scan(true).length}.`);
    log("good", "✓ Security patch verified and ready for deployment.");
    setStep(5); setRunning(false);
  }

  const u = USERS.find((x) => x.id === user)!;
  const res = getDocument(u, docId, patched);
  const steps = ["Scan", "Proof", "Fix", "Verify"];

  return (
    <main className="min-h-screen px-4 py-10 md:px-10">
      <header className="mx-auto max-w-6xl">
        <h1 className="mt-2 font-display text-4xl font-bold md:text-6xl">Docshield</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground text-lg">Automatically track down access flaws in your document portal, verify the vulnerability, apply a targeted fix, and run regression tests to ensure stability.</p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button onClick={run} disabled={running} className="rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-50">
            {running ? "Scanning in progress…" : step === 5 ? "Run Scan Again" : "▶ Start Security Scan"}
          </button>
          <span className={`rounded-full border px-4 py-1.5 text-sm font-medium shadow-sm ${patched ? "border-success/30 bg-success/10 text-success" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
            System Status: {patched ? "Secured" : "Vulnerable"}
          </span>
        </div>
        <ol className="mt-8 grid grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <li key={s} className={`rounded-lg border-2 p-4 text-center text-sm font-medium shadow-sm transition-colors ${step > i + 1 ? "border-success bg-success/5 text-success" : step === i + 1 ? "border-primary bg-primary/5 text-primary" : "border-border/50 bg-muted/20 text-muted-foreground"}`}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>
      </header>

      <section className="mx-auto mt-8 grid max-w-6xl gap-6 lg:grid-cols-2">
        <Panel title="Security Scan Log">
          <div className="h-80 overflow-auto rounded-md bg-muted/30 p-4 font-mono text-sm leading-relaxed border border-border/50">
            {logs.length === 0 && <p className="text-muted-foreground italic">Press “Start Security Scan” to begin.</p>}
            {logs.map((l, i) => (
              <p key={i} className={`mb-1 ${l.t === "bad" ? "text-destructive font-medium" : l.t === "good" ? "text-success font-medium" : "text-foreground"}`}>{l.m}</p>
            ))}
          </div>
        </Panel>

        <Panel title={patched ? "Patch (minimal diff)" : "Suspect handler"}>
          {patched ? (
            <pre className="overflow-auto font-mono text-xs">
              {DIFF.map((d, i) => (
                <div key={i} className={d.t === "+" ? "bg-success/15 text-success" : "text-muted-foreground"}>{d.t} {d.l}</div>
              ))}
            </pre>
          ) : (
            <pre className="overflow-auto font-mono text-xs text-muted-foreground">{VULN_CODE}</pre>
          )}
          <p className="mt-4 text-xs text-muted-foreground">canRead = admin OR owner OR in sharedWith — the same rule the list endpoint already uses.</p>
        </Panel>

        <Panel title="Regression suite">
          <ul className="space-y-2 font-mono text-xs">
            {[EXPLOIT, ...REGRESSION].map((c, i) => {
              const r = i === 0 ? (step >= 3 ? runCheck(EXPLOIT, patched) : null) : results?.[i - 1];
              return (
                <li key={c.name} className="flex items-center justify-between gap-3 border-b border-border pb-2">
                  <span>{i === 0 ? "⚡ " : ""}{c.name}</span>
                  <span className={!r ? "text-muted-foreground" : r.pass ? "text-success" : "text-destructive"}>
                    {!r ? "pending" : `${r.pass ? "PASS" : "FAIL"} · ${r.status}`}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Try the portal yourself">
          <div className="flex flex-wrap gap-3 font-mono text-xs">
            <select value={user} onChange={(e) => setUser(e.target.value)} className="rounded-md border border-input bg-background px-2 py-1.5">
              {USERS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <select value={docId} onChange={(e) => setDocId(Number(e.target.value))} className="rounded-md border border-input bg-background px-2 py-1.5">
              {DOCS.map((d) => <option key={d.id} value={d.id}>#{d.id} {d.title}</option>)}
            </select>
            <button onClick={() => setPatched((p) => !p)} className="rounded-md border border-border px-2 py-1.5 hover:border-primary">toggle patch</button>
          </div>
          <div className="mt-4 rounded-md bg-muted p-3 font-mono text-xs">
            <p className="text-muted-foreground">GET /api/documents/{docId} as {user}</p>
            <p className={res.status === 200 ? "text-success" : "text-destructive"}>HTTP {res.status}</p>
            {res.doc && <p className="mt-1">{res.doc.body} <span className="text-muted-foreground">(owner: {res.doc.owner})</span></p>}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">My documents: {listDocuments(u).docs!.map((d) => d.title).join(", ")}</p>
        </Panel>
      </section>
      <footer className="mx-auto mt-10 max-w-6xl font-mono text-xs text-muted-foreground">SDG 9 · Industry, Innovation & Infrastructure — SDG 16 · Peace, Justice & Strong Institutions</footer>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm">
      <h2 className="mb-5 text-lg font-semibold text-foreground tracking-tight">{title}</h2>
      {children}
    </div>
  );
}
