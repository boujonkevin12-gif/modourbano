const STORAGE_KEY = 'modo-urbano-appointments';
const BLOCK_KEY = 'modo-urbano-blocks';
const USER_KEY = 'modo-urbano-user';
const ADMIN_PIN = '150815';

const services = [
  { name: 'Corte de cabello + Barba', price: 15000, time: '45 min' },
  { name: 'Corte de cabello', price: 12000, time: '40 min' },
  { name: 'Barba', price: 4000, time: '20 min' },
  { name: 'Tintura', price: null, time: 'Consultar' },
];

const months = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const dayLabels = ['DOM','LUN','MAR','MIE','JUE','VIE','SAB'];

const times = [
  '09:30','10:00','10:30','11:00','11:30','12:00','12:30',
  '17:00','17:30','18:00','18:30','19:00','19:30','20:00','20:30',
];

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = null;
let selectedTime = null;
let currentUser = null;
let adminFilter = 'all';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

function getAppts() { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
function saveAppts(list) { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }
function getBlocks() { return JSON.parse(localStorage.getItem(BLOCK_KEY) || '[]'); }
function saveBlocks(list) { localStorage.setItem(BLOCK_KEY, JSON.stringify(list)); }
function getUser() { const r = localStorage.getItem(USER_KEY); return r ? JSON.parse(r) : null; }
function saveUser(u) { localStorage.setItem(USER_KEY, JSON.stringify(u)); }
function clearUser() { localStorage.removeItem(USER_KEY); }

function isBlocked(dateStr, timeStr) {
  return getBlocks().some(b => b.date === dateStr && b.time === timeStr);
}

// LOGIN CLIENTE
const loginCliente = $('#loginCliente');
const cliName = $('#cliName');
const cliPhone = $('#cliPhone');
const cliLoginBtn = $('#cliLoginBtn');

const loginAdmin = $('#loginAdmin');
const adminPin = $('#adminPin');
const adminError = $('#adminError');
const adminLoginBtn = $('#adminLoginBtn');

$('#gotoAdminLink').addEventListener('click', () => {
  loginCliente.style.display = 'none';
  loginAdmin.style.display = 'flex';
  adminPin.value = '';
  adminError.textContent = '';
  adminPin.focus();
});

$('#gotoClienteLink').addEventListener('click', () => {
  loginAdmin.style.display = 'none';
  loginCliente.style.display = 'flex';
  cliName.focus();
});

cliLoginBtn.addEventListener('click', () => {
  const name = cliName.value.trim();
  const phone = cliPhone.value.trim();
  if (!name || !phone) return;
  currentUser = { name, phone };
  saveUser(currentUser);
  loginCliente.style.display = 'none';
  updateBadge();
  renderMyAppts();
  checkToday();
  document.querySelector('.navbar').scrollIntoView();
});

adminLoginBtn.addEventListener('click', () => {
  if (adminPin.value === ADMIN_PIN) {
    loginAdmin.style.display = 'none';
    $('#admin-section').style.display = '';
    renderAdmin();
    document.querySelector('.navbar').scrollIntoView();
  } else {
    adminError.textContent = 'PIN incorrecto';
    adminPin.value = '';
    adminPin.focus();
  }
});

adminPin.addEventListener('keydown', e => { if (e.key === 'Enter') adminLoginBtn.click(); });
cliName.addEventListener('keydown', e => { if (e.key === 'Enter') cliPhone.focus(); });
cliPhone.addEventListener('keydown', e => { if (e.key === 'Enter') cliLoginBtn.click(); });

currentUser = getUser();
if (currentUser) {
  loginCliente.style.display = 'none';
  updateBadge();
  renderMyAppts();
  checkToday();
}

function updateBadge() {
  if (currentUser) {
    $('#userBadge').style.display = 'inline-flex';
    $('#userNameDisplay').textContent = currentUser.name;
  } else {
    $('#userBadge').style.display = 'none';
  }
}

$('#logoutBtn').addEventListener('click', () => {
  clearUser(); currentUser = null; updateBadge();
  renderMyAppts(); checkToday();
  loginCliente.style.display = 'flex';
  cliName.value = ''; cliPhone.value = '';
  cliName.focus();
});

// MENU
$('#menuToggle').addEventListener('click', () => {
  $('#menuToggle').classList.toggle('open');
  $('#navLinks').classList.toggle('open');
});
$$('#navLinks a').forEach(l => l.addEventListener('click', () => {
  $('#menuToggle').classList.remove('open');
  $('#navLinks').classList.remove('open');
}));

// SERVICES
const servicesGrid = $('#servicesGrid');
services.forEach((s, idx) => {
  const card = document.createElement('div');
  card.className = 'service-card' + (idx === 0 ? ' selected-service' : '');
  card.dataset.index = idx;
  const priceText = s.price ? `$${s.price.toLocaleString('es-AR')}` : 'Consultar';
card.innerHTML = `<h3>${s.name}</h3><p class="price">${priceText}</p><p class="duration">${s.time}</p>`;
  card.addEventListener('click', () => {
    $$('.service-card').forEach(c => c.classList.remove('selected-service'));
    card.classList.add('selected-service');
  });
  servicesGrid.appendChild(card);
});

// CALENDAR
function getDates() {
  const dim = new Date(currentYear, currentMonth + 1, 0).getDate();
  const d = [];
  for (let i = 1; i <= dim; i++) {
    const di = new Date(currentYear, currentMonth, i).getDay();
    d.push({ day: i, label: dayLabels[di], closed: di === 0 });
  }
  return d;
}

function renderMonth() {
  $('#monthLabel').textContent = `${months[currentMonth]} ${currentYear}`;
  const dateGrid = $('#date-grid');
  const dates = getDates();
  if (selectedDate === null) { const f = dates.find(x => !x.closed); selectedDate = f ? f.day : null; }
  dateGrid.innerHTML = '';
  dates.forEach(d => {
    const cell = document.createElement('button');
    cell.className = 'date-cell' + (d.day === selectedDate ? ' selected' : '') + (d.closed ? ' disabled' : '');
    cell.innerHTML = `<span class="num">${d.day}</span><span class="lbl">${d.label}</span>`;
    if (!d.closed) cell.addEventListener('click', () => { selectedDate = d.day; renderMonth(); renderTimes(); });
    dateGrid.appendChild(cell);
  });
}

function renderTimes() {
  const tg = $('#time-grid');
  tg.innerHTML = '';
  const ds = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(selectedDate || '').padStart(2,'0')}`;
  const appts = getAppts();
  times.forEach(t => {
    const blocked = isBlocked(ds, t) || appts.some(a => a.date === ds && a.time === t);
    const cell = document.createElement('button');
    cell.className = 'time-cell' + (t === selectedTime ? ' selected' : '') + (blocked ? ' disabled' : '');
    cell.textContent = t;
    if (!blocked) cell.addEventListener('click', () => { selectedTime = t; renderTimes(); });
    tg.appendChild(cell);
  });
}

renderMonth(); renderTimes();

$('#prevMonth').addEventListener('click', () => {
  currentMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  if (currentMonth === 11) currentYear--;
  selectedDate = null; renderMonth();
});

$('#nextMonth').addEventListener('click', () => {
  currentMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  if (currentMonth === 0) currentYear++;
  selectedDate = null; renderMonth();
});

// CONFIRM
$('#confirmBooking').addEventListener('click', () => {
  if (!currentUser) { $('#bookingConfirm').textContent = 'Primero iniciá sesión'; return; }
  const svc = $('.selected-service');
  if (!svc) { $('#bookingConfirm').textContent = 'Seleccioná un servicio'; return; }
  if (!selectedDate || !selectedTime) { $('#bookingConfirm').textContent = 'Seleccioná fecha y hora'; return; }

  const s = services[parseInt(svc.dataset.index)];
  const ds = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(selectedDate).padStart(2,'0')}`;
  const list = getAppts();

  if (list.find(a => a.date === ds && a.time === selectedTime) || isBlocked(ds, selectedTime)) {
    $('#bookingConfirm').textContent = 'Ese horario no está disponible';
    return;
  }

  list.push({
    id: Date.now(), userName: currentUser.name, userPhone: currentUser.phone,
    service: s.name, price: s.price, date: ds, time: selectedTime,
    status: 'pendiente', createdAt: new Date().toISOString(),
  });
  saveAppts(list);
  $('#bookingConfirm').textContent = `Turno confirmado: ${s.name} — ${selectedDate}/${currentMonth+1} a las ${selectedTime}`;
  renderTimes();
  renderMyAppts(); checkToday();
});

