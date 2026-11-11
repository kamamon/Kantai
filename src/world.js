/* ================= 惑星ペラギアの世界地図 ================= */
// 決まった種から毎回同じ世界を作る。陸は45か国の領土に、海は海域に分かれる。作戦図はこの地図の一部を切り出して描く
const WW=288,WH=162,WN=WW*WH,WS=6;
let WORLD=null;
function wHeap(){const a=[];return{n:()=>a.length,push(k,v){a.push([k,v]);let i=a.length-1;while(i>0){const p=(i-1)>>1;if(a[p][0]<=a[i][0])break;const t=a[p];a[p]=a[i];a[i]=t;i=p;}},
  pop(){const t=a[0],l=a.pop();if(a.length){a[0]=l;let i=0;for(;;){let c=i*2+1;if(c>=a.length)break;if(c+1<a.length&&a[c+1][0]<a[c][0])c++;if(a[i][0]<=a[c][0])break;const x=a[i];a[i]=a[c];a[c]=x;i=c;}}return t;}};}
// 複数の起点から同時に広げて、各マスの持ち主を決める
function wGrow(seeds,pass,cost,diag){const own=new Int16Array(WN).fill(-1),dist=new Float64Array(WN).fill(1e9),h=wHeap();
  seeds.forEach((c,k)=>{if(c>=0){dist[c]=0;own[c]=k;h.push(0,c);}});
  while(h.n()){const t=h.pop(),d=t[0],c=t[1];if(d>dist[c])continue;const x=c%WW,y=(c-x)/WW;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if((!dx&&!dy)||(!diag&&dx&&dy))continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=WW||ny>=WH)continue;const n=ny*WW+nx;if(!pass(n))continue;
      const nd=d+(dx&&dy?1.41:1)*cost(n);if(nd<dist[n]){dist[n]=nd;own[n]=own[c];h.push(nd,n);}}}
  return own;}
const wnb=c=>{const x=c%WW,a=[];if(x>0)a.push(c-1);if(x<WW-1)a.push(c+1);if(c>=WW)a.push(c-WW);if(c<WN-WW)a.push(c+WW);return a;};
const wd2=(a,b)=>{const dx=a%WW-b%WW,dy=Math.floor(a/WW)-Math.floor(b/WW);return dx*dx+dy*dy;};
function wRuns(cells){const by={};for(const c of cells){const y=Math.floor(c/WW);(by[y]=by[y]||[]).push(c%WW);}const out=[];
  for(const y in by){const xs=by[y].sort((a,b)=>a-b);let s=xs[0],p=xs[0];for(let i=1;i<=xs.length;i++){if(i<xs.length&&xs[i]===p+1){p=xs[i];continue;}out.push([+y,s,p]);s=p=xs[i];}}return out;}
