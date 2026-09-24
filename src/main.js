import { createClient } from '@supabase/supabase-js';
import './style.css';
import './program-images.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mchmcfumipqdztrllllm.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_VpgdWN306akpbeZ67B3nBw_-0_0DkMt';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const state = { offers: [], programs: [], editing: null, filters: { origin:'', destination:'', program:'', cabin:'' } };

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const fmt = n => Number(n || 0).toLocaleString('pt-BR');
const toast = (msg, type='ok') => { const el=document.createElement('div'); el.className='toast '+type; el.textContent=msg; document.body.appendChild(el); setTimeout(()=>el.remove(),2800); };

function shell() {
  document.querySelector('#app').innerHTML = `
    <div class="app">
      <aside class="sidebar">
        <div class="brand"><img class="brand-logo" src="/logo-mark.svg" alt="Fabricante de Milhas"><div class="brand-copy"><strong>Fabricante</strong><span>de Milhas</span></div></div>
        <nav>
          <button class="nav active" data-view="dashboard">◈ <span>Dashboard</span></button>
          <button class="nav" data-view="offers">▤ <span>Ofertas</span></button>
          <button class="nav" data-view="routes">⌁ <span>Rotas</span></button>
        </nav>
        <div class="sidebar-foot"><span id="userEmail"></span><button id="logout" class="logout">Sair</button></div>
      </aside>
      <main class="main">
        <header class="topbar"><div><div class="eyebrow">FABRICANTE DE MILHAS</div><h1 id="pageTitle">Dashboard</h1></div><button id="newOffer" class="primary">＋ Nova oferta</button></header>
        <section id="content"></section>
      </main>
    </div>
    <div id="modalRoot"></div>
  `;
  document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>navigate(b.dataset.view));
  document.querySelector('#newOffer').onclick=()=>openForm();
  document.querySelector('#logout').onclick=async()=>{await supabase.auth.signOut(); renderLogin();};
}

async function loadPrograms(){ const {data,error}=await supabase.from('flight_programs').select('id,name').eq('active',true).order('name'); if(!error) state.programs=data||[]; }

async function loadOffers(){
  const {data,error}=await supabase.from('v_flight_offer_history').select('*').order('recorded_at',{ascending:false});
  if(error){toast(error.message,'error'); return;}
  state.offers=data||[];
}

function renderDashboard(){
  const o=state.offers, miles=o.map(x=>x.miles).filter(Boolean);
  const min=miles.length?Math.min(...miles):0;
  const routes=new Set(o.map(x=>x.origin+'-'+x.destination)).size;
  const programs=new Set(o.map(x=>x.program).filter(Boolean)).size;
  const avg=miles.length?Math.round(miles.reduce((a,b)=>a+b,0)/miles.length):0;
  const recent=o.slice(0,8);
  document.querySelector('#content').innerHTML=`
    <div class="kpis">
      <div class="kpi"><span>Total de ofertas</span><b>${fmt(o.length)}</b><small>histórico armazenado</small></div>
      <div class="kpi"><span>Menor emissão</span><b>${fmt(min)}</b><small>milhas</small></div>
      <div class="kpi"><span>Média</span><b>${fmt(avg)}</b><small>milhas por oferta</small></div>
      <div class="kpi"><span>Rotas</span><b>${fmt(routes)}</b><small>combinações únicas</small></div>
      <div class="kpi"><span>Programas</span><b>${fmt(programs)}</b><small>programas ativos</small></div>
    </div>
    <div class="grid-2">
      <div class="panel recent-offers-panel"><div class="panel-head"><div><h2>Últimas ofertas</h2><p>Registros mais recentes</p></div><button class="ghost" onclick="navigate('offers')">Ver todas</button></div>
        <div class="recent-offers-desktop table-wrap"><table><thead><tr><th>Rota</th><th>Programa</th><th>Classe</th><th>Milhas</th></tr></thead><tbody>${recent.map(row=>'<tr><td><strong>'+esc(row.origin)+' → '+esc(row.destination)+'</strong></td><td>'+esc(row.program)+'</td><td>'+esc(row.cabin)+'</td><td class="miles">'+fmt(row.miles)+'</td></tr>').join('')}</tbody></table></div>
        <div class="recent-offers-mobile">${recent.map(row=>'<article class="recent-offer-card"><div class="recent-offer-head"><div class="recent-offer-route"><strong>'+esc(row.origin)+'</strong><span>→</span><strong>'+esc(row.destination)+'</strong></div><div class="recent-offer-miles"><strong>'+fmt(row.miles)+'</strong><small>milhas</small></div></div><div class="recent-offer-meta"><span class="recent-program" data-program-cell="true">'+esc(row.program)+'</span><span class="recent-cabin">'+esc(row.cabin||'Classe não informada')+'</span></div></article>').join('')}</div>
      </div>      <div class="panel"><div class="panel-head"><div><h2>Rotas em destaque</h2><p>Menores emissões registradas</p></div><button class="ghost" onclick="navigate('routes')">Explorar</button></div>
        <div class="route-list">${routeSummary().slice(0,7).map(r=>`<div class="route"><div><strong>${esc(r.origin)} → ${esc(r.destination)}</strong><span>${r.count} ofertas</span></div><b>${fmt(r.min)} <small>milhas</small></b></div>`).join('')}</div>
      </div>
    </div>`;
}

