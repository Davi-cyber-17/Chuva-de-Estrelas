(()=>{
const W=900,H=1500,HR=64,PIN=76,WIN=7,CARRY=3,SPD=270,TURN=3.5,PX=PIN;
const HOLES=[{x:PX,y:PX,s:1},{x:W-PX,y:H-PX,s:-1},{x:W-PX,y:PX,s:-1},{x:PX,y:H-PX,s:1}];
const PAL=[{n:'Azul',m:'#00c4f0',l:'#6fe3ff',d:'#00a6cf'},{n:'Vermelho',m:'#ff5f57',l:'#ff8a82',d:'#e0524f'},{n:'Verde',m:'#3fdc66',l:'#8ef5a5',d:'#2fb852'},{n:'Roxo',m:'#a874ff',l:'#cfaaff',d:'#8a5ce0'}];
const KEYS=[['a','s'],['k','l'],['z','x'],['n','m']];
const FONT=px=>`900 ${px}px Orbitron,"Trebuchet MS",system-ui,sans-serif`;
try{document.fonts&&document.fonts.load('900 20px Orbitron')}catch(e){}
const ICE={config:{iceServers:[{urls:'stun:stun.l.google.com:19302'},{urls:'stun:global.stun.twilio.com:3478'},{urls:['turn:openrelay.metered.ca:80','turn:openrelay.metered.ca:443','turn:openrelay.metered.ca:443?transport=tcp'],username:'openrelayproject',credential:'openrelayproject'}]}};
const $=s=>document.querySelector(s), rnd=(a,b)=>a+Math.random()*(b-a), r1=v=>Math.round(v*10)/10;
const cv=$('#c'),ctx=cv.getContext('2d');
let AC;function beep(f,d=.1,t='sine'){try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.type=t;o.frequency.value=f;g.gain.value=.07;o.connect(g);g.connect(AC.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}}

/* ================= LÓGICA DO JOGO (local e host) ================= */
class Game{
  constructor(n){
    this.n=n;this.t=0;this.sid=0;this.starT=.6;this.winner=-1;this.events=[];this.out=[];
    this.scores=Array(n).fill(0);this.stars=[];this.asts=[];this.ships=[];
    for(let i=0;i<n;i++){this.ships.push({x:0,y:0,a:0,alive:true,rt:0,inv:0,carry:false,ct:0,turn:0,on:true});this.spawn(i)}
    for(let i=0;i<3;i++)this.asts.push({x:rnd(150,W-150),y:rnd(450,H-450),vx:0,vy:0,r:rnd(55,78),rot:rnd(0,6),vr:rnd(-.8,.8),...this.vel()});
  }
  vel(){const a=rnd(0,6.28),s=rnd(60,105);return{vx:Math.cos(a)*s,vy:Math.sin(a)*s}}
  emit(e){this.events.push(e);this.out.push(e)}
  spawn(i){const h=HOLES[i],s=this.ships[i],dx=W/2-h.x,dy=H/2-h.y,d=Math.hypot(dx,dy);
    s.x=h.x+dx/d*(HR+48);s.y=h.y+dy/d*(HR+48);s.a=Math.atan2(dy,dx);s.alive=true;s.inv=2;s.carry=false;s.ct=0}
  kill(i){const s=this.ships[i];s.alive=false;s.rt=2;
    if(s.carry){s.carry=false;s.ct=0;let x=Math.min(W-60,Math.max(60,s.x)),y=Math.min(H-60,Math.max(60,s.y));
      if(HOLES.some((h,j)=>j<this.n&&this.ships[j].on&&Math.hypot(x-h.x,y-h.y)<HR+60)){x=W/2;y=H/2}
      this.stars.push({id:++this.sid,x,y})}
    this.emit({k:'b',x:r1(s.x),y:r1(s.y),c:i})}
  step(dt){
    this.t+=dt;
    for(const a of this.asts){
      a.x+=a.vx*dt;a.y+=a.vy*dt;a.rot+=a.vr*dt;const m=a.r;
      if(a.x<m&&a.vx<0||a.x>W-m&&a.vx>0)a.vx*=-1;
      if(a.y<m&&a.vy<0||a.y>H-m&&a.vy>0)a.vy*=-1;
      for(let j=0;j<this.n;j++){if(!this.ships[j].on)continue;const h=HOLES[j],dx=a.x-h.x,dy=a.y-h.y,d=Math.hypot(dx,dy),mm=HR+a.r*.9;
        if(d<mm){const nx=dx/d,ny=dy/d,dot=a.vx*nx+a.vy*ny;if(dot<0){a.vx-=2*dot*nx;a.vy-=2*dot*ny}a.x=h.x+nx*mm;a.y=h.y+ny*mm}}
    }
    if(this.winner>=0)return;
    const act=this.ships.filter(s=>s.on).length;
    if(this.n>1&&act===1&&this.t>1){this.winner=this.ships.findIndex(s=>s.on);this.emit({k:'w'});return}
    for(let i=0;i<this.n;i++){
      const s=this.ships[i];if(!s.on)continue;
      if(!s.alive){s.rt-=dt;if(s.rt<=0)this.spawn(i);continue}
      s.a+=s.turn*TURN*dt;
      s.x+=Math.cos(s.a)*SPD*dt;s.y+=Math.sin(s.a)*SPD*dt;
      const m=16;
      if(s.x<m){s.x=m;s.a=Math.PI-s.a}else if(s.x>W-m){s.x=W-m;s.a=Math.PI-s.a}
      if(s.y<m){s.y=m;s.a=-s.a}else if(s.y>H-m){s.y=H-m;s.a=-s.a}
      if(s.inv>0)s.inv-=dt;
      if(!s.carry)for(let k=0;k<this.stars.length;k++){const st=this.stars[k];
        if(Math.hypot(st.x-s.x,st.y-s.y)<36){s.carry=true;s.ct=CARRY;s.inv=0;this.stars.splice(k,1);this.emit({k:'p'});break}}
      if(s.carry){s.ct-=dt;
        if(s.ct<=0){s.carry=false;s.ct=0;this.scores[i]++;this.emit({k:'s'});
          if(this.scores[i]>=WIN){this.winner=i;this.emit({k:'w'});return}}}
      if(s.inv<=0){
        let dead=this.asts.some(a=>Math.hypot(a.x-s.x,a.y-s.y)<a.r*.95+12);
        for(let j=0;j<this.n&&!dead;j++)if(j!==i&&this.ships[j].on&&Math.hypot(s.x-HOLES[j].x,s.y-HOLES[j].y)<HR*.72)dead=true;
        if(dead)this.kill(i);
      }
    }
    for(let i=0;i<this.n;i++)for(let j=i+1;j<this.n;j++){const a=this.ships[i],b=this.ships[j];
      if(a.on&&b.on&&a.alive&&b.alive&&a.inv<=0&&b.inv<=0&&Math.hypot(a.x-b.x,a.y-b.y)<32){this.kill(i);this.kill(j)}}
    this.starT-=dt;
    if(this.stars.length<2&&this.starT<=0){
      for(let t=0;t<40;t++){const x=rnd(90,W-90),y=rnd(90,H-90);
        if(HOLES.some((h,j)=>j<this.n&&Math.hypot(x-h.x,y-h.y)<HR+170))continue;
        if(this.asts.some(a=>Math.hypot(a.x-x,a.y-y)<a.r+70))continue;
        this.stars.push({id:++this.sid,x,y});break}
      this.starT=1.2;
    }
  }
  snap(){const r=Math.round;return{t:'state',s:this.ships.map(s=>[r(s.x),r(s.y),+s.a.toFixed(2),s.alive?1:0,s.inv>0?1:0,s.carry?Math.max(.1,r1(s.ct)):0,s.on?1:0]),
    st:this.stars.map(s=>[s.id,r(s.x),r(s.y)]),as:this.asts.map(a=>[r(a.x),r(a.y),+a.rot.toFixed(2),r(a.r)]),sc:this.scores,w:this.winner,ev:this.out.splice(0)}}
}

/* ================= VISÃO DO CLIENTE (online) ================= */
class View{
  constructor(n){this.n=n;this.stars=[];this.asts=[];this.scores=Array(n).fill(0);this.winner=-1;this.events=[];
    this.ships=Array.from({length:n},()=>({x:0,y:0,a:0,tx:0,ty:0,ta:0,alive:false,inv:0,carry:false,ct:0,on:true,init:false}))}
  apply(m){
    m.s.forEach((v,i)=>{const s=this.ships[i],al=!!v[3];s.tx=v[0];s.ty=v[1];s.ta=v[2];
      if(!s.init||!al||!s.alive||Math.hypot(s.tx-s.x,s.ty-s.y)>100){s.x=s.tx;s.y=s.ty;s.a=s.ta;s.init=true}
      s.alive=al;s.inv=v[4];s.ct=v[5];s.carry=v[5]>0;s.on=!!v[6]});
    this.stars=m.st.map(v=>({id:v[0],x:v[1],y:v[2]}));
    this.asts.length=m.as.length;
    m.as.forEach((v,i)=>{const a=this.asts[i]||(this.asts[i]={x:v[0],y:v[1]});a.tx=v[0];a.ty=v[1];a.rot=v[2];a.r=v[3]});
    this.scores=m.sc;this.winner=m.w;m.ev.forEach(e=>this.events.push(e));
  }
  step(dt){const k=1-Math.exp(-dt*20),P=Math.PI*2;
    for(const s of this.ships){s.x+=(s.tx-s.x)*k;s.y+=(s.ty-s.y)*k;s.a+=((((s.ta-s.a+Math.PI)%P)+P)%P-Math.PI)*k}
    for(const a of this.asts){a.x+=(a.tx-a.x)*k;a.y+=(a.ty-a.y)*k}}
}

/* ================= ESTADO GERAL / UI ================= */
let mode=null,world=null,names=[],localN=2,me=0,srcs=[],lastSent=false,over=false;
const net={peer:null,conn:null,players:[],code:''};
const show=id=>{document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));if(id)$('#'+id).classList.remove('hidden');$('#x').classList.toggle('hidden',!world||!!id&&id!=='over')};
const msg=t=>$('#msg').textContent=t||'';
const nick=()=>($('#nick').value.trim()||'Jogador');
try{$('#nick').value=localStorage.getItem('sc_nick')||''}catch(e){}

