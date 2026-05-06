// ─── PASSWORD ───
const CORRECT = "april 3, 2025";
function checkPassword(){
  const val = document.getElementById('pw-input').value.trim().toLowerCase();
  const err = document.getElementById('pw-err');
  if(val === CORRECT || val === "april 3 2025" || val === "april 3rd 2025" || val === "04/03/2025" || val === "4/3/2025"){
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
function showTab(name){
  ['home','prayer','openme'].forEach(t=>{
    document.getElementById('tab-'+t).style.display = t===name?'block':'none';
    document.getElementById('nav-'+t).classList.toggle('active', t===name);
  });
  if(name==='prayer') renderPrayers();
}
// fix nav ids
document.getElementById('nav-home').id='nav-home';
 
// ─── PRAYERS ───
function savePrayer() {
  const txt = document.getElementById('prayer-text').value.trim();
  if (!txt) return;

  const prayer = {
    id: Date.now(),
    text: txt,
    date: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }),
    answered: false
  };

  db.ref("test-prayers/" + prayer.id).set(prayer);

  document.getElementById('prayer-text').value = '';
}
 
function renderPrayers() {
  db.ref("test-prayers").on("value", snapshot => {
    const data = snapshot.val() || {};
    const prayers = Object.values(data);

    const ongoing = prayers.filter(p => !p.answered);
    const answered = prayers.filter(p => p.answered);

    const oList = document.getElementById('ongoing-list');
    const aList = document.getElementById('answered-list');

    oList.innerHTML = ongoing.length ? ongoing.map(p => `
      <div class="prayer-card" id="pc-${p.id}">
        <p>${escHtml(p.text)}</p>
        <div class="prayer-meta">🕊️ ${p.date}</div>
        <button class="mark-btn" onclick="markAnswered(${p.id})">Mark as Answered ✦</button>
      </div>`).join('') : '<p class="empty-state">No prayers yet — write your first one above. 🌸</p>';

    aList.innerHTML = answered.length ? answered.map(p => `
      <div class="prayer-card answered" id="pc-${p.id}">
        <div class="answered-badge">✦ ANSWERED</div>
        <p>${escHtml(p.text)}</p>
        <div class="prayer-meta">🕊️ ${p.date}</div>
      </div>`).join('') : '<p class="empty-state">Answered prayers will appear here. 🌿</p>';
  });
}
 
function markAnswered(id) {
  const card = document.getElementById('pc-' + id);
  card.classList.add('slide-out');

  setTimeout(() => {
    db.ref("test-prayers/" + id + "/answered").set(true);
  }, 380);
}
 
function escHtml(t){ return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
 
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
function openEnvelope(){
  const env = document.getElementById('envelope');
  if(env.classList.contains('open')) return;
  env.classList.remove('closed');
  env.classList.add('open');
  document.getElementById('reveal').style.display='block';
  document.getElementById('click-cue').style.display='none';
}

// ─── OPEN ME ───
function openEnvelope2(){
  const env = document.getElementById('envelope');
  if(env.classList.contains('open')) return;
  env.classList.remove('closed');
  env.classList.add('open');
  document.getElementById('reveal').style.display='block';
  document.getElementById('click-cue').style.display='none';
}
 
