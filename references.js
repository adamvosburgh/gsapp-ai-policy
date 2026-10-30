const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

$('addLink').href = SYLLABI_FORM;

function render(list) {
  $('count').textContent = list.length
    ? `${list.length} ${list.length === 1 ? 'syllabus' : 'syllabi'}.`
    : 'No syllabi yet. Add the first one.';
  list.sort((a, b) => a.university.localeCompare(b.university) || a.number.localeCompare(b.number, undefined, { numeric: true }));
  $('refs').innerHTML = list.map(s => `<article class="syllabus">
    <p class="step">${[s.university, s.number].filter(Boolean).map(esc).join(' · ')}</p>
    <h2>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.name)} ↗</a>` : esc(s.name)}</h2>
    <p class="faculty">${esc(s.faculty)}</p>
    ${s.policy ? `<blockquote>${esc(s.policy).split(/\n{2,}/).map(p => `<p>${p}</p>`).join('')}</blockquote>` : ''}
  </article>`).join('');
}
loadSyllabi().then(render).catch(() => { $('count').textContent = 'The list could not be loaded.'; });