function beginGame(w,m){try{navigator.wakeLock&&navigator.wakeLock.request('screen').catch(()=>{})}catch(e){}world=w;mode=m;srcs=[];lastSent=false;over=false;fx.length=0;parts.length=0;show(null);$('#x').classList.remove('hidden')}
function toMenu(){
  try{net.conn&&net.conn.close();net.peer&&net.peer.destroy()}catch(e){}
  net.peer=net.conn=null;net.players=[];world=null;mode=null;over=false;show('menu')}

$('#bOn').onclick=()=>{msg();show('online')};
$('#bLoc').onclick=()=>show('local');
document.querySelectorAll('[data-back]').forEach(b=>b.onclick=()=>show('menu'));
$('#nSel').onclick=e=>{const b=e.target.closest('button');if(!b)return;localN=+b.dataset.n;[...$('#nSel').children].forEach(c=>c.classList.toggle('sel',c===b))};
$('#bGoLoc').onclick=startLocal;
$('#x').onclick=()=>{if(confirm('Sair da partida?'))toMenu()};
$('#bMenu').onclick=toMenu;$('#bLeave').onclick=toMenu;

function startLocal(){names=PAL.slice(0,localN).map(p=>p.n);beginGame(new Game(localN),'local')}
$('#bAgain').onclick=()=>{if(mode==='local')startLocal();else if(mode==='host')startHost()};

