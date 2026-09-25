(() => {
  'use strict';
  const TOKEN_KEY = 'sitesentry_admin_token';
  let token = localStorage.getItem(TOKEN_KEY) || '';
  let messages = [];
  let selected = null;

  const $ = id => document.getElementById(id);
  const loginView = $('loginView'), appView = $('appView');

  function api(url, options = {}) {
    options.headers = { ...(options.headers || {}), 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
    return fetch(url, options).then(async r => {
      if (r.status === 401) { logout(false); throw new Error('Unauthorized'); }
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Request failed');
      return data;
    });
  }

  function showApp() { loginView.classList.add('hidden'); appView.classList.remove('hidden'); loadMessages(); }
  function showLogin() { appView.classList.add('hidden'); loginView.classList.remove('hidden'); }
  function logout(clear = true) { if (clear && token) fetch('/api/admin/logout',{method:'POST',headers:{Authorization:`Bearer ${token}`}}).catch(()=>{}); token=''; localStorage.removeItem(TOKEN_KEY); showLogin(); }

  $('loginForm').addEventListener('submit', e => {
    e.preventDefault(); $('loginError').textContent = '';
    fetch('/api/admin/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:$('password').value})})
      .then(async r => { const d=await r.json(); if(!r.ok) throw new Error(d.error); return d; })
      .then(d => { token=d.token; localStorage.setItem(TOKEN_KEY, token); $('password').value=''; showApp(); })
      .catch(err => $('loginError').textContent = err.message || 'Login failed.');
  });
  $('logoutBtn').addEventListener('click', () => logout(true));
  $('refreshBtn').addEventListener('click', loadMessages);
  $('search').addEventListener('input', render);
  $('statusFilter').addEventListener('change', render);
  $('closeModal').addEventListener('click', closeModal);
  $('modal').addEventListener('click', e => { if(e.target.classList.contains('modal-backdrop')) closeModal(); });
  $('exportBtn').addEventListener('click', async () => {
    const r = await fetch('/api/admin/export.csv',{headers:{Authorization:`Bearer ${token}`}});
    if(!r.ok) return;
    const blob=await r.blob(); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='sitesentrylabs-messages.csv'; a.click(); URL.revokeObjectURL(a.href);
  });

  async function loadMessages() {
    try { messages = await api('/api/admin/messages'); render(); updateStats(); }
    catch (_) {}
  }
  function updateStats() {
    $('total').textContent=messages.length;
    $('newCount').textContent=messages.filter(m=>m.status==='new').length;
    $('readCount').textContent=messages.filter(m=>m.status==='read').length;
    const today=new Date().toDateString(); $('todayCount').textContent=messages.filter(m=>new Date(m.createdAt).toDateString()===today).length;
  }
  function escapeHTML(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function render() {
    const q=$('search').value.toLowerCase().trim(), status=$('statusFilter').value;
    const list=messages.filter(m => (status==='all'||m.status===status) && (!q || [m.fullName,m.email,m.company,m.service,m.message].join(' ').toLowerCase().includes(q)));
    $('empty').classList.toggle('hidden', list.length!==0);
    $('messageList').innerHTML=list.map(m=>`<div class="message-row">
      <div class="person"><strong>${escapeHTML(m.fullName)}</strong><small>${escapeHTML(m.company||'No company')}</small></div>
      <div class="cell">${escapeHTML(m.email)}<small>${escapeHTML(m.phone||'No phone')}</small></div>
      <div class="cell">${escapeHTML(m.service)}</div>
      <div class="cell"><span class="badge ${m.status}">${m.status}</span><small>${formatDate(m.createdAt)}</small></div>
      <div class="row-actions"><button class="icon-btn" data-view="${m.id}">View</button><button class="icon-btn" data-toggle="${m.id}">${m.status==='new'?'Read':'New'}</button><button class="icon-btn" data-delete="${m.id}">Delete</button></div>
    </div>`).join('');
    document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>openMessage(b.dataset.view));
    document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>toggleStatus(b.dataset.toggle));
    document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteMessage(b.dataset.delete));
  }
  function formatDate(s){return new Date(s).toLocaleString([], {dateStyle:'medium',timeStyle:'short'});}
  function openMessage(id){selected=messages.find(m=>m.id===id);if(!selected)return;$('modalContent').innerHTML=`<p class="eyebrow">Contact enquiry</p><h2>${escapeHTML(selected.fullName)}</h2><div class="detail-grid"><div class="detail"><label>Email</label><div>${escapeHTML(selected.email)}</div></div><div class="detail"><label>Phone</label><div>${escapeHTML(selected.phone||'—')}</div></div><div class="detail"><label>Company</label><div>${escapeHTML(selected.company||'—')}</div></div><div class="detail"><label>Service</label><div>${escapeHTML(selected.service)}</div></div><div class="detail"><label>Received</label><div>${formatDate(selected.createdAt)}</div></div><div class="detail"><label>Status</label><div>${escapeHTML(selected.status)}</div></div></div><label class="muted">Message</label><div class="message-box">${escapeHTML(selected.message)}</div><div class="modal-actions"><button class="primary" id="modalStatus">Mark as ${selected.status==='new'?'read':'new'}</button><button class="danger" id="modalDelete">Delete</button></div>`;$('modal').classList.remove('hidden');$('modalStatus').onclick=()=>toggleStatus(selected.id,true);$('modalDelete').onclick=()=>deleteMessage(selected.id,true);}
  function closeModal(){$('modal').classList.add('hidden');selected=null;}
  async function toggleStatus(id, close=false){const m=messages.find(x=>x.id===id);if(!m)return;try{const updated=await api('/api/admin/messages/'+id,{method:'PATCH',body:JSON.stringify({status:m.status==='new'?'read':'new'})});Object.assign(m,updated);if(close)closeModal();render();updateStats();}catch(e){alert(e.message)}}
  async function deleteMessage(id, close=false){if(!confirm('Delete this message permanently?'))return;try{await api('/api/admin/messages/'+id,{method:'DELETE'});messages=messages.filter(m=>m.id!==id);if(close)closeModal();render();updateStats();}catch(e){alert(e.message)}}

  if(token) showApp(); else showLogin();
})();
