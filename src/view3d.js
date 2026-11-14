/* ================= 3Dビュー ================= */
// 立体モデル。x=艦首方向、y=左右、z=上。長さ1を基準にした低ポリゴン
function prism(o,z0,z1,cT,cS){const f=[],n=o.length;let cx=0,cy=0;for(const q of o){cx+=q[0];cy+=q[1];}cx/=n;cy/=n;
  f.push({p:o.map(q=>[q[0],q[1],z1]),c:cT,n:[0,0,1]});
  for(let i=0;i<n;i++){const a=o[i],b=o[(i+1)%n];let nx=b[1]-a[1],ny=-(b[0]-a[0]);const l=Math.hypot(nx,ny)||1;nx/=l;ny/=l;if(nx*((a[0]+b[0])/2-cx)+ny*((a[1]+b[1])/2-cy)<0){nx=-nx;ny=-ny;}
    f.push({p:[[a[0],a[1],z0],[b[0],b[1],z0],[b[0],b[1],z1],[a[0],a[1],z1]],c:cS,n:[nx,ny,0]});}
  return f;}
const bx=(x0,x1,y0,y1,z0,z1,c)=>prism([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],z0,z1,c,c);
const flat=(p,c,n)=>({p,c,n:n||[0,0,1]});
const MDL={
  cv:[].concat(prism([[-.5,-.16],[.38,-.16],[.5,-.08],[.5,.1],[.3,.2],[-.5,.2]],0,.07,1,0),bx(-.06,.16,.11,.19,.07,.17,2),bx(.02,.06,.13,.17,.17,.25,3)),
  ddg:[].concat(prism([[-.5,-.07],[.2,-.07],[.5,0],[.2,.07],[-.5,.07]],0,.06,1,0),bx(0,.22,-.055,.055,.06,.16,2),bx(.08,.12,-.015,.015,.16,.27,3),bx(-.12,-.02,-.035,.035,.06,.13,3),bx(-.32,-.15,-.05,.05,.06,.11,2)),
  dd:[].concat(prism([[-.5,-.06],[.2,-.06],[.5,0],[.2,.06],[-.5,.06]],0,.055,1,0),bx(.02,.18,-.045,.045,.055,.13,2),bx(.08,.11,-.012,.012,.13,.23,3),bx(-.12,-.04,-.03,.03,.055,.12,3),bx(-.3,-.16,-.045,.045,.055,.105,2)),
  lst:[].concat(prism([[-.5,-.1],[.35,-.1],[.5,0],[.35,.1],[-.5,.1]],0,.08,1,0),bx(-.46,-.24,-.08,.08,.08,.2,2),bx(-.38,-.32,-.02,.02,.2,.28,3)),
  site:[].concat(bx(-.3,.3,-.3,.3,0,.08,1),bx(-.16,.1,-.14,.14,.08,.2,2),bx(.14,.2,-.03,.03,.08,.42,3)),
  sub:[].concat(prism([[-.5,0],[-.4,-.05],[.35,-.05],[.5,0],[.35,.05],[-.4,.05]],-.03,.04,3,3),bx(0,.14,-.02,.02,.04,.11,3)),
  ftr:[flat([[.5,0,0],[-.3,-.08,0],[-.5,0,0],[-.3,.08,0]],2),flat([[.1,0,0],[-.35,-.38,0],[-.42,-.38,0],[-.3,0,0]],1),flat([[.1,0,0],[-.35,.38,0],[-.42,.38,0],[-.3,0,0]],1),flat([[-.28,0,0],[-.5,0,0],[-.5,0,.16]],3,[0,1,0])],
  bmr:[flat([[.5,0,0],[-.3,-.1,0],[-.5,0,0],[-.3,.1,0]],2),flat([[.18,0,0],[-.22,-.55,0],[-.4,-.55,0],[-.3,0,0]],1),flat([[.18,0,0],[-.22,.55,0],[-.4,.55,0],[-.3,0,0]],1),flat([[-.28,0,0],[-.5,0,0],[-.5,0,.2]],3,[0,1,0])],
  aew:[flat([[.5,0,0],[-.3,-.07,0],[-.5,0,0],[-.3,.07,0]],2),flat([[.1,-.05,0],[.1,-.5,0],[-.05,-.5,0],[-.1,-.05,0]],1),flat([[.1,.05,0],[.1,.5,0],[-.05,.5,0],[-.1,.05,0]],1),
    flat([0,1,2,3,4,5,6,7].map(i=>[-.1+Math.cos(i*.785)*.2,Math.sin(i*.785)*.2,.09]),2),flat([[-.3,0,0],[-.5,0,0],[-.5,0,.15]],3,[0,1,0])]
};
const MKEY={cvn:['cv',2.1],cvu:['cv',1.2],lha:['cv',1.4],cg:['ddg',1.3],bmd:['ddg',1.4],ddgo:['ddg',1],ddr:['ddg',1.3],ars:['ddg',1.15],ddk:['dd',.95],ddh:['dd',1.15],de:['dd',.8],fc:['dd',.75],pg:['dd',.5],lusv:['dd',.6],sso:['sub',.75],ssn:['sub',1.05],ssg:['sub',.95],xluuv:['sub',.5],lpd:['lst',1.2],lsm:['lst',.7],cvl:['cv',1.45],cv:['cv',1.8],ecv:['cv',1.7],ddg:['ddg',1.1],ddgx:['ddg',1.25],eddg:['ddg',1.1],ecg:['ddg',1.3],dd:['dd',1],dd2:['dd',1.08],ffm:['dd',.88],ffm2:['dd',.92],eff:['dd',.88],opv:['dd',.7],usv:['dd',.5],
  aoe:['lst',1.15],elst:['lst',1.15],lst:['lst',1.1],lhd:['cv',1.2],site:['site',.7],eshore:['site',.7],ss:['sub',.8],ssx:['sub',.9],ess:['sub',.8],ftr:['ftr',.55],eftr:['ftr',.55],estl:['ftr',.6],ebmr:['bmr',.8],aew:['aew',.7]};
