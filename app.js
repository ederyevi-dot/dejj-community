// DEJJ Community — application principale
// Un mouvement pour tous. 0 € d'abonnement : hébergement GitHub Pages + offre gratuite Firebase (Spark).
import { firebaseConfig } from './firebase-config.js';
import { SEED_CARDS, SEED_WORDS, SEED_ANECDOTES, SEED_QUIZ } from './seed.js';
// Le SDK Firebase est chargé dynamiquement : en mode démo (ou hors ligne), l'application
// fonctionne sans aucun appel réseau. En production, les modules officiels sont récupérés au démarrage.
let app = null, auth = null, db = null;
let initializeApp, getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, sendPasswordResetEmail, updateProfile,
  getFirestore, collection, collectionGroup, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc,
  onSnapshot, writeBatch, runTransaction, increment, serverTimestamp, Timestamp, query, where, orderBy, limit;

const CONFIGURED = firebaseConfig.apiKey && !String(firebaseConfig.apiKey).startsWith('COLLE');
// MODE DÉMO (tests locaux et aperçu) : ajouter ?demo=1 à l'adresse. Aucune connexion Firebase,
// les données restent dans ce navigateur. À ne pas utiliser pour de vraies données de membres.
const DEMO = /[?&]demo=1/.test(location.search) || localStorage.getItem('dejj-demo') === '1';

if (CONFIGURED && !DEMO) {
  try {
    const base = 'https://www.gstatic.com/firebasejs/10.14.1/';
    const [mApp, mAuth, mStore] = await Promise.all([
      import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')
    ]);
    ({ initializeApp } = mApp);
    ({ getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile } = mAuth);
    ({ getFirestore, collection, collectionGroup, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, onSnapshot,
       writeBatch, runTransaction, increment, serverTimestamp, Timestamp, query, where, orderBy, limit } = mStore);
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (e) {
    console.error('Firebase indisponible', e);
    const b = document.getElementById('cfg-banner');
    if (b) { b.hidden = false; b.textContent = 'Connexion à Firebase impossible (réseau). L’application fonctionne en lecture limitée ; réessaie avec une connexion.'; }
  }
} else if (!CONFIGURED) {
  const b = document.getElementById('cfg-banner');
  if (b) { b.hidden = false; b.textContent = 'Configuration Firebase manquante (firebase-config.js) : comptes, inscriptions et boosters sont désactivés.'; }
}

/* ============================== Outils ============================== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, '0');
const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const utcKey = () => { const d = new Date(); return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(); };
const dayNumber = () => { const d = new Date(); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
// On garde les accents pour la comparaison des réponses (ex. « tsédaka » = « tsedaka »).
const normWord = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9\u0590-\u05FF]/g, '');
const slug = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
const toDate = (v) => (v && v.toDate ? v.toDate() : v instanceof Date ? v : v ? new Date(v) : null);
const fmtDay = (d) => cap(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));
const fmtTime = (d) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const fmtMonth = (d) => cap(d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
const toLocalInput = (d) => `${localDay(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const plural = (n, s, p = s + 's') => `${n} ${n > 1 ? p : s}`;

function cut(text, cls = 'big') {
  const spans = [...String(text)].map((ch) => (ch === ' ' ? '<span class="sp"></span>' : `<span>${esc(ch)}</span>`)).join('');
  return `<h2 class="cut ${cls}" aria-label="${esc(text)}">${spans}</h2>`;
}
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3600);
}
const go = (h) => { location.hash = h; };

/* ============================== Constantes ============================== */
// Raretés. Les poids par défaut respectent le cahier des charges (60 / 28 / 9 / 3).
// Ils sont modifiables par l'administrateur (collection config/booster) sans toucher au code.
const RAR = {
  commune: { label: 'Commune', w: 60, sym: '●', desc: "Carte classique. Finitions argentées.", col: '#b9c2cf' },
  rare: { label: 'Rare', w: 28, sym: '◆', desc: 'Cadre doré et reflet holographique léger.', col: '#e0ac2b' },
  epique: { label: 'Épique', w: 9, sym: '★', desc: 'Cadre violet, étincelles et halo.', col: '#a757d8' },
  legendaire: { label: 'Légendaire', w: 3, sym: '✦', desc: 'Holographie multicolore animée, effet spécial à l’ouverture.', col: '#ffcf3a' }
};
const ROLES = {
  admin: { label: 'Administrateur', rank: 4, desc: 'Tout gérer : contenus, cartes, membres, rôles, probabilités.' },
  responsable: { label: 'Responsable', rank: 3, desc: 'Gérer les événements, les inscriptions, les exports et le planning des contenus.' },
  animateur: { label: 'Animateur', rank: 2, desc: 'Consulter les événements, les inscrits et les contenus.' },
  member: { label: 'Membre', rank: 1, desc: 'Participer aux événements, ouvrir le booster du jour, remplir son album.' }
};
const DELS = { Marseille: 2995469, Paris: 2988507, Nice: 2990440, Lyon: 2996944 };
const CATS = { personne: 'Personnalité', animateur: 'Animateur', objet: 'Objet', lieu: 'Lieu', evenement: 'Événement' };
const DEFAULT_BOOSTER = {
  packSize: 5, mode: 'card', // 'card' = probabilités appliquées à chaque carte · 'pack' = un tirage par booster
  perCard: { commune: 60, rare: 28, epique: 9, legendaire: 3 },
  packOdds: { commune: 60, rare: 28, epique: 9, legendaire: 3 },
  minRareLast: true, dailyLimit: 1, allowDuplicates: true
};
const CITY_TZ = 'Europe/Paris';

/* ============================== Mode démo (local) ============================== */
const DEMO_KEY = 'dejj-demo-db-v1';
const demoDefaults = () => ({
  users: { 'demo-admin': { name: 'Admin démo', email: 'admin@dejj.local', delegation: 'Marseille', role: 'admin', lastBoosterDay: 0 },
           'demo-membre': { name: 'Membre démo', email: 'membre@dejj.local', delegation: 'Marseille', role: 'member', lastBoosterDay: 0 } },
  cards: Object.fromEntries(SEED_CARDS.map((c) => [c.id, c])), events: {}, news: {}, anecdotes: {}, quiz: {}, words: {}, daily: {},
  config: {}, collections: {}, rsvps: {}, names: {}, rsvpCounts: {}, boosters: {}
});
let D = null;
function demoLoad() {
  try { D = JSON.parse(localStorage.getItem(DEMO_KEY)) || demoDefaults(); } catch { D = demoDefaults(); }
  if (!D.cards || !Object.keys(D.cards).length) D.cards = Object.fromEntries(SEED_CARDS.map((c) => [c.id, c]));
  demoPersist();
}
function demoPersist() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(D)); } catch (e) { console.warn('demo plein', e); } }
function demoBeacon() {
  if (!DEMO) return;
  const b = document.getElementById('cfg-banner');
  if (!b) return;
  b.hidden = false;
  b.innerHTML = `MODE DÉMO · données locales (aucune donnée réelle) · <a href="#/" data-act="demoreset">réinitialiser</a> · <a href="index.html">quitter</a>`;
}
function demoReset() { localStorage.removeItem(DEMO_KEY); demoLoad(); location.hash = '#/'; refresh(true); toast('Données de démonstration réinitialisées.'); }
function demoSignIn(role) {
  const uid = role === 'admin' ? 'demo-admin' : 'demo-membre';
  D.user = uid; demoPersist();
  S.user = { uid, email: D.users[uid].email };
  startDemoUser();
  refresh(true);
}

/* ============================== État ============================== */
const S = {
  user: null, profile: null,
  events: [], news: [], cards: [], anecdotes: [], quiz: [], words: [], dailies: [], parashot: [],
  cfgBooster: null, cfgApp: null, cfgChabbat: null,
  rsvpCounts: {}, rsvpNames: {}, myRsvps: [], collection: new Map(),
  dayCard: null, dayWord: null, boosterLog: null,
  lock: false, authMode: 'login', pendingProfile: null,
  del: localStorage.getItem('dejj-del') || 'Marseille',
  wordState: { guess: '', hint: false, revealed: false, result: '' },
  quizState: { i: 0, score: 0, picked: null, done: false, order: null },
  album: { filter: 'toutes', cat: 'toutes', sort: 'rarete', q: '', owned: 'toutes' },
  saga: { cat: 'toutes' },
  adm: { tab: 'events', docs: [], edit: null, q: '', planMonth: new Date(), busy: false },
  modal: null, rsvpBusy: false, loading: false
};

// Catalogue complet (Firestore si disponible, sinon contenu de départ).
const allCards = () => (S.cards.length ? S.cards : SEED_CARDS);
const sortCards = (list) => [...list].sort((a, b) => {
  const oa = a.order ?? 999, ob = b.order ?? 999;
  return oa - ob || String(a.name || '').localeCompare(String(b.name || ''), 'fr');
});
// Cartes réellement montrables (published !== false). « inPack:false » = visible dans La Saga mais hors boosters.
const visibleCards = () => sortCards(allCards().filter((c) => c.published !== false));
const packPool = () => visibleCards().filter((c) => c.inPack !== false);
const cardById = (id) => allCards().find((c) => c.id === id) || null;
const roleRank = (r) => (ROLES[r] ? ROLES[r].rank : 1);
const myRole = () => S.profile?.role || 'member';
const can = (min) => roleRank(myRole()) >= roleRank(min);
const isAdmin = () => myRole() === 'admin';
const canManageEvents = () => can('responsable');
const canManageContent = () => can('responsable');
const canSeeRsvps = () => can('animateur');
const boosterCfg = () => {
  const c = S.cfgBooster || {};
  return {
    ...DEFAULT_BOOSTER, ...c,
    perCard: { ...DEFAULT_BOOSTER.perCard, ...(c.perCard || {}) },
    packOdds: { ...DEFAULT_BOOSTER.packOdds, ...(c.packOdds || {}) }
  };
};


