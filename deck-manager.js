// ── DECK MANAGER ─────────────────────────────────────────────────────────────
let savedDecks = JSON.parse(localStorage.getItem('pkmn_decks') || '[]');
let currentDeckId = null; // deck being edited
let currentDeckCards = []; // cards in editor
let deckFilterMode = 'collection';
let compareTarget = null; // which meta deck to detail

function saveDecksToDB() {
  localStorage.setItem('pkmn_decks', JSON.stringify(savedDecks));
}

// ── INIT ──────────────────────────────────────────────────────────────────────
function initDeckManager() {
  const nav = document.querySelector('.nav');
  const btn = document.createElement('button');
  btn.className = 'nb';
  btn.id = 'nav-decks-btn';
  btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="20" height="20"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>Decks`;
  btn.onclick = function(){ goTab('deckman', this); renderDeckList(); };
  nav.appendChild(btn);

  const content = document.querySelector('.content');
  const screen = document.createElement('div');
  screen.id = 'tab-deckman';
  screen.className = 'screen';
  screen.innerHTML = deckManagerHTML();
  content.appendChild(screen);
}

function deckManagerHTML() {
  return `
<!-- LISTA DE DECKS -->
<div id="dm-list-view">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
    <div class="lbl" style="margin:0">Meus Decks (<span id="dm-count">0</span>)</div>
    <button class="btn btn-primary btn-sm" onclick="openNewDeck()">+ Novo deck</button>
  </div>
  <div id="dm-deck-cards"></div>
  <div id="dm-empty" class="empty" style="display:none">Nenhum deck ainda.<br>Clique em "+ Novo deck" para começar!</div>
</div>

<!-- EDITOR DE DECK -->
<div id="dm-editor-view" style="display:none">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <button class="btn btn-sm" onclick="backToList()" style="padding:6px 10px">← Voltar</button>
    <input type="text" id="dm-deck-name" placeholder="Nome do deck..." style="flex:1;padding:8px 12px;font-size:14px;font-weight:600">
    <button class="btn btn-success btn-sm" onclick="saveDeck()">💾 Salvar</button>
  </div>

  <!-- Contador -->
  <div style="display:flex;gap:8px;margin-bottom:10px">
    <div style="flex:1;background:#fff;border-radius:10px;border:1px solid #e8e8e0;padding:10px;text-align:center">
      <div style="font-size:20px;font-weight:700" id="ed-total">0</div>
      <div style="font-size:10px;color:#888">cartas</div>
    </div>
    <div style="flex:1;background:#fff;border-radius:10px;border:1px solid #e8e8e0;padding:10px;text-align:center">
      <div style="font-size:20px;font-weight:700" id="ed-pokemon">0</div>
      <div style="font-size:10px;color:#888">Pokémon</div>
    </div>
    <div style="flex:1;background:#fff;border-radius:10px;border:1px solid #e8e8e0;padding:10px;text-align:center">
      <div style="font-size:20px;font-weight:700" id="ed-trainer">0</div>
      <div style="font-size:10px;color:#888">Trainers</div>
    </div>
    <div style="flex:1;background:#fff;border-radius:10px;border:1px solid #e8e8e0;padding:10px;text-align:center">
      <div style="font-size:20px;font-weight:700" id="ed-energy">0</div>
      <div style="font-size:10px;color:#888">Energia</div>
    </div>
  </div>

  <!-- Busca -->
  <div class="card" style="padding:12px;margin-bottom:10px">
    <div style="display:flex;gap:8px;margin-bottom:8px">
      <input type="text" id="ed-search" placeholder="Buscar carta..." style="flex:1;padding:9px 12px;font-size:13px" autocomplete="off">
    </div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <button class="fb active" id="fb-col" onclick="setDeckSrc('collection',this)">Da coleção</button>
      <button class="fb" id="fb-glob" onclick="setDeckSrc('global',this)">Busca global</button>
    </div>
    <div id="ed-results" style="max-height:220px;overflow-y:auto"></div>
  </div>

  <!-- Cards do deck -->
  <div class="card" id="ed-deck-box">
    <div class="empty">Adicione cartas acima.</div>
  </div>

  <!-- Aviso ilegal -->
  <div id="ed-illegal-warn" style="display:none;background:#FCEBEB;border-radius:8px;padding:10px 12px;font-size:12px;color:#A32D2D;margin-top:8px"></div>

  <!-- Botão comparar -->
  <button class="btn btn-primary" style="width:100%;margin-top:10px;padding:12px" onclick="openCompareView()">
    ⚔️ Comparar com campeões do meta
  </button>
</div>

<!-- COMPARE VIEW -->
<div id="dm-compare-view" style="display:none">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <button class="btn btn-sm" onclick="backToEditor()" style="padding:6px 10px">← Voltar ao deck</button>
    <div style="font-size:14px;font-weight:600;color:#111" id="cmp-deck-title"></div>
  </div>

  <!-- Resumo do deck -->
  <div id="cmp-summary"></div>

  <!-- Seletor de deck meta -->
  <div style="font-size:12px;font-weight:600;color:#111;margin:14px 0 8px">🏆 Selecionar deck campeão para detalhar:</div>
  <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px" id="meta-selector"></div>

  <!-- Ranking geral -->
  <div style="font-size:12px;font-weight:600;color:#111;margin-bottom:8px">📊 Similaridade com todo o meta</div>
  <div id="cmp-ranking"></div>

  <!-- Detalhe do deck selecionado -->
  <div id="cmp-detail" style="display:none">
    <div style="font-size:12px;font-weight:600;color:#111;margin:14px 0 8px">🔍 Análise detalhada</div>
    <div id="cmp-detail-content"></div>
  </div>
</div>
`;
}

// ── LISTA DE DECKS ─────────────────────────────────────────────────────────────
function renderDeckList() {
  document.getElementById('dm-count').textContent = savedDecks.length;
  const el = document.getElementById('dm-deck-cards');
  const empty = document.getElementById('dm-empty');
  if(!savedDecks.length) { el.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  el.innerHTML = savedDecks.map((d,i) => {
    const total = d.cards.reduce((s,c)=>s+c.qty,0);
    const legal = d.cards.every(c=>c.legal);
    const pkmn = d.cards.filter(c=>c.supertype==='Pokémon').reduce((s,c)=>s+c.qty,0);
    const trainer = d.cards.filter(c=>c.supertype==='Trainer').reduce((s,c)=>s+c.qty,0);
    const energy = d.cards.filter(c=>c.supertype==='Energy').reduce((s,c)=>s+c.qty,0);
    // Best meta match
    const names = d.cards.map(c=>c.name.toLowerCase());
    const bestMatch = META_DECKS.map(m=>{
      const pct=Math.round(m.keyCards.filter(k=>names.some(n=>n.includes(k))).length/m.keyCards.length*100);
      return{...m,pct};
    }).sort((a,b)=>b.pct-a.pct)[0];

    return `<div style="background:#fff;border-radius:12px;border:1px solid #e8e8e0;padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
        <div>
          <div style="font-size:15px;font-weight:700;color:#111">${esc(d.name||'Deck sem nome')}</div>
          <div style="font-size:11px;color:#888;margin-top:2px">
            ${total} cartas · <span style="color:${total===60?'#3B6D11':'#854F0B'}">${total===60?'✓ completo':total+'/60'}</span>
            ${!legal?'· <span style="color:#A32D2D">⚠ ilegais</span>':''}
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-sm" style="padding:5px 10px;font-size:12px" onclick="editDeck(${i})">✏️ Editar</button>
          <button class="btn btn-danger btn-sm" style="padding:5px 10px;font-size:12px" onclick="deleteDeck(${i})">🗑</button>
        </div>
      </div>
      <div style="display:flex;gap:6px;margin-bottom:8px">
        <span class="badge bb">P:${pkmn}</span>
        <span class="badge by">T:${trainer}</span>
        <span class="badge bg">E:${energy}</span>
        ${bestMatch.pct>0?`<span class="badge" style="background:${bestMatch.color}20;color:${bestMatch.color}">${bestMatch.emoji} ${bestMatch.name} ${bestMatch.pct}%</span>`:''}
      </div>
      <!-- Mini preview de cartas -->
      <div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:2px">
        ${d.cards.slice(0,8).map(c=>c.img?`<img src="${esc(c.img)}" style="width:32px;height:45px;object-fit:contain;border-radius:4px;background:#f4f4f0;flex-shrink:0" loading="lazy">`:'').join('')}
        ${d.cards.length>8?`<div style="width:32px;height:45px;background:#f4f4f0;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#888;flex-shrink:0">+${d.cards.length-8}</div>`:''}
      </div>
      <button class="btn btn-primary" style="width:100%;margin-top:10px;padding:9px;font-size:13px" onclick="compareDeck(${i})">
        ⚔️ Comparar com meta
      </button>
    </div>`;
  }).join('');
}

// ── NOVO / EDITAR DECK ────────────────────────────────────────────────────────
function openNewDeck() {
  currentDeckId = null;
  currentDeckCards = [];
  document.getElementById('dm-deck-name').value = '';
  showView('editor');
  renderEditor();
}

function editDeck(i) {
  currentDeckId = i;
  currentDeckCards = JSON.parse(JSON.stringify(savedDecks[i].cards));
  document.getElementById('dm-deck-name').value = savedDecks[i].name || '';
  showView('editor');
  renderEditor();
}

function deleteDeck(i) {
  if(!confirm(`Excluir "${savedDecks[i].name||'este deck'}"?`)) return;
  savedDecks.splice(i,1);
  saveDecksToDB();
  renderDeckList();
}

function saveDeck() {
  const name = document.getElementById('dm-deck-name').value.trim() || 'Deck sem nome';
  const deck = { name, cards: currentDeckCards, updatedAt: Date.now() };
  if(currentDeckId !== null) { savedDecks[currentDeckId] = deck; }
  else { savedDecks.push(deck); currentDeckId = savedDecks.length-1; }
  saveDecksToDB();
  showToast(`"${name}" salvo!`);
  renderDeckList();
}

function backToList() {
  showView('list');
  renderDeckList();
}

function backToEditor() {
  showView('editor');
}

function showView(v) {
  document.getElementById('dm-list-view').style.display = v==='list'?'block':'none';
  document.getElementById('dm-editor-view').style.display = v==='editor'?'block':'none';
  document.getElementById('dm-compare-view').style.display = v==='compare'?'block':'none';
}

// ── EDITOR ─────────────────────────────────────────────────────────────────────
function renderEditor() {
  const total = currentDeckCards.reduce((s,c)=>s+c.qty,0);
  const pkmn  = currentDeckCards.filter(c=>c.supertype==='Pokémon').reduce((s,c)=>s+c.qty,0);
  const tr    = currentDeckCards.filter(c=>c.supertype==='Trainer').reduce((s,c)=>s+c.qty,0);
  const en    = currentDeckCards.filter(c=>c.supertype==='Energy').reduce((s,c)=>s+c.qty,0);

  const tc = document.getElementById('ed-total');
  if(tc){ tc.textContent=total; tc.style.color=total===60?'#3B6D11':total>60?'#A32D2D':'#111'; }
  setEl('ed-pokemon',pkmn); setEl('ed-trainer',tr); setEl('ed-energy',en);

  const illegal = currentDeckCards.filter(c=>!c.legal);
  const warn = document.getElementById('ed-illegal-warn');
  if(warn){ warn.style.display=illegal.length?'block':'none'; warn.textContent=`⚠️ Cartas rotacionadas: ${illegal.map(c=>c.name).join(', ')}`; }

  const box = document.getElementById('ed-deck-box');
  if(!box) return;
  if(!currentDeckCards.length){ box.innerHTML='<div class="empty">Adicione cartas acima.</div>'; return; }

  const groups = {'Pokémon':[],'Trainer':[],'Energy':[],'Outro':[]};
  currentDeckCards.forEach(c=>{ const g=groups[c.supertype]||groups['Outro']; g.push(c); });
  const colors = {'Pokémon':'#185FA5','Trainer':'#854F0B','Energy':'#3B6D11','Outro':'#555'};

  box.innerHTML = Object.entries(groups).filter(([,arr])=>arr.length).map(([type,arr])=>{
    const typeTotal = arr.reduce((s,c)=>s+c.qty,0);
    arr.sort((a,b)=>a.name.localeCompare(b.name));
    return `<div style="margin-bottom:12px">
      <div style="font-size:10px;font-weight:600;color:${colors[type]};text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px">${type} (${typeTotal})</div>
      ${arr.map(c=>`
        <div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f8f8f8">
          ${c.img?`<img src="${esc(c.img)}" style="width:30px;height:42px;object-fit:contain;border-radius:3px;background:#f4f4f0" loading="lazy">`:'<div style="width:30px;height:42px;background:#f4f4f0;border-radius:3px"></div>'}
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</div>
            <div style="font-size:10px;color:#888">${esc(c.setName||'')}${c.num?' · '+c.num:''} <span style="color:${c.legal?'#3B6D11':'#A32D2D'}">${c.legal?'✓':'✗ rot.'}</span></div>
          </div>
          <div class="qty-ctrl">
            <button class="qb" style="width:26px;height:26px;font-size:15px" onclick="edChgQty('${c.id}',-1)">−</button>
            <span class="qn" style="font-size:13px;min-width:20px">${c.qty}</span>
            <button class="qb" style="width:26px;height:26px;font-size:15px" onclick="edChgQty('${c.id}',1)">+</button>
          </div>
        </div>`).join('')}
    </div>`;
  }).join('');
}

function edChgQty(id, d) {
  const c = currentDeckCards.find(c=>c.id===id);
  if(!c) return;
  c.qty = Math.max(0,c.qty+d);
  if(c.qty===0) currentDeckCards = currentDeckCards.filter(x=>x.id!==id);
  renderEditor();
}

function edAddCard(encoded) {
  const c = dec(encoded);
  const ex = currentDeckCards.find(x=>x.id===c.id);
  if(ex){ ex.qty++; } else { currentDeckCards.push({...c,qty:1}); }
  renderEditor();
  edSearch(); // refresh counts in results
}

// ── BUSCA NO EDITOR ────────────────────────────────────────────────────────────
function setDeckSrc(mode, btn) {
  deckFilterMode = mode;
  document.querySelectorAll('#dm-editor-view .fb').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  edSearch();
}

let edTimer = null;
document.addEventListener('input', function(e){
  if(e.target.id==='ed-search'){ clearTimeout(edTimer); edTimer=setTimeout(edSearch,400); }
});

function edSearch() {
  const q = (document.getElementById('ed-search')||{}).value;
  if(!q||!q.trim()){ const r=document.getElementById('ed-results'); if(r)r.innerHTML=''; return; }
  const qt = q.trim().toLowerCase();
  const el = document.getElementById('ed-results');
  if(!el) return;

  if(deckFilterMode==='collection') {
    const found = collection.filter(c=>c.name.toLowerCase().includes(qt)).slice(0,12);
    if(!found.length){ el.innerHTML='<div style="font-size:12px;color:#aaa;padding:8px">Nada na coleção. Tente "Busca global".</div>'; return; }
    el.innerHTML = found.map(c=>{
      const inDeck = currentDeckCards.find(d=>d.id===c.id);
      return resultRow(enc({id:c.id,name:c.name,img:c.img||'',supertype:c.supertype||'',subtypes:c.subtypes||'',legal:c.legal,setName:c.setName||'',num:c.num||''}), c.name, c.setName, inDeck?inDeck.qty:0, c.legal, 'Da coleção: '+c.qty+'×');
    }).join('');
  } else {
    el.innerHTML='<div style="font-size:12px;color:#aaa;padding:8px">Buscando...</div>';
    fetch(`https://api.pokemontcg.io/v2/cards?q=name:"${encodeURIComponent(q.trim())}"&pageSize=12&orderBy=-set.releaseDate`)
      .then(r=>r.json()).then(d=>{
        if(!d.data||!d.data.length){el.innerHTML='<div style="font-size:12px;color:#aaa;padding:8px">Sem resultados.</div>';return;}
        el.innerHTML = d.data.map(c=>{
          const img=c.images?(c.images.small||''):'';
          const legal=c.legalities&&c.legalities.standard==='Legal';
          const inDeck=currentDeckCards.find(dc=>dc.id===c.id);
          return resultRow(enc({id:c.id,name:c.name,img,supertype:c.supertype||'',subtypes:(c.subtypes||[]).join(', '),legal,setName:c.set?c.set.name:'',num:c.number||'',imgLarge:c.images?(c.images.large||img):''}),c.name,c.set?c.set.name:'',inDeck?inDeck.qty:0,legal,'');
        }).join('');
      }).catch(()=>{el.innerHTML='<div style="font-size:12px;color:#aaa;padding:8px">Erro de conexão.</div>';});
  }
}