/* ================= ONLINE (PeerJS, salas por código) ================= */
const ID=c=>'starcatcher-'+c;
const slotsUI=(list)=>{$('#slots').innerHTML=[0,1,2,3].map(i=>list[i]?`<div class="slot"><i style="background:${PAL[i].m};color:${PAL[i].m}"></i>${list[i].replace(/</g,'&lt;')}</div>`:`<div class="slot e"><i style="background:#555"></i>Aguardando…</div>`).join('')};
function lobbyUI(list,host){$('#code').textContent=net.code;slotsUI(list);$('#bStart').classList.toggle('hidden',!host);
  $('#bStart').disabled=list.length<2;$('#wait').textContent=host?(list.length<2?'Chame pelo menos 1 amigo com o código.':'Todos prontos? Inicie a partida.'):'Aguardando o host iniciar…';show('lobby')}
function broadcastLobby(){const list=net.players.map(p=>p.name);
  net.players.forEach((p,i)=>p.conn&&p.conn.open&&p.conn.send({t:'lobby',names:list,you:i,code:net.code}));lobbyUI(list,true)}

$('#bCreate').onclick=()=>{
  try{localStorage.setItem('sc_nick',$('#nick').value)}catch(e){}
  if(typeof Peer==='undefined')return msg('Sem conexão com o serviço online. Verifique a internet.');
  msg('Criando sala…');
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const tryMake=()=>{
    net.code=Array.from({length:4},()=>chars[Math.random()*chars.length|0]).join('');
    const peer=net.peer=new Peer(ID(net.code),ICE);peer.on('disconnected',()=>{try{peer.reconnect()}catch(e){}});
    peer.on('open',()=>{me=0;net.players=[{name:nick(),conn:null}];mode='lobbyhost';broadcastLobby()});
    peer.on('error',e=>{if(e.type==='unavailable-id'){peer.destroy();tryMake()}else msg('Erro: '+e.type)});
    peer.on('connection',c=>{
      c.on('open',()=>{
        if(world||net.players.length>=4){c.send({t:'busy'});setTimeout(()=>c.close(),300);return}
        net.players.push({name:'Jogador',conn:c});broadcastLobby();
      });
      c.on('data',d=>{const i=net.players.findIndex(p=>p.conn===c);if(i<0)return;
        if(d.t==='hello'){net.players[i].name=String(d.name||'Jogador').slice(0,12);if(!world)broadcastLobby()}
        else if(d.t==='in'&&world&&mode==='host')world.ships[i].turn=Math.sign(+d.d||0)});
      c.on('close',()=>{const i=net.players.findIndex(p=>p.conn===c);if(i<0)return;
        if(world&&mode==='host'){net.players[i].gone=true;world.ships[i].on=false}
        else{net.players.splice(i,1);if(!world)broadcastLobby()}});
    });
  };tryMake();
};
function startHost(){
  const n=net.players.length;if(n<2)return;const g=new Game(n);
  net.players.forEach((p,i)=>{if(p.gone)g.ships[i].on=false});
  names=net.players.map((p,i)=>p.name);me=0;beginGame(g,'host');
  net.players.forEach((p,i)=>p.conn&&p.conn.open&&p.conn.send({t:'start',n,names,you:i}));
}
$('#bStart').onclick=startHost;

