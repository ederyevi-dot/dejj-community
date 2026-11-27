// DEJJ Community — application principale
import { firebaseConfig } from './firebase-config.js';
import { SEED_CARDS, SEED_WORDS, SEED_ANECDOTES, SEED_QUIZ } from './seed.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  getFirestore, collection, collectionGroup, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc,
  onSnapshot, writeBatch, increment, serverTimestamp, Timestamp
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

/* ============================== Outils ============================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const utcKey = () => { const d = new Date(); return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); };
const dayNumber = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const slug = (s) => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const toDate = (v) => (v && v.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : null);
const fmtDay = (d) => cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmtMonth = (d) => cap(d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
const toLocalInput = (d) => `${localDay(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function cut(text, cls = 'big') {
  const spans = [...String(text)].map((ch) => (ch === ' ' ? '<span class="sp"></span>' : `<span>${esc(ch)}</span>`)).join('');
  return `<h2 class="cut ${cls}" aria-label="${esc(text)}">${spans}</h2>`;
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200);
}
const go = (h) => { location.hash = h; };

/* ============================== Constantes ============================== */
const RAR = {
  commune: { label: 'Commune', w: 60 },
  rare: { label: 'Rare', w: 28 },
  epique: { label: 'Épique', w: 9 },
  legendaire: { label: 'Légendaire', w: 3 }
};
const DELS = { Marseille: 2995469, Paris: 2988507, Nice: 2990440, Lyon: 2996944 };
const PACK_SIZE = 5;

/* ============================== Firebase ============================== */
const CONFIGURED = firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('COLLE');
let auth = null, db = null;
if (CONFIGURED) {
  const fbApp = initializeApp(firebaseConfig);
  auth = getAuth(fbApp);
  db = getFirestore(fbApp);
} else {
  const b = $('#cfg-banner');
  b.hidden = false;
  b.textContent = 'Mode aperçu : colle ta configuration Firebase dans firebase-config.js pour activer les comptes, les inscriptions et les boosters.';
}

/* ============================== État ============================== */
const S = {
  user: null, profile: null,
  events: [], news: [], cards: [], anecdotes: [], quiz: [],
  rsvps: [], collection: new Map(),
  dayCard: null, dayWord: null,
  lock: false, authMode: 'login',
  del: localStorage.getItem('dejj-del') || 'Marseille',
  wordState: { guess: '', hint: false, revealed: false, result: '' },
  quizState: { i: 0, score: 0, picked: null, done: false },
  adm: { tab: 'events', docs: [], edit: null },
  modal: null, rsvpBusy: false
};
const allCards = () => (S.cards.length ? S.cards : SEED_CARDS);
const isAdmin = () => S.profile?.role === 'admin';
const cardById = (id) => allCards().find((c) => c.id === id);

/* ============================== Routage ============================== */
const NAV = [
  ['#/', 'Accueil', '🏠'], ['#/agenda', 'Agenda', '📅'], ['#/boosters', 'Boosters', '🎴'],
  ['#/album', 'Album', '📚'], ['#/saga', 'La Saga', '📰'], ['#/chabbat', 'Chabbat', '🕯️']
];
function route() { return location.hash || '#/'; }

function renderNav() {
  const r = route();
  const items = [...NAV];
  if (isAdmin()) items.push(['#/admin', 'Admin', '⚙️']);
  const on = (h) => (h === '#/' ? r === '#/' : r.startsWith(h));
  $('#nav').innerHTML = items.map(([h, l]) => `<a href="${h}" class="${on(h) ? 'on' : ''}">${l}</a>`).join('');
  $('#tabbar').innerHTML = items.filter(([h]) => h !== '#/saga' || !isAdmin())
    .map(([h, l, i]) => `<a href="${h}" class="${on(h) ? 'on' : ''}"><b>${i}</b>${l}</a>`).join('');
  const acc = $('#head-account');
  acc.textContent = S.user ? (S.profile?.name || 'Mon compte') : 'Connexion';
  const n = notifications().length;
  const bn = $('#bell-n'); bn.hidden = !n; bn.textContent = n;
}

let refreshQueued = false;
function refresh(force = false) {
  if (refreshQueued && !force) return;
  refreshQueued = true;
  requestAnimationFrame(() => {
    refreshQueued = false;
    renderNav();
    if (S.modal) renderModal();
    if (S.lock) return;
    if (!force && route().startsWith('#/admin')) return; // ne pas effacer un formulaire en cours
    render();
  });
}
window.addEventListener('hashchange', () => { closeModal(); refresh(true); window.scrollTo(0, 0); });

function render() {
  const r = route();
  const v = $('#view');
  let html;
  if (r === '#/agenda') html = pageAgenda();
  else if (r === '#/boosters') html = pageBoosters();
  else if (r === '#/album') html = pageAlbum();
  else if (r === '#/saga') html = pageSaga();
  else if (r === '#/chabbat') html = pageChabbat();
  else if (r === '#/compte') html = pageAccount();
  else if (r.startsWith('#/admin')) html = pageAdmin();
  else html = pageHome();
  v.innerHTML = html;
  hydrate();
}

/* ============================== Cartes ============================== */
function initials(name) { return String(name).split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(); }

const SYM = { commune: '●', rare: '◆', epique: '★', legendaire: '✦' };

// Essaie d'autres extensions si la photo n'est pas trouvée (.png, .jpg, .jpeg, .webp).
window.imgFallback = (img) => {
  const alt = (img.dataset.alt || '').split('|').filter(Boolean);
  if (!alt.length) { img.remove(); return; }
  img.src = alt.shift();
  img.dataset.alt = alt.join('|');
};

function cardHTML(c, { full = false, count = 0, lock = false, tilt = true } = {}) {
  const r = RAR[c.rarity] ? c.rarity : 'commune';
  let img = '';
  if (c.image && !lock) {
    const base = c.image.replace(/\.(png|jpe?g|webp)$/i, '');
    const cands = [...new Set([c.image, base + '.png', base + '.jpg', base + '.jpeg', base + '.webp'])];
    img = `<img src="${esc(cands[0])}" data-alt="${esc(cands.slice(1).join('|'))}" alt="${esc(c.name)}" loading="lazy" onerror="window.imgFallback(this)" style="object-position:${esc(c.imagePos || '50% 22%')}">`;
  }
  return `<div class="tcg r-${r} ${full ? 'full' : 'mini'} ${lock ? 'lock' : ''} ${tilt && !lock ? 'tilt' : ''}" data-card="${esc(c.id)}"><div class="tcg-in"><div class="tcg-face">
    <div class="tcg-head"><h3>${esc(c.name)}</h3><span class="tcg-sym" title="${RAR[r].label}">${SYM[r]}</span></div>
    <div class="tcg-art">${img}<span class="tcg-ph">${lock ? '?' : esc(initials(c.name))}</span><i class="tcg-shine"></i></div>
    <div class="tcg-type"><span>${esc(c.role || RAR[r].label)}</span>${c.years ? `<b>${esc(c.years)}</b>` : ''}</div>
    <div class="tcg-text">${c.nickname ? `<p class="tcg-nick">Totem · ${esc(c.nickname)}</p>` : ''}${c.bio ? `<p class="tcg-bio">${esc(c.bio)}</p>` : ''}${c.quote ? `<p class="tcg-quote">${esc(c.quote)}</p>` : ''}</div>
    <div class="tcg-foot"><span>${RAR[r].label}</span><span>${esc(c.collection || 'DEJJ')}</span></div>
    <i class="tcg-holo"></i><i class="tcg-spark"></i><i class="tcg-glare"></i>
    ${count > 1 ? `<span class="qty">×${count}</span>` : ''}
  </div></div></div>`;
}

