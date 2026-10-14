/* 24H Hackathon – Excel Engineering College, Dept. of IT. Data lives in localStorage (demo backend). */
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const KEY='h24db',TBA='To be announced';
const WHATSAPP_GROUP_LINK='https://chat.whatsapp.com/BJ3qXPchD6JDrv3ADqXkqT';
const DEF={event:{title:'24H Hackathon',about:'Edit the hackathon description from the Admin Dashboard.',date:'',time:TBA,venue:TBA,fee:'',contact:'Add contact details in Admin > Event'},
timeline:[],rules:[],prizes:[],judges:[],faq:[],tracks:[],problemStatementFiles:[],announcements:[],teams:[],admin:{id:'admin',pw:'admin123'}};
const lowerEmail=v=>String(v??'').trim().toLowerCase();
const normalizeMembers=members=>Array.isArray(members)?members.map(item=>{
 if(typeof item==='string')return{name:String(item).trim(),email:''};
 const name=String(item?.name??'').trim();
 const email=lowerEmail(item?.email??'');
 return{name,email};
}).filter(item=>item.name||item.email):[];
const memberNames=members=>normalizeMembers(members).map(item=>item.name).filter(Boolean);
const teamEmailExists=(email,ignoreTeamId='')=>{
 const target=lowerEmail(email);
 if(!target)return false;
 return db.teams.some(team=>{
  if(String(team.id)===String(ignoreTeamId))return false;
  if(lowerEmail(team.email)===target)return true;
  return normalizeMembers(team.members).some(member=>lowerEmail(member.email)===target);
 });
};
let db=JSON.parse(localStorage.getItem(KEY)||'null')||DEF;
db.problemStatementFiles ||= [];
const save=()=>{db.teams.forEach(t=>t.members=normalizeMembers(t.members));localStorage.setItem(KEY,JSON.stringify(db))};
db.teams.forEach(t=>t.members=normalizeMembers(t.members));save();
let ses=JSON.parse(sessionStorage.getItem('h24s')||'null'),reg={step:1,d:{},m:[]},adm={tab:'overview',q:''};
const ADDR='NH-544 Salem Main Road, Pallakkapalayam, Sankari West Post, Komarapalayam – 637303, Namakkal District, Tamil Nadu';
const badge=v=>`<span class="tag ${/inactive|reject|disab|fail/i.test(v)?'x':/paid|approved|enabled|complete|active/i.test(v)?'':'p'}">${esc(v)}</span>`;
const empty=t=>`<p class="glass">${t} — the admin will add this soon.</p>`;
function initAmbientEffects(){
 const layer=document.querySelector('.aurora'),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 if(!layer||!ctx)return;
 canvas.id='ambientCanvas';layer.append(canvas);
 const orbit=document.querySelector('#cursorOrbit');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const mobile=innerWidth<700;
 const interactive=matchMedia('(hover: hover) and (pointer: fine)').matches&&!reduced;
 const particles=Array.from({length:mobile?18:38},()=>({x:Math.random(),y:Math.random(),r:Math.random()*1.15+.3,a:Math.random()*.13+.045,vx:(Math.random()-.5)*.000035,vy:(Math.random()-.5)*.000025,phase:Math.random()*Math.PI*2,h:[38,42,46,49][Math.random()*4|0]}));
 const orbits=Array.from({length:mobile?2:4},(_,i)=>({x:.12+Math.random()*.76,y:.12+Math.random()*.76,r:Math.min(innerWidth,innerHeight)*(.09+Math.random()*.12),phase:Math.random()*Math.PI*2,speed:(i%2?-1:1)*(.000035+Math.random()*.000035),alpha:.075+Math.random()*.055}));
 const bursts=[];
 const trail=[];let width=0,height=0,ratio=1,frame=0,last=0,energy=0;
 let targetX=innerWidth*.5,targetY=innerHeight*.45,pointerX=targetX,pointerY=targetY,parallaxX=0,parallaxY=0,cursorVisible=false;
 let nextBurst=performance.now()+(mobile?9000:3500);
 function resize(){ratio=Math.min(devicePixelRatio||1,mobile?1.25:1.5);width=innerWidth;height=innerHeight;canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(ratio,0,0,ratio,0,0);if(frame)cancelAnimationFrame(frame);frame=0;draw(performance.now())}
 function sparkBurst(now){
  const cx=(.12+Math.random()*.76)*width,cy=(.12+Math.random()*.76)*height;
  for(let i=0,count=mobile?5:9;i<count;i++){const angle=Math.random()*Math.PI*2,speed=.3+Math.random()*.8;bursts.push({x:cx,y:cy,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,born:now,life:1100+Math.random()*900,r:.55+Math.random()*1.05,h:[38,43,47][Math.random()*3|0]})}
  nextBurst=now+(mobile?12000:6500)+Math.random()*3500;
 }
 function draw(now){
  if(width<=0||height<=0)return;
  ctx.clearRect(0,0,width,height);
  for(const p of particles){if(!reduced){p.x+=p.vx;p.y+=p.vy}if(p.x<0)p.x=1;if(p.x>1)p.x=0;if(p.y<0)p.y=1;if(p.y>1)p.y=0;const x=p.x*width,y=p.y*height,alpha=p.a*(.68+.32*Math.sin(now*.001+p.phase));ctx.beginPath();ctx.fillStyle=`hsla(${p.h},70%,72%,${alpha})`;ctx.shadowColor=`hsla(${p.h},78%,68%,.36)`;ctx.shadowBlur=5;ctx.arc(x,y,p.r,0,Math.PI*2);ctx.fill()}
  ctx.shadowBlur=0;
  for(const ring of orbits){
   const x=ring.x*width,y=ring.y*height,r=ring.r;
   ctx.save();ctx.translate(x,y);ctx.rotate(now*ring.speed+ring.phase);ctx.beginPath();ctx.setLineDash([1.2,7]);ctx.lineDashOffset=-now*.003;ctx.arc(0,0,r,0,Math.PI*2);ctx.strokeStyle=`rgba(220,178,91,${ring.alpha})`;ctx.lineWidth=.8;ctx.shadowColor='rgba(232,189,88,.34)';ctx.shadowBlur=6;ctx.stroke();ctx.setLineDash([]);
   const angle=now*ring.speed*1.7+ring.phase;ctx.beginPath();ctx.fillStyle=`rgba(255,231,171,${ring.alpha*2.6})`;ctx.shadowColor='rgba(232,189,88,.8)';ctx.shadowBlur=8;ctx.arc(Math.cos(angle)*r,Math.sin(angle)*r,1.35,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  if(!reduced&&now>=nextBurst)sparkBurst(now);
  for(let i=bursts.length-1;i>=0;i--){const p=bursts[i],age=(now-p.born)/p.life;if(age>=1){bursts.splice(i,1);continue}p.x+=p.vx;p.y+=p.vy;const fade=(1-age)*.34;ctx.beginPath();ctx.fillStyle=`hsla(${p.h},76%,72%,${fade})`;ctx.shadowColor=`hsla(${p.h},85%,70%,${fade})`;ctx.shadowBlur=6;ctx.arc(p.x,p.y,p.r*(.7+age*.45),0,Math.PI*2);ctx.fill()}
  ctx.shadowBlur=0;
  if(interactive){
   const dt=last?Math.min(now-last,32):16;last=now;
   pointerX+=(targetX-pointerX)*(1-Math.exp(-dt/75));pointerY+=(targetY-pointerY)*(1-Math.exp(-dt/75));
   parallaxX+=(Math.max(0,Math.min(1,targetX/width))*2-1-parallaxX)*.025;parallaxY+=(Math.max(0,Math.min(1,targetY/height))*2-1-parallaxY)*.025;
   document.documentElement.style.setProperty('--parallax-x',(parallaxX*12).toFixed(2)+'px');document.documentElement.style.setProperty('--parallax-y',(parallaxY*10).toFixed(2)+'px');
   if(orbit){orbit.style.transform=`translate3d(${pointerX}px,${pointerY}px,0) translate(-50%,-50%) scale(${.92+energy*.08})`;orbit.classList.toggle('visible',cursorVisible)}
   energy*=Math.exp(-dt/520);
   const radius=Math.max(width,height,1)*(.16+energy*.12),glow=ctx.createRadialGradient(Number.isFinite(pointerX)?pointerX:width/2,Number.isFinite(pointerY)?pointerY:height/2,0,Number.isFinite(pointerX)?pointerX:width/2,Number.isFinite(pointerY)?pointerY:height/2,radius);
   glow.addColorStop(0,`rgba(220,174,72,${.026+energy*.065})`);glow.addColorStop(.38,`rgba(189,135,48,${.018+energy*.035})`);glow.addColorStop(.72,`rgba(244,221,160,${.01+energy*.02})`);glow.addColorStop(1,'rgba(244,221,160,0)');
   ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
   for(let i=trail.length-1;i>=0;i--){const dot=trail[i],age=(now-dot.born)/720;if(age>=1){trail.splice(i,1);continue}const fade=1-age,rad=dot.r*fade,gradient=ctx.createRadialGradient(dot.x,dot.y,0,dot.x,dot.y,rad*3.5);gradient.addColorStop(0,`hsla(${dot.h},75%,76%,${fade*.3})`);gradient.addColorStop(1,`hsla(${dot.h},75%,65%,0)`);ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(dot.x,dot.y,rad*3.5,0,Math.PI*2);ctx.fill()}
  }
  if(!reduced||trail.length||energy>.002)frame=requestAnimationFrame(draw);else frame=0;
 }
 function move(e){if(!interactive||e.pointerType==='touch')return;targetX=e.clientX;targetY=e.clientY;cursorVisible=true;energy=Math.min(1,energy+.34);if(Math.random()<.48)trail.push({x:e.clientX,y:e.clientY,born:performance.now(),r:1+Math.random()*1.6,h:[38,42,46][Math.random()*3|0]});if(trail.length>24)trail.splice(0,trail.length-24);if(!frame)frame=requestAnimationFrame(draw)}
 function leave(e){if(!e.relatedTarget)cursorVisible=false}
 addEventListener('resize',resize,{passive:true});if(interactive){addEventListener('pointermove',move,{passive:true});addEventListener('pointerout',leave,{passive:true});addEventListener('blur',()=>cursorVisible=false)}
 resize();if(!reduced&&!frame)frame=requestAnimationFrame(draw);
}
initAmbientEffects();
/* ---------- helpers ---------- */
const lines=(a,f)=>a.map(f).join('\n');
const parse=(t,keys)=>t.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{const p=l.split('|').map(x=>x.trim());return Object.fromEntries(keys.map((k,i)=>[k,p[i]||'']))});
const go=(h,sec)=>{location.hash='#/'+h;if(sec)setTimeout(()=>document.getElementById(sec)?.scrollIntoView(),80);$('nav')?.classList.remove('open')};
const login=(role,id)=>{ses={role,id};sessionStorage.setItem('h24s',JSON.stringify(ses))};
const logout=()=>{ses=null;sessionStorage.removeItem('h24s');go('home')};
const nextId=()=>'24H'+String(db.teams.reduce((m,t)=>Math.max(m,+t.id.slice(3)||0),0)+1).padStart(3,'0');
const myTeam=()=>ses?.role==='team'?db.teams.find(t=>t.id===ses.id):null;
function toast(m){const d=document.createElement('div');d.className='glass';d.style.cssText='position:fixed;bottom:20px;right:20px;z-index:99';d.textContent=m;document.body.append(d);setTimeout(()=>d.remove(),2200)}
function openModal(h){const m=$('#modal');m.innerHTML=`<div class="glass">${h}</div>`;m.classList.remove('hide')}
const closeModal=()=>$('#modal').classList.add('hide');
let whatsappCloseTimer;
let paymentCloseTimer;
const PAYMENT_UPI_ID='YOUR_UPI_ID';
const PAYMENT_QR_IMAGE='assets/images/payment-qr.jpe';
const PAYMENT_QR_PLACEHOLDER_TEXT='24H Hackathon payment QR code';
const PAYMENT_QR_PLACEHOLDER=PAYMENT_QR_IMAGE;
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
function fallbackCopyPaymentUpi(){const input=document.createElement('textarea');input.value=PAYMENT_UPI_ID;input.setAttribute('readonly','');input.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(input);input.select();const copied=document.execCommand('copy');input.remove();return copied}
async function copyPaymentUpi(){const button=$('#copy-upi');if(!button)return;try{if(navigator.clipboard?.writeText)await navigator.clipboard.writeText(PAYMENT_UPI_ID);else if(!fallbackCopyPaymentUpi())throw new Error('Clipboard access is unavailable');button.textContent='Copied ✓';setTimeout(()=>{if(button.isConnected)button.textContent='COPY UPI ID'},1800)}catch(error){try{if(fallbackCopyPaymentUpi()){button.textContent='Copied ✓';setTimeout(()=>{if(button.isConnected)button.textContent='COPY UPI ID'},1800);return}}catch(fallbackError){console.error('Could not copy UPI ID:',fallbackError)}console.error('Could not copy UPI ID:',error);toast('Could not copy UPI ID. Please copy it manually.')} }
function openPaymentRegistration(){closePaymentPopup();reg.step=1;go('register');if(location.hash==='#/register'){view();setTimeout(()=>document.querySelector('form')?.scrollIntoView({behavior:'smooth'}),80)}}
addEventListener('keydown',e=>{if(e.key==='Escape'){closeWhatsAppPopup();closePaymentPopup()}});
/* ---------- chrome ---------- */
function chrome(){
 const dash=ses?`<a onclick="go('${ses.role==='admin'?'admin':'team'}')">Dashboard</a><a onclick="logout()">Logout</a>`:`<a onclick="go('login')">Login</a>`;
 $('#hdr').innerHTML=`<div class="brand-wrap logo" onclick="go('home')" aria-label="Go to home page">
   <img class="brand-mark" src="assets/images/excel-logo.png" alt="Excel Engineering College logo">
   <div class="brand-text">
     <span class="brand-title">Excel Engineering College</span>
     <small>Department of Information Technology</small>
   </div>
 </div>
 <button id="burger" class="btn sm ghost" onclick="$('nav').classList.toggle('open')" aria-label="Menu">☰</button>
 <nav>${['home','about','timeline','rules','prizes','judges','faq'].map(s=>`<a onclick="go('home','${s}')">${s[0].toUpperCase()+s.slice(1)}</a>`).join('')}${dash}<a class="btn sm" onclick="go('register')">Register Now</a></nav>`;
 $('#ftr').innerHTML=`<b>Excel Engineering College</b> – Department of Information Technology<br>${ADDR}<br>${esc(db.event.contact)}`;
}
/* ---------- HOME ---------- */
function home(){const e=db.event,L=(a,f,t)=>a.length?a.map(f).join(''):empty(t);
 return `<section class="hero"><h1>24H HACKATHON</h1><h3>Department of Information Technology<br>Excel Engineering College, Komarapalayam</h3>
 <p>${esc(e.about)}</p><div class="cd" id="cd"></div>
 <button class="btn" onclick="go('register')">Register Now</button><button class="btn ghost" onclick="go('home','about')">View Details</button></section>
 <section id="about"><h2>About</h2><div class="glass"><p>${esc(e.about)}</p><p style="color:var(--mu)">Date: ${esc(e.date||TBA)} · Time: ${esc(e.time)} · Venue: ${esc(e.venue)}${e.fee?' · Fee: ₹'+esc(e.fee):''}</p></div>
 <div class="grid" style="margin-top:16px">${['24 Hours','Team-Based Challenge','Innovation','Technology','Mentorship','Prizes'].map(x=>`<div class="glass"><h3>${x}</h3></div>`).join('')}</div></section>
 <section id="timeline"><h2>Timeline</h2><div class="tl">${L(db.timeline,x=>`<div class="glass"><b>${esc(x.t)}</b><p>${esc(x.d)}</p></div>`,'Timeline not published yet')}</div></section>
 <section id="rules"><h2>Rules & Guidelines</h2>${L(db.rules,x=>`<details class="glass"><summary>${esc(x.t)}</summary><p>${esc(x.d)}</p></details>`,'Rules not published yet')}</section>
 <section id="prizes"><h2>Prizes</h2><div class="grid">${L(db.prizes,x=>`<div class="glass prize"><h3>${esc(x.t)}</h3><b>${esc(x.d)}</b></div>`,'Prizes not published yet')}</div></section>
 <section id="judges"><h2>Judges & Mentors</h2><div class="grid">${L(db.judges,x=>`<div class="glass"><div class="av"></div><h3>${esc(x.t)}</h3><p style="color:var(--mu)">${esc(x.d)}</p></div>`,'Judges and mentors not published yet')}</div></section>
 <section id="faq"><h2>FAQ</h2>${L(db.faq,x=>`<details class="glass"><summary>${esc(x.t)}</summary><p>${esc(x.d)}</p></details>`,'FAQ not published yet')}</section>
 <button id="payment-trigger" class="payment-trigger" type="button" onclick="openPaymentPopup()" aria-label="Payment QR"><span class="payment-tooltip" role="tooltip">Payment QR</span><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 4h9v9H4zM7 7v3h3V7zM19 4h9v9h-9zM22 7v3h3V7zM4 19h9v9H4zM7 22v3h3v-3zM17 17h4v4h-4zM23 17h5v3h-5zM17 23h3v5h-3zM22 23h6v2h-6zM25 26h3v2h-3z" fill="currentColor"/></svg></button>
 <button id="whatsapp-trigger" class="whatsapp-trigger" type="button" onclick="openWhatsAppPopup()" aria-label="Join WhatsApp Group">
  <span class="whatsapp-tooltip" role="tooltip">Join WhatsApp Group</span>
  <svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16.02 3.2A12.66 12.66 0 0 0 5.1 22.27L3.3 28.8l6.68-1.75A12.65 12.65 0 1 0 16.02 3.2Zm0 22.98c-1.97 0-3.9-.53-5.57-1.53l-.4-.24-3.97 1.04 1.06-3.86-.26-.41a10.3 10.3 0 1 1 9.14 5Zm5.65-7.72c-.31-.16-1.84-.91-2.13-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.36.23-.67.08-.31-.16-1.33-.49-2.53-1.55-.94-.84-1.57-1.87-1.75-2.18-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62 0 1.55 1.13 3.05 1.28 3.26.16.21 2.22 3.39 5.37 4.75.75.32 1.33.51 1.79.65.75.24 1.43.21 1.97.13.6-.09 1.84-.75 2.1-1.47.26-.73.26-1.35.18-1.47-.08-.13-.29-.21-.6-.37Z"/></svg>
 </button>
 <div id="payment-popup" class="payment-overlay" hidden aria-hidden="true" onclick="if(event.target===this)closePaymentPopup()"><section class="payment-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-popup-title"><button class="payment-close" type="button" onclick="closePaymentPopup()" aria-label="Close">×</button><p class="payment-eyebrow">24H HACKATHON</p><h2 id="payment-popup-title">24H HACKATHON PAYMENT</h2><p class="payment-popup-subtitle">Scan the QR Code to complete registration payment</p><div class="payment-qr-frame popup-qr-frame"><img class="payment-qr-image" src="${PAYMENT_QR_PLACEHOLDER}" alt="${PAYMENT_QR_PLACEHOLDER_TEXT}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="payment-qr-placeholder" role="img" aria-label="${PAYMENT_QR_PLACEHOLDER_TEXT}" hidden>${PAYMENT_QR_PLACEHOLDER_TEXT}</div></div><p class="payment-popup-upi"><b>UPI ID:</b> ${PAYMENT_UPI_ID}</p><div class="payment-popup-actions"><button id="copy-upi" class="btn" type="button" onclick="copyPaymentUpi()">COPY UPI ID</button><button class="btn ghost" type="button" onclick="openPaymentRegistration()">OPEN REGISTRATION</button></div></section></div>
 <div id="whatsapp-popup" class="whatsapp-overlay" hidden aria-hidden="true" onclick="if(event.target===this)closeWhatsAppPopup()">
  <section class="whatsapp-dialog" role="dialog" aria-modal="true" aria-labelledby="whatsapp-title" aria-describedby="whatsapp-description">
   <button class="whatsapp-close" type="button" onclick="closeWhatsAppPopup()" aria-label="Close popup">×</button>
   <div class="whatsapp-popup-icon" aria-hidden="true"><svg viewBox="0 0 32 32"><path fill="currentColor" d="M16.02 3.2A12.66 12.66 0 0 0 5.1 22.27L3.3 28.8l6.68-1.75A12.65 12.65 0 1 0 16.02 3.2Zm0 22.98c-1.97 0-3.9-.53-5.57-1.53l-.4-.24-3.97 1.04 1.06-3.86-.26-.41a10.3 10.3 0 1 1 9.14 5Zm5.65-7.72c-.31-.16-1.84-.91-2.13-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-.99 1.23-.18.21-.36.23-.67.08-.31-.16-1.33-.49-2.53-1.55-.94-.84-1.57-1.87-1.75-2.18-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.55-.08-.16-.71-1.71-.97-2.34-.25-.61-.51-.53-.71-.54h-.61c-.21 0-.55.08-.84.39-.29.31-1.1 1.07-1.1 2.62 0 1.55 1.13 3.05 1.28 3.26.16.21 2.22 3.39 5.37 4.75.75.32 1.33.51 1.79.65.75.24 1.43.21 1.97.13.6-.09 1.84-.75 2.1-1.47.26-.73.26-1.35.18-1.47-.08-.13-.29-.21-.6-.37Z"/></svg></div>
   <p class="whatsapp-eyebrow">24H HACKATHON</p>
   <h2 id="whatsapp-title">Join the Official WhatsApp Group</h2>
   <p class="whatsapp-college">Department of Information Technology<br>Excel Engineering College</p>
   <p id="whatsapp-description" class="whatsapp-description">Join our official WhatsApp group to receive hackathon updates, announcements, important instructions and event notifications.</p>
   <p class="whatsapp-action-label">JOIN WHATSAPP GROUP</p>
   <a class="whatsapp-join" href="${WHATSAPP_GROUP_LINK}" target="_blank" rel="noopener noreferrer">Join Group</a>
  </section>
 </div>`}
function tick(){const el=$('#cd');if(!el)return;const t=db.event.date?new Date(db.event.date+'T'+(/^\d\d:\d\d/.test(db.event.time)?db.event.time.slice(0,5):'09:00')):null;
 if(!t||isNaN(t)){el.innerHTML='<div class="glass" style="font-size:16px">Date to be announced</div>';return}
 let s=Math.max(0,(t-Date.now())/1000|0);const v=[['Days',s/86400|0],['Hours',s/3600%24|0],['Min',s/60%60|0],['Sec',s%60]];
 el.innerHTML=v.map(([l,n])=>`<div class="glass">${String(n).padStart(2,'0')}<small>${l}</small></div>`).join('')}
setInterval(tick,1000);
/* ---------- REGISTER ---------- */
const F=(l,n,v='',t='text',x='')=>`<label>${l}<input name="${n}" type="${t}" value="${esc(v)}" ${x} required></label>`;
const YR=(n,v)=>`<label>Year<select name="${n}">${['1','2','3','4'].map(y=>`<option ${v==y?'selected':''}>${y}</option>`).join('')}</select></label>`;
const MOB='pattern="[0-9]{10}" title="10-digit mobile number"';
const trackOptions=(selected,includeCurrent=false)=>{const tracks=[...db.tracks];if(includeCurrent&&selected&&!tracks.some(t=>t.name===selected))tracks.push({name:selected,problems:[]});return `<option value="">Not selected yet</option>${tracks.map(t=>`<option value="${esc(t.name)}" ${selected===t.name?'selected':''}>${esc(t.name)}</option>`).join('')}`};
const problemOptions=(trackName,selected,includeCurrent=false)=>{const problems=[...(db.tracks.find(t=>t.name===trackName)?.problems||[])];if(includeCurrent&&selected&&!problems.includes(selected))problems.push(selected);return `<option value="">Not selected yet</option>${problems.map(problem=>`<option value="${esc(problem)}" ${selected===problem?'selected':''}>${esc(problem)}</option>`).join('')}`};
function register(){const d=reg.d,s=reg.step,names=['Team','Members','Payment','Done'];
 let h=`<section class="narrow"><h2>Team Registration</h2><div class="steps">${names.map((n,i)=>`<span class="${i+1==s?'on':''}">${i+1}. ${n}</span>`).join('')}</div><div class="glass">`;
 if(s==1)h+=`<form onsubmit="return rs(event,1)"><div class="two">${F('Team Name','team',d.team)}${F('Team Leader Name','leader',d.leader)}${F('Leader Mobile','mobile',d.mobile,'tel',MOB)}${F('Leader Email','email',d.email,'email')}${F('College Name','college',d.college)}${YR('year',d.year)}${F('Number of Team Members (including leader)','count',d.count||4,'number','min=1 max=6')}</div><button class="btn">Next</button></form>`;
 if(s==2){const totalMembers=Math.max(0,Number(d.count || 0));h+=`<form onsubmit="return rs(event,2)">`;for(let i=0;i<totalMembers-1;i++){const member=reg.m[i]||{name:'',email:''};h+=`<div class="glass" style="margin-bottom:12px"><b>Member ${i+1}</b>${F('Member Name','n'+i,member.name)}${F('Member Email','e'+i,member.email,'email')}</div>`}
  h+=`<button type="button" class="btn ghost" onclick="reg.step=1;view()">Back</button> <button class="btn">Next</button></form>`}
 if(s==3)h+=`<form id="payment" onsubmit="return rs(event,3)"><div class="payment-card"><h3>PAYMENT</h3><p class="payment-subtitle">Scan QR Code to Pay</p><div class="payment-qr-frame"><img class="payment-qr-image" src="${PAYMENT_QR_PLACEHOLDER}" alt="${PAYMENT_QR_PLACEHOLDER_TEXT}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="payment-qr-placeholder" role="img" aria-label="${PAYMENT_QR_PLACEHOLDER_TEXT}" hidden>${PAYMENT_QR_PLACEHOLDER_TEXT}</div></div><p class="payment-detail"><b>Registration Fee:</b> ${db.event.fee?'₹'+esc(db.event.fee):TBA}</p><p class="payment-detail"><b>UPI ID:</b> ${PAYMENT_UPI_ID}</p></div><label>Payment Method<select name="method">${['UPI','Bank Transfer','Cash'].map(x=>`<option>${x}</option>`).join('')}</select></label>${F('Transaction ID / UTR','utr',d.utr)}<label>Payment Screenshot<input type="file" name="shot" accept="image/*" required></label><label class="payment-confirm"><input type="checkbox" name="confirmed" value="yes" required><span>I confirm that I have completed the payment.</span></label><button class="btn">Payment Completed</button> <button type="button" class="btn ghost" onclick="reg.step=2;view()">Back</button></form>`;
 if(s==4){const t=reg.done;h+=`<div class="ok"><div class="tick">✓</div><h3>Registration successful</h3><p>Team ID: <b>${t.id}</b> · ${esc(t.name)}</p><p>Leader: ${esc(t.leader)} · Payment: ${badge(t.pay.status)}</p><p style="color:var(--mu)">Your team account is disabled until the admin enables it. Please wait for the admin to enable it.</p><p style="color:var(--mu)">User ID: ${esc(t.acc.userId)} · Password: leader's mobile number</p><button class="btn" onclick="reg={step:1,d:{},m:[]};go('login')">Go to Login</button></div>`}
 return h+'</div></section>'}
function rs(ev,s){ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target)),d=reg.d;
 if(s==1){const count=Number(f.count) || 1;d.count=count;f.email=lowerEmail(f.email);if(db.teams.some(t=>t.leader.toLowerCase()==f.leader.toLowerCase()&&t.mobile==f.mobile)){alert('This leader is already registered.');return false}if(teamEmailExists(f.email)){alert('This email is already used by another team. Please use a different email.');return false}Object.assign(d,f)}
 if(s==2){const totalMembers=Math.max(1,Number(d.count || 1));const members=[];const seenEmails=new Set([lowerEmail(d.email)]);for(let i=0;i<totalMembers-1;i++){const name=(f['n'+i]||'').trim();const email=lowerEmail(f['e'+i]||'');if(!name&&!email)continue;if(email && (seenEmails.has(email) || teamEmailExists(email))){alert('Each member email must be unique and not already used by another team member or team.');return false}if(email)seenEmails.add(email);members.push({name,email})}reg.m=members;}
 if(s==3){if(!f.utr?.trim()){alert('Enter the Transaction ID / UTR number before submitting.');return false}if(f.confirmed!=='yes'){alert('Confirm that the payment is complete before submitting.');return false}const file=ev.target.shot.files[0],r=new FileReader();r.onload=()=>{const t={id:nextId(),name:d.team,leader:d.leader,mobile:d.mobile,email:lowerEmail(d.email),college:d.college,year:d.year,members:reg.m,track:'',problem:'',title:'',desc:'',
   pay:{method:f.method,utr:f.utr,shot:r.result,status:'Pending'},status:'Pending',acc:{userId:d.leader,password:d.mobile,enabled:false}};const allEmails=[lowerEmail(t.email),...normalizeMembers(t.members).map(member=>lowerEmail(member.email))].filter(Boolean);const duplicateEmails=allEmails.filter((email,index)=>allEmails.indexOf(email)!==index);if(duplicateEmails.length){alert('Email already used by another team member or team. Please update the duplicate email(s).');return false}db.teams.push(t);save();reg.done=t;reg.step=4;view()};r.readAsDataURL(file);return false}
 reg.step=s+1;view();return false}
