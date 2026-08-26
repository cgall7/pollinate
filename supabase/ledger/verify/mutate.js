// Mutation check: disable each guard in turn, confirm the suite catches it.
const fs = require('fs');
const src = fs.readFileSync('test.js','utf8');
const MUT = process.env.MUT;
const mutations = {
  overdraft: `drop trigger ledger_postings_no_overdraft on public.ledger_postings;`,
  balanced:  `drop trigger ledger_postings_balanced on public.ledger_postings;`,
  fundmatch: `drop trigger ledger_postings_funding_matches_invoice on public.ledger_postings;`,
  immutable: `drop trigger ledger_postings_immutable on public.ledger_postings;`,
  modeguard: `drop trigger strike_invoice_polls_mode_guard on public.strike_invoice_polls;`,
  zapimmutable: `drop trigger nectar_zaps_immutable on public.nectar_zaps;`,
};
// zapimmutable drops a trigger the 19a service migration creates, so it must
// inject after that migration applies; the ledger-core mutations inject after
// the core schema as before.
const anchor = MUT === 'zapimmutable'
  ? "    check('19a service layer applies cleanly', true);"
  : "    check('schema applies cleanly', true);";
const patched = src.replace(
  anchor,
  `${anchor}
    await client.query(${JSON.stringify(mutations[MUT])});
    console.log('  !! MUTATION ACTIVE: ${MUT}');`
).replace('const PORT = 55433;', 'const PORT = 55500;')
// Distinct port AND distinct data dir: test.js rmSync's its own pgdata on
// startup, so a mutation run sharing the directory with a concurrent plain
// run gets its cluster files deleted out from under it (58P01 mid-suite).
 .replace("path.join(__dirname, 'pgdata')", "path.join(__dirname, 'pgdata-mut')");
fs.writeFileSync('test.mut.js', patched);
