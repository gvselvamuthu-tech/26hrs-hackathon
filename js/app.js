/* 26 HRS HACKATHON – NEXUS – Excel Engineering College (Autonomous), Dept. of IT & Binary Brains Club. Data lives in localStorage (demo backend). */
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='h24db',TBA='To be announced';
const WHATSAPP_GROUP_LINK='https://chat.whatsapp.com/BJ3qXPchD6JDrv3ADqXkqT';
const DEF={event:{
  title:'26 HRS HACKATHON – NEXUS',
  about:'26 HRS HACKATHON – NEXUS is an intensive technical hackathon organized by Excel Engineering College (Autonomous), Department of Information Technology in association with Binary Brains – Domain Club, in collaboration with United Soft Tech, Salem. Open for students across all years to build innovative technological solutions.',
  date:'2026-10-30',
  time:'10:00 AM (Start: Oct 30, 10:00 AM · End: Oct 31, 1:00 PM)',
  venue:'IT Lab, B Block, Excel Engineering College (Autonomous), Komarapalayam',
  fee:'2000',
  upiId:'suba.arni@okaxis',
  payeeName:'Banu Priya',
  contact:'Coordinators: Mrs. Banupriya (AP/IT) · Mrs. Divya K. (AP/IT) | Excel Engineering College (Autonomous), Komarapalayam – 637303, Namakkal District'
},
timeline:[
  {t:'Day 1 – 10:00 AM (Oct 30)',d:'Inauguration & Hackathon Commencement at IT Lab, B Block'},
  {t:'Day 1 – 01:00 PM',d:'Lunch Break'},
  {t:'Day 1 – 04:30 PM',d:'Refreshment / Tea & Snacks'},
  {t:'Day 1 – 07:00 PM',d:'Mentoring & First Review by Industry Experts'},
  {t:'Day 2 – 08:30 AM (Oct 31)',d:'Breakfast & Final Sprint'},
  {t:'Day 2 – 11:30 AM',d:'Final Project Presentation & Evaluation'},
  {t:'Day 2 – 01:00 PM (Oct 31)',d:'Valedictory Ceremony & Prize Distribution'}
],
rules:[
  {t:'Eligibility & Team Size',d:'Open to students of all years. Each team must consist of exactly 4 members (1 Team Leader + 3 Members).'},
  {t:'Hackathon Duration',d:'Continuous 26-hour hackathon starting October 30, 2026 at 10:00 AM and concluding October 31, 2026 at 1:00 PM.'},
  {t:'Venue & Conduct',d:'The event will be held physically at IT Lab, B Block. Participants must maintain academic integrity and professional conduct.'},
  {t:'Evaluation Criteria',d:'Projects are evaluated by industry experts on innovation, technical implementation, feasibility, presentation, and team collaboration.'}
],
prizes:[
  {t:'Total Cash Prize Pool',d:'₹10,000 for top performing teams'},
  {t:'Excellence Awards',d:'Certificates of Merit & Trophy for Winners'},
  {t:'Participation Certificate',d:'Official Certificate of Participation for all registered team members'}
],
judges:[
  {t:'Mr. S. Alagappandi',d:'Team Lead – United Soft Tech, Salem'},
  {t:'Mr. G. Mohanraj',d:'Circuit Division – United Soft Tech, Salem'},
  {t:'Mr. A. Karthick',d:'Graphic Designer – United Soft Tech, Salem'}
],
faq:[
  {t:'Who can participate in 26 HRS HACKATHON – NEXUS?',d:'Students from all years across engineering and technology disciplines are eligible to participate.'},
  {t:'What is the required team size?',d:'Each team consists of 4 members: 1 Team Leader and 3 Team Members.'},
  {t:'Where will the hackathon take place?',d:'The event will be conducted at IT Lab, B Block, Excel Engineering College (Autonomous), Komarapalayam.'},
  {t:'When does the event start and end?',d:'It begins on October 30, 2026 at 10:00 AM IST and concludes on October 31, 2026 at 1:00 PM IST (26 hours duration).'},
  {t:'Who are the event coordinators?',d:'Faculty Coordinators: Mrs. Banupriya (AP/IT) and Mrs. Divya K. (AP/IT), Department of Information Technology.'}
],
tracks:[],problemStatementFiles:[],announcements:[],teams:[],admin:{id:'admin'}};
const lowerEmail=v=>String(v??'').trim().toLowerCase();
const normalizeMembers=members=>Array.isArray(members)?members.map(item=>{
 if(typeof item==='string')return{name:String(item).trim(),email:''};
 const name=String(item?.name??item?.fullName??item?.memberName??'').trim();
 const email=lowerEmail(item?.email??'');
 return{name,email};
}).filter(item=>item.name||item.email):[];
const formatMemberName=m=>{
 if(m==null)return'Name not provided';
 if(typeof m==='string')return m.trim()||'Name not provided';
 if(typeof m==='object'){
  const val=(m.name??m.fullName??m.memberName??'');
  return typeof val==='string'&&val.trim()?val.trim():'Name not provided';
 }
 return String(m).trim()||'Name not provided';
};
const memberNames=members=>Array.isArray(members)?members.map(formatMemberName):[];
const renderTeamMembers=members=>Array.isArray(members)&&members.length?members.map(m=>`<p>${esc(formatMemberName(m))}${typeof m==='object'&&m.email?` <small style="color:var(--mu)">(${esc(m.email)})</small>`:''}</p>`).join(''):'<p>No additional members.</p>';
const renderMembersHtml=members=>Array.isArray(members)&&members.length?members.map(m=>esc(formatMemberName(m))).join('<br>'):'<span style="color:var(--mu)">No members</span>';
const teamEmailExists=(email,ignoreTeamId='')=>{
 const target=lowerEmail(email);
 if(!target)return false;
 return db.teams.some(team=>{
  if(String(team.id)===String(ignoreTeamId))return false;
  if(lowerEmail(team.email)===target)return true;
  return normalizeMembers(team.members).some(member=>lowerEmail(member.email)===target);
 });
};
let rawDb=null;
try{rawDb=JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){}
let db=rawDb||DEF;
if(db.admin && db.admin.pw){delete db.admin.pw;try{localStorage.setItem(KEY,JSON.stringify(db))}catch(e){}}
db.event={...DEF.event,...(db.event||{})};
if(!db.event.title||db.event.title==='24H Hackathon')db.event.title=DEF.event.title;
if(!db.event.about||db.event.about.includes('Edit the hackathon description'))db.event.about=DEF.event.about;
if(!db.event.date)db.event.date=DEF.event.date;
if(!db.event.time||db.event.time===TBA)db.event.time=DEF.event.time;
if(!db.event.venue||db.event.venue===TBA)db.event.venue=DEF.event.venue;
if(!db.event.contact||db.event.contact.includes('Add contact details'))db.event.contact=DEF.event.contact;
if(!db.event.fee)db.event.fee=DEF.event.fee;
if(!db.event.upiId)db.event.upiId=DEF.event.upiId||'suba.arni@okaxis';
if(!db.event.payeeName)db.event.payeeName=DEF.event.payeeName||'Banu Priya';
if(!db.timeline?.length)db.timeline=[...DEF.timeline];
if(!db.rules?.length)db.rules=[...DEF.rules];
if(!db.prizes?.length)db.prizes=[...DEF.prizes];
if(!db.judges?.length)db.judges=[...DEF.judges];
if(!db.faq?.length)db.faq=[...DEF.faq];
db.problemStatementFiles ||= [];
const save=()=>{db.teams.forEach(t=>t.members=normalizeMembers(t.members));localStorage.setItem(KEY,JSON.stringify(db))};
db.teams.forEach(t=>t.members=normalizeMembers(t.members));save();
let ses=JSON.parse(sessionStorage.getItem('h24s')||'null'),reg={step:1,d:{},m:[]},adm={tab:'overview',q:''};
const ADDR='Komarapalayam – 637303, Namakkal District, Tamil Nadu';
const badge=v=>`<span class="tag ${/inactive|reject|disab|fail/i.test(v)?'x':/paid|approved|enabled|complete|active/i.test(v)?'':'p'}">${esc(v)}</span>`;
const empty=t=>`<p class="glass">${t} — the admin will add this soon.</p>`;
function initAmbientEffects(){
 const layer=document.querySelector('.aurora'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!layer||!ctx)return;
 canvas.id='ambientCanvas';layer.append(canvas);
 const orbit=document.querySelector('#cursorOrbit');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const mobile=innerWidth<768;
 const interactive=matchMedia('(hover: hover) and (pointer: fine)').matches&&!reduced;

 /* 1. Flowing golden wave ribbons with 3D mesh lines */
 const waveCount = mobile ? 16 : 28;
 const waves = Array.from({length: waveCount}, (_, i) => {
  const norm = i / (waveCount - 1);
  return {
   index: i,
   norm: norm,
   yOffset: norm * 0.45,
   amplitude: 0.16 + norm * 0.14,
   freq: 0.85 + norm * 0.35,
   speed: 0.00045 + (i % 3) * 0.00012,
   phase: norm * Math.PI * 1.8,
   alpha: 0.14 + Math.sin(norm * Math.PI) * 0.38,
   lineWidth: 0.75 + norm * 1.4,
   hue: 38 + norm * 14 // Gold (38) to champagne yellow (52)
  };
 });

 /* 2. Wave particles flowing along the golden currents */
 const waveParticleCount = mobile ? 45 : 95;
 const waveParticles = Array.from({length: waveParticleCount}, (_, i) => {
  const strandNorm = (i % waveCount) / waveCount;
  return {
   t: Math.random(), // 0 to 1 along curve
   strand: strandNorm,
   speed: 0.00018 + Math.random() * 0.00028,
   r: 0.7 + Math.random() * 1.6,
   alpha: 0.25 + Math.random() * 0.55,
   hue: 42 + Math.random() * 10
  };
 });

 /* 3. Golden bokeh lights in ambient background */
 const bokehCount = mobile ? 12 : 22;
 const bokehs = Array.from({length: bokehCount}, () => ({
  x: Math.random(),
  y: 0.3 + Math.random() * 0.7,
  r: 12 + Math.random() * 32,
  alpha: 0.04 + Math.random() * 0.08,
  speed: 0.0002 + Math.random() * 0.0004,
  phase: Math.random() * Math.PI * 2,
  hue: 40 + Math.random() * 10
 }));

 /* 4. Sparkling micro-stars */
 const starCount = mobile ? 30 : 65;
 const stars = Array.from({length: starCount}, () => ({
  x: Math.random(),
  y: Math.random(),
  r: 0.4 + Math.random() * 0.85,
  alpha: 0.2 + Math.random() * 0.6,
  twinkleSpeed: 0.0012 + Math.random() * 0.002,
  phase: Math.random() * Math.PI * 2,
  hue: 46 + Math.random() * 6
 }));

 const trail = [];
 let width = 0, height = 0, ratio = 1, frame = 0, last = 0, energy = 0;
 let targetX = innerWidth * .5, targetY = innerHeight * .45, pointerX = targetX, pointerY = targetY;
 let parallaxX = 0, parallaxY = 0, cursorVisible = false;

 function resize(){
  ratio = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  width = innerWidth;
  height = innerHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  if(frame) cancelAnimationFrame(frame);
  frame = 0;
  draw(performance.now());
 }

 /* Get coordinates along the sweeping 3D wave current from bottom-left to right-center */
 function getWaveY(xNorm, t, wave) {
  // Primary flow from bottom-left (y ~ 0.88) rising toward center-right (y ~ 0.35 - 0.55)
  const baseY = 0.88 - Math.pow(xNorm, 1.25) * 0.42;
  const undulating = Math.sin(xNorm * Math.PI * wave.freq * 2.2 + t * wave.speed + wave.phase) * wave.amplitude * 0.22;
  const secondary = Math.cos(xNorm * Math.PI * 1.5 - t * wave.speed * 0.8 + wave.phase) * 0.06;
  return baseY - wave.yOffset + undulating + secondary;
 }

 function draw(now){
  if(width <= 0 || height <= 0) return;
  const t = reduced ? 0 : now;
  ctx.clearRect(0, 0, width, height);

  /* A. Golden ambient bokeh dots */
  for(const b of bokehs){
   const pulse = b.alpha * (0.8 + 0.2 * Math.sin(t * b.speed + b.phase));
   const bx = b.x * width;
   const by = b.y * height;
   const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
   grad.addColorStop(0, 'hsla(' + b.hue + ', 85%, 68%, ' + pulse + ')');
   grad.addColorStop(0.6, 'hsla(' + b.hue + ', 80%, 55%, ' + (pulse * 0.35) + ')');
   grad.addColorStop(1, 'transparent');
   ctx.fillStyle = grad;
   ctx.beginPath();
   ctx.arc(bx, by, b.r, 0, Math.PI * 2);
   ctx.fill();
  }

  /* B. Tiny sparkling stars */
  for(const s of stars){
   const twinkle = s.alpha * (0.6 + 0.4 * Math.sin(t * s.twinkleSpeed + s.phase));
   const sx = s.x * width;
   const sy = s.y * height;
   ctx.beginPath();
   ctx.fillStyle = 'hsla(' + s.hue + ', 90%, 88%, ' + twinkle + ')';
   ctx.shadowColor = 'hsla(' + s.hue + ', 95%, 72%, ' + (twinkle * 0.8) + ')';
   ctx.shadowBlur = 4;
   ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.shadowBlur = 0;

  /* C. Golden Wave Ribbons & Mesh Lines */
  const steps = mobile ? 36 : 60;
  for(let wIdx = 0; wIdx < waves.length; wIdx++){
   const wave = waves[wIdx];
   ctx.beginPath();
   for(let i = 0; i <= steps; i++){
    const xNorm = i / steps;
    const x = xNorm * width;
    const yNorm = getWaveY(xNorm, t, wave);
    const y = yNorm * height;
    if(i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
   }
   ctx.strokeStyle = 'hsla(' + wave.hue + ', 88%, 66%, ' + wave.alpha + ')';
   ctx.lineWidth = wave.lineWidth;
   if(wIdx % 4 === 0){
    ctx.shadowColor = 'rgba(255, 215, 0, ' + (wave.alpha * 0.75) + ')';
    ctx.shadowBlur = 8;
   } else {
    ctx.shadowBlur = 0;
   }
   ctx.stroke();
  }
  ctx.shadowBlur = 0;

  /* D. Vertical cross-mesh connecting lines for 3D grid ribbon texture */
  const crossSteps = mobile ? 8 : 16;
  ctx.lineWidth = 0.5;
  for(let c = 1; c < crossSteps; c++){
   const xNorm = c / crossSteps;
   const x = xNorm * width;
   const topY = getWaveY(xNorm, t, waves[waves.length - 1]) * height;
   const botY = getWaveY(xNorm, t, waves[0]) * height;
   ctx.beginPath();
   ctx.moveTo(x, topY);
   ctx.lineTo(x, botY);
   ctx.strokeStyle = 'rgba(255, 215, 0, 0.06)';
   ctx.stroke();
  }

  /* E. Floating luminous particles surging along the waves */
  for(const wp of waveParticles){
   if(!reduced) {
    wp.t += wp.speed;
    if(wp.t > 1) wp.t = 0;
   }
   const x = wp.t * width;
   const waveRef = waves[Math.floor(wp.strand * waves.length)] || waves[0];
   const y = getWaveY(wp.t, t, waveRef) * height;
   const surgeGlow = Math.sin(wp.t * Math.PI); // brighter at wave peak
   const pAlpha = wp.alpha * (0.5 + 0.5 * surgeGlow);

   ctx.beginPath();
   ctx.fillStyle = 'hsla(' + wp.hue + ', 95%, 78%, ' + pAlpha + ')';
   ctx.shadowColor = 'hsla(' + wp.hue + ', 100%, 70%, ' + (pAlpha * 0.9) + ')';
   ctx.shadowBlur = 6;
   ctx.arc(x, y, wp.r, 0, Math.PI * 2);
   ctx.fill();
  }
  ctx.shadowBlur = 0;

  /* F. Interactive cursor orbit & soft mouse radial glow */
  if(interactive){
   const dt = last ? Math.min(now - last, 32) : 16;
   last = now;
   pointerX += (targetX - pointerX) * (1 - Math.exp(-dt / 60));
   pointerY += (targetY - pointerY) * (1 - Math.exp(-dt / 60));
   parallaxX += (Math.max(0, Math.min(1, targetX / width)) * 2 - 1 - parallaxX) * 0.025;
   parallaxY += (Math.max(0, Math.min(1, targetY / height)) * 2 - 1 - parallaxY) * 0.025;
   document.documentElement.style.setProperty('--parallax-x', (parallaxX * 12).toFixed(2) + 'px');
   document.documentElement.style.setProperty('--parallax-y', (parallaxY * 10).toFixed(2) + 'px');

   if(orbit){
    orbit.style.transform = 'translate3d(' + pointerX + 'px,' + pointerY + 'px,0) translate(-50%,-50%) scale(' + (0.94 + energy * 0.06) + ')';
    orbit.classList.toggle('visible', cursorVisible);
   }
   energy *= Math.exp(-dt / 520);

   if(cursorVisible){
    const glowRadius = Math.max(width, height, 1) * 0.24;
    const px = Number.isFinite(pointerX) ? pointerX : width / 2;
    const py = Number.isFinite(pointerY) ? pointerY : height / 2;
    const glow = ctx.createRadialGradient(px, py, 0, px, py, glowRadius);
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.08)');
    glow.addColorStop(0.35, 'rgba(255, 193, 7, 0.04)');
    glow.addColorStop(0.7, 'rgba(255, 241, 118, 0.012)');
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
   }

   for(let i = trail.length - 1; i >= 0; i--){
    const dot = trail[i];
    const age = (now - dot.born) / 720;
    if(age >= 1){
     trail.splice(i, 1);
     continue;
    }
    const fade = 1 - age;
    const rad = dot.r * fade;
    const grad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, rad * 3.5);
    grad.addColorStop(0, 'hsla(' + dot.h + ', 85%, 78%, ' + (fade * 0.35) + ')');
    grad.addColorStop(1, 'hsla(' + dot.h + ', 85%, 65%, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(dot.x, dot.y, rad * 3.5, 0, Math.PI * 2);
    ctx.fill();
   }
  }

  if(!reduced || trail.length || energy > 0.002) frame = requestAnimationFrame(draw);
  else frame = 0;
 }

 function move(e){
  if(!interactive || e.pointerType === 'touch') return;
  targetX = e.clientX;
  targetY = e.clientY;
  cursorVisible = true;
  energy = Math.min(1, energy + 0.34);
  if(Math.random() < 0.48) {
   trail.push({x: e.clientX, y: e.clientY, born: performance.now(), r: 1 + Math.random() * 1.6, h: [38, 42, 46][(Math.random() * 3) | 0]});
  }
  if(trail.length > 24) trail.splice(0, trail.length - 24);
  if(!frame) frame = requestAnimationFrame(draw);
 }

 function leave(e){
  if(!e.relatedTarget) cursorVisible = false;
 }

 addEventListener('resize', resize, {passive: true});
 if(interactive){
  addEventListener('pointermove', move, {passive: true});
  addEventListener('pointerout', leave, {passive: true});
  addEventListener('blur', () => cursorVisible = false);
 }
 resize();
 if(!reduced && !frame) frame = requestAnimationFrame(draw);
}
/* ---------- scroll reveal ---------- */
function initScrollReveal(){
 if(matchMedia("(prefers-reduced-motion: reduce)").matches||!("IntersectionObserver" in window))return;
 const elements=document.querySelectorAll("main section:not(.hero), main .glass:not(.modal .glass)");
 const observer=new IntersectionObserver((entries,obs)=>{
  entries.forEach(entry=>{
   if(entry.isIntersecting){
    entry.target.classList.add("reveal-visible");
    obs.unobserve(entry.target);
   }
  });
 },{threshold:0.12,rootMargin:"0px 0px -40px 0px"});
 elements.forEach((el,idx)=>{
  el.classList.add("reveal-init");
  const delayClass="reveal-delay-" + ((idx%4)+1);
  el.classList.add(delayClass);
  observer.observe(el);
 });
}

/* ---------- helpers ---------- */
const lines=(a,f)=>a.map(f).join('\n');
const parse=(t,keys)=>t.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split('|').map(x=>x.trim());return Object.fromEntries(keys.map((k,i)=>[k,p[i]||'']))});
const go=(h,sec)=>{location.hash='#/'+h;if(sec)setTimeout(()=>document.getElementById(sec)?.scrollIntoView(),80);$('nav')?.classList.remove('open')};
const login=(role,id)=>{ses={role,id};sessionStorage.setItem('h24s',JSON.stringify(ses))};
const logout=async ()=>{
  if(ses?.role==='admin'){
    try{await fetch('/api/admin/logout',{method:'POST'});}catch(e){}
  }
  ses=null;
  sessionStorage.removeItem('h24s');
  go('home');
};
const nextId=()=>'24H'+String(db.teams.reduce((m,t)=>Math.max(m,+t.id.slice(3)||0),0)+1).padStart(3,'0');
const myTeam=()=>ses?.role==='team'?db.teams.find(t=>t.id===ses.id):null;
function toast(m){const d=document.createElement('div');d.className='glass';d.style.cssText='position:fixed;bottom:20px;right:20px;z-index:99';d.textContent=m;document.body.append(d);setTimeout(()=>d.remove(),2200)}
function openModal(h){const m=$('#modal');m.innerHTML=`<div class="glass">${h}</div>`;m.classList.remove('hide')}
const closeModal=()=>$('#modal').classList.add('hide');
let whatsappCloseTimer;
let paymentCloseTimer;
async function fetchBackendPaymentSettings() {
  try {
    const res = await fetch('/api/payment-settings');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.success && json.data) {
      return json.data;
    }
  } catch (e) {
    console.warn('Could not fetch backend payment settings:', e.message);
  }
  return null;
}