const PAL={P:[[62,88,116],[92,124,154],[146,178,208],[40,58,80]],E:[[120,70,66],[150,94,88],[202,140,130],[80,46,46]]};
const C3DEF={tx:250,ty:268,d:600,yaw:-.35,pit:.8};
const ms3=()=>3*Math.pow(B.c3.d,.32),zAir3=()=>Math.max(9,B.c3.d*.05);
function pos3(u){const m=ms3();return[u.x,u.y,u.cat==='air'?zAir3()*(u.key==='aew'?1.2:u.key==='ebmr'?1.1:1):u.cat==='sub'?-m*.2:0];}
function setView(v){if(!B)return;B.view=v;ui.view=v;$('#b3d').textContent=v==='3d'?'2D':'3D';$('#bfol').hidden=v!=='3d';$('#bfol').classList.toggle('on',!!B.fol);}
function draw(){if(B.view==='3d')draw3D();else draw2D();}
function draw3D(){const g=B.g;if(!g)return;const cw=B.cw,ch=B.ch,now=performance.now(),c=B.c3,sel=selUnits();
  if(B.fol&&sel[0]){c.tx+=(sel[0].x-c.tx)*.15;c.ty+=(sel[0].y-c.ty)*.15;}
  const cp=Math.cos(c.pit),sp=Math.sin(c.pit),sy=Math.sin(c.yaw),cy=Math.cos(c.yaw),ex=c.tx+c.d*cp*sy,ey=c.ty+c.d*cp*cy,ez=c.d*sp;
  const fX=-cp*sy,fY=-cp*cy,fZ=-sp,rx=cy,ry=-sy,ux=-sp*sy,uy=-sp*cy,uz=cp,F=Math.min(cw,ch)*.95,NEAR=Math.max(.3,c.d*.02),m=ms3(),za=zAir3();
  const cam=(x,y,z)=>{const vx=x-ex,vy=y-ey,vz=z-ez;return[vx*rx+vy*ry,vx*ux+vy*uy+vz*uz,vx*fX+vy*fY+vz*fZ];};
  const prj=q=>[cw/2+q[0]/q[2]*F,ch/2-q[1]/q[2]*F];
  const P3=(x,y,z)=>{const q=cam(x,y,z);return q[2]<NEAR?null:[cw/2+q[0]/q[2]*F,ch/2-q[1]/q[2]*F,q[2]];};
  B.v3={ex,ey,ez,rx,ry,ux,uy,uz,fx:fX,fy:fY,fz:fZ,F,P3};
  const poly=(pts,fill,stroke)=>{const q=pts.map(p=>cam(p[0],p[1],p[2]||0)),o=[];for(let i=0;i<q.length;i++){const a=q[i],b=q[(i+1)%q.length],ia=a[2]>=NEAR,ib=b[2]>=NEAR;if(ia)o.push(a);if(ia!==ib){const t=(NEAR-a[2])/(b[2]-a[2]);o.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR]);}}
    if(o.length<3)return;g.beginPath();o.forEach((p,i)=>{const s=prj(p);if(i)g.lineTo(s[0],s[1]);else g.moveTo(s[0],s[1]);});g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.stroke();}};
  const line=(x1,y1,z1,x2,y2,z2)=>{let a=cam(x1,y1,z1),b=cam(x2,y2,z2);if(a[2]<NEAR&&b[2]<NEAR)return;if(a[2]<NEAR){const t=(NEAR-a[2])/(b[2]-a[2]);a=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,NEAR];}else if(b[2]<NEAR){const t=(NEAR-b[2])/(a[2]-b[2]);b=[b[0]+(a[0]-b[0])*t,b[1]+(a[1]-b[1])*t,NEAR];}
    const s=prj(a),e=prj(b);g.moveTo(s[0],s[1]);g.lineTo(e[0],e[1]);};
  const ring=(x,y,r,col,dash)=>{if(!r)return;g.setLineDash(dash||[]);g.strokeStyle=col;g.beginPath();for(let i=0;i<48;i++){const a=i/48*6.2832,b=(i+1)/48*6.2832;line(x+Math.cos(a)*r,y+Math.sin(a)*r,0,x+Math.cos(b)*r,y+Math.sin(b)*r,0);}g.stroke();g.setLineDash([]);};
  // 空と海
  g.setTransform(B.dpr,0,0,B.dpr,0,0);const hy=ch/2-F*Math.tan(c.pit);g.fillStyle='#061521';g.fillRect(0,0,cw,ch);
  if(hy>0){const gr=g.createLinearGradient(0,0,0,hy);gr.addColorStop(0,'#02060b');gr.addColorStop(1,'#10283c');g.fillStyle=gr;g.fillRect(0,0,cw,hy);}
  g.lineWidth=1;poly([[0,0],[W,0],[W,H],[0,H]],'#081a2a','#24445c');
  g.strokeStyle='#12304a';g.beginPath();for(let i=50;i<W;i+=50){line(i,0,0,i,H,0);line(0,i,0,W,i,0);}g.stroke();
  if(c.d<170){g.strokeStyle='#0c2438';g.beginPath();const x0=Math.max(0,Math.floor((c.tx-90)/10)*10),x1=Math.min(W,c.tx+90),y0=Math.max(0,Math.floor((c.ty-90)/10)*10),y1=Math.min(H,c.ty+90);
    for(let x=x0;x<=x1;x+=10)if(x%50)line(x,y0,0,x,y1,0);for(let y=y0;y<=y1;y+=10)if(y%50)line(x0,y,0,x1,y,0);g.stroke();}
  const o=B.obj,rt=B.sc==='retake';ring(o.x,o.y,o.r,'#3b6a85',[4,4]);
  if(B.landT>0)ring(o.x,o.y,o.r*Math.min(1,B.landT/B.landNeed),'#ff6b5e');
  if(sel.length===1){const u=sel[0];ring(u.x,u.y,u.cat==='sub'?u.so:u.dS,'rgba(95,176,255,.45)',[2,4]);ring(u.x,u.y,u.samR,'rgba(99,219,160,.45)');ring(u.x,u.y,u.asmR,'rgba(242,181,74,.45)',[6,4]);if(u.aamR)ring(u.x,u.y,u.aamR,'rgba(99,219,160,.45)');}
  for(const u of sel){const p=pos3(u);if(u.dx!=null){g.strokeStyle='rgba(95,176,255,.55)';g.setLineDash([3,3]);g.beginPath();line(p[0],p[1],p[2],u.dx,u.dy,p[2]);g.stroke();g.setLineDash([]);}
    if(u.ord){const t=B.ui[u.ord.tgt];if(t){const q=t.seen?t:(t.ls||t);g.strokeStyle='rgba(255,107,94,.7)';g.beginPath();line(p[0],p[1],p[2],q.x,q.y,0);g.stroke();}}}
  // 面を集めて奥から描く
  const faces=[],LX=-.42,LY=-.36,LZ=.83;
  const addModel=(key,x,y,z,hd,scale,side,alpha)=>{const mk=MKEY[key]||['dd',1],fs=MDL[mk[0]],s=scale*mk[1],ch_=Math.cos(hd),sh=Math.sin(hd),pal=PAL[side];
    for(const f of fs){let dz=0;const pts=[];let bad=false;for(const q of f.p){const wx=x+(q[0]*ch_-q[1]*sh)*s,wy=y+(q[0]*sh+q[1]*ch_)*s,wz=z+q[2]*s,k=cam(wx,wy,wz);if(k[2]<NEAR){bad=true;break;}dz+=k[2];pts.push(cw/2+k[0]/k[2]*F,ch/2-k[1]/k[2]*F);}
      if(bad)continue;const nx=f.n[0]*ch_-f.n[1]*sh,ny=f.n[0]*sh+f.n[1]*ch_,it=.42+.58*Math.max(0,nx*LX+ny*LY+f.n[2]*LZ),b=pal[f.c];
      faces.push({z:dz/f.p.length,pts,col:`rgba(${b[0]*it|0},${b[1]*it|0},${b[2]*it|0},${alpha})`});}};
  // 島
  {const pk=Math.max(2.5,m*.3),k=1.6;for(let i=0;i<ISLP.length;i++){const a=ISLP[i],b=ISLP[(i+1)%ISLP.length],q=[cam(o.x+a[0]*k,o.y+a[1]*k,0),cam(o.x+b[0]*k,o.y+b[1]*k,0),cam(o.x,o.y,pk)];if(q.some(v=>v[2]<NEAR))continue;
      const it=.55+.45*((i*37)%7)/7,bc=rt?[120,64,56]:[52,92,66];faces.push({z:(q[0][2]+q[1][2]+q[2][2])/3,pts:[].concat(prj(q[0]),prj(q[1]),prj(q[2])),col:`rgb(${bc[0]*it|0},${bc[1]*it|0},${bc[2]*it|0})`});}}
  const vis=[];
  for(const u of B.u){if(u.dead)continue;const E=u.side==='E';if(E&&!u.seen){if(u.ls){const s=P3(u.ls.x,u.ls.y,0);if(s)vis.push({u,s,ghost:true});}continue;}
    if(u.hd==null)u.hd=Math.atan2((E?B.obj.y:B.sp.y)-u.y,(E?B.obj.x:B.sp.x)-u.x);
    if(u.dx!=null&&Math.hypot(u.dx-u.x,u.dy-u.y)>.3){let d=Math.atan2(u.dy-u.y,u.dx-u.x)-u.hd;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;u.hd+=d*.12;}
    const p=pos3(u),s=P3(p[0],p[1],p[2]);if(!s)continue;vis.push({u,s,p});
    if(u.cat==='air'){const n=Math.max(1,u.n),ch_=Math.cos(u.hd),sh=Math.sin(u.hd);for(let i=0;i<n;i++){const ox=-(i>0?.7:0)-(i>2?.7:0),oy=i===0?0:i%2?.6:-.6;addModel(u.key,p[0]+(ox*ch_-oy*sh)*m*.7,p[1]+(ox*sh+oy*ch_)*m*.7,p[2],u.hd,m,u.side,1);}}
    else addModel(u.key,p[0],p[1],p[2],u.hd,m,u.side,u.cat==='sub'?.6:1);}
  // 海面のマーカー、航跡、高度線
  for(const v of vis){const u=v.u,E=u.side==='E',col=E?'#ff6b5e':'#5fb0ff',g0=P3(v.ghost?u.ls.x:u.x,v.ghost?u.ls.y:u.y,0);if(!g0)continue;
    g.globalAlpha=v.ghost?.4:.8;g.strokeStyle=col;g.lineWidth=1.2;g.beginPath();
    if(E){g.moveTo(g0[0],g0[1]-4);g.lineTo(g0[0]+7,g0[1]);g.lineTo(g0[0],g0[1]+4);g.lineTo(g0[0]-7,g0[1]);g.closePath();}else g.ellipse(g0[0],g0[1],7,4,0,0,6.3);g.stroke();
    if(!v.ghost&&u.cat!=='ship'){g.globalAlpha=.45;g.beginPath();g.moveTo(g0[0],g0[1]);g.lineTo(v.s[0],v.s[1]);g.stroke();}
    if(!v.ghost&&u.cat==='ship'&&u.dx!=null){g.globalAlpha=.25;g.strokeStyle='#cfe6f2';g.beginPath();const bx_=u.x-Math.cos(u.hd)*m*.5,by_=u.y-Math.sin(u.hd)*m*.5;for(const a of[.35,-.35])line(bx_,by_,0,bx_-Math.cos(u.hd+a)*m*1.3,by_-Math.sin(u.hd+a)*m*1.3,0);g.stroke();}
    g.globalAlpha=1;}
  faces.sort((a,b)=>b.z-a.z);g.lineWidth=.6;
  for(const f of faces){const p=f.pts;g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.closePath();g.fillStyle=f.col;g.strokeStyle=f.col;g.fill();g.stroke();}
  // ミサイル
  for(const ms of B.m){if(ms.dead||ms.delay>0)continue;const t=ms.tm?B.mi[ms.tgt]:B.ui[ms.tgt];let tz=0;if(t)tz=ms.tm?(t.z3||0):pos3(t)[2];
    if(ms.type==='asm')ms.z3=m*.07;else if(ms.type==='torp')ms.z3=ms.asw?m*.25:-m*.12;else{if(ms.z3==null){const sh=B.u.find(u=>!u.dead&&Math.hypot(u.x-ms.x,u.y-ms.y)<3&&u.side===ms.side);ms.z3=sh?pos3(sh)[2]:0;}if(!B.paused)ms.z3+=(tz+m*.07-ms.z3)*.18;}
    const tr=ms.tr3||(ms.tr3=[]),l=tr[tr.length-1];if(!l||Math.hypot(l[0]-ms.x,l[1]-ms.y)>m*.12){tr.push([ms.x,ms.y,ms.z3]);if(tr.length>14)tr.shift();}
    if(ms.side==='E'&&!ms.seen)continue;const big=ms.type==='asm'||ms.type==='torp',col=ms.side==='P'?(ms.type==='asm'?'159,208,255':ms.type==='torp'?'127,214,226':'99,219,160'):(ms.type==='torp'?'255,176,154':'255,107,94');
    g.lineWidth=big?1.8:1.1;for(let i=1;i<tr.length;i++){g.strokeStyle=`rgba(${col},${(i/tr.length*.7).toFixed(2)})`;g.beginPath();line(tr[i-1][0],tr[i-1][1],tr[i-1][2],tr[i][0],tr[i][1],tr[i][2]);g.stroke();}
    const s=P3(ms.x,ms.y,ms.z3);if(s){if(l){g.strokeStyle=`rgba(${col},.8)`;g.beginPath();line(l[0],l[1],l[2],ms.x,ms.y,ms.z3);g.stroke();}g.fillStyle=`rgb(${col})`;g.beginPath();g.arc(s[0],s[1],big?2.6:1.7,0,6.3);g.fill();}}
  g.lineWidth=1;
  // ラベルと選択枠
  g.font='10px sans-serif';const boxes=[];
  const pr=v=>(B.sel.includes(v.u.id)||B.tsel===v.u.id)?0:v.u.side==='E'?1:v.u.cat==='air'?3:2;
  for(const v of vis.slice().sort((a,b)=>pr(a)-pr(b))){const u=v.u,E=u.side==='E',s=v.s,isSel=B.sel.includes(u.id),tg=B.tsel===u.id,r=Math.max(9,m*F/s[2]*.55);
    if(isSel||tg){g.strokeStyle=tg?'#ffd0c8':'#ffffff';const q=r+4,k=5;g.beginPath();for(const[ax,ay]of[[-1,-1],[1,-1],[1,1],[-1,1]]){g.moveTo(s[0]+ax*q,s[1]+ay*(q-k));g.lineTo(s[0]+ax*q,s[1]+ay*q);g.lineTo(s[0]+ax*(q-k),s[1]+ay*q);}g.stroke();}
    if(!v.ghost&&u.cat!=='air'&&u.hp<u.max){const w=22,hr=Math.max(0,u.hp/u.max);g.fillStyle='#1a2c3a';g.fillRect(s[0]-w/2,s[1]+r+3,w,2.5);g.fillStyle=hr>.5?'#63dba0':hr>.25?'#f2b54a':'#ff6b5e';g.fillRect(s[0]-w/2,s[1]+r+3,w*hr,2.5);}
    const t=v.ghost?u.sym+' ?':u.lab,w=g.measureText(t).width||t.length*10,b=[s[0]+r+3,s[1]-r-6,w+2,12];
    if(pr(v)>0&&boxes.some(q=>b[0]<q[0]+q[2]&&b[0]+b[2]>q[0]&&b[1]<q[1]+q[3]&&b[1]+b[3]>q[1]))continue;boxes.push(b);
    g.globalAlpha=v.ghost?.5:1;g.fillStyle=E?'#ffb3aa':'#bcdcff';g.fillText(t,b[0]+1,b[1]+10);g.globalAlpha=1;}
  const io=P3(o.x,o.y,0);if(io){g.fillStyle='#7fa3b8';g.textAlign='center';g.fillText(B.iname,io[0],io[1]+14);g.textAlign='left';}
  // 爆発
  B.fx=B.fx.filter(f=>now-f.t<700);
  for(const f of B.fx){const s=P3(f.x,f.y,f.z?za:m*.05);if(!s)continue;const a=(now-f.t)/700,rr=Math.max(3,(f.c==='kill'?m*1.1:f.c==='hit'?m*.6:m*.3)*F/s[2])*a+2;
    g.fillStyle=f.c==='kill'?`rgba(255,190,100,${(.5*(1-a)).toFixed(2)})`:f.c==='hit'?`rgba(255,107,94,${(.45*(1-a)).toFixed(2)})`:`rgba(170,230,255,${(.4*(1-a)).toFixed(2)})`;g.beginPath();g.arc(s[0],s[1],rr,0,6.3);g.fill();}
  if(B.mk&&now-B.mk.t<500){const a=(now-B.mk.t)/500;ring(B.mk.x,B.mk.y,m*.2+m*.6*a,`rgba(95,176,255,${(1-a).toFixed(2)})`);}
  g.fillStyle='#4f7089';g.fillText('3D　1マス 50km',6,14);}

