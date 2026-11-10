/* ================= 地上戦(ターン制) ================= */
// 9×11マスの島。地形：0海 1砂浜 2平地 3森 4丘 5市街
const GW=9,GH=11,GN=GW*GH,GTN=['海','砂浜','平地','森','丘','市街'],GTD=[0,-.1,0,.25,.35,.4],GTC=['#0a2236','#b9a877','#3f6c49','#28503a','#6f6c58','#5d6470'];
const SUPN={gun:'艦砲射撃',air:'爆撃',msl:'ミサイル攻撃'};
let G=null;
function rng32(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function gnb(i){const x=i%GW,a=[];if(x>0)a.push(i-1);if(x<GW-1)a.push(i+1);if(i>=GW)a.push(i-GW);if(i<GN-GW)a.push(i+GW);return a;}
const gd2=(a,b)=>Math.abs(a%GW-b%GW)+Math.abs(Math.floor(a/GW)-Math.floor(b/GW));
// 島の地形は島ごとの種から決まる。同じ島はいつも同じ形
function genIsland(seed){const r=rng32(seed),t=new Array(GN).fill(0),c0=5*GW+4;
  const ax=3.2+r()*.5,ay=4.3+r()*.5,ph=r()*6.28,p1=r()*6.28,p2=r()*6.28,p3=r()*6.28;
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const dx=(x-4)/ax,dy=(y-5)/ay,a=Math.atan2(dy,dx);
    if(dx*dx+dy*dy+Math.sin(a*3+ph)*.14+Math.sin(a*5+ph*1.7)*.08<1){const h=Math.sin(x*.9+p1)+Math.sin(y*.8+p2)+Math.sin((x+y)*.6+p3)+(r()-.5)*.8;t[y*GW+x]=h>1.15?4:h<-.95?3:r()<.1?3:2;}}
  t[c0]=t[c0]||2;const seen=new Set([c0]),q=[c0];while(q.length){const c=q.pop();for(const n of gnb(c))if(t[n]&&!seen.has(n)){seen.add(n);q.push(n);}}
  for(let i=0;i<GN;i++)if(t[i]&&!seen.has(i))t[i]=0;
  const land=[];for(let i=0;i<GN;i++)if(t[i])land.push(i);
  const isCoast=i=>{const x=i%GW,y=Math.floor(i/GW);return x===0||y===0||x===GW-1||y===GH-1||gnb(i).some(n=>!t[n]);},coast=land.filter(isCoast),inner=land.filter(i=>!isCoast(i)),used=new Set(),fac={};
  const put=(k,cands,score)=>{let best=-1,bs=-1e9;for(const i of cands){if(used.has(i))continue;const s=score(i)+r()*.5;if(s>bs){bs=s;best=i;}}
    if(best<0)for(const i of land)if(!used.has(i)){best=i;break;}used.add(best);fac[best]=k;return best;};
  const hq=put('hq',inner.length?inner:land,i=>-gd2(i,c0));t[hq]=2;
  t[put('town',inner.length>2?inner:land,i=>-Math.abs(gd2(i,hq)-1.2))]=5;
  t[put('port',coast,i=>gd2(i,hq)*.3+r())]=2;
  t[put('air',land,i=>(t[i]===2?2:0)+Math.min(3,gd2(i,hq))-(isCoast(i)?1:0))]=2;
  put('radar',land,i=>(t[i]===4?3:0)+Math.min(4,gd2(i,hq))*.6);
  t[put('depot',land,i=>-Math.abs(gd2(i,hq)-2)-(isCoast(i)?1:0))]=2;
  const beach=[];for(const i of coast){if(used.has(i)||t[i]===4)continue;if(r()<.55){t[i]=1;beach.push(i);}}
  for(const i of coast){if(beach.length>=6)break;if(!used.has(i)&&t[i]!==1){t[i]=1;beach.push(i);}}
  return{t,fac,beach,hq};}

/* ---------- 部隊と盤面 ---------- */
const gi=u=>u.y*GW+u.x;
const gAt=i=>G.u.find(u=>u.on&&u.hp>0&&u.y*GW+u.x===i);
const gman=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const galive=side=>G.u.filter(u=>u.side===side&&u.on&&u.hp>0);
const gq=u=>u.side==='P'?(.8+.4*u.tr/100)*(1+G.M.gndPow):1+.05*G.eT;
const gcost=(type,i)=>{const t=G.t[i];return !t?99:t===3||t===4?(type==='arm'?3:2):1;};
function gmk(side,type,hp,o){return Object.assign({id:++G.uid,x:0,y:0,on:false,moved:false,acted:false,done:false,dug:0,sup:0,spot:0,tr:60,name:(side==='E'?'敵 ':'')+GT[type].n},o||{},{side,type,hp});}
function glog(msg,c){G.log.unshift({t:G.turn,msg,c:c||''});if(G.log.length>60)G.log.pop();}
function gfx(u,d){G.fx.push({i:gi(u),d,t:performance.now()});if(!ui.gfast)setTimeout(()=>{if(G)gdraw();},1000);}
function gkill(u){u.hp=0;G.lost[u.side]++;if(G.sel===u.id)G.sel=null;if(G.info===u.id)G.info=null;}
// 移動できるマス。敵に隣接したマスに入ると、そこで止まる
function greach(u){const s=gi(u),mv=GT[u.type].mv,best=new Map([[s,0]]),q=[s];
  while(q.length){q.sort((a,b)=>best.get(a)-best.get(b));const c=q.shift(),cc=best.get(c);
    if(c!==s&&gnb(c).some(n=>{const o=gAt(n);return o&&o.side!==u.side;}))continue;
    for(const n of gnb(c)){const o=gAt(n);if(o&&o.side!==u.side)continue;const nc=cc+gcost(u.type,n);if(nc>mv||(best.has(n)&&best.get(n)<=nc))continue;best.set(n,nc);q.push(n);}}
  for(const k of[...best.keys()])if(k!==s&&gAt(k))best.delete(k);
  return best;}