/* Icônes SVG (aucune dépendance externe, pas de police emoji) */
const ICONS = {
  home: '<path d="M3 11.2 12 4l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  calendar: '<path d="M7 2v3M17 2v3M3.5 8.5h17M4 5h16a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"/>',
  cards: '<rect x="8" y="3" width="12" height="17" rx="2"/><path d="M5 6v13a2 2 0 0 0 2 2h9"/>',
  album: '<path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2z"/><path d="M17 6h3v14H8"/>',
  news: '<path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2z"/><path d="M8 9h6M8 13h6M8 17h4"/>',
  candle: '<path d="M12 3c2.2 2.2 3 3.1 3 4.4A3 3 0 0 1 9 7.4C9 6.1 9.8 5.2 12 3z"/><rect x="8.5" y="11" width="7" height="10" rx="1"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6"/>',
  bell: '<path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z"/><path d="M10 20a2 2 0 0 0 4 0"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${ICONS[n] || ''}</svg>`;

/* ============================== Routage ============================== */
const NAV = [
  ['#/', 'Accueil', 'home'], ['#/agenda', 'Agenda', 'calendar'], ['#/boosters', 'Boosters', 'cards'],
  ['#/album', 'Album', 'album'], ['#/saga', 'La Saga', 'news'], ['#/infos', 'Infos & dons', 'heart'], ['#/chabbat', 'Chabbat', 'candle']
];
const route = () => location.hash || '#/';

function renderNav() {
  const r = route();
  const items = [...NAV];
  if (canManageEvents() || isAdmin()) items.push(['#/admin', 'Admin', 'gear']);
  const on = (h) => (h === '#/' ? r === '#/' : r.startsWith(h));
  $('#nav').innerHTML = items.map(([h, l]) => `<a href="${h}" class="${on(h) ? 'on' : ''}">${l}</a>`).join('');
  $('#tabbar').innerHTML = items.map(([h, l, i]) => `<a href="${h}" class="${on(h) ? 'on' : ''}"><b>${icon(i)}</b>${l}</a>`).join('');
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
  else if (r === '#/infos') html = pageInfos();
  else if (r === '#/chabbat') html = pageChabbat();
  else if (r === '#/compte') html = pageAccount();
  else if (r.startsWith('#/admin')) html = pageAdmin();
  else html = pageHome();
  v.innerHTML = html;
  hydrate();
}

/* ============================== Cartes ============================== */
const initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

// Essaie d'autres extensions si la photo n'est pas trouvée (.png, .jpg, .jpeg, .webp).
window.imgFallback = (img) => {
  const alt = (img.dataset.alt || '').split('|').filter(Boolean);
  if (!alt.length) { img.style.opacity = 0; return; }
  img.src = alt.shift();
  img.dataset.alt = alt.join('|');
};

// Ancienneté : uniquement à partir d'une date confirmée (joinYear) ou d'une période renseignée (years).
function seniority(c) {
  const nowY = new Date().getFullYear();
  if (c.joinYear) {
    const y = Number(c.joinYear);
    if (y > 1900 && y <= nowY) {
      const n = nowY - y;
      return { main: `Depuis ${y}`, sub: n <= 0 ? '1re année' : plural(n, 'an', 'ans') + ' au DEJJ', year: y };
    }
  }
  if (c.years) return { main: String(c.years), sub: 'période confirmée', year: null };
  return null;
}

const cardImage = (c) => (c.image || c.imageUrl || '').trim();

function cardArt(c, lock) {
  if (lock) return '';
  const src = cardImage(c);
  if (!src) return '';
  const base = src.replace(/\.(png|jpe?g|webp)$/i, '');
  const cands = [...new Set([src, base + '.png', base + '.jpg', base + '.jpeg', base + '.webp'])];
  const pos = c.imagePos || '50% 28%';
  const zoom = c.imageZoom ? `scale(${Number(c.imageZoom)})` : '';
  return `<img src="${esc(cands[0])}" data-alt="${esc(cands.slice(1).join('|'))}" alt="${esc(c.name || 'Photo')}" loading="lazy"
    onerror="window.imgFallback(this)" style="object-position:${esc(pos)};transform:${esc(zoom)}">`;
}

// Anecdote d'abord, parcours ensuite, ancienneté enfin (ordre imposé par le cahier des charges).
function cardHTML(c, { full = false, count = 0, lock = false, tilt = true, num = 0, total = 0 } = {}) {
  const r = RAR[c.rarity] ? c.rarity : 'commune';
  const s = seniority(c);
  const career = (c.career || c.timeline || []).filter(Boolean).slice(0, full ? 4 : 3);
  const anecdote = (c.anecdote || c.quote || '').trim();
  const quoteOnly = !c.anecdote && c.quote;
  const seal = c.seal === false || lock ? '' : `<span class="tcg-seal" title="DEJJ · Un mouvement pour tous"><img src="logo-flame.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'DEJJ'}))"></span>`;
  const ageBadge = s && s.year && !lock ? `<span class="tcg-sen" title="Année d’arrivée confirmée">DEJJ<b>${esc(String(s.year))}</b></span>` : '';
  const careerHtml = lock ? '<ul class="tcg-path"><li class="tcg-hide">Parcours à découvrir</li></ul>' : career.length
    ? `<ul class="tcg-path">${career.map((t) => {
      const m = String(t).match(/^([0-9]{4}(?:\s*[-–]\s*[0-9]{4})?)\s*:\s*(.+)$/);
      return m ? `<li><span class="yr">${esc(m[1])}</span> · ${esc(m[2])}</li>` : `<li>${esc(t)}</li>`;
    }).join('')}</ul>`
    : (full ? `<p class="tcg-nodata">Parcours à compléter par l’équipe.</p>` : '');
  return `<div class="tcg r-${r} ${full ? 'full' : 'mini'} ${lock ? 'lock' : ''} ${tilt && !lock ? 'tilt' : ''}" data-card="${esc(c.id)}">
  <div class="tcg-in">
    <div class="tcg-face">
      <div class="tcg-head"><h3>${esc(lock ? 'Carte à découvrir' : (c.name || 'Nom à compléter'))}</h3><span class="tcg-sym" title="${RAR[r].label}">${RAR[r].sym}</span></div>
      <div class="tcg-art">
        ${cardArt(c, lock)}
        ${!lock && !cardImage(c) ? '<span class="tcg-ph photo-missing">Photo à ajouter</span>' : ''}
        ${lock ? '' : seal}${lock ? '' : ageBadge}
        ${!lock && c.nickname ? `<span class="tcg-nick">Totem · ${esc(c.nickname)}</span>` : ''}
        <i class="tcg-shine"></i>
      </div>
      <div class="tcg-type"><span>${esc(c.role || CATS[c.category] || RAR[r].label)}</span>${c.years ? `<b>${esc(c.years)}</b>` : ''}</div>
      <div class="tcg-anecdote">
        <b>${quoteOnly ? 'Sa phrase' : 'Anecdote'}</b>
        <p>${esc(anecdote || 'Anecdote à compléter par l’équipe.')}</p>
      </div>
      ${careerHtml}
      ${s ? `<div class="tcg-age"><small>${s.year ? 'Ancienneté' : 'Période'}</small><b>${esc(s.main)}</b></div>` : `<div class="tcg-age"><small>Ancienneté</small><b>À confirmer</b></div>`}
      <div class="tcg-foot">
        <span class="lab"><img src="logo-flame.png" alt="" onerror="this.remove()">${esc(c.collection || 'DEJJ')}</span>
        <span class="num">${total ? `${String(num || 1).padStart(3, '0')}/${String(total).padStart(3, '0')}` : RAR[r].label}</span>
      </div>
    </div>
    <i class="tcg-holo"></i><i class="tcg-spark"></i><i class="tcg-glare"></i>
  </div>
  ${count > 1 ? `<span class="qty">×${count}</span>` : ''}</div>`;
}

function cardDetails(c) {
  const s = seniority(c);
  const career = (c.career || c.timeline || []).filter(Boolean);
  const anecdote = (c.anecdote || c.quote || '').trim();
  return `<div class="card-details">
    <p class="order-note">Anecdote → parcours → ancienneté</p>
    <div class="cd-block anecdote"><h4>1 · ${c.anecdote ? 'Anecdote' : 'Sa phrase'}</h4><p>${esc(anecdote || 'À compléter par l’équipe.')}</p>
      ${c.quote && c.anecdote ? `<blockquote>« ${esc(c.quote)} »${c.quoteBy ? `<cite>${esc(c.quoteBy)}</cite>` : ''}</blockquote>` : (c.quote && !c.anecdote && c.quoteBy ? `<cite style="display:block;font:.8rem var(--f-type);color:#6b6248">${esc(c.quoteBy)}</cite>` : '')}
    </div>
    <div class="cd-block"><h4>2 · Parcours</h4>
      ${career.length ? `<ul class="tl">${career.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '<p class="muted">Parcours à compléter par l’équipe.</p>'}
    </div>
    <div class="cd-block age"><h4>3 · Ancienneté</h4>
      ${s ? `<p><b>${esc(s.main)}</b>${s.sub ? ` · ${esc(s.sub)}` : ''}</p>${s.year ? '' : '<p class="muted" style="font-size:.82rem">Année d’arrivée au DEJJ non confirmée : seule la période ci-dessus est affichée.</p>'}`
        : '<p>Année d’arrivée non confirmée : à renseigner par l’équipe (aucune date n’est inventée).</p>'}
    </div>
    <p class="muted" style="font-size:.82rem">Catégorie : ${esc(CATS[c.category] || '—')} · Collection : ${esc(c.collection || 'DEJJ')} · Rareté : ${esc(RAR[c.rarity]?.label || 'Commune')}${c.role ? ` · Fonction : ${esc(c.role)}` : ''}${c.sources ? `<br>Source : ${esc(c.sources)}` : ''}${c.toVerify ? '<br>⚠️ Fiche à valider par un administrateur avant diffusion.' : ''}</p>
  </div>`;
}

/* Inclinaison 3D et reflets (cartes et paquet) */
function tiltMove(e) {
  const c = e.target.closest?.('.tilt'); if (!c) return;
  const r = c.getBoundingClientRect();
  const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
  c.classList.add('hot');
  c.style.setProperty('--mx', (x * 100).toFixed(1));
  c.style.setProperty('--my', (y * 100).toFixed(1));
  c.style.setProperty('--rx', ((0.5 - y) * 14).toFixed(1) + 'deg');
  c.style.setProperty('--ry', ((x - 0.5) * 18).toFixed(1) + 'deg');
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

/* ============================== Tirage du booster ============================== */
function rollRarity(weights) {
  const entries = Object.entries(RAR).filter(([k]) => Number(weights?.[k]) > 0);
  const total = entries.reduce((s, [k]) => s + Number(weights[k]), 0);
  if (!total) return 'commune';
  let x = Math.random() * total;
  for (const [k] of entries) { if ((x -= Number(weights[k])) < 0) return k; }
  return entries[0][0];
}
function poolFor(rarity) {
  const exact = packPool().filter((c) => c.rarity === rarity);
  if (exact.length) return exact;
  // Repli : rareté la plus proche disponible (on ne fabrique jamais de carte).
  const order = ['legendaire', 'epique', 'rare', 'commune'];
  const i = order.indexOf(rarity);
  for (let j = i + 1; j < order.length; j++) { const p = packPool().filter((c) => c.rarity === order[j]); if (p.length) return p; }
  for (let j = i - 1; j >= 0; j--) { const p = packPool().filter((c) => c.rarity === order[j]); if (p.length) return p; }
  return packPool();
}
function pickFrom(pool, avoid) {
  if (!pool.length) return null;
  const fresh = pool.filter((c) => !avoid.has(c.id));
  const src = fresh.length ? fresh : pool;
  return src[Math.floor(Math.random() * src.length)];
}
// mode 'card' : chaque carte est tirée avec ses propres probabilités depuis le pool complet.
// mode 'pack' : un seul tirage de rareté détermine la rareté dominante du booster (dernière carte ≥ rare si activé).
function drawPack(model) {
  const cfg = boosterCfg();
  const pool = packPool();
  if (!pool.length) return [];
  const out = [], used = new Set();
  const n = Math.max(1, Math.min(20, Number(cfg.packSize) || 5));
  if (cfg.mode === 'pack') {
    const main = model || rollRarity(cfg.packOdds);
    for (let i = 0; i < n; i++) {
      let r = main;
      if (i === n - 1 && cfg.minRareLast && main === 'commune') r = 'rare';
      const c = pickFrom(poolFor(r), used);
      if (c) { out.push(c); used.add(c.id); }
    }
  } else {
    for (let i = 0; i < n; i++) {
      let r = rollRarity(cfg.perCard);
      if (i === n - 1 && cfg.minRareLast && r === 'commune') r = 'rare';
      const c = pickFrom(poolFor(r), used);
      if (c) { out.push(c); used.add(c.id); }
    }
  }
  return out;
}
// Le premier booster du jour : jour calendaire local (Europe/Paris), indépendant du fuseau de l'appareil en pratique.
function currentBoosterDayKey() { return localDay(); }
function canOpenBooster() {
  if (!S.user) return false;
  if (S.boosterLog) return false; // déjà ouvert aujourd'hui (journal serveur)
  return (S.profile?.lastBoosterDay || 0) < utcKey();
}
function nextBoosterText() {
  const d = new Date();
  const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
  return `Prochain booster gratuit demain à minuit (dans ${Math.max(1, Math.round((next - d) / 36e5))} h).`;
}

/* ============================== Page : Accueil ============================== */
function upcomingEvents() {
  const now = Date.now() - 3 * 36e5;
  return S.events
    .filter((e) => e.published !== false && toDate(e.date) && toDate(e.date).getTime() >= now)
    .sort((a, b) => toDate(a.date) - toDate(b.date));
}

// Compteurs publics par événement (document events/{id}/stats/public) : aucune donnée personnelle.
function evCounts(ev) {
  const c = S.rsvpCounts[ev.id] || {};
  const yes = Number(c.yes) || 0, no = Number(c.no) || 0, wait = Number(c.wait) || 0;
  const capN = Number(ev.capacity) || 0;
  const confirmedN = capN ? Math.min(yes, capN) : yes;
  const waitN = capN ? Math.max(0, yes - capN) + wait : wait;
  return { yes, no, wait, capN, confirmedN, waitN, left: capN ? Math.max(0, capN - confirmedN) : null };
}
// Statut de l'utilisateur courant, à partir de ses propres inscriptions uniquement.
function evStats(ev) {
  const c = evCounts(ev);
  const mine = S.user ? (S.myRsvps || []).find((r) => (r._eventId || r.eventId) === ev.id) : null;
  const myStatus = !mine ? null : mine.answer === 'no' ? 'no' : mine.answer === 'wait' ? 'wait'
    : c.capN && c.left === 0 && (mine.answer === 'yes') ? (S.rsvpNames[ev.id] ? 'yes' : 'yes') : 'yes';
  let waitRank = 0;
  if (mine && mine.answer === 'wait') waitRank = Math.max(1, c.waitN - c.wait + c.wait);
  if (mine && mine.answer === 'yes' && c.capN && c.left === 0) waitRank = Math.max(1, c.waitN);
  return {
    ...c, mine, myStatus, waitRank,
    confirmed: { length: c.confirmedN }, waitlist: { length: c.waitN }, no: { length: c.no }
  };
}

function participantList(ev) {
  const names = S.rsvpNames[ev.id];
  if (!names || !names.size) return '<p class="muted">Aucun nom enregistré pour le moment.</p>';
  const list = [...names.values()].filter((r) => r && r.name);
  const yes = list.filter((r) => r.answer !== 'wait' && r.answer !== 'no');
  const wait = list.filter((r) => r.answer === 'wait');
  return `<div class="people">${yes.slice(0, 200).map((r) => `<span class="chip y">${esc(r.name)}</span>`).join('')}</div>
    ${wait.length ? `<p class="type" style="margin:.4rem 0 0">En attente</p><div class="people">${wait.map((r, i) => `<span class="chip">${i + 1}. ${esc(r.name)}</span>`).join('')}</div>` : ''}`;
}

function eventRow(ev) {
  const d = toDate(ev.date); const st = evStats(ev);
  const places = st.capN ? (st.left ? `${plural(st.left, 'place')} restante${st.left > 1 ? 's' : ''}` : 'Complet') : 'Places illimitées';
  const chip = st.myStatus === 'yes' ? '<span class="chip g">Tu participes</span>'
    : st.myStatus === 'wait' ? '<span class="chip y">Liste d’attente</span>'
      : st.myStatus === 'no' ? '<span class="chip">Absent</span>' : '';
  const img = ev.image ? `<span class="ev-thumb"><img src="${esc(ev.image)}" alt="" loading="lazy"></span>` : '';
  return `<button class="event" data-act="event" data-id="${esc(ev.id)}">
    ${img}
    <div class="datebox"><small>${esc(d.toLocaleDateString('fr-FR', { month: 'short' }))}</small><b>${d.getDate()}</b><small>${esc(d.toLocaleDateString('fr-FR', { weekday: 'short' }))}</small></div>
    <div style="flex:1;min-width:0"><h3>${esc(ev.title)}</h3>
      <div class="meta">${fmtTime(d)} · ${esc(ev.place || 'Lieu à préciser')}${ev.delegation ? ` · ${esc(ev.delegation)}` : ''}</div>
      <div class="row" style="margin-top:.4rem"><span class="chip o">${places}</span>${S.user ? `<span class="chip">${plural(st.confirmed.length, 'inscrit')}</span>` : ''}${chip}</div>
    </div></button>`;
}

function anecdoteOfDay() {
  const list = S.anecdotes.length ? S.anecdotes : SEED_ANECDOTES;
  if (!list.length) return null;
  const today = localDay();
  const scheduled = list.filter((a) => a.date === today);
  if (scheduled.length) return scheduled[0];
  const pub = list.filter((a) => a.published !== false);
  return pub.length ? pub[dayNumber() % pub.length] : list[0];
}

function quickLinks() {
  const links = [['#/agenda', 'calendar', 'Agenda'], ['#/album', 'album', 'Mon album'], ['#/compte', 'user', 'Espace membre'], ['#/boosters', 'cards', 'Booster'], ['#/saga', 'news', 'La Saga'], ['#/infos', 'heart', 'Infos & dons'], ['#/chabbat', 'candle', 'Chabbat']];
  return `<section class="quick">${links.map(([h, i, l]) => `<a href="${h}"><b>${icon(i)}</b>${l}</a>`).join('')}</section>`;
}

function pageHome() {
  const evs = upcomingEvents().slice(0, 3);
  const dc = S.dayCard || dailyCard();
  const word = todayWord();
  const an = anecdoteOfDay();
  const all = visibleCards();
  return `
  <section class="hero tape">
    <span class="date">${esc(fmtDay(new Date()))}</span>
    ${cut('DEJJ Community', 'big')}
    <p>Événements, cartes à collectionner, mémoire de l’association : toute la communauté au même endroit.</p>
    <div class="hero-cta">
      <a class="btn alt" href="#/boosters">Mon booster du jour</a>
      <a class="btn ghost" style="color:var(--cream);border-color:var(--cream)" href="#/agenda">Voir l’agenda</a>
    </div>
    <img class="hero-logo" src="logo-tagline.png" alt="DEJJ · Un mouvement pour tous">
  </section>
  ${quickLinks()}
  <div class="grid g2">
    <section class="block span2">
      <span class="kicker">À venir</span>${cut('Prochains événements', 'mid')}
      <div class="events" style="margin-top:.8rem">${evs.length ? evs.map(eventRow).join('') : '<div class="empty">Aucun événement programmé pour le moment.</div>'}</div>
      ${S.events.length ? '<p><a href="#/agenda">Tout l’agenda →</a></p>' : ''}
    </section>
    <section class="block alt tape">
      <span class="kicker">Mot du jour</span>
      ${wordBlock(word)}
    </section>
    <section class="block tape">
      <span class="kicker">Carte du jour</span>
      <div style="margin-top:.9rem;display:grid;place-items:center">${dc ? `<div style="width:min(250px,100%)" data-act="card" data-id="${esc(dc.id)}">${cardHTML(dc, { full: true, num: all.indexOf(dc) + 1, total: all.length })}</div>` : '<div class="empty">Pas de carte programmée aujourd’hui.</div>'}</div>
    </section>
    <section class="block dark">
      <span class="kicker" style="background:var(--yellow);color:var(--navy)">Chabbat · ${esc(S.del)}</span>
      <div id="js-shabbat" data-mini="1" style="margin-top:.7rem">Chargement des horaires…</div>
      <p style="margin:.5rem 0 0"><a href="#/chabbat">Horaires et paracha →</a></p>
    </section>
    <section class="block">
      <span class="kicker">Booster</span>
      <p class="serif" style="font-size:1.15rem">${!S.user ? 'Connecte-toi pour ouvrir ton booster gratuit du jour.' : canOpenBooster() ? 'Ton booster du jour t’attend.' : 'Booster du jour déjà ouvert. ' + esc(nextBoosterText())}</p>
      <a class="btn" href="#/boosters">${S.user && canOpenBooster() ? 'Ouvrir' : 'Voir les boosters'}</a>
    </section>
    <section class="block span2">
      <span class="kicker">Anecdote</span>
      ${an ? `<h3 class="serif" style="font-size:1.3rem;margin:.5rem 0">${esc(an.title)}</h3>${an.year ? `<div class="muted type">${esc(an.year)}</div>` : ''}<p style="font-family:var(--f-serif)">${esc(an.body).replace(/\n/g, '<br>')}</p>` : '<p class="muted">Les anecdotes arrivent bientôt.</p>'}
      <a class="btn btn-small alt" href="#/saga">Toutes les anecdotes →</a>
    </section>
    <section class="block span2">
      <span class="kicker">Actualités</span>${cut('Les dernières nouvelles', 'mid')}
      <div style="margin-top:.8rem">${S.news.length ? S.news.slice(0, 3).map(newsItem).join('') : '<div class="empty">Pas encore d’actualité.</div>'}</div>
    </section>
  </div>`;
}

function newsItem(n) {
  const d = toDate(n.createdAt);
  return `<article class="timeline-item"><h3>${esc(n.title)}</h3>${d ? `<div class="muted type">${esc(fmtDay(d))}</div>` : ''}<p>${esc(n.body).replace(/\n/g, '<br>')}</p></article>`;
}

/* ============================== Page : Agenda ============================== */
function pageAgenda() {
  const evs = upcomingEvents();
  const past = S.events
    .filter((e) => e.published !== false && !evs.includes(e) && toDate(e.date))
    .sort((a, b) => toDate(b.date) - toDate(a.date)).slice(0, 6);
  let html = `<span class="kicker">Calendrier</span>${cut('Agenda', 'big')}
    <section class="block official-agenda" style="margin:1rem 0">
      <span class="kicker">Événement national · départ Marseille</span>
      <h2 class="serif">Séjour ski DEJJ 2027</h2>
      <p class="type">21–28 février 2027 · Alpes-de-Haute-Provence</p>
      <p>REDEF, Pionniers et JAC · du CP à la Terminale · 870 € tout compris selon l’annonce officielle.</p>
      <a class="btn btn-small" href="https://www.dejj.fr/copie-de-bafa-fg-appro" target="_blank" rel="noopener">Informations et inscription sur DEJJ.fr</a>
    </section>
    <section class="block official-agenda" style="margin:1rem 0">
      <span class="kicker">Stage national · départ Marseille</span>
      <h2 class="serif">Formation Maayan</h2>
      <p class="type">22–31 décembre 2026 · Pas-de-Calais</p>
      <p>Pour les jeunes de 15 ans (nés en 2011). Formation, hébergement, pension complète casher et transports inclus. Tarif adhérent annoncé : 449 €.</p>
      <a class="btn btn-small" href="https://www.dejj.fr/copie-de-ski-sud-marseille-nice-2027-1" target="_blank" rel="noopener">Informations et inscription sur DEJJ.fr</a>
    </section>
    <p class="muted" style="font-size:.85rem">Les événements locaux de Marseille ne sont ajoutés au calendrier que lorsque leurs dates sont confirmées sur le site officiel. La liste actuellement indexée affiche encore des événements d’octobre 2026, déjà passés.</p>`;
  if (!S.user) html += `<div class="block" style="margin-top:1rem"><p>Connecte-toi pour t’inscrire aux événements et voir les places restantes.</p><a class="btn" href="#/compte">Connexion</a></div>`;
  if (!evs.length) html += '<div class="empty" style="margin-top:1rem">Aucun événement à venir.</div>';
  let lastMonth = '';
  evs.forEach((e) => {
    const m = fmtMonth(toDate(e.date));
    if (m !== lastMonth) { html += `<div class="month">${esc(m)}</div>`; lastMonth = m; }
    html += `<div class="events" style="margin-bottom:.8rem">${eventRow(e)}</div>`;
  });
  if (past.length) html += `<h3 class="sec-title type">Événements passés</h3><div class="events" style="opacity:.7">${past.map(eventRow).join('')}</div>`;
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
        : `<button class="btn" data-act="rsvp" data-id="${esc(ev.id)}" data-ans="${st.left ? 'yes' : 'wait'}">${st.left ? 'Je participe' : 'Rejoindre la liste d’attente'}</button>`;
    } else {
      actions = `<button class="btn ${st.myStatus === 'yes' ? '' : 'alt'}" data-act="rsvp" data-id="${esc(ev.id)}" data-ans="yes">${st.myStatus === 'yes' ? '✓ ' : ''}Je participe</button>
                 <button class="btn ${st.myStatus === 'no' ? 'navy' : 'alt'}" data-act="rsvp" data-id="${esc(ev.id)}" data-ans="no">${st.myStatus === 'no' ? '✓ ' : ''}Je ne participe pas</button>`;
    }
    const status = st.myStatus === 'yes' ? '<p class="good">Ta participation est confirmée.</p>'
      : st.myStatus === 'wait' ? `<p class="bad" style="color:#b36b00">Tu es en liste d’attente (position ${st.waitRank}). Tu passeras automatiquement en inscrit si une place se libère.</p>` : '';
    const pct = st.capN ? Math.min(100, Math.round((st.confirmed.length / st.capN) * 100)) : 0;
    const canSee = canSeeRsvps() && S.user;
    inner = `<button class="x" data-act="close" aria-label="Fermer">✕</button>
      ${ev.image ? `<img src="${esc(ev.image)}" alt="" class="ev-hero">` : ''}
      <span class="kicker">${esc(fmtDay(d))} · ${fmtTime(d)}${ev.endDate ? ` → ${fmtTime(toDate(ev.endDate))}` : ''}</span>
      <h2 class="serif" style="font-size:1.8rem;margin:.5rem 0">${esc(ev.title)}</h2>
      <p class="type">${esc(ev.place || 'Lieu à préciser')}${ev.delegation ? ` · ${esc(ev.delegation)}` : ''}</p>
      <p>${esc(ev.description || '').replace(/\n/g, '<br>')}</p>
      ${S.user ? (st.capN ? `<div class="bar"><i style="width:${pct}%"></i></div><p><b>${st.confirmed.length}</b> ${st.confirmed.length > 1 ? 'inscrits' : 'inscrit'} sur ${st.capN} · ${st.left ? `<b>${plural(st.left, 'place')} restante${st.left > 1 ? 's' : ''}</b>` : '<b>Complet</b>'}${st.waitlist.length ? ` · ${st.waitlist.length} en attente` : ''}</p>`
        : `<p><span class="chip g">${plural(st.confirmed.length, 'présent')}</span> <span class="chip r">${plural(st.no.length, 'absent')}</span></p>`) : '<p class="muted">Connecte-toi pour voir les inscriptions.</p>'}
      ${status}
      <div class="row" style="margin:.8rem 0">${actions}</div>
      ${canSee && st.confirmedN ? `<h3 class="type">Participants (${st.confirmedN})</h3>${participantList(ev)}` : ''}
      ${canSee && st.waitN ? `<h3 class="type">Liste d’attente (${st.waitN})</h3><p class="muted">Les noms sont protégés : consulte la liste complète dans l’export CSV/Excel.</p>` : ''}
      ${canManageEvents() ? `<div class="row" style="margin-top:1rem"><button class="btn btn-small alt" data-act="csv" data-id="${esc(ev.id)}">Exporter (CSV)</button><button class="btn btn-small alt" data-act="xls" data-id="${esc(ev.id)}">Exporter (Excel)</button></div>` : ''}`;
  } else if (S.modal.type === 'card') {
    const c = cardById(S.modal.id); if (!c) { closeModal(); return; }
    const all = visibleCards();
    const owned = S.collection.has(c.id) || can('admin');
    if (!owned && S.user) {
      inner = `<button class="x" data-act="close" aria-label="Fermer">✕</button>
        <div style="padding-top:1.2rem;width:min(300px,100%);margin:0 auto">${cardHTML(c, { full: true, lock: true })}</div>
        <div class="card-details"><h3 class="serif" style="font-size:1.3rem">Carte non encore découverte</h3>
          <p>Aperçu : « ${esc((c.anecdote || c.quote || '').slice(0, 120))}${(c.anecdote || '').length > 120 ? '…' : ''} »</p>
          <p class="muted">Ouvre des boosters pour compléter ton album : le parcours complet et l’ancienneté se révèlent quand tu obtiens la carte.</p>
          <a class="btn" href="#/boosters" data-act="close">Ouvrir le booster du jour</a></div>`;
      m.innerHTML = `<div class="modal-in">${inner}</div>`; return;
    }
    inner = `<button class="x" data-act="close" aria-label="Fermer">✕</button><div style="padding-top:1.2rem;width:min(310px,100%);margin:0 auto">${cardHTML(c, { full: true, count: S.collection.get(c.id)?.count || 0, num: all.indexOf(c) + 1, total: all.length })}</div>${cardDetails(c)}`;
  } else if (S.modal.type === 'notifs') {
    const ns = notifications();
    inner = `<button class="x" data-act="close" aria-label="Fermer">✕</button>${cut('Notifications', 'mid')}
      <div style="margin-top:1rem">${ns.length ? ns.map((n) => `<div class="admin-item" style="margin-bottom:.4rem"><span>${n.icon} ${esc(n.text)}</span>${n.href ? `<a class="btn btn-small" href="${n.href}">Voir</a>` : ''}</div>`).join('') : '<p class="muted">Rien de nouveau pour le moment.</p>'}</div>
      ${'Notification' in window && Notification.permission !== 'granted' ? '<p><button class="btn alt btn-small" data-act="askperm">Activer les alertes sur cet appareil</button></p>' : ''}
      <p class="muted" style="margin-top:1rem">Les alertes ci-dessus s’affichent dans l’application (elles sont calculées à partir des événements et des contenus). Pour recevoir une notification push quand l’application est fermée, il faut Firebase Cloud Messaging + un serveur d’envoi : c’est gratuit dans l’offre Spark tant que le volume reste raisonnable, mais l’envoi programmé nécessite Cloud Functions ou un petit serveur (voir ADMIN → Règles & limites).</p>`;
  }
  m.innerHTML = `<div class="modal-in">${inner}</div>`;
}
function openModal(m) {
  S.modal = m; renderModal();
  if (m.type === 'event' && canSeeRsvps() && !DEMO) loadRsvpNames([m.id]);
}
function closeModal() { S.modal = null; renderModal(); }

/* ============================== Page : Boosters ============================== */
function pageBoosters() {
  const cfg = boosterCfg();
  const ok = canOpenBooster();
  const pool = packPool();
  const owned = [...S.collection.keys()].filter((id) => packPool().some((c) => c.id === id)).length;
  const rarLine = `<div class="odds">${Object.entries(RAR).map(([k, v]) => `<div class="odd r-${k}"><b>${cfg.perCard[k] ?? 0} %</b><span>${v.label}</span></div>`).join('')}</div>`;
  return `<span class="kicker">Un par jour, gratuit</span>${cut('Boosters', 'big')}
  <div class="block" style="margin-top:1.2rem;text-align:center">
    <div class="pack-preview">${packHTML()}</div>
    <p class="serif" style="font-size:1.2rem">${cfg.packSize} cartes par booster${cfg.minRareLast ? ', la dernière au moins rare' : ''}.</p>
    ${!S.user ? '<a class="btn" href="#/compte">Se connecter pour ouvrir</a>'
      : ok ? '<button class="btn" data-act="openpack">Ouvrir mon booster</button>'
        : `<p class="chip y" style="font-size:.9rem">Déjà ouvert aujourd’hui · ${esc(nextBoosterText())}</p>`}
    <p class="muted" style="margin-top:1rem">Un seul booster gratuit par jour et par compte. Le tirage est enregistré sur ton compte (journal <code>boosters</code>) pour empêcher une seconde ouverture, même sur un autre appareil.</p>
  </div>
  ${S.user ? `<div class="progress" style="margin-top:1.2rem"><b class="type">${owned} / ${pool.length} cartes découvertes</b><div class="bar"><i style="width:${pool.length ? Math.round((owned / pool.length) * 100) : 0}%"></i></div><a class="btn btn-small" href="#/album">Mon album</a></div>` : ''}
  <h3 class="sec-title type">Probabilités affichées (par carte)</h3>
  ${rarLine}
  <p class="muted">${cfg.mode === 'card' ? 'Les probabilités s’appliquent à chaque carte du booster.' : 'Un tirage unique par booster détermine la rareté dominante du paquet.'} Elles sont modifiables par l’administrateur (Admin → Boosters), sans modifier le code.</p>
  <h3 class="sec-title type">Les niveaux de rareté</h3>
  <div class="grid g2">${Object.entries(RAR).map(([k, v]) => `<div class="block"><span class="chip ${k === 'legendaire' ? 'o' : k === 'epique' ? '' : k === 'rare' ? 'y' : ''}">${v.label}</span><p style="margin:.4rem 0 0">${v.desc}</p></div>`).join('')}</div>`;
}

function pageAlbum() {
  if (!S.user) return `<span class="kicker">Collection</span>${cut('Album', 'big')}<div class="block" style="margin-top:1rem"><p>Connecte-toi pour voir ta collection.</p><a class="btn" href="#/compte">Connexion</a></div>`;
  const catalogue = visibleCards();
  const cards = isAdmin() ? catalogue : catalogue.filter((c) => S.collection.has(c.id));
  const a = S.album;
  const ownedIds = cards.filter((c) => S.collection.has(c.id));
  const dups = [...S.collection.values()].reduce((s, c) => s + Math.max(0, (Number(c.count) || 1) - 1), 0);
  const cols = [...new Set(cards.map((c) => c.collection || 'Autres'))].sort((x, y) => x.localeCompare(y, 'fr'));
  const cats = [...new Set(cards.map((c) => c.category).filter(Boolean))];
  const order = { legendaire: 0, epique: 1, rare: 2, commune: 3 };
  let shown = cards.filter((c) => (a.filter === 'toutes' || (c.collection || 'Autres') === a.filter)
    && (a.cat === 'toutes' || c.category === a.cat)
    && (isAdmin() ? (a.owned === 'toutes' || (a.owned === 'possedees') === S.collection.has(c.id)) : S.collection.has(c.id))
    && (!a.q || norm(c.name || '').includes(norm(a.q))));
  if (a.sort === 'rarete') shown.sort((x, y) => (order[x.rarity] ?? 9) - (order[y.rarity] ?? 9));
  else if (a.sort === 'nom') shown.sort((x, y) => String(x.name).localeCompare(String(y.name), 'fr'));
  else if (a.sort === 'doublons') shown.sort((x, y) => (S.collection.get(y.id)?.count || 0) - (S.collection.get(x.id)?.count || 0));
  const pct = catalogue.length ? Math.round((ownedIds.length / catalogue.length) * 100) : 0;
  const byRar = Object.keys(RAR).map((r) => ({ r, all: catalogue.filter((c) => c.rarity === r).length, got: catalogue.filter((c) => c.rarity === r && S.collection.has(c.id)).length }));
  return `<span class="kicker">Collection</span>${cut('Mon album', 'big')}
  <p class="album-intro">${isAdmin() ? 'Vue administrateur : catalogue complet et cartes à compléter.' : 'Ton classeur personnel : seules les cartes que tu as obtenues apparaissent ici.'}</p>
  <div class="album-head">
    <div class="progress" style="margin:.8rem 0"><b class="type">${ownedIds.length} / ${catalogue.length} découvertes · ${pct} %</b><div class="bar"><i style="width:${pct}%"></i></div></div>
    <div class="album-stats">${byRar.map(({ r, all, got }) => `<span class="chip ${r === 'legendaire' ? 'o' : r === 'rare' ? 'y' : ''}">${RAR[r].label} ${got}/${all}</span>`).join('')}<span class="chip">${plural(dups, 'doublon')}</span></div>
  </div>
  <div class="tabs"><button class="${a.filter === 'toutes' ? 'on' : ''}" data-act="albumfilter" data-v="toutes">Toutes</button>${cols.map((c) => `<button class="${a.filter === c ? 'on' : ''}" data-act="albumfilter" data-v="${esc(c)}">${esc(c)}</button>`).join('')}</div>
  <div class="tabs">${['rarete', 'nom', 'doublons'].map((s) => `<button class="${a.sort === s ? 'on' : ''}" data-act="albumsort" data-v="${s}">${s === 'rarete' ? 'Tri : rareté' : s === 'nom' ? 'Tri : nom' : 'Tri : doublons'}</button>`).join('')}
    ${isAdmin() ? ['toutes', 'possedees', 'manquantes'].map((s) => `<button class="${a.owned === s ? 'on' : ''}" data-act="albumowned" data-v="${s}">${s === 'toutes' ? 'Tout' : s === 'possedees' ? 'Possédées' : 'Manquantes'}</button>`).join('') : ''}
  </div>
  ${cats.length ? `<div class="tabs">${['toutes', ...cats].map((c) => `<button class="${a.cat === c ? 'on' : ''}" data-act="albumcat" data-v="${esc(c)}">${c === 'toutes' ? 'Toutes catégories' : esc(CATS[c] || c)}</button>`).join('')}</div>` : ''}
  <p><input id="album-q" placeholder="Rechercher une carte…" value="${esc(a.q)}" style="max-width:320px" aria-label="Rechercher une carte"></p>
  <div class="cards">${shown.map((c) => { const q = S.collection.get(c.id); return `<div data-act="card" data-id="${esc(c.id)}">${cardHTML(c, { count: q?.count || 0, lock: !q, tilt: !!q })}</div>`; }).join('') || '<div class="empty">Aucune carte avec ces filtres.</div>'}</div>`;
}

async function openBooster() {
  if (!S.user) return go('#/compte');
  if (!db && !DEMO) return toast('Connexion à Firebase indisponible.');
  if (S.loading) return;
  if (!canOpenBooster()) return toast('Ton booster du jour est déjà ouvert.');
  if (!packPool().length) return toast('Aucune carte disponible dans les boosters.');
  const cfg = boosterCfg();
  const pack = drawPack();
  if (!pack.length) return toast('Tirage impossible : aucune carte disponible.');
  const tally = new Map();
  pack.forEach((c) => tally.set(c.id, (tally.get(c.id) || 0) + 1));
  const wasNew = new Set([...tally.keys()].filter((id) => !S.collection.has(id)));
  const uid = S.user.uid;
  const day = utcKey();
  const logId = `${uid}_${day}`;
  const model = pack.reduce((best, c) => (roleRank('member') && (RAR[c.rarity]?.w ?? 0) > (RAR[best]?.w ?? 0) ? c.rarity : best), 'commune');
  if (DEMO) {
    if (D.boosters[logId] || (D.users[uid]?.lastBoosterDay || 0) >= day) return toast('Booster déjà ouvert aujourd’hui. Reviens demain !');
    D.boosters[logId] = { uid, day, cards: [...tally.keys()], counts: Object.fromEntries(tally), model, packSize: pack.length };
    D.users[uid].lastBoosterDay = day;
    D.collections[uid] = D.collections[uid] || {};
    tally.forEach((n, cid) => { const prev = D.collections[uid][cid]; D.collections[uid][cid] = { cardId: cid, count: (prev?.count || 0) + n }; });
    demoPersist(); startDemoData();
    S.lock = true; showStage(pack, wasNew); return;
  }
  S.loading = true;
  try {
    const logRef = doc(db, 'boosters', logId);
    const userRef = doc(db, 'users', uid);
    await runTransaction(db, async (tx) => {
      const [logSnap, userSnap] = [await tx.get(logRef), await tx.get(userRef)];
      if (logSnap.exists()) throw new Error('already');
      if ((userSnap.data()?.lastBoosterDay || 0) >= day) throw new Error('already');
      tx.set(logRef, { uid, day, cards: [...tally.keys()], counts: Object.fromEntries(tally), model, packSize: pack.length, createdAt: serverTimestamp() });
      tx.update(userRef, { lastBoosterDay: day });
      tally.forEach((n, id) => {
        const cardRef = doc(db, 'users', uid, 'collection', id);
        const mine = S.collection.get(id);
        if (mine) tx.set(cardRef, { cardId: id, count: increment(n), firstAt: mine.firstAt || serverTimestamp(), lastAt: serverTimestamp() }, { merge: true });
        else tx.set(cardRef, { cardId: id, count: n, firstAt: serverTimestamp(), lastAt: serverTimestamp() });
      });
    });
  } catch (e) {
    S.loading = false;
    if (e.message === 'already') return toast('Booster déjà ouvert aujourd’hui. Reviens demain !');
    console.error(e);
    return toast('Impossible d’ouvrir le booster (règles Firestore ou connexion). ' + (e.code || e.message || ''));
  }
  S.loading = false;
  S.profile = { ...(S.profile || {}), lastBoosterDay: day };
  S.boosterLog = { day, cards: [...tally.keys()] };
  S.lock = true;
  showStage(pack, wasNew);
}

/* ---------- Paquet et ouverture façon Pokémon TCG ---------- */
function packHTML(id = '') {
  const cfg = boosterCfg();
  return `<div class="pk tilt" ${id ? `id="${id}"` : ''}>
    <div class="pk-light"></div>
    <div class="pk-top"></div>
    <div class="pk-body">
      <div class="pk-art"><span class="pk-stars">✦ ✦ ✦</span>
        <div class="pk-logo"><img src="logo-flame.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('b'),{textContent:'DEJJ'}))"></div>
        <b class="pk-title">BOOSTER</b><small>Édition Communauté</small><span class="pk-count">${cfg.packSize} cartes</span></div>
      <i class="pk-holo"></i><i class="pk-sheen"></i>
    </div></div>`;
}
const backHTML = () => '<div class="cback"><div class="cb-in"><img src="logo-flame.png" alt="DEJJ" class="cb-logo-img" onerror="this.replaceWith(Object.assign(document.createElement(\'span\'),{className:\'cb-logo\',textContent:\'DEJJ\'}))"></div></div>';
const FX_COL = { commune: '#ffffff', rare: '#ffc934', epique: '#c36bff', legendaire: '#ffd23c' };

function showStage(pack, wasNew) {
  const seen = new Set();
  const items = pack.map((c) => { const dup = !wasNew.has(c.id) || seen.has(c.id); seen.add(c.id); return { c, dup }; });
  const all = visibleCards();
  const st = $('#stage');
  st.hidden = false;
  st.innerHTML = `<button class="x" data-act="closestage" aria-label="Fermer">✕</button><div class="st-bg"></div><div class="rays" id="rays"></div><div class="fx-layer" id="fx"></div><div class="stage-in" id="stage-body"></div>`;
  const body = $('#stage-body');
  let i = 0, flipped = false, busy = false;

  const fxLayer = () => $('#fx');
  const sparks = (n, col, power = 1) => {
    const L = fxLayer(); if (!L) return;
    for (let k = 0; k < n; k++) {
      const s = document.createElement('i'); s.className = 'spark';
      const ang = Math.random() * Math.PI * 2, d = (80 + Math.random() * 260) * power;
      s.style.setProperty('--dx', Math.cos(ang) * d + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * d + 'px');
      s.style.setProperty('--c', col); s.style.animationDuration = (0.8 + Math.random() * 0.9) + 's';
      s.style.width = s.style.height = (4 + Math.random() * 8) + 'px';
      L.appendChild(s); setTimeout(() => s.remove(), 1900);
    }
  };
  const ring = (col) => { const L = fxLayer(); if (!L) return; const r = document.createElement('i'); r.className = 'ring'; r.style.setProperty('--c', col); L.appendChild(r); setTimeout(() => r.remove(), 1100); };
  const flash = () => { const f = document.createElement('div'); f.className = 'flash'; st.appendChild(f); setTimeout(() => f.remove(), 900); };
  const shake = (cls) => { st.classList.add(cls); setTimeout(() => st.classList.remove(cls), 700); };
  const fx = (r) => {
    const col = FX_COL[r];
    if (r === 'commune') { sparks(8, col, 0.5); return; }
    if (r === 'rare') { sparks(20, col, 0.9); ring(col); return; }
    if (r === 'epique') { sparks(38, col, 1.1); ring(col); shake('shake1'); $('#rays')?.classList.add('on', 'purple'); return; }
    // Légendaire : flash, pluie d'étincelles, rayons or et secousse
    flash(); sparks(80, col, 1.6); sparks(34, '#ffffff', 1.2); ring(col); shake('shake2'); $('#rays')?.classList.add('on');
  };
  const showPack = () => {
    body.innerHTML = `<div class="st-center">${packHTML('pack')}<p class="hint">Touche le paquet pour l’ouvrir</p><button class="btn" id="tear">Ouvrir le booster</button></div>`;
    let started = false;
    const start = async () => {
      if (started) return; started = true;
      const pk = $('#pack'); const tb = $('#tear'); if (tb) tb.disabled = true;
      const h = $('.hint', body); if (h) h.textContent = '';
      pk.classList.add('charge'); await sleep(1000);
      pk.classList.add('tear'); flash(); sparks(46, '#ffd23c', 1.2); await sleep(750);
      pk.classList.add('out'); await sleep(550);
      showDeck();
    };
    $('#pack').onclick = start; $('#tear').onclick = start;
  };
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
      `<div class="flip hint-${c.rarity}" id="top"><div class="flip-in"><div class="fl-back">${backHTML()}</div><div class="fl-front">${cardHTML(c, { full: true, num: all.indexOf(c) + 1, total: all.length })}<span class="rv-badge ${dup ? 'dup' : ''}">${dup ? 'Doublon' : 'Nouvelle'}</span></div></div></div>`;
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
      if (c.rarity === 'legendaire') $('#banner').innerHTML = cut('Légendaire', 'mid');
      $('#hint').textContent = i === items.length - 1 ? 'Touche pour voir le résumé' : 'Touche pour la carte suivante';
      await sleep(c.rarity === 'legendaire' ? 1100 : 350);
      busy = false;
    } else {
      top.classList.add('gone'); await sleep(450);
      i++; busy = false; drawTop();
    }
  };
  const showSummary = () => {
    $('#rays')?.classList.remove('on', 'purple');
    body.innerHTML = `<div class="st-center wide"><div class="banner">${cut('Ton booster', 'mid')}</div>
      <div class="sum">${items.map(({ c, dup }) => `<div class="sum-item" data-act="card" data-id="${esc(c.id)}">${cardHTML(c, { num: all.indexOf(c) + 1, total: all.length })}<span class="rv-badge ${dup ? 'dup' : ''}">${dup ? 'Doublon' : 'Nouvelle'}</span></div>`).join('')}</div>
      <p class="type" style="color:var(--yellow);margin:0">${esc(nextBoosterText())} Les cartes sont déjà ajoutées à ton album.</p>
      <div class="row" style="justify-content:center"><a class="btn alt" href="#/album" data-act="closestage">Voir mon album</a><button class="btn ghost light" data-act="closestage">Fermer</button></div></div>`;
  };
  showPack();
}
function closeStage() { S.lock = false; const st = $('#stage'); st.hidden = true; st.innerHTML = ''; refresh(true); }

/* ============================== Mot du jour, carte du jour ============================== */
function todayWord() {
  const today = localDay();
  const sched = (S.words || []).find((w) => w.id === today || w.date === today);
  if (sched) return sched;
  if (S.dayWord) return S.dayWord;
  return SEED_WORDS[dayNumber() % SEED_WORDS.length];
}
function dailyCard() {
  const cards = visibleCards(); if (!cards.length) return null;
  if (S.dayCard) return S.dayCard;
  // Rotation automatique si aucune carte n'est programmée pour aujourd'hui.
  return cards[dayNumber() % cards.length];
}
function wordBlock(w) {
  if (!w) return '<p class="muted">Pas de mot programmé aujourd’hui.</p>';
  const ws = S.wordState;
  const len = String(w.word || '').length;
  return `<div style="margin-top:.8rem">
    ${ws.revealed ? `<div class="word">${esc(w.word)}</div><div class="reveal">${esc(w.definition || '')}</div>` : `<div class="word" aria-label="Mot caché">${'?'.repeat(Math.min(len, 12))}</div>`}
    ${ws.hint && !ws.revealed ? `<p class="type">💡 ${esc(w.hint || 'Pas d’indice aujourd’hui.')}</p>` : ''}
    ${ws.result ? `<p class="${ws.result === 'ok' ? 'good' : 'bad'}">${ws.result === 'ok' ? 'Bravo, bonne réponse.' : 'Ce n’est pas ça, essaie encore.'}</p>` : ''}
    ${!ws.revealed ? `<div class="row"><input id="word-guess" placeholder="Ta réponse" value="${esc(ws.guess)}" style="flex:1;min-width:120px" aria-label="Ta réponse" autocomplete="off"><button class="btn btn-small" data-act="wordguess">Valider</button></div>
      <div class="row" style="margin-top:.5rem"><button class="btn btn-small navy" data-act="wordhint">Indice</button><button class="btn btn-small alt" data-act="wordreveal">Révéler</button></div>`
      : '<button class="btn btn-small ghost" data-act="wordreset">Rejouer demain</button>'}
  </div>`;
}

/* ============================== Page : La Saga ============================== */
function pageSaga() {
  const an = (S.anecdotes.length ? S.anecdotes : SEED_ANECDOTES).filter((a) => a.published !== false);
  const quiz = S.quiz.length ? S.quiz : SEED_QUIZ;
  const sagaCards = visibleCards().filter((c) => (c.collection || '').toLowerCase().includes('saga') || c.historical || c.category === 'personne');
  const cats = [...new Set(sagaCards.map((c) => c.category))];
  const shown = sagaCards.filter((c) => S.saga.cat === 'toutes' || c.category === S.saga.cat);
  // Quiz
  if (!S.quizState.order || S.quizState.order.length !== quiz.length) S.quizState.order = quiz.map((_, i) => i);
  const order = S.quizState.order;
  const q = S.quizState;
  let quizHtml;
  if (!quiz.length) quizHtml = '<p class="muted">Quiz à venir.</p>';
  else if (q.done) quizHtml = `<p class="serif" style="font-size:1.3rem">Score : <b>${q.score} / ${quiz.length}</b></p><button class="btn" data-act="quizreset">Rejouer</button>`;
  else {
    const cur = quiz[order[q.i]];
    quizHtml = `<p class="type">Question ${q.i + 1} / ${quiz.length}</p><h3 class="serif">${esc(cur.question)}</h3>
      ${(cur.options || []).map((o, i) => `<button class="quiz-opt ${q.picked !== null ? (i === cur.answer ? 'ok' : i === q.picked ? 'ko' : '') : ''}" data-act="quizpick" data-i="${i}" ${q.picked !== null ? 'disabled' : ''}>${esc(o)}</button>`).join('')}
      ${q.picked !== null ? `<button class="btn" data-act="quiznext">${q.i + 1 >= quiz.length ? 'Voir mon score' : 'Question suivante'}</button>` : ''}`;
  }
  return `<span class="kicker">Mémoire de l’association</span>${cut('La Saga', 'big')}
  <p class="serif" style="font-size:1.15rem;max-width:44rem">Cartes historiques, anecdotes, personnalités et souvenirs du DEJJ. Sources vérifiées, textes validés avant publication : <a href="https://www.dejjlasaga.com/fr/" target="_blank" rel="noopener">DEJJ La Saga</a>.</p>
  <div class="tabs">${['toutes', ...cats].map((c) => `<button class="${S.saga.cat === c ? 'on' : ''}" data-act="sagacat" data-v="${esc(c === 'toutes' ? 'toutes' : c)}">${c === 'toutes' ? 'Toutes' : esc(CATS[c] || c)}</button>`).join('')}</div>
  <div class="cards">${shown.map((c, k) => `<div data-act="card" data-id="${esc(c.id)}">${cardHTML(c, { full: true, num: k + 1, total: shown.length, tilt: false })}</div>`).join('') || '<div class="empty">Cartes historiques en cours de validation.</div>'}</div>
  <div class="grid g2" style="margin-top:1.6rem">
    <section class="block"><span class="kicker">Anecdotes</span>
      ${an.length ? an.map((a) => `<article class="timeline-item"><h3>${esc(a.title)}</h3>${a.year ? `<div class="muted type">${esc(a.year)}</div>` : ''}<p>${esc(a.body).replace(/\n/g, '<br>')}</p></article>`).join('') : '<p class="muted">Aucune anecdote publiée.</p>'}
    </section>
    <section class="block alt tape"><span class="kicker">Quiz</span><div style="margin-top:.8rem">${quizHtml}</div></section>
  </div>`;
}


function pageInfos() {
  return `<span class="kicker">Le mouvement</span>${cut('Infos & dons', 'big')}
    <section class="block info-block">
      <h2 class="serif">Les tranches d’âge</h2>
      <div class="age-cards">
        <article><span class="age-label">REDEF</span><h3>Primaire</h3><p>À partir du CP.</p></article>
        <article><span class="age-label">PIONNIERS</span><h3>Collège</h3><p>De la 6e à la 4e.</p></article>
        <article><span class="age-label">JAC</span><h3>Lycée</h3><p>De la 3e à la Terminale.</p></article>
      </div>
      <p class="muted">Repères publiés par le DEJJ dans sa présentation des séjours. Les groupes et critères d’inscription peuvent être précisés par l’équipe locale.</p>
    </section>
    <section class="block info-block">
      <h2 class="serif">Prochain séjour annoncé</h2>
      <div class="official-event">
        <p class="type">21 au 28 février 2027 · Alpes-de-Haute-Provence</p>
        <h3>Séjour ski DEJJ 2027</h3>
        <p>Départs de Marseille et Nice. Séjour annoncé pour les jeunes du CP à la Terminale, groupes REDEF, Pionniers et JAC.</p>
        <p><strong>Tarif annoncé : 870 € tout compris</strong> (transport, pension complète, cours ESF, forfait et matériel).</p>
        <p>Au programme : 10 heures de cours ESF, passage des étoiles et sortie détente (patinoire ou bowling), avec les activités et veillées DEJJ.</p>
        <a class="btn" href="https://www.dejj.fr/copie-de-bafa-fg-appro" target="_blank" rel="noopener">Voir les informations officielles</a>
      </div>
      <p class="muted">Les détails sont ceux publiés sur le site national du DEJJ ; vérifie les disponibilités et les modalités directement auprès de l’association.</p>
    </section>
    <section class="block info-block">
      <h2 class="serif">Soutenir le DEJJ</h2>
      <p>Les dons contribuent notamment aux activités éducatives, aux journées en centre de vacances, aux formations BAFA et aux séjours.</p>
      <div class="donation-list">
        ${[['1,90 €','Le petit DEJJ'],['4,90 €','La pause DEJJ'],['9,90 €',"Le DEJJ’euner"],['15,90 €',"DEJJ’Flix"],['19,90 €','Le bouquet du DEJJ'],['29,90 €','Le caddie du DEJJ']].map(([price,label]) => `<div><b>${price}/mois</b><span>${label}</span></div>`).join('')}
      </div>
      <a class="btn" href="https://www.dejj.fr/copie-de-faire-un-don" target="_blank" rel="noopener">Faire un don au DEJJ</a>
    </section>
    <p class="info-source">Informations issues de <a href="https://www.dejj.fr/" target="_blank" rel="noopener">dejj.fr</a>. Pour les activités locales de Marseille, consulte aussi la rubrique officielle des événements.</p>
    <a href="https://www.dejj.fr/event-list" target="_blank" rel="noopener">Consulter tous les événements du DEJJ</a>
  `;
}

/* ============================== Chabbat ============================== */
const shabbatCacheKey = (del) => 'dejj-shabbat-' + del;
const shabbatCities = () => (S.cfgChabbat?.cities?.length ? S.cfgChabbat.cities : Object.entries(DELS).map(([name, geonameid]) => ({ name, geonameid })));
const cityId = (name) => (shabbatCities().find((c) => c.name === name) || {}).geonameid || DELS[name] || DELS.Marseille;

async function fetchShabbat(del, { force = false } = {}) {
  const key = shabbatCacheKey(del);
  const cfg = S.cfgChabbat || {};
  const cached = (() => { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; } })();
  if (!force && cached && Date.now() - cached.t < 6 * 36e5) return { ...cached.out, cached: true, age: Date.now() - cached.t };
  const params = new URLSearchParams({ cfg: 'json', geonameid: String(cityId(del)), M: cfg.havdalah === 'off' ? 'off' : 'on', lg: 's', tzid: CITY_TZ });
  if (cfg.candleMinutes) params.set('b', String(cfg.candleMinutes));
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(`https://www.hebcal.com/shabbat?${params}`, { signal: ctrl.signal, cache: 'no-store' });
    if (!r.ok) throw new Error('hebcal HTTP ' + r.status);
    const j = await r.json();
    const it = j.items || [];
    const c = it.find((i) => i.category === 'candles');
    const h = it.find((i) => i.category === 'havdalah');
    const p = it.find((i) => i.category === 'parashat');
    if (!c && !h) throw new Error('réponse Hebcal sans horaire');
    const out = {
      candles: c?.date || null, havdalah: h?.date || null,
      parasha: p ? String(p.title).replace(/^Parashat\s+/i, '') : '', hebrew: p?.hebrew || '', link: p?.link || '',
      place: j.location?.title || del, fetchedAt: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify({ t: Date.now(), out }));
    return out;
  } catch (e) {
    console.warn('shabbat', e);
    if (cached) return { ...cached.out, cached: true, stale: true, age: Date.now() - cached.t };
    return { error: e.name === 'AbortError' ? 'Délai dépassé' : (e.message || 'réseau indisponible') };
  } finally { clearTimeout(timer); }
}
const hhmm = (iso) => (iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: CITY_TZ }) : null);
const dayOf = (iso) => (iso ? cap(new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: CITY_TZ })) : '');