function routeSummary(){
 const map=new Map();
 for(const x of state.offers){const k=x.origin+'-'+x.destination;const r=map.get(k)||{origin:x.origin,destination:x.destination,count:0,min:Infinity};r.count++;r.min=Math.min(r.min,x.miles||Infinity);map.set(k,r);}
 return [...map.values()].sort((a,b)=>a.min-b.min);
}

function filteredOffers(){
 const f=state.filters;
 const origin=f.origin.trim().toUpperCase();
 const destination=f.destination.trim().toUpperCase();
 return state.offers.filter(x=>
   (!origin||String(x.origin||'').toUpperCase().includes(origin))&&
   (!destination||String(x.destination||'').toUpperCase().includes(destination))&&
   (!f.program||x.program===f.program)&&
   (!f.cabin||x.cabin===f.cabin)
 );
}

function getBestOffer(rows){
 const valid=rows.filter(x=>Number.isFinite(Number(x.miles))&&Number(x.miles)>0);
 if(!valid.length)return null;
 return [...valid].sort((a,b)=>{
   const miles=Number(a.miles)-Number(b.miles);
   if(miles!==0)return miles;
   return new Date(b.recorded_at||0)-new Date(a.recorded_at||0);
 })[0];
}

function renderBestOffer(rows){
 const box=document.querySelector('#bestOffer');
 if(!box)return;
 const routeActive=state.filters.origin&&state.filters.destination;
 const best=getBestOffer(rows);
 if(!routeActive||!best){
   box.hidden=true;
   box.innerHTML='';
   return;
 }
 box.hidden=false;
 box.innerHTML=
   '<div class="best-offer-badge">★ MELHOR OPÇÃO ENCONTRADA</div>'+
   '<div class="best-offer-main">'+
     '<div class="best-offer-route"><span>'+esc(best.origin)+'</span><b>→</b><span>'+esc(best.destination)+'</span></div>'+
     '<div class="best-offer-program"><strong>'+esc(best.program)+'</strong><span>'+esc(best.cabin||'Classe não informada')+'</span></div>'+
     '<div class="best-offer-miles"><strong>'+fmt(best.miles)+'</strong><span>milhas</span></div>'+
   '</div>'+
   '<div class="best-offer-details">'+
     '<span><b>Meses:</b> '+esc(best.available_months||'Não informado')+'</span>'+
     '<span><b>Ida:</b> '+esc(best.outbound_dates||'Não informado')+'</span>'+
     '<span><b>Volta:</b> '+esc(best.return_dates||'Não informado')+'</span>'+
   '</div>'+
   '<div class="best-offer-note">Critério: menor quantidade de milhas entre as ofertas encontradas para esta rota.</div>';
}