// 目標マスまでの道のり(部隊は無視)
function gdmap(goal,type){const d=new Array(GN).fill(999),q=[goal];d[goal]=0;
  while(q.length){q.sort((a,b)=>d[a]-d[b]);const c=q.shift();for(const n of gnb(c)){if(!G.t[n])continue;const nc=d[c]+gcost(type,n);if(nc<d[n]){d[n]=nc;q.push(n);}}}
  return d;}
function gvis(){const v=new Uint8Array(GN);if(G.fown[G.fidx.radar]==='P'&&G.fhp.radar>=50){v.fill(1);return G.vis=v;}
  for(const u of galive('P')){const r=G.t[gi(u)]===4?3:2;for(let y=u.y-r;y<=u.y+r;y++)for(let x=u.x-r;x<=u.x+r;x++)if(x>=0&&y>=0&&x<GW&&y<GH&&Math.abs(x-u.x)+Math.abs(y-u.y)<=r)v[y*GW+x]=1;}
  return G.vis=v;}
const gseen=e=>e.side==='P'||!!G.vis[gi(e)]||e.spot>=G.turn;
function gdmg(a,d,counter,flat){const A0=GT[a.type],D0=GT[d.type],ta=G.t[gi(a)],td=G.t[gi(d)],fk=G.fk[gi(d)];
  let atk=A0.atk*(.45+.55*a.hp/10)*gq(a)*(a.sup?.6:1);
  if(a.type==='arm'&&td>=3)atk*=.7;if(a.type==='art'&&gman(a,d)===1)atk*=.4;if(ta===1&&a.type!=='amp')atk*=.8;
  const def=D0.def*gq(d)*(1+GTD[td]+(fk?(fk==='hq'||fk==='town'?.3:.12):0)+(d.dug?.25:0)+(d.side==='E'&&G.mode==='assault'?G.fort*.08:0));
  const v=3.3*atk/def*(counter?.55:1)+(flat?0:R(-.6,.6));return clamp(Math.round(v),counter?0:1,7);}
function gattack(a,d){const dist=gman(a,d),dm=gdmg(a,d,false);d.hp-=dm;a.acted=true;a.done=true;a.spot=G.turn+1;d.spot=Math.max(d.spot,G.turn);
  if(a.type==='art'){d.sup=1;d.dug=0;}gfx(d,dm);let msg=`${a.name} → ${d.name}　−${dm}`;
  if(d.hp<=0){gkill(d);msg+='　壊滅';}
  else if(dist<=GT[d.type].rng&&!(a.type==='art'&&dist>1)){const cm=gdmg(d,a,true);if(cm>0){a.hp-=cm;msg+=`／反撃 −${cm}`;if(a.hp<=0){gkill(a);msg+='　壊滅';}}}
  glog(msg,a.side==='P'?'b':'r');}

/* ---------- 開始 ---------- */
function gput(side,x,i,mob){const u=gmk(side,x.type,x.hp,x);u.x=i%GW;u.y=Math.floor(i/GW);u.on=true;u.dug=1;u.mob=!!mob;G.u.push(u);return u;}
// 守る側の初期配置：歩兵は司令部と施設に、特科・高射・地対艦は司令部の近くに置く
function gplaceDef(side,list){const order=['hq','town','air','port','radar','depot'].map(k=>G.fidx[k]),isSup=x=>x.type==='art'||x.type==='aa'||x.type==='ssm';
  const line=list.filter(x=>!isSup(x)).sort((a,b)=>GT[b.type].def*b.hp-GT[a.type].def*a.hp),sup=list.filter(isSup);if(!line.length&&sup.length)line.push(sup.shift());
  const near=()=>{let best=-1,bd=1e9;for(let i=0;i<GN;i++){if(!G.t[i]||gAt(i))continue;const d=gd2(i,G.hq)+(G.t[i]===1?2:0)-GTD[G.t[i]]+(G.fk[i]?-.3:0);if(d<bd){bd=d;best=i;}}return best;};
  line.forEach((x,k)=>{const i=k<order.length&&!gAt(order[k])?order[k]:near();if(i>=0)gput(side,x,i,side==='E'&&(x.type==='arm'||(k>0&&x.type==='amp')||k>=3));});
  for(const x of sup){const i=near();if(i>=0)gput(side,x,i,false);}}
