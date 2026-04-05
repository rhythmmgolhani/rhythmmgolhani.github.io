// ============================================================
// script.js — Safai Mahotsav Website Logic
// Abhyuday Samarpan
// ============================================================

// ============================================================
// PAGE NAVIGATION
// Call showPage('page-id') to switch between pages
// ============================================================
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'page-scrollable') restartBirdAnimation();
}

// ============================================================
// COUNTDOWN TIMER
// Change the target date/time below if event date changes
// ============================================================
function updateCountdown() {
  const target = new Date('2026-04-14T08:00:00'); // <-- CHANGE DATE/TIME HERE
  const now    = new Date();
  const diff   = target - now;

  if (diff <= 0) {
    ['cd-days','cd-hours','cd-mins','cd-secs'].forEach(id => {
      document.getElementById(id).textContent = '00';
    });
    return;
  }

  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);
  const secs  = Math.floor((diff % 60000)    / 1000);

  document.getElementById('cd-days').textContent  = String(days).padStart(2, '0');
  document.getElementById('cd-hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('cd-mins').textContent  = String(mins).padStart(2, '0');
  document.getElementById('cd-secs').textContent  = String(secs).padStart(2, '0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

// ============================================================
// BROOM SWEEP INTERACTION (Intro Page)
// Mouse on desktop, Touch on mobile
// After 3 sweeps → moves to front page
// ============================================================
const broom        = document.getElementById('broom-cursor');
const litterItems  = document.querySelectorAll('.litter-item');
let lastX = window.innerWidth / 2;
let lastY = window.innerHeight / 2;
let swipeCount    = 0;
let swipeDistance = 0;
const SWIPE_THRESHOLD = 250; // px of movement = 1 swipe

function updateBroom(x, y) {
  // Move broom to pointer position
  broom.style.left = x + 'px';
  broom.style.top  = y + 'px';

  // Rotate broom to face direction of movement
  const dx    = x - lastX;
  const dy    = y - lastY;
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  broom.style.transform = `translate(-50%,-50%) rotate(${angle - 30}deg)`;
  


  // Accumulate movement distance → count swipes
  const dist = Math.sqrt(dx * dx + dy * dy);
  swipeDistance += dist;

  if (swipeDistance > SWIPE_THRESHOLD && swipeCount < 3) {
    swipeCount++;
    swipeDistance = 0;
    document.getElementById('dot' + (swipeCount - 1)).classList.add('done');
    sweepBatchLitter(swipeCount);
    if (swipeCount >= 3) {
      setTimeout(() => showPage('page-front'), 700);
    }
  }

  // Also sweep any litter directly under the broom
  sweepLitterUnderBroom(x, y);
  lastX = x;
  lastY = y;
}

// Sweep litter items that are physically close to the broom
function sweepLitterUnderBroom(x, y) {
  litterItems.forEach(item => {
    if (item.classList.contains('swept')) return;
    const r  = item.getBoundingClientRect();
    const cx = r.left + r.width  / 2;
    const cy = r.top  + r.height / 2;
    if (Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) < 80) {
      flyAway(item);
    }
  });
}

// On each swipe, sweep a proportional batch of remaining litter
function sweepBatchLitter(swipeNum) {
  const unswept   = Array.from(litterItems).filter(i => !i.classList.contains('swept'));
  const batchSize = Math.ceil(unswept.length / (4 - swipeNum));
  unswept.slice(0, batchSize).forEach((item, i) => {
    setTimeout(() => flyAway(item), i * 80);
  });
}

// Animate a single litter item flying off screen
function flyAway(item) {
  if (item.classList.contains('swept')) return;
  const angle = Math.random() * 360;
  const dist  = 300 + Math.random() * 200;
  const fx    = Math.cos(angle * Math.PI / 180) * dist;
  const fy    = Math.sin(angle * Math.PI / 180) * dist - 100;
  const fr    = (Math.random() - 0.5) * 720;
  item.style.setProperty('--fly-x', fx + 'px');
  item.style.setProperty('--fly-y', fy + 'px');
  item.style.setProperty('--fly-r', fr + 'deg');
  item.classList.add('swept');
}

// Mouse events (desktop)
document.getElementById('page-intro').addEventListener('mousemove', e => {
  updateBroom(e.clientX, e.clientY);
});

// Touch events (mobile)
document.getElementById('page-intro').addEventListener('touchmove', e => {
  e.preventDefault();
  const t = e.touches[0];
  updateBroom(t.clientX, t.clientY);
}, { passive: false });

document.getElementById('page-intro').addEventListener('touchstart', e => {
  const t = e.touches[0];
  lastX = t.clientX;
  lastY = t.clientY;
});


// ============================================================
// LITTER FLY INTO DUSTBIN (Front Page)
// Clicking dustbin throws the 2 small litter items into it
// then navigates to page 2
// ============================================================
function throwLitterIntoBin() {
  const bin     = document.getElementById('front-dustbin');
  const binRect = bin.getBoundingClientRect();
  const binCX   = binRect.left + binRect.width  / 2;
  const binCY   = binRect.top  + binRect.height / 2;

  document.querySelectorAll('.front-litter').forEach((item, i) => {
    const r  = item.getBoundingClientRect();
    const lx = r.left + r.width  / 2;
    const ly = r.top  + r.height / 2;

    // Create a flying clone
    const clone = item.cloneNode();
    clone.style.cssText = item.style.cssText;
    clone.style.position = 'fixed';
    clone.style.left   = lx + 'px';
    clone.style.top    = ly + 'px';
    clone.style.width  = r.width + 'px';
    clone.style.height = r.height + 'px';
    clone.style.zIndex = '200';
    clone.style.setProperty('--tx', (binCX - lx) + 'px');
    clone.style.setProperty('--ty', (binCY - ly) + 'px');
    clone.style.animation = `fly-into-bin 0.8s ease-in ${i * 0.15}s forwards`;
    document.body.appendChild(clone);

    item.style.opacity = '0'; // hide original
    setTimeout(() => clone.remove(), 1200);
  });

  setTimeout(() => showPage('page-scrollable'), 1000);
}

// ============================================================
// DUSTBIN SWITCHER (Page 2, Card 3)
// Tap the dustbin image to toggle between bin types
// Add more bin images to the array if needed
// ============================================================
const binImgs   = [ IMG_DUSTBIN_MAIN,IMG_DUSTBIN2,IMG_DUSTBIN3,IMG_DUSTBIN4]; // from images.js
const binLabels = ['See Next','Tin Container Bin' ,'Plastic Bottle Bin' ];
let binIdx = 0;

function switchDustbin() {
  binIdx = (binIdx + 1) % binImgs.length;
  const img = document.getElementById('bin-img');
  img.style.opacity = '0';
  setTimeout(() => {
    img.src = binImgs[binIdx];
    document.getElementById('bin-label').textContent = binLabels[binIdx];
    img.style.opacity = '1';
  }, 200);
}

// ============================================================
// BIRD ANIMATION (Page 2, Card 2)
// Restarts every time page 2 is visited
// ============================================================
function restartBirdAnimation() {
  const bird = document.getElementById('bird-animated');
  bird.style.animation = 'none';
  bird.offsetHeight; // force reflow so animation restarts
  bird.style.animation = 'birdLand 3s ease-out forwards, birdBob 1.2s ease-in-out 3s infinite';
}