async function syncPaymentSettingsOnLoad() {
  const data = await fetchBackendPaymentSettings();
  if (data) {
    let changed = false;
    if (data.upiId && data.upiId !== db.event.upiId) { db.event.upiId = data.upiId; changed = true; }
    if (data.payeeName && data.payeeName !== db.event.payeeName) { db.event.payeeName = data.payeeName; changed = true; }
    if (data.fee && data.fee !== db.event.fee) { db.event.fee = data.fee; changed = true; }
    if (data.qrImage) {
      if (db.event.qrImage !== data.qrImage) { db.event.qrImage = data.qrImage; changed = true; }
    } else if (data.qrImage === '' && db.event.qrImage) {
      delete db.event.qrImage;
      changed = true;
    }
    if (changed) {
      save();
      view();
    }
  }
}

const DEFAULT_PAYMENT_UPI_ID='suba.arni@okaxis';
const DEFAULT_PAYMENT_PAYEE_NAME='Banu Priya';
const getPaymentUpiId=()=>(db.event?.upiId||DEFAULT_PAYMENT_UPI_ID);
const getPaymentPayeeName=()=>(db.event?.payeeName||DEFAULT_PAYMENT_PAYEE_NAME);
const getPaymentUpiUri=()=>{
  const pa=getPaymentUpiId();
  const pn=getPaymentPayeeName();
  if(!pa||pa==='YOUR_UPI_ID')return '';
  const am=getRegistrationFee();
  return 'upi://pay?pa='+encodeURIComponent(pa)+
         '&pn='+encodeURIComponent(pn)+
         '&am='+encodeURIComponent(am)+
         '&cu=INR&tn='+encodeURIComponent('26HRS HACKATHON REGISTRATION');
};
function triggerPaymentUpi(){
  const uri=getPaymentUpiUri();
  if(!uri){
    toast('Recipient UPI ID is not configured. Please contact the administrator.');
    return;
  }
  window.location.href=uri;
}
const DEFAULT_PAYMENT_FEE='2000';
const getRegistrationFee=()=>(db.event?.fee||DEFAULT_PAYMENT_FEE);
const formatRupees=v=>{const n=Number(v||DEFAULT_PAYMENT_FEE);const hasDecimals=String(v).includes('.')&&String(v).split('.')[1]!=='00';return '₹'+n.toLocaleString('en-IN',{minimumFractionDigits:hasDecimals?2:0,maximumFractionDigits:2});};
const DEFAULT_PAYMENT_QR='assets/images/payment-qr.jpe';
const getPaymentQrImage=()=>(db.event?.qrImage||DEFAULT_PAYMENT_QR);
const PAYMENT_QR_PLACEHOLDER_TEXT='24H Hackathon payment QR code';
const PAYMENT_QR_PLACEHOLDER=DEFAULT_PAYMENT_QR;
function openWhatsAppPopup(){
 const popup=$('#whatsapp-popup');
 if(!popup)return;
 clearTimeout(whatsappCloseTimer);
 popup.hidden=false;
 popup.classList.remove('is-closing');
 requestAnimationFrame(()=>{
  popup.classList.add('is-open');
  popup.querySelector('.whatsapp-close')?.focus();
 });
 popup.setAttribute('aria-hidden','false');
}
function closeWhatsAppPopup(){
 const popup=$('#whatsapp-popup');
 if(!popup||popup.hidden)return;
 popup.classList.remove('is-open');
 popup.classList.add('is-closing');
 popup.setAttribute('aria-hidden','true');
 whatsappCloseTimer=setTimeout(()=>{
  popup.hidden=true;
  popup.classList.remove('is-closing');
  $('#whatsapp-trigger')?.focus();
 },220);
}
function openPaymentPopup(){const popup=$('#payment-popup');if(!popup)return;clearTimeout(paymentCloseTimer);popup.hidden=false;popup.classList.remove('is-closing');requestAnimationFrame(()=>popup.classList.add('is-open'));popup.setAttribute('aria-hidden','false')}
function closePaymentPopup(){const popup=$('#payment-popup');if(!popup||popup.hidden)return;popup.classList.remove('is-open');popup.classList.add('is-closing');popup.setAttribute('aria-hidden','true');paymentCloseTimer=setTimeout(()=>{popup.hidden=true;popup.classList.remove('is-closing');$('#payment-trigger')?.focus()},260)}
function fallbackCopyPaymentUpi(){const input=document.createElement('textarea');input.value=getPaymentUpiId();input.setAttribute('readonly','');input.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();return copied}
async function copyPaymentUpi(){const button=$('#copy-upi');if(!button)return;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(getPaymentUpiId());else if(!fallbackCopyPaymentUpi())throw new Error('Clipboard access is unavailable');button.textContent='Copied ✓';setTimeout(()=>{if(button.isConnected)button.textContent='COPY UPI ID'},1800)}catch(error){try{if(fallbackCopyPaymentUpi()){button.textContent='Copied ✓';setTimeout(()=>{if(button.isConnected)button.textContent='COPY UPI ID'},1800);return}}catch(fallbackError){console.error('Could not copy UPI ID:',fallbackError)}console.error('Could not copy UPI ID:',error);toast('Could not copy UPI ID. Please copy it manually.')} }
function openPaymentRegistration(){closePaymentPopup();reg.step=1;go('register');if(location.hash==='#/register'){view();setTimeout(()=>document.querySelector('form')?.scrollIntoView({behavior:'smooth'}),80)}}
addEventListener('keydown',e=>{if(e.key==='Escape'){closeWhatsAppPopup();closePaymentPopup()}});
/* ---------- chrome ---------- */
function chrome(){
 const r=location.hash.slice(2)||'home';
 const links=['home','about','timeline','rules','prizes','judges','faq'];
 const dash=ses?`<a class="nav-item ${r===(ses.role==='admin'?'admin':'team')?'active':''}" onclick="go('${ses.role==='admin'?'admin':'team'}')">Dashboard</a><a class="nav-item" onclick="logout()">Logout</a>`:`<a class="nav-item ${r==='login'?'active':''}" onclick="go('login')">Login</a>`;
 $('#hdr').innerHTML=`<div class="brand-wrap logo" onclick="go('home')" aria-label="Go to home page">
   <img class="brand-mark" src="assets/images/nexus-team-logo.jpeg" alt="NEXUS logo">
   <div class="brand-text">
     <span class="brand-title">Excel Engineering College (Autonomous)</span>
     <small>Department of IT · Binary Brains Club</small>
   </div>
 </div>
 <button id="burger" class="btn sm ghost" onclick="$('nav').classList.toggle('open')" aria-label="Menu">☰</button>
 <nav>${links.map(s=>`<a class="nav-item ${r===s||(r==='home'&&s==='home')?'active':''}" onclick="go('home','${s}')">${s[0].toUpperCase()+s.slice(1)}</a>`).join('')}${dash}<a class="btn sm nav-cta" onclick="go('register')">Register Now</a></nav>`;
 $('#ftr').innerHTML=`<b>Excel Engineering College (Autonomous)</b> – Department of Information Technology & Binary Brains Club<br>Komarapalayam – 637303, Namakkal District, Tamil Nadu<br>${esc(db.event.contact)}`;
}
/* ---------- HOME ---------- */
function home(){const e=db.event,L=(a,f,t)=>a.length?a.map(f).join(''):empty(t);
 return `<section class="hero"><h1>${esc(e.title)}</h1><h3>Department of Information Technology & Binary Brains Club<br>Excel Engineering College (Autonomous), Komarapalayam</h3>
 <p>${esc(e.about)}</p><div class="cd" id="cd"></div>
 <div class="hero-actions"><button class="btn" onclick="go('register')">Register Now</button><button class="btn ghost" onclick="go('home','about')">View Details</button></div></section>
 <section id="about"><h2>About Event</h2><div class="glass"><p>${esc(e.about)}</p><p style="color:var(--mu)"><b>Date:</b> ${esc(e.date)} · <b>Time:</b> ${esc(e.time)}<br><b>Venue:</b> ${esc(e.venue)} · <b>Registration Fee:</b> ${formatRupees(getRegistrationFee())}</p></div>
 <div class="grid" style="margin-top:16px">${['26 Hours Non-Stop','4 Members per Team','Technical Innovation','Mentorship: United Soft Tech','Prize Pool: ₹10,000','Students from All Years'].map(x=>`<div class="glass"><h3>${x}</h3></div>`).join('')}</div></section>
 <section id="timeline"><h2>Timeline</h2><div class="tl">${L(db.timeline,x=>`<div class="glass"><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div>`,'Timeline not published yet')}</div></section>
 <section id="rules"><h2>Rules & Guidelines</h2>${L(db.rules,x=>`<details class="glass"><summary>${esc(x.t)}</summary><p>${esc(x.d)}</p></details>`,'Rules not published yet')}</section>
 <section id="prizes"><h2>Prizes & Recognition</h2><div class="grid">${L(db.prizes,x=>`<div class="glass prize"><h3>${esc(x.t)}</h3><b>${esc(x.d)}</b></div>`,'Prizes not published yet')}</div></section>
 <section id="judges"><h2>Guests & Industry Mentors</h2><div class="grid">${L(db.judges,x=>`<div class="glass"><div class="av"></div><h3>${esc(x.t)}</h3><p style="color:var(--mu)">${esc(x.d)}</p></div>`,'Judges and mentors not published yet')}</div></section>
 <section id="faq"><h2>Frequently Asked Questions</h2>${L(db.faq,x=>`<details class="glass"><summary>${esc(x.t)}</summary><p>${esc(x.d)}</p></details>`,'FAQ not published yet')}</section>
 <button id="payment-trigger" class="payment-trigger" type="button" onclick="openPaymentPopup()" aria-label="Payment QR"><span class="payment-tooltip" role="tooltip">Payment QR</span><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 4h9v9H4zM7 7v3h3V7zM19 4h9v9h-9zM22 7v3h3V7zM4 19h9v9H4zM7 22v3h3v-3zM17 17h4v4h-4zM23 17h5v3h-5zM17 23h3v5h-3zM22 23h6v2h-6zM25 26h3v2h-3z" fill="currentColor"/></svg></button>
 <button id="whatsapp-trigger" class="whatsapp-trigger" type="button" onclick="openWhatsAppPopup()" aria-label="Join WhatsApp Group">
  <span class="whatsapp-tooltip" role="tooltip">Join WhatsApp Group</span>
  <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.02 3.2A12.66 12.66 0 0 0 5.1 22.27L3.3 28.8l6.68-1.75A12.65 12.65 0 1 0 16.02 3.2Zm0 22.98c-1.97 0-3.9-.53-5.57-1.53l-.4-.24-3.97 1.04 1.06-3.86-.26-.41a10.3 10.3 0 1 1 9.14 5Zm5.65-7.72c-.31-.16-1.84-.91-2.13-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.36.23-.67.08-.31-.16-1.33-.49-2.53-1.55-.94-.84-1.57-1.87-1.75-2.18-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62 0 1.55 1.13 3.05 1.28 3.26.16.21 2.22 3.39 5.37 4.75.75.32 1.33.51 1.79.65.75.24 1.43.21 1.97.13.6-.09 1.84-.75 2.1-1.47.26-.73.26-1.35.18-1.47-.08-.13-.29-.21-.6-.37Z"/></svg>
 </button>
 <div id="payment-popup" class="payment-overlay" hidden aria-hidden="true" onclick="if(event.target===this)closePaymentPopup()"><section class="payment-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-popup-title"><button class="payment-close" type="button" onclick="closePaymentPopup()" aria-label="Close">×</button><p class="payment-eyebrow">26 HRS HACKATHON – NEXUS</p><h2 id="payment-popup-title">EVENT REGISTRATION PAYMENT</h2><p class="payment-popup-subtitle">Scan the QR Code to complete registration payment</p><div class="payment-qr-frame popup-qr-frame"><img class="payment-qr-image" src="${esc(getPaymentQrImage())}" alt="${PAYMENT_QR_PLACEHOLDER_TEXT}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="payment-qr-placeholder" role="img" aria-label="${PAYMENT_QR_PLACEHOLDER_TEXT}" hidden>${PAYMENT_QR_PLACEHOLDER_TEXT}</div></div>
<button type="button" class="pay-now-btn" onclick="triggerPaymentUpi()" aria-label="Pay Now with UPI"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg> Pay Now ${formatRupees(getRegistrationFee())}</button>
<p class="upi-app-hint">Tap to open Google Pay, PhonePe, Paytm, or any UPI app</p>
<p class="payment-detail"><b>Registration Fee:</b> ${formatRupees(getRegistrationFee())}</p><p class="payment-popup-upi"><b>UPI ID:</b> ${esc(getPaymentUpiId())}</p><p class="payment-popup-upi"><b>Payee Name:</b> ${esc(getPaymentPayeeName())}</p><div class="payment-popup-actions"><button id="copy-upi" class="btn" type="button" onclick="copyPaymentUpi()">COPY UPI ID</button><button class="btn ghost" type="button" onclick="openPaymentRegistration()">OPEN REGISTRATION</button></div></section></div>
 <div id="whatsapp-popup" class="whatsapp-overlay" hidden aria-hidden="true" onclick="if(event.target===this)closeWhatsAppPopup()">
  <section class="whatsapp-dialog" role="dialog" aria-modal="true" aria-labelledby="whatsapp-title" aria-describedby="whatsapp-description">
   <button class="whatsapp-close" type="button" onclick="closeWhatsAppPopup()" aria-label="Close popup">×</button>
   <div class="whatsapp-popup-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path fill="currentColor" d="M16.02 3.2A12.66 12.66 0 0 0 5.1 22.27L3.3 28.8l6.68-1.75A12.65 12.65 0 1 0 16.02 3.2Zm0 22.98c-1.97 0-3.9-.53-5.57-1.53l-.4-.24-3.97 1.04 1.06-3.86-.26-.41a10.3 10.3 0 1 1 9.14 5Zm5.65-7.72c-.31-.16-1.84-.91-2.13-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.36.23-.67.08-.31-.16-1.33-.49-2.53-1.55-.94-.84-1.57-1.87-1.75-2.18-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62 0 1.55 1.13 3.05 1.28 3.26.16.21 2.22 3.39 5.37 4.75.75.32 1.33.51 1.79.65.75.24 1.43.21 1.97.13.6-.09 1.84-.75 2.1-1.47.26-.73.26-1.35.18-1.47-.08-.13-.29-.21-.6-.37Z"/></svg></div>
   <p class="whatsapp-eyebrow">26 HRS HACKATHON – NEXUS</p>
   <h2 id="whatsapp-title">Join the Official WhatsApp Group</h2>
   <p class="whatsapp-college">Department of Information Technology & Binary Brains Club<br>Excel Engineering College (Autonomous)</p>
   <p id="whatsapp-description" class="whatsapp-description">Join our official WhatsApp group to receive hackathon updates, announcements, important instructions and event notifications.</p>
   <p class="whatsapp-action-label">JOIN WHATSAPP GROUP</p>
   <a class="whatsapp-join" href="${WHATSAPP_GROUP_LINK}" target="_blank" rel="noopener noreferrer">Join Group</a>
  </section>
 </div>`}
