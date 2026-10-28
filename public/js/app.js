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
  {t:'Eligibility & Team Size',d:'Open to students of all years. Each team must consist of 2 to 4 members, including 1 Team Leader.'},
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
  {t:'What is the required team size?',d:'Each team must have 2 to 4 members, including the Team Leader.'},
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
 return{name,email,mobile:String(item?.mobile??'').trim(),college:String(item?.college??'').trim(),department:String(item?.department??'').trim(),year:String(item?.year??'1').trim()};
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
const renderParticipantDetails=team=>[{name:team.leader,email:team.email,mobile:team.mobile,college:team.college,department:team.department,year:team.year},...normalizeMembers(team.members)].map((person,index)=>`<p><b>${index===0?'Leader':'Member '+index}:</b> ${esc(person.name||'—')} · ${esc(person.email||'—')} · ${esc(person.mobile||'—')}<br><small>${esc(person.college||'—')} · ${esc(person.department||'—')} · Year ${esc(person.year||'—')}</small></p>`).join('');
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
// Security hygiene: Ensure no team acc.password is ever persisted in localStorage
if(Array.isArray(db.teams)){db.teams.forEach(t=>{if(t.acc&&'password' in t.acc)delete t.acc.password;});}
db.event={...DEF.event,...(db.event||{})};
if(!db.event.title||db.event.title==='24H Hackathon')db.event.title=DEF.event.title;
if(!db.event.about||db.event.about.includes('Edit the hackathon description'))db.event.about=DEF.event.about;
if(!db.event.date)db.event.date=DEF.event.date;
if(!db.event.time||db.event.time===TBA)db.event.time=DEF.event.time;
if(!db.event.venue||db.event.venue===TBA)db.event.venue=DEF.event.venue;
if(!db.event.contact||db.event.contact.includes('Add contact details'))db.event.contact=DEF.event.contact;
if(!db.timeline?.length)db.timeline=[...DEF.timeline];
if(!db.rules?.length)db.rules=[...DEF.rules];
if(!db.prizes?.length)db.prizes=[...DEF.prizes];
if(!db.judges?.length)db.judges=[...DEF.judges];
if(!db.faq?.length)db.faq=[...DEF.faq];
db.rules=db.rules.map(item=>item.t==='Eligibility & Team Size'&&/exactly 4 members/i.test(item.d)?{...item,d:DEF.rules[0].d}:item);
db.faq=db.faq.map(item=>item.t==='What is the required team size?'&&/4 members/i.test(item.d)?{...item,d:DEF.faq.find(entry=>entry.t===item.t).d}:item);
db.problemStatementFiles ||= [];
const save=()=>{
  db.teams.forEach(t=>{
    t.members=normalizeMembers(t.members);
    if(t.acc&&'password' in t.acc)delete t.acc.password;
  });
  localStorage.setItem(KEY,JSON.stringify(db));
};
db.teams.forEach(t=>t.members=normalizeMembers(t.members));save();
let ses=JSON.parse(sessionStorage.getItem('h24s')||'null'),reg={step:1,d:{teamSize:2},participants:[],submitting:false,error:''},adm={tab:'overview',q:'',teamSize:'',payStatus:''};
let adminSessionStatus='unknown',adminSessionPromise=null,adminTeamsSyncPromise=null,adminTeamsSyncAttempted=false;
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
function personInitials(name){
  const clean = String(name || '').replace(/^(mr|ms|mrs|dr|prof)\.?\s+/i, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function renderGuestAvatar(judge){
  const name = String(judge?.t || '').trim();
  const img = String(judge?.img || '').trim();
  const inits = personInitials(name);
  if (img) {
    return `<div class="av"><img class="guest-photo-frame" src="${esc(img)}" alt="${esc(name)}" loading="lazy" onerror="this.outerHTML='<div class=\\'guest-initials-avatar\\' aria-label=\\'${esc(name)}\\'>${esc(inits)}</div>'"></div>`;
  }
  return `<div class="av"><div class="guest-initials-avatar" aria-label="${esc(name)}">${esc(inits)}</div></div>`;
}
const go=(h,sec)=>{location.hash='#/'+h;if(sec)setTimeout(()=>document.getElementById(sec)?.scrollIntoView(),80);$('nav')?.classList.remove('open')};
const login=(role,id)=>{ses={role,id};sessionStorage.setItem('h24s',JSON.stringify(ses));if(role==='admin'){adminSessionStatus='unknown';adminSessionPromise=null;adminTeamsSyncAttempted=false}};
const logout=async ()=>{
  if(ses?.role==='admin'){adminSessionStatus='unknown';adminSessionPromise=null;adminTeamsSyncPromise=null;adminTeamsSyncAttempted=false}
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
let eventSyncStatus = 'idle'; // 'idle' | 'syncing' | 'synced' | 'error'
let eventSyncError = '';

async function fetchBackendEventData() {
  const res = await fetch('/api/event');
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.message || `Server returned error (${res.status})`);
  }
  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.message || 'Malformed event data response');
  }
  return json.data;
}

async function syncEventDataOnLoad() {
  eventSyncStatus = 'syncing';
  eventSyncError = '';
  try {
    const data = await fetchBackendEventData();
    if (data) {
      if (data.event) db.event = { ...DEF.event, ...data.event };
      if (Array.isArray(data.timeline)) db.timeline = data.timeline;
      if (Array.isArray(data.rules)) db.rules = data.rules;
      if (Array.isArray(data.prizes)) db.prizes = data.prizes;
      if (Array.isArray(data.judges)) db.judges = data.judges;
      if (Array.isArray(data.faq)) db.faq = data.faq;
      if (Array.isArray(data.tracks)) db.tracks = data.tracks;
      if (Array.isArray(data.problemStatementFiles)) db.problemStatementFiles = data.problemStatementFiles;
      if (Array.isArray(data.announcements)) db.announcements = data.announcements;

      eventSyncStatus = 'synced';
      eventSyncError = '';
      save(); // Cache to localStorage
      view();
    }
  } catch (err) {
    console.error('Failed to load event data from /api/event:', err);
    eventSyncStatus = 'error';
    eventSyncError = 'Unable to connect to live server. Displaying cached data: ' + (err.message || 'Network error');
    view();
    toast('Live event data failed to load: ' + (err.message || 'Server error'));
  }
}

