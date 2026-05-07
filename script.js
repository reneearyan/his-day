// ─── PASSWORD ───
const CORRECT = "may 15, 2007";
function checkPassword(){
  const val = document.getElementById('pw-input').value.trim().toLowerCase();
  const err = document.getElementById('pw-err');
  if(val === CORRECT || val === "may 15 2007" || val === "may 15th 2025" || val === "05/15/2007" || val === "5/15/2007"){
    document.getElementById('page-password').classList.add('fade-out');
    setTimeout(()=>{
      document.getElementById('page-password').classList.remove('active');
      document.getElementById('page-app').classList.add('active');
    }, 700);
  } else {
    err.textContent = "Try again 🤍";
    const card = document.querySelector('.pw-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
    setTimeout(()=>err.textContent='', 2500);
  }
}
document.getElementById('pw-input').addEventListener('keydown', e=>{ if(e.key==='Enter') checkPassword(); });
 
// ─── TABS ───
function showTab(name) {
  ['home','prayer','openme'].forEach(t => {
    document.getElementById('tab-' + t).style.display = t === name ? 'block' : 'none';
    document.getElementById('nav-' + t).classList.toggle('active', t === name);
  });
  if (name === 'prayer') renderPrayers();
  if (name === 'openme') renderOpenMe();
}
// fix nav ids
document.getElementById('nav-home').id='nav-home';
 
// ─── PRAYER CALENDAR STATE ───
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calFilterDate = null; // "YYYY-MM-DD" or null

function getDateKey(idOrDate) {
  const d = typeof idOrDate === 'number' ? new Date(idOrDate) : new Date(idOrDate);
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function renderCalendar(prayers) {
  const box = document.getElementById('prayer-calendar');
  if (!box) return;

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  const dayNames   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  // build a set of date keys that have prayers
  const prayerDates = new Set(prayers.map(p => getDateKey(p.id)));

  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayKey = getDateKey(Date.now());

  let cells = '';
  dayNames.forEach(d => { cells += `<div class="cal-day-label">${d}</div>`; });

  for (let i = 0; i < firstDay; i++) {
    cells += `<div class="cal-day empty"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const key = calYear + '-' + String(calMonth + 1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    const hasPrayer = prayerDates.has(key);
    const isToday   = key === todayKey;
    const isSelected = key === calFilterDate;

    let cls = 'cal-day';
    if (hasPrayer)  cls += ' has-prayer';
    if (isToday)    cls += ' today';
    if (isSelected) cls += ' selected';
    if (!hasPrayer) cls += ' empty';

    const dot = hasPrayer ? `<div class="cal-dot"></div>` : '';
    const click = hasPrayer ? `onclick="calSelectDate('${key}')"` : '';

    cells += `<div class="${cls}" ${click}>${day}${dot}</div>`;
  }

  box.innerHTML = `
    <div class="cal-header">
      <button class="cal-nav" onclick="calChangeMonth(-1)">← Prev</button>
      <h4>${monthNames[calMonth]} ${calYear}</h4>
      <button class="cal-nav" onclick="calChangeMonth(1)">Next →</button>
    </div>
    <div class="cal-grid">${cells}</div>
  `;
}

function calChangeMonth(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  calFilterDate = null;
  renderPrayers();
}

function calSelectDate(key) {
  calFilterDate = calFilterDate === key ? null : key;
  renderPrayers();
}

// ─── PRAYERS ───
function escHtml(t){ return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function savePrayer() {
  const txt = document.getElementById('prayer-text').value.trim();
  if (!txt) return;

  const prayer = {
    id: Date.now(),
    text: txt,
    date: new Date().toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }),
    answered: false
  };

  db.ref("prayers/" + prayer.id).set(prayer);
  document.getElementById('prayer-text').value = '';
}

function renderPrayers() {
  db.ref("prayers").on("value", snapshot => {
    const data = snapshot.val() || {};
    const allPrayers = Object.values(data).sort((a, b) => b.id - a.id);

    // render calendar with all prayers
    renderCalendar(allPrayers);

    // apply date filter if active
    const filtered = calFilterDate
      ? allPrayers.filter(p => getDateKey(p.id) === calFilterDate)
      : allPrayers;

    const ongoing  = filtered.filter(p => !p.answered);
    const answered = filtered.filter(p => p.answered);

    document.getElementById('ongoing-count').textContent  = ongoing.length  || '';
    document.getElementById('answered-count').textContent = answered.length || '';

    // filter bar
    const filterBar = document.getElementById('cal-filter-bar');
    if (calFilterDate) {
      const d = new Date(calFilterDate + 'T00:00:00');
      const label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      filterBar.innerHTML = `
        <span class="cal-filter-label">Showing prayers from ${label}</span>
        <button class="cal-clear" onclick="calFilterDate=null;renderPrayers()">Show all ✕</button>
      `;
    } else {
      filterBar.innerHTML = `<span class="cal-filter-label" style="opacity:0.5">Tap a date with a dot to filter</span>`;
    }

    const oList = document.getElementById('ongoing-list');
    const aList = document.getElementById('answered-list');

    oList.innerHTML = ongoing.length ? ongoing.map(p => `
      <div class="prayer-card" id="pc-${p.id}">
        <p>${escHtml(p.text)}</p>
        <div class="prayer-footer">
          <div class="prayer-meta">🕊️ ${p.date}</div>
          <button class="mark-btn" onclick="markAnswered(${p.id})">Mark as Answered ✦</button>
        </div>
      </div>`).join('')
    : `<p class="empty-state">${calFilterDate ? 'No ongoing prayers on this day.' : 'No prayers yet — write your first one above. 🌸'}</p>`;

    aList.innerHTML = answered.length ? answered.map(p => `
      <div class="prayer-card answered" id="pc-${p.id}">
        <div class="answered-badge">✦ ANSWERED</div>
        <p>${escHtml(p.text)}</p>
        <div class="prayer-footer">
          <div class="prayer-meta">🕊️ ${p.date}</div>
          <button class="unmark-btn" onclick="unmarkAnswered(${p.id})">Move back to Ongoing ↩</button>
        </div>
      </div>`).join('')
    : `<p class="empty-state">${calFilterDate ? 'No answered prayers on this day.' : 'Answered prayers will appear here. 🌿'}</p>`;
  });
}

function markAnswered(id) {
  const card = document.getElementById('pc-' + id);
  card.classList.add('slide-out');
  setTimeout(() => { db.ref("prayers/" + id + "/answered").set(true); }, 380);
}

function unmarkAnswered(id) {
  const card = document.getElementById('pc-' + id);
  card.classList.add('slide-out');
  setTimeout(() => { db.ref("prayers/" + id + "/answered").set(false); }, 380);
}
 
// ─── LIGHTBOX ───
function openLightbox(card){
  const img = card.querySelector('img');
  if(!img) return;
  document.getElementById('lightbox-img').src = img.src;
  document.getElementById('lightbox').classList.add('open');
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
}
 
// ─── OPEN ME ───
const openMeCards = [
  {
    id: "tired",
    feeling: "when you feel tired",
    verse: "\u201cThen Jesus said, \u2018Come to me, all of you who are weary and carry heavy burdens, and I will give you rest.\u2019\u201d",
    ref: "\u2014 Matthew 11:28 (NLT)",
    note: "Aaron, whenever the weight of the world sits heavy on your shoulders, come back to this verse. You don\u2019t have to carry it alone \u2014 you were never meant to. Rest is not weakness; rest is trust. You are so loved in your tiredness and in your strength, in every season.\uD83E\uDD0D"
  },
  {
    id: "anxious",
    feeling: "when you feel anxious",
    verse: "\u201cDon\u2019t worry about anything; instead, pray about everything. Tell God what you need, and thank him for all he has done. Then you will experience God\u2019s peace, which exceeds anything we can understand. His peace will guard your hearts and minds as you live in Christ Jesus.\u201d",
    ref: "\u2014 Philippians 4:6\u20137 (NLT)",
    note: "Aaron, when everything feels too loud \u2014 I want you to remember this: you are held, you are safe, and you are not alone in the things that overwhelm you. Be still and let God meet you right where you are. He is not far. He is already here. \uD83E\uDD0D"
  },
  {
    id: "tempted",
    feeling: "when you feel tempted",
    verse: "\u201cThe temptations in your life are no different from what others experience. And God is faithful. He will not allow the temptation to be more than you can stand. When you are tempted, he will show you a way out so that you can endure.\u201d",
    ref: "\u2014 1 Corinthians 10:13 (NLT)",
    note: "Aaron, He sees you fully and deeply \u2014 and He still loves you completely, for He went before you into every battle. Be reminded that He has called you for a higher purpose: to be holy for Him. You are set apart, called to be pure and consecrated \u2014 and yes, shawty, iykyk hehe. \uD83E\uDD0D"
  },
  {
    id: "thankful",
    feeling: "when you feel thankful",
    verse: "\u201cAlways be joyful. Never stop praying. Be thankful in all circumstances, for this is God\u2019s will for you who belong to Christ Jesus.\u201d",
    ref: "\u2014 1 Thessalonians 5:16\u201318 (NLT)",
    note: "Aaron, the Lord delights in seeing His beloved rejoice \u2014 for He is so good. In every situation, big or small, choose to rejoice and give thanks. Your gratitude is an act of worship, and it is so beautiful to Him. \uD83E\uDD0D"
  },
  {
    id: "angry",
    feeling: "when you feel angry",
    verse: "\u201cThe faithful love of the Lord never ends! His mercies never cease. Great is his faithfulness; his mercies begin afresh each morning.\u201d",
    ref: "\u2014 Lamentations 3:22\u201323 (NLT)",
    note: "Aaron, as His mercy is new every morning and His love that never ceases carries us through each day \u2014 remember to reflect that same grace to the people around you. Choose to see them through His eyes. Surrender the anger to Him, and let His gentleness flow through you instead. \uD83E\uDD0D"
  },
  {
    id: "sad",
    feeling: "when you feel sad or disappointed",
    verse: "\u201cHe heals the brokenhearted and bandages their wounds.\u201d",
    ref: "\u2014 Psalm 147:3 (NLT)",
    note: "Aaron, He is calling you to come into His presence just as you are \u2014 with every sorrow and every burden. He has heard you even before you came. Choose to be in His presence. Run to Him, not away from Him, and He will give you a peace that passes all understanding. You are never too broken for His arms. \uD83E\uDD0D"
  },
  {
    id: "ashamed",
    feeling: "when you feel ashamed",
    verse: "\u201cBut if we confess our sins to him, he is faithful and just to forgive us our sins and to cleanse us from all wickedness.\u201d",
    ref: "\u2014 1 John 1:9 (NLT)",
    note: "Aaron, He is just waiting with open arms \u2014 because He is not only our King but also our Father who loves His children so deeply. There is no shame too great for His grace. Run back to Him. He will not turn you away. He never has, and He never will. \uD83E\uDD0D"
  },
  {
    id: "lazy",
    feeling: "when you feel lazy",
    verse: "\u201cWork willingly at whatever you do, as though you were working for the Lord rather than for people.\u201d",
    ref: "\u2014 Colossians 3:23 (NLT)",
    note: "Aaron, laziness is not what He has called you to \u2014 He has called you to step fully into the potential He placed inside you, for His glory. So get up, get out of that grave, and walk in the resurrection power He has already given you! You were made for more than this. Now go. \uD83E\uDD0D"
  }
];

// ─── RENDER OPEN ME CARDS ───
function renderOpenMe() {
  const grid = document.getElementById('openme-grid');
  if (!grid) return;

  grid.innerHTML = openMeCards.map((card, i) => `
    <div class="envelope-card" id="om-${card.id}" onclick="toggleOmCard('${card.id}')" style="animation-delay:${i * 0.1}s">
      <p class="hint">open when you feel…</p>
      <h2>"${card.feeling}"</h2>
      <p class="click-cue">tap to open 🌸</p>
      <div class="reveal-content">
        <div class="verse-divider"></div>
        <p class="verse">${card.verse}</p>
        <p class="verse-ref">${card.ref}</p>
        <div class="note">${card.note}</div>
      </div>
    </div>
  `).join('');
}

function toggleOmCard(id) {
  const card = document.getElementById('om-' + id);
  if (card.classList.contains('open')) return;

  document.querySelectorAll('.envelope-card.open').forEach(c => {
    c.classList.remove('open');
  });

  card.classList.add('open');
  setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

// ─── INIT ───
const firebaseConfig = {
  apiKey: "AIzaSyCBEdxRSByiCMMNyvaBYCW9yxoYZCsCV6g",
  authDomain: "his-day.firebaseapp.com",
  databaseURL: "https://his-day-default-rtdb.firebaseio.com",
  projectId: "his-day",
  storageBucket: "his-day.firebasestorage.app",
  messagingSenderId: "880059085921",
  appId: "1:880059085921:web:247020a154224979dd6620",
  measurementId: "G-FKCSFSWKXS"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

function escHtml(t){ return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
renderPrayers();