function shabbatBlock(d, { mini = false, city = '' } = {}) {
  if (!d) return '<p>Chargement…</p>';
  if (d.error) return `<p class="err">Horaires indisponibles pour le moment (${esc(d.error)}). Aucun horaire n’est affiché pour ne pas risquer une erreur : réessaie en te connectant à Internet ou consulte le calendrier de ta communauté.</p><button class="btn btn-small alt" data-act="shabbat-reload">Réessayer</button>`;
  const inTime = hhmm(d.candles), outTime = hhmm(d.havdalah);
  return `${d.parasha ? `<p class="serif" style="font-size:1.1rem;margin:0 0 .4rem">Paracha <b>${esc(d.parasha)}</b> ${esc(d.hebrew)}</p>` : ''}
    <div class="times">
      <div class="time-box"><small>Allumage des bougies</small><b>${esc(inTime || '—')}</b><small>${esc(dayOf(d.candles))}</small></div>
      <div class="time-box"><small>Havdala</small><b>${esc(outTime || '—')}</b><small>${esc(dayOf(d.havdalah))}</small></div>
    </div>
    <p class="muted" style="font-size:.8rem">${esc(city || d.place || '')} · source Hebcal${d.stale ? ' · données enregistrées (hors ligne)' : ''}${d.age ? '' : ''}. Vérifie auprès de ta communauté en cas de doute.</p>`;
}

