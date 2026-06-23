// ── AUTH — 3 usuários fixos ───────────────────────────────────────────────────
const USERS = [
  { id:'u1', name:'User 1', emoji:'🔴', password:'User@1', color:'#E85D4A' },
  { id:'u2', name:'User 2', emoji:'🔵', password:'User@2', color:'#185FA5' },
  { id:'u3', name:'User 3', emoji:'🟢', password:'User@3', color:'#1D9E75' }
];

let currentUser = null;

function storageKey(key) {
  return `pkmn_${currentUser.id}_${key}`;
}

function getItem(key) {
  return localStorage.getItem(storageKey(key));
}

function setItem(key, value) {
  localStorage.setItem(storageKey(key), value);
}

// ── TELA DE LOGIN ─────────────────────────────────────────────────────────────
function showLogin() {
  // Esconde app inteiro
  document.querySelector('.header').style.display = 'none';
  document.querySelector('.nav').style.display = 'none';
  document.querySelector('.content').style.display = 'none';

  // Cria tela de login se não existir
  if(!document.getElementById('login-screen')) {
    const el = document.createElement('div');
    el.id = 'login-screen';
    el.innerHTML = loginHTML();
    document.body.appendChild(el);
  }
  document.getElementById('login-screen').style.display = 'flex';

  // Enter no campo de senha
  setTimeout(()=>{
    const inp = document.getElementById('pw-input');
    if(inp) inp.addEventListener('keydown', e=>{ if(e.key==='Enter') doLogin(); });
  }, 100);
}

function loginHTML() {
  return `
  <div id="login-screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;
    min-height:100vh;background:#1a1a2e;padding:24px;gap:0">

    <!-- Logo -->
    <div style="font-size:48px;margin-bottom:8px">⚡</div>
    <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:4px">AAZ Pokémon</div>
    <div style="font-size:12px;color:rgba(255,255,255,.4);margin-bottom:36px">Coleção & Decks</div>

    <!-- Seleção de usuário -->
    <div style="width:100%;max-width:320px;margin-bottom:20px">
      <div style="font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;text-align:center">Selecione seu perfil</div>
      <div style="display:flex;gap:10px;justify-content:center">
        ${USERS.map(u=>`
          <button id="user-btn-${u.id}" onclick="selectUser('${u.id}')"
            style="flex:1;padding:14px 8px;border-radius:12px;border:2px solid rgba(255,255,255,.1);
              background:rgba(255,255,255,.05);color:#fff;cursor:pointer;font-family:inherit;
              transition:all .2s;display:flex;flex-direction:column;align-items:center;gap:6px">
            <span style="font-size:28px">${u.emoji}</span>
            <span style="font-size:12px;font-weight:500">${u.name}</span>
          </button>`).join('')}
      </div>
    </div>

    <!-- Senha -->
    <div style="width:100%;max-width:320px" id="pw-section" style="display:none">
      <div style="font-size:11px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;text-align:center">Senha</div>
      <div style="position:relative">
        <input type="password" id="pw-input" placeholder="Digite sua senha..."
          style="width:100%;padding:13px 44px 13px 14px;border-radius:10px;border:1.5px solid rgba(255,255,255,.15);
            background:rgba(255,255,255,.08);color:#fff;font-size:15px;font-family:inherit;outline:none;
            transition:border .15s"
          onfocus="this.style.borderColor='rgba(255,255,255,.4)'"
          onblur="this.style.borderColor='rgba(255,255,255,.15)'">
        <button onclick="togglePw()" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);
          background:none;border:none;color:rgba(255,255,255,.5);cursor:pointer;font-size:16px">👁</button>
      </div>
      <div id="pw-error" style="display:none;color:#F5C1C1;font-size:12px;text-align:center;margin-top:8px"></div>
      <button onclick="doLogin()"
        style="width:100%;margin-top:12px;padding:14px;border-radius:10px;border:none;
          background:#7F77DD;color:#fff;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;
          transition:opacity .15s"
        onmouseover="this.style.opacity='.9'" onmouseout="this.style.opacity='1'">
        Entrar
      </button>
    </div>

  </div>`;
}

let selectedUserId = null;