function cardDetails(c) {
  const tl = (c.timeline || []).filter(Boolean);
  return `<div class="card-details">
    ${c.nickname ? `<p class="type">Totem : <b>${esc(c.nickname)}</b></p>` : ''}
    ${c.bio ? `<p>${esc(c.bio)}</p>` : ''}
    ${c.quote ? `<blockquote>${esc(c.quote)}${c.quoteBy ? `<cite>${esc(c.quoteBy)}</cite>` : ''}</blockquote>` : ''}
    ${tl.length ? `<ul class="tl">${tl.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
  </div>`;
}

/* Inclinaison 3D et reflets holographiques (cartes et paquet) */
function tiltMove(e) {
  const c = e.target.closest?.('.tilt'); if (!c) return;
  const r = c.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  c.classList.add('hot');
  c.style.setProperty('--mx', (x * 100).toFixed(1));
  c.style.setProperty('--my', (y * 100).toFixed(1));
  c.style.setProperty('--rx', ((0.5 - y) * 18).toFixed(1) + 'deg');
  c.style.setProperty('--ry', ((x - 0.5) * 22).toFixed(1) + 'deg');
}
function tiltEnd(e) {
  const c = e.target.closest?.('.tilt'); if (!c) return;
  if (e.relatedTarget && c.contains(e.relatedTarget)) return;
  c.classList.remove('hot');
  ['--mx', '--my', '--rx', '--ry'].forEach((p) => c.style.removeProperty(p));
}
document.addEventListener('pointermove', tiltMove, { passive: true });
document.addEventListener('pointerout', tiltEnd, { passive: true });
document.addEventListener('pointerup', (e) => { if (e.pointerType === 'touch') tiltEnd({ target: e.target, relatedTarget: null }); }, { passive: true });

function pickRarity(minRare) {
  let total = 0; const list = Object.entries(RAR).filter(([k]) => !minRare || k !== 'commune');
  list.forEach(([, v]) => (total += v.w));
  let x = Math.random() * total;
  for (const [k, v] of list) { if ((x -= v.w) < 0) return k; }
  return list[0][0];
}
function drawPack() {
  const cards = allCards(); const pack = [];
  for (let i = 0; i < PACK_SIZE; i++) {
    let rar = pickRarity(i === PACK_SIZE - 1);
    let pool = cards.filter((c) => c.rarity === rar);
    if (!pool.length) pool = cards.filter((c) => c.rarity !== 'legendaire').length ? cards.filter((c) => c.rarity !== 'legendaire') : cards;
    pack.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return pack;
}
function canOpenBooster() { return S.user && (S.profile?.lastBoosterDay || 0) < utcKey(); }
function nextBoosterText() {
  const d = new Date(); const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
  return `Prochain booster ${next.toDateString() === d.toDateString() ? 'aujourd\'hui' : 'à ' + fmtTime(next)}`;
}

/* ============================== Pages ============================== */
function upcomingEvents() {
  const now = Date.now() - 3 * 36e5;
  return S.events.filter((e) => toDate(e.date) && toDate(e.date).getTime() >= now).sort((a, b) => toDate(a.date) - toDate(b.date));
}

function evStats(ev) {
  const rs = S.rsvps.filter((r) => r.eventId === ev.id);
  const ms = (r) => (r.createdAt?.toMillis ? r.createdAt.toMillis() : Date.now());
  const yes = rs.filter((r) => r.answer === 'yes').sort((a, b) => ms(a) - ms(b));
  const no = rs.filter((r) => r.answer === 'no');
  const capN = Number(ev.capacity) || 0;
  const confirmed = capN ? yes.slice(0, capN) : yes;
  const waitlist = capN ? yes.slice(capN) : [];
  const mine = S.user ? rs.find((r) => r.uid === S.user.uid) : null;
  const myStatus = !mine ? null : mine.answer === 'no' ? 'no' : confirmed.includes(mine) ? 'yes' : 'wait';
  return { capN, confirmed, waitlist, no, mine, myStatus, left: capN ? Math.max(0, capN - confirmed.length) : null, waitRank: mine ? waitlist.indexOf(mine) + 1 : 0 };
}

function eventRow(ev) {
  const d = toDate(ev.date); const st = evStats(ev);
  const places = st.capN ? (st.left ? `${st.left} place${st.left > 1 ? 's' : ''} restante${st.left > 1 ? 's' : ''}` : 'Complet') : 'Places illimitées';
  const chip = st.myStatus === 'yes' ? '<span class="chip g">Tu participes</span>' : st.myStatus === 'wait' ? '<span class="chip y">Liste d\'attente</span>' : st.myStatus === 'no' ? '<span class="chip">Absent</span>' : '';
  return `<button class="event" data-act="event" data-id="${esc(ev.id)}">
    <div class="datebox"><small>${esc(d.toLocaleDateString('fr-FR', { month: 'short' }))}</small><b>${d.getDate()}</b><small>${esc(d.toLocaleDateString('fr-FR', { weekday: 'short' }))}</small></div>
    <div><h3>${esc(ev.title)}</h3>
      <div class="meta">${fmtTime(d)} · ${esc(ev.place || 'Lieu à préciser')}</div>
      <div class="row" style="margin-top:.4rem"><span class="chip o">${places}</span>${S.user ? `<span class="chip">${st.confirmed.length} inscrit${st.confirmed.length > 1 ? 's' : ''}</span>` : ''}${chip}</div>
    </div></button>`;
}

function pageHome() {
  const evs = upcomingEvents().slice(0, 3);
  const dc = S.dayCard || dailyCard();
  const word = todayWord();
  return `
  <section class="hero tape">
    <span class="date">${esc(fmtDay(new Date()))}</span>
    ${cut('DEJJ Community', 'big')}
    <p>Événements, cartes à collectionner, mémoire de l'association : toute la communauté au même endroit.</p>
    <div class="hero-cta">
      <a class="btn alt" href="#/boosters">Mon booster du jour</a>
      <a class="btn ghost" style="color:var(--cream);border-color:var(--cream)" href="#/agenda">Voir l'agenda</a>
    </div>
  </section>
  <div class="grid g2">
    <section class="block span2">
      <span class="kicker">À venir</span>${cut('Prochains événements', 'mid')}
      <div class="events" style="margin-top:.8rem">${evs.length ? evs.map(eventRow).join('') : '<div class="empty">Aucun événement programmé pour le moment.</div>'}</div>
      ${S.events.length ? '<p><a href="#/agenda">Tout l\'agenda →</a></p>' : ''}
    </section>
    <section class="block alt tape">
      <span class="kicker">Mot du jour</span>
      ${wordBlock(word)}
    </section>
    <section class="block tape">
      <span class="kicker">Carte du jour</span>
      <div style="margin-top:.9rem;display:grid;place-items:center">${dc ? `<div style="width:min(240px,100%)" data-act="card" data-id="${esc(dc.id)}">${cardHTML(dc, { full: true })}</div>` : '<div class="empty">Pas de carte aujourd\'hui.</div>'}</div>
    </section>
    <section class="block dark">
      <span class="kicker" style="background:var(--yellow);color:var(--navy)">Chabbat · ${esc(S.del)}</span>
      <div id="js-shabbat" data-mini="1" style="margin-top:.7rem">Chargement des horaires...</div>
      <p style="margin:.5rem 0 0"><a href="#/chabbat">Horaires et paracha →</a></p>
    </section>
    <section class="block">
      <span class="kicker">Booster</span>
      <p class="serif" style="font-size:1.15rem">${!S.user ? 'Connecte-toi pour ouvrir ton booster gratuit du jour.' : canOpenBooster() ? 'Ton booster du jour t\'attend.' : 'Booster du jour déjà ouvert. ' + esc(nextBoosterText()) + '.'}</p>
      <a class="btn" href="#/boosters">${S.user && canOpenBooster() ? 'Ouvrir' : 'Voir les boosters'}</a>
    </section>
    <section class="block span2">
      <span class="kicker">Actualités</span>${cut('Les dernières nouvelles', 'mid')}
      <div style="margin-top:.8rem">${S.news.length ? S.news.slice(0, 3).map(newsItem).join('') : '<div class="empty">Pas encore d\'actualité.</div>'}</div>
    </section>
  </div>`;
}

function newsItem(n) {
  const d = toDate(n.createdAt);
  return `<article class="timeline-item"><h3>${esc(n.title)}</h3>${d ? `<div class="muted type">${esc(fmtDay(d))}</div>` : ''}<p>${esc(n.body)}</p></article>`;
}

function pageAgenda() {
  const evs = upcomingEvents();
  const past = S.events.filter((e) => !evs.includes(e) && toDate(e.date)).sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 5);
  let html = `<span class="kicker">Calendrier</span>${cut('Agenda', 'big')}`;
  if (!evs.length) html += '<div class="empty" style="margin-top:1rem">Aucun événement à venir.</div>';
  let lastMonth = '';
  evs.forEach((e) => {
    const m = fmtMonth(toDate(e.date));
    if (m !== lastMonth) { html += `<div class="month">${esc(m)}</div>`; lastMonth = m; }
    html += `<div class="events" style="margin-bottom:.8rem">${eventRow(e)}</div>`;
  });
  if (past.length) html += `<h3 class="sec-title type">Événements passés</h3><div class="events" style="opacity:.65">${past.map(eventRow).join('')}</div>`;
  return html;
}

function renderModal() {
  const m = $('#modal');
  if (!S.modal) { m.hidden = true; m.innerHTML = ''; return; }
  m.hidden = false;
  let inner = '';
  if (S.modal.type === 'event') {
    const ev = S.events.find((e) => e.id === S.modal.id);
    if (!ev) { closeModal(); return; }
    const d = toDate(ev.date); const st = evStats(ev);
    let actions = '';
    if (!S.user) actions = '<a class="btn" href="#/compte">Connecte-toi pour participer</a>';
    else if (st.capN) {
      actions = st.myStatus === 'yes' || st.myStatus === 'wait'
        ? `<button class="btn navy" data-act="rsvp" data-id="${esc(ev.id)}" data-ans="no">Me désister</button>`
        : `<button class="btn" data-act="rsvp" data-id="${esc(ev.id)}" data-ans="yes">${st.left ? 'Je participe' : 'Rejoindre la liste d\'attente'}</button>`;
    } else {
      actions = `<button class="btn ${st.myStatus === 'yes' ? '' : 'alt'}" data-act="rsvp" data-id="${esc(ev.id)}" data-ans="yes">${st.myStatus === 'yes' ? '✓ ' : ''}Je participe</button>
                 <button class="btn ${st.myStatus === 'no' ? 'navy' : 'alt'}" data-act="rsvp" data-id="${esc(ev.id)}" data-ans="no">${st.myStatus === 'no' ? '✓ ' : ''}Je ne participe pas</button>`;
    }
    const status = st.myStatus === 'yes' ? '<p class="good">Ta participation est confirmée.</p>' : st.myStatus === 'wait' ? `<p class="bad" style="color:#b36b00">Tu es en liste d'attente (position ${st.waitRank}). Tu seras confirmé automatiquement si une place se libère.</p>` : '';
    const pct = st.capN ? Math.min(100, Math.round((st.confirmed.length / st.capN) * 100)) : 0;
    inner = `<button class="x" data-act="close" aria-label="Fermer">✕</button>
      <span class="kicker">${esc(fmtDay(d))} · ${fmtTime(d)}</span>
      <h2 class="serif" style="font-size:1.8rem;margin:.5rem 0">${esc(ev.title)}</h2>
      <p class="type">📍 ${esc(ev.place || 'Lieu à préciser')}</p>
      <p>${esc(ev.description || '').replace(/\n/g, '<br>')}</p>
      ${S.user ? (st.capN ? `<div class="bar"><i style="width:${pct}%"></i></div><p><b>${st.confirmed.length}</b> inscrit${st.confirmed.length > 1 ? 's' : ''} sur ${st.capN} · ${st.left ? `<b>${st.left}</b> place${st.left > 1 ? 's' : ''} restante${st.left > 1 ? 's' : ''}` : '<b>Complet</b>'}${st.waitlist.length ? ` · ${st.waitlist.length} en attente` : ''}</p>`
        : `<p><span class="chip g">${st.confirmed.length} présent${st.confirmed.length > 1 ? 's' : ''}</span> <span class="chip r">${st.no.length} absent${st.no.length > 1 ? 's' : ''}</span></p>`) : '<p class="muted">Connecte-toi pour voir les inscriptions.</p>'}
      ${status}
      <div class="row" style="margin:.8rem 0">${actions}</div>
      ${S.user && st.confirmed.length ? `<h3 class="type">Participants</h3><div class="people">${st.confirmed.map((r) => `<span class="chip y">${esc(r.name)}</span>`).join('')}</div>` : ''}
      ${S.user && st.waitlist.length ? `<h3 class="type">Liste d'attente</h3><div class="people">${st.waitlist.map((r, i) => `<span class="chip">${i + 1}. ${esc(r.name)}</span>`).join('')}</div>` : ''}`;
  } else if (S.modal.type === 'card') {
    const c = cardById(S.modal.id); if (!c) { closeModal(); return; }
    inner = `<button class="x" data-act="close" aria-label="Fermer">✕</button><div style="padding-top:1.5rem;width:min(300px,100%);margin:0 auto">${cardHTML(c, { full: true, count: S.collection.get(c.id)?.count || 0 })}</div>${cardDetails(c)}`;
  } else if (S.modal.type === 'notifs') {
    const ns = notifications();
    inner = `<button class="x" data-act="close" aria-label="Fermer">✕</button>${cut('Notifications', 'mid')}
      <div style="margin-top:1rem">${ns.length ? ns.map((n) => `<div class="admin-item" style="margin-bottom:.4rem"><span>${n.icon} ${esc(n.text)}</span>${n.href ? `<a class="btn btn-small" href="${n.href}">Voir</a>` : ''}</div>`).join('') : '<p class="muted">Rien de nouveau pour le moment.</p>'}</div>
      ${'Notification' in window && Notification.permission !== 'granted' ? '<p><button class="btn alt btn-small" data-act="askperm">Activer les alertes sur cet appareil</button></p>' : ''}
      <p class="muted" style="margin-top:1rem">Les alertes s'affichent quand tu ouvres l'application. Les notifications push en arrière-plan nécessitent une configuration serveur supplémentaire (voir le guide).</p>`;
  }
  m.innerHTML = `<div class="modal-in">${inner}</div>`;
}
function openModal(m) { S.modal = m; renderModal(); }
function closeModal() { S.modal = null; renderModal(); }