/* ---------- LOGIN ---------- */
let lrole='team';
function loginPg(){return `<section class="narrow"><h2>Login</h2><div class="tabs"><button class="btn ${lrole=='team'?'on':''}" onclick="lrole='team';view()">TEAM LOGIN</button><button class="btn ${lrole=='admin'?'on':''}" onclick="lrole='admin';view()">ADMIN LOGIN</button></div>
 <form class="glass" onsubmit="return doLogin(event)">${lrole=='team'?'<p style="color:var(--mu)">User ID = Team Leader Name<br>Password = Team Leader Mobile Number</p>':''}${F(lrole=='team'?'User ID':'Admin ID','u')}${F('Password','p','','password')}<div class="err" id="err"></div><button class="btn">Login</button> <button type="button" class="btn ghost" onclick="alert('Please contact the admin to reset your password.')">Forgot password</button> <button type="button" class="btn ghost" onclick="go('home')">Back to home</button></form></section>`}
function doLogin(e){e.preventDefault();const u=e.target.u.value.trim(),p=e.target.p.value.trim(),er=$('#err');
 if(lrole=='admin'){if(u===db.admin.id&&p===db.admin.pw){login('admin');go('admin')}else er.textContent='Invalid admin ID or password.';return false}
 const t=db.teams.find(t=>String(t.acc.userId).toLowerCase()===u.toLowerCase()&&t.acc.password===p);
 if(!t)er.textContent='Invalid User ID or password.';else if(!t.acc.enabled)er.textContent='Your account is not enabled yet. Please wait for the admin to enable it.';else{login('team',t.id);go('team')}return false}/* ---------- TEAM DASHBOARD (own data only) ---------- */