function startGround(mode,z){const drill=mode==='drill';if(drill)mode='assault';if(G||B)return;_M=null;
  const il=drill?{seed:RI(1,999999999),fac:{hq:100,air:100,port:100,radar:100,depot:100,town:100},egar:[{t:'inf',hp:10},{t:'inf',hp:8},{t:'art',hp:8},{t:'aa',hp:7}],fort:1}:S.isl[z],map=genIsland(il.seed),gp=S.gpend;
  G={mode,z,drill,M:mods(),eT:eTech(),turn:1,max:mode==='assault'?16:10,t:map.t,fk:map.fac,fidx:{},fown:{},fhp:Object.assign({},il.fac),beach:map.beach,hq:map.hq,u:[],uid:0,sel:null,info:null,act:null,reach:null,atk:null,
    wait:[],ewait:[],landN:0,wave:1,ewave:2,L:gp?gp.L:2,lz:null,fort:il.fort||0,sup:{gun:0,air:0,msl:0},used:{},ships:[],log:[],over:null,busy:false,fx:[],vis:null,iname:drill?'演習島':ISL[z],coll:0,lost:{P:0,E:0},cd:null,g:null,ts:30,ox:0,oy:0,cw:300,ch:300,dpr:1};
  for(const i in map.fac){G.fidx[map.fac[i]]=+i;G.fown[i]=mode==='assault'?'E':'P';}
  // 海からの距離(艦砲の届く範囲)
  const cd=new Array(GN).fill(99),q=[];for(let i=0;i<GN;i++)if(!G.t[i]){cd[i]=0;q.push(i);}for(let i=0;i<GN;i++){const x=i%GW,y=Math.floor(i/GW);if(G.t[i]&&(x===0||y===0||x===GW-1||y===GH-1)){cd[i]=1;q.push(i);}}
  while(q.length){const c=q.shift();for(const n of gnb(c))if(cd[n]>cd[c]+1){cd[n]=cd[c]+1;q.push(n);}}G.cd=cd;
  const ships=drill?[]:fightIn(z);G.ships=ships.map(u=>u.id);
  if(drill)G.sup={gun:2,air:1,msl:1};
  else G.sup={gun:Math.min(3,ships.filter(u=>PT[u.type].cat==='ship'&&PT[u.type].val>=30&&u.hp>30).length),air:Math.min(2,Math.floor(ships.reduce((a,u)=>a+(PT[u.type].fcap?u.ftr:0),0)/4)),msl:Math.min(2,Math.floor(ships.reduce((a,u)=>a+(u.load.asm||0),0)/4))};
  if(mode==='assault'){
    const emb=drill?[['amp',72],['amp',68],['inf',66],['art',64]].map((a,i)=>({id:-1-i,type:a[0],name:'演習 '+GT[a[0]].n,hp:10,tr:a[1]})):S.fleets.filter(f=>f.zone===z).reduce((a,f)=>a.concat(fleetLoad(f)),[]);
    for(const g of emb){const u=gmk('P',g.type,g.hp,{ref:g.id,name:g.name,tr:g.tr});G.u.push(u);G.wait.push(u);}
    G.wave=drill?2:Math.max(2,inZone(z).reduce((a,u)=>a+Math.ceil((PT[u.type].tcap||0)/2),0));
    gplaceDef('E',il.egar.filter(e=>e.hp>0).map(e=>({type:e.t,hp:e.hp})));
  }else{
    gplaceDef('P',garrison(z).map(g=>({type:g.type,hp:g.hp,ref:g.id,name:g.name,tr:g.tr})));
    G.ewait=gp.force.map(e=>({type:e.t,hp:e.hp}));G.ewave=gp.L>=2.6?3:2;if(G.fhp.air>=50)G.sup.air=Math.min(3,G.sup.air+1);
    gvis();genemyLand();}
  glog(mode==='assault'?`${G.iname}への上陸作戦を開始。司令部を制圧せよ`:`${G.iname}に敵が上陸。司令部を守り抜け`,'b');
  if(mode==='assault')glog(`1ターンに揚げられるのは${G.wave}個部隊。水陸機動連隊は上陸した番から動ける`,'');
  $('#hq').hidden=true;$('#gb').hidden=false;gfit();gvis();grefresh();gban(mode==='assault'?'上陸作戦　開始':'敵　上陸',mode==='assault'?'':'r');}

/* ---------- 上陸・支援・施設 ---------- */
function glandOK(){const s=new Set(G.beach.filter(i=>!gAt(i))),p=G.fidx.port;if(G.fown[p]==='P'&&!gAt(p))s.add(p);return s;}
function gland(u,i){const ssm=galive('E').find(x=>x.type==='ssm');G.act=null;G.landN++;G.wait=G.wait.filter(x=>x!==u);
  if(ssm&&Math.random()<.3){const d=RI(1,3);u.hp-=d;ssm.spot=G.turn+1;glog(`敵の地対艦ミサイルが揚陸艇を襲った　${u.name} −${d}`,'r');if(u.hp<=0){gkill(u);glog(`${u.name}は上陸前に壊滅`,'r');if(!gcheck())grefresh();return;}}
  u.x=i%GW;u.y=Math.floor(i/GW);u.on=true;u.moved=false;u.done=u.type!=='amp';glog(`${u.name}が上陸`,'b');gvis();G.sel=u.done?null:u.id;G.info=null;gselCalc();grefresh();}
function genemyLand(){if(!G.ewait.length)return;const dm=gdmap(G.hq,'inf');
  if(G.lz==null){const bs=G.beach.filter(i=>!gAt(i));if(!bs.length)return;G.lz=bs.map(i=>[i,dm[i]+R(0,3)]).sort((a,b)=>a[1]-b[1])[0][0];}
  let n=0;while(n<G.ewave&&G.ewait.length){const bs=G.beach.filter(i=>!gAt(i)).sort((a,b)=>gd2(a,G.lz)-gd2(b,G.lz));if(!bs.length)break;const x=G.ewait.shift(),ssm=galive('P').find(u=>u.type==='ssm');
    if(ssm&&Math.random()<.35){x.hp-=RI(2,4);glog(`${ssm.name}が接岸前の揚陸艇を叩いた`,'g');if(x.hp<=0){G.lost.E++;glog('敵の1個部隊が上陸前に壊滅','g');continue;}}
    const u=gmk('E',x.type,x.hp,{});u.x=bs[0]%GW;u.y=Math.floor(bs[0]/GW);u.on=true;u.spot=G.turn+1;G.u.push(u);n++;}
  if(n){glog(`敵 ${n}個部隊が砂浜に上陸`,'r');if(G.turn>1)gban('敵の後続が上陸','r');}}