/* ---------- Boosters et album ---------- */
function pageBoosters() {
  const ok = canOpenBooster();
  const owned = S.collection.size, total = allCards().length;
  return `<span class="kicker">Un par jour, gratuit</span>${cut('Boosters', 'big')}
  <div class="block" style="margin-top:1.2rem;text-align:center">
    <div class="pack-preview">${packHTML()}</div>
    <p class="serif" style="font-size:1.2rem">${PACK_SIZE} cartes par booster. La dernière est au moins rare.</p>
    ${!S.user ? '<a class="btn" href="#/compte">Se connecter pour ouvrir</a>' : ok ? '<button class="btn" data-act="openpack">Ouvrir mon booster</button>' : `<p class="chip y" style="font-size:.9rem">Déjà ouvert aujourd'hui · ${esc(nextBoosterText())}</p>`}
    <p class="muted" style="margin-top:1rem">Le compteur est enregistré sur ton compte : changer d'appareil ne donne pas de booster supplémentaire.</p>
  </div>
  ${S.user ? `<div class="progress" style="margin-top:1.2rem"><b class="type">${owned} / ${total} cartes découvertes</b><div class="bar"><i style="width:${total ? Math.round((owned / total) * 100) : 0}%"></i></div><a class="btn btn-small" href="#/album">Mon album</a></div>` : ''}
  <h3 class="sec-title type">Les niveaux de rareté</h3>
  <div class="grid g2">${Object.entries(RAR).map(([k, v]) => `<div class="block"><span class="chip ${k === 'legendaire' ? 'o' : k === 'epique' ? '' : k === 'rare' ? 'y' : ''}">${v.label}</span><p style="margin:.4rem 0 0">${{ commune: 'Carte classique.', rare: 'Carte avec un reflet holographique.', epique: 'Plus difficile à obtenir : reflets arc-en-ciel et étincelles.', legendaire: 'Exceptionnelle : cadre doré, effet holo maximal et animation spéciale.' }[k]}</p></div>`).join('')}</div>`;
}

function pageAlbum() {
  if (!S.user) return `<span class="kicker">Collection</span>${cut('Album', 'big')}<div class="block" style="margin-top:1rem"><p>Connecte-toi pour voir ta collection.</p><a class="btn" href="#/compte">Connexion</a></div>`;
  const cards = allCards();
  const owned = cards.filter((c) => S.collection.has(c.id)).length;
  const cols = [...new Set(cards.map((c) => c.collection || 'Autres'))];
  const f = S.albumFilter || 'toutes';
  const shown = cards.filter((c) => f === 'toutes' || (c.collection || 'Autres') === f);
  const order = { legendaire: 0, epique: 1, rare: 2, commune: 3 };
  shown.sort((a, b) => (order[a.rarity] ?? 9) - (order[b.rarity] ?? 9));
  const dups = [...S.collection.values()].reduce((s, c) => s + Math.max(0, (c.count || 1) - 1), 0);
  return `<span class="kicker">Collection</span>${cut('Mon album', 'big')}
  <div class="progress" style="margin-top:1rem"><b class="type">${owned} / ${cards.length} découvertes · ${dups} doublon${dups > 1 ? 's' : ''}</b><div class="bar"><i style="width:${cards.length ? Math.round((owned / cards.length) * 100) : 0}%"></i></div></div>
  <div class="tabs"><button class="${f === 'toutes' ? 'on' : ''}" data-act="albumfilter" data-v="toutes">Toutes</button>${cols.map((c) => `<button class="${f === c ? 'on' : ''}" data-act="albumfilter" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <div class="cards">${shown.map((c) => { const q = S.collection.get(c.id); return `<div data-act="card" data-id="${esc(c.id)}">${cardHTML(c, { count: q?.count || 0, lock: !q })}</div>`; }).join('')}</div>`;
}

async function openBooster() {
  if (!S.user || !db) return go('#/compte');
  if (!canOpenBooster()) return toast('Ton booster du jour est déjà ouvert.');
  if (!allCards().length) return toast('Aucune carte disponible.');
  const pack = drawPack();
  const tally = new Map(); pack.forEach((c) => tally.set(c.id, (tally.get(c.id) || 0) + 1));
  const wasNew = new Set([...tally.keys()].filter((id) => !S.collection.has(id)));
  const uid = S.user.uid; const day = utcKey();
  try {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid), { lastBoosterDay: day });
    tally.forEach((n, id) => {
      const ref = doc(db, 'users', uid, 'collection', id);
      if (S.collection.has(id)) batch.update(ref, { count: increment(n) });
      else batch.set(ref, { cardId: id, count: n, firstAt: serverTimestamp() });
    });
    await batch.commit();
  } catch (e) {
    console.error(e);
    return toast('Impossible d\'ouvrir le booster (vérifie les règles Firestore ou ta connexion).');
  }
  S.profile.lastBoosterDay = day;
  S.lock = true;
  showStage(pack, wasNew);
}

