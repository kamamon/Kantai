/* ================= 惑星の世界地図 ================= */
// 惑星ごとに決まった種から、毎回同じ世界を作る。陸は45か国の領土に、国は州に、州はプロヴィンスに分かれる。海は海域に分かれる。作戦図はこの地図の一部を切り出して描く
const WW=432,WH=243,WN=WW*WH,WS=4;
let WORLD=null,_wgen=0;
function wHeap(){let cap=4096,K=new Float64Array(cap),V=new Int32Array(cap),n=0;return{n:()=>n,
  push(k,v){if(n===cap){cap*=2;const k2=new Float64Array(cap),v2=new Int32Array(cap);k2.set(K);v2.set(V);K=k2;V=v2;}let i=n++;while(i>0){const p=(i-1)>>1;if(K[p]<=k)break;K[i]=K[p];V[i]=V[p];i=p;}K[i]=k;V[i]=v;},
  pop(){const k0=K[0],v0=V[0];n--;if(n>0){const k=K[n],v=V[n];let i=0;for(;;){let c=i*2+1;if(c>=n)break;if(c+1<n&&K[c+1]<K[c])c++;if(k<=K[c])break;K[i]=K[c];V[i]=V[c];i=c;}K[i]=k;V[i]=v;}return[k0,v0];}};}
// 複数の起点から同時に広げて、各マスの持ち主を決める
function wGrow(seeds,pass,cost,diag,grp,spd){const own=new Int16Array(WN).fill(-1),dist=new Float64Array(WN).fill(1e9),h=wHeap();
  seeds.forEach((c,k)=>{if(c>=0){dist[c]=0;own[c]=k;h.push(0,c);}});
  while(h.n()){const t=h.pop(),d=t[0],c=t[1];if(d>dist[c])continue;const x=c%WW,y=(c-x)/WW;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if((!dx&&!dy)||(!diag&&dx&&dy))continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=WW||ny>=WH)continue;const n=ny*WW+nx;if(!pass(n)||(grp&&grp[n]!==grp[c]))continue;
      const stp=(dx&&dy?1.41:1)*cost(n),nd=d+(spd?stp*spd[own[c]]:stp);if(nd<dist[n]){dist[n]=nd;own[n]=own[c];h.push(nd,n);}}}
  return own;}
const wnb=c=>{const x=c%WW,a=[];if(x>0)a.push(c-1);if(x<WW-1)a.push(c+1);if(c>=WW)a.push(c-WW);if(c<WN-WW)a.push(c+WW);return a;};
const wd2=(a,b)=>{const dx=a%WW-b%WW,dy=Math.floor(a/WW)-Math.floor(b/WW);return dx*dx+dy*dy;};
function wRuns(cells){const by={};for(const c of cells){const y=Math.floor(c/WW);(by[y]=by[y]||[]).push(c%WW);}const out=[];
  for(const y in by){const xs=by[y].sort((a,b)=>a-b);let s=xs[0],p=xs[0];for(let i=1;i<=xs.length;i++){if(i<xs.length&&xs[i]===p+1){p=xs[i];continue;}out.push([+y,s,p]);s=p=xs[i];}}return out;}
