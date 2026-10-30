const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const LEVELS = [
  ['red', 'Not permitted', 'AI is not used in course work. Uses you allow are named as exceptions.'],
  ['yellow', 'Permitted with limits', 'AI is allowed only for the program’s core uses, under conditions you set.'],
  ['green', 'Broadly permitted', 'AI is allowed across course work. The program’s core uses carry conditions.'],
];

const MEDIA = [
  ['programming', 'Programming', 'programming'],
  ['writing', 'Writing', 'writing'],
  ['research', 'Researching', 'research'],
  ['drawing', 'Drawing', 'drawing or image-making'],
  ['analysis', 'Analysis', 'analysis'],
];

// [id, medium, chip label, phrase used in the policy, tooltip]
const USES = [
  ['p_generate', 'programming', 'Generating code', 'generating code', ''],
  ['p_debug', 'programming', 'Debugging & explaining code', 'debugging or explaining code', ''],
  ['p_agent', 'programming', 'Coding agents', 'coding agents that write and run whole projects', 'Tools that plan, write, and run entire projects with little direction.'],
  ['w_ideas', 'writing', 'Brainstorming & outlining', 'brainstorming and outlining', ''],
  ['w_draft', 'writing', 'Drafting text', 'drafting text you submit', 'AI writes all or part of a text that is submitted.'],
  ['w_edit', 'writing', 'Editing & proofreading', 'editing and proofreading your own writing', ''],
  ['w_feedback', 'writing', 'Feedback on drafts', 'feedback on your own drafts', ''],
  ['w_translate', 'writing', 'Translation', 'translating text', ''],
  ['r_explain', 'research', 'Explaining concepts', 'explaining course concepts', 'Used for study. The output is not submitted.'],
  ['r_sources', 'research', 'Finding sources', 'finding sources to cite', 'AI tools can invent references and misquote sources.'],
  ['r_summary', 'research', 'Summarizing readings', 'summarizing assigned readings', ''],
  ['r_precedent', 'research', 'Precedent & site research', 'precedent and site research', ''],
  ['d_concept', 'drawing', 'Concept images', 'generating concept or reference images', 'Text-to-image or image-to-image for early ideation.'],
  ['d_render', 'drawing', 'Rendering your work', 'AI rendering of your own drawings and models', ''],
  ['d_final', 'drawing', 'Final images & drawings', 'generating images or drawings you submit', ''],
  ['d_edit', 'drawing', 'Image editing', 'AI image editing such as inpainting or cleanup', ''],
  ['d_model', 'drawing', '3D models & plans', 'generating 3D models or plans', ''],
  ['a_data', 'analysis', 'Data analysis & visualization', 'data analysis and visualization', 'Statistics, charts, and cleaning datasets.'],
  ['a_gis', 'analysis', 'GIS & spatial analysis', 'GIS and spatial analysis', ''],
  ['a_finance', 'analysis', 'Pro formas & financial models', 'building pro formas and financial models', 'Cash flows, returns, and sensitivity tables.'],
  ['a_market', 'analysis', 'Market & feasibility studies', 'market and feasibility studies', ''],
];

// [id, pill label, degrees it covers, core categories]. Every use in a core
// category starts the same way; see MATRIX.
const PROGRAMS = [
  ['arch', 'Architectural Design', 'M.Arch, MS AAD, MS UD', ['drawing', 'writing']],
  ['cdp', 'MS CDP', 'MS Computational Design Practices', ['programming', 'writing', 'analysis']],
  ['up', 'MS UP', 'MS Urban Planning', ['analysis', 'writing']],
  ['hp', 'MS HP', 'MS Historic Preservation', ['writing', 'drawing']],
  ['cccp', 'MS CCCP', 'MS Critical, Curatorial, and Conceptual Practices in Architecture', ['research', 'writing']],
  ['red', 'MS RED', 'MS Real Estate Development', ['analysis', 'writing']],
];

// Starting status of core and other uses at each level.
const MATRIX = {
  red:    { core: 'no',   other: 'no' },
  yellow: { core: 'cond', other: 'no' },
  green:  { core: 'cond', other: 'yes' },
};