// MIS TURNOS
function renderMyAppts() {
  const c = $('#myAppointments');
  if (!currentUser) { c.innerHTML = '<div class="appt-empty">Iniciá sesión para ver tus turnos.</div>'; return; }
  const mine = getAppts().filter(a => a.userPhone === currentUser.phone);
  if (!mine.length) { c.innerHTML = '<div class="appt-empty">No tenés turnos reservados todavía.<br><a href="#reservar" style="color:var(--cream)">Reservá ahora</a></div>'; return; }
  mine.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  let h = '<div class="appt-list">';
  mine.forEach(a => {
    const isT = a.date === today;
    const p = a.date.split('-');
    h += `<div class="appt-card${isT ? ' today' : ''}">
      <div class="appt-card-left">
        <div class="appt-card-date">${p[2]}/${p[1]}/${p[0]}${isT ? '<span class="badge-today">Hoy</span>' : ''}</div>
        <div class="appt-card-service">${a.service}</div>
        <div class="appt-card-time">🕐 ${a.time} — ${a.status}</div>
      </div>
      <div class="appt-actions">
        <button class="btn-sm cancel-btn" data-id="${a.id}">Cancelar</button>
      </div>
    </div>`;
  });
  c.innerHTML = h + '</div>';
  c.querySelectorAll('.cancel-btn').forEach(b => b.addEventListener('click', () => {
    if (!confirm('¿Cancelar este turno?')) return;
    let l = getAppts();
    l = l.filter(x => x.id !== parseInt(b.dataset.id));
    saveAppts(l);
    renderMyAppts();
    renderTimes();
    checkToday();
  }));
}
renderMyAppts();