function tick(){
 const el=$('#cd');if(!el)return;
 // Official event start: October 30, 2026, at 10:00 AM IST (+05:30)
 const targetTime=new Date('2026-10-30T10:00:00+05:30').getTime();
 const now=Date.now();
 const diff=targetTime-now;
 if(diff<=0){
  el.innerHTML='<div class="glass" style="font-size:18px;font-weight:700;color:var(--c1)">HACKATHON IS LIVE! 🚀</div>';
  return;
 }
 const s=diff/1000|0;
 const v=[['Days',s/86400|0],['Hours',s/3600%24|0],['Min',s/60%60|0],['Sec',s%60]];
 el.innerHTML=v.map(([l,n])=>`<div class="glass">${String(n).padStart(2,'0')}<small>${l}</small></div>`).join('');
}

setInterval(tick,1000);
/* ---------- REGISTER ---------- */
const F=(l,n,v='',t='text',x='')=>`<label>${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x} required></label>`;
const YR=(n,v)=>`<label>Year<select name="${n}">${['1','2','3','4'].map(y=>`<option ${v==y?'selected':''}>${y}</option>`).join('')}</select></label>`;
const MOB='pattern="[0-9]{10}" title="10-digit mobile number"';
const trackOptions=(selected,includeCurrent=false)=>{const tracks=[...db.tracks];if(includeCurrent&&selected&&!tracks.some(t=>t.name===selected))tracks.push({name:selected,problems:[]});return `<option value="">Not selected yet</option>${tracks.map(t=>`<option value="${esc(t.name)}" ${selected===t.name?'selected':''}>${esc(t.name)}</option>`).join('')}`};
const problemOptions=(trackName,selected,includeCurrent=false)=>{const problems=[...(db.tracks.find(t=>t.name===trackName)?.problems||[])];if(includeCurrent&&selected&&!problems.includes(selected))problems.push(selected);return `<option value="">Not selected yet</option>${problems.map(problem=>`<option value="${esc(problem)}" ${selected===problem?'selected':''}>${esc(problem)}</option>`).join('')}`};
function register(){const d=reg.d,s=reg.step,names=['Team','Members','Payment','Done'];
 let h=`<section class="narrow"><h2>Team Registration</h2><div class="steps">${names.map((n,i)=>`<span class="${i+1==s?'on':''}">${i+1}. ${n}</span>`).join('')}</div><div class="glass">`;
 if(s==1)h+=`<form onsubmit="return rs(event,1)"><div class="two">${F('Team Name','team',d.team)}${F('Team Leader Name','leader',d.leader)}${F('Leader Mobile','mobile',d.mobile,'tel',MOB)}${F('Leader Email','email',d.email,'email')}${F('College Name','college',d.college)}${YR('year',d.year)}<label>Team Size (1 Leader + 3 Members)<input name="count" type="number" value="${d.count||4}" min="4" max="4" readonly style="opacity:.85;cursor:not-allowed"></label></div><button class="btn">Next: Member Details</button></form>`;
 if(s==2){const totalMembers=4;h+=`<form onsubmit="return rs(event,2)"><p style="margin-bottom:14px;color:var(--mu)">Enter details for the 3 team members (Leader details already registered):</p>`;for(let i=0;i<3;i++){const member=reg.m[i]||{name:'',email:''};h+=`<div class="glass" style="margin-bottom:12px"><b>Member ${i+1}</b>${F('Member Name','n'+i,member.name)}${F('Member Email','e'+i,member.email,'email')}</div>`}
  h+=`<button type="button" class="btn ghost" onclick="reg.step=1;view()">Back</button> <button class="btn">Next: Payment</button></form>`}
 if(s==3)h+=`<form id="payment" onsubmit="return rs(event,3)"><div class="payment-card"><h3>PAYMENT</h3><p class="payment-subtitle">Scan QR Code or Tap Pay Now</p><div class="payment-qr-frame"><img class="payment-qr-image" src="${esc(getPaymentQrImage())}" alt="${PAYMENT_QR_PLACEHOLDER_TEXT}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="payment-qr-placeholder" role="img" aria-label="${PAYMENT_QR_PLACEHOLDER_TEXT}" hidden>${PAYMENT_QR_PLACEHOLDER_TEXT}</div></div>
<button type="button" class="pay-now-btn" onclick="triggerPaymentUpi()" aria-label="Pay Now with UPI"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14h-2v-2h2v2zm0-4h-2V7h2v5z"/></svg> Pay Now ${formatRupees(getRegistrationFee())}</button>
<p class="upi-app-hint">Tap to open Google Pay, PhonePe, Paytm, or any UPI app</p>
<p class="payment-detail"><b>Registration Fee:</b> ${formatRupees(getRegistrationFee())}</p><p class="payment-detail"><b>UPI ID:</b> ${esc(getPaymentUpiId())}</p><p class="payment-detail"><b>Payee Name:</b> ${esc(getPaymentPayeeName())}</p></div><label>Payment Method<select name="method">${['UPI','Bank Transfer','Cash'].map(x=>`<option>${x}</option>`).join('')}</select></label>${F('Transaction ID / UTR','utr',d.utr)}<label>Payment Screenshot<input type="file" name="shot" accept="image/*" required></label><label class="payment-confirm"><input type="checkbox" name="confirmed" value="yes" required><span>I confirm that I have completed the payment.</span></label><button class="btn">Payment Completed</button> <button type="button" class="btn ghost" onclick="reg.step=2;view()">Back</button></form>`;
 if(s==4){const t=reg.done;h+=`<div class="ok"><div class="tick">✓</div><h3>Registration successful</h3><p>Team ID: <b>${t.id}</b> · ${esc(t.name)}</p><p>Leader: ${esc(t.leader)} · Payment: ${badge(t.pay.status)}</p><p style="color:var(--mu)">Your team account is disabled until the admin enables it. Please wait for the admin to enable it.</p><p style="color:var(--mu)">User ID: ${esc(t.acc.userId)} · Password: leader's mobile number</p><button class="btn" onclick="reg={step:1,d:{},m:[]};go('login')">Go to Login</button></div>`}
 return h+'</div></section>'}