const WHEN = [
  ['used', 'Whenever AI is used'],
  ['cond', 'Whenever AI is used when permitted conditionally'],
  ['none', 'Not required'],
];
const INCLUDE = [
  ['tool', 'Tool used', 'the tool'],
  ['how', 'How it was used', 'how you used it'],
  ['prompts', 'Key prompts', 'key prompts'],
  ['changes', 'What you changed', 'what you changed'],
];

const KEY = 'gsapp-ai-policy-v3';
const DEFAULTS = { level: '', program: '', status: {}, cond: {}, when: 'used', include: ['tool', 'how', 'changes'], extra: '' };
let S = structuredClone(DEFAULTS);

function coreMedia() {
  const p = PROGRAMS.find(x => x[0] === S.program);
  return p ? p[3] : [];
}
function resetStatuses() {
  if (!S.level) return;
  const c = coreMedia();
  for (const [id, m] of USES) S.status[id] = MATRIX[S.level][c.includes(m) ? 'core' : 'other'];
}

// ---------- rendering the controls ----------
$('levels').innerHTML = LEVELS.map(([v, t, d]) =>
  `<button class="level ${v}" role="radio" aria-checked="false" data-level="${v}"><strong><i></i>${t}</strong><span>${d}</span></button>`).join('');

$('programs').innerHTML = PROGRAMS.map(([v, l, name]) =>
  `<button class="pill" role="radio" aria-checked="false" data-program="${v}" title="${esc(name)}">${l}</button>`).join('');

const STATES = [['yes', '✓', 'Allowed'], ['cond', '~', 'Allowed with conditions'], ['no', '✕', 'Not allowed']];
$('media').innerHTML = MEDIA.map(([m, name]) => `<fieldset class="medium" data-medium="${m}">
  <legend>${name}</legend><p class="tally"></p>
  <div class="uses">${USES.filter(u => u[1] === m).map(([id, , label, , tip]) => `
    <div class="use" data-use="${id}">
      <span class="label">${tip ? `<abbr title="${esc(tip)}">${label}</abbr>` : label}</span>
      <span class="tri" role="radiogroup" aria-label="${esc(label)}">${STATES.map(([s, g, t]) =>
        `<button class="${s}" role="radio" aria-checked="false" data-state="${s}" aria-label="${t}" title="${t}">${g}</button>`).join('')}</span>
      <input type="text" data-cond="${id}" placeholder="Your conditions" aria-label="Conditions for ${esc(label)}" hidden>
    </div>`).join('')}</div></fieldset>`).join('');

$('when').innerHTML = WHEN.map(([v, l]) => `<button class="pill" role="radio" aria-checked="false" data-when="${v}">${l}</button>`).join('');
$('include').innerHTML = INCLUDE.map(([v, l]) => `<button class="pill" aria-pressed="false" data-include="${v}">${l}</button>`).join('');

// ---------- policy text ----------
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const stop = s => /[.!?]$/.test(s) ? s : s + '.';
function join(xs, word = 'and') {
  return xs.length < 3 ? xs.join(` ${word} `) : xs.slice(0, -1).join(', ') + `, ${word} ` + xs.at(-1);
}
// Name a whole medium when every use in it shares the state; otherwise list the uses.
function phrases(state, wholeMedium) {
  const out = [];
  for (const [m, , noun] of MEDIA) {
    const items = USES.filter(u => u[1] === m);
    const hit = items.filter(u => S.status[u[0]] === state);
    if (hit.length === items.length) out.push(wholeMedium(noun));
    else out.push(...hit.map(u => u[3]));
  }
  return out;
}
function list(intro, items, word) {
  return items.length > 4 ? intro + ':\n' + items.map(x => '• ' + cap(x) + '.').join('\n') : intro + ' ' + join(items, word) + '.';
}