function genWorld(){const K=PL(),g=K.gen,cl=K.clim,rs=K.res,r=rng32(g.seed),gw=g.w,E=g.edge,shp=WSHAPE[g.shape]||null;
  const lat=(gw,gh)=>{const w=gw+2,g=new Float32Array(w*(gh+2));for(let i=0;i<g.length;i++)g[i]=r();
    return(x,y)=>{const fx=x*gw/WW,fy=y*gh/WH,xi=Math.floor(fx),yi=Math.floor(fy),tx=fx-xi,ty=fy-yi,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),a=g[yi*w+xi],b=g[yi*w+xi+1],c=g[(yi+1)*w+xi],d=g[(yi+1)*w+xi+1];return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;};};
  const n1=lat(7,4),n2=lat(14,8),n3=lat(28,16),n4=lat(56,32),nb=lat(36,20),n5=lat(112,63),nm=lat(22,13),hgt=new Float32Array(WN),rough=new Float32Array(WN);
  for(let y=0;y<WH;y++)for(let x=0;x<WW;x++){const ex=Math.min(x,WW-1-x)/E[0],ey=Math.min(y,WH-1-y)/E[2],i=y*WW+x;
    let h=n1(x,y)*gw[0]+n2(x,y)*gw[1]+n3(x,y)*gw[2]+n4(x,y)*gw[3]+n5(x,y)*gw[4]-Math.max(0,1-ex)*E[1]-Math.max(0,1-ey)*E[3];if(shp)h+=shp(x/WW,y/WH);hgt[i]=h;rough[i]=nb(x,y);}
  const thr=Array.from(hgt).sort((a,b)=>a-b)[Math.floor(WN*g.sea)],land=new Uint8Array(WN);for(let i=0;i<WN;i++)land[i]=hgt[i]>thr?1:0;
  // 外洋につながらない水面は陸に、小さすぎる陸は海にする
  const flood=(start,ok)=>{const seen=new Uint8Array(WN),q=[start],out=[start];seen[start]=1;while(q.length){const c=q.pop();for(const n of wnb(c))if(!seen[n]&&ok(n)){seen[n]=1;q.push(n);out.push(n);}}return{seen,out};};
  // 外洋は、地図の隅につながる水面。隅が陸の惑星では、いちばん大きな水面を外洋とする
  let o0=0;if(land[0]||g.shape||g.lake){const lab=new Uint8Array(WN);let bn=0;for(let i=0;i<WN;i++){if(land[i]||lab[i])continue;const q=[i];let n=1;lab[i]=1;while(q.length){const c=q.pop();for(const m of wnb(c))if(!land[m]&&!lab[m]){lab[m]=1;q.push(m);n++;}}if(n>bn){bn=n;o0=i;}}}
  let oc=flood(o0,n=>!land[n]).seen;
  // 内海を残す惑星：大きな内海から外洋まで、低いところを伝って海峡を掘る
  if(g.lake){const lab=new Uint8Array(WN),lakes=[];for(let i=0;i<WN;i++){if(land[i]||oc[i]||lab[i])continue;const q=[i],out=[i];lab[i]=1;while(q.length){const c=q.pop();for(const n of wnb(c))if(!land[n]&&!oc[n]&&!lab[n]){lab[n]=1;q.push(n);out.push(n);}}if(out.length>=g.lake)lakes.push(out);}
    lakes.sort((a,b)=>b.length-a.length);
    for(const lk of lakes.slice(0,60)){const par=new Int32Array(WN).fill(-2),dd=new Float64Array(WN).fill(1e9),hp=wHeap();for(const c of lk){par[c]=-1;dd[c]=0;hp.push(0,c);}let hit=-1;
      while(hp.n()&&hit<0){const t=hp.pop(),d=t[0],c=t[1];if(d>dd[c])continue;if(oc[c]){hit=c;break;}for(const n of wnb(c)){const x=n%WW,y=(n-x)/WW;if(x<1||y<1||x>WW-2||y>WH-2)continue;const nd=d+(land[n]?1+7*Math.max(0,hgt[n]-thr)+rough[n]:.15);if(nd<dd[n]){dd[n]=nd;par[n]=c;hp.push(nd,n);}}}
      if(hit<0)continue;for(let c=hit;c>=0&&par[c]!==-1;c=par[c]){land[c]=0;oc[c]=1;for(const n of wnb(c)){const x=n%WW,y=(n-x)/WW;if(x>0&&y>0&&x<WW-1&&y<WH-1){land[n]=0;oc[n]=1;}}}
      for(const c of lk)oc[c]=1;}
    oc=flood(o0,n=>!land[n]).seen;}
  for(let i=0;i<WN;i++)if(!land[i]&&!oc[i])land[i]=1;
  const comp=new Int32Array(WN).fill(-1),csize=[],mk=new Uint8Array(WN);for(let i=0;i<WN;i++){if(!land[i]||comp[i]>=0)continue;const q=[i],fo=[i];mk[i]=1;while(q.length){const c=q.pop();for(const n of wnb(c))if(!mk[n]&&land[n]===1){mk[n]=1;q.push(n);fo.push(n);}}const id=csize.length;
    if(fo.length<g.isl){for(const c of fo)land[c]=0;continue;}for(const c of fo)comp[c]=id;csize.push(fo.length);}
  const ocean=i=>!land[i],coast=[];for(let i=0;i<WN;i++)if(land[i]&&wnb(i).some(ocean))coast.push(i);
  // 首都は海沿いに、互いにできるだけ離して45か所選ぶ。どの国がどこに入るかは、北から南へ5段・各段9か国の目安に近い順で決める
  const cc=coast.filter(c=>csize[comp[c]]>=g.capIsl),mid=Math.floor(WH/2)*WW+Math.floor(WW/2),md=new Float32Array(cc.length).fill(1e9),pts=[];let cur=cc.reduce((b,c)=>wd2(c,mid)<wd2(b,mid)?c:b,cc[0]);
  for(let k=0;k<NATS.length;k++){pts.push(cur);let bi=0,bv=-1;for(let j=0;j<cc.length;j++){const d=wd2(cc[j],cur);if(d<md[j])md[j]=d;if(md[j]>bv){bv=md[j];bi=j;}}cur=cc[bi];}
  const caps=new Array(NATS.length).fill(-1),pairs=[];
  NGRID.forEach((row,ry)=>row.forEach((ni,cx)=>{const tx=(cx+.5)/9*WW,ty=(ry+.5)/5*WH;pts.forEach((c,pi)=>{const dx=c%WW-tx,dy=(Math.floor(c/WW)-ty)*1.6;pairs.push([dx*dx+dy*dy,ni,pi]);});}));
  pairs.sort((a,b)=>a[0]-b[0]);const used=new Set();for(const q of pairs){if(caps[q[1]]>=0||used.has(q[2]))continue;caps[q[1]]=pts[q[2]];used.add(q[2]);}
  // 国の大きさに差をつける惑星では、国ごとに広がる速さを変える
  let spd=null;if(g.spd){const r2=rng32(g.seed*7+13);spd=caps.map(()=>Math.exp((r2()-.5)*2*g.spd));}
  const own=wGrow(caps,i=>land[i]===1,i=>1+3*rough[i],false,null,spd);
  for(let i=0;i<WN;i++)if(land[i]&&own[i]<0){let b=0,bd=1e9;caps.forEach((c,k)=>{const d=wd2(c,i);if(d<bd){bd=d;b=k;}});own[i]=b;}
  // 海を海域に分ける
  let seeds=[];for(let gy=15;gy<WH;gy+=30)for(let gx=15;gx<WW;gx+=31.5){let c=-1,bd=112;const px=Math.round(gx+(r()-.5)*12),py=Math.round(gy+(r()-.5)*12);
      for(let dy=-9;dy<=9;dy++)for(let dx=-9;dx<=9;dx++){const x=px+dx,y=py+dy;if(x<1||y<1||x>=WW-1||y>=WH-1)continue;const i=y*WW+x,d=dx*dx+dy*dy;if(!land[i]&&d<bd){bd=d;c=i;}}
      if(c>=0&&!seeds.some(s=>wd2(s,c)<144))seeds.push(c);}
  const growSea=()=>wGrow(seeds,ocean,i=>1+.8*rough[i],true);let reg=growSea();
  const cnt=new Array(seeds.length).fill(0);for(let i=0;i<WN;i++)if(reg[i]>=0)cnt[reg[i]]++;
  if(cnt.some(n=>n<g.rmin)){seeds=seeds.filter((s,k)=>cnt[k]>=g.rmin);reg=growSea();}
  const cells=seeds.map(()=>[]);for(let i=0;i<WN;i++)if(reg[i]>=0)cells[reg[i]].push(i);
  const R=cells.map(cs=>{let sx=0,sy=0;for(const c of cs){sx+=c%WW;sy+=Math.floor(c/WW);}const mx=sx/cs.length,my=sy/cs.length;let b=cs[0],bd=1e9;
    for(const c of cs){const dx=c%WW-mx,dy=Math.floor(c/WW)-my,d=dx*dx+dy*dy;if(d<bd){bd=d;b=c;}}return{c:b,x:b%WW,y:Math.floor(b/WW),n:cs.length,runs:wRuns(cs),adj:new Set()};});
  for(let i=0;i<WN;i++){if(reg[i]<0)continue;for(const n of[i+1,i+WW]){if(n>=WN||(n===i+1&&n%WW===0)||reg[n]<0||reg[n]===reg[i])continue;R[reg[i]].adj.add(reg[n]);R[reg[n]].adj.add(reg[i]);}}
  // どの海域にも小島がひとつある
  R.forEach(g=>{land[g.c]=2;const x=g.c%WW,y=(g.c-x)/WW;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const n=(y+dy)*WW+x+dx;if(x+dx>0&&x+dx<WW-1&&y+dy>0&&y+dy<WH-1&&!land[n]&&r()<.6)land[n]=2;}});
  const ncell=NATS.map(()=>[]);for(let i=0;i<WN;i++)if(land[i]===1)ncell[own[i]].push(i);
  const nat=caps.map((c,k)=>{const cs=ncell[k].filter(i=>comp[i]===comp[c]);let sx=0,sy=0;for(const i of cs){sx+=i%WW;sy+=Math.floor(i/WW);}const mx=sx/cs.length,my=sy/cs.length;let b=c,bd=1e9;
    for(const i of cs){const dx=i%WW-mx,dy=Math.floor(i/WW)-my,d=dx*dx+dy*dy;if(d<bd){bd=d;b=i;}}return{cap:c,x:c%WW,y:Math.floor(c/WW),lx:b%WW,ly:Math.floor(b/WW),area:ncell[k].length,main:cs.length,runs:wRuns(ncell[k]),th:null};});
  // 地形：高さと湿り気と緯度で決める
  const ter=new Uint8Array(WN),lh=[];for(let i=0;i<WN;i++)if(land[i]===1)lh.push(hgt[i]);lh.sort((a,b)=>a-b);const hM=lh[Math.floor(lh.length*cl.mM)],hH=lh[Math.floor(lh.length*cl.mH)];
  for(let i=0;i<WN;i++){if(land[i]!==1)continue;const y=Math.floor(i/WW),la0=Math.abs(y/WH-.5)*2,la=cl.wob?la0+(rough[i]-.5)*cl.wob:la0,m=nm(i%WW,y),h=hgt[i];ter[i]=h>hM?5:h>hH?4:la>cl.pol?7:la<cl.jl&&m>cl.jm?3:la>cl.d0&&la<cl.d1&&m<cl.dm?6:m>cl.fm?2:1;}
  // プロヴィンス：国の中を20マスほどの区画に分ける。首都は必ず1区画の中心にする
  const ps=[];for(let gy=2;gy<WH;gy+=g.pg)for(let gx=2;gx<WW;gx+=g.pg){const x=Math.round(gx+(r()-.5)*3),y=Math.round(gy+(r()-.5)*3);if(x<0||y<0||x>=WW||y>=WH)continue;const i=y*WW+x;if(land[i]===1&&!caps.includes(i))ps.push(i);}
  for(const c of caps)ps.push(c);
  const prov=wGrow(ps,i=>land[i]===1,i=>1+2.5*rough[i],false,own);let np=ps.length;
  for(let pass=0,chg=1;chg&&pass<60;pass++){chg=0;for(let i=0;i<WN;i++){if(land[i]!==1||prov[i]>=0)continue;for(const n of wnb(i))if(prov[n]>=0&&own[n]===own[i]){prov[i]=prov[n];chg=1;break;}}}
  for(let i=0;i<WN;i++)if(land[i]===1&&prov[i]<0){const f=flood(i,n=>land[n]===1&&prov[n]<0&&own[n]===own[i]);for(const c of f.out)prov[c]=np;np++;}
  const pcs=Array.from({length:np},()=>[]);for(let i=0;i<WN;i++)if(prov[i]>=0)pcs[prov[i]].push(i);
  for(let p=0;p<np;p++){const cs=pcs[p];if(!cs.length||cs.length>=g.pmin||cs.includes(caps[own[cs[0]]]))continue;const ct={};for(const c of cs)for(const n of wnb(c)){const q=prov[n];if(q>=0&&q!==p&&own[n]===own[c])ct[q]=(ct[q]||0)+1;}
    let b=-1,bv=0;for(const q in ct)if(ct[q]>bv){bv=ct[q];b=+q;}if(b<0)continue;for(const c of cs){prov[c]=b;pcs[b].push(c);}pcs[p]=[];}
  const P=[],pmap=new Int32Array(np).fill(-1);
  for(let p=0;p<np;p++){const cs=pcs[p];if(!cs.length)continue;let sx=0,sy=0,co=0;const tc=[0,0,0,0,0,0,0,0];for(const c of cs){sx+=c%WW;sy+=Math.floor(c/WW);tc[ter[c]]++;if(!co&&wnb(c).some(n=>land[n]===0))co=1;}
    const mx=sx/cs.length,my=sy/cs.length;let b=cs[0],bd=1e9;for(const c of cs){const dx=c%WW-mx,dy=Math.floor(c/WW)-my,d=dx*dx+dy*dy;if(d<bd){bd=d;b=c;}}
    const ni=own[cs[0]],cap=cs.includes(caps[ni]);if(cap)b=caps[ni];pmap[p]=P.length;P.push({id:P.length,nat:ni,n:cs.length,c:b,x:b%WW,y:Math.floor(b/WW),ter:tc.indexOf(Math.max(...tc)),coast:co,cap,adj:new Set(),st:-1});}
  for(let i=0;i<WN;i++)if(prov[i]>=0)prov[i]=pmap[prov[i]];
  for(let i=0;i<WN;i++){const a=prov[i];if(a<0)continue;for(const n of[i+1,i+WW]){if(n>=WN||(n===i+1&&n%WW===0))continue;const b=prov[n];if(b>=0&&b!==a){P[a].adj.add(b);P[b].adj.add(a);}}}
  for(const p of P)p.adj=[...p.adj];
  // 州：プロヴィンスを7つほどずつまとめる。首都のある区画から、互いに遠い区画を種にして広げる
  const ST=[],pd2=(a,b)=>(a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y),DENS=[0,1.4,.8,.7,.6,.25,.2,.15],RESK=[[],[['food',.55],['oil',.12]],[['steel',.18],['food',.18]],[['rare',.25],['oil',.2]],[['steel',.6]],[['rare',.6],['steel',.3]],[['oil',.7]],[['oil',.3],['rare',.25]]];
  nat.forEach((N,ni)=>{const mine=P.filter(p=>p.nat===ni);if(!mine.length)return;const ns=clamp(Math.round(mine.length/7),1,12),sd=[mine.find(p=>p.cap)||mine[0]];
    while(sd.length<ns){let b=null,bv=-1;for(const p of mine){if(sd.includes(p))continue;let v=1e18;for(const q of sd){const d=pd2(p,q);if(d<v)v=d;}if(v>bv){bv=v;b=p;}}if(!b)break;sd.push(b);}
    const s0=ST.length;sd.forEach(p=>{p.st=ST.length;ST.push({id:ST.length,nat:ni,k:ST.length-s0,provs:[p.id]});});
    let q=sd.slice();while(q.length){const nq=[];for(const p of q)for(const a of p.adj){const o=P[a];if(o.nat===ni&&o.st<0){o.st=p.st;ST[p.st].provs.push(o.id);nq.push(o);}}q=nq;}
    for(const p of mine)if(p.st<0){let b=sd[0],bv=1e18;for(const q2 of sd){const d=pd2(p,q2);if(d<bv){bv=d;b=q2;}}p.st=b.st;ST[b.st].provs.push(p.id);}
    N.st=[];for(let k=s0;k<ST.length;k++){const st=ST[k],ps2=st.provs.map(id=>P[id]),capS=ps2.some(p=>p.cap),tc=[0,0,0,0,0,0,0,0];let pop=0,cells=0,co=0;
      for(const p of ps2){pop+=p.n*DENS[p.ter]*(p.coast?1.25:1);cells+=p.n;tc[p.ter]+=p.n;if(p.coast)co=1;}
      const cp=capS?ps2.find(p=>p.cap):ps2.slice().sort((a,b)=>(b.n+(b.coast?10:0)+(b.ter===1?6:0))-(a.n+(a.coast?10:0)+(a.ter===1?6:0)))[0];
      st.cap=capS?1:0;st.city=cp.id;st.x=cp.x;st.y=cp.y;st.ter=tc.indexOf(Math.max(...tc));st.coast=co;st.cells=cells;st.pop=Math.round(pop*(capS?1.7:1)*4.5*K.pop);st.dev=clamp(Math.round((capS?5:2.4)+r()*2.2+(co?.5:0)+K.dev),1,8);
      {let v=r();st.res='';for(const q of RESK[st.ter]){const pq=Math.min(.95,q[1]*rs.k*rs[q[0]]);if(v<pq){st.res=q[0];break;}v-=pq;}}N.st.push(st.id);}});
  // 河川：海までいちばん低いところを伝う道筋を全陸地で求め、集まった流れの太いところを川にする
  const par=new Int32Array(WN).fill(-1),rd=new Float64Array(WN).fill(1e9),hp=wHeap(),ord=[],jit=new Float32Array(WN);for(let i=0;i<WN;i++)jit[i]=r();
  for(const c of coast)if(r()<.035){rd[c]=0;hp.push(0,c);}   // 河口
  while(hp.n()){const t=hp.pop(),d=t[0],c=t[1];if(d>rd[c])continue;ord.push(c);const x=c%WW,y=(c-x)/WW;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=WW||ny>=WH)continue;const n=ny*WW+nx;if(land[n]!==1)continue;
      const nd=d+(dx&&dy?1.41:1)*(1+Math.max(0,hgt[n]-thr)*6+jit[n]*2.5);if(nd<rd[n]){rd[n]=nd;par[n]=c;hp.push(nd,n);}}}
  const flow=new Float32Array(WN);for(let k=ord.length-1;k>=0;k--){const c=ord[k];flow[c]+=1;if(par[c]>=0)flow[par[c]]+=flow[c];}
  const riv=[];for(const c of ord)if(par[c]>=0&&flow[c]>=26)riv.push([c,par[c],flow[c]]);
  return WORLD={hgt,thr,land,own,reg,R,nat,ter,prov,P,ST,riv,pown:Int16Array.from(P,p=>p.nat),pl:PLC,ver:(_wgen++)*1e6};}