function teamPg(){const t=myTeam();if(!t){logout();return ''}const e=db.event;
 const assignedStatement=t.problemStatementId?db.problemStatementFiles.find(item=>item.id===t.problemStatementId):db.problemStatementFiles.find(item=>item.track===t.track&&item.title===t.problem);
 const assignedTrack=assignedStatement?.track||t.track,assignedProblem=assignedStatement?.title||t.problem,statementFile=assignedStatement?.active?assignedStatement:null;
 return `<section><h2>Welcome, ${esc(t.name)}</h2><div class="grid"><div class="glass">Registration<br>${badge(t.status)}</div><div class="glass">Payment<br>${badge(t.pay.status)}</div><div class="glass">Account<br>${badge(t.acc.enabled?'Enabled':'Disabled')}</div></div>
 <div class="glass" style="margin-top:16px"><h3>Team ${t.id}</h3><p>Leader: ${esc(t.leader)} · ${esc(t.mobile)} · ${esc(t.email)}<br>${esc(t.college)} · Year ${esc(t.year)}<br>Project: <b>${esc(t.title)}</b> – ${esc(t.desc)}</p>
 <h3>Members</h3>${t.members.map(name=>`<p>${esc(name)}</p>`).join('')||'<p>No additional members.</p>'}</div>
 <div class="glass" style="margin-top:16px"><h3>TRACK & PROBLEM STATEMENT</h3><p>Assigned Track Name: <b>${esc(assignedTrack||'Not selected yet')}</b><br>Problem Statement Title: <b>${esc(assignedProblem||'Not selected yet')}</b></p>
 ${assignedStatement?`<p>Problem Statement Description: ${esc(assignedStatement.description||'')}</p>`:''}
 ${statementFile?`<p>File Name: <b>${esc(statementFile.fileName)}</b><br>File Type: ${esc(statementFile.fileType)}<br>Upload Date: ${esc(statementFile.uploadDate)}</p><p><a class="btn sm" href="${statementFile.fileData}" target="_blank" rel="noopener noreferrer">View File</a> <a class="btn sm ghost" href="${statementFile.fileData}" download="${esc(statementFile.fileName)}">Download File</a></p>`:assignedStatement?'<p>This problem statement file is currently unavailable.</p>':'<p>No active problem statement file has been assigned yet.</p>'}
 ${db.tracks.length?`<form onsubmit="return saveTeamSelection(event)"><label>Track<select name="track" onchange="refreshTeamProblems(this.value)">${trackOptions(t.track)}</select></label><label>Problem Statement<select id="teamProblem" name="problem">${problemOptions(t.track,t.problem)}</select></label><button class="btn">Save selection</button></form>`:'<p>Tracks are not published yet</p>'}</div>
 <div class="glass" style="margin-top:16px"><h3>Hackathon information</h3><p>Date: ${esc(e.date||TBA)} · Time: ${esc(e.time)} · Venue: ${esc(e.venue)}</p><h3>Announcements</h3>${db.announcements.map(a=>`<p><b>${esc(a.t)}</b> – ${esc(a.d)}</p>`).join('')||'<p>No announcements yet.</p>'}</div>
 <button class="btn ghost" style="margin-top:16px" onclick="logout()">Logout</button></section>`}