function compose() {
  if (!S.level) return '';
  const p = [];
  const allowed = phrases('yes', n => n + ' tasks');
  const banned = phrases('no', n => 'any ' + n + ' task');
  const conds = USES.filter(u => S.status[u[0]] === 'cond').map(u => [u[3], (S.cond[u[0]] || '').trim()]);
  const count = s => USES.filter(u => S.status[u[0]] === s).length;
  const anyUse = count('no') < USES.length;
  // Name the exceptions to whichever default covers most of the uses.
  const restrictive = S.level === 'red' || count('no') >= count('yes');

  p.push('“Generative AI” means any tool or feature that creates or rewrites content, including chatbots, image generators, and AI features inside design and drafting software.');
  const lead = p.length - 1;
  if (S.level === 'red' || !anyUse) p[lead] += ' ' + (allowed.length
    ? list('It may not be used in this course, including for preparation and revision, except for', allowed, 'and')
    : 'It may not be used in this course, including for preparation and revision' + (conds.length ? ', except as noted below.' : '.'));
  else if (restrictive) {
    p[lead] += ' It may be used in this course only as described below. All other uses are not allowed.';
    if (allowed.length) p.push(list('It may be used for', allowed, 'and'));
  }
  else p[lead] += ' ' + (banned.length
    ? list(S.level === 'yellow' ? 'It may be used in this course within limits. It may not be used for' : 'It may be used for course work, except for', banned, 'or')
    : (conds.length ? 'It may be used for course work, subject to the conditions and requirements below.' : 'It may be used for all course work, subject to the requirements below.'));

  if (conds.length) {
    const line = ([phrase, c]) => c ? `${cap(phrase)}: ${stop(c)}` : `${cap(phrase)}: only with my prior approval.`;
    p.push(conds.length === 1
      ? `${cap(conds[0][0])} is allowed only ${conds[0][1] ? 'under this condition: ' + stop(conds[0][1]) : 'with my prior approval.'}`
      : 'The following are allowed only under these conditions:\n' + conds.map(x => '• ' + line(x)).join('\n'));
  }

  if (anyUse) p.push('You are responsible for everything you submit. Verify claims, sources, and citations, and be able to explain your work and the decisions behind it.');

  const d = [];
  const disclose = (S.when === 'used' && anyUse) || (S.when === 'cond' && conds.length > 0);
  if (S.when === 'used' && anyUse) d.push('Include an AI-use statement whenever you use AI, including in preparation.');
  if (S.when === 'cond' && conds.length) d.push('Include an AI-use statement whenever you use AI under one of the conditions above.');
  if (disclose) {
    const inc = INCLUDE.filter(x => S.include.includes(x[0])).map(x => x[2]);
    if (inc.length) d.push('Give ' + join(inc) + '.');
    if (USES.some(u => u[1] === 'drawing' && S.status[u[0]] !== 'no')) d.push('Credit AI-generated imagery in its caption, naming the tool.');
  }
  if (anyUse) d.push('Disclosure does not excuse a use that is not allowed.');
  if (d.length) p.push(d.join(' '));

  if (S.extra.trim()) p.push(S.extra.trim());

  p.push('Suspected misuse is handled under GSAPP’s academic integrity procedures. Unsure whether a use is allowed? Ask me first.');
  return p.join('\n\n');
}

function toHtml(text) {
  return text.split(/\n{2,}/).map(block => {
    const lines = block.split('\n');
    const bullets = lines.filter(l => l.startsWith('• '));
    const prose = lines.filter(l => !l.startsWith('• '));
    return (prose.length ? `<p>${esc(prose.join(' '))}</p>` : '') +
      (bullets.length ? `<ul>${bullets.map(b => `<li>${esc(b.slice(2))}</li>`).join('')}</ul>` : '');
  }).join('');
}