// TODAY ALERT
function checkToday() {
  if (!currentUser) { $('#todayAlert').style.display = 'none'; return; }
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const t = getAppts().filter(a => a.userPhone === currentUser.phone && a.date === today);
  if (t.length) {
    $('#todayAlertText').textContent = ` Tenés turno hoy a las ${t[0].time} — ${t[0].service}`;
    $('#todayAlert').style.display = '';
    tryNotify(t[0]);
  } else {
    $('#todayAlert').style.display = 'none';
  }
}

$('#todayAlertClose').addEventListener('click', () => $('#todayAlert').style.display = 'none');

function tryNotify(a) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') new Notification('Modo Urbano', { body: `Turno hoy a las ${a.time} — ${a.service}`, icon: 'logo.jpeg' });
  else if (Notification.permission !== 'denied') Notification.requestPermission();
}

// ADMIN
$('#adminLogoutBtn').addEventListener('click', () => { $('#admin-section').style.display = 'none'; loginAdmin.style.display = 'flex'; adminPin.value = ''; adminError.textContent = ''; adminPin.focus(); });

$('#adminAllBtn').addEventListener('click', () => { adminFilter = 'all'; renderAdminTab(); });
$('#adminPendingBtn').addEventListener('click', () => { adminFilter = 'pending'; renderAdminTab(); });
$('#adminTodayBtn').addEventListener('click', () => { adminFilter = 'today'; renderAdminTab(); });

// TABS
let adminTab = 'reservas';
$('#adminReservasTab').addEventListener('click', () => { adminTab = 'reservas'; renderAdminTab(); });
$('#adminBloqueosTab').addEventListener('click', () => { adminTab = 'bloqueos'; renderAdminTab(); });

function renderAdminTab() {
  if (adminTab === 'reservas') renderAdmin();
  else renderAdminBlocks();
}

