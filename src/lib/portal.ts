export type Role = "user" | "admin";
export type User = { id: string; name: string; role: Role };
export type Doc = { id: number; title: string; owner: string; sharedWith: string[]; body: string };

export const USERS: User[] = [
  { id: "alice", name: "Alice (HR)", role: "user" },
  { id: "bob", name: "Bob (Intern)", role: "user" },
  { id: "carol", name: "Carol (Finance)", role: "user" },
  { id: "admin", name: "Admin", role: "admin" },
];

export const DOCS: Doc[] = [
  { id: 101, title: "Salary_Bands_2026.pdf", owner: "alice", sharedWith: [], body: "Confidential salary bands for all grades." },
  { id: 102, title: "Offer_Letter_Bob.pdf", owner: "alice", sharedWith: ["bob"], body: "Offer letter shared with Bob." },
  { id: 103, title: "Intern_Notes.txt", owner: "bob", sharedWith: [], body: "Bob's onboarding notes." },
  { id: 104, title: "Q3_Budget.xlsx", owner: "carol", sharedWith: ["alice"], body: "Q3 budget, shared with Alice." },
  { id: 105, title: "Audit_Report.pdf", owner: "carol", sharedWith: [], body: "Internal audit findings." },
];

export type Res = { status: 200 | 403 | 404; doc?: Doc; docs?: Doc[] };

const canRead = (u: User, d: Doc) => u.role === "admin" || d.owner === u.id || d.sharedWith.includes(u.id);

/** GET /api/documents/:id */
export function getDocument(u: User, id: number, patched: boolean): Res {
  const d = DOCS.find((x) => x.id === id);
  if (!d) return { status: 404 };
  if (patched && !canRead(u, d)) return { status: 403 };
  return { status: 200, doc: d };
}

/** GET /api/documents (list is already correctly filtered) */
export function listDocuments(u: User): Res {
  return { status: 200, docs: DOCS.filter((d) => canRead(u, d)) };
}

export const VULN_CODE = `app.get("/api/documents/:id", auth, (req, res) => {
  const doc = db.documents.find(req.params.id);
  if (!doc) return res.status(404).end();
  return res.json(doc);
});`;

export const DIFF = [
  { t: " ", l: 'app.get("/api/documents/:id", auth, (req, res) => {' },
  { t: " ", l: "  const doc = db.documents.find(req.params.id);" },
  { t: " ", l: "  if (!doc) return res.status(404).end();" },
  { t: "+", l: "  if (!canRead(req.user, doc)) return res.status(403).end();" },
  { t: " ", l: "  return res.json(doc);" },
  { t: " ", l: "});" },
];

export type Check = { name: string; user: string; id?: number; expect: number; kind: "get" | "list"; expectCount?: number };

export const EXPLOIT: Check = { name: "Bob reads Alice's salary bands (IDOR)", user: "bob", id: 101, expect: 403, kind: "get" };

export const REGRESSION: Check[] = [
  { name: "Alice reads her own document", user: "alice", id: 101, expect: 200, kind: "get" },
  { name: "Bob reads document shared with him", user: "bob", id: 102, expect: 200, kind: "get" },
  { name: "Alice reads Carol's shared budget", user: "alice", id: 104, expect: 200, kind: "get" },
  { name: "Admin reads any document", user: "admin", id: 105, expect: 200, kind: "get" },
  { name: "Missing document still 404", user: "alice", id: 999, expect: 404, kind: "get" },
  { name: "Bob's list shows 2 docs", user: "bob", expect: 200, kind: "list", expectCount: 2 },
  { name: "Carol blocked from Bob's notes", user: "carol", id: 103, expect: 403, kind: "get" },
];

export function runCheck(c: Check, patched: boolean) {
  const u = USERS.find((x) => x.id === c.user)!;
  const r = c.kind === "get" ? getDocument(u, c.id!, patched) : listDocuments(u);
  const pass = r.status === c.expect && (c.expectCount === undefined || r.docs?.length === c.expectCount);
  return { status: r.status, pass, count: r.docs?.length };
}

/** Scanner: tries every user against every doc and flags reads the policy forbids */
export function scan(patched: boolean) {
  const findings: { user: string; id: number; title: string }[] = [];
  for (const u of USERS) for (const d of DOCS) {
    if (getDocument(u, d.id, patched).status === 200 && !canRead(u, d)) findings.push({ user: u.id, id: d.id, title: d.title });
  }
  return findings;
}