function refreshTeamProblems(trackName){const select=$('#teamProblem'),track=db.tracks.find(item=>item.name===trackName);if(!select)return;select.innerHTML=`<option value="">Not selected yet</option>${(track?.problems||[]).map(problem=>`<option value="${esc(problem)}">${esc(problem)}</option>`).join('')}`}
function saveTeamSelection(ev){ev.preventDefault();const t=myTeam();if(!t)return false;const f=Object.fromEntries(new FormData(ev.target));
 if(!f.track&&!f.problem){t.track='';t.problem='';t.problemStatementId='';save();view();return false}
 const track=db.tracks.find(item=>item.name===f.track);if(!track||!f.problem||!track.problems.includes(f.problem)){toast('Choose a published track and a problem statement for that track.');return false}
 t.track=f.track;t.problem=f.problem;t.problemStatementId=db.problemStatementFiles.find(item=>item.track===f.track&&item.title===f.problem)?.id||'';save();view();toast('Track and problem statement saved');return false}
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
function adminPg(){if(ses?.role!=='admin'){go('login');return ''}const T=db.teams,tabs=['overview','event','teams','accounts','announcements','problem-files'],tabLabels={'problem-files':'Track & Problem Statement Files'};
 let h=`<section><h2>Admin Dashboard</h2><div class="tabs">${tabs.map(t=>`<button class="btn ${adm.tab==t?'on':''}" onclick="adm.tab='${t}';view()">${tabLabels[t]||t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div>`;
 if(adm.tab=='overview')h+=`<div class="grid">${[['Total Teams',T.length],['Participants',T.reduce((n,t)=>n+1+t.members.length,0)],['Payment Completed',T.filter(t=>t.pay.status=='Paid').length],['Pending Payments',T.filter(t=>t.pay.status!='Paid').length],['Active Accounts',T.filter(t=>t.acc.enabled).length]].map(([l,n])=>`<div class="glass stat"><b>${n}</b>${l}</div>`).join('')}</div>`;
 if(adm.tab=='event'){const e=db.event;h+=`<form class="glass" onsubmit="return saveEv(event)"><div class="two">${['title','date','time','venue','fee','contact'].map(k=>`<label>${k[0].toUpperCase()+k.slice(1)}<input name="${k}" type="${k=='date'?'date':'text'}" value="${esc(e[k])}"></label>`).join('')}</div><label>Description<textarea name="about">${esc(e.about)}</textarea></label>
  ${Object.entries(ALIST).map(([k,[a,b,l]])=>`<label>${l} – one per line<textarea name="${k}">${esc(lines(db[k],x=>x.t+' | '+x.d))}</textarea></label>`).join('')}
  <label>Tracks (Track | Problem 1 ; Problem 2 ...)<textarea name="tracks">${esc(lines(db.tracks,t=>t.name+' | '+t.problems.join(' ; ')))}</textarea></label><button class="btn">Save event data</button></form>`}
 if(adm.tab=='teams'){const q=adm.q.toLowerCase(),L=T.filter(t=>JSON.stringify([t.id,t.name,t.leader,t.mobile,t.track,t.problem]).toLowerCase().includes(q));
  h+=`<input placeholder="Search teams…" value="${esc(adm.q)}" oninput="adm.q=this.value;view();this.focus()" style="margin-bottom:14px"><div class="glass"><table><thead><tr><th>ID<th>Team<th>Leader<th>Mobile<th>Members<th>Track<th>Problem Statement<th>Payment<th>Status<th>Account<th></tr></thead><tbody>${L.map(t=>`<tr><td data-l="ID">${t.id}<td data-l="Team">${esc(t.name)}<td data-l="Leader">${esc(t.leader)}<td data-l="Mobile">${esc(t.mobile)}<td data-l="Members">${t.members.map(esc).join('<br>')}<td data-l="Track">${esc(t.track||'Not selected yet')}<td data-l="Problem Statement">${esc(t.problem||'Not selected yet')}<td data-l="Payment">${badge(t.pay.status)}<td data-l="Status">${badge(t.status)}<td data-l="Account">${badge(t.acc.enabled?'Enabled':'Disabled')}<td><button class="btn sm" onclick="editTeam('${t.id}')">Edit</button> <button class="btn sm red" onclick="delTeam('${t.id}')">Del</button></tr>`).join('')||'<tr><td>No teams found.</tr>'}</tbody></table></div>`}
 if(adm.tab=='accounts')h+=`<div class="glass"><table><thead><tr><th>Team ID<th>Leader<th>User ID<th>Password<th>Status<th></tr></thead><tbody>${T.map(t=>`<tr><td data-l="Team ID">${t.id}<td data-l="Leader">${esc(t.leader)}<td data-l="User ID">${esc(t.acc.userId)}<td data-l="Password">${esc(t.acc.password)}<td data-l="Status">${badge(t.acc.enabled?'Enabled':'Disabled')}<td><button class="btn sm" onclick="editAcc('${t.id}')">Edit</button> <button class="btn sm ghost" onclick="toggleAcc('${t.id}')">${t.acc.enabled?'Disable':'Enable'}</button></tr>`).join('')||'<tr><td>No accounts yet.</tr>'}</tbody></table></div><button class="btn" style="margin-top:14px" onclick="newTeam()">+ Create team & account</button>`;
 if(adm.tab=='announcements')h+=`<form class="glass" onsubmit="return addAnn(event)">${F('Title','t')}<label>Message<textarea name="d" required></textarea></label><button class="btn">Post announcement</button></form>${db.announcements.map((a,i)=>`<div class="glass" style="margin-top:10px"><b>${esc(a.t)}</b><p>${esc(a.d)}</p><button class="btn sm red" onclick="db.announcements.splice(${i},1);save();view()">Delete</button></div>`).join('')}`;
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
 <label>Description<textarea name="desc">${esc(t.desc)}</textarea></label><label>Members (one per line: Name | Email)<textarea name="mem">${esc(lines(t.members,member=>`${member.name}${member.email?` | ${member.email}`:''}`))}</textarea></label>
 ${t.pay.shot?`<a href="${t.pay.shot}" target="_blank" style="color:var(--c1)">View payment screenshot</a><br><br>`:''}<button class="btn">Save</button> <button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></form>`)}