function renderOfferRows(rows){
 const body=document.querySelector('#offersBody');
 const mobile=document.querySelector('#offersMobile');
 const count=document.querySelector('#resultCount');
 if(!body||!count)return;
 count.textContent=rows.length+' registros';
 renderBestOffer(rows);

 if(!rows.length){
   body.innerHTML='<tr><td colspan="8" class="empty-cell">Nenhuma oferta encontrada para os filtros informados.</td></tr>';
   if(mobile)mobile.innerHTML='<div class="empty-offers">Nenhuma oferta encontrada para os filtros informados.</div>';
   return;
 }

 body.innerHTML=rows.map(x=>'<tr><td><strong>'+esc(x.origin)+' → '+esc(x.destination)+'</strong></td><td>'+esc(x.program)+'</td><td>'+esc(x.cabin)+'</td><td class="miles">'+fmt(x.miles)+'</td><td>'+esc(x.available_months)+'</td><td>'+esc(x.outbound_dates)+'</td><td>'+esc(x.return_dates)+'</td><td class="actions"><button class="icon" onclick="editOffer(\''+x.id+'\')" aria-label="Editar oferta">✎</button><button class="icon danger" onclick="deleteOffer(\''+x.id+'\')" aria-label="Excluir oferta">⌫</button></td></tr>').join('');

 if(mobile){
   mobile.innerHTML=rows.map(x=>
     '<article class="offer-card">'+
       '<div class="offer-card-top">'+
         '<div class="offer-card-route"><strong>'+esc(x.origin)+'</strong><span>→</span><strong>'+esc(x.destination)+'</strong></div>'+
         '<div class="offer-card-miles"><strong>'+fmt(x.miles)+'</strong><small>milhas</small></div>'+
       '</div>'+
       '<div class="offer-card-program"><strong>'+esc(x.program)+'</strong><span>'+esc(x.cabin)+'</span></div>'+
       '<div class="offer-card-details">'+
         '<div><small>MESES</small><span>'+esc(x.available_months||'—')+'</span></div>'+
         '<div><small>IDA</small><span>'+esc(x.outbound_dates||'—')+'</span></div>'+
         '<div><small>VOLTA</small><span>'+esc(x.return_dates||'—')+'</span></div>'+
       '</div>'+
       '<div class="offer-card-actions">'+
         '<button class="icon" onclick="editOffer(\''+x.id+'\')">✎ Editar</button>'+
         '<button class="icon danger" onclick="deleteOffer(\''+x.id+'\')">⌫ Excluir</button>'+
       '</div>'+
     '</article>'
   ).join('');
 }
}
function renderOffers(){
 const f=state.filters;
 document.querySelector('#content').innerHTML=`
 <div class="offers-toolbar">
   <div class="route-search">
     <div class="route-field">
       <label for="originSearch">PARTIDA</label>
       <span class="route-field-icon">⇥</span>
       <input id="originSearch" type="text" inputmode="text" autocomplete="off" maxlength="3" placeholder="Ex.: FOR" value="${esc(f.origin)}" aria-label="Aeroporto de partida">
     </div>
     <div class="route-arrow" aria-hidden="true">→</div>
     <div class="route-field">
       <label for="destinationSearch">DESTINO</label>
       <span class="route-field-icon">⇥</span>
       <input id="destinationSearch" type="text" inputmode="text" autocomplete="off" maxlength="3" placeholder="Ex.: MAD" value="${esc(f.destination)}" aria-label="Aeroporto de destino">
     </div>
     <button id="routeSearchButton" class="route-search-button" type="button">Buscar</button>
     <button id="clearRouteSearch" class="search-clear route-clear" type="button" aria-label="Limpar partida e destino" ${f.origin||f.destination?'':'hidden'}>×</button>
   </div>
   <div class="filter-row">
     <select id="programFilter" aria-label="Filtrar por programa"><option value="">Todos os programas</option>${state.programs.map(p=>`<option ${f.program===p.name?'selected':''}>${esc(p.name)}</option>`).join('')}</select>
     <select id="cabinFilter" aria-label="Filtrar por classe"><option value="">Todas as classes</option><option ${f.cabin==='Econômica'?'selected':''}>Econômica</option><option ${f.cabin==='Executiva'?'selected':''}>Executiva</option></select>
     <span id="resultCount" class="result-count">${filteredOffers().length} registros</span>
   </div>
 </div>
 <div id="bestOffer" class="best-offer" hidden></div>
 <div class="panel offers-panel">
   <div class="table-wrap desktop-offers"><table class="offers"><thead><tr><th>Rota</th><th>Programa</th><th>Classe</th><th>Milhas</th><th>Meses</th><th>Datas ida</th><th>Datas volta</th><th></th></tr></thead><tbody id="offersBody"></tbody></table></div>
   <div id="offersMobile" class="offers-mobile"></div>
 </div>`;
 renderOfferRows(filteredOffers());
 const originInput=document.querySelector('#originSearch');
 const destinationInput=document.querySelector('#destinationSearch');
 const clear=document.querySelector('#clearRouteSearch');
 const applyRouteSearch=()=>{
   state.filters.origin=originInput.value.trim().toUpperCase();
   state.filters.destination=destinationInput.value.trim().toUpperCase();
   if(!state.filters.origin||!state.filters.destination){
     toast('Informe a partida e o destino.','error');
     return;
   }
   originInput.value=state.filters.origin;
   destinationInput.value=state.filters.destination;
   clear.hidden=false;
   renderOfferRows(filteredOffers());
 };
 originInput.oninput=e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);};
 destinationInput.oninput=e=>{e.target.value=e.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,3);};
 originInput.onkeydown=e=>{if(e.key==='Enter')applyRouteSearch();};
 destinationInput.onkeydown=e=>{if(e.key==='Enter')applyRouteSearch();};
 document.querySelector('#routeSearchButton').onclick=applyRouteSearch;
 clear.onclick=()=>{state.filters.origin='';state.filters.destination='';originInput.value='';destinationInput.value='';clear.hidden=true;originInput.focus();renderOfferRows(filteredOffers());};
 document.querySelector('#programFilter').onchange=e=>{state.filters.program=e.target.value;renderOfferRows(filteredOffers());};
 document.querySelector('#cabinFilter').onchange=e=>{state.filters.cabin=e.target.value;renderOfferRows(filteredOffers());};
}
function renderRoutes(){
 const routes=routeSummary();
 document.querySelector('#content').innerHTML=`<div class="route-cards">${routes.map(r=>`<div class="route-card"><div class="route-code">${esc(r.origin)} <span>→</span> ${esc(r.destination)}</div><div class="route-stats"><div><span>Ofertas</span><b>${r.count}</b></div><div><span>Menor emissão</span><b>${fmt(r.min)}</b></div></div><button class="ghost full" onclick="state.filters.origin='${r.origin}';state.filters.destination='${r.destination}';navigate('offers')">Ver ofertas</button></div>`).join('')}</div>`;
}