function gtargets(k){const s=new Set();for(const e of galive('E'))if(gseen(e)&&(k!=='gun'||G.cd[gi(e)]<=3))s.add(gi(e));if(k==='msl')for(const i in G.fk)if(G.fown[i]==='E')s.add(+i);return s;}
function gstrike(kind,i){const o=gAt(i),en=o&&o.side==='E'?o:null,k=G.fk[i],nm=SUPN[kind];G.sup[kind]--;G.used.any=1;G.act=null;
  if(kind==='air'){const aa=galive('E').find(u=>u.type==='aa');if(aa&&Math.random()<.4){aa.spot=G.turn+1;let lost='';
      if(!G.drill){const cv=G.ships.map(U).find(u=>u&&PT[u.type].fcap&&u.ftr>0);if(cv){cv.ftr--;lost='。戦闘機1機を喪失';}}glog(`爆撃は対空砲火に阻まれた${lost}`,'r');return grefresh();}}
  let d=kind==='gun'?RI(1,2):kind==='air'?RI(2,4):RI(3,4);
  if(en){en.hp-=d;en.dug=0;en.sup=1;en.spot=G.turn+1;gfx(en,d);glog(`${nm} → ${en.name}　−${d}${en.hp<=0?'　壊滅':''}`,'b');if(en.hp<=0)gkill(en);}
  else glog(`${nm}：着弾地点に敵はいなかった`,'');
  if(kind==='gun')for(const n of gnb(i)){const x=gAt(n);if(x&&x.side==='E'){x.hp-=1;x.dug=0;gfx(x,1);if(x.hp<=0){gkill(x);glog(`${x.name}　壊滅`,'b');}}}
  if(k){G.fhp[k]=Math.max(0,G.fhp[k]-(kind==='gun'?15:kind==='air'?25:20));if(k==='town'){G.coll++;glog('市街地に被害が出た','am');}}
  if(!G.drill){
    if(kind==='gun'&&galive('E').some(u=>u.type==='art'||u.type==='ssm')&&Math.random()<.2){const s=pick(G.ships.map(U).filter(u=>u&&PT[u.type].cat==='ship'));if(s){const dd=RI(5,12);s.hp=Math.max(5,s.hp-dd);glog(`${s.name}が陸上からの反撃で損傷(船体 −${dd}%)`,'r');}}
    if(kind==='msl'){let need=4;for(const id of G.ships){const s=U(id);if(!s)continue;const n=Math.min(need,s.load.asm||0);if(n){s.load.asm-=n;need-=n;}if(!need)break;}}}
  gvis();if(!gcheck())grefresh();}
function gcapture(side,k){if(k==='hq')return;
  if(k==='port'){if(side==='P'&&G.mode==='assault'){G.wave++;glog('港湾を使えるようになった。1ターンに揚げられる部隊が増え、港にも直接揚げられる','g');}else if(side==='E'&&G.mode==='defend'&&!G.portB){G.portB=1;G.ewait.push({type:'inf',hp:8});glog('敵は港湾から増援を揚げようとしている','r');}}
  else if(k==='radar'&&side==='P')glog('レーダーサイトを押さえた。島の全域が見える','g');
  else if(k==='air')glog(side==='P'?'飛行場を押さえた。敵の爆撃が止まる':'飛行場を奪われた。敵の爆撃が始まる','');
  else if(k==='depot')glog(side==='P'?'補給処を押さえた。近くの部隊が毎ターン回復する':'補給処を奪われた','');}
// 動かず撃たなかった部隊は陣地を固める。施設の上で番を終えると制圧する
// 司令部だけは、乗り込んだあと相手の番を持ちこたえて初めて落ちる
function gendSide(side){for(const u of galive(side)){if(!u.moved&&!u.acted)u.dug=1;u.sup=0;u.moved=u.acted=u.done=false;u.ox=null;const i=gi(u),k=G.fk[i];if(i!==G.hq)u.hold=0;
    if(!k||G.fown[i]===side)continue;
    if(k==='hq'&&!u.hold){u.hold=1;glog(side==='P'?`${u.name}が司令部に突入。次の番まで持ちこたえれば制圧できる`:'敵が司令部に突入した。次の番で排除しなければ島は落ちる',side==='P'?'g':'r');if(side==='E')gban('司令部に敵　この番で排除せよ','r');continue;}
    G.fown[i]=side;glog(`${side==='P'?u.name+'が':'敵が'}${FAC[k][0]}を${side==='P'?'制圧':'奪取'}`,side==='P'?'g':'r');gcapture(side,k);}}
function gheal(side){const d=G.fidx.depot;if(G.fown[d]!==side||G.fhp.depot<50)return;for(const u of galive(side))if(u.hp<10&&gd2(gi(u),d)<=2)u.hp++;}
function gcheck(){if(!G)return true;if(G.over)return true;const as=G.mode==='assault',Pon=galive('P'),Eon=galive('E');
  if(G.fown[G.hq]!==(as?'E':'P')){gfinish(as?'win':'lose','hq');return true;}
  if(as){if(!Eon.length){gfinish('win','kill');return true;}if(!Pon.length&&!G.wait.length){gfinish('lose','kill');return true;}if(G.turn>G.max){gfinish('lose','time');return true;}}
  else{if(!Pon.length){gfinish('lose','kill');return true;}if(!Eon.length&&!G.ewait.length){gfinish('win','kill');return true;}if(G.turn>G.max){gfinish('win','time');return true;}}
  return false;}

/* ---------- 敵の番 ---------- */
function genemySupport(){const P=galive('P');if(!P.length)return;const hit=(nm,d)=>{const t=pick(P);d=Math.max(1,d-(t.dug?1:0));t.hp-=d;t.sup=1;gfx(t,d);glog(`${nm} → ${t.name}　−${d}${t.hp<=0?'　壊滅':''}`,'r');if(t.hp<=0)gkill(t);};
  const air=()=>{if(P.some(u=>u.type==='aa'&&u.hp>0)&&Math.random()<.6)glog('高射特科隊が敵の爆撃を退けた','g');else hit('敵の爆撃',RI(2,3));};
  if(G.mode==='defend'){
    if(G.turn<=3){if(P.some(u=>u.type==='ssm')&&Math.random()<.5)glog('地対艦ミサイル連隊が敵艦を牽制し、艦砲射撃を封じた','g');else hit('敵の艦砲射撃',RI(1,2));}
    if(G.L>=2.4&&G.turn%2===0)air();
  }else if(G.fown[G.fidx.air]==='E'&&G.fhp.air>=50&&G.turn%2===0)air();}