function rs(ev,s){ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target)),d=reg.d;
 if(s==1){const count=Number(f.count) || 1;d.count=count;f.email=lowerEmail(f.email);if(db.teams.some(t=>t.leader.toLowerCase()==f.leader.toLowerCase()&&t.mobile==f.mobile)){alert('This leader is already registered.');return false}if(teamEmailExists(f.email)){alert('This email is already used by another team. Please use a different email.');return false}Object.assign(d,f)}
 if(s==2){const totalMembers=Math.max(1,Number(d.count || 1));const members=[];const seenEmails=new Set([lowerEmail(d.email)]);for(let i=0;i<totalMembers-1;i++){const name=(f['n'+i]||'').trim();const email=lowerEmail(f['e'+i]||'');if(!name&&!email)continue;if(email && (seenEmails.has(email) || teamEmailExists(email))){alert('Each member email must be unique and not already used by another team member or team.');return false}if(email)seenEmails.add(email);members.push({name,email})}reg.m=members;}
 if(s==3){if(!f.utr?.trim()){alert('Enter the Transaction ID / UTR number before submitting.');return false}if(f.confirmed!=='yes'){alert('Confirm that the payment is complete before submitting.');return false}const file=ev.target.shot.files[0];if(!file){alert('Please attach your payment screenshot image.');return false}const allowedTypes=['image/jpeg','image/png','image/jpg','image/webp'];const fileExt=file.name.split('.').pop()?.toLowerCase();if(!allowedTypes.includes(file.type)&&!['jpg','jpeg','png','webp'].includes(fileExt)){alert('Only image files (JPG, PNG, WEBP) are allowed for payment screenshots.');return false}if(file.size>3*1024*1024){alert('Payment screenshot file size must be less than 3 MB.');return false}const r=new FileReader();r.onload=async ()=>{
   const allEmails=[lowerEmail(d.email),...normalizeMembers(reg.m).map(member=>lowerEmail(member.email))].filter(Boolean);const duplicateEmails=allEmails.filter((email,index)=>allEmails.indexOf(email)!==index);if(duplicateEmails.length){alert('Email already used by another team member or team. Please update the duplicate email(s).');return false}
   let newTeamId=nextId();
   try{
     const apiRes=await fetch('/api/teams/register',{
       method:'POST',
       headers:{'Content-Type':'application/json'},
       body:JSON.stringify({
         team:d.team,leader:d.leader,mobile:d.mobile,email:lowerEmail(d.email),college:d.college,year:d.year,members:reg.m,
         method:f.method,utr:f.utr,shot:r.result
       })
     });
     const apiData=await apiRes.json();
     if(apiRes.ok && apiData.success && apiData.data?.id){
       newTeamId=apiData.data.id;
     } else if(!apiRes.ok){
       alert(apiData.message||'Registration failed on server.');
       return false;
     }
   }catch(err){console.warn('Backend register offline, saving locally:',err.message);}
   const t={id:newTeamId,name:d.team,leader:d.leader,mobile:d.mobile,email:lowerEmail(d.email),college:d.college,year:d.year,members:reg.m,track:'',problem:'',title:'',desc:'',
   pay:{method:f.method,utr:f.utr,shot:r.result,status:'Pending'},status:'Pending',acc:{userId:d.leader,password:d.mobile,enabled:false}};
   db.teams.push(t);save();reg.done=t;reg.step=4;view()};r.readAsDataURL(file);return false}
 reg.step=s+1;view();return false}
