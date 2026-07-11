// ---------- MENÚ MÓVIL ----------
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

menuToggle.addEventListener('click', () => {
  menuToggle.classList.toggle('open');
  navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menuToggle.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// ---------- SERVICIOS ----------
const services = [
  { name: 'Corte de cabello', price: 20.99, time: '40 min' },
  { name: 'Corte infantil', price: 15.99, time: '30 min' },
  { name: 'Perfilado de barba', price: 15.99, time: '20 min' },
  { name: 'Corte a máquina', price: 18.99, time: '30 min' },
];

const servicesGrid = document.getElementById('servicesGrid');

services.forEach((s) => {
  const card = document.createElement('div');
  card.className = 'service-card';
  card.innerHTML = `
    <h3>${s.name}</h3>
    <p class="price">$${s.price.toFixed(2)}</p>
    <p class="duration">${s.time}</p>
  `;
  servicesGrid.appendChild(card);
});

// ---------- FECHA Y HORA ----------
const months = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

let currentMonth = 7; // Agosto (índice 7)
let currentYear = 2026;

const dayLabels = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

let selectedDate = null;
let selectedTime = '17:00';

const times = [
  '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
];

const dateGrid = document.getElementById('date-grid');
const timeGrid = document.getElementById('time-grid');
const monthLabel = document.getElementById('monthLabel');

function getDatesForMonth() {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dates = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dayIndex = new Date(currentYear, currentMonth, d).getDay();
    dates.push({ day: d, label: dayLabels[dayIndex], closed: dayIndex === 0 });
  }
  return dates;
}

function renderMonth() {
  monthLabel.textContent = `${months[currentMonth]} ${currentYear}`;
  renderDates();
}

function renderDates() {
  dateGrid.innerHTML = '';
  const dates = getDatesForMonth();

  if (selectedDate === null) {
    const firstOpen = dates.find((d) => !d.closed);
    selectedDate = firstOpen ? firstOpen.day : null;
  }

  dates.forEach((d) => {
    const cell = document.createElement('button');
    cell.className = 'date-cell'
      + (d.day === selectedDate ? ' selected' : '')
      + (d.closed ? ' disabled' : '');
    cell.innerHTML = `<span class="num">${d.day}</span><span class="lbl">${d.label}</span>`;
    if (d.closed) {
      cell.disabled = true;
    } else {
      cell.addEventListener('click', () => {
        selectedDate = d.day;
        renderDates();
      });
    }
    dateGrid.appendChild(cell);
  });
}

function renderTimes() {
  timeGrid.innerHTML = '';
  times.forEach((t) => {
    const cell = document.createElement('button');
    cell.className = 'time-cell' + (t === selectedTime ? ' selected' : '');
    cell.textContent = t;
    cell.addEventListener('click', () => {
      selectedTime = t;
      renderTimes();
    });
    timeGrid.appendChild(cell);
  });
}

document.getElementById('prevMonth').addEventListener('click', () => {
  currentMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  if (currentMonth === 11) currentYear -= 1;
  selectedDate = null;
  renderMonth();
});

document.getElementById('nextMonth').addEventListener('click', () => {
  currentMonth = currentMonth === 11 ? 0 : currentMonth + 1;
  if (currentMonth === 0) currentYear += 1;
  selectedDate = null;
  renderMonth();
});

renderMonth();
renderTimes();

// ---------- CONFIRMAR RESERVA ----------
const confirmBtn = document.getElementById('confirmBooking');
const confirmMsg = document.getElementById('bookingConfirm');

confirmBtn.addEventListener('click', () => {
  confirmMsg.textContent = `Cita reservada para el ${selectedDate} de ${months[currentMonth]} a las ${selectedTime} con Milton.`;
});
