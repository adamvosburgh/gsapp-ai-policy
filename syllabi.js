// Reference syllabi, shared by both pages. Submissions go through a Google Form
// limited to LionMail, which writes to a Sheet in a personal account, because
// Columbia blocks publishing LionMail Sheets. That Sheet is published as CSV
// for this static site to read.
const SYLLABI_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSffPzoGP2kABDWL27SPY-79Q39XSPhov5lV7ty5VzdKDvYyjQ/viewform';
const SYLLABI_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSS4gzLrTqfhy4Tj-Nstf1_lrWRGPcRM067mfPzGwzeP5joxW2IzwUD4duLtm_JHxKu_ModIsmXRq7H/pub?gid=1400076214&single=true&output=csv';

// Form questions are matched by their wording, so renaming one slightly does
// not break the list. Earlier keys claim their column first: "Faculty name(s)"
// must go to faculty before "Course name" is looked for.
const COLUMNS = [
  ['faculty', /faculty|instructor|professor/i],
  ['pdf', /pdf|upload|file/i],
  ['link', /link|url|website/i],
  ['policy', /policy/i],
  ['number', /number|code/i],
  ['university', /universit|school|institution/i],
  ['name', /name|title/i],
];

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c !== '"') field += c;
      else if (text[i + 1] === '"') { field += '"'; i++; }
      else quoted = false;
    }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    }
    else field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Resolves to [{ university, number, name, faculty, url, policy }].
// A link the submitter typed wins over an uploaded PDF.
async function loadSyllabi() {
  if (!SYLLABI_CSV) return [];
  const [header = [], ...rows] = parseCsv(await (await fetch(SYLLABI_CSV)).text());
  const col = {};
  for (const [key, re] of COLUMNS) {
    const i = header.findIndex((h, i) => re.test(h) && !Object.values(col).includes(i));
    if (i >= 0) col[key] = i;
  }
  const get = (row, key) => (col[key] === undefined ? '' : row[col[key]] || '').trim();
  const safe = url => /^https?:\/\//i.test(url) ? url : '';
  return rows.map(row => ({
    university: get(row, 'university'),
    number: get(row, 'number'),
    name: get(row, 'name'),
    faculty: get(row, 'faculty'),
    // An upload question can hold several files, comma-separated; the first is the syllabus.
    url: safe(get(row, 'link')) || safe(get(row, 'pdf').split(/,\s*/)[0]),
    policy: get(row, 'policy'),
  })).filter(s => s.name);
}