function saveTeam(ev,id){ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target)),t=db.teams.find(x=>x.id==id);
 const email=lowerEmail(f.email);
 const members=normalizeMembers(f.mem.split('\n').map(line=>{const [name,...emailParts]=line.split('|');return{name:name.trim(),email:lowerEmail(emailParts.join('|'))}}));
 const emails=[email,...members.map(member=>member.email)].filter(Boolean);
 if(emails.some((value,index)=>emails.indexOf(value)!==index)||emails.some(value=>teamEmailExists(value,id))){alert('Each team email must be unique and not already used by another team member or team.');return false}
 ['name','leader','mobile','college','year','track','problem','title','desc'].forEach(k=>t[k]=f[k]);
 t.email=email;
 t.problemStatementId=db.problemStatementFiles.find(item=>item.track===f.track&&item.title===f.problem)?.id||'';t.pay.status=f.ps;t.pay.utr=f.utr;t.status=f.st;
 t.members=members;
 save();closeModal();view();return false}
function refreshAdminProblems(trackName){const select=$('#editProblem'),current=$('#editProblem')?.value; if(!select)return;select.innerHTML=problemOptions(trackName,current)}
function delTeam(id){if(confirm('Delete team '+id+' permanently?')){db.teams=db.teams.filter(t=>t.id!=id);save();view()}}
function toggleAcc(id){const t=db.teams.find(x=>x.id==id);t.acc.enabled=!t.acc.enabled;save();view()}
function editAcc(id){const t=db.teams.find(x=>x.id==id);openModal(`<h3>Account ${t.id}</h3><form onsubmit="return saveAcc(event,'${id}')">${F('Team ID','id',t.id)}${F('Leader Name','leader',t.leader)}${F('User ID','uid',t.acc.userId)}${F('Mobile','mobile',t.mobile)}${F('Password (reset here)','pw',t.acc.password)}<button class="btn">Save</button> <button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></form>`)}
function saveAcc(ev,id){ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target)),t=db.teams.find(x=>x.id==id);
 if(f.id!=id&&db.teams.some(x=>x.id==f.id)){alert('Team ID already exists');return false}
 t.id=f.id;t.leader=f.leader;t.mobile=f.mobile;t.acc.userId=f.uid;t.acc.password=f.pw;save();closeModal();view();return false}function newTeam(){openModal(`<h3>Create team & account</h3><form onsubmit="return mkTeam(event)">${F('Team Name','name')}${F('Leader Name','leader')}${F('Leader Mobile','mobile','','tel',MOB)}<button class="btn">Create</button> <button type="button" class="btn ghost" onclick="closeModal()">Cancel</button></form>`)}
