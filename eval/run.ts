import { readFileSync, writeFileSync } from "node:fs";

interface Case {
  id: string;
  lang: string;
  tag: string;
  notice: string;
  expected: { items: { po: string; date: string | null }[]; reason: string; expectIssues: boolean };
}

const url = process.env.EVAL_URL ?? "https://vinkla-api-334409609237.asia-southeast1.run.app";
const set = JSON.parse(readFileSync(new URL("./notices.json", import.meta.url), "utf8")) as {
  referenceDate: string;
  knownPoIds: string[];
  cases: Case[];
};

interface Row {
  id: string;
  lang: string;
  tag: string;
  items: boolean;
  reason: boolean;
  issues: boolean;
  exact: boolean;
  got?: unknown;
  error?: string;
}

async function run(c: Case): Promise<Row> {
  const base = { id: c.id, lang: c.lang, tag: c.tag };
  try {
    const res = await fetch(`${url}/v1/notices/extract`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ notice: c.notice, referenceDate: set.referenceDate, knownPoIds: set.knownPoIds }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const got = (await res.json()) as { items: { poReference: string; newArrivalDate: string | null }[]; reason: string; issues: string[] };
    const key = (po: string, date: string | null) => `${po}|${date}`;
    const items = JSON.stringify(got.items.map((i) => key(i.poReference, i.newArrivalDate)).sort()) === JSON.stringify(c.expected.items.map((i) => key(i.po, i.date)).sort());
    const reason = got.reason === c.expected.reason;
    const issues = c.expected.expectIssues ? got.issues.length > 0 : got.issues.length === 0;
    return { ...base, items, reason, issues, exact: items && reason && issues, got };
  } catch (e) {
    return { ...base, items: false, reason: false, issues: false, exact: false, error: (e as Error).message };
  }
}

const rows: Row[] = [];
// One call every 3.2 seconds stays under the API's limit of 20 AI calls a minute per client.
const gapMs = Number(process.env.EVAL_DELAY_MS ?? 3200);
for (const c of set.cases) {
  const started = Date.now();
  rows.push(await run(c));
  const wait = gapMs - (Date.now() - started);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}
rows.sort((a, b) => a.id.localeCompare(b.id));

const pct = (n: number, d: number) => `${n}/${d} (${Math.round((n / d) * 100)}%)`;
const count = (rs: Row[], k: keyof Pick<Row, "items" | "reason" | "issues" | "exact">) => rs.filter((r) => r[k]).length;
const line = (name: string, rs: Row[]) =>
  `${name.padEnd(10)} n=${String(rs.length).padStart(2)}  PO and date ${pct(count(rs, "items"), rs.length).padEnd(11)} reason ${pct(count(rs, "reason"), rs.length).padEnd(11)} exact ${pct(count(rs, "exact"), rs.length)}`;

console.log(line("all", rows));
for (const lang of [...new Set(rows.map((r) => r.lang))]) console.log(line(lang, rows.filter((r) => r.lang === lang)));
const flagged = rows.filter((r) => !r.exact && (r.got as { issues?: string[] } | undefined)?.issues?.length);
console.log(`\nMisses caught by the checks: ${flagged.length} of ${rows.filter((r) => !r.exact).length}`);
console.log("Failures:");
for (const r of rows.filter((r) => !r.exact)) console.log(r.id, r.tag, JSON.stringify({ items: r.items, reason: r.reason, issues: r.issues }), r.error ?? JSON.stringify(r.got));

writeFileSync(new URL("./results.json", import.meta.url), JSON.stringify({ ranAt: new Date().toISOString(), url, rows }, null, 1));