/* ---------- LOGIN ---------- */
let lrole='team';
function loginPg(){return `<section class="narrow"><h2>Login</h2><div class="tabs"><button class="btn ${lrole=='team'?'on':''}" onclick="lrole='team';view()">TEAM LOGIN</button><button class="btn ${lrole=='admin'?'on':''}" onclick="lrole='admin';view()">ADMIN LOGIN</button></div>
 <form class="glass" onsubmit="return doLogin(event)">${lrole=='team'?'<p style="color:var(--mu)">User ID = Team Leader Name<br>Password = Team Leader Mobile Number</p>':''}${F(lrole=='team'?'User ID':'Admin ID','u')}${F('Password','p','','password')}<div class="err" id="err"></div><button class="btn">Login</button> <button type="button" class="btn ghost" onclick="alert('Please contact the admin to reset your password.')">Forgot password</button> <button type="button" class="btn ghost" onclick="go('home')">Back to home</button></form></section>`}
async function doLogin(e){
  e.preventDefault();
  const u=e.target.u.value.trim(),p=e.target.p.value.trim(),er=$('#err');
  er.textContent='';
  if(lrole=='admin'){
    try{
      const res=await fetch('/api/admin/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body:JSON.stringify({username:u,password:p})
      });
      const data=await res.json();
      if(res.ok && data.success){
        login('admin');
        go('admin');
      } else {
        er.textContent=data.message||'Invalid admin ID or password.';
      }
    }catch(err){
      er.textContent='Server connection error. Please ensure the backend is running.';
    }
    return false;
  }
  // Team Login via Backend API
  try{
    const res=await fetch('/api/teams/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({username:u,password:p})
    });
    const data=await res.json();
    if(res.ok && data.success && data.teamId){
      login('team',data.teamId);
      // Fetch latest profile from server
      try{
        const meRes=await fetch('/api/teams/me',{credentials:'include'});
        const meData=await meRes.json();
        if(meRes.ok && meData.data){
          let existingIdx=db.teams.findIndex(t=>t.id===meData.data.id);
          if(existingIdx>=0) db.teams[existingIdx]=meData.data;
          else db.teams.push(meData.data);
          save();
        }
      }catch(e){}
      go('team');
      return false;
    } else {
      er.textContent=data.message||'Invalid User ID or password.';
      return false;
    }
  }catch(err){
    console.warn('Backend team login unreachable, attempting fallback:',err.message);
    const t=db.teams.find(t=>String(t.acc.userId).toLowerCase()===u.toLowerCase()&&t.acc.password===p);
    if(!t)er.textContent='Invalid User ID or password.';else if(!t.acc.enabled)er.textContent='Your account is not enabled yet. Please wait for the admin to enable it.';else{login('team',t.id);go('team')}
    return false;
  }
}/* ---------- TEAM DASHBOARD (own data only) ---------- */
function teamPg(){const t=myTeam();if(!t){logout();return ''}const e=db.event;
 const assignedStatement=t.problemStatementId?db.problemStatementFiles.find(item=>item.id===t.problemStatementId):db.problemStatementFiles.find(item=>item.track===t.track&&item.title===t.problem);
 const assignedTrack=assignedStatement?.track||t.track,assignedProblem=assignedStatement?.title||t.problem,statementFile=assignedStatement?.active?assignedStatement:null;
 return `<section><h2>Welcome, ${esc(t.name)}</h2><div class="grid"><div class="glass">Registration<br>${badge(t.status)}</div><div class="glass">Payment<br>${badge(t.pay.status)}</div><div class="glass">Account<br>${badge(t.acc.enabled?'Enabled':'Disabled')}</div></div>
 <div class="glass" style="margin-top:16px"><h3>Team ${t.id}</h3><p>Leader: ${esc(t.leader)} · ${esc(t.mobile)} · ${esc(t.email)}<br>${esc(t.college)} · Year ${esc(t.year)}<br>Project: <b>${esc(t.title)}</b> – ${esc(t.desc)}</p>
 <h3>Members</h3>${renderTeamMembers(t.members)}</div>
 <div class="glass" style="margin-top:16px"><h3>TRACK & PROBLEM STATEMENT</h3><p>Assigned Track Name: <b>${esc(assignedTrack||'Not selected yet')}</b><br>Problem Statement Title: <b>${esc(assignedProblem||'Not selected yet')}</b></p>
 ${assignedStatement?`<p>Problem Statement Description: ${esc(assignedStatement.description||'')}</p>`:''}
 ${statementFile?`<p>File Name: <b>${esc(statementFile.fileName)}</b><br>File Type: ${esc(statementFile.fileType)}<br>Upload Date: ${esc(statementFile.uploadDate)}</p><p><a class="btn sm" href="${statementFile.fileData}" target="_blank" rel="noopener noreferrer">View File</a> <a class="btn sm ghost" href="${statementFile.fileData}" download="${esc(statementFile.fileName)}">Download File</a></p>`:assignedStatement?'<p>This problem statement file is currently unavailable.</p>':'<p>No active problem statement file has been assigned yet.</p>'}
 ${db.tracks.length?`<form onsubmit="return saveTeamSelection(event)"><label>Track<select name="track" onchange="refreshTeamProblems(this.value)">${trackOptions(t.track)}</select></label><label>Problem Statement<select id="teamProblem" name="problem">${problemOptions(t.track,t.problem)}</select></label><button class="btn">Save selection</button></form>`:'<p>Tracks are not published yet</p>'}</div>
 <div class="glass" style="margin-top:16px"><h3>Hackathon information</h3><p>Date: ${esc(e.date||TBA)} · Time: ${esc(e.time)} · Venue: ${esc(e.venue)}</p><h3>Announcements</h3>${db.announcements.map(a=>`<p><b>${esc(a.t)}</b> – ${esc(a.d)}</p>`).join('')||'<p>No announcements yet.</p>'}</div>
 <button class="btn ghost" style="margin-top:16px" onclick="logout()">Logout</button></section>`}