/* ---------- Paquet et ouverture façon Pokémon TCG ---------- */
function packHTML(id = '') {
  return `<div class="pk tilt" ${id ? `id="${id}"` : ''}>
    <div class="pk-light"></div>
    <div class="pk-top"></div>
    <div class="pk-body">
      <div class="pk-art"><span class="pk-stars">✦ ✦ ✦</span>
        <div class="pk-logo"><img src="dejj-logo.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'DEJJ'}))"></div>
        <b class="pk-title">BOOSTER</b><small>Édition Fondateurs</small><span class="pk-count">${PACK_SIZE} cartes</span></div>
      <i class="pk-holo"></i><i class="pk-sheen"></i>
    </div></div>`;
}
const backHTML = () => '<div class="cback"><div class="cb-in"><span class="cb-logo">DEJJ</span></div></div>';
const FX_COL = { commune: '#ffffff', rare: '#5bb8ff', epique: '#c36bff', legendaire: '#ffd23c' };

function showStage(pack, wasNew) {
  const seen = new Set();
  const items = pack.map((c) => { const dup = !wasNew.has(c.id) || seen.has(c.id); seen.add(c.id); return { c, dup }; });
  const st = $('#stage'); st.hidden = false;
  st.innerHTML = `<button class="x" data-act="closestage" aria-label="Fermer">✕</button><div class="st-bg"></div><div class="rays" id="rays"></div><div class="fx-layer" id="fx"></div><div class="stage-in" id="stage-body"></div>`;
  const body = $('#stage-body');
  let i = 0, flipped = false, busy = false;

  /* Effets */
  const fxLayer = () => $('#fx');
  const sparks = (n, col, power = 1) => {
    const L = fxLayer(); if (!L) return;
    for (let k = 0; k < n; k++) {
      const s = document.createElement('i'); s.className = 'spark';
      const a = Math.random() * Math.PI * 2, d = (80 + Math.random() * 260) * power;
      s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px');
      s.style.setProperty('--c', col); s.style.animationDuration = (0.8 + Math.random() * 0.9) + 's';
      s.style.width = s.style.height = (4 + Math.random() * 8) + 'px';
      L.appendChild(s); setTimeout(() => s.remove(), 1900);
    }
  };
  const ring = (col) => { const L = fxLayer(); if (!L) return; const r = document.createElement('i'); r.className = 'ring'; r.style.setProperty('--c', col); L.appendChild(r); setTimeout(() => r.remove(), 1100); };
  const flash = () => { const f = document.createElement('div'); f.className = 'flash'; st.appendChild(f); setTimeout(() => f.remove(), 900); };
  const shake = (cls) => { st.classList.add(cls); setTimeout(() => st.classList.remove(cls), 700); };
  const banner = (t) => { const b = $('#banner'); if (b) b.innerHTML = cut(t, 'mid'); };
  const fx = (r) => {
    const col = FX_COL[r];
    if (r === 'commune') { sparks(8, col, 0.5); return; }
    if (r === 'rare') { sparks(18, col, 0.9); ring(col); return; }
    if (r === 'epique') { sparks(36, col, 1.1); ring(col); shake('shake1'); banner('Épique'); $('#rays')?.classList.add('on', 'purple'); return; }
    flash(); sparks(70, col, 1.5); sparks(30, '#ffffff', 1.2); ring(col); shake('shake2'); banner('Légendaire'); $('#rays')?.classList.add('on');
  };

  /* Étape 1 : le paquet */
  const showPack = () => {
    body.innerHTML = `<div class="st-center">${packHTML('pack')}<p class="hint">Touche le paquet pour l'ouvrir</p><button class="btn" id="tear">Ouvrir le booster</button></div>`;
    let started = false;
    const go = async () => {
      if (started) return; started = true;
      const pk = $('#pack'); $('#tear').disabled = true; $('.hint', body).textContent = '';
      pk.classList.add('charge'); await sleep(1000);
      pk.classList.add('tear'); flash(); sparks(46, '#ffd23c', 1.2); await sleep(750);
      pk.classList.add('out'); await sleep(550);
      showDeck();
    };
    $('#pack').onclick = go; $('#tear').onclick = go;
  };

  /* Étape 2 : les cartes, une par une */
  const showDeck = () => {
    body.innerHTML = `<div class="st-center"><div class="banner" id="banner"></div><div class="deck" id="deck"></div><p class="hint" id="hint"></p><div class="dots" id="dots"></div><button class="btn ghost light" id="skip">Tout révéler</button></div>`;
    $('#skip').onclick = showSummary;
    drawTop();
  };
  const drawTop = () => {
    if (i >= items.length) return showSummary();
    const { c, dup } = items[i]; flipped = false;
    const left = items.length - i;
    $('#deck').innerHTML = (left > 2 ? '<div class="stk s2"></div>' : '') + (left > 1 ? '<div class="stk s1"></div>' : '') +
      `<div class="flip hint-${c.rarity}" id="top"><div class="flip-in"><div class="fl-back">${backHTML()}</div><div class="fl-front">${cardHTML(c, { full: true })}<span class="rv-badge ${dup ? 'dup' : ''}">${dup ? 'Doublon' : 'Nouvelle'}</span></div></div></div>`;
    $('#dots').innerHTML = items.map((_, k) => `<i class="${k < i ? 'done' : k === i ? 'cur' : ''}"></i>`).join('');
    $('#hint').textContent = `Carte ${i + 1} sur ${items.length} · touche pour la retourner`;
    $('#banner').innerHTML = '';
    $('#rays').className = 'rays';
    $('#top').onclick = onTop;
  };
  const onTop = async () => {
    if (busy) return; busy = true;
    const top = $('#top'); if (!top) { busy = false; return; }
    const { c } = items[i];
    if (!flipped) {
      flipped = true; top.classList.add('on');
      await sleep(320); fx(c.rarity);
      $('#hint').textContent = i === items.length - 1 ? 'Touche pour voir le résumé' : 'Touche pour la carte suivante';
      await sleep(c.rarity === 'legendaire' ? 900 : 350);
      busy = false;
    } else {
      top.classList.add('gone'); await sleep(450);
      i++; busy = false; drawTop();
    }
  };

  /* Étape 3 : le résumé */
  const showSummary = () => {
    $('#rays')?.classList.remove('on', 'purple');
    body.innerHTML = `<div class="st-center wide"><div class="banner">${cut('Ton booster', 'mid')}</div>
      <div class="sum">${items.map(({ c, dup }) => `<div class="sum-item" data-act="card" data-id="${esc(c.id)}">${cardHTML(c)}<span class="rv-badge ${dup ? 'dup' : ''}">${dup ? 'Doublon' : 'Nouvelle'}</span></div>`).join('')}</div>
      <p class="type" style="color:var(--yellow);margin:0">${esc(nextBoosterText())}.</p>
      <div class="row" style="justify-content:center"><a class="btn alt" href="#/album" data-act="closestage">Voir mon album</a><button class="btn ghost light" data-act="closestage">Fermer</button></div></div>`;
  };

  showPack();
}
function closeStage() { S.lock = false; const st = $('#stage'); st.hidden = true; st.innerHTML = ''; refresh(true); }


