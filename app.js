import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, runTransaction } from 'https://www.gstatic.com/firebasejs/13.4.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyCc_RFbgHimG2BMpC67EsvH8_V_B1xtgeU',
  authDomain: 'dejj-community.firebaseapp.com',
  projectId: 'dejj-community',
  storageBucket: 'dejj-community.firebasestorage.app',
  messagingSenderId: '1062249866115',
  appId: '1:1062249866115:web:5ab107d282818886150cb6',
  measurementId: 'G-HMCBPM2MXB'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let currentUser = null, profile = null, events = [], stopEvents = null, registeredIds = new Set();
const cards = []; // Les portraits réels seront ajoutés après vérification et autorisation des animateurs.
let unlockedCards = JSON.parse(localStorage.getItem('dejj-cards-v1') || '["c1"]');
let lastBooster = localStorage.getItem('dejj-booster-date');

function toast(message){ const t=$('toast'); t.textContent=message; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2800); }
function go(view){ document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x.id===`view-${view}`)); document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===view)); window.scrollTo({top:0,behavior:'smooth'}); }
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=e=>{e.preventDefault();go(b.dataset.view)});
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
$('profileShortcut').onclick=()=>go('profile');
function showAuth(message=''){ $('authGate').hidden=false; $('authError').textContent=message; }
function hideAuth(){ $('authGate').hidden=true; }
$('authModeLogin').onclick=()=>{ $('authModeLogin').classList.add('active'); $('authModeSignup').classList.remove('active'); $('authSubmit').textContent='Se connecter'; $('authNameWrap').hidden=true; };
$('authModeSignup').onclick=()=>{ $('authModeSignup').classList.add('active'); $('authModeLogin').classList.remove('active'); $('authSubmit').textContent='Créer mon compte'; $('authNameWrap').hidden=false; };
$('authForm').onsubmit=async e=>{
  e.preventDefault(); $('authError').textContent='';
  const email=$('authEmail').value.trim(), password=$('authPassword').value, isSignup=$('authModeSignup').classList.contains('active');
  try {
    if(isSignup){
      const name=$('authName').value.trim(); if(name.length<2) throw new Error('Indique ton prénom ou pseudo.');
      const cred=await createUserWithEmailAndPassword(auth,email,password);
      await setDoc(doc(db,'users',cred.user.uid),{name,email,city:'Marseille',role:'member',createdAt:serverTimestamp()});
    } else { await signInWithEmailAndPassword(auth,email,password); }
  } catch(err){ $('authError').textContent=authError(err); }
};
$('logoutBtn').onclick=async()=>{await signOut(auth);toast('Déconnexion effectuée.');};
function authError(err){ const code=err?.code||''; if(code.includes('email-already')) return 'Cette adresse e-mail possède déjà un compte. Connecte-toi.'; if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found')) return 'Adresse e-mail ou mot de passe incorrect.'; if(code.includes('weak-password')) return 'Le mot de passe doit contenir au moins 6 caractères.'; if(code.includes('permission-denied')) return 'Accès refusé par les règles Firestore. Vérifie les règles publiées.'; return err?.message||'Une erreur est survenue.'; }

onAuthStateChanged(auth, async user=>{
  currentUser=user;
  if(stopEvents){stopEvents();stopEvents=null;}
  registeredIds = new Set();
  if(!user){profile=null;events=[];showAuth();renderEvents();return;}
  try {
    const userRef=doc(db,'users',user.uid), snap=await getDoc(userRef);
    if(!snap.exists()){
      await setDoc(userRef,{name:user.email?.split('@')[0]||'Membre',email:user.email||'',city:'Marseille',role:'member',createdAt:serverTimestamp()});
      profile={name:user.email?.split('@')[0]||'Membre',email:user.email||'',city:'Marseille',role:'member'};
    } else profile=snap.data();
    hideAuth();
    $('profileName').textContent=profile.name||'Membre DEJJ';
    $('profileSubtitle').textContent=`${user.email} · ${roleLabel(profile.role)}`;
    $('nameInput').value=profile.name||''; $('profileCity').value=profile.city||'Marseille';
    $('profileShortcut').textContent=(profile.name||'M').slice(0,1).toUpperCase();
    $('statusText').textContent='Connecté';
    $('adminEntry').hidden=!['admin','responsable'].includes(profile.role);
    const q=query(collection(db,'events'),orderBy('date','asc'));
    stopEvents=onSnapshot(q,async s=>{events=s.docs.map(d=>({id:d.id,...d.data()}));await refreshMyRegistrations();renderEvents();},err=>toast(authError(err)));
  } catch(err){ showAuth(authError(err)); }
});
async function refreshMyRegistrations(){
  if(!currentUser)return; const ids=new Set();
  await Promise.all(events.map(async e=>{try{const r=await getDoc(doc(db,'events',e.id,'registrations',currentUser.uid));if(r.exists())ids.add(e.id);}catch(_){}}));
  registeredIds=ids;
}
function roleLabel(role){return ({admin:'Administrateur',responsable:'Responsable',animator:'Animateur',member:'Membre'})[role]||'Membre';}
function dateBox(s){if(!s)return '';const d=new Date(`${s}T12:00:00`);return `<div class="date-box"><b>${d.getDate()}</b><small>${d.toLocaleDateString('fr-FR',{month:'short'}).toUpperCase()}</small></div>`;}
function canManage(){return ['admin','responsable'].includes(profile?.role);}
function isStaff(){return ['admin','responsable','animator'].includes(profile?.role);}
function renderEvents(){
 const sorted=[...events].sort((a,b)=>(a.date||'').localeCompare(b.date||''));
 $('homeEvents').innerHTML=sorted.slice(0,3).map(e=>eventCard(e,true)).join('')||'<p class="notice">Aucun événement publié pour le moment.</p>';
 $('allEvents').innerHTML=sorted.map(e=>eventCard(e,false)).join('')||'<p class="notice">Aucun événement publié pour le moment.</p>';
 document.querySelectorAll('[data-reg]').forEach(b=>b.onclick=()=>toggleRegistration(b.dataset.reg));
 document.querySelectorAll('[data-volunteer]').forEach(b=>b.onclick=()=>toggleVolunteer(b.dataset.volunteer));
 document.querySelectorAll('[data-attendees]').forEach(b=>b.onclick=()=>showAttendees(b.dataset.attendees));
 document.querySelectorAll('[data-volunteers]').forEach(b=>b.onclick=()=>showVolunteers(b.dataset.volunteers));
 $('myRegistrations').innerHTML=sorted.filter(e=>registeredIds.has(e.id)).map(e=>`<p>${esc(e.title)} — ${esc(e.date||'')}</p>`).join('')||'<p class="notice">Tes inscriptions apparaîtront ici.</p>';
}
function eventCard(e,compact){
 const count=Number(e.attendeeCount||0), cap=Number(e.capacity||0), full=cap>0&&count>=cap, mine=registeredIds.has(e.id);
 const actions=currentUser?`<button class="small-btn" data-reg="${esc(e.id)}" ${full&&!mine?'disabled':''}>${mine?'Annuler mon inscription':full?'Complet':'Je participe'}</button>${isStaff()?`<button class="small-btn secondary-btn" data-attendees="${esc(e.id)}">Voir les inscrits</button>`:''}${canManage()?`<button class="small-btn secondary-btn" data-volunteers="${esc(e.id)}">Gérer les volontaires</button>`:''}${profile?.role==='animator'?`<button class="small-btn secondary-btn" data-volunteer="${esc(e.id)}">Me proposer pour aider</button>`:''}`:'<span class="tag">Connecte-toi pour participer</span>';
 return `<article class="${compact?'event-card':'event-row'}">${dateBox(e.date)}<div><h3>${esc(e.title)}</h3><p>${esc(e.time||'')}${e.place?' · '+esc(e.place):''}${e.description?' · '+esc(e.description):''}</p><p>${cap?`${count}/${cap} inscrits · ${Math.max(0,cap-count)} places restantes`:`${count} inscrit(s) · sans limite`}</p></div><div class="event-actions">${actions}</div></article>`;
}
async function toggleRegistration(id){
 const ref=doc(db,'events',id,'registrations',currentUser.uid), eventRef=doc(db,'events',id); if(!currentUser)return;
 try{
  let joined=false;
  await runTransaction(db,async tx=>{const es=await tx.get(eventRef),rs=await tx.get(ref);if(!es.exists())throw new Error('Cet événement n’existe plus.');const data=es.data(),count=Number(data.attendeeCount||0),cap=Number(data.capacity||0);if(rs.exists()){tx.delete(ref);tx.update(eventRef,{attendeeCount:Math.max(0,count-1)});joined=false;}else{if(cap>0&&count>=cap)throw new Error('Événement complet.');tx.set(ref,{uid:currentUser.uid,name:profile.name||currentUser.email,city:profile.city||'',createdAt:serverTimestamp()});tx.update(eventRef,{attendeeCount:count+1});joined=true;}});
  if(joined)registeredIds.add(id);else registeredIds.delete(id);renderEvents();toast(joined?'Inscription enregistrée.':'Inscription annulée.');
 }catch(err){toast(authError(err));}
}
async function showAttendees(id){
 try{const snap=await getDocs(collection(db,'events',id,'registrations'));const list=snap.docs.map(d=>d.data());const ev=events.find(e=>e.id===id);modal(`<span class="eyebrow">PARTICIPANTS</span><h2>${esc(ev?.title||'Événement')}</h2><p>${list.length} inscrit(s)</p>${list.length?`<ul>${list.map(x=>`<li>${esc(x.name)}${x.city?' · '+esc(x.city):''}</li>`).join('')}</ul>`:'<p>Aucune inscription pour le moment.</p>'}<button class="primary-btn" id="modalOk">Fermer</button>`);}catch(err){toast(authError(err));}
}

async function showVolunteers(id){
 try{const snap=await getDocs(collection(db,'events',id,'volunteers'));const list=snap.docs.map(d=>({id:d.id,...d.data()}));const ev=events.find(e=>e.id===id);modal(`<span class="eyebrow">ÉQUIPE DE PRÉPARATION · ONE SHOT</span><h2>${esc(ev?.title||'Événement')}</h2>${list.length?list.map(x=>`<div class="volunteer-line"><span>${esc(x.name)} · ${esc(x.status==='selected'?'Retenu':x.status==='rejected'?'Non retenu':'En attente')}</span><span>${x.status==='pending'?`<button class="small-btn" data-approve="${esc(x.id)}">Retenir</button><button class="small-btn secondary-btn" data-reject="${esc(x.id)}">Refuser</button>`:''}</span></div>`).join(''):'<p>Aucun volontaire pour le moment.</p>'}<button class="primary-btn" id="modalOk">Fermer</button>`);document.querySelectorAll('[data-approve]').forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,'events',id,'volunteers',b.dataset.approve),{status:'selected',reviewedBy:currentUser.uid,reviewedAt:serverTimestamp()});showVolunteers(id);});document.querySelectorAll('[data-reject]').forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,'events',id,'volunteers',b.dataset.reject),{status:'rejected',reviewedBy:currentUser.uid,reviewedAt:serverTimestamp()});showVolunteers(id);});}catch(err){toast(authError(err));}
}
async function toggleVolunteer(id){
 try{const ref=doc(db,'events',id,'volunteers',currentUser.uid),s=await getDoc(ref);if(s.exists()){await deleteDoc(ref);toast('Proposition retirée.');}else{await setDoc(ref,{uid:currentUser.uid,name:profile.name||currentUser.email,status:'pending',createdAt:serverTimestamp()});toast('Ta proposition a été envoyée au responsable.');}}catch(err){toast(authError(err));}
}
$('saveProfile').onclick=async()=>{const name=$('nameInput').value.trim(),city=$('profileCity').value;if(name.length<2){toast('Indique un prénom ou pseudo de 2 caractères minimum.');return;}try{await updateDoc(doc(db,'users',currentUser.uid),{name,city});profile={...profile,name,city};$('profileName').textContent=name;$('profileShortcut').textContent=name.slice(0,1).toUpperCase();toast('Profil enregistré.');}catch(err){toast(authError(err));}};
$('eventForm').onsubmit=async e=>{e.preventDefault();if(!canManage()){toast('Seuls les administrateurs et responsables peuvent publier.');return;}const title=$('eventTitle').value.trim(),date=$('eventDate').value,place=$('eventPlace').value.trim(),cap=$('eventCapacity').value;if(!title||!date||!place)return;try{await addDoc(collection(db,'events'),{title,date,time:$('eventTime').value,place,description:$('eventDescription').value.trim(),capacity:cap?Number(cap):null,attendeeCount:0,createdBy:currentUser.uid,createdAt:serverTimestamp()});e.target.reset();toast('Événement publié pour tous les membres.');}catch(err){toast(authError(err));}};
$('adminToggle').onclick=()=>{const p=$('adminPanel');p.hidden=!p.hidden;$('adminToggle').textContent=p.hidden?'Ouvrir':'Fermer';};
$('addEventShortcut').onclick=()=>{if(!canManage()){toast('Cette fonction est réservée aux responsables.');return;}go('profile');$('adminPanel').hidden=false;$('adminToggle').textContent='Fermer';$('eventTitle').focus();};
function renderCards(){const unlocked=cards.filter(c=>unlockedCards.includes(c.id)).length;$('collectionCount').textContent=`${unlocked}`;$('cardsGrid').innerHTML=cards.length?cards.map(c=>{const yes=unlockedCards.includes(c.id);return `<article class="collect-card"><div class="card-art ${yes?'':'locked'}"><span class="card-rarity">${yes?esc(c.rarity.toUpperCase()):'VERROUILLÉE'}</span><span class="card-initial">${yes?esc(c.initial):'?'}</span></div><h3>${yes?esc(c.name):'Carte à découvrir'}</h3><p>${yes?esc(c.role):'Ouvre un booster pour tenter de la débloquer.'}</p></article>`}).join(''):'<div class="notice">La collection officielle est en préparation. Les cartes représenteront de vrais animateurs DEJJ. Aucun portrait ne sera publié sans vérification de l’identité et accord de la personne.</div>';}
function modal(html){$('modalContent').innerHTML=html;$('modalBackdrop').hidden=false;const ok=$('modalOk');if(ok)ok.onclick=()=>$('modalBackdrop').hidden=true;}
$('modalClose').onclick=()=>$('modalBackdrop').hidden=true;$('modalBackdrop').onclick=e=>{if(e.target.id==='modalBackdrop')e.currentTarget.hidden=true;};
$('wordReveal').onclick=()=>modal('<span class="eyebrow">LE MOT DU JOUR</span><h2>Havrouta</h2><p>Terme hébreu désignant l’étude en binôme : deux personnes apprennent ensemble, confrontent leurs idées et progressent par le dialogue.</p><button class="primary-btn" id="modalOk">Compris</button>');
$('openBooster').onclick=()=>{if(!cards.length){toast('Les portraits des animateurs seront ajoutés après validation.');return;}const today=new Date().toISOString().slice(0,10);if(lastBooster===today){toast('Ton booster du jour a déjà été ouvert.');return;}const locked=cards.filter(c=>!unlockedCards.includes(c.id));if(!locked.length){toast('Collection complète !');return;}const card=locked[Math.floor(Math.random()*locked.length)];unlockedCards.push(card.id);lastBooster=today;localStorage.setItem('dejj-cards-v1',JSON.stringify(unlockedCards));localStorage.setItem('dejj-booster-date',today);renderCards();modal(`<span class="eyebrow">BOOSTER OUVERT</span><div class="reveal-art"><span>${esc(card.initial)}</span></div><span class="rarity-tag">${esc(card.rarity.toUpperCase())}</span><h2>${esc(card.name)}</h2><p>${esc(card.desc)}</p><button class="primary-btn" id="modalOk">Ajouter à ma collection</button>`);};
$('adminToggle').textContent='Ouvrir';
const citySelect=$('citySelect');if(citySelect){citySelect.value=localStorage.getItem('dejj-city')||'Marseille';citySelect.addEventListener('change',()=>localStorage.setItem('dejj-city',citySelect.value));}
const editionDate=$('editionDate');if(editionDate){editionDate.textContent=new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'long',year:'numeric'}).format(new Date()).toUpperCase();}
document.querySelectorAll('.filter').forEach(b=>b.onclick=()=>{document.querySelectorAll('.filter').forEach(x=>x.classList.toggle('active',x===b));document.querySelectorAll('#allEvents .event-row').forEach(el=>{const btn=el.querySelector('[data-reg]');const ev=events.find(x=>x.id===btn?.dataset.reg);el.style.display=b.dataset.filter==='limited'&&!ev?.capacity?'none':'';});});
let installPrompt;$('installBtn').hidden=true;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('installBtn').hidden=false;});$('installBtn').onclick=async()=>{if(installPrompt){installPrompt.prompt();installPrompt=null;$('installBtn').hidden=true;}};
if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
renderCards();
