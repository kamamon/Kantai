/* ---------- シルエット：作戦図と一覧は横から、戦術図は真上から ---------- */
// 横から見た形。長さ1、右が艦首、y=0 が水線(上がマイナス)
const SIDE={
  dd:[[-.5,-.1,-.5,0,.4,0,.5,-.13,.3,-.1],[-.22,-.1,-.22,-.2,.12,-.2,.16,-.27,.22,-.27,.24,-.1],[-.1,-.2,-.1,-.3,-.02,-.3,-.02,-.2],[.03,-.27,.05,-.45,.08,-.45,.09,-.27],[.3,-.1,.3,-.15,.37,-.15,.4,-.12]],
  cv:[[-.5,-.16,-.47,0,.42,0,.5,-.16],[-.5,-.16,.5,-.16,.5,-.2,-.5,-.2],[.02,-.2,.02,-.34,.2,-.34,.2,-.2],[.08,-.34,.1,-.47,.13,-.47,.14,-.34]],
  ss:[[-.5,-.03,-.42,-.09,.38,-.09,.5,-.04,.4,0,-.44,0],[-.02,-.09,0,-.24,.12,-.24,.14,-.09],[-.5,-.03,-.52,-.14,-.46,-.14,-.44,-.06]],
  tr:[[-.5,-.12,-.48,0,.42,0,.5,-.14,.3,-.12],[-.46,-.12,-.46,-.3,-.22,-.3,-.22,-.12],[-.38,-.3,-.38,-.4,-.3,-.4,-.3,-.3],[0,-.12,.01,-.32,.04,-.32,.05,-.12],[.2,-.12,.21,-.28,.24,-.28,.25,-.12]],
  pb:[[-.4,-.08,-.4,0,.32,0,.42,-.11,.2,-.08],[-.18,-.08,-.18,-.2,.06,-.2,.1,-.08],[-.06,-.2,-.05,-.33,-.02,-.33,-.01,-.2]]
};
// 真上から見た形。長さ1、上が進む向き
const TOPV={
  ship:[[0,-.5,.14,-.26,.17,.3,.12,.5,-.12,.5,-.17,.3,-.14,-.26]],
  cv:[[-.06,-.5,.12,-.5,.2,-.3,.2,.5,-.12,.5,-.23,.32,-.28,-.02,-.15,-.2,-.14,-.4]],
  lst:[[-.13,-.5,.13,-.5,.18,-.3,.18,.42,.12,.5,-.12,.5,-.18,.42,-.18,-.3]],
  sub:[[0,-.5,.09,-.38,.1,.3,.04,.5,-.04,.5,-.1,.3,-.09,-.38],[-.2,-.26,.2,-.26,.2,-.18,-.2,-.18]],
  boat:[[0,-.5,.17,-.2,.17,.5,-.17,.5,-.17,-.2]],
  ftr:[[0,-.5,.07,-.2,.4,.2,.4,.3,.1,.26,.2,.5,-.2,.5,-.1,.26,-.4,.3,-.4,.2,-.07,-.2]],
  big:[[0,-.5,.06,-.4,.07,-.12,.5,.02,.5,.12,.07,.08,.06,.34,.2,.44,.2,.5,-.2,.5,-.2,.44,-.06,.34,-.07,.08,-.5,.12,-.5,.02,-.07,-.12,-.06,-.4]],
  uav:[[0,-.4,.04,-.2,.5,-.05,.5,.03,.04,.02,.03,.3,.14,.45,-.14,.45,-.03,.3,-.04,.02,-.5,.03,-.5,-.05,-.04,-.2]],
  hel:[[0,-.4,.09,-.3,.09,.05,.03,.15,.03,.5,-.03,.5,-.03,.15,-.09,.05,-.09,-.3]]
};
// 上部構造(濃い色で重ねる)
const TOPD={ship:[[-.09,-.14,.09,-.14,.09,.1,-.09,.1],[-.04,-.36,.04,-.36,.04,-.28,-.04,-.28]],cv:[[.08,-.12,.17,-.12,.17,.12,.08,.12]],lst:[[-.11,.18,.11,.18,.11,.4,-.11,.4]],sub:[[-.035,-.14,.035,-.14,.035,.04,-.035,.04]],boat:[[-.09,-.05,.09,-.05,.09,.2,-.09,.2]]};
const sideKind=t=>!t?'dd':t.fcap?'cv':t.cat==='sub'?'ss':(t.tcap||t.sup)?'tr':t.val<32?'pb':'dd';
function silPath(g,polys,x,y,L,ca,sa,fx){for(const p of polys){g.moveTo(x+(p[0]*ca-p[1]*sa)*L*fx,y+(p[0]*sa+p[1]*ca)*L);for(let i=2;i<p.length;i+=2)g.lineTo(x+(p[i]*ca-p[i+1]*sa)*L*fx,y+(p[i]*sa+p[i+1]*ca)*L);g.closePath();}}
function silSide(g,kind,x,y,L,fill,stroke,flip){g.beginPath();silPath(g,SIDE[kind]||SIDE.dd,x,y,L,1,0,flip?-1:1);if(stroke){g.strokeStyle=stroke;g.lineWidth=1.6;g.stroke();}g.fillStyle=fill;g.fill();}
function silTop(g,kind,x,y,L,ang,fill,stroke){const p=TOPV[kind]||TOPV.ship;g.beginPath();silPath(g,p,x,y,L,Math.cos(ang),Math.sin(ang),1);if(stroke){g.strokeStyle=stroke;g.lineWidth=2.2;g.lineJoin='round';g.stroke();}g.fillStyle=fill;g.fill();
  if(kind==='hel'){g.strokeStyle=fill;g.lineWidth=1;g.beginPath();g.arc(x,y-L*.12*Math.cos(ang),L*.42,0,6.3);g.stroke();}}
