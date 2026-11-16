(() => {
  const $ = (s) => document.querySelector(s);
  let token = sessionStorage.getItem('adminToken');
  let page = 1, totalPages = 1, current = null, timer;

  async function api(path, opts = {}) {
    const res = await fetch('/api' + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && path !== '/auth/login') { logout(); throw new Error('Session expired. Please sign in again.'); }
    if (!res.ok) throw new Error(data.message || 'Request failed (' + res.status + ')');
    return data;
  }

  function show() {
    $('#login').hidden = !!token;
    $('#dash').hidden = !token;
    if (token) load();
  }
  function logout() { token = null; sessionStorage.removeItem('adminToken'); show(); }

  $('#lf').addEventListener('submit', async (e) => {
    e.preventDefault();
    $('#lerr').textContent = '';
    try {
      const d = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: $('#le').value, password: $('#lp').value }) });
      token = d.token; sessionStorage.setItem('adminToken', token); $('#lp').value = ''; show();
    } catch (err) { $('#lerr').textContent = err.message; }
  });
  $('#out').addEventListener('click', logout);

  async function load() {
    $('#derr').textContent = '';
    const p = new URLSearchParams({ page, limit: 20 });
    if ($('#q').value.trim()) p.set('q', $('#q').value.trim());
    if ($('#sf').value) p.set('status', $('#sf').value);
    try {
      const d = await api('/inquiries?' + p);
      totalPages = d.meta.totalPages;
      $('#count').textContent = '(' + d.meta.total + ')';
      $('#pg').textContent = 'Page ' + d.meta.page + ' of ' + totalPages;
      $('#prev').disabled = page <= 1; $('#next').disabled = page >= totalPages;
      const body = $('#rows'); body.replaceChildren();
      if (!d.data.length) { const tr = body.insertRow(); const td = tr.insertCell(); td.colSpan = 5; td.textContent = 'No inquiries found.'; }
      d.data.forEach((i) => {
        const tr = body.insertRow();
        [i.name, i.email, i.projectType, new Date(i.createdAt).toLocaleString()].forEach((t) => { tr.insertCell().textContent = t; });
        const s = document.createElement('span'); s.className = 'st ' + i.status; s.textContent = i.status; tr.insertCell().append(s);
        tr.addEventListener('click', () => open(i));
      });
    } catch (err) { $('#derr').textContent = err.message; }
  }

  function open(i) {
    current = i; $('#deer').textContent = '';
    $('#dn').textContent = i.name;
    $('#dm').textContent = i.email + ' · ' + i.projectType + ' · ' + new Date(i.createdAt).toLocaleString();
    $('#dmsg').textContent = i.message; $('#ds').value = i.status;
    $('#dlg').showModal();
  }
  $('#close').addEventListener('click', () => $('#dlg').close());
  $('#ds').addEventListener('change', async () => {
    try { await api('/inquiries/' + current.id + '/status', { method: 'PATCH', body: JSON.stringify({ status: $('#ds').value }) }); load(); }
    catch (err) { $('#deer').textContent = err.message; }
  });
  $('#del').addEventListener('click', async () => {
    if (!confirm('Delete this inquiry permanently?')) return;
    try { await api('/inquiries/' + current.id, { method: 'DELETE' }); $('#dlg').close(); load(); }
    catch (err) { $('#deer').textContent = err.message; }
  });

  $('#q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => { page = 1; load(); }, 300); });
  $('#sf').addEventListener('change', () => { page = 1; load(); });
  $('#prev').addEventListener('click', () => { if (page > 1) { page--; load(); } });
  $('#next').addEventListener('click', () => { if (page < totalPages) { page++; load(); } });
  show();
})();