function mkTeam(ev){ev.preventDefault();const f=Object.fromEntries(new FormData(ev.target));db.teams.push({id:nextId(),name:f.name,leader:f.leader,mobile:f.mobile,email:'',college:'',year:'',members:[],track:'',problem:'',title:'',desc:'',pay:{method:'',utr:'',shot:'',status:'Pending'},status:'Pending',acc:{userId:f.leader,password:f.mobile,enabled:false}});save();closeModal();view();return false}
/* ---------- router ---------- */
function playHomeIntro(){
 const route=location.hash.slice(2)||'home';
 const intro=$('#intro');
 if(route!=='home'||matchMedia('(prefers-reduced-motion: reduce)').matches||sessionStorage.getItem('h24IntroSeen'))return;
 sessionStorage.setItem('h24IntroSeen','1');
 intro.classList.add('is-active');
 document.body.classList.add('intro-playing');
 setTimeout(()=>{
  intro.classList.add('is-leaving');
  setTimeout(()=>{intro.remove();document.body.classList.remove('intro-playing')},580);
 },2300);
}
function view(){chrome();const r=(location.hash.slice(2)||'home');
 $('#app').innerHTML=({home,register,login:loginPg,team:teamPg,admin:adminPg}[r]||home)();tick()}
addEventListener('hashchange',()=>{scrollTo(0,0);view();playHomeIntro()});playHomeIntro();view();