/* ---------- 画面上の位置と操作 ---------- */
function scrOf(u){if(B.view==='3d'){if(!B.v3)return null;const p=pos3(u);return B.v3.P3(p[0],p[1],p[2]);}return[B.cw/2+(u.x-B.cam.x)*B.k,B.ch/2+(u.y-B.cam.y)*B.k];}
function seaAt(px,py){if(B.view!=='3d')return{x:B.cam.x+(px-B.cw/2)/B.k,y:B.cam.y+(py-B.ch/2)/B.k};const v=B.v3;if(!v)return null;const dx=px-B.cw/2,dy=-(py-B.ch/2);
  const wx=v.fx*v.F+v.rx*dx+v.ux*dy,wy=v.fy*v.F+v.ry*dx+v.uy*dy,wz=v.fz*v.F+v.uz*dy;if(wz>=-1e-6)return null;const t=-v.ez/wz;return{x:v.ex+wx*t,y:v.ey+wy*t};}
function tap(px,py){if(!B||B.over)return;let best=null,bd=B.view==='3d'?30:26;
  for(const u of B.u){if(u.dead||(u.side==='E'&&!u.seen))continue;const s=scrOf(u);if(!s)continue;const d=Math.hypot(s[0]-px,s[1]-py);if(d<bd){bd=d;best=u;}}
  if(best){if(best.side==='P'){if(B.sel.length===1&&B.sel[0]===best.id)B.sel=[];else B.sel=[best.id];}else B.tsel=B.tsel===best.id?null:best.id;}
  else{const w=seaAt(px,py);if(selUnits().length){if(w&&w.x>=0&&w.x<=W&&w.y>=0&&w.y<=H)cmdMove(w.x,w.y);}else{B.tsel=null;if(w&&B.view==='3d'){B.c3.tx=clamp(w.x,0,W);B.c3.ty=clamp(w.y,0,H);}}}
  uiRefresh(true);}