$('#bJoin').onclick=()=>{
  try{localStorage.setItem('sc_nick',$('#nick').value)}catch(e){}
  const code=$('#join').value.trim().toUpperCase();
  if(code.length!==4)return msg('Digite o código de 4 letras.');
  if(typeof Peer==='undefined')return msg('Sem conexão com o serviço online. Verifique a internet.');
  msg('Entrando…');net.code=code;
  const peer=net.peer=new Peer(undefined,ICE);
  peer.on('error',e=>msg(e.type==='peer-unavailable'?'Sala não encontrada.':'Erro: '+e.type));
  peer.on('open',()=>{
    const c=net.conn=peer.connect(ID(code),{reliable:true});
    const to=setTimeout(()=>{if(mode!=='lobbyclient'){msg('Não foi possível conectar. Confira o código e a internet.');try{peer.destroy()}catch(e){}}},15000);
    c.on('open',()=>{clearTimeout(to);c.send({t:'hello',name:nick()});mode='lobbyclient'});
    c.on('data',d=>{
      if(d.t==='lobby'){me=d.you;lobbyUI(d.names,false)}
      else if(d.t==='busy'){msg('Sala cheia ou partida em andamento.');toMenuKeep()}
      else if(d.t==='start'){names=d.names;me=d.you;beginGame(new View(d.n),'client')}
      else if(d.t==='state'&&world&&mode==='client')world.apply(d);
    });
    c.on('close',()=>{if(mode){alert('A sala foi encerrada.');toMenu()}});
  });
};
function toMenuKeep(){try{net.peer&&net.peer.destroy()}catch(e){}mode=null;show('online')}
const hash=location.hash.slice(1).toUpperCase();if(hash.length===4){$('#join').value=hash;show('online')}
$('#bCopy').onclick=()=>{const u=location.href.split('#')[0]+'#'+net.code;(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>$('#bCopy').textContent='Link copiado!').catch(()=>prompt('Copie o link:',u))};