// ---------- sync ----------
let text = '';
function update() {
  document.querySelectorAll('[data-level]').forEach(b => b.setAttribute('aria-checked', b.dataset.level === S.level));
  document.querySelectorAll('[data-program]').forEach(b => b.setAttribute('aria-checked', b.dataset.program === S.program));
  const prog = PROGRAMS.find(x => x[0] === S.program);
  $('coreNote').textContent = prog
    ? `Core for ${prog[0] === 'arch' ? `${prog[1]} (${prog[2]})` : prog[1]}: ` + join(prog[3].map(m => MEDIA.find(x => x[0] === m)[1].toLowerCase())) + '.'
    : 'No program selected, so no category starts as core.';
  for (const f of document.querySelectorAll('.medium')) f.classList.toggle('core', coreMedia().includes(f.dataset.medium));

  $('media').classList.toggle('inactive', !S.level);
  for (const el of document.querySelectorAll('.use')) {
    const id = el.dataset.use, st = S.status[id] || '';
    el.className = 'use ' + st;
    el.querySelectorAll('[data-state]').forEach(b => b.setAttribute('aria-checked', b.dataset.state === st));
    const input = el.querySelector('input');
    input.hidden = st !== 'cond';
    if (document.activeElement !== input) input.value = S.cond[id] || '';
  }
  for (const c of document.querySelectorAll('.medium')) {
    const ids = USES.filter(u => u[1] === c.dataset.medium).map(u => u[0]);
    const n = s => ids.filter(id => S.status[id] === s).length;
    c.querySelector('.tally').textContent = S.level ? `${n('yes')} allowed · ${n('cond')} conditional · ${n('no')} not` : `${ids.length} uses`;
  }

  document.querySelectorAll('[data-when]').forEach(b => b.setAttribute('aria-checked', b.dataset.when === S.when));
  document.querySelectorAll('[data-include]').forEach(b => b.setAttribute('aria-pressed', S.include.includes(b.dataset.include)));
  $('include').classList.toggle('disabled', S.when === 'none');
  if (document.activeElement !== $('extra')) $('extra').value = S.extra;

  text = compose();
  $('policy').innerHTML = text ? toHtml(text) : '<p class="empty">Choose a starting position in step 1 to begin drafting the policy.</p>';
  for (const id of ['copy', 'png', 'svg']) $(id).disabled = !text;
  const box = $('policyBox');
  const narrow = matchMedia('(max-width: 700px)').matches;
  box.classList.toggle('overflows', narrow && ($('policy').scrollHeight > $('policy').clientHeight + 2 || !box.classList.contains('collapsed')));
  $('expand').hidden = !box.classList.contains('overflows');
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
}

// ---------- events ----------
$('levels').addEventListener('click', e => {
  const b = e.target.closest('[data-level]'); if (!b) return;
  S.level = b.dataset.level; resetStatuses(); update();
});
$('programs').addEventListener('click', e => {
  const b = e.target.closest('[data-program]'); if (!b) return;
  S.program = S.program === b.dataset.program ? '' : b.dataset.program; resetStatuses(); update();
});
$('media').addEventListener('click', e => {
  const b = e.target.closest('[data-state]'); if (!b) return;
  const el = b.closest('.use');
  S.status[el.dataset.use] = b.dataset.state; update();
  if (b.dataset.state === 'cond') el.querySelector('input').focus();
});
$('media').addEventListener('input', e => {
  if (!e.target.dataset.cond) return;
  S.cond[e.target.dataset.cond] = e.target.value; update();
});
$('when').addEventListener('click', e => {
  const b = e.target.closest('[data-when]'); if (!b) return;
  S.when = b.dataset.when; update();
});
$('include').addEventListener('click', e => {
  const b = e.target.closest('[data-include]'); if (!b) return;
  const v = b.dataset.include;
  S.include = S.include.includes(v) ? S.include.filter(x => x !== v) : [...S.include, v]; update();
});
$('extra').addEventListener('input', () => { S.extra = $('extra').value; update(); });
$('expand').onclick = () => {
  const collapsed = $('policyBox').classList.toggle('collapsed');
  $('expand').textContent = collapsed ? 'Expand ↓' : 'Collapse ↑';
  $('expand').setAttribute('aria-expanded', !collapsed);
  update();
};
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(text); $('feedback').textContent = 'Policy copied.'; }
  catch { $('feedback').textContent = 'Copy failed. Expand the policy and select the text.'; }
  setTimeout(() => $('feedback').textContent = '', 2500);
};
$('reset').onclick = () => { S = structuredClone(DEFAULTS); update(); scrollTo({ top: 0, behavior: 'smooth' }); };