// 一覧に使う小さなSVG
function silSVG(kind,w,col){const p=SIDE[kind]||SIDE.dd,h=Math.round(w*.52);return `<svg class="sil" width="${w}" height="${h}" viewBox="-0.54 -0.5 1.08 0.52" aria-hidden="true">${p.map(q=>{let d='';for(let i=0;i<q.length;i+=2)d+=(i?'L':'M')+q[i]+' '+q[i+1];return `<path d="${d}Z" fill="${col||'#9fd0ff'}"/>`;}).join('')}</svg>`;}
const symKind=u=>u.site?'site':u.cat==='air'?(u.sk||(u.key==='aew'||u.key==='ebmr'||u.key==='erec'?'big':u.key==='euav'?'uav':'ftr')):u.cat==='sub'?'sub':(u.cvf||u.key==='ecv')?'cv':(u.key==='elst'||u.key==='lst'||u.key==='lhd'||u.key==='lpd'||u.key==='aoe')?'lst':(u.max<60&&u.side==='P')?'boat':'ship';
// 戦術図の記号：艦は船体、航空機は機影。進む向きに回す
function drawSym(g,x,y,u,ghost,sel,tg){const E=u.side==='E',c=E?'#ff6b5e':'#5fb0ff',f=E?'#ff8f84':'#8cc8ff',kd=symKind(u),zk=clamp(.8+.2*Math.sqrt(B.cam.z),1,2.1);
  if(u.dx!=null&&Math.abs(u.dx-u.x)+Math.abs(u.dy-u.y)>.02)u._a=Math.atan2(u.dy-u.y,u.dx-u.x)+Math.PI/2;else if(u._a==null)u._a=Math.atan2(B.obj.y-u.y,B.obj.x-u.x)+Math.PI/2;
  g.globalAlpha=ghost?.4:1;let L=16;
  if(kd==='site'){const s=7*zk;L=s*2;g.fillStyle=E?'rgba(90,20,16,.9)':'rgba(13,42,62,.9)';g.strokeStyle=c;g.lineWidth=1.5;g.beginPath();g.rect(x-s,y-s,s*2,s*2);g.fill();g.stroke();g.strokeStyle=f;g.fillStyle=f;g.lineWidth=1.4;g.beginPath();
    if(u.sym==='RDR'){g.arc(x,y-s*.1,s*.55,Math.PI*1.1,Math.PI*1.9);g.moveTo(x,y-s*.1);g.lineTo(x,y+s*.6);g.moveTo(x-s*.4,y+s*.6);g.lineTo(x+s*.4,y+s*.6);}
    else if(u.sym==='AB'){g.moveTo(x-s*.7,y+s*.5);g.lineTo(x+s*.7,y-s*.5);g.moveTo(x-s*.3,y-s*.5);g.lineTo(x+s*.3,y+s*.5);}
    else if(u.sym==='SAM'){for(const d of[-.4,0,.4]){g.moveTo(x+s*d-s*.2,y+s*.5);g.lineTo(x+s*d+s*.2,y-s*.5);}}
    else{g.moveTo(x-s*.6,y+s*.45);g.lineTo(x+s*.6,y+s*.45);g.moveTo(x-s*.45,y+s*.3);g.lineTo(x+s*.55,y-s*.5);}
    g.stroke();}
  else{L=(kd==='cv'?29:kd==='lst'?23:kd==='sub'?19:kd==='boat'?14:kd==='ftr'?16:kd==='big'?20:kd==='hel'||kd==='uav'?15:u.max>=170?24:u.max>=100?21:18)*zk;const dk=E?'#3a0906':'#04213a',ca=Math.cos(u._a),sa=Math.sin(u._a);
    silTop(g,kd,x,y,L,u._a,f,ghost?null:dk);
    if(TOPD[kd]){g.beginPath();silPath(g,TOPD[kd],x,y,L,ca,sa,1);g.fillStyle=dk;g.globalAlpha=(ghost?.4:1)*.8;g.fill();g.globalAlpha=ghost?.4:1;}
    if(kd==='cv'){g.strokeStyle=dk;g.lineWidth=1;g.beginPath();g.moveTo(x+.4*sa*L-.03*ca*L,y-.4*ca*L-.03*sa*L);g.lineTo(x-.44*sa*L-.03*ca*L,y+.44*ca*L-.03*sa*L);g.stroke();}
    if(u.key==='aew'||u.rd){g.fillStyle=dk;g.beginPath();g.arc(x,y,L*.13,0,6.3);g.fill();}}
  const r=L*.56+4;
  if(sel||tg){g.strokeStyle=tg?'#ffd0c8':'#ffffff';g.lineWidth=1.2;g.setLineDash(tg?[4,3]:[]);g.beginPath();g.arc(x,y,r,0,6.3);g.stroke();g.setLineDash([]);}
  if(u.cat!=='air'&&u.hp<u.max&&!ghost){const w=18,q=Math.max(0,u.hp/u.max);g.fillStyle='#1a2c3a';g.fillRect(x-w/2,y+r+1,w,2.5);g.fillStyle=q>.5?'#63dba0':q>.25?'#f2b54a':'#ff6b5e';g.fillRect(x-w/2,y+r+1,w*q,2.5);}
  g.globalAlpha=1;g.lineWidth=1;}
