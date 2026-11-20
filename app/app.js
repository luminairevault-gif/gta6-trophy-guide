// Leonida Trophy Guide: a checklist tracker for the 55 GTA VI trophies.
// Progress lives in localStorage, exports to a file and imports back.
// Story spoilers stay hidden until a story trophy is earned.
const STORAGE_KEY = 'leonida-trophy-guide-progress-v1';
const SPOILER_KEY = 'leonida-trophy-guide-hide-spoilers-v1';

const listEl = document.getElementById('trophy-list');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoilers');
const earnedOnlyEl = document.getElementById('earned-only');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const countLine = document.getElementById('count-line');
const emptyNote = document.getElementById('empty-note');

const response = await fetch('data/trophies.json');
const doc = await response.json();
const trophies = doc.trophies;
const sourceUrls = new Map((doc.about.sources || []).map((s) => [s.name, s.url]));

let earned = loadEarned();
let hideSpoilers = loadSpoilerSetting();

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

function loadSpoilerSetting() {
  const raw = localStorage.getItem(SPOILER_KEY);
  return raw === null ? true : raw === 'true';
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort()));
}

function saveSpoilerSetting() {
  localStorage.setItem(SPOILER_KEY, String(hideSpoilers));
}

function isStorySpoiler(trophy) {
  return trophy.kind === 'story' && trophy.hidden === true;
}

function trophyVisible(trophy) {
  if (kindEl.value === 'story' && trophy.kind !== 'story') return false;
  if (kindEl.value === 'missable' && trophy.missable !== true) return false;
  if (kindEl.value === 'collectibles' && trophy.kind !== 'collectibles') return false;
  if (kindEl.value === 'activities' && trophy.kind !== 'activities') return false;
  if (kindEl.value === 'online') return false;
  if (gradeEl.value !== 'all' && trophy.grade !== gradeEl.value) return false;
  if (earnedOnlyEl.checked && !earned.has(trophy.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(trophy.name.toLowerCase().includes(q) || trophy.description.toLowerCase().includes(q) || trophy.guide.toLowerCase().includes(q))) return false;
  return true;
}

function sourceLinks(names) {
  const parts = [];
  for (const name of names || []) {
    const url = sourceUrls.get(name);
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.textContent = name;
      parts.push(a);
    } else {
      parts.push(document.createTextNode(name));
    }
  }
  return parts;
}

function buildCard(trophy) {
  const li = document.createElement('li');
  li.className = 'trophy-card';
  if (earned.has(trophy.name)) li.classList.add('earned');
  if (trophy.missable) li.classList.add('missable-card');

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    saveEarned();
    render();
  });
  head.append(box);

  const title = document.createElement('div');
  title.className = 'trophy-title';
  const nameEl = document.createElement('div');
  nameEl.className = 'trophy-name';
  const descEl = document.createElement('p');
  descEl.className = 'trophy-desc';
  const spoilered = hideSpoilers && isStorySpoiler(trophy) && !earned.has(trophy.name);
  if (spoilered) {
    nameEl.textContent = 'Hidden story trophy';
    nameEl.classList.add('spoiler-hidden');
    descEl.textContent = 'Hidden until earned — turn off “Hide story spoilers” to reveal it.';
    descEl.classList.add('spoiler-hidden');
  } else {
    nameEl.textContent = trophy.name;
    descEl.textContent = trophy.description;
  }
  title.append(nameEl, descEl);

  const badges = document.createElement('div');
  badges.className = 'badges';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = 'badge ' + trophy.grade;
  gradeBadge.textContent = trophy.grade;
  badges.append(gradeBadge);
  if (trophy.hidden) {
    const b = document.createElement('span');
    b.className = 'badge hidden-badge';
    b.textContent = 'Hidden';
    badges.append(b);
  }
  if (trophy.missable) {
    const b = document.createElement('span');
    b.className = 'badge missable-badge';
    b.textContent = 'Missable';
    badges.append(b);
  }
  if (trophy.unsolved) {
    const b = document.createElement('span');
    b.className = 'badge unsolved-badge';
    b.textContent = 'Unsolved';
    badges.append(b);
  }
  if (typeof trophy.count === 'number') {
    const b = document.createElement('span');
    b.className = 'badge count-badge';
    b.textContent = 'Target: ' + trophy.count.toLocaleString('en-US');
    badges.append(b);
  }
  const stageBadge = document.createElement('span');
  stageBadge.className = 'badge';
  stageBadge.textContent = 'Roadmap stage ' + trophy.stage;
  badges.append(stageBadge);
  title.append(badges);
  head.append(title);
  li.append(head);

  const guide = document.createElement('details');
  guide.className = 'trophy-guide';
  const summary = document.createElement('summary');
  summary.textContent = spoilered ? 'Guide (hidden with the spoiler)' : 'How to get it';
  guide.append(summary);
  const guideText = document.createElement('p');
  guideText.textContent = trophy.guide;
  guide.append(guideText);
  const sources = document.createElement('p');
  sources.className = 'guide-sources';
  sources.append(document.createTextNode('Sources: '));
  for (const [i, part] of sourceLinks(trophy.sources).entries()) {
    if (i > 0) sources.append(document.createTextNode(', '));
    sources.append(part);
  }
  guide.append(sources);
  li.append(guide);
  return li;
}

