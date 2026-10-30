// Adds the entry in a submission issue to syllabi.json. The issue body is
// untrusted: only the known fields are kept, as trimmed, length-capped strings.
// Writes `added=true` or `error=<reason>` to the step's outputs.
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';

const FIELDS = { university: 200, number: 100, name: 300, faculty: 500, url: 2000, policy: 20000 };
const REQUIRED = ['university', 'number', 'name', 'faculty', 'policy'];
const output = line => appendFileSync(process.env.GITHUB_OUTPUT, line + '\n');
const fail = reason => { output(`error=${reason.replace(/\n/g, ' ')}`); process.exit(0); };

const body = process.env.ISSUE_BODY || '';
const json = (body.match(/```(?:json)?\s*([\s\S]*?)```/) || body.match(/(\{[\s\S]*\})/) || [])[1];
if (!json) fail('the issue does not contain the entry.');

let raw;
try { raw = JSON.parse(json); } catch { fail('the entry is not valid JSON.'); }
if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('the entry is not valid JSON.');

const entry = {};
for (const [key, max] of Object.entries(FIELDS)) {
  const value = typeof raw[key] === 'string' ? raw[key].trim() : '';
  if (value.length > max) fail(`the ${key} is longer than ${max} characters.`);
  if (value) entry[key] = value;
}
const missing = REQUIRED.filter(k => !entry[k]);
if (missing.length) fail(`missing ${missing.join(', ')}.`);
if (entry.url && !/^https?:\/\/\S+$/.test(entry.url)) fail('the link must start with https://.');

const list = JSON.parse(readFileSync('syllabi.json', 'utf8'));
// A resubmission of the same course replaces the earlier entry.
const same = s => s.university === entry.university && s.number === entry.number && s.name === entry.name;
const i = list.findIndex(same);
if (i >= 0 && JSON.stringify(list[i]) === JSON.stringify(entry)) fail('this syllabus is already listed.');
if (i >= 0) list[i] = entry; else list.push(entry);

writeFileSync('syllabi.json', JSON.stringify(list, null, 2) + '\n');
output('added=true');