function gaiMove(e,goal,keep){const dm=gdmap(goal,e.type),rc=greach(e),P=galive('P');let bi=gi(e),bs=1e9;
  for(const i of rc.keys()){let s=dm[i]-GTD[G.t[i]]*.6;if(keep){const md=Math.min(...P.map(p=>gd2(i,gi(p))));if(md<2&&i!==gi(e))continue;s=Math.abs(md-3)*2+dm[i]*.1;}if(s<bs-1e-9){bs=s;bi=i;}}
  if(bi!==gi(e)){e.x=bi%GW;e.y=Math.floor(bi/GW);e.moved=true;e.dug=0;}}
function gai(e){const P=galive('P');if(!P.length||e.done)return;const T=GT[e.type],inR=()=>P.filter(p=>p.hp>0&&gman(e,p)<=T.rng),best=ts=>ts.slice().sort((a,b)=>gdmg(e,b,false,1)-gdmg(e,a,false,1)||a.hp-b.hp)[0],near=()=>P.slice().sort((a,b)=>gman(e,a)-gman(e,b))[0];
  if(e.type==='art'){const ts=inR(),hi=ts.find(p=>gi(p)===G.hq&&G.mode==='assault');if(ts.length)return gattack(e,hi||best(ts));if(G.mode==='defend')gaiMove(e,gi(near()),true);return;}
  let ts=inR();
  if(G.mode==='assault'){const intr=P.find(p=>gi(p)===G.hq);
    if(intr){if(gman(e,intr)>T.rng)gaiMove(e,G.hq);ts=inR();if(ts.length)gattack(e,ts.includes(intr)?intr:best(ts));return;}
    if(ts.length)return gattack(e,best(ts));
    if(!gAt(G.hq)&&greach(e).has(G.hq)){e.x=G.hq%GW;e.y=Math.floor(G.hq/GW);e.moved=true;e.dug=0;return;}
    if(e.mob){const t=near();if(gman(e,t)<=5){gaiMove(e,gi(t));ts=inR();if(ts.length)gattack(e,best(ts));}}return;}
  gaiMove(e,G.hq);ts=inR();if(ts.length)gattack(e,best(ts));}
function gEnemyTurn(){genemySupport();gheal('E');if(gcheck())return;
  const P=galive('P'),near=e=>Math.min(99,...P.map(p=>gman(e,p))),q=galive('E').filter(e=>!e.done).sort((a,b)=>(a.type==='art'?-10:0)-(b.type==='art'?-10:0)+near(a)-near(b));
  const next=()=>{if(!G||G.over)return;const e=q.shift();if(!e)return gEnemyEnd();let vis=false;
    if(e.hp>0){gai(e);gvis();vis=gseen(e);if(gcheck())return;if(!ui.gfast&&vis){gdraw();guiText();}}
    if(ui.gfast||!vis)next();else setTimeout(next,320);};
  next();}
function gEnemyEnd(){gendSide('E');if(gcheck())return;if(G.mode==='defend')genemyLand();G.turn++;if(gcheck())return;gheal('P');G.landN=0;G.used={};G.busy=false;gvis();grefresh();
  if(G.turn===G.max)gban(G.mode==='assault'?'最後のターン':'あと1ターン守り抜け','am');}
function gendTurn(){if(!G||G.over||G.busy)return;G.sel=null;G.info=null;G.act=null;G.reach=G.atk=null;gendSide('P');if(gcheck())return;G.busy=true;grefresh();gEnemyTurn();}

/* ---------- 入力 ---------- */
function gselCalc(){const u=G.u.find(x=>x.id===G.sel);G.reach=G.atk=null;if(!u||u.side!=='P'||u.done||!u.on||u.hp<=0)return;
  if(!u.moved)G.reach=greach(u);G.atk=new Set();
  if(!(u.type==='art'&&u.moved))for(const e of galive('E'))if(gseen(e)&&gman(u,e)<=GT[u.type].rng)G.atk.add(gi(e));}
function gtap(i){if(!G||G.over||G.busy)return;const u=gAt(i),s=G.u.find(x=>x.id===G.sel);
  if(G.act){const a=G.act;
    if(a.k==='land'){const w=G.u.find(x=>x.id===a.uid);if(w&&glandOK().has(i))return gland(w,i);}
    else if(gtargets(a.k).has(i))return gstrike(a.k,i);
    G.act=null;return grefresh();}
  if(s&&s.side==='P'&&!s.done&&s.on){
    if(G.atk&&G.atk.has(i)){gattack(s,gAt(i));G.sel=null;G.reach=G.atk=null;gvis();if(!gcheck())grefresh();return;}
    if(G.reach&&G.reach.has(i)&&i!==gi(s)&&!u){const n0=galive('E').filter(gseen).length;s.ox=s.x;s.oy=s.y;s.odug=s.dug;s.x=i%GW;s.y=Math.floor(i/GW);s.moved=true;s.dug=0;gvis();
      if(galive('E').filter(gseen).length>n0)s.ox=null;gselCalc();return grefresh();}}
  if(u&&u.side==='P'){G.sel=u.id;G.info=null;gselCalc();}
  else if(u&&gseen(u)){G.info=u.id;G.sel=null;G.reach=G.atk=null;}
  else{G.sel=null;G.info=null;G.reach=G.atk=null;}
  grefresh();}