function pageChabbat() {
  const cities = shabbatCities();
  if (!cities.some((c) => c.name === S.del)) S.del = cities[0]?.name || 'Marseille';
  return `<span class="kicker">Horaires automatiques</span>${cut('Chabbat', 'big')}
  <div class="tabs" style="margin-top:1rem">${cities.map((c) => `<button class="${S.del === c.name ? 'on' : ''}" data-act="del" data-v="${esc(c.name)}">${esc(c.name)}</button>`).join('')}</div>
  <div class="grid g2">
    <section class="block dark"><span class="kicker" style="background:var(--yellow);color:var(--navy)">${esc(S.del)}</span><div id="js-shabbat" style="margin-top:.8rem">Chargement des horaires…</div></section>
    <section class="block"><span class="kicker">Paracha de la semaine</span><div id="js-parasha" style="margin-top:.8rem">Chargement…</div></section>
  </div>
  <p class="muted" style="margin-top:1rem">Horaires calculés automatiquement selon la ville, la date et le fuseau horaire Europe/Paris (source : <a href="https://www.hebcal.com/" target="_blank" rel="noopener">Hebcal</a>, qui gère les changements d’heure). En cas d’indisponibilité, un message clair s’affiche : aucune heure n’est inventée. <button class="btn btn-small alt" data-act="shabbat-reload">Actualiser</button></p>`;
}

async function hydrateChabbat() {
  const box = $('#js-shabbat');
  if (box) {
    const del = S.del; const mini = box.dataset.mini;
    box.innerHTML = '<p>Chargement…</p>';
    const d = await fetchShabbat(del);
    const el = $('#js-shabbat'); if (!el || del !== S.del) return;
    el.innerHTML = shabbatBlock(d, { mini: !!mini, city: del });
  }
  const pb = $('#js-parasha');
  if (pb) {
    const del = S.del;
    const d = await fetchShabbat(del);
    const el = $('#js-parasha'); if (!el) return;
    if (d.error || !d.parasha) { el.innerHTML = `<p>${d.error ? `Paracha indisponible (${esc(d.error)}).` : 'Paracha indisponible pour le moment.'}</p>`; return; }
    let story = null;
    if (db) { try { const s = await getDoc(doc(db, 'parashot', norm(d.parasha))); if (s.exists()) story = s.data(); } catch (e) { /* lecture publique facultative */ } }
    const el2 = $('#js-parasha'); if (!el2) return;
    el2.innerHTML = `<h3 class="serif" style="font-size:1.6rem">${esc(d.parasha)} ${esc(d.hebrew)}</h3>
      ${story && story.story ? `<p class="story">${esc(story.story).replace(/\n/g, '<br>')}</p>${story.source ? `<p class="muted">Source : ${esc(story.source)}</p>` : ''}`
        : `<p class="muted">L’explication de cette paracha n’a pas encore été publiée par l’équipe (elle peut être programmée depuis l’administration, onglet Paracha).</p>`}
      <div class="row"><a class="btn btn-small alt" href="https://www.torah-box.com/" target="_blank" rel="noopener">Lire sur Torah-Box</a>${d.link ? `<a class="btn btn-small ghost" href="${esc(d.link)}" target="_blank" rel="noopener">Résumé Hebcal</a>` : ''}</div>`;
  }
}

async function hydrate() {
  hydrateChabbat();
  if (route().startsWith('#/admin') && (can('animateur'))) {
    if (DEMO && !(S.adm.docs || []).length) loadAdmin(S.adm.tab); else hydrateAdmin();
  }
}

/* ============================== Espace membre ============================== */
function photoField(v = '', name = 'image') {
  const storageReady = !!S.cfgApp?.storageEnabled;
  return `<label class="f">Photo (fichier d’origine — jamais remplacée par une image générée)</label>
    <div class="photo-row">
      ${v ? `<img src="${esc(v)}" alt="" class="photo-prev">` : '<span class="photo-prev empty-prev">?</span>'}
      <div style="flex:1;min-width:190px">
        <input type="file" accept="image/*" data-photo-input="${esc(name)}" ${storageReady ? '' : 'disabled'} aria-label="Téléverser une photo">
        <input name="${esc(name)}" id="f-${esc(name)}" value="${esc(v)}" placeholder="ex. photos/nom.jpg ou URL de l’image" style="margin-top:.35rem">
        <small class="muted">${storageReady ? 'Le téléversement range la photo dans Firebase Storage et remplit le champ. ' : 'Téléversement désactivé : active Storage dans la console Firebase (offre gratuite) ou dépose le fichier dans le dépôt GitHub. '}La photo n’est jamais retouchée ni générée : on peut seulement la recadrer.</small>
      </div>
    </div>`;
}