window.navigate = view => {
 document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
 document.querySelector('#pageTitle').textContent={dashboard:'Dashboard',offers:'Ofertas',routes:'Rotas'}[view];
 document.querySelector('#newOffer').style.display=view==='routes'?'none':'inline-flex';
 if(view==='dashboard') renderDashboard(); if(view==='offers') renderOffers(); if(view==='routes') renderRoutes();
};

async function openForm(id=null){
 const existing=id?state.offers.find(x=>x.id===id):null;
 const airports=[...new Set(state.offers.flatMap(x=>[x.origin,x.destination]).filter(Boolean))].sort();
 document.querySelector('#modalRoot').innerHTML=`<div class="modal-bg"><div class="modal"><div class="modal-head"><div><div class="eyebrow">CRUD DE OFERTA</div><h2>${existing?'Editar oferta':'Nova oferta'}</h2></div><button class="close" onclick="closeModal()">×</button></div>
 <form id="offerForm" class="form-grid">
 <label>Origem<input name="origin" maxlength="3" required value="${esc(existing?.origin)}" placeholder="FOR"></label>
 <label>Destino<input name="destination" maxlength="3" required value="${esc(existing?.destination)}" placeholder="MAD"></label>
 <label>Programa<select name="program_id" required>${state.programs.map(p=>`<option value="${p.id}" ${p.name===existing?.program?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label>
 <label>Classe<select name="cabin"><option ${existing?.cabin==='Econômica'?'selected':''}>Econômica</option><option ${existing?.cabin==='Executiva'?'selected':''}>Executiva</option></select></label>
 <label>Milhas<input name="miles" type="number" min="1" required value="${existing?.miles||''}"></label>
 <label>Meses disponíveis<input name="available_months" value="${esc(existing?.available_months)}" placeholder="Out/2026"></label>
 <label>Datas de ida<input name="outbound_dates" value="${esc(existing?.outbound_dates)}" placeholder="15,18,22"></label>
 <label>Datas de volta<input name="return_dates" value="${esc(existing?.return_dates)}" placeholder="27,28,30"></label>
 <label class="check"><input name="availability" type="checkbox" ${existing?.availability!==false?'checked':''}> Disponível</label>
 <label class="wide">Observações<textarea name="observations">${esc(existing?.observations)}</textarea></label>
 <div class="form-actions"><button type="button" class="ghost" onclick="closeModal()">Cancelar</button><button class="primary" type="submit">Salvar oferta</button></div>
 </form></div></div>`;
 document.querySelector('#offerForm').onsubmit=async e=>{e.preventDefault();await saveOffer(new FormData(e.target),existing);};
}

async function getAirportId(iata){
 const code=String(iata||'').trim().toUpperCase();
 let {data}=await supabase.from('flight_airports').select('id').eq('iata',code).maybeSingle();
 if(data) return data.id;
 const ins=await supabase.from('flight_airports').insert({iata:code,active:true}).select('id').single();
 if(ins.error) throw ins.error; return ins.data.id;
}
async function saveOffer(fd,existing){
 try{
  const origin=String(fd.get('origin')).toUpperCase().trim(), destination=String(fd.get('destination')).toUpperCase().trim();
  if(!/^[A-Z]{3}$/.test(origin)||!/^[A-Z]{3}$/.test(destination)) throw new Error('Origem e destino devem ser IATA com 3 letras.');
  const origin_id=await getAirportId(origin), destination_id=await getAirportId(destination);
  const payload={origin_id,destination_id,program_id:fd.get('program_id'),cabin:fd.get('cabin'),miles:Number(fd.get('miles')),available_months:fd.get('available_months')||null,outbound_dates:fd.get('outbound_dates')||null,return_dates:fd.get('return_dates')||null,availability:fd.get('availability')==='on',observations:fd.get('observations')||null,source:'Web App',recorded_at:new Date().toISOString()};
  const q=existing?supabase.from('flight_offers').update(payload).eq('id',existing.id):supabase.from('flight_offers').insert(payload);
  const {error}=await q; if(error) throw error;
  closeModal(); await loadOffers(); toast(existing?'Oferta atualizada.':'Oferta cadastrada.'); navigate('offers');
 }catch(e){toast(e.message,'error');}
}
window.editOffer=id=>openForm(id);
window.deleteOffer=async id=>{if(!confirm('Excluir esta oferta?'))return;const {error}=await supabase.from('flight_offers').delete().eq('id',id);if(error)toast(error.message,'error');else{await loadOffers();toast('Oferta excluída.');renderOffers();}};
window.closeModal=()=>document.querySelector('#modalRoot').innerHTML='';

function renderLogin(){
 document.querySelector('#app').innerHTML=`<div class="login-page"><div class="login-card"><div class="brand centered"><img class="brand-logo login-logo" src="/logo-mark.svg" alt="Fabricante de Milhas"><div class="brand-copy"><strong>Fabricante</strong><span>de Milhas</span></div></div><p class="login-sub">Gestão de histórico de ofertas de passagens aéreas.</p><form id="login"><input name="email" type="email" placeholder="E-mail" required><input name="password" type="password" placeholder="Senha" required><button class="primary full" type="submit">Entrar</button></form><p class="login-help">Acesso protegido pelo Supabase Auth.</p></div></div>`;
 document.querySelector('#login').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const {error}=await supabase.auth.signInWithPassword({email:f.get('email'),password:f.get('password')});if(error)toast(error.message,'error');};
}

async function boot(){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session){renderLogin();return;}
 await loadPrograms(); await loadOffers(); shell(); document.querySelector('#userEmail').textContent=session.user.email||''; renderDashboard();
 supabase.auth.onAuthStateChange((_event,s)=>{if(!s)renderLogin();});
}
boot();