/* ---------- Mot du jour ---------- */
function todayWord() {
  if (S.dayWord) return S.dayWord;
  return SEED_WORDS[dayNumber() % SEED_WORDS.length];
}
function dailyCard() {
  const cards = allCards(); if (!cards.length) return null;
  if (S.dayCard) return S.dayCard;
  return cards[dayNumber() % cards.length];
}
function wordBlock(w) {
  const ws = S.wordState;
  return `<div style="margin-top:.8rem">
    ${ws.revealed ? `<div class="word">${esc(w.word)}</div><div class="reveal">${esc(w.definition)}</div>` : `<div class="word" aria-label="Mot caché">${'?'.repeat(Math.min(w.word.length, 10))}</div>`}
    ${ws.hint && !ws.revealed ? `<p class="type">💡 ${esc(w.hint || 'Pas d\'indice aujourd\'hui.')}</p>` : ''}
    ${ws.result ? `<p class="${ws.result === 'ok' ? 'good' : 'bad'}">${ws.result === 'ok' ? 'Bravo, bonne réponse.' : 'Ce n\'est pas ça, essaie encore.'}</p>` : ''}
    ${!ws.revealed ? `<div class="row"><input id="word-guess" placeholder="Ta réponse" value="${esc(ws.guess)}" style="flex:1;min-width:120px" aria-label="Ta réponse"><button class="btn btn-small" data-act="wordguess">Valider</button></div>
      <div class="row" style="margin-top:.5rem"><button class="btn btn-small navy" data-act="wordhint">Indice</button><button class="btn btn-small alt" data-act="wordreveal">Révéler</button></div>` : ''}
  </div>`;
}