function renderAdmin() {
  const c = $('#adminTable');
  let all = getAppts();
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  if (adminFilter === 'pending') all = all.filter(a => a.status === 'pendiente');
  if (adminFilter === 'today') all = all.filter(a => a.date === today);
  all.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  if (!all.length) { c.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-dim)">No hay reservas</div>'; return; }
  let h = '<div class="admin-table"><table><thead><tr><th>Cliente</th><th>Teléfono</th><th>Servicio</th><th>Fecha</th><th>Hora</th><th>Estado</th><th></th></tr></thead><tbody>';
  all.forEach(a => {
    const p = a.date.split('-');
    const isT = a.date === today;
    h += `<tr><td><strong>${a.userName}</strong></td><td>${a.userPhone}</td><td>${a.service}</td><td>${p[2]}/${p[1]}/${p[0]}${isT ? ' <span style="color:var(--cream);font-size:11px">HOY</span>' : ''}</td><td>${a.time}</td><td><span class="status-badge ${a.status}">${a.status}</span></td><td class="admin-actions">${a.status === 'pendiente' ? `<button class="complete-btn" data-id="${a.id}">Completar</button>` : ''}<button class="danger delete-btn" data-id="${a.id}">Eliminar</button></td></tr>`;
  });
  c.innerHTML = h + '</tbody></table></div>';
  c.querySelectorAll('.complete-btn').forEach(b => b.addEventListener('click', () => { const l = getAppts(); const x = l.find(z => z.id === parseInt(b.dataset.id)); if (x) x.status = 'completado'; saveAppts(l); renderAdmin(); renderMyAppts(); }));
  c.querySelectorAll('.delete-btn').forEach(b => b.addEventListener('click', () => { if (!confirm('Eliminar?')) return; let l = getAppts(); l = l.filter(x => x.id !== parseInt(b.dataset.id)); saveAppts(l); renderAdmin(); renderMyAppts(); checkToday(); }));
}

function renderAdminBlocks() {
  const c = $('#adminTable');
  const blocks = getBlocks();
  let h = '<div style="margin-bottom:20px"><h3 style="font-size:18px;margin-bottom:12px">Agregar bloqueo</h3>';
  h += `<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:end">
    <div><label style="font-size:12px;color:#999;display:block;margin-bottom:4px">Fecha</label><input type="date" id="blockDate" style="background:#24262b;border:1px solid #333;color:#fff;padding:10px 14px;border-radius:10px;font-size:14px" /></div>
    <div><label style="font-size:12px;color:#999;display:block;margin-bottom:4px">Hora</label><select id="blockTime" style="background:#24262b;border:1px solid #333;color:#fff;padding:10px 14px;border-radius:10px;font-size:14px"><option value="">Todo el día</option>`;
  times.forEach(t => { h += `<option value="${t}">${t}</option>`; });
  h += `</select></div>
    <div><label style="font-size:12px;color:#999;display:block;margin-bottom:4px">Motivo (opcional)</label><input type="text" id="blockReason" placeholder="Ej: feriado" style="background:#24262b;border:1px solid #333;color:#fff;padding:10px 14px;border-radius:10px;font-size:14px" /></div>
    <div><button class="btn btn-primary" id="addBlockBtn">Bloquear</button></div>
  </div></div>`;

  if (blocks.length) {
    blocks.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    h += '<div class="admin-table"><table><thead><tr><th>Fecha</th><th>Hora</th><th>Motivo</th><th></th></tr></thead><tbody>';
    blocks.forEach(b => {
      const p = b.date.split('-');
      h += `<tr><td>${p[2]}/${p[1]}/${p[0]}</td><td>${b.time || 'Todo el día'}</td><td>${b.reason || '—'}</td><td class="admin-actions"><button class="danger unblock-btn" data-id="${b.id}">Desbloquear</button></td></tr>`;
    });
    h += '</tbody></table></div>';
  } else {
    h += '<div style="color:var(--text-dim);padding:20px 0">No hay bloqueos activos</div>';
  }

  c.innerHTML = h;

  $('#addBlockBtn').addEventListener('click', () => {
    const date = $('#blockDate').value;
    const time = $('#blockTime').value;
    const reason = $('#blockReason').value.trim();
    if (!date) return;
    const list = getBlocks();
    list.push({ id: Date.now(), date, time, reason, createdAt: new Date().toISOString() });
    saveBlocks(list);
    renderAdminBlocks();
    renderTimes();
  });
}

renderAdminTab();