function genWorld(){const r=rng32(48271);
  const lat=(gw,gh)=>{const w=gw+2,g=new Float32Array(w*(gh+2));for(let i=0;i<g.length;i++)g[i]=r();
    return(x,y)=>{const fx=x*gw/WW,fy=y*gh/WH,xi=Math.floor(fx),yi=Math.floor(fy),tx=fx-xi,ty=fy-yi,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),a=g[yi*w+xi],b=g[yi*w+xi+1],c=g[(yi+1)*w+xi],d=g[(yi+1)*w+xi+1];return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};};
  const n1=lat(7,4),n2=lat(14,8),n3=lat(28,16),n4=lat(56,32),nb=lat(36,20),hgt=new Float32Array(WN),rough=new Float32Array(WN);
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){const ex=Math.min(x,WW-1-x)/16,ey=Math.min(y,WH-1-y)/11,i=y*WW+x;
    hgt[i]=n1(x,y)+n2(x,y)*.5+n3(x,y)*.25+n4(x,y)*.12-Math.max(0,1-ex)*.6-Math.max(0,1-ey)*.7;rough[i]=nb(x,y);}
  const thr=Array.from(hgt).sort((a,b)=>a-b)[Math.floor(WN*.66)],land=new Uint8Array(WN);for(let i=0;i<WN;i++)land[i]=hgt[i]>thr?1:0;
  // 外洋につながらない水面は陸に、小さすぎる陸は海にする
  const flood=(start,ok)=>{const seen=new Uint8Array(WN),q=[start],out=[start];seen[start]=1;while(q.length){const c=q.pop();for(const n of wnb(c))if(!seen[n]&&ok(n)){seen[n]=1;q.push(n);out.push(n);}}return{seen,out};};
  let oc=flood(0,n=>!land[n]).seen;for(let i=0;i<WN;i++)if(!land[i]&&!oc[i])land[i]=1;
  const comp=new Int32Array(WN).fill(-1),csize=[];for(let i=0;i<WN;i++){if(!land[i]||comp[i]>=0)continue;const f=flood(i,n=>land[n]===1&&comp[n]<0),id=csize.length;
    if(f.out.length<6){for(const c of f.out)land[c]=0;continue;}for(const c of f.out)comp[c]=id;csize.push(f.out.length);}
  const ocean=i=>!land[i],coast=[];for(let i=0;i<WN;i++)if(land[i]&&wnb(i).some(ocean))coast.push(i);
  // 首都は海沿いに、互いにできるだけ離して45か所選ぶ。どの国がどこに入るかは、北から南へ5段・各段9か国の目安に近い順で決める
  const cc=coast.filter(c=>csize[comp[c]]>=30),mid=Math.floor(WH/2)*WW+Math.floor(WW/2),md=new Float32Array(cc.length).fill(1e9),pts=[];let cur=cc.reduce((b,c)=>wd2(c,mid)<wd2(b,mid)?c:b,cc[0]);
  for(let k=0;k<NATS.length;k++){pts.push(cur);let bi=0,bv=-1;for(let j=0;j<cc.length;j++){const d=wd2(cc[j],cur);if(d<md[j])md[j]=d;if(md[j]>bv){bv=md[j];bi=j;}}cur=cc[bi];}
  const caps=new Array(NATS.length).fill(-1),pairs=[];
  NGRID.forEach((row,ry)=>row.forEach((ni,cx)=>{const tx=(cx+.5)/9*WW,ty=(ry+.5)/5*WH;pts.forEach((c,pi)=>{const dx=c%WW-tx,dy=(Math.floor(c/WW)-ty)*1.6;pairs.push([dx*dx+dy*dy,ni,pi]);});}));
  pairs.sort((a,b)=>a[0]-b[0]);const used=new Set();for(const q of pairs){if(caps[q[1]]>=0||used.has(q[2]))continue;caps[q[1]]=pts[q[2]];used.add(q[2]);}
  const own=wGrow(caps,i=>land[i]===1,i=>1+3*rough[i],false);
  for(let i=0;i<WN;i++)if(land[i]&&own[i]<0){let b=0,bd=1e9;caps.forEach((c,k)=>{const d=wd2(c,i);if(d<bd){bd=d;b=k;}});own[i]=b;}
  // 海を海域に分ける
  let seeds=[];for(let gy=10;gy<WH;gy+=20)for(let gx=10;gx<WW;gx+=21){let c=-1,bd=50;const px=gx+Math.round((r()-.5)*8),py=gy+Math.round((r()-.5)*8);
      for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=px+dx,y=py+dy;if(x<1||y<1||x>=WW-1||y>=WH-1)continue;const i=y*WW+x,d=dx*dx+dy*dy;if(!land[i]&&d<bd){bd=d;c=i;}}
      if(c>=0&&!seeds.some(s=>wd2(s,c)<64))seeds.push(c);}
  const growSea=()=>wGrow(seeds,ocean,i=>1+.8*rough[i],true);let reg=growSea();
  const cnt=new Array(seeds.length).fill(0);for(let i=0;i<WN;i++)if(reg[i]>=0)cnt[reg[i]]++;
  if(cnt.some(n=>n<45)){seeds=seeds.filter((s,k)=>cnt[k]>=45);reg=growSea();}
  const cells=seeds.map(()=>[]);for(let i=0;i<WN;i++)if(reg[i]>=0)cells[reg[i]].push(i);
  const R=cells.map(cs=>{let sx=0,sy=0;for(const c of cs){sx+=c%WW;sy+=Math.floor(c/WW);}const mx=sx/cs.length,my=sy/cs.length;let b=cs[0],bd=1e9;
    for(const c of cs){const dx=c%WW-mx,dy=Math.floor(c/WW)-my,d=dx*dx+dy*dy;if(d<bd){bd=d;b=c;}}return{c:b,x:b%WW,y:Math.floor(b/WW),n:cs.length,runs:wRuns(cs),adj:new Set()};});
  for(let i=0;i<WN;i++){if(reg[i]<0)continue;for(const n of[i+1,i+WW]){if(n>=WN||(n===i+1&&n%WW===0)||reg[n]<0||reg[n]===reg[i])continue;R[reg[i]].adj.add(reg[n]);R[reg[n]].adj.add(reg[i]);}}
  // どの海域にも小島がひとつある
  R.forEach(g=>{land[g.c]=2;for(const n of wnb(g.c))if(!land[n]&&r()<.55)land[n]=2;});
  const ncell=NATS.map(()=>[]);for(let i=0;i<WN;i++)if(land[i]===1)ncell[own[i]].push(i);
  const nat=caps.map((c,k)=>{const cs=ncell[k].filter(i=>comp[i]===comp[c]);let sx=0,sy=0;for(const i of cs){sx+=i%WW;sy+=Math.floor(i/WW);}const mx=sx/cs.length,my=sy/cs.length;let b=c,bd=1e9;
    for(const i of cs){const dx=i%WW-mx,dy=Math.floor(i/WW)-my,d=dx*dx+dy*dy;if(d<bd){bd=d;b=i;}}return{cap:c,x:c%WW,y:Math.floor(c/WW),lx:b%WW,ly:Math.floor(b/WW),area:ncell[k].length,main:cs.length,runs:wRuns(ncell[k]),th:null};});
  return WORLD={hgt,thr,land,own,reg,R,nat};}
