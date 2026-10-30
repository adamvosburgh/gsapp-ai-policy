const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

// The site is static, so a submission becomes a GitHub issue holding the entry
// as JSON. .github/workflows/add-syllabus.yml adds it to syllabi.json.
const ISSUES = 'https://github.com/adamvosburgh/gsapp-ai-policy/issues/new';
const MAX_URL = 7500; // GitHub rejects longer issue links; past this the body goes via the clipboard

// ---------- list ----------
// syllabi.json: [{ university, number, name, faculty, url?, policy }]
function render(list) {
  $('count').textContent = list.length
    ? `${list.length} ${list.length === 1 ? 'syllabus' : 'syllabi'}.`
    : 'No syllabi yet. Add the first one.';
  list.sort((a, b) => a.university.localeCompare(b.university) || a.number.localeCompare(b.number, undefined, { numeric: true }));
  $('refs').innerHTML = list.map(s => `<article class="syllabus">
    <p class="step">${esc(s.university)} · ${esc(s.number)}</p>
    <h2>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>` : esc(s.name)}</h2>
    <p class="faculty">${esc(s.faculty)}</p>
    <blockquote>${esc(s.policy).split(/\n{2,}/).map(p => `<p>${p}</p>`).join('')}</blockquote>
  </article>`).join('');
}
fetch('syllabi.json').then(r => r.json()).then(render).catch(() => { $('count').textContent = 'The list could not be loaded.'; });

// ---------- form ----------
$('addToggle').onclick = () => {
  const open = $('addForm').hidden;
  $('addForm').hidden = !open;
  $('addToggle').setAttribute('aria-expanded', open);
  if (open) $('addForm').querySelector('[name=number]').focus();
};

$('addForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target, status = $('formStatus');
  for (const field of form.querySelectorAll('[required]')) {
    if (!field.value.trim()) { status.textContent = 'Fill in every field except the link.'; field.focus(); return; }
  }
  const url = form.url.value.trim();
  if (url && !form.url.checkValidity()) { status.textContent = 'The link should start with https://'; form.url.focus(); return; }

  const entry = Object.fromEntries(['university', 'number', 'name', 'faculty', 'url', 'policy']
    .map(k => [k, form[k].value.trim()]).filter(([, v]) => v));
  const title = `Syllabus: ${entry.number} ${entry.name}`;
  const body = 'Entry for syllabi.json:\n\n```json\n' + JSON.stringify(entry, null, 2) + '\n```\n';
  let link = `${ISSUES}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
  if (link.length > MAX_URL) {
    try { await navigator.clipboard.writeText(body); }
    catch { status.textContent = 'The policy is too long to send this way. Shorten it and try again.'; return; }
    link = `${ISSUES}?title=${encodeURIComponent(title)}&body=${encodeURIComponent('Paste the entry here. It was copied to your clipboard.')}`;
    status.textContent = 'Your entry was copied. Paste it into the GitHub issue that just opened.';
  } else {
    status.textContent = 'Your entry is filled in on GitHub. Post the issue there, and it appears here within a few minutes.';
  }
  window.open(link, '_blank', 'noopener');
});