try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved) S = { ...S, ...saved }; } catch {}
if (!WHEN.some(w => w[0] === S.when)) S.when = 'used';
update();
// The policy only collapses on narrow screens, so Expand comes and goes with the width.
addEventListener('resize', update);

fetch('syllabi.json').then(r => r.json())
  .then(list => $('refLink').textContent = `See reference syllabi (${list.length})`)
  .catch(() => {});

// ---------- diagram ----------
// The same choices as the page, drawn as an SVG without the policy text.
// Monospace keeps text measurement simple: every character is 0.6em wide.
const CH = 0.6;
function wrap(str, width, size) {
  const max = Math.max(8, Math.floor(width / (size * CH)));
  const out = [];
  for (const para of String(str).split('\n')) {
    let line = '';
    for (let word of para.split(/\s+/).filter(Boolean)) {
      while (word.length > max) { if (line) { out.push(line); line = ''; } out.push(word.slice(0, max)); word = word.slice(max); }
      if (!line) line = word;
      else if (line.length + 1 + word.length <= max) line += ' ' + word;
      else { out.push(line); line = word; }
    }
    out.push(line);
  }
  return out;
}

// Roboto Mono's latin subset as data URLs, so the font survives in the file and
// in the PNG. If Google Fonts is unreachable the diagram falls back to monospace.
let fontFaces;
async function fontCss() {
  if (fontFaces !== undefined) return fontFaces;
  try {
    const css = await (await fetch('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap')).text();
    const blocks = css.split('/* ').filter(b => b.startsWith('latin */')).map(b => b.slice('latin */'.length));
    fontFaces = (await Promise.all(blocks.map(async b => {
      const url = b.match(/url\((.*?)\)/)[1];
      const blob = await (await fetch(url)).blob();
      const data = await new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(blob); });
      return b.replace(url, data);
    }))).join('');
  } catch { fontFaces = ''; }
  return fontFaces;
}

