import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseSnapshot } from './lib/data.ts';
import { boardIssue, buildRadar, dataScript } from './lib/radar.ts';
import { buildDossier } from './vendor/makefun-board.ts';

const here = fileURLToPath(new URL('.', import.meta.url));

function arg(name: string, fallback: string): string {
  const at = process.argv.indexOf(`--${name}`);
  if (at >= 0 && at + 1 < process.argv.length) return process.argv[at + 1]!;
  const withEquals = process.argv.find((a) => a.startsWith(`--${name}=`));
  return withEquals === undefined ? fallback : withEquals.slice(name.length + 3);
}

const inputArg = arg('input', '/input');
const inputFile = inputArg.endsWith('.json') ? inputArg : join(inputArg, 'snapshot.json');
if (!existsSync(inputFile)) {
  process.stderr.write(`token radar: no snapshot at ${inputFile}\n`);
  process.exit(2);
}
const out = arg('output', process.env.MAKEFUN_OUTPUT_DIR ?? '/output');
const dev = process.argv.includes('--dev');

const snapshot = parseSnapshot(readFileSync(inputFile, 'utf8'));
const { board, radar } = buildRadar(snapshot);
const issue = boardIssue(board, snapshot);
if (issue !== null) {
  process.stderr.write(`token radar: the board the model wrote is refused: ${issue}\n`);
  process.exit(1);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'board.json'), `${JSON.stringify({ rows: board })}\n`);
writeFileSync(join(out, 'data.js'), dataScript(radar));

function copyTree(from: string, to: string): number {
  if (!existsSync(from)) return 0;
  mkdirSync(to, { recursive: true });
  let copied = 0;
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const src = join(from, entry.name);
    const dst = join(to, entry.name);
    if (entry.isDirectory()) copied += copyTree(src, dst);
    else if (entry.isFile()) {
      copyFileSync(src, dst);
      copied++;
    }
  }
  return copied;
}

function copyShots(): string[] {
  const from = join(here, 'screenshots');
  const to = join(out, 'screenshots');
  if (!existsSync(from)) return [];
  mkdirSync(to, { recursive: true });
  const names: string[] = [];
  for (const entry of readdirSync(from, { withFileTypes: true })) {
    if (!entry.isFile() || entry.name.startsWith('.')) continue;
    copyFileSync(join(from, entry.name), join(to, entry.name));
    names.push(entry.name);
  }
  return names.sort();
}

const dashboardFiles = copyTree(join(here, 'dashboard'), join(out, 'dashboard'));
const shots = copyShots();
const imageName = /^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$/;
for (const name of shots) {
  if (!imageName.test(name)) {
    process.stderr.write(`token radar: screenshots/${name} has a name the dossier refuses\n`);
    process.exit(1);
  }
}
if (!dev && (shots.length < 3 || shots.length > 4)) {
  process.stderr.write(`token radar: screenshots/ holds ${shots.length} images; hand in 3 or 4\n`);
  process.exit(1);
}

if (!dev) {
  writeFileSync(join(out, 'dossier.json'), buildDossier(out, { text_max_bytes: 65_536, screenshots: { max: 4, max_bytes: 524_288 }, dashboard: { max_files: 400, max_bytes: 4_194_304 } }));
}

process.stdout.write(
  `token radar: ${snapshot.protocols.length} protocols, ${snapshot.watchlist.length} watchlist, ${radar.pre_size} pre-token, ${radar.live_size} live\n` +
    `token radar: ${board.length} rows (${radar.early_size} field trials), ${radar.kinds.length} kinds, dashboard ${dashboardFiles} files, ${shots.length} screenshots${dev ? ' (dev, no dossier)' : ''}\n`,
);