function refreshTeamProblems(trackName){const select=$('#teamProblem'),track=db.tracks.find(item=>item.name===trackName);if(!select)return;select.innerHTML=`<option value="">Not selected yet</option>${(track?.problems||[]).map(problem=>`<option value="${esc(problem)}">${esc(problem)}</option>`).join('')}`}
async function saveTeamSelection(ev){
  ev.preventDefault();
  const t=myTeam();
  if(!t)return false;
  const f=Object.fromEntries(new FormData(ev.target));
  if(!f.track&&!f.problem){
    t.track='';t.problem='';t.problemStatementId='';
    try{await fetch('/api/teams/track-selection',{method:'PUT',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({track:'',problem:'',problemStatementId:''})});}catch(e){}
    save();view();return false;
  }
  const track=db.tracks.find(item=>item.name===f.track);
  if(!track||!f.problem||!track.problems.includes(f.problem)){toast('Choose a published track and a problem statement for that track.');return false}
  const probId=db.problemStatementFiles.find(item=>item.track===f.track&&item.title===f.problem)?.id||'';
  t.track=f.track;t.problem=f.problem;t.problemStatementId=probId;
  try{
    await fetch('/api/teams/track-selection',{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({track:f.track,problem:f.problem,problemStatementId:probId})
    });
  }catch(e){console.warn('Backend track selection update offline, saved locally:',e.message);}
  save();view();toast('Track and problem statement saved');return false;
}
/* ---------- ADMIN ---------- */
const ALIST={timeline:['t','d','Timeline (Title | Description)'],rules:['t','d','Rules (Title | Description)'],prizes:['t','d','Prizes (Category | Amount)'],judges:['t','d','Judges & Mentors (Name | Role)'],faq:['t','d','FAQ (Question | Answer)']};
const PROBLEM_FILE_EXTENSIONS=['pdf','doc','docx','ppt','pptx','zip'];
function problemStatementFilesAdmin(){
 const current=db.problemStatementFiles.find(item=>item.id===adm.editProblemFileId),trackNames=[...new Set([...db.tracks.map(track=>track.name),...db.problemStatementFiles.map(item=>item.track)])];
 const accept='.pdf,.doc,.docx,.ppt,.pptx,.zip';
 const records=db.problemStatementFiles.map(item=>`<div class="glass" style="margin-top:12px"><div class="two"><p><b>Track:</b> ${esc(item.track)}</p><p><b>Problem Statement:</b> ${esc(item.title)}</p><p><b>File Name:</b> ${esc(item.fileName)}</p><p><b>File Type:</b> ${esc(item.fileType)}</p><p><b>Upload Date:</b> ${esc(item.uploadDate)}</p><p><b>Status:</b> ${badge(item.active?'Active':'Inactive')}</p></div><p>${esc(item.description)}</p><button class="btn sm" type="button" onclick="editProblemStatementFile('${item.id}')">Edit</button> <label class="btn sm ghost" for="replace-file-${item.id}" style="display:inline-block;cursor:pointer">Replace File</label><input id="replace-file-${item.id}" type="file" accept="${accept}" hidden onchange="replaceProblemStatementFile(event,'${item.id}')"> <button class="btn sm ghost" type="button" onclick="toggleProblemStatementFile('${item.id}')">${item.active?'Disable':'Enable'}</button> <button class="btn sm red" type="button" onclick="deleteProblemStatementFile('${item.id}')">Delete</button></div>`).join('')||'<p class="glass">No problem statement files have been added yet.</p>';
 return `<div class="admin-problem-files"><h3 style="margin:0 0 12px">TRACK & PROBLEM STATEMENT FILES</h3><form class="glass" onsubmit="return saveProblemStatementFile(event)"><h3>${current?'Edit Problem Statement':'Add Problem Statement'}</h3><div class="two"><label>Track Name<input name="track" list="problem-track-options" value="${esc(current?.track||'')}" required><datalist id="problem-track-options">${trackNames.map(name=>`<option value="${esc(name)}">`).join('')}</datalist></label>${F('Problem Statement Title','title',current?.title||'')}</div><label>Problem Statement Description<textarea name="description" required>${esc(current?.description||'')}</textarea></label><label>Upload Problem Statement File${current?` (leave blank to keep ${esc(current.fileName)})`:''}<input id="problemStatementFile" name="file" type="file" accept="${accept}" ${current?'':'required'}></label>${current?`<label>Status<select name="active"><option value="true" ${current.active?'selected':''}>Active</option><option value="false" ${current.active?'':'selected'}>Inactive</option></select></label>`:''}<button class="btn">${current?'Save Changes':'Save Problem Statement'}</button>${current?` <button class="btn ghost" type="button" onclick="adm.editProblemFileId='';view()">Cancel</button>`:''}</form><h3 style="margin:20px 0 10px">Uploaded Problem Statement Files</h3>${records}</div>`;
}
function allowedProblemFile(file){const extension=file.name.split('.').pop()?.toLowerCase()||'';return PROBLEM_FILE_EXTENSIONS.includes(extension)}
function addProblemToTrack(trackName,title){
 let track=db.tracks.find(item=>item.name===trackName);
 if(!track){track={name:trackName,problems:[]};db.tracks.push(track)}
 if(!track.problems.includes(title))track.problems.push(title);
}
function saveProblemStatementFile(ev){
 ev.preventDefault();if(ses?.role!=='admin'){toast('Admin access is required.');return false}
 const form=ev.target,data=Object.fromEntries(new FormData(form)),track=String(data.track||'').trim(),title=String(data.title||'').trim(),description=String(data.description||'').trim(),file=form.elements.file.files[0],existing=db.problemStatementFiles.find(item=>item.id===adm.editProblemFileId);
 if(!track||!title||!description){toast('Enter the track, problem statement title, and description.');return false}
 if(!existing&&!file){toast('Select a problem statement file to upload.');return false}
 if(file&&!allowedProblemFile(file)){toast('Supported files: PDF, DOC, DOCX, PPT, PPTX, and ZIP.');return false}
 if(db.problemStatementFiles.some(item=>item.id!==existing?.id&&item.track===track&&item.title===title)){toast('This problem statement already exists for that track.');return false}
 const persist=(fileData)=>{
  const oldRecords=db.problemStatementFiles.slice(),oldStatement=existing?{...existing}:null,oldTracks=db.tracks.map(item=>({name:item.name,problems:[...item.problems]}));
  try{
   const statement=existing||{id:globalThis.crypto?.randomUUID?.()||`ps-${Date.now()}-${Math.random().toString(36).slice(2)}`,uploadDate:'',fileName:'',fileType:'',fileData:'',active:true};
   Object.assign(statement,{track,title,description});
   if(existing)statement.active=data.active==='true';
   if(file){statement.fileData=fileData;statement.fileName=file.name;statement.fileType=file.name.split('.').pop().toUpperCase();statement.uploadDate=new Date().toISOString().slice(0,10)}
   if(!existing)db.problemStatementFiles.push(statement);
   addProblemToTrack(track,title);save();adm.editProblemFileId='';view();toast('Problem statement file saved.');
  }catch(error){
   if(existing)Object.assign(existing,oldStatement);
   db.problemStatementFiles=oldRecords;db.tracks=oldTracks;
   console.error('Could not save problem statement file:',error);toast('Could not save the file. Browser storage may be full; try a smaller file.');
  }
 };
 if(file){const reader=new FileReader();reader.onload=()=>{if(typeof reader.result!=='string'){toast('The selected file could not be read.');return}persist(reader.result)};reader.onerror=()=>toast('The selected file could not be read.');reader.readAsDataURL(file)}
 else persist(existing.fileData);
 return false;
}
function editProblemStatementFile(id){if(ses?.role!=='admin')return;adm.editProblemFileId=id;view();setTimeout(()=>document.querySelector('.admin-problem-files')?.scrollIntoView({behavior:'smooth'}),0)}
function replaceProblemStatementFile(ev,id){
 if(ses?.role!=='admin'){toast('Admin access is required.');return}
 const file=ev.target.files[0],statement=db.problemStatementFiles.find(item=>item.id===id);if(!file||!statement)return;
 if(!allowedProblemFile(file)){toast('Supported files: PDF, DOC, DOCX, PPT, PPTX, and ZIP.');ev.target.value='';return}
 const reader=new FileReader();reader.onload=()=>{
  if(typeof reader.result!=='string'){toast('The selected file could not be read.');return}
  const old={fileData:statement.fileData,fileName:statement.fileName,fileType:statement.fileType,uploadDate:statement.uploadDate};
  try{statement.fileData=reader.result;statement.fileName=file.name;statement.fileType=file.name.split('.').pop().toUpperCase();statement.uploadDate=new Date().toISOString().slice(0,10);save();view();toast('Problem statement file replaced.')}
  catch(error){Object.assign(statement,old);console.error('Could not replace problem statement file:',error);toast('Could not replace the file. Browser storage may be full; try a smaller file.')}
 };
 reader.onerror=()=>toast('The selected file could not be read.');reader.readAsDataURL(file);
}
function toggleProblemStatementFile(id){if(ses?.role!=='admin'){toast('Admin access is required.');return}const item=db.problemStatementFiles.find(record=>record.id===id);if(!item)return;item.active=!item.active;try{save();view()}catch(error){item.active=!item.active;console.error('Could not update problem statement status:',error);toast('Could not update the file status.')}}
function deleteProblemStatementFile(id){if(ses?.role!=='admin'){toast('Admin access is required.');return}if(!confirm('Delete this problem statement file?'))return;const index=db.problemStatementFiles.findIndex(item=>item.id===id);if(index<0)return;const [removed]=db.problemStatementFiles.splice(index,1);try{save();view();toast('Problem statement file deleted.')}catch(error){db.problemStatementFiles.splice(index,0,removed);console.error('Could not delete problem statement file:',error);toast('Could not delete the file.')}}
function adminPg(){
  if(ses?.role!=='admin'){go('login');return ''}
  // Async verify server session cookie & sync teams
  fetch('/api/admin/me',{credentials:'include'}).then(r=>r.json()).then(data=>{
    if(!data.authenticated){
      toast('Admin session expired. Please log in again.');
      logout();
    } else {
      syncAdminTeamsFromBackend();
    }
  }).catch(()=>{});
  const T=db.teams,tabs=['overview','event','payment-qr','teams','accounts','announcements','problem-files'],tabLabels={'payment-qr':'Payment QR','problem-files':'Track & Problem Statement Files'};
 let h=`<section><h2>Admin Dashboard</h2><div class="tabs">${tabs.map(t=>`<button class="btn ${adm.tab==t?'on':''}" onclick="adm.tab='${t}';view()">${tabLabels[t]||t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div>`;
 if(adm.tab=='overview')h+=`<div class="grid">${[['Total Teams',T.length],['Participants',T.reduce((n,t)=>n+1+t.members.length,0)],['Payment Completed',T.filter(t=>t.pay.status=='Paid').length],['Pending Payments',T.filter(t=>t.pay.status!='Paid').length],['Active Accounts',T.filter(t=>t.acc.enabled).length]].map(([l,n])=>`<div class="glass stat"><b>${n}</b>${l}</div>`).join('')}</div>`;
 if(adm.tab=='event'){const e=db.event;h+=`<form class="glass" onsubmit="return saveEv(event)"><div class="two">${['title','date','time','venue','fee','contact'].map(k=>`<label>${k[0].toUpperCase()+k.slice(1)}<input name="${k}" type="${k=='date'?'date':'text'}" value="${esc(k==='fee'?getRegistrationFee():e[k])}"></label>`).join('')}</div><label>Description<textarea name="about">${esc(e.about)}</textarea></label>
  ${Object.entries(ALIST).map(([k,[a,b,l]])=>`<label>${l} – one per line<textarea name="${k}">${esc(lines(db[k],x=>x.t+' | '+x.d))}</textarea></label>`).join('')}
  <label>Tracks (Track | Problem 1 ; Problem 2 ...)<textarea name="tracks">${esc(lines(db.tracks,t=>t.name+' | '+t.problems.join(' ; ')))}</textarea></label><button class="btn">Save event data</button></form>`}
 if(adm.tab=='teams'){const q=adm.q.toLowerCase(),L=T.filter(t=>JSON.stringify([t.id,t.name,t.leader,t.mobile,t.track,t.problem]).toLowerCase().includes(q));
  h+=`<input placeholder="Search teams…" value="${esc(adm.q)}" oninput="adm.q=this.value;view();this.focus()" style="margin-bottom:14px"><div class="glass"><table><thead><tr><th>ID<th>Team<th>Leader<th>Mobile<th>Members<th>Track<th>Problem Statement<th>Payment<th>Status<th>Account<th></tr></thead><tbody>${L.map(t=>`<tr><td data-l="ID">${t.id}<td data-l="Team">${esc(t.name)}<td data-l="Leader">${esc(t.leader)}<td data-l="Mobile">${esc(t.mobile)}<td data-l="Members">${renderMembersHtml(t.members)}<td data-l="Track">${esc(t.track||'Not selected yet')}<td data-l="Problem Statement">${esc(t.problem||'Not selected yet')}<td data-l="Payment">${badge(t.pay.status)}<td data-l="Status">${badge(t.status)}<td data-l="Account">${badge(t.acc.enabled?'Enabled':'Disabled')}<td><button class="btn sm" onclick="editTeam('${t.id}')">Edit</button> <button class="btn sm red" onclick="delTeam('${t.id}')">Del</button></tr>`).join('')||'<tr><td>No teams found.</tr>'}</tbody></table></div>`}
 if(adm.tab=='accounts')h+=`<div class="glass"><table><thead><tr><th>Team ID<th>Leader<th>User ID<th>Password<th>Status<th></tr></thead><tbody>${T.map(t=>`<tr><td data-l="Team ID">${t.id}<td data-l="Leader">${esc(t.leader)}<td data-l="User ID">${esc(t.acc.userId)}<td data-l="Password">${esc(t.acc.password)}<td data-l="Status">${badge(t.acc.enabled?'Enabled':'Disabled')}<td><button class="btn sm" onclick="editAcc('${t.id}')">Edit</button> <button class="btn sm ghost" onclick="toggleAcc('${t.id}')">${t.acc.enabled?'Disable':'Enable'}</button></tr>`).join('')||'<tr><td>No accounts yet.</tr>'}</tbody></table></div><button class="btn" style="margin-top:14px" onclick="newTeam()">+ Create team & account</button>`;
 if(adm.tab=='announcements')h+=`<form class="glass" onsubmit="return addAnn(event)">${F('Title','t')}<label>Message<textarea name="d" required></textarea></label><button class="btn">Post announcement</button></form>${db.announcements.map((a,i)=>`<div class="glass" style="margin-top:10px"><b>${esc(a.t)}</b><p>${esc(a.d)}</p><button class="btn sm red" onclick="db.announcements.splice(${i},1);save();view()">Delete</button></div>`).join('')}`;
 if(adm.tab=='payment-qr')h+=paymentQrAdmin();
 if(adm.tab=='problem-files')h+=problemStatementFilesAdmin();
 return h+'</section>'}
function saveEv(ev){ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));['title','date','time','venue','fee','contact','about'].forEach(k=>db.event[k]=f[k]);
 Object.keys(ALIST).forEach(k=>db[k]=parse(f[k],['t','d']));const editedTracks=parse(f.tracks,['name','p']).map(t=>({name:t.name,problems:t.p.split(';').map(x=>x.trim()).filter(Boolean)}));
 for(const item of db.problemStatementFiles){let track=editedTracks.find(t=>t.name===item.track);if(!track){track={name:item.track,problems:[]};editedTracks.push(track)}if(!track.problems.includes(item.title))track.problems.push(item.title)}
 db.tracks=editedTracks;save();toast('Saved');return false}
function addAnn(ev){ev.preventDefault();db.announcements.unshift(Object.fromEntries(new FormData(ev.target)));save();view();return false}
function editTeam(id){const t=db.teams.find(x=>x.id==id);openModal(`<h3>Edit ${t.id}</h3><form onsubmit="return saveTeam(event,'${id}')"><div class="two">${[['Team Name','name'],['Leader','leader'],['Mobile','mobile'],['Email','email'],['College','college'],['Year','year'],['Project Title','title']].map(([l,k])=>F(l,k,t[k])).join('')}
 <label>Track<select id="editTrack" name="track" onchange="refreshAdminProblems(this.value)">${trackOptions(t.track,true)}</select></label><label>Problem Statement<select id="editProblem" name="problem">${problemOptions(t.track,t.problem,true)}</select></label>
 <label>Payment Status<select name="ps">${['Pending','Paid','Rejected'].map(x=>`<option ${t.pay.status==x?'selected':''}>${x}</option>`).join('')}</select></label><label>Registration Status<select name="st">${['Pending','Approved','Rejected'].map(x=>`<option ${t.status==x?'selected':''}>${x}</option>`).join('')}</select></label>${F('UTR','utr',t.pay.utr)}</div>
 <label>Description<textarea name="desc">${esc(t.desc)}</textarea></label><label>Members (one per line: Name | Email)<textarea name="mem">${esc(lines(t.members,m=>{if(!m)return'';if(typeof m==='string')return m;return`${m.name||''}${m.email?` | ${m.email}`:''}`}))}</textarea></label>
 ${t.pay.shot?`<a href="${t.pay.shot}" target="_blank" style="color:var(--c1)">View payment screenshot</a><br><br>`:''}<button class="btn">Save</button> <button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></form>`)}
async function syncAdminTeamsFromBackend(){
  if(ses?.role!=='admin')return;
  try{
    const res=await fetch('/api/admin/teams',{credentials:'include'});
    const data=await res.json();
    if(res.ok && data.success && Array.isArray(data.data)){
      if(data.data.length>0){
        db.teams=data.data;
        save();
        view();
      } else if(db.teams.length>0){
        // Migrate legacy localStorage teams to MongoDB
        try{
          await fetch('/api/admin/teams/migrate',{
            method:'POST',
            headers:{'Content-Type':'application/json'},
            credentials:'include',
            body:JSON.stringify({teams:db.teams})
          });
        }catch(e){}
      }
    }
  }catch(e){console.warn('Backend team sync offline:',e.message);}
}

async function saveTeam(ev,id){
  ev.preventDefault();
  const f=Object.fromEntries(new FormData(ev.target)),t=db.teams.find(x=>x.id==id);
  const email=lowerEmail(f.email);
  const members=normalizeMembers(f.mem.split('\n').map(line=>{const [name,...emailParts]=line.split('|');return{name:name.trim(),email:lowerEmail(emailParts.join('|'))}}));
  const emails=[email,...members.map(member=>member.email)].filter(Boolean);
  if(emails.some((value,index)=>emails.indexOf(value)!==index)||emails.some(value=>teamEmailExists(value,id))){alert('Each team email must be unique and not already used by another team member or team.');return false}

  // Sync to backend API
  try{
    await fetch(`/api/admin/teams/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({
        name:f.name,leader:f.leader,mobile:f.mobile,email,college:f.college,year:f.year,
        track:f.track,problem:f.problem,title:f.title,desc:f.desc,ps:f.ps,st:f.st,utr:f.utr,members
      })
    });
  }catch(err){console.warn('Backend admin team update offline, saved locally:',err.message);}

  ['name','leader','mobile','college','year','track','problem','title','desc'].forEach(k=>t[k]=f[k]);
  t.email=email;
  t.problemStatementId=db.problemStatementFiles.find(item=>item.track===f.track&&item.title===f.problem)?.id||'';t.pay.status=f.ps;t.pay.utr=f.utr;t.status=f.st;
  t.members=members;
  save();closeModal();view();return false;
}
function refreshAdminProblems(trackName){const select=$('#editProblem'),current=$('#editProblem')?.value; if(!select)return;select.innerHTML=problemOptions(trackName,current)}
async function delTeam(id){
  if(confirm('Delete team '+id+' permanently?')){
    try{
      await fetch(`/api/admin/teams/${id}`,{method:'DELETE',credentials:'include'});
    }catch(err){console.warn('Backend admin delete team offline, deleting locally:',err.message);}
    db.teams=db.teams.filter(t=>t.id!=id);
    save();view();
  }
}
async function toggleAcc(id){
  const t=db.teams.find(x=>x.id==id);
  const newEnabled=!t.acc.enabled;
  try{
    await fetch(`/api/admin/teams/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({enabled:newEnabled})
    });
  }catch(err){console.warn('Backend toggle acc offline, updating locally:',err.message);}
  t.acc.enabled=newEnabled;save();view();
}
function editAcc(id){const t=db.teams.find(x=>x.id==id);openModal(`<h3>Account ${t.id}</h3><form onsubmit="return saveAcc(event,'${id}')">${F('Team ID','id',t.id)}${F('Leader Name','leader',t.leader)}${F('User ID','uid',t.acc.userId)}${F('Mobile','mobile',t.mobile)}${F('Password (reset here)','pw',t.acc.password||t.mobile)}<button class="btn">Save</button> <button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></form>`)}
async function saveAcc(ev,id){
  ev.preventDefault();
  const f=Object.fromEntries(new FormData(ev.target)),t=db.teams.find(x=>x.id==id);
  if(f.id!=id&&db.teams.some(x=>x.id==f.id)){alert('Team ID already exists');return false}
  try{
    await fetch(`/api/admin/teams/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({leader:f.leader,mobile:f.mobile,password:f.pw})
    });
  }catch(err){console.warn('Backend save acc offline, updating locally:',err.message);}
  t.id=f.id;t.leader=f.leader;t.mobile=f.mobile;t.acc.userId=f.uid;t.acc.password=f.pw;save();closeModal();view();return false;
}
function newTeam(){openModal(`<h3>Create team & account</h3><form onsubmit="return mkTeam(event)">${F('Team Name','name')}${F('Leader Name','leader')}${F('Leader Mobile','mobile','','tel',MOB)}<button class="btn">Create</button> <button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></form>`)}
async function mkTeam(ev){
  ev.preventDefault();
  const f=Object.fromEntries(new FormData(ev.target));
  const newTeamId=nextId();
  try{
    await fetch('/api/teams/register',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({team:f.name,leader:f.leader,mobile:f.mobile,email:`${f.leader.replace(/\s+/g,'').toLowerCase()}@sample.com`,utr:'ADMIN_CREATED'})
    });
  }catch(err){}
  db.teams.push({id:newTeamId,name:f.name,leader:f.leader,mobile:f.mobile,email:'',college:'',year:'',members:[],track:'',problem:'',title:'',desc:'',pay:{method:'',utr:'',shot:'',status:'Pending'},status:'Pending',acc:{userId:f.leader,password:f.mobile,enabled:false}});
  save();closeModal();view();return false;
}
/* ---------- router ---------- */
function playHomeIntro(){
 const route=location.hash.slice(2)||'home';
 const intro=$('#intro');
 if(!intro)return;
 if(route!=='home'||matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('h24IntroSeen')){
  intro.remove();
  document.body.classList.remove('intro-playing');
  return;
 }
 sessionStorage.setItem('h24IntroSeen','1');
 intro.classList.add('is-active');
 document.body.classList.add('intro-playing');
 const finishIntro=()=>{
  intro.classList.add('is-leaving');
  setTimeout(()=>{
   try{intro.remove()}catch(e){}
   document.body.classList.remove('intro-playing');
  },520);
 };
 setTimeout(finishIntro,2200);
}
function view(){chrome();const r=(location.hash.slice(2)||'home');
 $('#app').innerHTML=({home,register,login:loginPg,team:teamPg,admin:adminPg}[r]||home)();tick();initScrollReveal()}