function gbtn(a){if(!G||G.over||G.busy)return;const p=a.split(':'),s=G.u.find(x=>x.id===G.sel);
  if(p[0]==='cancel')G.act=null;
  else if(p[0]==='wait'&&s){s.done=true;G.sel=null;G.reach=G.atk=null;}
  else if(p[0]==='undo'&&s&&s.moved&&s.ox!=null&&!s.acted){s.x=s.ox;s.y=s.oy;s.dug=s.odug;s.moved=false;s.ox=null;gvis();gselCalc();}
  else if(p[0]==='land'){if(G.landN>=G.wave)return;G.act={k:'land',uid:+p[1]};G.sel=null;G.reach=G.atk=null;}
  else if(p[0]==='sup'){if(G.sup[p[1]]<=0||G.used.any)return;if(!gtargets(p[1]).size){toast(p[1]==='gun'?'艦砲の届く範囲(海から3マス)に、見えている敵がいない':'見えている敵がいない');return;}G.act={k:p[1]};G.sel=null;G.reach=G.atk=null;}
  grefresh();}

/* ---------- 表示 ---------- */
function gban(msg,c){const el=$('#gban');el.textContent=tx(msg);el.className='ban show '+(c||'');clearTimeout(gban.h);gban.h=setTimeout(()=>{el.className='ban';},2600);}
function gfit(){if(!G)return;const cv=$('#gcv'),r=$('#gmap').getBoundingClientRect();G.dpr=Math.min(2,window.devicePixelRatio||1);G.cw=Math.max(50,r.width);G.ch=Math.max(50,r.height);cv.width=Math.round(G.cw*G.dpr);cv.height=Math.round(G.ch*G.dpr);G.g=cv.getContext('2d');
  G.ts=Math.max(8,Math.floor(Math.min(G.cw/GW,(G.ch-30)/GH)));G.ox=Math.round((G.cw-G.ts*GW)/2);G.oy=Math.max(0,Math.round((G.ch-30-G.ts*GH)/2));}
function gstatHTML(){const s=G.u.find(x=>x.id===G.sel),e=G.u.find(x=>x.id===G.info),as=G.mode==='assault';
  const d=u=>{const i=gi(u),k=G.fk[i],t=GT[u.type];return `<b class="${u.side==='P'?'b':'r'}">${u.name}</b>　戦力 ${u.hp}/10　攻${t.atk} 防${t.def} 移${t.mv}${t.rng>1?' 射'+t.rng:''}<br><span class="mut">${GTN[G.t[i]]}${k?'・'+FAC[k][0]:''}${u.dug?'　陣地あり':''}${u.sup?'　<span class="am">制圧されている</span>':''}${u.side==='P'&&u.done?'　行動済み':''}</span>`;};
  if(G.act)return `<b class="am">${G.act.k==='land'?'上陸する砂浜(黄色)をタップ':SUPN[G.act.k]+'の目標(橙の枠)をタップ'}</b>${G.act.k==='gun'?'<br><span class="mut">艦砲は海から3マスまで届き、隣のマスの敵も巻き込む</span>':G.act.k==='msl'?'<br><span class="mut">敵の施設なら、見えていなくても狙える</span>':''}`;
  if(s&&s.on&&s.hp>0)return d(s)+(s.done?'':`<br><span class="mut">${s.moved?'':'水色のマスへ移動。'}${G.atk&&G.atk.size?'赤い枠の敵をタップで攻撃':s.type==='art'&&s.moved?'特科は動いた番には撃てない':'射程内に見えている敵はいない'}</span>`);
  if(e&&e.on&&e.hp>0)return d(e);
  return `<span class="mut">${as&&!galive('P').length?'下の「上陸」で部隊を選び、砂浜に揚げる。':'自部隊をタップで選択。'}司令部(司)に${as?'乗り込み、敵の番を持ちこたえれば奪還できる':'乗り込まれたら、次の番のうちに排除する'}。</span>`;}
function gactHTML(){if(G.over)return'';if(G.busy)return'<button disabled>敵の行動中</button>';const s=G.u.find(x=>x.id===G.sel);let h='';
  if(G.act)return '<button data-g="cancel">やめる</button>';
  if(s&&s.side==='P'&&!s.done&&s.on){h+=`<button data-g="wait">${s.moved?'ここで待機':'待機(陣地を固める)'}</button>`;if(s.moved&&s.ox!=null)h+='<button data-g="undo">移動を取り消す</button>';}
  if(G.mode==='assault'&&G.wait.length&&G.landN<G.wave)for(const w of G.wait.slice(0,4))h+=`<button data-g="land:${w.id}" class="g">上陸：${w.name.replace(/^演習 /,'')}</button>`;
  for(const k of['gun','air','msl'])if(G.sup[k]>0)h+=`<button data-g="sup:${k}" class="am"${G.used.any?' disabled':''}>${SUPN[k]} 残${G.sup[k]}</button>`;
  return h;}
function guiText(){if(!G)return;const as=G.mode==='assault';
  $('#gturn').textContent=`ターン ${Math.min(G.turn,G.max)}/${G.max}`;const r=$('#gside');r.textContent=tx(`${G.drill?'図上演習':as?'上陸作戦':'島嶼防衛'}　${G.iname}`);r.className='roe '+(as?'auth':'hot');
  $('#gobj').textContent=`目標：${as?'司令部を制圧する':'司令部を守り抜く'}`+(as&&G.wait.length?`　洋上待機 ${G.wait.length}個(このターンあと${Math.max(0,G.wave-G.landN)}個)`:'')+(!as&&G.ewait.length?'　敵の後続あり':'');
  $('#gstat').innerHTML=tx(gstatHTML());$('#gact').innerHTML=tx(gactHTML());$('#gend').disabled=G.busy||!!G.over;
  $('#glog').innerHTML=tx(G.log.slice(0,30).map(l=>`<div class="${l.c}"><span>T${l.t}</span>${l.msg}</div>`).join(''));}