/* ---------- La Saga ---------- */
function pageSaga() {
  const an = S.anecdotes.length ? S.anecdotes : SEED_ANECDOTES;
  const quiz = S.quiz.length ? S.quiz : SEED_QUIZ;
  const q = S.quizState;
  let quizHtml;
  if (q.done) quizHtml = `<p class="serif" style="font-size:1.3rem">Score : <b>${q.score} / ${quiz.length}</b></p><button class="btn" data-act="quizreset">Rejouer</button>`;
  else {
    const cur = quiz[q.i];
    quizHtml = `<p class="type">Question ${q.i + 1} / ${quiz.length}</p><h3 class="serif">${esc(cur.question)}</h3>
      ${cur.options.map((o, i) => `<button class="quiz-opt ${q.picked !== null ? (i === cur.answer ? 'ok' : i === q.picked ? 'ko' : '') : ''}" data-act="quizpick" data-i="${i}" ${q.picked !== null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}
      ${q.picked !== null ? `<button class="btn" data-act="quiznext">${q.i + 1 >= quiz.length ? 'Voir mon score' : 'Question suivante'}</button>` : ''}`;
  }
  return `<span class="kicker">Mémoire de l'association</span>${cut('La Saga', 'big')}
  <p class="serif" style="font-size:1.15rem;max-width:40rem">Anecdotes, personnalités, souvenirs et moments forts de l'histoire du DEJJ. Pour aller plus loin : <a href="https://www.dejjlasaga.com/fr/" target="_blank" rel="noopener">DEJJ La Saga</a>.</p>
  <div class="grid g2" style="margin-top:1.2rem">
    <section class="block"><span class="kicker">Anecdotes</span>
      ${an.map((a) => `<article class="timeline-item"><h3>${esc(a.title)}</h3>${a.year ? `<div class="muted type">${esc(a.year)}</div>` : ''}<p>${esc(a.body).replace(/\n/g, '<br>')}</p></article>`).join('')}
    </section>
    <section class="block alt tape"><span class="kicker">Quiz</span><div style="margin-top:.8rem">${quizHtml}</div></section>
  </div>`;
}

/* ---------- Chabbat ---------- */
async function getShabbat(del) {
  const key = 'dejj-shabbat-' + del;
  try {
    const r = await fetch(`https://www.hebcal.com/shabbat?cfg=json&geonameid=${DELS[del]}&M=on&lg=s`);
    if (!r.ok) throw new Error('hebcal ' + r.status);
    const j = await r.json();
    const it = j.items || [];
    const c = it.find((i) => i.category === 'candles'), h = it.find((i) => i.category === 'havdalah'), p = it.find((i) => i.category === 'parashat');
    const out = {
      candles: c?.date || null, havdalah: h?.date || null,
      parasha: p ? String(p.title).replace(/^Parashat\s+/i, '') : '', hebrew: p?.hebrew || '', link: p?.link || ''
    };
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), out }));
    return out;
  } catch (e) {
    const c = localStorage.getItem(key);
    if (c) return { ...JSON.parse(c).out, cached: true };
    return null;
  }
}
const hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }) : '—');
const dayOf = (iso) => (iso ? cap(new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' })) : '');

function pageChabbat() {
  return `<span class="kicker">Horaires automatiques</span>${cut('Chabbat', 'big')}
  <div class="tabs" style="margin-top:1rem">${Object.keys(DELS).map((d) => `<button class="${S.del === d ? 'on' : ''}" data-act="del" data-v="${d}">${d}</button>`).join('')}</div>
  <div class="grid g2">
    <section class="block dark"><span class="kicker" style="background:var(--yellow);color:var(--navy)">${esc(S.del)}</span><div id="js-shabbat" style="margin-top:.8rem">Chargement...</div></section>
    <section class="block"><span class="kicker">Paracha de la semaine</span><div id="js-parasha" style="margin-top:.8rem">Chargement...</div></section>
  </div>
  <p class="muted" style="margin-top:1rem">Horaires calculés automatiquement selon la ville et la date (source : Hebcal). Vérifie-les avec ta référence locale avant diffusion, notamment <a href="https://www.torah-box.com/" target="_blank" rel="noopener">Torah-Box</a>.</p>`;
}

async function hydrate() {
  const box = $('#js-shabbat');
  if (box) {
    const mini = box.dataset.mini; const del = S.del;
    const d = await getShabbat(del);
    if (del !== S.del || !$('#js-shabbat')) return;
    if (!d) $('#js-shabbat').innerHTML = '<p>Horaires indisponibles pour le moment (connexion requise).</p>';
    else $('#js-shabbat').innerHTML = `${d.parasha ? `<p class="serif" style="font-size:1.1rem;margin:0 0 .4rem">Paracha <b>${esc(d.parasha)}</b> ${esc(d.hebrew)}</p>` : ''}
      <div class="times"><div class="time-box"><small>Entrée</small><b>${hhmm(d.candles)}</b><small>${esc(dayOf(d.candles))}</small></div><div class="time-box"><small>Sortie</small><b>${hhmm(d.havdalah)}</b><small>${esc(dayOf(d.havdalah))}</small></div></div>${d.cached && !mini ? '<p class="muted">Données enregistrées (hors ligne).</p>' : ''}`;
  }
  const pb = $('#js-parasha');
  if (pb) {
    const d = await getShabbat(S.del);
    if (!$('#js-parasha')) return;
    if (!d || !d.parasha) { pb.innerHTML = '<p>Paracha indisponible pour le moment.</p>'; return; }
    let story = null;
    if (db) { try { const s = await getDoc(doc(db, 'parashot', norm(d.parasha))); if (s.exists()) story = s.data(); } catch (e) { /* ignore */ } }
    if (!$('#js-parasha')) return;
    pb.innerHTML = `<h3 class="serif" style="font-size:1.6rem">${esc(d.parasha)} ${esc(d.hebrew)}</h3>
      ${story ? `<p class="story">${esc(story.story)}</p>${story.source ? `<p class="muted">Source : ${esc(story.source)}</p>` : ''}`
        : `<p class="muted">L'histoire de cette paracha n'a pas encore été publiée par l'équipe.</p>`}
      <div class="row"><a class="btn btn-small alt" href="https://www.torah-box.com/" target="_blank" rel="noopener">Lire sur Torah-Box</a>${d.link ? `<a class="btn btn-small ghost" href="${esc(d.link)}" target="_blank" rel="noopener">Résumé Hebcal</a>` : ''}</div>`;
  }
}

/* ---------- Compte ---------- */
function pageAccount() {
  if (S.user) {
    const p = S.profile || {};
    return `<span class="kicker">Mon espace</span>${cut('Mon compte', 'big')}
    <div class="grid g2" style="margin-top:1rem">
      <section class="block"><h3 class="serif" style="font-size:1.5rem">${esc(p.name || S.user.email)}</h3>
        <p class="type">${esc(S.user.email)}</p>
        <p><span class="chip ${isAdmin() ? 'o' : ''}">${isAdmin() ? 'Administrateur' : 'Membre'}</span> <span class="chip y">${S.collection.size} carte${S.collection.size > 1 ? 's' : ''}</span></p>
        <form data-form="profile"><label class="f" for="pf-name">Prénom ou pseudo</label><input id="pf-name" name="name" value="${esc(p.name || '')}" required maxlength="60">
          <label class="f" for="pf-del">Délégation</label><select id="pf-del" name="delegation">${Object.keys(DELS).map((d) => `<option ${(p.delegation || S.del) === d ? 'selected' : ''}>${d}</option>`).join('')}</select>
          <div class="form-actions"><button class="btn" type="submit">Enregistrer</button><button class="btn navy" type="button" data-act="logout">Se déconnecter</button></div></form>
      </section>
      <section class="block alt"><h3 class="serif">Alertes</h3><p>Reçois des rappels (J-7, J-3, jour J) et des alertes de nouveautés quand tu ouvres l'application.</p>
        <button class="btn" data-act="askperm">Activer les alertes</button>
        <h3 class="serif" style="margin-top:1.2rem">Installer l'application</h3><p class="muted">Sur téléphone : menu du navigateur puis « Ajouter à l'écran d'accueil ».</p></section>
    </div>`;
  }
  const reg = S.authMode === 'register';
  return `<div class="auth block tape"><span class="kicker">${reg ? 'Rejoindre' : 'Bon retour'}</span>${cut(reg ? 'Inscription' : 'Connexion', 'mid')}
    ${!CONFIGURED ? '<p class="err">Firebase n\'est pas encore configuré (firebase-config.js).</p>' : ''}
    <form data-form="auth">
      ${reg ? '<label class="f" for="a-name">Prénom ou pseudo</label><input id="a-name" name="name" required maxlength="60" autocomplete="nickname"><label class="f" for="a-del">Délégation</label><select id="a-del" name="delegation">' + Object.keys(DELS).map((d) => `<option>${d}</option>`).join('') + '</select>' : ''}
      <label class="f" for="a-mail">E-mail</label><input id="a-mail" name="email" type="email" required autocomplete="email">
      <label class="f" for="a-pw">Mot de passe</label><input id="a-pw" name="password" type="password" required minlength="6" autocomplete="${reg ? 'new-password' : 'current-password'}">
      <p class="err" id="auth-err" hidden></p>
      <div class="form-actions"><button class="btn" type="submit">${reg ? 'Créer mon compte' : 'Me connecter'}</button>
        <button class="btn ghost" type="button" data-act="authmode">${reg ? 'J\'ai déjà un compte' : 'Créer un compte'}</button></div>
      ${!reg ? '<p><button class="btn ghost btn-small" type="button" data-act="resetpw" style="box-shadow:none;padding-left:0">Mot de passe oublié</button></p>' : ''}
    </form></div>`;
}

/* ============================== Notifications ============================== */
function notifications() {
  const list = [];
  if (S.user) {
    const today0 = new Date(); today0.setHours(0, 0, 0, 0);
    upcomingEvents().forEach((ev) => {
      const st = evStats(ev);
      if (st.myStatus !== 'yes' && st.myStatus !== 'wait') return;
      const d = toDate(ev.date); const e0 = new Date(d); e0.setHours(0, 0, 0, 0);
      const diff = Math.round((e0 - today0) / 864e5);
      const label = { 7: 'J-7', 3: 'J-3', 0: 'Aujourd\'hui' }[diff];
      if (label) list.push({ key: `ev-${ev.id}-${diff}`, icon: '📅', text: `${label} : ${ev.title} (${fmtTime(d)})`, href: '#/agenda' });
    });
    const seenEv = Number(localStorage.getItem('dejj-seen-events') || 0);
    S.events.forEach((ev) => { const c = toDate(ev.createdAt); if (c && c.getTime() > seenEv && seenEv) list.push({ key: `new-${ev.id}`, icon: '🆕', text: `Nouvel événement : ${ev.title}`, href: '#/agenda' }); });
    if (canOpenBooster()) list.push({ key: `boost-${localDay()}`, icon: '🎴', text: 'Un nouveau booster peut être ouvert.', href: '#/boosters' });
    const dc = dailyCard(); if (dc) list.push({ key: `card-${localDay()}`, icon: '✨', text: `Carte du jour : ${dc.name}`, href: '#/' });
  }
  return list;
}
function fireBrowserNotifs() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const done = JSON.parse(localStorage.getItem('dejj-notified') || '[]');
  const fresh = notifications().filter((n) => !done.includes(n.key));
  if (!fresh.length) return;
  fresh.forEach((n) => {
    navigator.serviceWorker?.getRegistration().then((reg) => (reg ? reg.showNotification('DEJJ Community', { body: n.text, icon: 'icon.svg', tag: n.key }) : new Notification('DEJJ Community', { body: n.text, icon: 'icon.svg' }))).catch(() => {});
    done.push(n.key);
  });
  localStorage.setItem('dejj-notified', JSON.stringify(done.slice(-100)));
}
async function askPermission() {
  if (!('Notification' in window)) return toast('Les alertes ne sont pas disponibles sur ce navigateur.');
  const r = await Notification.requestPermission();
  toast(r === 'granted' ? 'Alertes activées sur cet appareil.' : 'Alertes refusées.');
  fireBrowserNotifs(); refresh(true);
}

/* ============================== Administration ============================== */
const F = (n, l, t = 'text', o = {}) => ({ n, l, t, ...o });
const TABS = {
  events: { label: 'Événements', coll: 'events', stamp: true, title: (d) => d.title, sub: (d) => (toDate(d.date) ? `${localDay(toDate(d.date))} · ${d.place || ''}` : ''), sort: (a, b) => toDate(b.date) - toDate(a.date),
    fields: [F('title', 'Titre'), F('date', 'Date et heure', 'datetime'), F('place', 'Lieu'), F('description', 'Description', 'textarea'), F('capacity', 'Nombre de places (0 = illimité)', 'number', { def: 0 })] },
  cards: { label: 'Cartes', coll: 'cards', id: { label: 'Identifiant (sans espace, ex. edgar-guedj)', from: 'name' }, title: (d) => d.name, sub: (d) => `${RAR[d.rarity]?.label || ''} · ${d.collection || ''}`,
    fields: [F('name', 'Nom'), F('nickname', 'Surnom ou totem', 'text', { opt: 1 }), F('role', 'Rôle dans l\'histoire du DEJJ', 'text', { opt: 1 }), F('years', 'Années (ex. 1921-2007)', 'text', { opt: 1 }), F('bio', 'Courte biographie', 'textarea', { opt: 1 }), F('quote', 'Phrase ou anecdote', 'textarea', { opt: 1 }), F('quoteBy', 'Auteur de la citation (facultatif)', 'text', { opt: 1 }),
      F('timeline', 'Parcours (une étape par ligne, ex. 2016 : Enfant)', 'lines', { opt: 1 }),
      F('rarity', 'Rareté', 'select', { options: Object.entries(RAR).map(([k, v]) => [k, v.label]) }), F('collection', 'Collection spéciale', 'text', { opt: 1 }), F('image', 'Fichier photo (ex. edgar-guedj.jpg, à déposer dans le dépôt)', 'text', { opt: 1 }), F('imagePos', 'Cadrage de la photo (ex. 50% 20% : plus le 2e chiffre est petit, plus on voit le haut)', 'text', { opt: 1 })], seed: true },
  news: { label: 'Actualités', coll: 'news', stamp: true, title: (d) => d.title, sub: (d) => (d.body || '').slice(0, 60), sort: (a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0), fields: [F('title', 'Titre'), F('body', 'Texte', 'textarea')] },
  word: { label: 'Mot du jour', coll: 'words', id: { label: 'Date (AAAA-MM-JJ)', date: true }, title: (d) => d.word, sub: (d) => d.id, sort: (a, b) => b.id.localeCompare(a.id), fields: [F('word', 'Mot'), F('definition', 'Définition', 'textarea'), F('hint', 'Indice', 'text', { opt: 1 })] },
  daily: { label: 'Carte du jour', coll: 'daily', id: { label: 'Date (AAAA-MM-JJ)', date: true }, title: (d) => cardById(d.cardId)?.name || d.cardId, sub: (d) => d.id, sort: (a, b) => b.id.localeCompare(a.id), fields: [F('cardId', 'Carte', 'cardselect')] },
  parasha: { label: 'Paracha', coll: 'parashot', id: { label: 'Nom de la paracha (ex. Vayera)', norm: true, from: 'name' }, title: (d) => d.name, sub: (d) => (d.story || '').slice(0, 60), fields: [F('name', 'Nom de la paracha (comme affiché : ex. Vayera)'), F('story', 'Histoire de la paracha', 'textarea', { rows: 12 }), F('source', 'Source (ex. Torah-Box)', 'text', { opt: 1 })] },
  anecdotes: { label: 'Anecdotes', coll: 'anecdotes', stamp: true, title: (d) => d.title, sub: (d) => d.year || '', fields: [F('title', 'Titre'), F('year', 'Année ou période', 'text', { opt: 1 }), F('body', 'Texte', 'textarea')] },
  quiz: { label: 'Quiz', coll: 'quiz', stamp: true, title: (d) => d.question, sub: () => '', fields: [F('question', 'Question'), F('options', 'Réponses possibles (une par ligne)', 'lines'), F('answer', 'N° de la bonne réponse (1, 2, 3...)', 'number', { off: -1, def: 1 })] },
  members: { label: 'Membres', coll: 'users', special: true }
};

function pageAdmin() {
  if (!isAdmin()) return `<span class="kicker">Accès réservé</span>${cut('Administration', 'big')}<div class="block" style="margin-top:1rem"><p>Cette section est réservée aux administrateurs. ${S.user ? 'Ton compte n\'a pas le rôle administrateur.' : ''}</p>${!S.user ? '<a class="btn" href="#/compte">Connexion</a>' : ''}</div>`;
  const cfg = TABS[S.adm.tab];
  const tabs = `<div class="tabs">${Object.entries(TABS).map(([k, v]) => `<button class="${S.adm.tab === k ? 'on' : ''}" data-act="admtab" data-v="${k}">${v.label}</button>`).join('')}</div>`;
  let body = '';
  if (cfg.special) {
    body = `<div class="admin-list">${S.adm.docs.map((u) => `<div class="admin-item"><span><b>${esc(u.name || '(sans nom)')}</b> · ${esc(u.email || '')} · ${esc(u.delegation || '')} <span class="chip ${u.role === 'admin' ? 'o' : ''}">${esc(u.role || 'member')}</span></span>
      ${u.id !== S.user.uid ? `<button class="btn btn-small navy" data-act="toggleadmin" data-id="${esc(u.id)}" data-role="${u.role === 'admin' ? 'member' : 'admin'}">${u.role === 'admin' ? 'Retirer admin' : 'Passer admin'}</button>` : ''}</div>`).join('') || '<div class="empty">Aucun membre.</div>'}</div>`;
  } else {
    const ed = S.adm.edit;
    const val = (f) => { const d = ed?.data; if (!d || d[f.n] === undefined) return f.def ?? ''; const v = d[f.n]; if (f.t === 'datetime') return toDate(v) ? toLocalInput(toDate(v)) : ''; if (f.t === 'lines') return (v || []).join('\n'); if (f.off) return Number(v) - f.off; return v; };
    const fieldHtml = (f) => {
      const v = val(f); const id = 'f-' + f.n;
      let input;
      if (f.t === 'textarea') input = `<textarea id="${id}" name="${f.n}" rows="${f.rows || 4}" ${f.opt ? '' : 'required'}>${esc(v)}</textarea>`;
      else if (f.t === 'lines') input = `<textarea id="${id}" name="${f.n}" rows="4" ${f.opt ? '' : 'required'}>${esc(v)}</textarea>`;
      else if (f.t === 'select') input = `<select id="${id}" name="${f.n}">${f.options.map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
      else if (f.t === 'cardselect') input = `<select id="${id}" name="${f.n}">${allCards().map((c) => `<option value="${esc(c.id)}" ${v === c.id ? 'selected' : ''}>${esc(c.name)} (${RAR[c.rarity]?.label})</option>`).join('')}</select>`;
      else if (f.t === 'datetime') input = `<input id="${id}" name="${f.n}" type="datetime-local" value="${esc(v)}" required>`;
      else if (f.t === 'number') input = `<input id="${id}" name="${f.n}" type="number" min="0" value="${esc(v)}" required>`;
      else input = `<input id="${id}" name="${f.n}" value="${esc(v)}" ${f.opt ? '' : 'required'}>`;
      return `<label class="f" for="${id}">${f.l}</label>${input}`;
    };
    const idField = cfg.id ? `<label class="f" for="f-docid">${cfg.id.label}</label><input id="f-docid" name="__id" ${cfg.id.date ? 'type="date"' : ''} value="${esc(ed?.id || (cfg.id.date ? localDay() : ''))}" ${ed ? 'readonly' : ''} placeholder="${cfg.id.from ? 'Laisser vide pour le générer' : ''}" ${cfg.id.from ? '' : 'required'}>` : '';
    body = `<form class="block" data-form="admin">${ed ? '<span class="chip o">Modification</span>' : '<span class="chip y">Nouveau</span>'}${idField}${cfg.fields.map(fieldHtml).join('')}
      <div class="form-actions"><button class="btn" type="submit">${ed ? 'Enregistrer' : 'Ajouter'}</button>${ed ? '<button type="button" class="btn ghost" data-act="admcancel">Annuler</button>' : ''}${cfg.seed ? '<button type="button" class="btn alt" data-act="seedcards">Importer les cartes de départ</button>' : ''}</div></form>
      <div class="admin-list">${S.adm.docs.map((d) => `<div class="admin-item"><span><b>${esc(cfg.title(d) || d.id)}</b><br><small class="muted">${esc(cfg.sub(d) || '')}</small></span>
        <span class="row">${S.adm.tab === 'events' ? `<button class="btn btn-small alt" data-act="csv" data-id="${esc(d.id)}">Participants (CSV)</button>` : ''}<button class="btn btn-small navy" data-act="admedit" data-id="${esc(d.id)}">Modifier</button><button class="btn btn-small danger" data-act="admdel" data-id="${esc(d.id)}">Supprimer</button></span></div>`).join('') || '<div class="empty">Rien pour le moment.</div>'}</div>`;
  }
  return `<span class="kicker">Espace sécurisé</span>${cut('Administration', 'big')}${tabs}${body}`;
}

async function loadAdmin(tab = S.adm.tab) {
  if (!db || !isAdmin()) return;
  const cfg = TABS[tab];
  try {
    const snap = await getDocs(collection(db, cfg.coll));
    let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (cfg.sort) docs.sort(cfg.sort);
    S.adm = { tab, docs, edit: null };
  } catch (e) { console.error(e); toast('Lecture impossible : vérifie les règles Firestore.'); S.adm = { tab, docs: [], edit: null }; }
  if (route().startsWith('#/admin')) refresh(true);
}

async function saveAdmin(form) {
  const cfg = TABS[S.adm.tab]; const fd = new FormData(form); const data = {};
  for (const f of cfg.fields) {
    let v = fd.get(f.n) ?? '';
    if (f.t === 'number') v = Number(v) + (f.off || 0);
    else if (f.t === 'datetime') v = Timestamp.fromDate(new Date(v));
    else if (f.t === 'lines') v = String(v).split('\n').map((s) => s.trim()).filter(Boolean);
    else v = String(v).trim();
    data[f.n] = v;
  }
  if (S.adm.tab === 'quiz' && (data.answer < 0 || data.answer >= data.options.length)) return toast('Numéro de bonne réponse invalide.');
  let id = S.adm.edit?.id;
  if (!id) {
    if (cfg.id) {
      let raw = String(fd.get('__id') || '').trim();
      if (!raw && cfg.id.from) raw = data[cfg.id.from];
      id = cfg.id.date ? raw : cfg.id.norm ? norm(raw) : slug(raw);
      if (!id) return toast('Identifiant manquant.');
    } else id = doc(collection(db, cfg.coll)).id;
    if (cfg.stamp) data.createdAt = serverTimestamp();
  }
  try { await setDoc(doc(db, cfg.coll, id), data, { merge: true }); toast('Enregistré.'); await loadAdmin(); }
  catch (e) { console.error(e); toast('Échec de l\'enregistrement : ' + (e.code || e.message)); }
}

function exportCsv(eventId) {
  const ev = S.events.find((e) => e.id === eventId); if (!ev) return;
  const st = evStats(ev); const esc2 = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const rows = [['Nom', 'Statut', 'Inscrit le']];
  const dt = (r) => (r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('fr-FR') : '');
  st.confirmed.forEach((r) => rows.push([r.name, 'Confirmé', dt(r)]));
  st.waitlist.forEach((r, i) => rows.push([r.name, `Liste d'attente (${i + 1})`, dt(r)]));
  st.no.forEach((r) => rows.push([r.name, 'Ne participe pas', dt(r)]));
  const blob = new Blob(['﻿' + rows.map((r) => r.map(esc2).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `participants-${slug(ev.title)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/* ============================== Actions (clics et formulaires) ============================== */
async function setRsvp(eventId, answer) {
  if (!S.user || !db || S.rsvpBusy) return;
  const ev = S.events.find((e) => e.id === eventId); if (!ev) return;
  const st = evStats(ev);
  S.rsvpBusy = true;
  try {
    const ref = doc(db, 'events', eventId, 'rsvps', S.user.uid);
    if (answer === 'no' && Number(ev.capacity) > 0) await deleteDoc(ref); // événement limité : se désister libère la place
    else if (st.mine && st.mine.answer === answer) { /* rien à changer */ }
    else await setDoc(ref, { eventId, uid: S.user.uid, name: S.profile?.name || S.user.email, answer, createdAt: serverTimestamp() });
    toast(answer === 'yes' ? 'Inscription enregistrée.' : 'C\'est noté.');
  } catch (e) { console.error(e); toast('Action impossible : ' + (e.code || e.message)); }
  S.rsvpBusy = false;
}

document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act]'); if (!t) { if (e.target.id === 'modal') closeModal(); return; }
  const a = t.dataset.act, id = t.dataset.id;
  switch (a) {
    case 'event': openModal({ type: 'event', id }); break;
    case 'card': openModal({ type: 'card', id }); break;
    case 'close': closeModal(); break;
    case 'notifs': openModal({ type: 'notifs' }); break;
    case 'askperm': askPermission(); break;
    case 'rsvp': setRsvp(id, t.dataset.ans); break;
    case 'openpack': openBooster(); break;
    case 'closestage': closeStage(); break;
    case 'albumfilter': S.albumFilter = t.dataset.v; render(); break;
    case 'wordguess': {
      const w = todayWord(); const g = $('#word-guess')?.value || ''; S.wordState.guess = g;
      S.wordState.result = norm(g) === norm(w.word) ? 'ok' : 'ko'; if (S.wordState.result === 'ok') S.wordState.revealed = true; render(); break;
    }
    case 'wordhint': S.wordState.hint = true; S.wordState.guess = $('#word-guess')?.value || ''; render(); break;
    case 'wordreveal': S.wordState.revealed = true; render(); break;
    case 'quizpick': { const quiz = S.quiz.length ? S.quiz : SEED_QUIZ; const i = Number(t.dataset.i); S.quizState.picked = i; if (i === quiz[S.quizState.i].answer) S.quizState.score++; render(); break; }
    case 'quiznext': { const quiz = S.quiz.length ? S.quiz : SEED_QUIZ; if (S.quizState.i + 1 >= quiz.length) S.quizState.done = true; else { S.quizState.i++; S.quizState.picked = null; } render(); break; }
    case 'quizreset': S.quizState = { i: 0, score: 0, picked: null, done: false }; render(); break;
    case 'del': S.del = t.dataset.v; localStorage.setItem('dejj-del', S.del); render(); break;
    case 'authmode': S.authMode = S.authMode === 'login' ? 'register' : 'login'; render(); break;
    case 'logout': await signOut(auth); go('#/'); break;
    case 'resetpw': {
      const mail = $('#a-mail')?.value; if (!mail) return showAuthErr('Saisis ton e-mail puis clique sur « Mot de passe oublié ».');
      try { await sendPasswordResetEmail(auth, mail); toast('E-mail de réinitialisation envoyé.'); } catch (er) { showAuthErr(authMsg(er)); } break;
    }
    // Administration
    case 'admtab': S.adm = { tab: t.dataset.v, docs: [], edit: null }; render(); loadAdmin(t.dataset.v); break;
    case 'admedit': S.adm.edit = { id, data: S.adm.docs.find((d) => d.id === id) }; render(); window.scrollTo(0, 0); break;
    case 'admcancel': S.adm.edit = null; render(); break;
    case 'admdel': if (confirm('Supprimer définitivement cet élément ?')) { try { await deleteDoc(doc(db, TABS[S.adm.tab].coll, id)); toast('Supprimé.'); loadAdmin(); } catch (er) { toast('Suppression impossible : ' + (er.code || er.message)); } } break;
    case 'toggleadmin': try { await updateDoc(doc(db, 'users', id), { role: t.dataset.role }); toast('Rôle modifié.'); loadAdmin(); } catch (er) { toast('Impossible : ' + (er.code || er.message)); } break;
    case 'csv': exportCsv(id); break;
    case 'seedcards': {
      if (!confirm('Importer les cartes de départ (Edgar Guedj et cartes exemples) ? Les cartes existantes avec le même identifiant seront remplacées.')) return;
      const b = writeBatch(db); SEED_CARDS.forEach((c) => { const { id: cid, ...rest } = c; b.set(doc(db, 'cards', cid), rest); });
      try { await b.commit(); toast('Cartes importées.'); loadAdmin(); } catch (er) { toast('Import impossible : ' + (er.code || er.message)); } break;
    }
  }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (!$('#stage').hidden && !S.lock) closeStage(); closeModal(); } });

function showAuthErr(m) { const el = $('#auth-err'); if (el) { el.textContent = m; el.hidden = false; } else toast(m); }
function authMsg(e) {
  const m = { 'auth/invalid-credential': 'E-mail ou mot de passe incorrect.', 'auth/user-not-found': 'Aucun compte avec cet e-mail.', 'auth/wrong-password': 'Mot de passe incorrect.', 'auth/email-already-in-use': 'Cet e-mail est déjà utilisé.', 'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).', 'auth/invalid-email': 'E-mail invalide.', 'auth/too-many-requests': 'Trop d\'essais, réessaie plus tard.', 'auth/network-request-failed': 'Problème de connexion.', 'auth/unauthorized-domain': 'Domaine non autorisé : ajoute-le dans Firebase > Authentication > Paramètres > Domaines autorisés.' };
  return m[e.code] || ('Erreur : ' + (e.code || e.message));
}

document.addEventListener('submit', async (e) => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form; const fd = new FormData(f);
  if (kind === 'auth') {
    if (!CONFIGURED) return showAuthErr('Firebase n\'est pas configuré.');
    const email = String(fd.get('email')).trim(), pw = String(fd.get('password'));
    try {
      if (S.authMode === 'register') {
        const name = String(fd.get('name')).trim(); const delegation = String(fd.get('delegation'));
        S.pendingProfile = { name, delegation };
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        await updateProfile(cred.user, { displayName: name }).catch(() => {});
      } else await signInWithEmailAndPassword(auth, email, pw);
      go('#/');
    } catch (er) { showAuthErr(authMsg(er)); }
  } else if (kind === 'profile') {
    const name = String(fd.get('name')).trim(), delegation = String(fd.get('delegation'));
    try { await updateDoc(doc(db, 'users', S.user.uid), { name, delegation }); S.del = delegation; localStorage.setItem('dejj-del', delegation); toast('Profil enregistré.'); } catch (er) { toast('Échec : ' + (er.code || er.message)); }
  } else if (kind === 'admin') saveAdmin(f);
});

/* ============================== Données en temps réel ============================== */
const unsubs = [];
function listen(name, coll, mapFn) {
  unsubs.push(onSnapshot(collection(db, coll), (snap) => { S[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() })); if (mapFn) mapFn(); refresh(); }, (er) => console.warn(coll, er.code)));
}
function startPublic() {
  listen('events', 'events');
  listen('news', 'news', () => S.news.sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0)));
  listen('cards', 'cards');
  listen('anecdotes', 'anecdotes', () => S.anecdotes.sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0)));
  listen('quiz', 'quiz');
}
async function loadDaily() {
  if (!db) return;
  const key = localDay();
  try {
    const [w, c] = await Promise.all([getDoc(doc(db, 'words', key)), getDoc(doc(db, 'daily', key))]);
    S.dayWord = w.exists() ? w.data() : null;
    S.dayCard = c.exists() ? cardById(c.data().cardId) || null : null;
    refresh();
  } catch (e) { console.warn('daily', e.code); }
}
let userUnsubs = [];
function startUser(uid) {
  userUnsubs.forEach((u) => u()); userUnsubs = [];
  userUnsubs.push(onSnapshot(collectionGroup(db, 'rsvps'), (snap) => { S.rsvps = snap.docs.map((d) => ({ ...d.data(), _id: d.id })); refresh(); fireBrowserNotifs(); }, (er) => console.warn('rsvps', er.code)));
  userUnsubs.push(onSnapshot(collection(db, 'users', uid, 'collection'), (snap) => { S.collection = new Map(snap.docs.map((d) => [d.id, d.data()])); refresh(); }, (er) => console.warn('collection', er.code)));
  userUnsubs.push(onSnapshot(doc(db, 'users', uid), (snap) => { if (snap.exists()) { S.profile = { id: uid, ...snap.data() }; if (S.profile.delegation && !localStorage.getItem('dejj-del')) S.del = S.profile.delegation; refresh(); } }));
}

async function ensureProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) { S.profile = { id: user.uid, ...snap.data() }; return; }
  const p = S.pendingProfile || {};
  const profile = { name: p.name || user.displayName || (user.email || '').split('@')[0], email: user.email || '', delegation: p.delegation || S.del, role: 'member', createdAt: serverTimestamp(), lastBoosterDay: 0 };
  await setDoc(ref, profile);
  S.profile = { id: user.uid, ...profile };
}

if (CONFIGURED) {
  startPublic(); loadDaily();
  onAuthStateChanged(auth, async (user) => {
    S.user = user;
    if (user) {
      try { await ensureProfile(user); } catch (e) { console.error(e); toast('Profil indisponible : vérifie les règles Firestore.'); }
      startUser(user.uid);
      if (!localStorage.getItem('dejj-seen-events')) localStorage.setItem('dejj-seen-events', String(Date.now()));
    } else {
      userUnsubs.forEach((u) => u()); userUnsubs = [];
      S.profile = null; S.rsvps = []; S.collection = new Map();
    }
    if (route().startsWith('#/admin') && isAdmin()) loadAdmin(); else refresh(true);
  });
}

/* ============================== Démarrage ============================== */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
renderNav();
render();