addEventListener('hashchange',()=>{scrollTo(0,0);view();playHomeIntro()});initAmbientEffects();playHomeIntro();view();syncPaymentSettingsOnLoad();

/* ---------- PAYMENT QR & AMOUNT ADMIN MANAGEMENT ---------- */
let pendingQrFile = null;
let pendingQrDataUrl = '';

function promptAdminPasswordConfirm({ title, description, onConfirm }) {
  if (ses?.role !== 'admin') {
    toast('Admin access is required.');
    return;
  }
  const modalHtml = `
    <div class="pw-modal-box">
      <h3>${esc(title)}</h3>
      <p class="pw-modal-desc">${esc(description)}</p>
      <form id="admin-confirm-form" onsubmit="return handleAdminConfirmSubmit(event)">
        <label>Admin Password
          <div class="pw-field-wrap">
            <input id="admin-confirm-pw" type="password" placeholder="Enter admin password" required autofocus autocomplete="current-password">
            <button type="button" class="pw-toggle-btn" onclick="toggleConfirmPwVisibility()" aria-label="Toggle password visibility">👁️</button>
          </div>
        </label>
        <div id="admin-confirm-err" class="err" style="margin-bottom:12px"></div>
        <div class="pw-modal-actions">
          <button type="button" class="btn ghost" onclick="cancelAdminConfirm()">Cancel</button>
          <button id="admin-confirm-btn" class="btn">Confirm</button>
        </div>
      </form>
    </div>
  `;
  openModal(modalHtml);
  window._pendingAdminConfirm = onConfirm;
}

function cancelAdminConfirm() {
  const input = $('#admin-confirm-pw');
  if (input) input.value = '';
  window._pendingAdminConfirm = null;
  closeModal();
}

function toggleConfirmPwVisibility() {
  const input = $('#admin-confirm-pw');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
}

async function handleAdminConfirmSubmit(ev) {
  ev.preventDefault();
  const input = $('#admin-confirm-pw'), errEl = $('#admin-confirm-err'), btn = $('#admin-confirm-btn');
  if (!input || !errEl) return false;
  const enteredPw = input.value;
  if (!enteredPw) {
    errEl.textContent = 'Please enter the admin password.';
    return false;
  }
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verifying…';
  }

  // Server-side verification
  let verified = false;
  try {
    const res = await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ password: enteredPw })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      verified = true;
    } else {
      errEl.textContent = data.message || 'Incorrect admin password. Please try again.';
    }
  } catch (netErr) {
    errEl.textContent = 'Server connection error verifying admin password.';
  }

  if (!verified) {
    input.value = '';
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Confirm';
    }
    input.focus();
    return false;
  }

  const cb = window._pendingAdminConfirm;
  window._pendingAdminConfirm = null;
  const pwToPass = enteredPw;
  input.value = '';
  closeModal();
  if (typeof cb === 'function') {
    cb(pwToPass);
  }
  return false;
}