function grefresh(){if(!G)return;guiText();gdraw();}
function gdraw(){const g=G&&G.g;if(!g)return;const ts=G.ts,ox=G.ox,oy=G.oy,now=performance.now();g.setTransform(G.dpr,0,0,G.dpr,0,0);g.fillStyle='#071a2b';g.fillRect(0,0,G.cw,G.ch);
  const land=G.act&&G.act.k==='land'?glandOK():null,tg=G.act&&G.act.k!=='land'?gtargets(G.act.k):null,X=i=>ox+(i%GW)*ts,Y=i=>oy+Math.floor(i/GW)*ts;
  g.textAlign='left';g.textBaseline='top';
  for(let i=0;i<GN;i++){const x=X(i),y=Y(i),t=G.t[i];g.fillStyle=GTC[t];g.fillRect(x,y,ts,ts);if(!t)continue;
    if(t===3){g.fillStyle='#1b3a29';for(const p of[[.3,.62],[.62,.42],[.7,.8]]){g.beginPath();g.moveTo(x+ts*p[0],y+ts*(p[1]-.22));g.lineTo(x+ts*(p[0]+.13),y+ts*p[1]);g.lineTo(x+ts*(p[0]-.13),y+ts*p[1]);g.fill();}}
    else if(t===4){g.strokeStyle='#96917a';g.lineWidth=1.2;g.beginPath();g.arc(x+ts*.5,y+ts*.78,ts*.3,Math.PI*1.1,Math.PI*1.9);g.stroke();g.beginPath();g.arc(x+ts*.5,y+ts*.98,ts*.42,Math.PI*1.15,Math.PI*1.85);g.stroke();}
    else if(t===5){g.fillStyle='#7d8590';for(const p of[[.16,.2],[.6,.24],[.3,.62],[.64,.64]])g.fillRect(x+ts*p[0],y+ts*p[1],ts*.2,ts*.18);}
    g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1;g.strokeRect(x+.5,y+.5,ts-1,ts-1);
    const k=G.fk[i];if(k){const P=G.fown[i]==='P';g.fillStyle=P?'rgba(47,111,174,.4)':'rgba(181,72,63,.4)';g.fillRect(x+1,y+1,ts-2,ts-2);g.strokeStyle=P?'#5fb0ff':'#ff6b5e';g.lineWidth=1.6;g.strokeRect(x+1.5,y+1.5,ts-3,ts-3);}
    if(!G.vis[i]){g.fillStyle='rgba(4,13,22,.5)';g.fillRect(x,y,ts,ts);}
    if(G.reach&&G.reach.has(i)&&!gAt(i)){g.fillStyle='rgba(95,220,255,.34)';g.fillRect(x+2,y+2,ts-4,ts-4);}
    if(land&&land.has(i)){g.fillStyle='rgba(255,224,102,.5)';g.fillRect(x+2,y+2,ts-4,ts-4);g.strokeStyle='#ffe066';g.lineWidth=2;g.strokeRect(x+2,y+2,ts-4,ts-4);}
    if(tg&&tg.has(i)){g.strokeStyle='#ff9d3c';g.lineWidth=3;g.strokeRect(x+3,y+3,ts-6,ts-6);}}
  const m=Math.round(ts*.16),w=ts-m*2;g.textAlign='center';g.textBaseline='middle';
  for(const u of G.u){if(!u.on||u.hp<=0||!gseen(u))continue;const i=gi(u),x=X(i)+m,y=Y(i)+m,P=u.side==='P',sel=G.sel===u.id||G.info===u.id;
    g.fillStyle=P?(u.done?'#2a4660':'#2f6fae'):'#b5483f';g.fillRect(x,y,w,w);g.strokeStyle=sel?'#fff':P?'#9fd0ff':'#ffb3aa';g.lineWidth=sel?2.5:1.2;g.strokeRect(x,y,w,w);
    g.fillStyle=P&&u.done?'#9db2c4':'#fff';g.font=`bold ${Math.round(w*.5)}px sans-serif`;g.fillText(GT[u.type].s,x+w*.42,y+w*.46);
    g.font=`${Math.max(9,Math.round(w*.34))}px sans-serif`;g.fillStyle=u.hp<=3?'#ffd166':'#fff';g.fillText(String(u.hp),x+w*.82,y+w*.8);
    if(u.dug){g.fillStyle='#e8d9a0';g.fillRect(x,y+w-3,w,3);}
    if(u.sup){g.fillStyle='#ff9d3c';g.beginPath();g.arc(x+w*.84,y+w*.18,Math.max(2.5,w*.1),0,6.3);g.fill();}
    if(G.atk&&G.atk.has(i)&&!P){g.strokeStyle='#ff3b30';g.lineWidth=3;g.strokeRect(X(i)+1.5,Y(i)+1.5,ts-3,ts-3);}}
  // 施設の記号は部隊の上に重ねて、乗っていても読めるようにする
  g.textAlign='left';g.textBaseline='top';const fs=Math.max(9,Math.round(ts*.28));g.font=`${fs}px sans-serif`;
  for(const i in G.fk){const x=X(+i),y=Y(+i),P=G.fown[i]==='P';g.fillStyle=P?'rgba(20,58,96,.92)':'rgba(110,34,28,.92)';g.fillRect(x+1,y+1,fs+4,fs+3);g.fillStyle='#fff';g.fillText(FAC[G.fk[i]][1],x+3,y+2);}
  g.textAlign='center';g.textBaseline='middle';
  G.fx=G.fx.filter(f=>now-f.t<950);g.font=`bold ${Math.round(ts*.42)}px sans-serif`;
  for(const f of G.fx){const x=X(f.i)+ts/2,y=Y(f.i)+ts*.2;g.strokeStyle='#000';g.lineWidth=3;g.strokeText('−'+f.d,x,y);g.fillStyle='#ffe066';g.fillText('−'+f.d,x,y);}}

