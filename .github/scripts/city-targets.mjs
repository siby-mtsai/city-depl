#!/usr/bin/env node
/**
 * Works out which cities to build from PR labels and changed files.
 *
 *   city:<name>   build that city (must match config/cities/<name>.yaml)
 *   city:all      build every city
 *   Changing config/cities/<name>.yaml always includes <name>, even without its label.
 *
 * Usage:
 *   node .github/scripts/city-targets.mjs --labels '["city:mumbai"]' [--changed-files files.txt] [--require]
 *
 * Writes `cities` (JSON array) and `has_cities` to $GITHUB_OUTPUT.
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    labels: { type: 'string', default: '[]' },
    'changed-files': { type: 'string' },
    require: { type: 'boolean', default: false },
    'config-dir': { type: 'string', default: 'config/cities' },
  },
});

const labels = JSON.parse(values.labels || '[]');
const known = fs
  .readdirSync(values['config-dir'])
  .filter((f) => /\.ya?ml$/.test(f))
  .map((f) => f.replace(/\.ya?ml$/, ''))
  .sort();

const errors = [];
const selected = new Set();
const reasons = [];

for (const label of labels) {
  if (!label.startsWith('city:')) continue;
  const city = label.slice('city:'.length);
  if (city === 'all') {
    known.forEach((c) => selected.add(c));
    reasons.push('label city:all');
  } else if (known.includes(city)) {
    selected.add(city);
    reasons.push(`label ${label}`);
  } else {
    errors.push(`Label "${label}" has no config/cities/${city}.yaml. Known cities: ${known.join(', ')}`);
  }
}

if (values['changed-files'] && fs.existsSync(values['changed-files'])) {
  for (const file of fs.readFileSync(values['changed-files'], 'utf8').split('\n')) {
    const m = /^config\/cities\/([^/]+)\.ya?ml$/.exec(file.trim());
    if (m && known.includes(m[1]) && !selected.has(m[1])) {
      selected.add(m[1]);
      reasons.push(`${file.trim()} changed`);
      console.log(`::notice::${file.trim()} changed, so ${m[1]} is built too.`);
    }
  }
}

const cities = known.filter((c) => selected.has(c));
if (values.require && cities.length === 0 && errors.length === 0) {
  errors.push(`Add a city label to this PR: ${known.map((c) => `city:${c}`).join(', ')}, or city:all.`);
}

for (const e of errors) console.log(`::error::${e}`);
const summary = errors.length
  ? `### City build: invalid labels\n${errors.map((e) => `- ${e}`).join('\n')}\n`
  : `### City build\nCities: **${cities.join(', ') || 'none'}**${reasons.length ? ` (${reasons.join('; ')})` : ''}\n`;
console.log(summary);

if (process.env.GITHUB_OUTPUT) {
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `cities=${JSON.stringify(cities)}\nhas_cities=${cities.length > 0}\n`);
}
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
process.exit(errors.length ? 1 : 0);