function pageAccount() {
  if (!S.user) {
    const reg = S.authMode === 'register';
    const cities = shabbatCities().map((c) => c.name);
    return `<div class="auth block tape"><span class="kicker">${reg ? 'Rejoindre' : 'Bon retour'}</span>${cut(reg ? 'Inscription' : 'Connexion', 'mid')}
      ${!CONFIGURED && !DEMO ? '<p class="err">Firebase n’est pas encore configuré (firebase-config.js).</p>' : ''}
      ${DEMO ? `<div class="demo-box"><b>Mode démo</b><p>Choisis un compte de test (aucune donnée réelle) :</p>
        <div class="row"><button class="btn btn-small" type="button" data-act="demosignin" data-v="member">Membre</button><button class="btn btn-small navy" type="button" data-act="demosignin" data-v="admin">Administrateur</button></div></div>` : ''}
      <form data-form="auth">
        ${reg ? `<label class="f" for="a-name">Prénom ou pseudo</label><input id="a-name" name="name" required maxlength="60" autocomplete="nickname">
        <label class="f" for="a-del">Délégation</label><select id="a-del" name="delegation">${cities.map((d) => `<option>${d}</option>`).join('')}</select>` : ''}
        <label class="f" for="a-mail">E-mail</label><input id="a-mail" name="email" type="email" required autocomplete="email">
        <label class="f" for="a-pw">Mot de passe</label><input id="a-pw" name="password" type="password" required minlength="6" autocomplete="${reg ? 'new-password' : 'current-password'}">
        <p class="muted" style="font-size:.82rem">En créant un compte, tu acceptes que ton nom, ton e-mail et tes inscriptions soient enregistrés pour le fonctionnement de l’application. Ils ne sont visibles que par toi et par les responsables du DEJJ.</p>
        <p class="err" id="auth-err" hidden></p>
        <div class="form-actions"><button class="btn" type="submit">${reg ? 'Créer mon compte' : 'Me connecter'}</button>
          <button class="btn ghost" type="button" data-act="authmode">${reg ? 'J’ai déjà un compte' : 'Créer un compte'}</button></div>
        ${!reg ? '<p><button class="btn ghost btn-small" type="button" data-act="resetpw" style="box-shadow:none;padding-left:0">Mot de passe oublié</button></p>' : ''}
      </form></div>`;
  }
  const p = S.profile || {};
  const cards = visibleCards();
  const owned = cards.filter((c) => S.collection.has(c.id));
  const dups = [...S.collection.values()].reduce((s, c) => s + Math.max(0, (Number(c.count) || 1) - 1), 0);
  const pct = cards.length ? Math.round((owned.length / cards.length) * 100) : 0;
  const myEvents = S.events.filter((e) => evStats(e).myStatus === 'yes' || evStats(e).myStatus === 'wait');
  return `<span class="kicker">Mon espace</span>${cut('Mon compte', 'big')}
  <div class="grid g2" style="margin-top:1rem">
    <section class="block">
      <h3 class="serif" style="font-size:1.5rem">${esc(p.name || S.user.email)}</h3>
      <p class="type">${esc(S.user.email)}</p>
      <p><span class="chip ${isAdmin() ? 'o' : ''}">${esc(ROLES[myRole()]?.label || 'Membre')}</span> <span class="chip y">${esc(p.delegation || S.del)}</span>${p.photoURL ? '' : ''}</p>
      <form data-form="profile">
        <label class="f" for="pf-name">Prénom ou pseudo</label><input id="pf-name" name="name" value="${esc(p.name || '')}" required maxlength="60">
        <label class="f" for="pf-del">Délégation</label><select id="pf-del" name="delegation">${shabbatCities().map((c) => `<option ${(p.delegation || S.del) === c.name ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
        ${photoField(p.photoURL || '', 'photoURL')}
        <h4 class="type" style="margin:1rem 0 .3rem">Préférences d’alertes</h4>
        <label class="chk"><input type="checkbox" name="notifyEvents" ${p.notifyEvents !== false ? 'checked' : ''}> Rappels d’événements (J-7, J-3, jour J)</label>
        <label class="chk"><input type="checkbox" name="notifyCards" ${p.notifyCards !== false ? 'checked' : ''}> Nouvelle carte et carte du jour</label>
        <label class="chk"><input type="checkbox" name="notifyContent" ${p.notifyContent !== false ? 'checked' : ''}> Nouveaux contenus (anecdotes, quiz, mot du jour)</label>
        <div class="form-actions"><button class="btn" type="submit">Enregistrer</button><button class="btn navy" type="button" data-act="logout">Se déconnecter</button></div>
      </form>
    </section>
    <section class="block alt">
      <h3 class="serif">Mes statistiques</h3>
      <div class="stats"><div><b>${owned.length}</b><small>cartes découvertes</small></div><div><b>${pct} %</b><small>album complété</small></div><div><b>${dups}</b><small>doublons</small></div><div><b>${myEvents.length}</b><small>événements</small></div></div>
      <h3 class="serif" style="margin-top:1.2rem">Mes inscriptions</h3>
      ${myEvents.length ? myEvents.map((e) => { const st = evStats(e); return `<div class="admin-item"><span><b>${esc(e.title)}</b><br><small class="muted">${esc(fmtDay(toDate(e.date)))} · ${esc(st.myStatus === 'wait' ? `liste d’attente (n°${st.waitRank})` : 'confirmé')}</small></span><button class="btn btn-small navy" data-act="rsvp" data-id="${esc(e.id)}" data-ans="no">Me désister</button></div>`; }).join('') : '<p class="muted">Aucune inscription pour le moment.</p>'}
      <h3 class="serif" style="margin-top:1.2rem">Alertes et installation</h3>
      <p>Les alertes de l’application (rappels, nouveautés) s’affichent dans la cloche. Pour recevoir les alertes sur l’appareil, active-les ici.</p>
      <button class="btn btn-small" data-act="askperm">Activer les alertes locales</button>
      <p class="muted" style="font-size:.85rem">Les notifications push quand l’application est fermée demandent Firebase Cloud Messaging et un serveur d’envoi (gratuit dans l’offre Spark pour un volume normal, voir Admin → Règles &amp; limites).</p>
      <p class="muted">Installer sur téléphone : menu du navigateur → « Ajouter à l’écran d’accueil ».</p>
      <a class="btn btn-small alt" href="#/album">Mon album</a>
    </section>
  </div>`;
}

/* ============================== Notifications ============================== */
function notifications() {
  const list = [];
  if (!S.user) return list;
  const p = S.profile || {};
  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  if (p.notifyEvents !== false) {
    upcomingEvents().forEach((ev) => {
      const st = evStats(ev);
      if (st.myStatus !== 'yes' && st.myStatus !== 'wait') return;
      const d = toDate(ev.date); const e0 = new Date(d); e0.setHours(0, 0, 0, 0);
      const diff = Math.round((e0 - today0) / 864e5);
      const label = { 7: 'J-7', 3: 'J-3', 0: 'Aujourd’hui', 1: 'Demain' }[diff];
      if (label) list.push({ key: `ev-${ev.id}-${diff}`, icon: '📅', text: `${label} : ${ev.title} (${fmtTime(d)})`, href: '#/agenda' });
    });
    const seenEv = Number(localStorage.getItem('dejj-seen-events') || 0);
    if (seenEv) S.events.forEach((ev) => { const c = toDate(ev.createdAt); if (c && c.getTime() > seenEv) list.push({ key: `new-${ev.id}`, icon: '🆕', text: `Nouvel événement : ${ev.title}`, href: '#/agenda' }); });
  }
  if (p.notifyCards !== false) {
    if (canOpenBooster()) list.push({ key: `boost-${localDay()}`, icon: '🎴', text: 'Ton booster gratuit du jour est disponible.', href: '#/boosters' });
    const dc = dailyCard(); if (dc) list.push({ key: `card-${localDay()}-${dc.id}`, icon: '✨', text: `Carte du jour : ${dc.name}`, href: '#/' });
  }
  if (p.notifyContent !== false) {
    const an = anecdoteOfDay(); if (an) list.push({ key: `an-${localDay()}-${an.id}`, icon: '📖', text: `Anecdote du jour : ${an.title}`, href: '#/saga' });
    const w = todayWord(); if (w) list.push({ key: `word-${localDay()}`, icon: '🔤', text: 'Le mot du jour t’attend.', href: '#/' });
  }
  return list;
}
function fireBrowserNotifs() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const done = (() => { try { return JSON.parse(localStorage.getItem('dejj-notified') || '[]'); } catch { return []; } })();
  const fresh = notifications().filter((n) => !done.includes(n.key));
  if (!fresh.length) return;
  fresh.forEach((n) => {
    navigator.serviceWorker?.getRegistration()
      .then((reg) => (reg ? reg.showNotification('DEJJ Community', { body: n.text, icon: 'icon.svg', badge: 'icon.svg', tag: n.key })
        : new Notification('DEJJ Community', { body: n.text, icon: 'icon.svg' })))
      .catch(() => {});
    done.push(n.key);
  });
  localStorage.setItem('dejj-notified', JSON.stringify(done.slice(-120)));
}
async function askPermission() {
  if (!('Notification' in window)) return toast('Les alertes ne sont pas disponibles sur ce navigateur.');
  const r = await Notification.requestPermission();
  toast(r === 'granted' ? 'Alertes activées sur cet appareil.' : 'Alertes refusées.');
  if (r === 'granted') { fireBrowserNotifs(); registerPushToken(); }
  refresh(true);
}
// Push réel (facultatif) : nécessite FCM + clé VAPID + un serveur d'envoi. Voir Admin → Règles & limites.
async function registerPushToken() {
  const vapidKey = S.cfgApp?.vapidKey;
  if (!vapidKey || !app || !S.user || !('serviceWorker' in navigator)) return;
  try {
    const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js');
    const messaging = getMessaging(app);
    const reg = await navigator.serviceWorker.ready;
    const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
    if (token) await setDoc(doc(db, 'users', S.user.uid, 'pushTokens', token.slice(0, 60)), { token, at: serverTimestamp(), ua: navigator.userAgent.slice(0, 120) }, { merge: true });
  } catch (e) { console.warn('push', e?.code || e?.message); }
}

/* ============================== Administration ============================== */
const F = (n, l, t = 'text', o = {}) => ({ n, l, t, ...o });
const CITY_OPTS = () => [['', 'Toutes'], ...shabbatCities().map((c) => [c.name, c.name])];
const TABS = {
  events: {
    label: 'Événements', coll: 'events', min: 'responsable', stamp: true,
    title: (d) => d.title, sub: (d) => (toDate(d.date) ? `${localDay(toDate(d.date))} · ${d.place || ''}${d.capacity ? ` · ${d.capacity} places` : ' · illimité'}` : ''),
    sort: (a, b) => (toDate(b.date) || 0) - (toDate(a.date) || 0),
    fields: [F('title', 'Titre'), F('date', 'Date et heure de début', 'datetime'), F('endDate', 'Fin (facultatif)', 'datetime', { opt: 1 }),
      F('place', 'Lieu'), F('delegation', 'Délégation', 'select', { options: CITY_OPTS(), opt: 1 }),
      F('capacity', 'Places (0 = illimité, liste d’attente possible)', 'number', { def: 0 }),
      F('description', 'Description (visible sur la fiche)', 'textarea'),
      F('image', 'Visuel (photo)', 'photo', { opt: 1 }),
      F('published', 'Publié', 'bool', { def: true })]
  },
  rsvps: { label: 'Inscriptions', coll: 'events', min: 'animateur', special: 'rsvps' },
  news: {
    label: 'Actualités', coll: 'news', min: 'responsable', stamp: true, title: (d) => d.title, sub: (d) => (d.body || '').slice(0, 70),
    sort: (a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0),
    fields: [F('title', 'Titre'), F('body', 'Texte', 'textarea', { rows: 6 }), F('published', 'Publié', 'bool', { def: true })]
  },
  cards: {
    label: 'Cartes', coll: 'cards', min: 'admin', id: { label: 'Identifiant (sans espace, ex. animateur-boucles)', from: 'name' },
    title: (d) => d.name, sub: (d) => `${RAR[d.rarity]?.label || ''} · ${d.collection || ''}${d.published === false ? ' · masquée' : ''}${d.inPack === false ? ' · hors booster' : ''}`,
    sort: (a, b) => (a.order ?? 999) - (b.order ?? 999),
    fields: [F('name', 'Nom (à confirmer par l’auteur de la fiche)'), F('nickname', 'Surnom ou totem', 'text', { opt: 1 }),
      F('role', 'Fonction', 'text', { opt: 1, ph: 'ex. Animatrice, Vice-présidente, Fondateur' }),
      F('category', 'Catégorie', 'select', { options: [['', '—'], ...Object.entries(CATS)] }),
      F('anecdote', '1 · Anecdote (mise en avant sur la carte)', 'textarea', { rows: 4, required: true }),
      F('career', '2 · Parcours (une étape par ligne, ex. 2019 : Animatrice)', 'lines', { rows: 5, opt: 1 }),
      F('joinYear', '3 · Année d’arrivée au DEJJ (uniquement si confirmée)', 'number', { opt: 1, ok: 1 }),
      F('years', 'Période affichée si année inconnue (ex. 1921-2007)', 'text', { opt: 1 }),
      F('quote', 'Citation exacte (facultatif)', 'textarea', { rows: 2, opt: 1 }), F('quoteBy', 'Auteur de la citation', 'text', { opt: 1 }),
      F('rarity', 'Rareté', 'select', { options: Object.entries(RAR).map(([k, v]) => [k, v.label]) }),
      F('collection', 'Collection (ex. Légendes du DEJJ, Animateurs, Souvenirs)', 'text', { def: 'Animateurs' }),
      F('order', 'Ordre d’affichage dans la collection', 'number', { opt: 1, ok: 1 }),
      F('image', 'Photo d’origine', 'photo', { opt: 1 }),
      F('imagePos', 'Cadrage (ex. 50% 22%)', 'text', { opt: 1, ph: '50% 22%' }), F('imageZoom', 'Zoom (1 = normal, 1.3 = rapproché)', 'number', { opt: 1, ok: 1, step: '0.05' }),
      F('sources', 'Source / vérification (lien La Saga, autorisation photo…)', 'text', { opt: 1 }),
      F('historical', 'Carte historique (La Saga)', 'bool', { def: false }),
      F('toVerify', 'Marquer « à valider » (visible en admin)', 'bool', { def: false }),
      F('published', 'Publiée', 'bool', { def: true }),
      F('inPack', 'Tirable dans les boosters', 'bool', { def: true })]
  },
  words: {
    label: 'Mots du jour', coll: 'words', min: 'responsable', id: { label: 'Date (AAAA-MM-JJ)', date: true },
    title: (d) => d.word, sub: (d) => d.id, sort: (a, b) => b.id.localeCompare(a.id), planning: 'words',
    fields: [F('word', 'Mot'), F('hint', 'Indice', 'text', { opt: 1 }), F('definition', 'Définition (révélée après la réponse)', 'textarea')]
  },
  daily: {
    label: 'Carte du jour', coll: 'daily', min: 'responsable', id: { label: 'Date (AAAA-MM-JJ)', date: true },
    title: (d) => cardById(d.cardId)?.name || d.cardId, sub: (d) => d.id, sort: (a, b) => b.id.localeCompare(a.id), planning: 'daily',
    fields: [F('cardId', 'Carte à publier', 'cardselect')],
    note: 'Sans programmation, la carte du jour tourne automatiquement dans la collection (une carte par jour).'
  },
  anecdotes: {
    label: 'Anecdotes', coll: 'anecdotes', min: 'responsable', stamp: true, title: (d) => d.title, sub: (d) => `${d.year || ''}${d.date ? ` · publiée le ${d.date}` : ''}${d.published === false ? ' · masquée' : ''}`,
    sort: (a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0),
    fields: [F('title', 'Titre'), F('year', 'Année ou période', 'text', { opt: 1 }), F('date', 'Programmer pour le (AAAA-MM-JJ, facultatif)', 'text', { opt: 1 }),
      F('body', 'Texte', 'textarea', { rows: 6 }), F('published', 'Publiée', 'bool', { def: true })]
  },
  quiz: {
    label: 'Quiz', coll: 'quiz', min: 'responsable', stamp: true, title: (d) => d.question, sub: (d) => (d.options || [])[d.answer] || '',
    fields: [F('question', 'Question'), F('options', 'Réponses possibles (une par ligne)', 'lines', { rows: 4 }),
      F('answer', 'N° de la bonne réponse (1, 2, 3…)', 'number', { off: -1, def: 1, ok: 1 }), F('published', 'Publié', 'bool', { def: true })]
  },
  parasha: {
    label: 'Paracha', coll: 'parashot', min: 'responsable', id: { label: 'Nom de la paracha (ex. Vayera)', norm: true, from: 'name' },
    title: (d) => d.name, sub: (d) => (d.story || '').slice(0, 70),
    fields: [F('name', 'Nom (comme affiché par Hebcal : ex. Vayishlach)'), F('story', 'Explication de la paracha', 'textarea', { rows: 12 }),
      F('source', 'Source', 'text', { opt: 1 }), F('published', 'Publiée', 'bool', { def: true })]
  },
  members: { label: 'Membres & rôles', coll: 'users', min: 'admin', special: 'members' },
  config: { label: 'Boosters & réglages', coll: 'config', min: 'admin', special: 'config' },
  help: { label: 'Règles & limites', coll: 'config', min: 'animateur', special: 'help' }
};

function pageAdmin() {
  if (!can('animateur')) {
    return `<span class="kicker">Accès réservé</span>${cut('Administration', 'big')}<div class="block" style="margin-top:1rem"><p>Cette section est réservée aux animateurs, responsables et administrateurs. ${S.user ? 'Ton compte n’a pas encore ce rôle.' : ''}</p>${!S.user ? '<a class="btn" href="#/compte">Connexion</a>' : ''}</div>`;
  }
  const avail = Object.entries(TABS).filter(([, v]) => can(v.min));
  if (!avail.some(([k]) => k === S.adm.tab)) S.adm.tab = avail[0][0];
  const cfg = TABS[S.adm.tab];
  const tabs = `<div class="tabs">${avail.map(([k, v]) => `<button class="${S.adm.tab === k ? 'on' : ''}" data-act="admtab" data-v="${k}">${v.label}</button>`).join('')}</div>`;
  let body = '<p>Chargement…</p>';
  if (cfg.special === 'members') body = adminMembers();
  else if (cfg.special === 'config') body = adminConfig();
  else if (cfg.special === 'help') body = adminHelp();
  else if (cfg.special === 'rsvps') body = adminRsvps();
  else body = adminCrud(cfg);
  return `<span class="kicker">Espace sécurisé</span>${cut('Administration', 'big')}<p class="muted">Rôle : <b>${esc(ROLES[myRole()]?.label || 'Membre')}</b> · ${esc(ROLES[myRole()]?.desc || '')}</p>${tabs}${body}`;
}

function fieldValue(f, ed) {
  const d = ed?.data;
  if (!d || d[f.n] === undefined) return f.def ?? '';
  const v = d[f.n];
  if (f.t === 'datetime') return toDate(v) ? toLocalInput(toDate(v)) : '';
  if (f.t === 'lines' || f.t === 'cardselect') return f.t === 'lines' ? (v || []).join('\n') : v;
  if (f.off) return Number(v) - f.off;
  if (f.t === 'bool') return v !== false;
  return v;
}

function fieldHtml(f, ed) {
  const v = fieldValue(f, ed); const id = 'f-' + f.n;
  const req = f.required ? 'required' : '';
  let input;
  if (f.t === 'textarea') input = `<textarea id="${id}" name="${f.n}" rows="${f.rows || 4}" ${req}>${esc(v)}</textarea>`;
  else if (f.t === 'lines') input = `<textarea id="${id}" name="${f.n}" rows="${f.rows || 4}" ${req}>${esc(v)}</textarea>`;
  else if (f.t === 'select') input = `<select id="${id}" name="${f.n}">${f.options.map(([k, l]) => `<option value="${esc(k)}" ${v === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  else if (f.t === 'cardselect') input = `<select id="${id}" name="${f.n}">${visibleCards().map((c) => `<option value="${esc(c.id)}" ${v === c.id ? 'selected' : ''}>${esc(c.name)} (${RAR[c.rarity]?.label})</option>`).join('')}</select>`;
  else if (f.t === 'photo') input = photoField(v, f.n);
  else if (f.t === 'bool') input = `<label class="chk"><input type="checkbox" id="${id}" name="${f.n}" ${v !== false ? 'checked' : ''}> ${esc(f.l)}</label>`;
  else if (f.t === 'datetime') input = `<input id="${id}" name="${f.n}" type="datetime-local" value="${esc(v)}" ${req}>`;
  else if (f.t === 'number') input = `<input id="${id}" name="${f.n}" type="number" ${f.ok ? '' : 'min="0"'} step="${f.step || '1'}" value="${esc(v)}" ${req}>`;
  else input = `<input id="${id}" name="${f.n}" value="${esc(v)}" ${req} placeholder="${esc(f.ph || '')}">`;
  if (f.t === 'bool') return input;
  return `<label class="f" for="${id}">${esc(f.l)}</label>${input}`;
}

function planningGrid(kind) {
  const base = S.adm.planMonth instanceof Date ? S.adm.planMonth : new Date();
  const y = base.getFullYear(), m = base.getMonth();
  const first = new Date(y, m, 1);
  const start = (first.getDay() + 6) % 7; // lundi en premier
  const days = new Date(y, m + 1, 0).getDate();
  const docs = S.adm.docs || [];
  const map = new Map();
  docs.forEach((d) => {
    const key = kind === 'daily' ? d.id : d.id;
    if (!map.has(key)) map.set(key, d);
  });
  let cells = '';
  for (let i = 0; i < start; i++) cells += '<span class="plan-day empty"></span>';
  for (let d = 1; d <= days; d++) {
    const key = `${y}-${pad(m + 1)}-${pad(d)}`;
    const has = map.has(key) ? String(kind === 'daily' ? (cardById(map.get(key).cardId)?.name || 'carte') : (map.get(key).word || '')) : '';
    cells += `<button class="plan-day ${has ? 'has' : ''} ${key === localDay() ? 'today' : ''}" data-act="planpick" data-kind="${kind}" data-v="${key}" title="${esc(has || 'Ajouter')}"><b>${d}</b>${has ? `<small>${esc(has.slice(0, 12))}</small>` : ''}</button>`;
  }
  return `<div class="plan"><div class="plan-head"><button class="btn btn-small ghost" data-act="planprev">←</button><b>${esc(cap(base.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })))}</b><button class="btn btn-small ghost" data-act="plannext">→</button></div>
    <div class="plan-grid"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>${cells}</div></div>`;
}

function adminCrud(cfg) {
  const ed = S.adm.edit;
  const idField = cfg.id ? `<label class="f" for="f-docid">${cfg.id.label}</label><input id="f-docid" name="__id" ${cfg.id.date ? 'type="date"' : ''} value="${esc(ed?.id || (cfg.id.date ? localDay() : ''))}" ${ed ? 'readonly' : ''} placeholder="${cfg.id.from ? 'Laisser vide pour le générer depuis le nom' : ''}" ${cfg.id.from || cfg.id.date ? '' : 'required'}>` : '';
  const q = S.adm.q ? norm(S.adm.q) : '';
  const docs = (S.adm.docs || []).filter((d) => !q || norm(`${cfg.title(d)} ${cfg.sub(d)}`).includes(q));
  const form = `<form class="block" data-form="admin">${ed ? '<span class="chip o">Modification</span>' : '<span class="chip y">Nouveau</span>'}
    ${cfg.note ? `<p class="muted">${esc(cfg.note)}</p>` : ''}
    ${idField}${cfg.fields.map((f) => fieldHtml(f, ed)).join('')}
    <div class="form-actions"><button class="btn" type="submit">${ed ? 'Enregistrer' : 'Ajouter'}</button>${ed ? '<button type="button" class="btn ghost" data-act="admcancel">Annuler</button>' : ''}${['cards', 'words', 'anecdotes', 'quiz'].includes(cfg.coll) ? `<button type="button" class="btn alt" data-act="seedextra" data-coll="${cfg.coll}">Importer le contenu de départ</button>` : ''}</div></form>`;
  const list = `<div class="admin-tools"><input id="adm-q" placeholder="Filtrer…" value="${esc(S.adm.q)}"><span class="muted">${docs.length} élément${docs.length > 1 ? 's' : ''}</span></div>
    <div class="admin-list">${docs.map((d) => `<div class="admin-item"><span><b>${esc(cfg.title(d) || d.id)}</b><br><small class="muted">${esc(cfg.sub(d) || '')}</small>${d.toVerify ? ' <span class="chip y">à valider</span>' : ''}${d.published === false ? ' <span class="chip">masqué</span>' : ''}</span>
      <span class="row">${cfg.coll === 'events' ? `<button class="btn btn-small alt" data-act="csv" data-id="${esc(d.id)}">CSV</button><button class="btn btn-small alt" data-act="xls" data-id="${esc(d.id)}">Excel</button>` : ''}${cfg.coll === 'cards' ? `<button class="btn btn-small alt" data-act="cardpreview" data-id="${esc(d.id)}">Aperçu</button>` : ''}<button class="btn btn-small navy" data-act="admedit" data-id="${esc(d.id)}">Modifier</button><button class="btn btn-small danger" data-act="admdel" data-id="${esc(d.id)}">Supprimer</button></span></div>`).join('') || '<div class="empty">Rien pour le moment.</div>'}</div>`;
  return `${cfg.planning ? planningGrid(cfg.planning) : ''}${form}${list}`;
}

function adminMembers() {
  const q = norm(S.adm.q);
  const users = (S.adm.docs || []).filter((u) => !q || norm(`${u.name} ${u.email} ${u.delegation}`).includes(q));
  const count = (r) => (S.adm.docs || []).filter((u) => (u.role || 'member') === r).length;
  return `<div class="block"><h3 class="serif">Rôles et autorisations</h3>
    <p class="muted">Les rôles sont appliqués par les règles Firestore, pas seulement par l’interface : masquer un bouton ne suffit pas.</p>
    <div class="grid g2" style="margin-top:.6rem">${Object.entries(ROLES).map(([k, v]) => `<div class="role-card"><b>${esc(v.label)}</b> <span class="chip">${count(k)}</span><p>${esc(v.desc)}</p></div>`).join('')}</div></div>
    <div class="admin-tools"><input id="adm-q" placeholder="Rechercher un membre…" value="${esc(S.adm.q)}"><span class="muted">${users.length} membre${users.length > 1 ? 's' : ''}</span></div>
    <div class="admin-list">${users.map((u) => `<div class="admin-item"><span><b>${esc(u.name || '(sans nom)')}</b> · ${esc(u.email || '')} · ${esc(u.delegation || '')} ${u.lastBoosterDay ? `<small class="muted">· dernier booster : ${esc(String(u.lastBoosterDay))}</small>` : ''}</span>
      <span class="row"><select data-act="setrole" data-id="${esc(u.id)}" ${u.id === S.user?.uid ? 'disabled' : ''} aria-label="Rôle de ${esc(u.name || u.id)}">
        ${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${(u.role || 'member') === k ? 'selected' : ''}>${esc(v.label)}</option>`).join('')}
      </select></span></div>`).join('') || '<div class="empty">Aucun membre.</div>'}</div>`;
}

function adminRsvps() {
  const evs = [...S.events].sort((a, b) => (toDate(b.date) || 0) - (toDate(a.date) || 0));
  return `<div class="block"><h3 class="serif">Listes de participants</h3>
    <p class="muted">Données personnelles : visibles uniquement par les animateurs, responsables et administrateurs. Export réservé à un usage interne (émargement, transport, intendance) — ne pas diffuser.</p>
    ${evs.map((e) => { const st = evStats(e); return `<div class="admin-item"><span><b>${esc(e.title)}</b><br><small class="muted">${esc(fmtDay(toDate(e.date)))} · ${plural(st.confirmed.length, 'inscrit')}${st.waitlist.length ? ` · ${st.waitlist.length} en attente` : ''}${st.no.length ? ` · ${st.no.length} absent(s)` : ''}</small></span>
      <span class="row"><button class="btn btn-small alt" data-act="csv" data-id="${esc(e.id)}">CSV</button><button class="btn btn-small alt" data-act="xls" data-id="${esc(e.id)}">Excel</button><button class="btn btn-small navy" data-act="rsvpview" data-id="${esc(e.id)}">Voir la liste</button></span></div>`; }).join('') || '<div class="empty">Aucun événement.</div>'}</div>`;
}

function adminConfig() {
  const cfg = boosterCfg();
  const ch = S.cfgChabbat || {};
  const ap = S.cfgApp || {};
  const cities = shabbatCities();
  return `<form class="block" data-form="booster">
    <span class="kicker">Boosters</span><h3 class="serif">Probabilités et règles</h3>
    <p class="muted">Par défaut : 60 % commune, 28 % rare, 9 % épique, 3 % légendaire. Le total n’a pas besoin de faire exactement 100 : les valeurs sont proportionnelles.</p>
    <div class="grid g2">
      <div><h4 class="type">Par carte</h4>${Object.entries(RAR).map(([k, v]) => `<label class="f" for="pc-${k}">${v.label} (%)</label><input id="pc-${k}" name="perCard_${k}" type="number" min="0" step="0.1" value="${esc(cfg.perCard[k])}">`).join('')}</div>
      <div><h4 class="type">Par booster (si mode « un tirage par booster »)</h4>${Object.entries(RAR).map(([k, v]) => `<label class="f" for="pk-${k}">${v.label} (%)</label><input id="pk-${k}" name="packOdds_${k}" type="number" min="0" step="0.1" value="${esc(cfg.packOdds[k])}">`).join('')}</div>
    </div>
    <label class="f" for="b-mode">Mode d’application des probabilités</label>
    <select id="b-mode" name="mode"><option value="card" ${cfg.mode === 'card' ? 'selected' : ''}>Chaque carte du booster (recommandé)</option><option value="pack" ${cfg.mode === 'pack' ? 'selected' : ''}>Un tirage global par booster</option></select>
    <label class="f" for="b-size">Nombre de cartes par booster</label><input id="b-size" name="packSize" type="number" min="1" max="20" value="${esc(cfg.packSize)}">
    <label class="chk"><input type="checkbox" name="minRareLast" ${cfg.minRareLast ? 'checked' : ''}> La dernière carte est au moins rare</label>
    <label class="chk"><input type="checkbox" name="allowDuplicates" ${cfg.allowDuplicates !== false ? 'checked' : ''}> Autoriser les doublons</label>
    <div class="form-actions"><button class="btn" type="submit">Enregistrer les probabilités</button></div>
  </form>
  <form class="block" data-form="chabbat">
    <span class="kicker">Chabbat</span><h3 class="serif">Villes et paramètres</h3>
    <p class="muted">Source Hebcal (gratuite, sans clé). Les horaires suivent le fuseau Europe/Paris et les changements d’heure automatiquement.</p>
    ${cities.map((c, i) => `<div class="row" style="align-items:end"><div style="flex:1"><label class="f" for="city-${i}">Ville ${i + 1}</label><input id="city-${i}" name="city_${i}" value="${esc(c.name)}"></div><div style="flex:1"><label class="f" for="geo-${i}">Identifiant GeoNames</label><input id="geo-${i}" name="geo_${i}" value="${esc(c.geonameid)}"></div></div>`).join('')}
    <label class="f" for="ch-b">Minutes avant le coucher du soleil pour l’allumage (0 = comme Hebcal)</label><input id="ch-b" name="candleMinutes" type="number" min="0" max="120" value="${esc(ch.candleMinutes || 0)}">
    <label class="chk"><input type="checkbox" name="havdalah" ${ch.havdalah !== 'off' ? 'checked' : ''}> Afficher la Havdala</label>
    <div class="form-actions"><button class="btn" type="submit">Enregistrer Chabbat</button></div>
  </form>
  <form class="block" data-form="appconfig">
    <span class="kicker">Application</span><h3 class="serif">Réglages généraux</h3>
    <label class="f" for="ap-title">Message d’accueil (facultatif)</label><input id="ap-title" name="welcome" value="${esc(ap.welcome || '')}">
    <label class="f" for="ap-vapid">Clé VAPID (notifications push, facultatif)</label><input id="ap-vapid" name="vapidKey" value="${esc(ap.vapidKey || '')}" placeholder="BExxxxxxxxx… (Firebase → Cloud Messaging → Web Push)">
    <label class="chk"><input type="checkbox" name="storageEnabled" ${ap.storageEnabled ? 'checked' : ''}> Téléversement des photos via Firebase Storage</label>
    <div class="form-actions"><button class="btn" type="submit">Enregistrer</button></div>
  </form>`;
}

function adminHelp() {
  return `<div class="block"><span class="kicker">Transparence</span><h3 class="serif">Ce qui est gratuit, ce qui ne l’est pas</h3>
  <ul class="help">
    <li><b>GitHub Pages</b> — hébergement : <b>0 €</b> (site public).</li>
    <li><b>Firebase Authentication</b> (e-mail/mot de passe), <b>Cloud Firestore</b>, <b>Security Rules</b> : offre <b>Spark gratuite</b> dans les quotas (50 000 lectures et 20 000 écritures par jour, 1 Gio stocké). Une communauté de quelques centaines de membres reste largement dedans.</li>
    <li><b>Firebase Storage</b> (photos téléversées) : gratuit dans l’offre Spark avec un quota limité ; au-delà il faut passer au plan Blaze (paiement à l’usage). Solution 0 € garantie : déposer les photos dans le dépôt GitHub.</li>
    <li><b>Hebcal</b> (horaires de Chabbat, paracha) : API <b>gratuite</b>, sans clé.</li>
    <li><b>Notifications push</b> (application fermée) : Firebase Cloud Messaging est gratuit, mais l’envoi programmé (J-7, J-3, jour J) demande <b>Cloud Functions</b> — plan Blaze obligatoire, avec un coût généralement de quelques centimes à quelques euros par mois selon le volume — ou un petit serveur. <b>Les alertes internes (cloche) et les notifications locales fonctionnent sans serveur et à 0 €.</b></li>
    <li><b>Booster</b> : le tirage et le quota quotidien sont vérifiés côté serveur (transaction + journal <code>boosters</code> + règles Firestore), ce qui empêche une seconde ouverture et le rejeu sur un autre appareil. Reste une limite honnête : un utilisateur malveillant qui connaît son propre navigateur peut inspecter le code du tirage ; la valeur marchande étant nulle, ce n’est pas un risque réel. Pour un tirage « aveugle » total, il faudrait une Cloud Function.</li>
    <li><b>Export Excel</b> : fichier .xls (tableur HTML) généré dans le navigateur, ouvert par Excel, LibreOffice et Google Sheets. Aucune bibliothèque payante.</li>
    <li><b>Photos</b> : aucune image générée par IA n’est utilisée pour représenter une personne ; l’écusson DEJJ est un visuel décoratif de la collection, la photo réelle de chaque personne reste visible et prioritaire.</li>
  </ul></div>
  <div class="block" style="margin-top:1rem"><span class="kicker">Données personnelles</span><h3 class="serif">Bonnes pratiques</h3>
  <ul class="help">
    <li>Les listes de participants (noms) sont lisibles uniquement par les animateurs et au-dessus : les autres membres ne voient que les compteurs.</li>
    <li>Chaque membre ne peut lire que son propre profil et sa propre collection.</li>
    <li>Les rôles sont stockés dans <code>users/{uid}.role</code> et contrôlés par les règles Firestore.</li>
    <li>Avant diffusion, valider les cartes historiques (sources La Saga) et les droits sur les photos.</li>
  </ul></div>`;
}

/* ---------- Chargement de l'admin ---------- */
async function loadAdmin(tab = S.adm.tab) {
  const cfg = TABS[tab];
  if (!db || !cfg || !can(cfg.min)) return;
  if (tab === 'config' || tab === 'help') {
    S.adm = { ...S.adm, tab, docs: [S.cfgBooster, S.cfgChabbat, S.cfgApp], edit: null };
    return refresh(true);
  }
  if (DEMO) {
    if (!D) demoLoad();
    let docs = [];
    if (cfg.special === 'members') docs = Object.entries(D.users).map(([id, v]) => ({ id, ...v }));
    else docs = Object.entries(D[cfg.coll] || {}).map(([id, v]) => ({ id, ...v }));
    if (cfg.sort) docs.sort(cfg.sort);
    S.adm = { ...S.adm, tab, docs, edit: null };
    return refresh(true);
  }
  try {
    let docs = [];
    if (cfg.special === 'members') {
      const snap = await getDocs(collection(db, 'users'));
      docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => roleRank(b.role) - roleRank(a.role) || String(a.name || '').localeCompare(String(b.name || ''), 'fr'));
    } else {
      const snap = await getDocs(collection(db, cfg.coll));
      docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (cfg.sort) docs.sort(cfg.sort);
    }
    S.adm = { ...S.adm, tab, docs, edit: null };
  } catch (e) {
    console.error(e);
    toast('Lecture impossible : vérifie les règles Firestore. ' + (e.code || ''));
    S.adm = { ...S.adm, tab, docs: [], edit: null };
  }
  if (route().startsWith('#/admin')) refresh(true);
}
function hydrateAdmin() { if (can('animateur') && !(S.adm.docs || []).length) loadAdmin(S.adm.tab); }