async function diagramSvg() {
  const css = getComputedStyle(document.documentElement);
  const v = name => css.getPropertyValue(name).trim();
  const C = { fg: v('--fg'), dim: v('--fg-dim'), blue: v('--blue'), yes: v('--yes'), cond: v('--cond'), no: v('--no'),
    'yes-tint': v('--yes-tint'), 'cond-tint': v('--cond-tint'), 'no-tint': v('--no-tint') };
  const W = 1200, M = 48, GAP = 24, COLS = 3, colW = (W - 2 * M - GAP * (COLS - 1)) / COLS, PAD = 16;
  const out = [];
  const t = (x, y, s, size, extra = '') =>
    out.push(`<text x="${x}" y="${y}" font-size="${size}" ${extra.includes('fill=') ? '' : `fill="${C.fg}"`} ${extra}>${esc(s)}</text>`);
  const MARK = {
    yes: 'M-3.5 0 L-1 2.5 L3.5 -2.5',
    cond: 'M-3.5 0.5 Q-1.75 -2 0 0 T3.5 -0.5',
    no: 'M-3 -3 L3 3 M3 -3 L-3 3',
  };
  const dot = (x, y, st) => out.push(`<circle cx="${x}" cy="${y}" r="8" fill="${C[st]}"/><path d="${MARK[st]}" transform="translate(${x} ${y})" fill="none" stroke="${C.fg}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>`);

  let y = M + 26;
  t(M, y, 'Generative AI policy', 26, 'font-weight="700"');
  const level = LEVELS.find(l => l[0] === S.level);
  const prog = PROGRAMS.find(p => p[0] === S.program);
  y += 34;
  const tone = { red: 'no', yellow: 'cond', green: 'yes' }[S.level];
  out.push(`<circle cx="${M + 6}" cy="${y - 5}" r="6" fill="${C[tone]}"/>`);
  t(M + 20, y, `${level[1]} · ${prog ? (prog[0] === 'arch' ? `${prog[1]} (${prog[2]})` : prog[1]) : 'No program selected'}`, 15);
  y += 30;
  let lx = M;
  for (const [st, , name] of STATES) { dot(lx + 8, y - 4, st); t(lx + 22, y, name, 12, `fill="${C.dim}"`); lx += 30 + name.length * 12 * CH + 20; }
  y += 40;

  // Category boxes, each placed in the shortest column.
  const tops = Array(COLS).fill(y);
  const core = coreMedia();
  for (const [m, name] of MEDIA) {
    const rows = USES.filter(u => u[1] === m).map(([id, , label]) => {
      const st = S.status[id];
      const lines = wrap(label, colW - 2 * PAD - 28, 13);
      const cond = st === 'cond' ? wrap((S.cond[id] || '').trim() || 'With prior approval.', colW - 2 * PAD - 28, 11) : [];
      return { st, lines, cond, h: lines.length * 18 + (cond.length ? cond.length * 15 + 4 : 0) + 10 };
    });
    const h = 30 + rows.reduce((s, r) => s + r.h, 0) + PAD;
    const col = tops.indexOf(Math.min(...tops));
    const x = M + col * (colW + GAP), top = tops[col];
    out.push(`<rect x="${x}" y="${top}" width="${colW}" height="${h}" rx="22" fill="none" stroke="${C.blue}" stroke-width="1.5" stroke-dasharray="4 3"/>`);
    const isCore = core.includes(m);
    const pill = name + (isCore ? ' · core' : '');
    const pw = pill.length * 13 * CH + 28;
    out.push(`<rect x="${x + colW / 2 - pw / 2}" y="${top - 13}" width="${pw}" height="26" rx="13" fill="${isCore ? C.blue : '#fff'}" stroke="${C.blue}"/>`);
    t(x + colW / 2, top + 5, pill, 13, `font-weight="700" text-anchor="middle" fill="${isCore ? '#fff' : C.fg}"`);
    let ry = top + 30;
    for (const r of rows) {
      if (r.st) dot(x + PAD + 8, ry + 9, r.st);
      r.lines.forEach((l, i) => t(x + PAD + 26, ry + 14 + i * 18, l, 13));
      r.cond.forEach((l, i) => t(x + PAD + 26, ry + 14 + r.lines.length * 18 + 2 + i * 15, l, 11, `fill="${C.dim}" font-style="italic"`));
      ry += r.h;
    }
    tops[col] = top + h + GAP + 13;
  }
  y = Math.max(...tops) + 8;

  const section = (title, lines) => {
    t(M, y, title, 14, 'font-weight="700"'); y += 22;
    for (const l of lines) { t(M, y, l, 12); y += 18; }
    y += 18;
  };
  const when = WHEN.find(w => w[0] === S.when)[1];
  const inc = INCLUDE.filter(x => S.include.includes(x[0])).map(x => x[1].toLowerCase());
  section('Disclosure', wrap(when + (S.when !== 'none' && inc.length ? `. Include: ${join(inc)}.` : '.'), W - 2 * M, 12));
  if (S.extra.trim()) section('Additional language', wrap(S.extra.trim(), W - 2 * M, 12));
  t(M, y, 'GSAPP AI Policy Generator · policy.adamvosburgh.com', 11, `fill="${C.dim}"`);
  const H = y + M - 10;

  const font = await fontCss();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">` +
    `<style>${font} text { font-family: 'Roboto Mono', monospace; }</style>` +
    `<rect width="${W}" height="${H}" fill="#fff"/>${out.join('')}</svg>`;
}

function save(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$('svg').onclick = async () => save(new Blob([await diagramSvg()], { type: 'image/svg+xml' }), 'ai-policy-diagram.svg');
$('png').onclick = async () => {
  const svg = await diagramSvg();
  const img = new Image();
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.width * 2; canvas.height = img.height * 2;
  const ctx = canvas.getContext('2d');
  ctx.scale(2, 2); ctx.drawImage(img, 0, 0);
  canvas.toBlob(b => save(b, 'ai-policy-diagram.png'), 'image/png');
};