function resultRow(encoded, name, setName, inDeck, legal, extra) {
  const c = dec(encoded);
  return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #f4f4f0">
    ${c.img?`<img src="${esc(c.img)}" style="width:32px;height:45px;object-fit:contain;border-radius:4px;background:#f4f4f0" loading="lazy">`:'<div style="width:32px;height:45px;background:#f4f4f0;border-radius:4px"></div>'}
    <div style="flex:1;min-width:0">
      <div style="font-size:12px;font-weight:600;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(name)}</div>
      <div style="font-size:10px;color:#888">${esc(setName||'')} · <span style="color:${legal?'#3B6D11':'#A32D2D'}">${legal?'Legal':'Rot.'}</span>${extra?' · '+extra:''}</div>
    </div>
    <button class="btn btn-${inDeck?'success':'primary'} btn-sm" style="padding:5px 12px;font-size:11px;flex-shrink:0" onclick="edAddCard(${encoded})">
      ${inDeck?`+1 (${inDeck})`:'+'}
    </button>
  </div>`;
}

// ── COMPARE ───────────────────────────────────────────────────────────────────
function compareDeck(i) {
  currentDeckId = i;
  currentDeckCards = JSON.parse(JSON.stringify(savedDecks[i].cards));
  openCompareView();
  // also go to deck tab
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  document.getElementById('nav-decks-btn').classList.add('active');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('tab-deckman').classList.add('active');
}

function openCompareView() {
  compareTarget = null;
  showView('compare');
  const name = currentDeckId!==null ? (savedDecks[currentDeckId]?.name||'Meu Deck') : (document.getElementById('dm-deck-name')?.value||'Meu Deck');
  setEl('cmp-deck-title', name);
  buildCompare();
}

function buildCompare() {
  const names = currentDeckCards.map(c=>c.name.toLowerCase());
  const total = currentDeckCards.reduce((s,c)=>s+c.qty,0);
  const illegal = currentDeckCards.filter(c=>!c.legal);

  // Summary
  const scores = META_DECKS.map(m=>{
    const kH = m.keyCards.filter(k=>names.some(n=>n.includes(k)));
    const oH = m.optionalCards.filter(k=>names.some(n=>n.includes(k)));
    const pct = Math.round(kH.length/m.keyCards.length*100);
    return{...m,kH,oH,pct};
  }).sort((a,b)=>b.pct-a.pct);

  const best = scores[0];

  document.getElementById('cmp-summary').innerHTML = `
    <div style="background:#fff;border-radius:12px;border:2px solid ${best.color};padding:14px;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="font-size:28px">${best.emoji}</div>
        <div style="flex:1">
          <div style="font-size:11px;color:#888">Seu deck mais se parece com:</div>
          <div style="font-size:15px;font-weight:700">${best.name}</div>
          <div style="font-size:10px;color:#888">${best.placement}</div>
        </div>
        <span class="badge" style="background:${best.color}22;color:${best.color};font-size:15px;padding:5px 12px">${best.pct}%</span>
      </div>
      <div class="meter-bg"><div class="meter-fill" style="width:${best.pct}%;background:${best.color}"></div></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px">
        <div style="background:#f8f8f8;border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:${total===60?'#3B6D11':total>60?'#A32D2D':'#854F0B'}">${total}</div>
          <div style="font-size:10px;color:#888">${total===60?'✓ 60/60':total+'/60'}</div>
        </div>
        <div style="background:#f8f8f8;border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700;color:${illegal.length?'#A32D2D':'#3B6D11'}">${illegal.length||'✓'}</div>
          <div style="font-size:10px;color:#888">${illegal.length?'ilegais':'100% legal'}</div>
        </div>
        <div style="background:#f8f8f8;border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:18px;font-weight:700">${best.tier}</div>
          <div style="font-size:10px;color:#888">Tier</div>
        </div>
      </div>
    </div>`;

  // Meta selector chips
  document.getElementById('meta-selector').innerHTML = scores.map(m=>`
    <button onclick="selectMetaDeck('${m.id}')" id="ms-${m.id}"
      style="flex-shrink:0;padding:6px 12px;border-radius:20px;border:1.5px solid ${m.color};background:transparent;color:${m.color};font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;font-family:inherit;transition:all .15s">
      ${m.emoji} ${m.name} <span style="opacity:.7">${m.pct}%</span>
    </button>`).join('');

  // Ranking
  document.getElementById('cmp-ranking').innerHTML = scores.map(m=>`
    <div style="background:#fff;border-radius:10px;border:1px solid #e8e8e0;padding:11px 13px;margin-bottom:8px;cursor:pointer" onclick="selectMetaDeck('${m.id}')">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
        <span style="font-size:18px">${m.emoji}</span>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:600">${m.name}</div>
          <div style="font-size:10px;color:#888">${m.placement} · ${m.metaShare}% meta share</div>
        </div>
        <span class="badge ${m.pct>=70?'bg':m.pct>=40?'by':'br'}" style="font-size:13px;padding:3px 10px">${m.pct}%</span>
        <span class="badge" style="background:${m.color}22;color:${m.color}">Tier ${m.tier}</span>
      </div>
      <div class="meter-bg"><div class="meter-fill" style="width:${m.pct}%;background:${m.color}"></div></div>
      <div style="font-size:10px;color:#888;margin-top:3px">✓ ${m.kH.length}/${m.keyCards.length} chave · ${m.oH.length}/${m.optionalCards.length} suporte · Toque para detalhar</div>
    </div>`).join('');

  document.getElementById('cmp-detail').style.display='none';
}

function selectMetaDeck(id) {
  compareTarget = id;
  // highlight chip
  document.querySelectorAll('#meta-selector button').forEach(b=>{
    const m = META_DECKS.find(x=>x.id===b.id.replace('ms-',''));
    if(!m) return;
    b.style.background = b.id===`ms-${id}` ? m.color : 'transparent';
    b.style.color = b.id===`ms-${id}` ? '#fff' : m.color;
  });
  renderMetaDetail(id);
}

function renderMetaDetail(id) {
  const m = META_DECKS.find(x=>x.id===id);
  if(!m) return;
  const names = currentDeckCards.map(c=>c.name.toLowerCase());
  const kH = m.keyCards.filter(k=>names.some(n=>n.includes(k)));
  const kM = m.keyCards.filter(k=>!names.some(n=>n.includes(k)));
  const oH = m.optionalCards.filter(k=>names.some(n=>n.includes(k)));
  const oM = m.optionalCards.filter(k=>!names.some(n=>n.includes(k)));
  const pct = Math.round(kH.length/m.keyCards.length*100);

  const detail = document.getElementById('cmp-detail');
  detail.style.display='block';
  detail.scrollIntoView({behavior:'smooth',block:'start'});

  document.getElementById('cmp-detail-content').innerHTML = `
    <div style="background:#fff;border-radius:12px;border:1.5px solid ${m.color};padding:14px;margin-bottom:10px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        <div style="font-size:28px">${m.emoji}</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700">${m.name}</div>
          <div style="font-size:11px;color:#888">${m.placement}</div>
          <div style="font-size:11px;color:#888">${m.event}</div>
        </div>
        <span class="badge" style="background:${m.color}22;color:${m.color};font-size:16px;padding:5px 14px">${pct}%</span>
      </div>
      <div style="font-size:12px;color:#555;line-height:1.6;margin-bottom:10px">${m.desc}</div>
      <div class="meter-bg"><div class="meter-fill" style="width:${pct}%;background:${m.color}"></div></div>

      <!-- Cartas chave que tem -->
      ${kH.length?`<div style="margin-top:10px">
        <div style="font-size:10px;font-weight:600;color:#3B6D11;margin-bottom:5px">✅ CARTAS-CHAVE QUE VOCÊ TEM (${kH.length}/${m.keyCards.length})</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">${kH.map(k=>`<span class="badge bg" style="font-size:10px">${k}</span>`).join('')}</div>
      </div>`:''}

      <!-- Cartas chave faltando -->
      ${kM.length?`<div style="margin-top:8px">
        <div style="font-size:10px;font-weight:600;color:#A32D2D;margin-bottom:5px">🛒 CARTAS-CHAVE FALTANDO (${kM.length})</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">${kM.map(k=>`<span class="badge br" style="font-size:10px">${k}</span>`).join('')}</div>
      </div>`:'<div style="background:#EAF3DE;border-radius:8px;padding:8px 12px;font-size:12px;color:#3B6D11;margin-top:8px">✅ Você tem todas as cartas-chave deste deck!</div>'}

      <!-- Suporte que tem -->
      ${oH.length?`<div style="margin-top:8px">
        <div style="font-size:10px;font-weight:600;color:#185FA5;margin-bottom:5px">🔵 SUPORTE QUE VOCÊ TEM (${oH.length}/${m.optionalCards.length})</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">${oH.map(k=>`<span class="badge bb" style="font-size:10px">${k}</span>`).join('')}</div>
      </div>`:''}

      <!-- Suporte faltando -->
      ${oM.length?`<div style="margin-top:8px">
        <div style="font-size:10px;font-weight:600;color:#888;margin-bottom:5px">⚪ SUPORTE OPCIONAL FALTANDO</div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">${oM.map(k=>`<span class="badge bgr" style="font-size:10px">${k}</span>`).join('')}</div>
      </div>`:''}

      <!-- Forças e fraquezas -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
        <div style="background:#EAF3DE;border-radius:8px;padding:10px">
          <div style="font-size:10px;font-weight:600;color:#3B6D11;margin-bottom:5px">💪 PONTOS FORTES</div>
          ${m.strengths.map(s=>`<div style="font-size:11px;color:#555;margin-bottom:2px">• ${s}</div>`).join('')}
        </div>
        <div style="background:#FCEBEB;border-radius:8px;padding:10px">
          <div style="font-size:10px;font-weight:600;color:#A32D2D;margin-bottom:5px">⚠️ PONTOS FRACOS</div>
          ${m.weaknesses.map(w=>`<div style="font-size:11px;color:#555;margin-bottom:2px">• ${w}</div>`).join('')}
        </div>
      </div>

      <!-- Meta share -->
      <div style="background:#EEEDFE;border-radius:8px;padding:10px 12px;margin-top:10px;font-size:11px;color:#3C3489;line-height:1.6">
        <strong>Meta share NAIC 2026:</strong> ${m.metaShare}% · <strong>Tier:</strong> ${m.tier}<br>
        <strong>Fonte:</strong> Limitless TCG — NAIC 2026, New Orleans (10 jun 2026, 3.752 jogadores)
      </div>
    </div>`;
}

// ── HELPERS ────────────────────────────────────────────────────────────────────
function setEl(id, val) { const e=document.getElementById(id); if(e) e.textContent=val; }

window.addEventListener('DOMContentLoaded', initDeckManager);