/* ================= CONTROLES ================= */
const BR=50;
const VWH=()=>land?[H,W]:[W,H];
const hv=i=>{const h=HOLES[i];return land?{x:h.y,y:W-h.x}:{x:h.x,y:h.y}};
const toView=e=>({x:(e.clientX-ox)/sc,y:(e.clientY-oy)/sc});
function btns(i){const [VW,VH]=VWH(),p=hv(i),top=p.y<VH/2,y=top?p.y+HR+BR+8:p.y-HR-BR-8,lf=p.x<VW/2;
  const xs=lf?[BR+22,BR*3+44]:[VW-BR*3-44,VW-BR-22];
  return [{x:xs[0],y,d:-1,top},{x:xs[1],y,d:1,top}]}
function turn(i,src,d){
  const set=srcs[i]||(srcs[i]=new Map());d?set.set(src,d):set.delete(src);
  const t=Math.sign([...set.values()].reduce((a,b)=>a+b,0));
  if(mode==='local'||mode==='host')world.ships[i].turn=t;
  else if(mode==='client'&&net.conn&&net.conn.open&&lastSent!==t){lastSent=t;net.conn.send({t:'in',d:t})}
}
const online=()=>mode==='host'||mode==='client';
const LK={a:[0,-1],s:[0,1],k:[1,-1],l:[1,1],z:[2,-1],x:[2,1],n:[3,-1],m:[3,1]};
const OK={arrowleft:-1,a:-1,arrowright:1,d:1};
function keyTarget(k){
  if(mode==='local'){const t=LK[k];return t&&t[0]<localN?{i:t[0],d:t[1]}:null}
  if(online()&&k in OK)return{i:me,d:OK[k]};return null}
addEventListener('keydown',e=>{if(e.repeat||!world)return;const k=e.key.toLowerCase(),t=keyTarget(k);if(!t)return;e.preventDefault();turn(t.i,'k'+k,t.d)});
addEventListener('keyup',e=>{if(!world)return;const k=e.key.toLowerCase(),t=keyTarget(k);if(t)turn(t.i,'k'+k,0)});
function hit(e){
  if(!world)return null;const p=toView(e);
  const list=mode==='local'?Array.from({length:localN},(_,i)=>i):[me];
  for(const i of list)for(const b of btns(i))if(Math.hypot(p.x-b.x,p.y-b.y)<BR+18)return{i,d:b.d};
  if(mode==='local')return null;
  return{i:me,d:p.x<VWH()[0]/2?-1:1}}
const ptr=new Map(),dn=new Set();
function setPtr(id,t){const o=ptr.get(id);if(o&&t&&o.i===t.i&&o.d===t.d)return;
  if(o){turn(o.i,'p'+id,0);ptr.delete(id)}
  if(t){ptr.set(id,t);turn(t.i,'p'+id,t.d)}}
cv.addEventListener('pointerdown',e=>{if(!world)return;e.preventDefault();cv.setPointerCapture(e.pointerId);dn.add(e.pointerId);setPtr(e.pointerId,hit(e))});
cv.addEventListener('pointermove',e=>{if(dn.has(e.pointerId))setPtr(e.pointerId,hit(e))});
const up=e=>{dn.delete(e.pointerId);setPtr(e.pointerId,null)};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
addEventListener('blur',()=>{if(!world)return;srcs.forEach((s,i)=>{if(s){s.clear();turn(i,'',0)}});ptr.clear();dn.clear()});
addEventListener('contextmenu',e=>e.preventDefault());

/* ================= RENDER ================= */
let dpr=1,sc=1,ox=0,oy=0;
let land=false;
function resize(){dpr=Math.min(devicePixelRatio||1,2);const iw=innerWidth,ih=innerHeight;cv.width=iw*dpr;cv.height=ih*dpr;land=iw>ih*1.05;
  const vw=land?H:W,vh=land?W:H;sc=Math.min(iw/vw,ih/vh);ox=(iw-vw*sc)/2;oy=(ih-vh*sc)/2}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,250));resize();