async function loadRsvpNames(ids) {
  if (DEMO || !db || !canSeeRsvps() || !ids?.length) return;
  for (const evId of ids) {
    if (S.rsvpNames[evId]) continue;
    try {
      const snap = await getDocs(collection(db, 'events', evId, 'names'));
      S.rsvpNames[evId] = new Map(snap.docs.map((d) => [d.id, d.data()]));
    } catch (e) { /* droits : animateur requis */ }
  }
  refresh();
}

/* ---------- Écritures admin ---------- */
async function saveAdmin(form) {
  const cfg = TABS[S.adm.tab]; const fd = new FormData(form); const data = {};
  for (const f of cfg.fields) {
    if (f.t === 'photo') { data[f.n] = String(fd.get(f.n) || '').trim(); continue; }
    let v = fd.get(f.n);
    if (f.t === 'bool') v = fd.get(f.n) === 'on';
    else if (f.t === 'number') v = v === null || v === '' ? null : Number(v) + (f.off || 0);
    else if (f.t === 'datetime') v = v ? new Date(v) : null; // le SDK Firestore convertit les Date en Timestamp
    else if (f.t === 'lines') v = String(v || '').split('\n').map((s) => s.trim()).filter(Boolean);
    else v = String(v ?? '').trim();
    data[f.n] = v;
  }
  if (S.adm.tab === 'quiz') {
    if (!Array.isArray(data.options) || data.options.length < 2) return toast('Il faut au moins deux réponses possibles.');
    if (data.answer < 0 || data.answer >= data.options.length) return toast('Numéro de bonne réponse invalide.');
  }
  if (S.adm.tab === 'cards' && !data.anecdote) return toast('L’anecdote est obligatoire : elle doit apparaître avant le parcours sur la carte.');
  let id = S.adm.edit?.id;
  if (!id) {
    if (cfg.id) {
      let raw = String(fd.get('__id') || '').trim();
      if (!raw && cfg.id.from) raw = data[cfg.id.from];
      id = cfg.id.date ? raw : cfg.id.norm ? norm(raw) : slug(raw);
      if (!id) return toast('Identifiant manquant.');
    } else id = DEMO ? `demo-${Date.now().toString(36)}` : doc(collection(db, cfg.coll)).id;
    if (cfg.stamp) data.createdAt = DEMO ? new Date().toISOString() : serverTimestamp();
  }
  if (DEMO) {
    const store = cfg.coll === 'users' ? D.users : (D[cfg.coll] = D[cfg.coll] || {});
    const plain = { ...data };
    // En mode démo, les dates sont stockées en texte ISO (pas de Timestamp Firestore).
    cfg.fields.forEach((f) => { if (f.t === 'datetime') plain[f.n] = data[f.n] instanceof Date ? data[f.n].toISOString() : (data[f.n] || null); });
    store[id] = { ...(store[id] || {}), ...plain, ...(cfg.stamp && !S.adm.edit ? { createdAt: new Date().toISOString() } : {}) };
    demoPersist(); startDemoData(); await loadAdmin();
    return toast('Enregistré (mode démo).');
  }
  try {
    await setDoc(doc(db, cfg.coll, id), data, { merge: true });
    toast('Enregistré.');
    await loadAdmin();
  } catch (e) { console.error(e); toast('Échec de l’enregistrement : ' + (e.code || e.message)); }
}