function selectUser(id) {
  selectedUserId = id;
  const user = USERS.find(u=>u.id===id);

  // Highlight selecionado
  USERS.forEach(u=>{
    const btn = document.getElementById(`user-btn-${u.id}`);
    if(!btn) return;
    btn.style.borderColor = u.id===id ? u.color : 'rgba(255,255,255,.1)';
    btn.style.background = u.id===id ? u.color+'33' : 'rgba(255,255,255,.05)';
  });

  // Mostra campo de senha
  const pw = document.getElementById('pw-section');
  if(pw){ pw.style.display='block'; }
  const inp = document.getElementById('pw-input');
  if(inp){ inp.value=''; inp.focus(); }
  const err = document.getElementById('pw-error');
  if(err) err.style.display='none';
}

function togglePw() {
  const inp = document.getElementById('pw-input');
  if(inp) inp.type = inp.type==='password'?'text':'password';
}

function doLogin() {
  if(!selectedUserId){ showError('Selecione um perfil primeiro.'); return; }
  const pw = (document.getElementById('pw-input')||{}).value || '';
  const user = USERS.find(u=>u.id===selectedUserId);
  if(!user || pw !== user.password) {
    showError('Senha incorreta. Tente novamente.');
    const inp = document.getElementById('pw-input');
    if(inp){ inp.value=''; inp.focus(); inp.style.borderColor='#F5C1C1'; setTimeout(()=>inp.style.borderColor='rgba(255,255,255,.15)',1500); }
    return;
  }
  // Login OK
  currentUser = user;
  localStorage.setItem('pkmn_session', user.id);
  hideLogin();
  loadUserData();
  updateUserBadge();
}

function showError(msg) {
  const el = document.getElementById('pw-error');
  if(el){ el.textContent=msg; el.style.display='block'; }
}

function hideLogin() {
  const el = document.getElementById('login-screen');
  if(el) el.style.display='none';
  document.querySelector('.header').style.display='';
  document.querySelector('.nav').style.display='';
  document.querySelector('.content').style.display='';
}

function updateUserBadge() {
  if(!currentUser) return;
  const badge = document.getElementById('hcount');
  if(badge){
    const total = collection.reduce((s,c)=>s+c.qty,0);
    badge.textContent = `${currentUser.emoji} ${currentUser.name} · ${total} cartas`;
  }
  // Add logout button to header
  if(!document.getElementById('logout-btn')){
    const header = document.querySelector('.header');
    const btn = document.createElement('button');
    btn.id = 'logout-btn';
    btn.textContent = 'Sair';
    btn.style.cssText = 'background:rgba(255,255,255,.1);border:none;color:rgba(255,255,255,.7);padding:4px 10px;border-radius:6px;font-size:11px;cursor:pointer;font-family:inherit;margin-left:6px;flex-shrink:0';
    btn.onclick = logout;
    header.appendChild(btn);
  }
}

function logout() {
  if(!confirm('Sair da conta?')) return;
  currentUser = null;
  selectedUserId = null;
  localStorage.removeItem('pkmn_session');
  // Reset app state
  collection = [];
  savedDecks = [];
  renderCollection();
  renderDecks();
  updateHeader();
  showLogin();
}

// ── CARREGAR DADOS DO USUÁRIO ─────────────────────────────────────────────────
function loadUserData() {
  collection = JSON.parse(getItem('col') || '[]');
  savedDecks = JSON.parse(getItem('decks') || '[]');
  renderCollection();
  renderDecks();
  updateHeader();
  if(typeof renderDeckList === 'function') renderDeckList();
}

// ── OVERRIDE saveCol e saveDecksToDB para usar chave do usuário ───────────────
const _origSaveCol = window.saveCol;
window.saveCol = function() {
  if(currentUser) setItem('col', JSON.stringify(collection));
  renderCollection(); renderDecks(); updateHeader();
};

const _origSaveDecks = window.saveDecksToDB;
window.saveDecksToDB = function() {
  if(currentUser) setItem('decks', JSON.stringify(savedDecks));
};

// ── AUTO LOGIN se sessão salva ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', ()=>{
  const saved = localStorage.getItem('pkmn_session');
  if(saved) {
    const user = USERS.find(u=>u.id===saved);
    if(user) {
      currentUser = user;
      loadUserData();
      updateUserBadge();
      return;
    }
  }
  showLogin();
});