// その国の作戦海域：首都の前の海を本土近海とし、近い順に7海域を取る。遠い3つが島のある海域、外側の2つが敵の泊地になる
function natTheater(i){const Wd=WORLD||genWorld(),N=Wd.nat[i];if(N.th)return N.th;const R=Wd.R,dc=r=>{const dx=R[r].x-N.x,dy=R[r].y-N.y;return dx*dx+dy*dy;};
  let home=-1,bd=1e9;for(let c=0;c<WN;c++)if(Wd.reg[c]>=0&&Wd.land[c]===0){const d=wd2(c,N.cap);if(d<bd){bd=d;home=Wd.reg[c];}}
  const depth={},q=[home];depth[home]=0;while(q.length){const c=q.shift();for(const n of R[c].adj)if(depth[n]==null){depth[n]=depth[c]+1;q.push(n);}}
  const all=Object.keys(depth).map(Number).sort((a,b)=>depth[a]-depth[b]||dc(a)-dc(b)),T=all.slice(0,8),rest=T.slice(1),rd=(a,b)=>{const dx=R[a].x-R[b].x,dy=R[a].y-R[b].y;return dx*dx+dy*dy;};
  // 島は本土から3海域以内で、できるだけ遠く、互いに離れたところに置く
  const near3=rest.filter(c=>depth[c]<=3),cand=near3.length>=3?near3:rest,isl=[cand.slice().sort((a,b)=>depth[b]-depth[a]||dc(b)-dc(a))[0]];
  while(isl.length<3){let b=-1,bs=-1;for(const c of cand){if(isl.includes(c))continue;const s=Math.min(...isl.map(k=>rd(c,k)))+depth[c]*400;if(s>bs){bs=s;b=c;}}isl.push(b);}
  isl.sort((a,b)=>R[a].y-R[b].y);const lanes=rest.filter(c=>!isl.includes(c)).sort((a,b)=>R[a].y-R[b].y),out=all.filter(c=>!T.includes(c));
  const base=(near,ex)=>{let c=out.filter(o=>o!==ex&&near.some(k=>R[k].adj.has(o)));if(!c.length)c=out.filter(o=>o!==ex);return c.sort((a,b)=>Math.min(...near.map(k=>rd(a,k)))-Math.min(...near.map(k=>rd(b,k))))[0];};
  const b8=base([isl[0]],-1),b9=base([isl[2],isl[1]],b8),reg=[home,isl[0],lanes[0],lanes[1],isl[1],lanes[2],lanes[3],isl[2],b8,b9],idx={};reg.forEach((g,k)=>{idx[g]=k;});
  const adj=reg.map((g,k)=>k>7?[]:reg.slice(0,8).map((o,j)=>R[g].adj.has(o)?j:-1).filter(j=>j>=0));adj[1].push(8);adj[8]=[1];adj[4].push(9);adj[7].push(9);adj[9]=[4,7];
  let x0=1e9,y0=1e9,x1=-1,y1=-1;for(const g of reg)for(const u of R[g].runs){if(u[0]<y0)y0=u[0];if(u[0]>y1)y1=u[0];if(u[1]<x0)x0=u[1];if(u[2]>x1)x1=u[2];}
  x0=Math.max(0,Math.min(x0,N.x-6)-3);y0=Math.max(0,Math.min(y0,N.y-6)-3);x1=Math.min(WW-1,Math.max(x1,N.x+6)+3);y1=Math.min(WH-1,Math.max(y1,N.y+6)+3);
  // 縦長・横長すぎる切り出しは、画面に収まりのよい形まで広げる
  const grow=(lo,hi,need,max)=>{let add=need-(hi-lo+1);if(add<=0)return[lo,hi];lo-=Math.floor(add/2);hi+=Math.ceil(add/2);if(lo<0){hi-=lo;lo=0;}if(hi>max){lo-=hi-max;hi=max;}return[Math.max(0,lo),hi];};
  [x0,x1]=grow(x0,x1,Math.round((y1-y0+1)*.74),WW-1);[y0,y1]=grow(y0,y1,Math.round((x1-x0+1)*.62),WH-1);
  return N.th={reg,idx,adj,box:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1}};}
// 作戦海域のつながりを、ゲームが参照する表に流し込む
function applyTheater(ni){const th=natTheater(ni),R=WORLD.R;
  for(let k=0;k<10;k++){ZONES[k].x=R[th.reg[k]].x;ZONES[k].y=R[th.reg[k]].y;ZONES[k].adj=th.adj[k];ADJ[k]=th.adj[k];}
  for(let a=0;a<10;a++)for(let b=0;b<10;b++){const p=zpath(a,b);HOP[a][b]=p?p.length-1:99;}
  const dir=k=>{const dx=ZONES[k].x-ZONES[0].x,dy=ZONES[k].y-ZONES[0].y,a=Math.atan2(dy,dx)*180/Math.PI;return['東','南東','南','南西','西','北西','北','北東'][Math.round(((a+360)%360)/45)%8];},d8=dir(8),d9=dir(9);
  ZONES[8].n=`敵 ${d8}方泊地`;ZONES[9].n=d9===d8?`敵 ${d9}方第二泊地`:`敵 ${d9}方泊地`;for(const k of[8,9]){SECT[k]=ZONES[k].n;ISL[k]=ZONES[k].n;ZS[k]=ZONES[k].n.slice(2);}}

/* ---------- 描画 ---------- */