const participantRows = (ev) => {
  const names = S.rsvpNames[ev.id];
  const rows = [['Nom', 'Statut', 'Inscrit le']];
  if (!names || !names.size) return rows;
  const c = evCounts(ev);
  const list = [...names.values()].filter((r) => r && r.name);
  const dt = (r) => (r.createdAt?.toDate ? r.createdAt.toDate().toLocaleString('fr-FR') : (r.at?.toDate ? r.at.toDate().toLocaleString('fr-FR') : ''));
  const yes = list.filter((r) => r.answer !== 'wait' && r.answer !== 'no');
  const wait = list.filter((r) => r.answer === 'wait');
  const no = list.filter((r) => r.answer === 'no');
  yes.forEach((r, i) => rows.push([r.name, c.capN && i >= c.capN ? `Liste d’attente (${i - c.capN + 1})` : 'Confirmé', dt(r)]));
  wait.forEach((r, i) => rows.push([r.name, `Liste d’attente (${Math.max(0, c.yes - c.capN) + i + 1})`, dt(r)]));
  no.forEach((r) => rows.push([r.name, 'Ne participe pas', dt(r)]));
  return rows;
};
const safeFile = (s) => slug(s).slice(0, 60) || 'export';

async function exportCsv(eventId) {
  const ev = S.events.find((e) => e.id === eventId); if (!ev) return;
  // Les noms sont protégés : on les charge avant l'export si l'animateur y a droit.
  if (!DEMO && canSeeRsvps() && !S.rsvpNames[eventId]) await loadRsvpNames([eventId]);
  const rows = participantRows(ev);
  if (rows.length < 2) return toast('Aucun nom à exporter pour cet événement (aucune inscription nominative accessible).');
  const q = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['\ufeff' + rows.map((r) => r.map(q).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `participants-${safeFile(ev.title)}.csv`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Export CSV généré. Données à usage interne uniquement.');
}
async function exportXls(eventId) {
  const ev = S.events.find((e) => e.id === eventId); if (!ev) return;
  if (!DEMO && canSeeRsvps() && !S.rsvpNames[eventId]) await loadRsvpNames([eventId]);
  const rows = participantRows(ev);
  if (rows.length < 2) return toast('Aucun nom à exporter pour cet événement.');
  const th = rows[0].map((h) => `<th style="background:#0f2a5c;color:#fff;padding:6px">${esc(h)}</th>`).join('');
  const tr = rows.slice(1).map((r) => `<tr>${r.map((c) => `<td style="padding:5px">${esc(c)}</td>`).join('')}</tr>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body><h2>${esc(ev.title)}</h2><p>${esc(fmtDay(toDate(ev.date)))} · ${esc(ev.place || '')}</p>
    <table border="1" cellspacing="0"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
    <p style="font-size:11px;color:#666">Export DEJJ Community — données personnelles, diffusion interdite.</p></body></html>`;
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `participants-${safeFile(ev.title)}.xls`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Export Excel généré.');
}

/* ---------- Inscription aux événements ---------- */
async function setRsvp(eventId, answer) {
  if (!S.user || (!db && !DEMO) || S.rsvpBusy) return;
  const ev = S.events.find((e) => e.id === eventId); if (!ev) return;
  const st = evStats(ev);
  S.rsvpBusy = true;
  if (DEMO) {
    const uid = S.user.uid;
    const prev = st.mine?.answer || null;
    D.rsvps[eventId] = D.rsvps[eventId] || {}; D.names[eventId] = D.names[eventId] || {};
    D.rsvpCounts[eventId] = D.rsvpCounts[eventId] || { yes: 0, no: 0, wait: 0 };
    const c = D.rsvpCounts[eventId];
    const dec = (k) => { if (k && c[k]) c[k] = Math.max(0, c[k] - 1); };
    if (answer === 'no') {
      if (D.myRsvps?.[uid]) delete D.myRsvps[uid][eventId];
      if (Number(ev.capacity) > 0) { delete D.rsvps[eventId][uid]; delete D.names[eventId][uid]; dec(prev); }
      else { D.rsvps[eventId][uid] = { eventId, uid, answer: 'no' }; D.names[eventId][uid] = { name: S.profile?.name || '', answer: 'no' }; dec(prev); c.no = (c.no || 0) + (prev === 'no' ? 0 : 1); }
      D.users[uid].lastRsvp = Date.now();
      demoPersist(); startDemoData(); S.rsvpBusy = false;
      return toast('Désistement enregistré.');
    }
    D.rsvps[eventId][uid] = { eventId, uid, answer };
    D.names[eventId][uid] = { name: S.profile?.name || '', answer };
    D.myRsvps = D.myRsvps || {};
    D.myRsvps[uid] = D.myRsvps[uid] || {};
    D.myRsvps[uid][eventId] = { eventId, answer };
    dec(prev); c[answer] = (c[answer] || 0) + 1;
    demoPersist(); startDemoData(); S.rsvpBusy = false;
    return toast(answer === 'yes' ? 'Inscription confirmée.' : 'Tu es sur la liste d’attente.');
  }
  try {
    const uid = S.user.uid;
    const ref = doc(db, 'events', eventId, 'rsvps', uid);
    const nameRef = doc(db, 'events', eventId, 'names', uid);
    const statRef = doc(db, 'events', eventId, 'stats', 'public');
    const mineRef = doc(db, 'users', uid, 'rsvps', eventId);
    const prev = st.mine?.answer || null;
    if (answer === 'no') {
      // Événement limité : se désister libère la place. Événement libre : on enregistre le « non ».
      const batch = writeBatch(db);
      if (Number(ev.capacity) > 0) {
        batch.delete(ref); batch.delete(nameRef); batch.delete(mineRef);
        batch.set(statRef, { yes: increment(prev === 'yes' ? -1 : 0), wait: increment(prev === 'wait' ? -1 : 0) }, { merge: true });
      } else {
        batch.set(ref, { eventId, uid, answer: 'no', createdAt: serverTimestamp() });
        batch.set(nameRef, { name: S.profile?.name || '', answer: 'no', createdAt: serverTimestamp() });
        batch.set(mineRef, { eventId, answer: 'no', createdAt: serverTimestamp() });
        batch.set(statRef, {
          yes: increment(prev === 'yes' ? -1 : 0), no: increment(prev === 'no' ? 0 : 1),
          wait: increment(prev === 'wait' ? -1 : 0)
        }, { merge: true });
      }
      await batch.commit();
      toast('Désistement enregistré.' + (Number(ev.capacity) > 0 && prev === 'yes' ? ' La place est libérée pour la liste d’attente.' : ''));
    } else if (prev === answer) {
      toast('C’est déjà enregistré.');
    } else {
      const batch = writeBatch(db);
      batch.set(ref, { eventId, uid, answer, createdAt: serverTimestamp() });
      batch.set(nameRef, { name: S.profile?.name || '', answer, createdAt: serverTimestamp() });
      batch.set(mineRef, { eventId, answer, createdAt: serverTimestamp() });
      batch.set(statRef, {
        yes: increment(answer === 'yes' ? 1 : 0),
        wait: increment(answer === 'wait' ? 1 : 0),
        no: increment(prev === 'no' ? -1 : 0)
      }, { merge: true });
      await batch.commit();
      toast(answer === 'yes' ? 'Inscription confirmée.' : 'Tu es sur la liste d’attente.');
    }
  } catch (e) { console.error(e); toast('Action impossible : ' + (e.code || e.message)); }
  S.rsvpBusy = false;
}

/* ---------- Photos : compression légère puis téléversement (facultatif) ---------- */
async function uploadPhoto(file, fieldName) {
  if (!file || !S.user) return;
  if (DEMO) {
    const url = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(''); fr.readAsDataURL(file); });
    const input = $(`input[name="${fieldName}"]`);
    if (input && url) { input.value = url; const prev = input.closest('.photo-row')?.querySelector('.photo-prev'); if (prev) prev.outerHTML = `<img src="${esc(url)}" alt="" class="photo-prev">`; }
    return toast('Photo chargée en mode démo (aucun envoi).');
  }
  if (!S.cfgApp?.storageEnabled) return toast('Téléversement désactivé : colle un chemin de fichier ou active Firebase Storage (Admin → Boosters & réglages).');
  toast('Préparation de la photo…');
  let blob = file;
  try {
    blob = await new Promise((resolve) => {
      const img = new Image(); const url = URL.createObjectURL(file);
      img.onload = () => {
        const max = 1100; const scale = Math.min(1, max / Math.max(img.width, img.height));
        const cv = document.createElement('canvas'); cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        URL.revokeObjectURL(url);
        cv.toBlob((b) => resolve(b || file), 'image/jpeg', 0.86);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  } catch { blob = file; }
  try {
    const { getStorage, ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js');
    const storage = getStorage(app);
    const path = `photos/${Date.now()}-${slug(file.name.replace(/\.[^.]+$/, '')).slice(0, 40)}.jpg`;
    const r = ref(storage, path);
    await uploadBytes(r, blob, { contentType: 'image/jpeg' });
    const url = await getDownloadURL(r);
    const input = $(`input[name="${fieldName}"]`);
    if (input) input.value = url;
    const prev = input?.closest('.photo-row')?.querySelector('.photo-prev');
    if (prev) { if (prev.tagName === 'IMG') prev.src = url; else prev.outerHTML = `<img src="${esc(url)}" alt="" class="photo-prev">`; }
    toast('Photo envoyée. Elle est conservée telle quelle (seul le recadrage d’affichage change).');
  } catch (e) { console.error(e); toast('Téléversement impossible : ' + (e.code || e.message) + ' — tu peux déposer la photo dans le dépôt GitHub.'); }
}

/* ============================== Actions (clics, saisies) ============================== */
document.addEventListener('click', async (e) => {
  const t = e.target.closest('[data-act]');
  if (!t) { if (e.target.id === 'modal') closeModal(); return; }
  const a = t.dataset.act, id = t.dataset.id;
  switch (a) {
    case 'event': openModal({ type: 'event', id }); break;
    case 'card': openModal({ type: 'card', id }); break;
    case 'cardpreview': openModal({ type: 'card', id }); break;
    case 'close': closeModal(); break;
    case 'notifs': openModal({ type: 'notifs' }); break;
    case 'askperm': askPermission(); break;
    case 'rsvp': await setRsvp(id, t.dataset.ans); break;
    case 'rsvpview': openModal({ type: 'event', id }); break;
    case 'openpack': openBooster(); break;
    case 'closestage': closeStage(); break;
    case 'albumfilter': S.album.filter = t.dataset.v; render(); break;
    case 'albumsort': S.album.sort = t.dataset.v; render(); break;
    case 'albumowned': S.album.owned = t.dataset.v; render(); break;
    case 'albumcat': S.album.cat = t.dataset.v; render(); break;
    case 'sagacat': S.saga.cat = t.dataset.v; render(); break;
    case 'wordguess': {
      const w = todayWord(); const g = $('#word-guess')?.value || ''; S.wordState.guess = g;
      S.wordState.result = normWord(g) === normWord(w?.word) ? 'ok' : 'ko';
      if (S.wordState.result === 'ok') S.wordState.revealed = true;
      render(); break;
    }
    case 'wordhint': S.wordState.hint = true; S.wordState.guess = $('#word-guess')?.value || ''; render(); break;
    case 'wordreveal': S.wordState.revealed = true; render(); break;
    case 'wordreset': S.wordState = { guess: '', hint: false, revealed: false, result: '' }; render(); break;
    case 'quizpick': {
      const quiz = S.quiz.length ? S.quiz : SEED_QUIZ; const i = Number(t.dataset.i);
      const cur = quiz[S.quizState.order[S.quizState.i]];
      S.quizState.picked = i; if (i === cur.answer) S.quizState.score++; render(); break;
    }
    case 'quiznext': {
      const quiz = S.quiz.length ? S.quiz : SEED_QUIZ;
      if (S.quizState.i + 1 >= quiz.length) S.quizState.done = true; else { S.quizState.i++; S.quizState.picked = null; } render(); break;
    }
    case 'quizreset': S.quizState = { i: 0, score: 0, picked: null, done: false, order: null }; render(); break;
    case 'del': S.del = t.dataset.v; localStorage.setItem('dejj-del', S.del); render(); break;
    case 'shabbat-reload': {
      const del = S.del; const box = $('#js-shabbat');
      if (box) box.innerHTML = '<p>Chargement…</p>';
      const d = await fetchShabbat(del, { force: true });
      const el = $('#js-shabbat'); if (el) el.innerHTML = shabbatBlock(d, { city: del });
      break;
    }
    case 'authmode': S.authMode = S.authMode === 'login' ? 'register' : 'login'; render(); break;
    case 'logout': if (auth) await signOut(auth); go('#/'); break;
    case 'resetpw': {
      const mail = $('#a-mail')?.value;
      if (!mail) return showAuthErr('Saisis ton e-mail puis clique sur « Mot de passe oublié ».');
      try { await sendPasswordResetEmail(auth, mail); toast('E-mail de réinitialisation envoyé.'); } catch (er) { showAuthErr(authMsg(er)); }
      break;
    }
    // Administration
    case 'admtab': S.adm = { ...S.adm, tab: t.dataset.v, docs: [], edit: null, q: '' }; render(); loadAdmin(t.dataset.v); break;
    case 'admedit': S.adm.edit = { id, data: (S.adm.docs || []).find((d) => d.id === id) }; render(); window.scrollTo(0, 0); break;
    case 'admcancel': S.adm.edit = null; render(); break;
    case 'admdel': {
      if (!confirm('Supprimer définitivement cet élément ?')) break;
      if (DEMO) {
        const coll = TABS[S.adm.tab].coll;
        if (coll === 'users') delete D.users[id]; else if (D[coll]) delete D[coll][id];
        demoPersist(); startDemoData(); loadAdmin(); return toast('Supprimé (démo).');
      }
      try {
        await deleteDoc(doc(db, TABS[S.adm.tab].coll, id));
        if (TABS[S.adm.tab].coll === 'events') await deleteDoc(doc(db, 'events', id)).catch(() => {});
        toast('Supprimé.'); loadAdmin();
      } catch (er) { toast('Suppression impossible : ' + (er.code || er.message)); }
      break;
    }
    case 'setrole': {
      if (!isAdmin()) return toast('Seul un administrateur peut changer les rôles.');
      try { await updateDoc(doc(db, 'users', t.dataset.id), { role: t.value }); toast('Rôle modifié.'); loadAdmin(); }
      catch (er) { toast('Impossible : ' + (er.code || er.message)); }
      break;
    }
    case 'demoreset': demoReset(); break;
    case 'demosignin': demoSignIn(t.dataset.v); break;
    case 'csv': await exportCsv(id); break;
    case 'xls': await exportXls(id); break;
    case 'planprev': S.adm.planMonth = new Date(S.adm.planMonth.getFullYear(), S.adm.planMonth.getMonth() - 1, 1); render(); break;
    case 'plannext': S.adm.planMonth = new Date(S.adm.planMonth.getFullYear(), S.adm.planMonth.getMonth() + 1, 1); render(); break;
    case 'planpick': {
      const date = t.dataset.v;
      const cfg = TABS[S.adm.tab];
      const existing = (S.adm.docs || []).find((d) => d.id === date);
      S.adm.edit = existing ? { id: date, data: existing } : { id: null, data: { __planDate: date } };
      render();
      const el = $('#f-docid'); if (el && !existing) { el.value = date; }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      break;
    }
    case 'seedextra': {
      const coll = t.dataset.coll;
      if (coll === 'cards') break;
      const items = coll === 'words' ? SEED_WORDS : coll === 'anecdotes' ? SEED_ANECDOTES : SEED_QUIZ;
      if (!confirm('Importer le contenu de départ de cet onglet ? Les éléments ayant le même identifiant seront remplacés.')) break;
      try {
        const b = DEMO ? null : writeBatch(db);
        items.forEach((it, i) => {
          const id = coll === 'words' ? `2026-01-${pad((i % 28) + 1)}-${i}` : (it.id || `${coll}-${i + 1}`);
          const data = { ...it };
          if (DEMO) { D[coll] = D[coll] || {}; D[coll][id] = data; }
          else b.set(doc(db, coll, coll === 'words' ? doc(collection(db, coll)).id : id), data, { merge: true });
        });
        if (DEMO) { demoPersist(); startDemoData(); } else await b.commit();
        toast('Contenu de départ importé.');
        loadAdmin();
      } catch (er) { toast('Import impossible : ' + (er.code || er.message)); }
      break;
    }
    case 'seedcards': {
      if (!confirm('Importer le contenu de départ (cartes historiques La Saga, animateurs, exemples) ? Les cartes ayant le même identifiant seront remplacées.')) break;
      try {
        for (let i = 0; i < SEED_CARDS.length; i += 400) {
          const b = writeBatch(db);
          SEED_CARDS.slice(i, i + 400).forEach((c) => { const { id: cid, ...rest } = c; b.set(doc(db, 'cards', cid), rest, { merge: true }); });
          await b.commit();
        }
        toast('Contenu de départ importé.');
        loadAdmin();
      } catch (er) { toast('Import impossible : ' + (er.code || er.message)); }
      break;
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { if (!$('#stage').hidden && !S.lock) closeStage(); closeModal(); }
  if (e.key === 'Enter' && e.target.id === 'word-guess') { e.preventDefault(); $('[data-act="wordguess"]')?.click(); }
});

// Recherche dans l'album / les listes admin sans re-render complet (on garde le curseur)
document.addEventListener('input', (e) => {
  if (e.target.id === 'album-q') {
    S.album.q = e.target.value;
    const v = e.target.value;
    render();
    const el = $('#album-q'); if (el) { el.focus(); el.setSelectionRange(v.length, v.length); }
  }
  if (e.target.id === 'adm-q') {
    S.adm.q = e.target.value;
    const v = e.target.value;
    render();
    const el = $('#adm-q'); if (el) { el.focus(); el.setSelectionRange(v.length, v.length); }
  }
});

// Changement de rôle : on écoute « change » sur les selects marqués
document.addEventListener('change', (e) => {
  const sel = e.target.closest('select[data-act="setrole"]');
  if (sel) {
    if (!isAdmin()) { toast('Seul un administrateur peut changer les rôles.'); return; }
    if (DEMO) { D.users[sel.dataset.id].role = sel.value; demoPersist(); startDemoData(); loadAdmin(); return toast('Rôle modifié (démo).'); }
    updateDoc(doc(db, 'users', sel.dataset.id), { role: sel.value })
      .then(() => { toast('Rôle modifié.'); loadAdmin(); })
      .catch((er) => toast('Impossible : ' + (er.code || er.message)));
  }
  const file = e.target.closest('input[type="file"][data-photo-input]');
  if (file && file.files?.[0]) uploadPhoto(file.files[0], file.dataset.photoInput);
  const zoom = e.target.closest('input[name="imageZoom"]');
  if (zoom) {
    const prev = $('.photo-prev');
    if (prev) prev.style.transform = `scale(${Number(zoom.value) || 1})`;
  }
});

function showAuthErr(m) { const el = $('#auth-err'); if (el) { el.textContent = m; el.hidden = false; } else toast(m); }
function authMsg(e) {
  const m = {
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.', 'auth/user-not-found': 'Aucun compte avec cet e-mail.',
    'auth/wrong-password': 'Mot de passe incorrect.', 'auth/email-already-in-use': 'Cet e-mail est déjà utilisé.',
    'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).', 'auth/invalid-email': 'E-mail invalide.',
    'auth/too-many-requests': 'Trop d’essais, réessaie plus tard.', 'auth/network-request-failed': 'Problème de connexion.',
    'auth/unauthorized-domain': 'Domaine non autorisé : ajoute-le dans Firebase → Authentication → Paramètres → Domaines autorisés (ederyevi-dot.github.io).'
  };
  return m[e.code] || ('Erreur : ' + (e.code || e.message));
}

document.addEventListener('submit', async (e) => {
  const f = e.target.closest('form[data-form]'); if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form; const fd = new FormData(f);
  if (kind === 'auth') {
    if (!CONFIGURED) return showAuthErr('Firebase n’est pas configuré.');
    const email = String(fd.get('email')).trim(), pw = String(fd.get('password'));
    try {
      if (S.authMode === 'register') {
        const name = String(fd.get('name')).trim(); const delegation = String(fd.get('delegation'));
        S.pendingProfile = { name, delegation };
        const cred = await createUserWithEmailAndPassword(auth, email, pw);
        await updateProfile(cred.user, { displayName: name }).catch(() => {});
        toast('Bienvenue au DEJJ ! Ton compte est créé (rôle membre).');
      } else await signInWithEmailAndPassword(auth, email, pw);
      go('#/');
    } catch (er) { showAuthErr(authMsg(er)); }
  } else if (kind === 'profile') {
    const data = {
      name: String(fd.get('name')).trim(), delegation: String(fd.get('delegation')),
      photoURL: String(fd.get('photoURL') || '').trim(),
      notifyEvents: fd.get('notifyEvents') === 'on', notifyCards: fd.get('notifyCards') === 'on', notifyContent: fd.get('notifyContent') === 'on'
    };
    if (DEMO) {
      D.users[S.user.uid] = { ...D.users[S.user.uid], ...data };
      demoPersist(); startDemoData(); S.del = data.delegation; localStorage.setItem('dejj-del', data.delegation);
      return toast('Profil enregistré (démo).');
    }
    try {
      await updateDoc(doc(db, 'users', S.user.uid), data);
      S.del = data.delegation; localStorage.setItem('dejj-del', data.delegation);
      toast('Profil enregistré.'); refresh(true);
    } catch (er) { toast('Échec : ' + (er.code || er.message)); }
  } else if (kind === 'admin') saveAdmin(f);
  else if (kind === 'booster') {
    if (!isAdmin()) return toast('Réservé à l’administrateur.');
    const perCard = {}, packOdds = {};
    Object.keys(RAR).forEach((k) => { perCard[k] = Number(fd.get(`perCard_${k}`) || 0); packOdds[k] = Number(fd.get(`packOdds_${k}`) || 0); });
    const data = {
      mode: String(fd.get('mode')), packSize: Number(fd.get('packSize') || 5), perCard, packOdds,
      minRareLast: fd.get('minRareLast') === 'on', allowDuplicates: fd.get('allowDuplicates') === 'on'
    };
    if (DEMO) { D.config.booster = { ...(D.config.booster || {}), ...data }; demoPersist(); startDemoData(); return toast('Probabilités enregistrées (démo).'); }
    try { await setDoc(doc(db, 'config', 'booster'), data, { merge: true }); S.cfgBooster = { ...boosterCfg(), ...data }; toast('Probabilités enregistrées.'); }
    catch (er) { toast('Échec : ' + (er.code || er.message)); }
  } else if (kind === 'chabbat') {
    if (!isAdmin()) return toast('Réservé à l’administrateur.');
    const cities = [];
    for (let i = 0; i < 6; i++) {
      const n = String(fd.get(`city_${i}`) || '').trim(); const g = String(fd.get(`geo_${i}`) || '').trim();
      if (n && g) cities.push({ name: n, geonameid: Number(g) });
    }
    const data = { cities: cities.length ? cities : Object.entries(DELS).map(([name, geonameid]) => ({ name, geonameid })), candleMinutes: Number(fd.get('candleMinutes') || 0), havdalah: fd.get('havdalah') === 'on' ? 'on' : 'off' };
    if (DEMO) { D.config.chabbat = data; demoPersist(); startDemoData(); return toast('Paramètres Chabbat enregistrés (démo).'); }
    try { await setDoc(doc(db, 'config', 'chabbat'), data, { merge: true }); S.cfgChabbat = data; toast('Paramètres Chabbat enregistrés.'); }
    catch (er) { toast('Échec : ' + (er.code || er.message)); }
  } else if (kind === 'appconfig') {
    if (!isAdmin()) return toast('Réservé à l’administrateur.');
    const data = { welcome: String(fd.get('welcome') || '').trim(), vapidKey: String(fd.get('vapidKey') || '').trim(), storageEnabled: fd.get('storageEnabled') === 'on' };
    if (DEMO) { D.config.app = data; demoPersist(); startDemoData(); return toast('Réglages enregistrés (démo).'); }
    try { await setDoc(doc(db, 'config', 'app'), data, { merge: true }); S.cfgApp = data; toast('Réglages enregistrés.'); }
    catch (er) { toast('Échec : ' + (er.code || er.message)); }
  }
});

/* ============================== Données en temps réel ============================== */
const unsubs = [];
function listen(name, coll, mapFn) {
  unsubs.push(onSnapshot(collection(db, coll), (snap) => {
    S[name] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (mapFn) mapFn();
    refresh();
  }, (er) => {
    console.warn(coll, er.code);
    if (er.code === 'permission-denied' && !DEMO) {
      const b = $('#cfg-banner');
      if (b && b.hidden) {
        b.hidden = false;
        b.innerHTML = `Bibliothèque non publiable en lecture (règles Firestore à publier). <a href="?demo=1">Essayer le mode démo</a>`;
      }
    }
  }));
}
function startPublic() {
  listen('events', 'events');
  listen('news', 'news', () => S.news.sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0)));
  listen('cards', 'cards');
  listen('anecdotes', 'anecdotes', () => S.anecdotes.sort((a, b) => (toDate(b.createdAt) || 0) - (toDate(a.createdAt) || 0)));
  listen('quiz', 'quiz');
  listen('words', 'words');
  listen('dailies', 'daily');
  unsubs.push(onSnapshot(doc(db, 'config', 'booster'), (s) => { S.cfgBooster = s.exists() ? s.data() : null; refresh(); }, () => {}));
  unsubs.push(onSnapshot(doc(db, 'config', 'chabbat'), (s) => { S.cfgChabbat = s.exists() ? s.data() : null; refresh(); }, () => {}));
  unsubs.push(onSnapshot(doc(db, 'config', 'app'), (s) => { S.cfgApp = s.exists() ? s.data() : null; refresh(); }, () => {}));
}
async function loadDaily() {
  if (!db) return;
  const today = localDay();
  try {
    const [w, c] = await Promise.all([getDoc(doc(db, 'words', today)), getDoc(doc(db, 'daily', today))]);
    S.dayWord = w.exists() ? { id: w.id, ...w.data() } : null;
    const cardId = c.exists() ? c.data().cardId : null;
    S.dayCard = cardId ? cardById(cardId) : null;
    refresh();
  } catch (e) { console.warn('daily', e.code); }
}
let userUnsubs = [];
function startUser(uid) {
  userUnsubs.forEach((u) => u()); userUnsubs = [];
  // Mes inscriptions : copie privée dans users/{uid}/rsvps (aucun index composite requis).
  userUnsubs.push(onSnapshot(collection(db, 'users', uid, 'rsvps'), (snap) => {
    S.myRsvps = snap.docs.map((d) => ({ _eventId: d.id, ...d.data() }));
    refresh(); fireBrowserNotifs();
  }, (er) => console.warn('my rsvps', er.code)));
  // Totaux par événement : uniquement des compteurs, aucune donnée personnelle.
  userUnsubs.push(onSnapshot(collection(db, 'rsvps'), (snap) => {
    const m = {};
    snap.docs.forEach((d) => { if (d.id === 'stats') m[d.id] = d.data(); });
    S.rsvpCounts = m;
    refresh();
  }, (er) => console.warn('counts', er.code)));
  userUnsubs.push(onSnapshot(collection(db, 'users', uid, 'collection'), (snap) => {
    S.collection = new Map(snap.docs.map((d) => [d.id, d.data()])); refresh();
  }, (er) => console.warn('collection', er.code)));
  userUnsubs.push(onSnapshot(doc(db, 'users', uid), (snap) => {
    if (snap.exists()) { S.profile = { id: uid, ...snap.data() }; if (!localStorage.getItem('dejj-del') && S.profile.delegation) S.del = S.profile.delegation; refresh(); }
  }));
  // Journal du booster du jour (empêche la double ouverture, même sur un autre appareil).
  const logId = `${uid}_${utcKey()}`;
  userUnsubs.push(onSnapshot(doc(db, 'boosters', logId), (snap) => { S.boosterLog = snap.exists() ? snap.data() : null; refresh(); }, () => {}));
  // Les noms des participants sont chargés à la demande, uniquement par les animateurs et au-dessus
  // (voir loadRsvpNames), pour ne jamais exposer les données personnelles aux autres membres.
}

async function ensureProfile(user) {
  if (!db) return;
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) { S.profile = { id: user.uid, ...snap.data() }; return; }
  const p = S.pendingProfile || {};
  const profile = {
    name: p.name || user.displayName || (user.email || '').split('@')[0], email: user.email || '',
    delegation: p.delegation || S.del, role: 'member', photoURL: '',
    notifyEvents: true, notifyCards: true, notifyContent: true,
    createdAt: serverTimestamp(), lastBoosterDay: 0
  };
  await setDoc(ref, profile);
  S.profile = { id: user.uid, ...profile };
}

function startDemoUser() {
  if (!D) demoLoad();
  const uid = D.user || null;
  if (!uid || !D.users[uid]) { S.user = null; return; }
  S.user = { uid, email: D.users[uid].email };
  S.profile = { id: uid, ...D.users[uid] };
  S.collection = new Map(Object.entries(D.collections[uid] || {}));
  const mirror = D.myRsvps?.[uid] || Object.fromEntries(Object.entries(D.rsvps).map(([evId, m]) => [evId, m[uid]]).filter(([, v]) => v));
  S.myRsvps = Object.entries(mirror).map(([evId, v]) => ({ _eventId: evId, ...v }));
  const m = {};
  Object.entries(D.rsvpCounts).forEach(([ev, c]) => { m[ev] = c; });
  S.rsvpCounts = m;
  S.rsvpNames = {};
  Object.entries(D.names).forEach(([ev, names]) => { S.rsvpNames[ev] = new Map(Object.entries(names)); });
  const day = utcKey();
  S.boosterLog = D.boosters[`${uid}_${day}`] || null;
}
function startDemoData() {
  if (!D) demoLoad();
  S.cards = Object.values(D.cards || {});
  S.events = Object.entries(D.events || {}).map(([id, v]) => ({ id, ...v }));
  S.news = Object.entries(D.news || {}).map(([id, v]) => ({ id, ...v }));
  S.anecdotes = Object.entries(D.anecdotes || {}).map(([id, v]) => ({ id, ...v }));
  S.quiz = Object.entries(D.quiz || {}).map(([id, v]) => ({ id, ...v }));
  S.words = Object.entries(D.words || {}).map(([id, v]) => ({ id, ...v }));
  S.dailies = Object.entries(D.daily || {}).map(([id, v]) => ({ id, ...v }));
  S.cfgBooster = D.config.booster || null;
  S.cfgChabbat = D.config.chabbat || null;
  S.cfgApp = D.config.app || null;
  const today = localDay();
  S.dayWord = D.words[today] ? { id: today, ...D.words[today] } : null;
  S.dayCard = D.daily[today] ? cardById(D.daily[today].cardId) : null;
  startDemoUser();
  demoBeacon();
}

if (DEMO) {
  demoLoad(); startDemoData();
}
if (CONFIGURED && !DEMO) {
  startPublic(); loadDaily();
  onAuthStateChanged(auth, async (user) => {
    S.user = user;
    if (user) {
      try { await ensureProfile(user); } catch (e) { console.error(e); toast('Profil indisponible : vérifie les règles Firestore.'); }
      startUser(user.uid);
      if (!localStorage.getItem('dejj-seen-events')) localStorage.setItem('dejj-seen-events', String(Date.now()));
    } else {
      userUnsubs.forEach((u) => u()); userUnsubs = [];
      S.profile = null; S.rsvpNames = {}; S.myRsvps = []; S.rsvpCounts = {}; S.collection = new Map(); S.boosterLog = null;
    }
    if (route().startsWith('#/admin') && can('animateur')) loadAdmin(); else refresh(true);
  });
}

/* ============================== Démarrage ============================== */
if (!DEMO && 'serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
if (DEMO || window.__dejjTest) window.DEJJ = { S, D: () => D, refresh, render, pageHome, openBooster, showStage, demoLoad, startDemoData, cardHTML, drawPack, openModal };
renderNav();
render();
// Rafraîchissement automatique des contenus quotidiens (changement de jour, nouveaux horaires)
let __lastDay = localDay();
setInterval(() => {
  if (S.lock) return;
  if (localDay() !== __lastDay) {
    __lastDay = localDay();
    S.wordState = { guess: '', hint: false, revealed: false, result: '' };
    S.quizState = { i: 0, score: 0, picked: null, done: false, order: null };
    if (db) loadDaily();
    else if (DEMO) startDemoData();
    refresh(true);
    toast('Nouveaux contenus du jour disponibles.');
  }
  if (db) fetchShabbat(S.del);
}, 15 * 60 * 1000);

// Pré-chauffe des horaires de Chabbat (mise en cache 6 h)
if (CONFIGURED && db) fetchShabbat(S.del).then(() => { const el = $('#js-shabbat'); if (el) refresh(true); }).catch(() => {});