async function uploadProblemStatementFileContent(fileId, payload) {
  const res = await fetch(`/api/admin/problem-file/${encodeURIComponent(fileId)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Failed to upload problem statement file (${res.status})`);
  }
  return json;
}

async function publishEventDataToBackend() {
  // Map problem statement files: send problem statement files as metadata only, NEVER fileData
  const problemFilesPayload = db.problemStatementFiles.map(item => ({
    id: item.id,
    track: item.track,
    title: item.title,
    description: item.description,
    fileName: item.fileName,
    fileType: item.fileType,
    uploadDate: item.uploadDate,
    active: item.active !== false
  }));

  const payload = {
    event: db.event,
    timeline: db.timeline,
    rules: db.rules,
    prizes: db.prizes,
    judges: db.judges,
    faq: db.faq,
    tracks: db.tracks,
    problemStatementFiles: problemFilesPayload,
    announcements: db.announcements
  };

  const payloadStr = JSON.stringify(payload);
  if (payloadStr.length > 1024 * 1024) {
    throw new Error('Event data payload exceeds the maximum allowed size of 1 MB.');
  }

  const res = await fetch('/api/event', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: payloadStr
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Failed to publish event data (${res.status})`);
  }
  return json;
}

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
addEventListener('keydown',e=>{if(e.key==='Escape'){closeWhatsAppPopup()}});
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
 <section id="about"><h2>About Event</h2><div class="glass"><p>${esc(e.about)}</p><p style="color:var(--mu)"><b>Date:</b> ${esc(e.date)} · <b>Time:</b> ${esc(e.time)}<br><b>Venue:</b> ${esc(e.venue)}</p></div>
 <div class="grid" style="margin-top:16px">${['26 Hours Non-Stop','2–4 Members per Team','Technical Innovation','Mentorship: United Soft Tech','Prize Pool: ₹10,000','Students from All Years'].map(x=>`<div class="glass"><h3>${x}</h3></div>`).join('')}</div></section>
 <section id="timeline"><h2>Timeline</h2><div class="tl">${L(db.timeline,x=>`<div class="glass"><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div>`,'Timeline not published yet')}</div></section>
 <section id="rules"><h2>Rules & Guidelines</h2>${L(db.rules,x=>`<details class="glass"><summary>${esc(x.t)}</summary><p>${esc(x.d)}</p></details>`,'Rules not published yet')}</section>
 <section id="prizes"><h2>Prizes & Recognition</h2><div class="grid">${L(db.prizes,x=>`<div class="glass prize"><h3>${esc(x.t)}</h3><b>${esc(x.d)}</b></div>`,'Prizes not published yet')}</div></section>
 <section id="judges"><h2>Guests & Industry Mentors</h2><div class="grid">${L(db.judges,x=>`<div class="glass">${renderGuestAvatar(x)}<h3>${esc(x.t)}</h3><p style="color:var(--mu)">${esc(x.d)}</p></div>`,'Judges and mentors not published yet')}</div></section>
 <section id="faq"><h2>Frequently Asked Questions</h2>${L(db.faq,x=>`<details class="glass"><summary>${esc(x.t)}</summary><p>${esc(x.d)}</p></details>`,'FAQ not published yet')}</section>
 <button id="whatsapp-trigger" class="whatsapp-trigger" type="button" onclick="openWhatsAppPopup()" aria-label="Join WhatsApp Group">
  <span class="whatsapp-tooltip" role="tooltip">Join WhatsApp Group</span>
  <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.02 3.2A12.66 12.66 0 0 0 5.1 22.27L3.3 28.8l6.68-1.75A12.65 12.65 0 1 0 16.02 3.2Zm0 22.98c-1.97 0-3.9-.53-5.57-1.53l-.4-.24-3.97 1.04 1.06-3.86-.26-.41a10.3 10.3 0 1 1 9.14 5Zm5.65-7.72c-.31-.16-1.84-.91-2.13-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.36.23-.67.08-.31-.16-1.33-.49-2.53-1.55-.94-.84-1.57-1.87-1.75-2.18-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62 0 1.55 1.13 3.05 1.28 3.26.16.21 2.22 3.39 5.37 4.75.75.32 1.33.51 1.79.65.75.24 1.43.21 1.97.13.6-.09 1.84-.75 2.1-1.47.26-.73.26-1.35.18-1.47-.08-.13-.29-.21-.6-.37Z"/></svg>
 </button>
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
const registrationSize=()=>Number(reg.d.teamSize)||2;
function updateRegistrationTeamSize(value){
 const size=Number(value);
 if(![2,3,4].includes(size))return;
 if(reg.step===2){
  const form=$('#app form');
  if(form)reg.participants=Array.from({length:registrationSize()},(_,i)=>({
   name:String(form.elements[`p${i}_name`]?.value||'').trim(),
   email:lowerEmail(form.elements[`p${i}_email`]?.value),
   mobile:String(form.elements[`p${i}_mobile`]?.value||'').trim(),
   college:String(form.elements[`p${i}_college`]?.value||'').trim(),
   department:String(form.elements[`p${i}_department`]?.value||'').trim(),
   year:String(form.elements[`p${i}_year`]?.value||'1')
  }));
 }
 reg.d.teamSize=size;
 if(reg.step===2){
  reg.participants=Array.from({length:size},(_,i)=>reg.participants[i]||{year:'1'});
  reg.error='';view();return;
 }
}
function participantCard(participant,index){
 const leader=index===0,label=leader?'Team Leader':'Team Member '+index;
 const p=participant||{};
 return `<article class="glass participant-card"><h3>${esc(label)}${leader?' <span>(counts as 1 member)</span>':''}</h3><div class="two">
 ${F('Full name',`p${index}_name`,p.name,'text','maxlength="100"')}
 ${F('Email address',`p${index}_email`,p.email,'email','maxlength="254"')}
 ${F('Mobile number',`p${index}_mobile`,p.mobile,'tel',MOB)}
 ${F('College name',`p${index}_college`,p.college,'text','maxlength="160"')}
 ${F('Department',`p${index}_department`,p.department,'text','maxlength="120"')}
 <label>Year of study<select name="p${index}_year" required>${['1','2','3','4'].map(year=>`<option value="${year}" ${String(p.year||'1')===year?'selected':''}>Year ${year}</option>`).join('')}</select></label>
 </div></article>`;
}
function participantSummary(participant,index){
 return `<li><b>${index===0?'Leader':'Member '+index}:</b> ${esc(participant.name)} · ${esc(participant.email)} · ${esc(participant.mobile)}<br><span>${esc(participant.college)} · ${esc(participant.department)} · Year ${esc(participant.year)}</span></li>`;
}
function register(){
 const d=reg.d,s=reg.step,names=['Team','Members','Done'],size=registrationSize();
 let h=`<section class="narrow registration-flow"><h2>Team Registration</h2><div class="steps">${names.map((n,i)=>`<span class="${i+1===s?'on':''}">${i+1}. ${n}</span>`).join('')}</div><div class="glass">`;
 if(s===1)h+=`<form id="registration-step1-form" onsubmit="return rs(event,1)"><div class="two">
 ${F('Team Name','team',d.team,'text','maxlength="100"')}
 <label>Team Size<select name="teamSize" required onchange="updateRegistrationTeamSize(this.value)">${[2,3,4].map(count=>`<option value="${count}" ${size===count?'selected':''}>${count} Members</option>`).join('')}</select></label>
 </div><button class="btn">Next: Member Details</button></form>`;
 if(s===2){
  h+=`<form id="registration-step2-form" onsubmit="return submitRegistration(event)"><div class="two"><label>Team Size<select name="teamSize" required onchange="updateRegistrationTeamSize(this.value)">${[2,3,4].map(count=>`<option value="${count}" ${size===count?'selected':''}>${count} Members</option>`).join('')}</select></label></div><p class="registration-intro">Enter complete details for all ${size} participants. The team leader is participant 1.</p>`;
  for(let i=0;i<size;i++)h+=participantCard(reg.participants[i],i);
  h+=`${reg.error?`<p class="registration-error" role="alert">${esc(reg.error)}</p>`:''}<button type="button" class="btn ghost" onclick="reg.step=1;reg.error='';view()">Back</button> <button class="btn" type="submit" ${reg.submitting?'disabled':''}>${reg.submitting?'Submitting…':'Submit Registration'}</button></form>`;
 }
 if(s===3){
  const t=reg.done;
  h+=`<div class="ok"><div class="tick">✓</div><h3>Registration Successful</h3><p>Team ID: <b>${esc(t.id)}</b> · ${esc(t.name)}</p><p>${t.teamSize} participants · Status: ${badge(t.status)}</p><p style="color:var(--mu);margin-top:12px">Your team registration is complete. You can log in now using your <b>Team Leader Name</b> (${esc(t.leader)}) and <b>Mobile Number</b>.</p><button class="btn" onclick="reg={step:1,d:{teamSize:2},participants:[],submitting:false,error:''};go('login')">Go to Login</button></div>`;
 }
 return h+'</div></section>';
}
function rs(ev,s){
 ev.preventDefault();
 const f=Object.fromEntries(new FormData(ev.target)),d=reg.d;
 if(s===1){
  const teamSize=Number(f.teamSize);
  if(!Number.isInteger(teamSize)||teamSize<2||teamSize>4){reg.error='Select a team size from 2 to 4.';view();return false}
  d.team=String(f.team||'').trim();d.teamSize=teamSize;
  if(d.team.length<2){reg.error='Enter a team name with at least 2 characters.';view();return false}
  reg.error='';reg.participants=Array.from({length:teamSize},(_,i)=>reg.participants[i]||{year:'1'});reg.step=2;view();return false;
 }
 return false;
}

async function submitRegistration(ev){
 ev.preventDefault();
 if(reg.submitting)return false;
 const form=ev.target,f=Object.fromEntries(new FormData(form));
 const size=registrationSize();
 const participants=Array.from({length:size},(_,i)=>({
  name:String(f[`p${i}_name`]||'').trim(),
  email:lowerEmail(f[`p${i}_email`]),
  mobile:String(f[`p${i}_mobile`]||'').trim(),
  college:String(f[`p${i}_college`]||'').trim(),
  department:String(f[`p${i}_department`]||'').trim(),
  year:String(f[`p${i}_year`]||'1')
 }));

 const emails=participants.map(person=>person.email);
 if(emails.some((email,index)=>emails.indexOf(email)!==index)){
  reg.error='Each participant must use a different email address.';view();return false;
 }
 if(emails.some(email=>teamEmailExists(email))){
  reg.error='A participant email is already registered. Use a different email address.';view();return false;
 }

 reg.participants=participants;
 reg.submitting=true;reg.error='';
 const submitButton=form.querySelector('button[type="submit"]');
 if(submitButton){submitButton.disabled=true;submitButton.textContent='Submitting…'}

 try{
  const response=await fetch('/api/teams/register',{
   method:'POST',headers:{'Content-Type':'application/json'},
   body:JSON.stringify({team:reg.d.team,teamSize:size,participants})
  });
  let result=null;
  const rawText=await response.text();
  try{
   result=JSON.parse(rawText);
  }catch(_jsonErr){
   result=null;
  }
  if(!response.ok||!result?.success||!result?.data?.id){
   const errorMsg=result?.message||`Registration failed (${response.status}: ${response.statusText||'Server error'}).`;
   throw new Error(errorMsg);
  }
  const data=result.data,leader=reg.participants[0],members=reg.participants.slice(1);
  const team={
   id:data.id,name:reg.d.team,leader:leader.name,mobile:leader.mobile,email:leader.email,college:leader.college,department:leader.department,year:leader.year,
   teamSize:data.teamSize,createdAt:data.createdAt,
   members,track:'',problem:'',title:'',desc:'',
   status:data.status||'Approved',acc:{userId:data.userId,enabled:true}
  };
  db.teams.push(team);save();reg.done=team;reg.step=3;reg.submitting=false;view();
 }catch(error){
  reg.submitting=false;
  reg.error=error.message||'Registration failed. Please check your connection and try again.';
  view();
 }finally{
  reg.submitting=false;
 }
 return false;
}
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
      let data=null;
      const rawText=await res.text();
      try{data=JSON.parse(rawText);}catch(_e){data=null;}
      if(res.ok && data?.success){
        login('admin');
        go('admin');
      } else {
        er.textContent=data?.message||`Invalid admin ID or password (${res.status}).`;
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
    let data=null;
    const rawText=await res.text();
    try{data=JSON.parse(rawText);}catch(_e){data=null;}
    if(res.ok && data?.success && data?.teamId){
      login('team',data.teamId);
      // Fetch latest profile from server
      try{
        const meRes=await fetch('/api/teams/me',{credentials:'include'});
        const meData=await meRes.json();
        if(meRes.ok && meData?.data){
          let existingIdx=db.teams.findIndex(t=>t.id===meData.data.id);
          if(existingIdx>=0) db.teams[existingIdx]=meData.data;
          else db.teams.push(meData.data);
          save();
        }
      }catch(e){}
      go('team');
      return false;
    } else {
      er.textContent=data?.message||'Invalid User ID or password.';
      return false;
    }
  }catch(err){
    er.textContent='Server connection error. Please ensure the backend is running.';
    return false;
  }
}/* ---------- TEAM DASHBOARD (own data only) ---------- */
function downloadBase64DataUrl(dataUrl, fileName, viewInNewTab = false) {
  if (viewInNewTab) {
    const win = window.open();
    if (win) {
      win.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      return;
    }
  }
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName || 'problem-statement-file';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function downloadTeamProblemFile(fileId, fileName, viewInNewTab = false) {
  try {
    toast('Fetching problem statement file...');
    const res = await fetch(`/api/teams/problem-file/${encodeURIComponent(fileId)}`, {
      credentials: 'include'
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      toast(json.message || 'Failed to download problem file.');
      return;
    }
    const fileData = json.data?.fileData;
    if (!fileData) {
      toast('File content is empty.');
      return;
    }
    downloadBase64DataUrl(fileData, json.data?.fileName || fileName, viewInNewTab);
  } catch (err) {
    toast('Network error downloading file: ' + err.message);
  }
}

async function downloadAdminProblemFile(fileId, fileName, viewInNewTab = false) {
  try {
    toast('Fetching problem statement file...');
    const res = await fetch(`/api/admin/problem-file/${encodeURIComponent(fileId)}`, {
      credentials: 'include'
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      toast(json.message || 'Failed to download problem file.');
      return;
    }
    const fileData = json.data?.fileData;
    if (!fileData) {
      toast('File content is empty.');
      return;
    }
    downloadBase64DataUrl(fileData, json.data?.fileName || fileName, viewInNewTab);
  } catch (err) {
    toast('Network error downloading file: ' + err.message);
  }
}

function teamPg(){const t=myTeam();if(!t){logout();return ''}const e=db.event;
 const assignedStatement=t.problemStatementId?db.problemStatementFiles.find(item=>item.id===t.problemStatementId):db.problemStatementFiles.find(item=>item.track===t.track&&item.title===t.problem);
 const assignedTrack=assignedStatement?.track||t.track,assignedProblem=assignedStatement?.title||t.problem,statementFile=assignedStatement?.active?assignedStatement:null;
 return `<section><h2>Welcome, ${esc(t.name)}</h2><div class="grid"><div class="glass">Registration<br>${badge(t.status||'Approved')}</div><div class="glass">Account<br>${badge(t.acc?.enabled?'Enabled':'Disabled')}</div></div>
 <div class="glass" style="margin-top:16px"><h3>Team ${t.id}</h3><p>Leader: ${esc(t.leader)} · ${esc(t.mobile)} · ${esc(t.email)}<br>${esc(t.college)} · Year ${esc(t.year)}<br>Project: <b>${esc(t.title)}</b> – ${esc(t.desc)}</p>
 <h3>Members</h3>${renderTeamMembers(t.members)}</div>
 <div class="glass" style="margin-top:16px"><h3>TRACK & PROBLEM STATEMENT</h3><p>Assigned Track Name: <b>${esc(assignedTrack||'Not selected yet')}</b><br>Problem Statement Title: <b>${esc(assignedProblem||'Not selected yet')}</b></p>
 ${assignedStatement?`<p>Problem Statement Description: ${esc(assignedStatement.description||'')}</p>`:''}
 ${statementFile?`<p>File Name: <b>${esc(statementFile.fileName)}</b><br>File Type: ${esc(statementFile.fileType)}<br>Upload Date: ${esc(statementFile.uploadDate)}</p><p><button class="btn sm" type="button" onclick="downloadTeamProblemFile('${statementFile.id}','${esc(statementFile.fileName)}',true)">View File</button> <button class="btn sm ghost" type="button" onclick="downloadTeamProblemFile('${statementFile.id}','${esc(statementFile.fileName)}',false)">Download File</button></p>`:assignedStatement?'<p>This problem statement file is currently unavailable.</p>':'<p>No active problem statement file has been assigned yet.</p>'}
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
const ALIST={timeline:['t','d','Timeline (Title | Description)'],rules:['t','d','Rules (Title | Description)'],prizes:['t','d','Prizes (Category | Amount)'],judges:['t','d','Judges & Mentors (Name | Role | image path optional)'],faq:['t','d','FAQ (Question | Answer)']};
const PROBLEM_FILE_EXTENSIONS=['pdf','doc','docx','ppt','pptx','zip'];
function problemStatementFilesAdmin(){
 const current=db.problemStatementFiles.find(item=>item.id===adm.editProblemFileId),trackNames=[...new Set([...db.tracks.map(track=>track.name),...db.problemStatementFiles.map(item=>item.track)])];
 const accept='.pdf,.doc,.docx,.ppt,.pptx,.zip';
 const records=db.problemStatementFiles.map(item=>`<div class="glass" style="margin-top:12px"><div class="two"><p><b>Track:</b> ${esc(item.track)}</p><p><b>Problem Statement:</b> ${esc(item.title)}</p><p><b>File Name:</b> ${esc(item.fileName)}</p><p><b>File Type:</b> ${esc(item.fileType)}</p><p><b>Upload Date:</b> ${esc(item.uploadDate)}</p><p><b>Status:</b> ${badge(item.active?'Active':'Inactive')}</p></div><p>${esc(item.description)}</p><button class="btn sm" type="button" onclick="editProblemStatementFile('${item.id}')">Edit</button> <button class="btn sm ghost" type="button" onclick="downloadAdminProblemFile('${item.id}','${esc(item.fileName)}',false)">Download File</button> <label class="btn sm ghost" for="replace-file-${item.id}" style="display:inline-block;cursor:pointer">Replace File</label><input id="replace-file-${item.id}" type="file" accept="${accept}" hidden onchange="replaceProblemStatementFile(event,'${item.id}')"> <button class="btn sm ghost" type="button" onclick="toggleProblemStatementFile('${item.id}')">${item.active?'Disable':'Enable'}</button> <button class="btn sm red" type="button" onclick="deleteProblemStatementFile('${item.id}')">Delete</button></div>`).join('')||'<p class="glass">No problem statement files have been added yet.</p>';
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
 if(file&&file.size>2*1024*1024){toast('Problem statement file exceeds the maximum allowed size of 2 MB.');return false}
 if(db.problemStatementFiles.some(item=>item.id!==existing?.id&&item.track===track&&item.title===title)){toast('This problem statement already exists for that track.');return false}
 const persist=async(fileData)=>{
  const oldRecords=db.problemStatementFiles.slice(),oldStatement=existing?{...existing}:null,oldTracks=db.tracks.map(item=>({name:item.name,problems:[...item.problems]}));
  const statementId=existing?.id||globalThis.crypto?.randomUUID?.()||('ps-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  const fileName=file?file.name:(existing?.fileName||'');
  const fileType=file?file.name.split('.').pop().toUpperCase():(existing?.fileType||'');

  if(file&&fileData){
    try{
      await uploadProblemStatementFileContent(statementId,{fileName,fileType,fileData});
    }catch(uploadErr){
      console.error('Problem statement file upload failed:',uploadErr);
      toast('Failed to upload problem statement file: '+uploadErr.message);
      return;
    }
  }

  try{
   const statement=existing||{id:statementId,uploadDate:'',fileName:'',fileType:'',active:true};
   Object.assign(statement,{track,title,description});
   if(existing)statement.active=data.active==='true';
   if(file){statement.fileName=fileName;statement.fileType=fileType;statement.uploadDate=new Date().toISOString().slice(0,10)}
   delete statement.fileData;
   if(!existing)db.problemStatementFiles.push(statement);
   addProblemToTrack(track,title);save();adm.editProblemFileId='';view();
   publishEventDataToBackend().then(()=>{toast('Problem statement file saved and published to server. ✓');}).catch(err=>toast('Saved locally, but server metadata update failed: '+err.message));
  }catch(error){
   if(existing)Object.assign(existing,oldStatement);
   db.problemStatementFiles=oldRecords;db.tracks=oldTracks;
   console.error('Could not save problem statement file:',error);toast('Could not save the file. Browser storage may be full; try a smaller file.');
  }
 };
 if(file){const reader=new FileReader();reader.onload=()=>{if(typeof reader.result!=='string'){toast('The selected file could not be read.');return}persist(reader.result)};reader.onerror=()=>toast('The selected file could not be read.');reader.readAsDataURL(file)}
 else persist(null);
 return false;
}
function editProblemStatementFile(id){if(ses?.role!=='admin')return;adm.editProblemFileId=id;view();setTimeout(()=>document.querySelector('.admin-problem-files')?.scrollIntoView({behavior:'smooth'}),0)}
function replaceProblemStatementFile(ev,id){
 if(ses?.role!=='admin'){toast('Admin access is required.');return}
 const file=ev.target.files[0],statement=db.problemStatementFiles.find(item=>item.id===id);if(!file||!statement)return;
 if(!allowedProblemFile(file)){toast('Supported files: PDF, DOC, DOCX, PPT, PPTX, and ZIP.');ev.target.value='';return}
 if(file.size>2*1024*1024){toast('Problem statement file exceeds the maximum allowed size of 2 MB.');ev.target.value='';return}
 const reader=new FileReader();reader.onload=async()=>{
  if(typeof reader.result!=='string'){toast('The selected file could not be read.');return}
  const newFileName=file.name;
  const newFileType=file.name.split('.').pop().toUpperCase();
  try{
    await uploadProblemStatementFileContent(statement.id,{fileName:newFileName,fileType:newFileType,fileData:reader.result});
  }catch(uploadErr){
    console.error('Replacing problem statement file upload failed:',uploadErr);
    toast('Failed to upload replaced file: '+uploadErr.message);
    return;
  }
  const old={fileName:statement.fileName,fileType:statement.fileType,uploadDate:statement.uploadDate};
  try{
    statement.fileName=newFileName;
    statement.fileType=newFileType;
    statement.uploadDate=new Date().toISOString().slice(0,10);
    delete statement.fileData;
    save();view();
    publishEventDataToBackend().then(()=>{toast('Problem statement file replaced and published to server. ✓');}).catch(err=>toast('Replaced locally, but server metadata update failed: '+err.message));
  }catch(error){Object.assign(statement,old);console.error('Could not replace problem statement file:',error);toast('Could not replace the file. Browser storage may be full; try a smaller file.')}
 };
 reader.onerror=()=>toast('The selected file could not be read.');reader.readAsDataURL(file);
}
function toggleProblemStatementFile(id){if(ses?.role!=='admin'){toast('Admin access is required.');return}const item=db.problemStatementFiles.find(record=>record.id===id);if(!item)return;item.active=!item.active;save();view();publishEventDataToBackend().then(()=>toast('Problem statement status updated on server. ✓')).catch(err=>toast('Updated locally, but server update failed: '+err.message));}
function deleteProblemStatementFile(id){if(ses?.role!=='admin'){toast('Admin access is required.');return}if(!confirm('Delete this problem statement file?'))return;const index=db.problemStatementFiles.findIndex(item=>item.id===id);if(index<0)return;const [removed]=db.problemStatementFiles.splice(index,1);save();view();publishEventDataToBackend().then(()=>toast('Problem statement file deleted from server. ✓')).catch(err=>toast('Deleted locally, but server update failed: '+err.message));}
function adminPg(){
  if(ses?.role!=='admin'){go('login');return ''}
  if(adminSessionStatus==='unknown'){
    verifyAdminSession().then(authenticated=>{
      if(authenticated&&!adminTeamsSyncAttempted){adminTeamsSyncAttempted=true;syncAdminTeamsFromBackend()}
      if(location.hash==='#/admin'&&ses?.role==='admin')view();
    });
  }else if(adminSessionStatus==='verified'&&!adminTeamsSyncAttempted){
    adminTeamsSyncAttempted=true;syncAdminTeamsFromBackend();
  }
  const T=db.teams,tabs=['overview','event','teams','accounts','announcements','problem-files'],tabLabels={'problem-files':'Track & Problem Statement Files'};
 let h=`<section><h2>Admin Dashboard</h2>${adminSessionStatus==='unavailable'?'<p class="err">Could not verify the admin session. Your local dashboard data is preserved. <button class="btn sm" type="button" onclick="retryAdminSession()">Retry verification</button></p>':''}<div class="tabs">${tabs.map(t=>`<button class="btn ${adm.tab==t?'on':''}" onclick="adm.tab='${t}';view()">${tabLabels[t]||t[0].toUpperCase()+t.slice(1)}</button>`).join('')}<button class="btn ghost" type="button" onclick="refreshAdminTeams()" ${adminTeamsSyncPromise?'disabled':''}>Refresh teams</button></div>`;
 if(adm.tab=='overview')h+=`<div class="grid">${[['Total Teams',T.length],['Participants',T.reduce((n,t)=>n+1+t.members.length,0)],['Approved Teams',T.filter(t=>t.status=='Approved').length],['Active Accounts',T.filter(t=>t.acc?.enabled).length]].map(([l,n])=>`<div class="glass stat"><b>${n}</b>${l}</div>`).join('')}</div>`;
 if(adm.tab=='event'){const e=db.event;h+=`<form class="glass" onsubmit="return saveEv(event)"><div class="two">${['title','date','time','venue','contact'].map(k=>`<label>${k[0].toUpperCase()+k.slice(1)}<input name="${k}" type="${k=='date'?'date':'text'}" value="${esc(e[k])}"></label>`).join('')}</div><label>Description<textarea name="about">${esc(e.about)}</textarea></label>
  ${Object.entries(ALIST).map(([k,[a,b,l]])=>`<label>${l} – one per line<textarea name="${k}">${esc(lines(db[k],x=>k==='judges'?(x.img?[x.t,x.d,x.img].join(' | '):[x.t,x.d].join(' | ')):x.t+' | '+x.d))}</textarea></label>`).join('')}
  <label>Tracks (Track | Problem 1 ; Problem 2 ...)<textarea name="tracks">${esc(lines(db.tracks,t=>t.name+' | '+t.problems.join(' ; ')))}</textarea></label><button class="btn">Save event data</button></form>`}
 if(adm.tab=='teams'){
  const q=adm.q.toLowerCase(),L=T.filter(t=>{
   const size=Number(t.teamSize)||1+(t.members?.length||0);
   return JSON.stringify([t.id,t.name,t.leader,t.mobile,t.email,t.members,t.track,t.problem]).toLowerCase().includes(q)&&(!adm.teamSize||String(size)===adm.teamSize);
  });
  h+=`<input placeholder="Search teams and participants…" value="${esc(adm.q)}" oninput="adm.q=this.value;view()" style="margin-bottom:10px"><div class="admin-team-filters"><label>Team size<select onchange="adm.teamSize=this.value;view()"><option value="">All team sizes</option>${[2,3,4].map(size=>`<option value="${size}" ${adm.teamSize===String(size)?'selected':''}>${size} members</option>`).join('')}</select></label></div>
  <div class="glass"><table><thead><tr><th>ID<th>Team<th>Leader<th>Team size<th>Participants<th>Registered<th>Status<th>Account<th>Actions</tr></thead><tbody>${L.map(t=>`<tr><td data-l="ID">${esc(t.id)}<td data-l="Team">${esc(t.name)}<td data-l="Leader">${esc(t.leader)}<td data-l="Team size">${Number(t.teamSize)||1+(t.members?.length||0)}<td data-l="Participants" class="admin-participants">${renderParticipantDetails(t)}<td data-l="Registered">${t.createdAt?esc(new Date(t.createdAt).toLocaleString('en-IN')):'—'}<td data-l="Status">${badge(t.status||'Approved')}<td data-l="Account">${badge(t.acc?.enabled?'Enabled':'Disabled')}<td data-l="Actions"><button class="btn sm" onclick="editTeam('${esc(t.id)}')">Edit</button> <button class="btn sm red" onclick="delTeam('${esc(t.id)}')">Del</button></tr>`).join('')||'<tr><td colspan="9">No teams found.</td></tr>'}</tbody></table></div>`;
 }
 if(adm.tab=='accounts')h+=`<div class="glass"><table><thead><tr><th>Team ID<th>Leader<th>User ID<th>Password<th>Status<th></tr></thead><tbody>${T.map(t=>`<tr><td data-l="Team ID">${t.id}<td data-l="Leader">${esc(t.leader)}<td data-l="User ID">${esc(t.acc?.userId||t.leader)}<td data-l="Password"><span style="color:var(--mu);font-size:12px">Protected (bcrypt)</span><td data-l="Status">${badge(t.acc?.enabled?'Enabled':'Disabled')}<td><button class="btn sm" onclick="editAcc('${t.id}')">Edit</button> <button class="btn sm ghost" onclick="toggleAcc('${t.id}')">${t.acc?.enabled?'Disable':'Enable'}</button></tr>`).join('')||'<tr><td>No accounts yet.</tr>'}</tbody></table></div><button class="btn" style="margin-top:14px" onclick="newTeam()">+ Create team & account</button>`;
 if(adm.tab=='announcements')h+=`<form class="glass" onsubmit="return addAnn(event)">${F('Title','t')}<label>Message<textarea name="d" required></textarea></label><button class="btn">Post announcement</button></form>${db.announcements.map((a,i)=>`<div class="glass" style="margin-top:10px"><b>${esc(a.t)}</b><p>${esc(a.d)}</p><button class="btn sm red" onclick="delAnn(${i})">Delete</button></div>`).join('')}`;
 if(adm.tab=='problem-files')h+=problemStatementFilesAdmin();
 return h+'</section>'}
async function verifyAdminSession(){
 if(ses?.role!=='admin')return false;
 if(adminSessionStatus==='verified')return true;
 if(adminSessionStatus==='checking')return adminSessionPromise;
 if(adminSessionStatus!=='unknown')return false;
 adminSessionStatus='checking';
 adminSessionPromise=(async()=>{
  try{
   const res=await fetch('/api/admin/me',{credentials:'include'});
   const data=await res.json();
   if(res.status===401||(res.ok&&data.authenticated===false)){
    adminSessionStatus='expired';toast('Admin session expired. Please log in again.');logout();return false;
   }
   if(!res.ok)throw new Error(data.message||'Admin session verification failed.');
   adminSessionStatus='verified';return true;
  }catch(error){
   adminSessionStatus='unavailable';console.warn('Could not verify admin session:',error.message);return false;
  }finally{adminSessionPromise=null}
 })();
 return adminSessionPromise;
}
async function retryAdminSession(){
 if(ses?.role!=='admin')return;
 adminSessionStatus='unknown';
 const authenticated=await verifyAdminSession();
 if(authenticated&&!adminTeamsSyncAttempted){adminTeamsSyncAttempted=true;await syncAdminTeamsFromBackend()}
 view();
}
async function refreshAdminTeams(){
 if(ses?.role!=='admin')return;
 if(adminSessionStatus!=='verified'){
  adminSessionStatus='unknown';
  if(!await verifyAdminSession()){view();return}
 }
 adminTeamsSyncAttempted=true;
 await syncAdminTeamsFromBackend();
}
async function saveEv(ev){
  ev.preventDefault();
  const f=Object.fromEntries(new FormData(ev.target));
  ['title','date','time','venue','contact','about'].forEach(k=>db.event[k]=f[k]);
  Object.keys(ALIST).forEach(k=>{if(k==='judges'){db.judges=f.judges.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split('|').map(x=>x.trim());return{t:p[0]||'',d:p[1]||'',img:p[2]||''}})}else{db[k]=parse(f[k],['t','d'])}});
  const editedTracks=parse(f.tracks,['name','p']).map(t=>({name:t.name,problems:t.p.split(';').map(x=>x.trim()).filter(Boolean)}));
  for(const item of db.problemStatementFiles){
    let track=editedTracks.find(t=>t.name===item.track);
    if(!track){track={name:item.track,problems:[]};editedTracks.push(track)}
    if(!track.problems.includes(item.title))track.problems.push(item.title)
  }
  db.tracks=editedTracks;
  save();
  view();
  toast('Saving event data to server…');
  try{
    await publishEventDataToBackend();
    toast('Event data saved and published live! ✓');
  }catch(err){
    console.error('Error publishing event data:',err);
    toast('Saved locally, but server update failed: '+err.message);
  }
  return false;
}
async function addAnn(ev){
  ev.preventDefault();
  db.announcements.unshift(Object.fromEntries(new FormData(ev.target)));
  save();
  view();
  toast('Posting announcement to server…');
  try{
    await publishEventDataToBackend();
    toast('Announcement posted live! ✓');
  }catch(err){
    console.error('Error publishing announcement:',err);
    toast('Saved locally, but server update failed: '+err.message);
  }
  return false;
}
async function delAnn(index){
  db.announcements.splice(index,1);
  save();
  view();
  toast('Deleting announcement from server…');
  try{
    await publishEventDataToBackend();
    toast('Announcement deleted from server! ✓');
  }catch(err){
    console.error('Error deleting announcement:',err);
    toast('Deleted locally, but server update failed: '+err.message);
  }
}
function editTeam(id){
 const t=db.teams.find(x=>x.id==id);
 if(!t){alert('Team not found: '+id);return;}
 openModal(`<h3>Edit ${t.id}</h3><form onsubmit="return saveTeam(event,'${id}')"><div class="two">${[['Team Name','name'],['Leader','leader'],['Mobile','mobile'],['Email','email'],['College','college'],['Department','department'],['Year','year'],['Project Title','title']].map(([l,k])=>F(l,k,t[k]||'')).join('')}
 <label>Track<select id="editTrack" name="track" onchange="refreshAdminProblems(this.value)">${trackOptions(t.track,true)}</select></label><label>Problem Statement<select id="editProblem" name="problem">${problemOptions(t.track,t.problem,true)}</select></label>
 <label>Registration Status<select name="st">${['Pending','Approved','Rejected'].map(x=>`<option ${(t.status||'Approved')==x?'selected':''}>${x}</option>`).join('')}</select></label></div>
 <label>Description<textarea name="desc">${esc(t.desc||'')}</textarea></label><label>Additional members (one per line: Name | Email | Mobile | College | Department | Year)<textarea name="mem">${esc(lines(t.members||[],m=>{if(!m)return'';if(typeof m==='string')return m;return[m.name||'',m.email||'',m.mobile||'',m.college||'',m.department||'',m.year||''].join(' | ')}))}</textarea></label>
 <button class="btn">Save</button> <button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></form>`);
}
async function syncAdminTeamsFromBackend(){
  if(ses?.role!=='admin'||adminSessionStatus!=='verified')return;
  if(adminTeamsSyncPromise)return adminTeamsSyncPromise;
  adminTeamsSyncPromise=(async()=>{
  try{
    const res=await fetch('/api/admin/teams',{credentials:'include'});
    if(res.status===401){adminSessionStatus='expired';toast('Admin session expired. Please log in again.');logout();return}
    if(!res.ok)throw new Error(`Team refresh failed (${res.status}).`);
    const data=await res.json();
    if(!data.success||!Array.isArray(data.data))throw new Error('The server returned an invalid team list.');
    let teams=data.data;
    if(teams.length){
      if(JSON.stringify(db.teams)!==JSON.stringify(teams)){
        db.teams=teams;
        save();
        if(!hasUnsavedAdminChanges()&&location.hash==='#/admin')view();
        else toast('Latest team data was loaded. Your open form was left unchanged.');
      }
    }
  }catch(error){console.warn('Backend team sync failed; local team data was preserved:',error.message);toast('Could not refresh teams. Existing local data was preserved.')}
  })();
  try{return await adminTeamsSyncPromise}
  finally{adminTeamsSyncPromise=null}
}
function hasUnsavedAdminChanges(){
 return Boolean($('#app form')||(!$('#modal')?.classList.contains('hide')));
}

async function saveTeam(ev,id){
  ev.preventDefault();
  const f=Object.fromEntries(new FormData(ev.target)),t=db.teams.find(x=>x.id==id);
  const email=lowerEmail(f.email);
  const members=normalizeMembers(f.mem.split('\n').map(line=>{const [name,email,mobile,college,department,year]=line.split('|');return{name:String(name||'').trim(),email:lowerEmail(email),mobile:String(mobile||'').trim(),college:String(college||'').trim(),department:String(department||'').trim(),year:String(year||'1').trim()}}));
  const emails=[email,...members.map(member=>member.email)].filter(Boolean);
  if(emails.some((value,index)=>emails.indexOf(value)!==index)||emails.some(value=>teamEmailExists(value,id))){alert('Each team email must be unique and not already used by another team member or team.');return false}

  // Sync to backend API
  try{
    await fetch(`/api/admin/teams/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify({
        name:f.name,leader:f.leader,mobile:f.mobile,email,college:f.college,department:f.department,year:f.year,
        track:f.track,problem:f.problem,title:f.title,desc:f.desc,st:f.st,members
      })
    });
  }catch(err){console.warn('Backend admin team update offline, saved locally:',err.message);}

  ['name','leader','mobile','college','department','year','track','problem','title','desc'].forEach(k=>t[k]=f[k]);
  t.email=email;
  t.problemStatementId=db.problemStatementFiles.find(item=>item.track===f.track&&item.title===f.problem)?.id||'';t.status=f.st;
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
function editAcc(id){const t=db.teams.find(x=>x.id==id);openModal(`<h3>Account ${t.id}</h3><form onsubmit="return saveAcc(event,'${id}')">${F('Team ID','id',t.id)}${F('Leader Name','leader',t.leader)}${F('User ID','uid',t.acc?.userId||t.leader)}${F('Mobile','mobile',t.mobile)}<label>New Password (leave blank to keep current)<input name="pw" type="password" placeholder="Enter new password"></label><button class="btn">Save</button> <button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></form>`)}
async function saveAcc(ev,id){
  ev.preventDefault();
  const f=Object.fromEntries(new FormData(ev.target)),t=db.teams.find(x=>x.id==id);
  if(f.id!=id&&db.teams.some(x=>x.id==f.id)){alert('Team ID already exists');return false}
  const payload={leader:f.leader,mobile:f.mobile};
  if(f.pw&&String(f.pw).trim()){payload.password=String(f.pw).trim()}
  try{
    await fetch(`/api/admin/teams/${id}`,{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body:JSON.stringify(payload)
    });
  }catch(err){console.warn('Backend save acc offline, updating locally:',err.message);}
  t.id=f.id;t.leader=f.leader;t.mobile=f.mobile;t.acc.userId=f.uid;save();closeModal();view();return false;
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
      body:JSON.stringify({team:f.name,teamSize:2,participants:[
        {name:f.leader,email:`${f.leader.replace(/\s+/g,'').toLowerCase()}@sample.com`,mobile:f.mobile,college:'College',department:'Dept',year:'1'},
        {name:'Member 2',email:`member2_${Date.now()}@sample.com`,mobile:'9000000000',college:'College',department:'Dept',year:'1'}
      ]})
    });
  }catch(err){}
  db.teams.push({id:newTeamId,name:f.name,leader:f.leader,mobile:f.mobile,email:'',college:'',year:'',members:[],track:'',problem:'',title:'',desc:'',status:'Approved',acc:{userId:f.leader,enabled:true}});
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
function eventSyncBanner(){
  if(eventSyncStatus!=='error')return '';
  return `<div class="event-sync-error-banner" style="background:rgba(239,68,68,.15);border:1px solid #ef4444;color:#fca5a5;padding:10px 16px;border-radius:8px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px"><span>⚠️ <b>Connection Error:</b> ${esc(eventSyncError||'Failed to load live event data. Displaying cached data.')}</span><button class="btn sm" type="button" onclick="syncEventDataOnLoad()">Retry</button></div>`;
}
function view(){chrome();const r=(location.hash.slice(2)||'home');
 $('#app').innerHTML=eventSyncBanner()+({home,register,login:loginPg,team:teamPg,admin:adminPg}[r]||home)();tick();initScrollReveal()}
addEventListener('hashchange',()=>{scrollTo(0,0);view();playHomeIntro()});initAmbientEffects();playHomeIntro();view();syncEventDataOnLoad();