const dots=Array.from({length:60},()=>({x:rnd(10,W-10),y:rnd(10,H-10),s:rnd(5,8)}));
const fx=[],parts=[];
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function star(x,y,R,r,rot){ctx.beginPath();for(let i=0;i<10;i++){const a=rot+i*Math.PI/5-Math.PI/2,d=i%2?r:R;ctx[i?'lineTo':'moveTo'](x+Math.cos(a)*d,y+Math.sin(a)*d)}ctx.closePath()}
function drawStar(x,y,k,rot){ctx.save();ctx.shadowColor='#ffe45e';ctx.shadowBlur=22;ctx.lineJoin='round';ctx.fillStyle=ctx.strokeStyle='#000';ctx.lineWidth=8;star(x,y,36*k,16*k,rot);ctx.stroke();ctx.fill();ctx.fillStyle='#ffe45e';star(x,y,24*k,11*k,rot);ctx.fill();ctx.restore()}

function drawHole(i){
  const h=HOLES[i],p=PAL[i],f=Math.min(1,world.scores[i]/WIN),C=Math.PI*2;
  ctx.save();ctx.translate(h.x,h.y);if(land)ctx.rotate(Math.PI/2);
  const g=ctx.createRadialGradient(0,0,HR*.5,0,0,HR*1.55);g.addColorStop(0,p.m+'55');g.addColorStop(1,p.m+'00');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,HR*1.55,0,7);ctx.fill();
  ctx.fillStyle='#04070f';ctx.strokeStyle=p.m;ctx.lineWidth=4;ctx.shadowColor=p.m;ctx.shadowBlur=18;
  ctx.beginPath();ctx.arc(0,0,HR,0,7);ctx.fill();ctx.stroke();ctx.shadowBlur=0;
  ctx.globalAlpha=.5;ctx.strokeStyle=p.l;ctx.lineWidth=2;ctx.setLineDash([6,10]);ctx.lineDashOffset=-T*28*(i%2?-1:1);
  ctx.beginPath();ctx.arc(0,0,HR-10,0,7);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;
  ctx.lineCap='round';ctx.lineWidth=5;ctx.strokeStyle='rgba(255,255,255,.08)';ctx.beginPath();ctx.arc(0,0,HR-21,0,7);ctx.stroke();
  if(f>0){ctx.strokeStyle=p.l;ctx.shadowColor=p.m;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(0,0,HR-21,-Math.PI/2,-Math.PI/2+C*f);ctx.stroke();ctx.shadowBlur=0}
  ctx.fillStyle='#fff';ctx.font=FONT(32);ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(world.scores[i],0,2);
  ctx.restore();
}
function drawShip(s,i,t){
  if(!s.on||!s.alive)return;const p=PAL[i];
  ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a-Math.PI/2);
  if(s.inv>0&&Math.floor(t*12)%2)ctx.globalAlpha=.35;
  const fl=Math.random()*10;ctx.shadowColor='#ff9a3c';ctx.shadowBlur=16;ctx.fillStyle='#ff9a3c';ctx.beginPath();ctx.moveTo(-10,-20);ctx.lineTo(10,-20);ctx.lineTo(0,-40-fl);ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle='#fff3b0';ctx.beginPath();ctx.moveTo(-5,-20);ctx.lineTo(5,-20);ctx.lineTo(0,-31-fl*.5);ctx.fill();
  ctx.shadowColor=p.m;ctx.shadowBlur=18;ctx.fillStyle='#000';ctx.beginPath();ctx.moveTo(-26,-18);ctx.lineTo(26,-18);ctx.quadraticCurveTo(24,10,0,32);ctx.quadraticCurveTo(-24,10,-26,-18);ctx.fill();
  ctx.shadowBlur=0;ctx.fillStyle=p.m;ctx.beginPath();ctx.moveTo(-12,-14);ctx.lineTo(12,-14);ctx.quadraticCurveTo(13,8,0,24);ctx.quadraticCurveTo(-13,8,-12,-14);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.75)';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();ctx.fillStyle=p.d;ctx.beginPath();ctx.arc(0,0,2.6,0,7);ctx.fill();
  ctx.restore();
  if(s.carry){const cx=s.x-Math.cos(s.a)*44,cy=s.y-Math.sin(s.a)*44,f=Math.max(0,Math.min(1,s.ct/CARRY));
    drawStar(cx,cy,.55,t*3);
    ctx.save();ctx.translate(cx,cy);if(land)ctx.rotate(Math.PI/2);
    ctx.lineWidth=7;ctx.lineCap='round';ctx.strokeStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.arc(0,0,34,0,7);ctx.stroke();
    ctx.strokeStyle=s.ct<1?'#ff5f57':'#ffe45e';ctx.beginPath();ctx.arc(0,0,34,-Math.PI/2,-Math.PI/2+Math.PI*2*f);ctx.stroke();
    ctx.fillStyle='#fff';ctx.font=FONT(30);ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillText(Math.ceil(s.ct),0,-58);
    ctx.restore()}
}
function drawAst(a,k){
  const n=9,r=a.r;ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.rot);
  ctx.beginPath();for(let j=0;j<n;j++){const an=j/n*6.283,v=.84+.16*Math.sin(j*2.7+k*1.9)*Math.cos(j*1.3+k);ctx[j?'lineTo':'moveTo'](Math.cos(an)*r*v,Math.sin(an)*r*v)}ctx.closePath();
  ctx.shadowColor='#ff5a3c';ctx.shadowBlur=24;ctx.fillStyle='#14090d';ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,90,60,.12)';ctx.fill();ctx.lineJoin='round';ctx.strokeStyle='#ff6a4a';ctx.lineWidth=4;ctx.stroke();
  ctx.strokeStyle='rgba(255,150,120,.35)';ctx.lineWidth=2.5;
  [[-.22,-.3,.26],[.3,.12,.16],[-.1,.38,.12]].forEach(([x,y,q])=>{ctx.beginPath();ctx.arc(x*r,y*r,q*r,0,7);ctx.stroke()});
  ctx.restore();
}
function drawBtns(){
  const list=mode==='local'?Array.from({length:world.n},(_,i)=>i):[me];
  ctx.save();ctx.setTransform(dpr*sc,0,0,dpr*sc,dpr*ox,dpr*oy);
  for(const i of list){if(!world.ships[i].on)continue;const p=PAL[i],set=srcs[i];
    for(const b of btns(i)){const on=!!set&&[...set.values()].includes(b.d),q=b.d;
      ctx.globalAlpha=on?.85:.45;ctx.fillStyle=on?p.m:'rgba(8,14,34,.8)';ctx.strokeStyle=p.m;ctx.lineWidth=5;
      ctx.beginPath();ctx.arc(b.x,b.y,BR,0,7);ctx.fill();ctx.stroke();
      ctx.globalAlpha=on?1:.95;ctx.fillStyle=on?'#02101a':p.l;
      ctx.beginPath();ctx.moveTo(b.x+q*16,b.y);ctx.lineTo(b.x-q*14,b.y-20);ctx.lineTo(b.x-q*14,b.y+20);ctx.closePath();ctx.fill();
      if(mode==='local'){ctx.globalAlpha=1;ctx.font='700 20px Rajdhani,system-ui,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#7f93b5';
        ctx.fillText(KEYS[i][q<0?0:1].toUpperCase(),b.x,b.y+(b.top?BR+16:-BR-16))}}}
  ctx.restore()}
