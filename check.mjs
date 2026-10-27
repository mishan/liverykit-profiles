// Validate every profile here with liverykit's own reader, plus what this
// repository promises on top: named for its car, in the current format, with
// the model it was measured from, and no outlines or seams: together they
// sketch the car maker's UV layout.
//
//   node check.mjs        (with liverykit installed: npm install)
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validateProfile, PROFILE_SCHEMA } from 'liverykit/src/profile.mjs';

const problems = [];
const files = (await readdir('cars')).filter((f) => f.endsWith('.json')).sort();
for (const f of files) {
  const say = (m) => problems.push(`${f}: ${m}`);
  let p;
  try {
    p = validateProfile(JSON.parse(await readFile(join('cars', f), 'utf8')), f);
  } catch (e) { say(e.message); continue; }
  if (`${p.id}.json` !== f) say(`id is "${p.id}"`);
  if (p.schemaVersion !== PROFILE_SCHEMA) say(`schemaVersion ${p.schemaVersion}, not ${PROFILE_SCHEMA}`);
  if (!p.calibration?.model?.sha256) say('does not record the model it was measured from');
  if (!p.name) say('has no display name');
  for (const [role, panels] of Object.entries(p.panels)) {
    for (const [name, q] of Object.entries(panels)) {
      if (q.outline !== undefined) say(`${role}.${name} has an outline`);
      if (q.seams !== undefined) say(`${role}.${name} has seams`);
    }
  }
}
console.log(`${files.length} profiles checked`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