function pan3(dx,dy){const c=B.c3,k=c.d/(B.v3?B.v3.F:300),sy=Math.sin(c.yaw),cy=Math.cos(c.yaw),sp=Math.max(.25,Math.sin(c.pit));
  c.tx=clamp(c.tx+(-cy*dx-sy*dy/sp)*k,-40,W+40);c.ty=clamp(c.ty+(sy*dx-cy*dy/sp)*k,-40,H+40);}
function initDOM(){
  $('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;ui.tab=b.dataset.t;render();window.scrollTo(0,0);});
  $('#next').addEventListener('click',nextMonth);
  $('#modal').addEventListener('click',e=>{const b=e.target.closest('[data-m]');if(!b||b.disabled||!mq.length)return;const f=mq[0].cbs[b.dataset.m];if(f)f();else closeModal();});
  $('#bspd').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&B&&!B.over)setSpeed(+b.dataset.s);});
  $('#bact').addEventListener('click',e=>{const b=e.target.closest('button[data-a]');if(b&&!b.disabled)bact(b.dataset.a);});
  $('#bquit').addEventListener('click',()=>{if(!B||B.over)return;const was=B.paused;B.paused=true;
    confirmM(B.drill?'演習を打ち切る。':'海域から撤退する。事案は失敗として扱われる。',()=>finish('lose',{retreat:true}),'撤退する',()=>{if(!was)setSpeed(B.speed);});});
  document.querySelector('.zoom').addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!B)return;const z=b.dataset.z;
    if(z==='v')return setView(B.view==='3d'?'2d':'3d');
    if(z==='f'){B.fol=!B.fol;if(B.fol&&!selUnits().length)toast('追尾する部隊を選ぶこと');return setView(B.view);}
    if(z==='0'){B.cam={x:W/2,y:H/2,z:1};B.c3=Object.assign({},C3DEF);B.fol=false;return setView(B.view);}
    if(B.view==='3d')B.c3.d=clamp(B.c3.d*(+z>0?1/1.4:1.4),3,900);else B.cam.z=clamp(B.cam.z*(+z>0?1.4:1/1.4),1,60);});
  const cv=$('#cv'),pts=new Map();let moved=false,start=null,pd=0,pm=null;
  const mid=()=>{const a=[...pts.values()];return{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)};};
  const begin1=(x,y,e)=>{start={x,y,cx:B.cam.x,cy:B.cam.y,yaw:B.c3.yaw,pit:B.c3.pit,lx:x,ly:y,pan:!!e&&(e.shiftKey||e.button===2)};};
  cv.addEventListener('contextmenu',e=>e.preventDefault());
  cv.addEventListener('pointerdown',e=>{if(!B)return;try{cv.setPointerCapture(e.pointerId);}catch(_){}pts.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
    if(pts.size===1){moved=false;begin1(e.offsetX,e.offsetY,e);}else if(pts.size===2){const q=mid();pd=q.d;pm=q;moved=true;}});
  cv.addEventListener('pointermove',e=>{if(!B||!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.offsetX,y:e.offsetY});
    if(pts.size===1&&start){const dx=e.offsetX-start.x,dy=e.offsetY-start.y;if(!moved&&Math.hypot(dx,dy)>8)moved=true;if(!moved)return;
      if(B.view==='3d'){if(start.pan){pan3(e.offsetX-start.lx,e.offsetY-start.ly);start.lx=e.offsetX;start.ly=e.offsetY;}else{B.c3.yaw=start.yaw-dx*.006;B.c3.pit=clamp(start.pit+dy*.005,.1,1.52);}}
      else{B.cam.x=clamp(start.cx-dx/B.k,0,W);B.cam.y=clamp(start.cy-dy/B.k,0,H);}}
    else if(pts.size===2){const q=mid();if(B.view==='3d'){if(pd>0)B.c3.d=clamp(B.c3.d*pd/q.d,3,900);if(pm)pan3(q.x-pm.x,q.y-pm.y);}else if(pd>0)B.cam.z=clamp(B.cam.z*q.d/pd,1,60);pd=q.d;pm=q;}});
  const up=e=>{if(!B||!pts.has(e.pointerId))return;const was=pts.size;pts.delete(e.pointerId);
    if(was===1&&!moved&&e.type==='pointerup')tap(e.offsetX,e.offsetY);
    if(pts.size===1){const p=[...pts.values()][0];begin1(p.x,p.y);moved=true;}else if(pts.size===0){start=null;pm=null;}};
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{if(!B)return;e.preventDefault();const k=e.deltaY<0?1.15:.87;if(B.view==='3d')B.c3.d=clamp(B.c3.d/k,3,900);else B.cam.z=clamp(B.cam.z*k,1,60);},{passive:false});
  window.addEventListener('resize',fit);
  window.addEventListener('keydown',e=>{if(!B||B.over||mq.length)return;if(e.code==='Space'){e.preventDefault();setSpeed(B.paused?B.speed:0);}else if(['1','2','3','4','5'].includes(e.key))setSpeed([1,2,4,8,16][+e.key-1]);else if(e.key==='v')setView(B.view==='3d'?'2d':'3d');});
  window.addEventListener('error',e=>{try{toast('エラー: '+(e.message||''));}catch(_){}});
}
initDOM();
S=load();
if(S){setPlanet(S.cfg.planet||0,true);applyNation(S.cfg.nat,S.cfg.riv);applyEdits(S.ed);polLoad();render();if(S.over)showOver();else if(gpNext())groundPrompt();else if(S.pending)showIncident();}
else{newGame({});render();showTitle();}