function renderRoadmap() {
  for (const stage of [1, 2, 3]) {
    const el = document.getElementById('stage-' + stage + '-trophies');
    const names = trophies.filter((t) => t.stage === stage).map((t) => t.name);
    el.textContent = 'Trophies in this stage (' + names.length + '): ' + names.join(' · ');
  }
  const missable = trophies.filter((t) => t.missable);
  document.getElementById('missable-callout').textContent =
    'Missable trophies: ' + missable.length + ' — ' + missable.map((t) => t.name).join(', ') +
    '. Every story trophy is unmissable: it pops when its mission or chapter ends. Only the first meditation can be missed, and only in Chapter 1.';
}

function renderNotes() {
  document.getElementById('honest-note').textContent = doc.about.note;
  document.getElementById('online-note').textContent =
    'Online filter: this game has no online trophies — all 55 are single-player.';
  const footer = document.getElementById('footer-sources');
  footer.append(document.createTextNode('Sources for this guide: '));
  for (const [i, s] of (doc.about.sources || []).entries()) {
    if (i > 0) footer.append(document.createTextNode(' · '));
    const a = document.createElement('a');
    a.href = s.url;
    a.textContent = s.name;
    footer.append(a);
  }
}

function render() {
  const shown = trophies.filter(trophyVisible);
  listEl.replaceChildren(...shown.map(buildCard));
  emptyNote.hidden = shown.length !== 0;
  const total = trophies.length;
  const done = [...earned].filter((n) => trophies.some((t) => t.name === n)).length;
  progressFill.style.width = Math.round((done / total) * 100) + '%';
  progressText.textContent = done + ' of ' + total + ' earned' + (done === total ? ' — platinum! Leonida Legend.' : '');
  const missableLeft = trophies.filter((t) => t.missable && !earned.has(t.name)).length;
  countLine.textContent = 'Showing ' + shown.length + ' of ' + total + ' trophies' +
    (kindEl.value === 'online' ? ' — there are no online trophies in this game.' : '') +
    (missableLeft > 0 ? ' · ' + missableLeft + ' missable trophy still unearned.' : ' · Missable trophy earned.');
}

function download(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

document.getElementById('export').addEventListener('click', () => {
  download('gta6-trophy-progress.json', JSON.stringify({ game: 'GTA VI', earned: [...earned].sort() }, null, 2));
});

document.getElementById('import').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(names)) throw new Error('No earned list found');
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set(names.filter((n) => typeof n === 'string' && known.has(n)));
    saveEarned();
    render();
  } catch {
    countLine.textContent = 'Import failed: that file is not a trophy-progress export from this guide.';
  }
  event.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  earned = new Set();
  saveEarned();
  render();
});

spoilerEl.checked = hideSpoilers;
spoilerEl.addEventListener('change', () => {
  hideSpoilers = spoilerEl.checked;
  saveSpoilerSetting();
  render();
});
searchEl.addEventListener('input', render);
kindEl.addEventListener('change', render);
gradeEl.addEventListener('change', render);
earnedOnlyEl.addEventListener('change', render);

renderRoadmap();
renderNotes();
render();