function events(){
  for(const e of world.events.splice(0)){
    if(e.k==='b'){fx.push({x:e.x,y:e.y,t:0,seed:Math.random()*6});
      for(let i=0;i<16;i++){const a=rnd(0,6.28),v=rnd(80,320);parts.push({x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1,r:rnd(5,16),c:Math.random()<.7?'#ff9a3c':PAL[e.c].m})}
      beep(110,.35,'sawtooth')}
    else if(e.k==='p')beep(660,.08);
    else if(e.k==='s'){beep(784,.12,'triangle');setTimeout(()=>beep(1046,.18,'triangle'),110)}
    else if(e.k==='w'){beep(523,.15,'square');setTimeout(()=>beep(784,.3,'square'),150)}
  }
}
let last=performance.now(),T=0,acc=0;
function frame(now){
  const dt=Math.min(.05,(now-last)/1e3);last=now;T+=dt;
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#060913';ctx.fillRect(0,0,cv.width,cv.height);
  ctx.setTransform(dpr*sc,0,0,dpr*sc,dpr*ox,dpr*oy);if(land)ctx.transform(0,-1,1,0,0,W);
  ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();
  const bg=ctx.createRadialGradient(W/2,H/2,80,W/2,H/2,H*.75);bg.addColorStop(0,'#0d1733');bg.addColorStop(1,'#04070f');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(0,229,255,.05)';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=W;x+=75){ctx.moveTo(x,0);ctx.lineTo(x,H)}for(let y=0;y<=H;y+=75){ctx.moveTo(0,y);ctx.lineTo(W,y)}ctx.stroke();
  ctx.strokeStyle='rgba(0,229,255,.09)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(W/2,H/2,170,0,7);ctx.moveTo(W/2+18,H/2);ctx.arc(W/2,H/2,18,0,7);ctx.moveTo(0,H/2);ctx.lineTo(W/2-170,H/2);ctx.moveTo(W/2+170,H/2);ctx.lineTo(W,H/2);ctx.stroke();
  ctx.fillStyle='rgba(140,210,255,1)';for(const d of dots){ctx.save();ctx.translate(d.x,d.y);ctx.rotate(Math.PI/4);ctx.globalAlpha=.15+.3*Math.abs(Math.sin(T*1.2+d.x*.05));ctx.fillRect(-d.s/2,-d.s/2,d.s,d.s);ctx.restore()}
  if(world){
    if(mode==='local'||mode==='host'){world.step(dt);
      if(mode==='host'){acc+=dt;if(acc>=1/30){acc=0;const m=world.snap();net.players.forEach(p=>p.conn&&p.conn.open&&p.conn.send(m))}}
      else world.out.length=0}
    else world.step(dt);
    events();
    for(let i=0;i<world.n;i++)if(world.ships[i].on)drawHole(i);
    for(const s of world.stars)drawStar(s.x,s.y,1+Math.sin(T*4+s.id)*.06,T*.8+s.id);
    world.asts.forEach((a,k)=>drawAst(a,k));
    world.ships.forEach((s,i)=>drawShip(s,i,T));
    for(let i=fx.length-1;i>=0;i--){const f=fx[i];f.t+=dt;const p=f.t/.7;if(p>=1){fx.splice(i,1);continue}
      ctx.globalAlpha=1-p;ctx.fillStyle='#000';ctx.beginPath();ctx.arc(f.x,f.y,20+55*Math.min(1,p*3),0,7);ctx.fill();
      ctx.strokeStyle='#ff9a3c';ctx.lineWidth=9;ctx.lineCap='round';
      for(let k=0;k<6;k++){const an=k*1.05+f.seed;ctx.beginPath();ctx.arc(f.x+Math.cos(an)*10,f.y+Math.sin(an)*10,30+70*p,an,an+1);ctx.stroke()}
      ctx.globalAlpha=1}
    for(let i=parts.length-1;i>=0;i--){const q=parts[i];q.l-=dt*1.6;if(q.l<=0){parts.splice(i,1);continue}
      q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=.96;q.vy*=.96;ctx.globalAlpha=q.l;ctx.fillStyle=q.c;ctx.beginPath();ctx.arc(q.x,q.y,q.r*q.l,0,7);ctx.fill();ctx.globalAlpha=1}
    drawBtns();
    if(world.winner>=0&&!over){over=true;const w=world.winner;
      $('#winner').innerHTML=`<span style="color:${PAL[w].m}">${(names[w]||PAL[w].n).replace(/</g,'&lt;')}</span> venceu!`;
      const canAgain=mode!=='client';$('#bAgain').classList.toggle('hidden',!canAgain);$('#wait2').textContent=canAgain?'':'Aguardando o host iniciar outra partida…';
      setTimeout(()=>{if(world&&over)show('over')},900)}
  }
  ctx.strokeStyle='rgba(0,229,255,.22)';ctx.lineWidth=2;ctx.strokeRect(3,3,W-6,H-6);
  ctx.strokeStyle='#00e5ff';ctx.lineWidth=6;ctx.lineCap='round';ctx.shadowColor='#00e5ff';ctx.shadowBlur=14;const L=70;ctx.beginPath();
  [[3,3,1,1],[W-3,3,-1,1],[3,H-3,1,-1],[W-3,H-3,-1,-1]].forEach(([x,y,a,b])=>{ctx.moveTo(x+a*L,y);ctx.lineTo(x,y);ctx.lineTo(x,y+b*L)});ctx.stroke();ctx.shadowBlur=0;
  ctx.restore();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