/* ---------- 決着 ---------- */
function gfinish(res,why){if(G.over)return;G.over={res,why};G.busy=false;const win=res==='win',as=G.mode==='assault',z=G.z,pl=G.u.filter(u=>u.side==='P'),L=[];let dS=0,dT=0;
  const lostP=pl.filter(u=>u.hp<=0).length,lostE=G.lost.E,surv=G.u.filter(u=>u.side==='E'&&u.hp>0).map(u=>({t:u.type,hp:u.hp})).concat(G.ewait.map(e=>({t:e.type,hp:e.hp})));
  if(!G.drill){
    for(const u of pl){const g=S.gnd.find(x=>x.id===u.ref);if(!g)continue;if(u.hp<=0){S.gnd=S.gnd.filter(x=>x!==g);S.enl.gnd.n=Math.max(0,S.enl.gnd.n-RI(40,90));continue;}
      g.hp=as&&!win&&u.on?Math.max(1,u.hp-1):u.hp;g.tr=Math.min(100,g.tr+(u.on?6:1));if(as&&win)g.loc='i'+z;}
    const il=S.isl[z];for(const k in G.fhp)il.fac[k]=G.fhp[k];
    if(as){if(win){liberate(z);S.stats.wins++;dS=8;dT=2;L.push(`${ISL[z]}を奪還した。上陸部隊はそのまま守備隊になる`);}
      else{il.egar=surv.length?surv:[{t:'inf',hp:1}];S.stats.loss++;dS=-4;dT=1;L.push(why==='time'?'攻めきれず、上陸部隊は艦へ引き揚げた':why==='retreat'?'上陸部隊は艦へ引き揚げた':'上陸部隊は壊滅した');hlog(`${ISL[z]}：上陸作戦は失敗`,'r');}}
    else{S.gpend=null;
      if(win){S.stats.wins++;dS=6;dT=-1;S.sectors[z].threat=Math.max(5,S.sectors[z].threat-15);L.push(`守備隊が${ISL[z]}を守り抜いた`);hlog(`${ISL[z]}：守備隊が上陸した敵を撃退`,'g');}
      else{S.stats.loss++;occupy(z,G.L,surv);dS=-6;dT=3;L.push(why==='hq'?'司令部を奪われ、島は敵の手に落ちた':'守備隊は壊滅し、島は敵の手に落ちた');}}
    if(G.coll){dS-=Math.min(3,G.coll);L.push('市街地への被害が批判を呼んだ');}
    polApply(dS,dT);S.pers.morale=clamp(S.pers.morale+(win?3:-4),5,100);_M=null;checkOver();save();}
  guiText();gdraw();
  const ttl=G.drill?'図上演習　終了':win?(as?'奪還成功':'防衛成功'):as?'作戦失敗':'陥落';
  modal(`<div class="alert ${win?'g':'r'}">${ttl}</div><h2>${win?(as?(why==='hq'?'司令部を制圧し、島を取り戻した':'敵の守備隊を一掃し、島を取り戻した'):'上陸した敵を退けた'):as?(why==='retreat'?'上陸部隊を引き揚げた':why==='time'?'攻勢は限界に達した':'上陸部隊を失った'):'島を失った'}</h2>
  <dl class="kv2"><dt>ターン</dt><dd>${Math.min(G.turn,G.max)}</dd><dt>敵の損害</dt><dd>壊滅 ${lostE}個部隊</dd><dt>我が損害</dt><dd>壊滅 ${lostP}個部隊</dd></dl>${G.drill?'<p class="sm mut">演習の結果は部隊や情勢に影響しない。</p>':L.map(l=>`<p class="sm">${l}。</p>`).join('')+`<div class="pol">支持率 ${sg(dS)}　緊張度 ${sg(dT)}</div>`}
  <div class="mbtn"><button class="btn pri" data-m="ok">司令部へ戻る</button></div>`,{ok:()=>{closeModal();G=null;$('#gb').hidden=true;$('#hq').hidden=false;render();if(S.over)showOver();}});}
function ginit(){
  $('#gcv').addEventListener('click',e=>{if(!G)return;const r=$('#gcv').getBoundingClientRect(),x=Math.floor((e.clientX-r.left-G.ox)/G.ts),y=Math.floor((e.clientY-r.top-G.oy)/G.ts);if(x<0||y<0||x>=GW||y>=GH)return;gtap(y*GW+x);});
  $('#gact').addEventListener('click',e=>{const b=e.target.closest('button[data-g]');if(b&&!b.disabled)gbtn(b.dataset.g);});
  $('#gend').addEventListener('click',()=>{if(!G||G.over||G.busy)return;
    if(G.mode==='assault'&&G.wait.length&&G.landN<G.wave&&glandOK().size)confirmM('まだ上陸させられる部隊がある。このままターンを終える。',gendTurn,'ターンを終える');else gendTurn();});
  $('#gquit').addEventListener('click',()=>{if(!G||G.over||G.busy)return;confirmM(G.drill?'演習を打ち切る。':G.mode==='assault'?'上陸部隊を艦へ引き揚げる。作戦は失敗として扱われるが、与えた損害は残る。':'島を放棄する。守備隊は失われ、島は占領される。',()=>gfinish('lose','retreat'),G.mode==='assault'||G.drill?'引き揚げる':'放棄する');});
  window.addEventListener('resize',()=>{if(G){gfit();gdraw();}});}
ginit();