// その国の作戦海域：首都の前の海を本土近海とし、近い順に7海域を取る。遠い3つが島のある海域、外側の2つが敵の泊地になる
function natTheater(i){const Wd=WORLD||genWorld(),N=Wd.nat[i];if(N.th)return N.th;const R=Wd.R,dc=r=>{const dx=R[r].x-N.x,dy=R[r].y-N.y;return dx*dx+dy*dy;};
  let home=-1,bd=1e9;for(let c=0;c<WN;c++)if(Wd.reg[c]>=0&&Wd.land[c]===0){const d=wd2(c,N.cap);if(d<bd){bd=d;home=Wd.reg[c];}}
  const depth={},q=[home];depth[home]=0;while(q.length){const c=q.shift();for(const n of R[c].adj)if(depth[n]==null){depth[n]=depth[c]+1;q.push(n);}}
  const all=Object.keys(depth).map(Number).sort((a,b)=>depth[a]-depth[b]||dc(a)-dc(b)),T=all.slice(0,8),rest=T.slice(1),rd=(a,b)=>{const dx=R[a].x-R[b].x,dy=R[a].y-R[b].y;return dx*dx+dy*dy;};
  // 島は本土から3海域以内で、できるだけ遠く、互いに離れたところに置く
  const near3=rest.filter(c=>depth[c]<=3),cand=near3.length>=3?near3:rest,isl=[cand.slice().sort((a,b)=>depth[b]-depth[a]||dc(b)-dc(a))[0]];
  while(isl.length<3){let b=-1,bs=-1;for(const c of cand){if(isl.includes(c))continue;const s=Math.min(...isl.map(k=>rd(c,k)))+depth[c]*900;if(s>bs){bs=s;b=c;}}isl.push(b);}
  isl.sort((a,b)=>R[a].y-R[b].y);const lanes=rest.filter(c=>!isl.includes(c)).sort((a,b)=>R[a].y-R[b].y),out=all.filter(c=>!T.includes(c));
  const base=(near,ex)=>{let c=out.filter(o=>o!==ex&&near.some(k=>R[k].adj.has(o)));if(!c.length)c=out.filter(o=>o!==ex);return c.sort((a,b)=>Math.min(...near.map(k=>rd(a,k)))-Math.min(...near.map(k=>rd(b,k))))[0];};
  const b8=base([isl[0]],-1),b9=base([isl[2],isl[1]],b8),reg=[home,isl[0],lanes[0],lanes[1],isl[1],lanes[2],lanes[3],isl[2],b8,b9],idx={};reg.forEach((g,k)=>{idx[g]=k;});
  const adj=reg.map((g,k)=>k>7?[]:reg.slice(0,8).map((o,j)=>R[g].adj.has(o)?j:-1).filter(j=>j>=0));adj[1].push(8);adj[8]=[1];adj[4].push(9);adj[7].push(9);adj[9]=[4,7];
  let x0=1e9,y0=1e9,x1=-1,y1=-1;for(const g of reg)for(const u of R[g].runs){if(u[0]<y0)y0=u[0];if(u[0]>y1)y1=u[0];if(u[1]<x0)x0=u[1];if(u[2]>x1)x1=u[2];}
  x0=Math.max(0,Math.min(x0,N.x-9)-4);y0=Math.max(0,Math.min(y0,N.y-9)-4);x1=Math.min(WW-1,Math.max(x1,N.x+9)+4);y1=Math.min(WH-1,Math.max(y1,N.y+9)+4);
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

// 惑星を切り替える。地形・国境・海域を作り直し、領土は元の持ち主に戻す
function setPlanet(k,fresh){k=PLN[k]?k:0;if(!WORLD||WORLD.pl!==k){PLC=k;PLANET=PLN[k].n;WORLD=null;genWorld();NMASK.length=0;if(typeof ui!=='undefined'&&ui){ui.wsel=null;ui.mv=null;ui.mvv=null;}return true;}
  if(fresh){for(let p=0;p<WORLD.P.length;p++)WORLD.pown[p]=WORLD.P[p].nat;WORLD.ver++;NMASK.length=0;}return false;}
