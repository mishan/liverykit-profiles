// Regenerate every profile from an Assetto Corsa install.
//
//   node generate.mjs <liverykit checkout> <assettocorsa/content/cars> [carId ...]
//
// Only Kunos's own cars: a mod's measurements are its author's to publish, not
// ours. Kunos ships ui_car.json without an `author` field and every mod in a
// 252-car survey names one, so that is the test. The cars liverykit bundles
// are copied from it rather than regenerated, so the two never disagree.
import { readdir, readFile, writeFile, copyFile, stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { join, resolve } from 'node:path';
import { cpus } from 'node:os';

const run = promisify(execFile);
const [liverykit, carsDir, ...only] = process.argv.slice(2).map((a, i) => (i < 2 ? resolve(a) : a));
if (!liverykit || !carsDir) {
  console.error('usage: node generate.mjs <liverykit checkout> <assettocorsa/content/cars> [carId ...]');
  process.exit(2);
}
const { bestKn5 } = await import(join(liverykit, 'tools/fleet.mjs'));
const { profileJson } = await import(join(liverykit, 'src/profile.mjs'));
const out = resolve('cars');

async function isKunos(id) {
  const raw = await readFile(join(carsDir, id, 'ui', 'ui_car.json')).catch(() => null);
  if (!raw) return false;
  const text = raw[0] === 0xFF && raw[1] === 0xFE ? raw.subarray(2).toString('utf16le') : raw.toString('utf8');
  return !/"author"\s*:/.test(text);
}

const ids = only.length ? only : (await readdir(carsDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name);
const todo = [];
for (const id of ids.sort()) {
  if (!await isKunos(id)) { console.log(`skip ${id}: not a Kunos car`); continue; }
  todo.push(id);
}

// Outlines and seams together sketch the car maker's UV layout, which is
// theirs to publish, so they are not published here. liverykit measures them
// from the model of whoever has the car, where it matches the profile's.
async function stripLayout(id) {
  const path = join(out, `${id}.json`);
  const p = JSON.parse(await readFile(path, 'utf8'));
  for (const panels of Object.values(p.panels ?? {})) for (const q of Object.values(panels)) { delete q.outline; delete q.seams; }
  await writeFile(path, profileJson(p));
}

const bundled = new Set((await readdir(join(liverykit, 'cars'))).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)));
const failed = [];
async function one(id) {
  if (bundled.has(id)) {
    await copyFile(join(liverykit, 'cars', `${id}.json`), join(out, `${id}.json`));
    await stripLayout(id);
    return console.log(`copied ${id} from liverykit`);
  }
  const kn5 = await bestKn5(join(carsDir, id));
  if (!kn5) { failed.push(`${id}: no kn5`); return; }
  const skins = join(carsDir, id, 'skins');
  const args = [join(liverykit, 'bin/liverykit.mjs'), '--from-kn5', kn5, '--car-id', id, '--out', out,
    ...(await stat(skins).then(() => ['--skins', skins], () => []))];
  try {
    await run(process.execPath, args, { env: { ...process.env, LIVERYKIT_PRIOR_DIR: out }, maxBuffer: 1 << 26 });
    await stripLayout(id);
    console.log(`generated ${id}`);
  } catch (e) {
    failed.push(`${id}: ${(e.stderr || e.message).trim().split('\n').pop()}`);
  }
}
const queue = [...todo];
await Promise.all([...Array(Math.max(1, cpus().length - 2))].map(async () => {
  while (queue.length) await one(queue.shift());
}));
if (failed.length) { console.log(`\n${failed.length} failed:\n  ${failed.join('\n  ')}`); process.exitCode = 1; }