function handleQrFileSelect(ev) {
  const file = ev.target.files?.[0];
  if (!file) return;
  const allowed = ['image/png', 'image/jpeg', 'image/jpg'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!allowed.includes(file.type) && !['png', 'jpg', 'jpeg'].includes(ext)) {
    toast('Only PNG, JPG, and JPEG images are allowed.');
    ev.target.value = '';
    return;
  }
  if (file.size > 2.5 * 1024 * 1024) {
    toast('File size exceeds 2.5MB. Please choose a smaller image.');
    ev.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    const testImg = new Image();
    testImg.onload = () => {
      pendingQrFile = file;
      pendingQrDataUrl = dataUrl;
      view();
      toast('New QR image selected. Review preview and click "Save New QR".');
    };
    testImg.onerror = () => {
      toast('The selected file is not a valid, readable image.');
      pendingQrFile = null;
      pendingQrDataUrl = '';
      ev.target.value = '';
    };
    testImg.src = dataUrl;
  };
  reader.onerror = () => toast('Could not read the selected image file.');
  reader.readAsDataURL(file);
}

function cancelPendingQr() {
  pendingQrFile = null;
  pendingQrDataUrl = '';
  view();
}

function requestSavePaymentQr() {
  if (!pendingQrDataUrl) {
    toast('Please select a new QR image first.');
    return;
  }
  promptAdminPasswordConfirm({
    title: 'Confirm Payment QR Change',
    description: 'Enter your admin password to replace the current active payment QR with the newly selected image.',
    onConfirm: async (adminPw) => {
      const newQr = pendingQrDataUrl;
      try {
        const res = await fetch('/api/payment-settings', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPw
          },
          body: JSON.stringify({
            upiId: getPaymentUpiId(),
            payeeName: getPaymentPayeeName(),
            fee: getRegistrationFee(),
            qrImage: newQr
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast('Error saving QR: ' + (data.message || 'Unauthorized'));
          return;
        }
      } catch (e) {
        toast('Backend offline: ' + e.message);
        return;
      }

      db.event.qrImage = newQr;
      save();
      pendingQrFile = null;
      pendingQrDataUrl = '';
      view();
      toast('Payment QR code updated successfully! ✓');
    }
  });
}

function requestResetPaymentQr() {
  if (!db.event?.qrImage) {
    toast('Payment QR is already using the default image.');
    return;
  }
  promptAdminPasswordConfirm({
    title: 'Confirm QR Reset',
    description: 'Enter your admin password to reset the payment QR code back to the default original image.',
    onConfirm: async (adminPw) => {
      try {
        const res = await fetch('/api/payment-settings', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPw
          },
          body: JSON.stringify({
            upiId: getPaymentUpiId(),
            payeeName: getPaymentPayeeName(),
            fee: getRegistrationFee(),
            qrImage: ''
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          toast('Error resetting QR: ' + (data.message || 'Unauthorized'));
          return;
        }
      } catch (e) {
        toast('Backend offline: ' + e.message);
        return;
      }

      delete db.event.qrImage;
      save();
      pendingQrFile = null;
      pendingQrDataUrl = '';
      view();
      toast('Payment QR reset to default image. ✓');
    }
  });
}

function requestSavePaymentSettings(ev) {
  ev.preventDefault();
  const form = ev.target;
  const rawUpi = (form.upiId?.value || '').trim();
  const rawPayee = (form.payeeName?.value || '').trim();
  const rawFee = (form.fee?.value || '').trim();

  // Validate UPI ID
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  if (!rawUpi || !upiRegex.test(rawUpi)) {
    toast('Enter a valid UPI ID format (e.g. name@bank or username@okhdfcbank).');
    return false;
  }

  // Validate Payee Name
  if (!rawPayee || rawPayee.length < 2 || rawPayee.length > 80) {
    toast('Enter a valid Payee Name (2 to 80 characters).');
    return false;
  }

  // Validate Registration Fee
  const num = Number(rawFee);
  if (!rawFee || isNaN(num) || num <= 0 || !/^\d+(\.\d{1,2})?$/.test(rawFee)) {
    toast('Enter a valid positive amount (e.g. 2000 or 1500.50). Rejecting zero or invalid numbers.');
    return false;
  }
  const formattedFee = (Math.round(num * 100) / 100).toFixed(rawFee.includes('.') ? 2 : 0);

  promptAdminPasswordConfirm({
    title: 'Confirm Payment Settings Update',
    description: `Enter your admin password to save payment settings: UPI ID (${rawUpi}), Payee (${rawPayee}), Fee (₹${formattedFee}).`,
    onConfirm: async (adminPw) => {
      // 1. Attempt backend synchronization with authorization
      let backendSuccess = false;
      let backendMsg = '';
      try {
        const res = await fetch('/api/payment-settings', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-password': adminPw
          },
          body: JSON.stringify({
            upiId: rawUpi,
            payeeName: rawPayee,
            fee: formattedFee,
            qrImage: db.event?.qrImage || ''
          })
        });
        const resData = await res.json();
        if (res.ok && resData.success) {
          backendSuccess = true;
          backendMsg = resData.message || 'Saved to MongoDB backend';
        } else {
          backendMsg = resData.message || 'Backend rejected update';
        }
      } catch (netErr) {
        backendMsg = 'Backend server offline: ' + netErr.message;
      }

      if (backendSuccess) {
        // Update local state only on authorized backend success
        db.event.upiId = rawUpi;
        db.event.payeeName = rawPayee;
        db.event.fee = formattedFee;
        save();
        view();
        toast('Payment settings saved to MongoDB & synced! ✓');
      } else {
        toast('Error: ' + backendMsg);
      }
    }
  });
  return false;
}

function paymentQrAdmin() {
  const currentQr = getPaymentQrImage();
  const currentFee = formatRupees(getRegistrationFee());
  return `
    <div class="qr-admin-section">
      <h3 style="margin-bottom:14px">PAYMENT QR & REGISTRATION FEE MANAGEMENT</h3>
      <div class="glass" style="margin-bottom:16px">
        <p style="color:var(--mu)">Manage the active UPI payment QR code and registration fee shown to participants on the payment and registration pages. Any sensitive changes require admin password re-verification.</p>
      </div>

      <div class="qr-admin-grid">
        <!-- Card 1: Active & Replacement QR -->
        <div class="glass qr-admin-card">
          <h4>Active Payment QR</h4>
          <p style="font-size:12px;color:var(--mu);margin-top:4px">Currently displayed to participants</p>
          <div class="qr-admin-preview-box">
            <img src="${esc(currentQr)}" alt="Current Payment QR">
          </div>
          <div style="margin-bottom:12px;padding:6px 14px;background:rgba(255,215,0,.08);border:1px solid var(--bd);border-radius:20px;display:inline-flex;align-items:center;gap:6px">
            <span style="font-size:12px;color:var(--mu)">Display Fee beside QR:</span>
            <b style="color:var(--c1);font-size:14px">${currentFee}</b>
          </div>
          <p style="font-size:11px;color:var(--mu);max-width:280px;line-height:1.4;margin-bottom:12px"><b>Note:</b> Uploaded UPI QR codes are static visual images. The registration fee is dynamically displayed alongside the QR on all registration and payment pages.</p>
          ${db.event?.qrImage ? `<button type="button" class="btn sm ghost" style="margin-bottom:12px" onclick="requestResetPaymentQr()">Reset to Default QR</button>` : ''}

          <div style="width:100%;border-top:1px solid var(--bd);padding-top:16px;margin-top:8px">
            <h4>Select Replacement QR</h4>
            <p style="font-size:12px;color:var(--mu);margin-bottom:10px">Accepts PNG, JPG, or JPEG (max 2.5MB)</p>
            <label class="btn sm" style="display:inline-block;cursor:pointer">
              Choose File
              <input type="file" accept="image/png,image/jpeg,image/jpg" hidden onchange="handleQrFileSelect(event)">
            </label>

            ${pendingQrDataUrl ? `
              <div style="margin-top:16px">
                <p style="font-weight:600;color:var(--c1)">New QR Preview (Unconfirmed):</p>
                <div class="qr-admin-preview-box" style="border-color:var(--c1);box-shadow:0 0 24px rgba(255,215,0,.35)">
                  <img src="${esc(pendingQrDataUrl)}" alt="New QR Preview">
                </div>
                <div style="display:flex;gap:10px;justify-content:center;margin-top:12px">
                  <button type="button" class="btn sm" onclick="requestSavePaymentQr()">Save New QR</button>
                  <button type="button" class="btn sm ghost" onclick="cancelPendingQr()">Cancel</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Card 2: Payment & UPI Settings Management -->
        <div class="glass qr-admin-card" style="align-items:stretch;text-align:left">
          <h4>Payment & UPI Settings</h4>
          <p style="font-size:13px;color:var(--mu);margin-top:4px;margin-bottom:14px">Configured payment details and registration fee used across the website and UPI intent links.</p>

          <!-- Live Preview of Active UPI Payment Details -->
          <div style="padding:14px;background:rgba(255,215,0,.04);border:1px solid var(--bd);border-radius:12px;margin-bottom:18px">
            <span style="font-size:11px;color:var(--mu);text-transform:uppercase;letter-spacing:.08em;display:block;margin-bottom:8px">Active Payment Details Preview</span>
            <div style="display:grid;gap:6px;font-size:13px">
              <p style="margin:0"><b>Payee Name:</b> <span style="color:var(--c1)">${esc(getPaymentPayeeName())}</span></p>
              <p style="margin:0"><b>UPI ID:</b> <span style="color:#fff;font-family:monospace;font-size:13px">${esc(getPaymentUpiId())}</span></p>
              <p style="margin:0"><b>Current Fee:</b> <b style="font-size:18px;color:var(--c1)">${currentFee}</b></p>
            </div>
          </div>

          <form onsubmit="return requestSavePaymentSettings(event)">
            <label>Recipient UPI ID
              <input name="upiId" type="text" placeholder="e.g. suba.arni@okaxis" value="${esc(getPaymentUpiId())}" required pattern="^[a-zA-Z0-9.\\-_]{2,256}@[a-zA-Z]{2,64}$" title="Enter a valid UPI ID (e.g. name@bank)">
            </label>
            <p style="font-size:11px;color:var(--mu);margin:3px 0 10px">The official UPI ID to receive registrations.</p>

            <label>Payee Name
              <input name="payeeName" type="text" placeholder="e.g. Banu Priya" value="${esc(getPaymentPayeeName())}" required minlength="2" maxlength="80">
            </label>
            <p style="font-size:11px;color:var(--mu);margin:3px 0 10px">Account holder or coordinator name shown in UPI apps.</p>

            <label>Registration Fee (₹)
              <input name="fee" type="text" placeholder="e.g. 2000" value="${esc(getRegistrationFee())}" required pattern="^[0-9]+(\\.[0-9]{1,2})?$" title="Positive number with at most two decimal places">
            </label>
            <p style="font-size:11px;color:var(--mu);margin:3px 0 16px">Configured fee per team. Changes apply to all new payment attempts.</p>

            <button class="btn" style="width:100%">Save Payment Settings</button>
          </form>
        </div>
      </div>
    </div>
  `;
}
