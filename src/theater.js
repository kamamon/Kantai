/* ================= 広域作戦：海域・艦隊・島・陸上部隊 ================= */
// 海域の短い呼び名。海の名は国ごとに applyNation が入れ替える
const ZS=['本土','','','','','','','','敵北方','敵南方'];
const EBASE={1:8,4:9,7:9};
for(const k of GTK)SHOPX['g_'+k]={kind:'gnd',n:GT[k].n,cost:GT[k].cost,build:GT[k].build,q:1,d:GT[k].d};
// 敵の泊地を通らない最短経路
function zpath(a,b){if(a===b)return[a];const prev={},q=[a];prev[a]=-1;
  while(q.length){const c=q.shift();for(const n of ADJ[c]){if(prev[n]!=null||ZONES[n].enemy)continue;prev[n]=c;
    if(n===b){const p=[b];let x=b;while(prev[x]!==-1){x=prev[x];p.unshift(x);}return p;}q.push(n);}}
  return null;}
const HOP=ZONES.map((_,a)=>ZONES.map((_,b)=>{const p=zpath(a,b);return p?p.length-1:99;}));
const FL=id=>S.fleets.find(f=>f.id===id)||null;
const flUnits=f=>S.units.filter(u=>u.fl===f.id);
// 艦の所在は艦隊で決まる。演習・整備中は母港、合流中はどこにもいない(-1)
function syncSectors(){for(const u of S.units){const f=u.fl?FL(u.fl):null;if(u.fl&&!f)u.fl=0;u.sector=u.tz>0?-1:f&&u.mode==='normal'?f.zone:0;}}
const inZone=z=>S.units.filter(u=>u.sector===z&&u.mode==='normal');
const fightIn=z=>inZone(z).filter(u=>!PT[u.type].tcap);
const fleetCap=f=>flUnits(f).reduce((a,u)=>a+(u.mode==='normal'&&!(u.tz>0)?PT[u.type].tcap||0:0),0);
const fleetLoad=f=>S.gnd.filter(g=>g.loc==='f'+f.id);
const garrison=z=>S.gnd.filter(g=>g.loc==='i'+z);
const facOK=(z,k)=>!!S.isl[z]&&S.sectors[z].held&&S.isl[z].fac[k]>=50;
const seaCtrl=z=>!S.isl[z].cover&&fleetPower(fightIn(z))>=60;
function forcePower(f,eT){let ep=0;for(const k in f)ep+=ET[k].val*f[k]*(1+.06*(eT||0));return ep;}
// 増援：隣の海域(near)と2つ先の海域(far)にいる戦闘艦
function reserve(z){const near=[],far=[];for(const u of S.units){if(u.mode!=='normal'||u.sector<0||u.sector===z||PT[u.type].val<10||PT[u.type].tcap)continue;const h=HOP[u.sector][z];if(h===1)near.push(u);else if(h===2)far.push(u);}
  return{near,far,all:near.concat(far)};}
function upkeep(){return S.units.reduce((a,u)=>a+PT[u.type].up*(1+u.mods.length*.03)+(u.mode==='drill'?8:0)+(u.ftr||0)*2+(u.aew||0)*3,0)*(1-clamp(mods().upk,-.3,.4))+S.pool.ftr+S.pool.aew+S.gnd.reduce((a,g)=>a+GT[g.type].up,0)+(S.air||[]).reduce((a,x)=>a+AT[x.type].up*(.5+.5*x.n/AT[x.type].ac),0);}
function reqRates(){const r={},k=crewK();for(const x of RATE)r[x[0]]=0;
  for(const u of S.units){const t=PT[u.type],q=t.cat==='sub'?RQ.sub:t.fcap?RQ.cv:RQ.ship;for(const a in q)r[a]+=t.crew*k*q[a];const ac=(u.ftr||0)+(u.aew||0);r.avm+=ac*9;r.avo+=ac*3;}
  r.avm+=(S.pool.ftr+S.pool.aew)*5;for(const a of S.air||[]){r.avm+=a.n*6;r.avo+=a.n*2;}r.gnd=S.gnd.length*120;for(const a in r)r[a]=Math.round(r[a]+(a==='sup'||a==='med'||a==='com'?40:12));return r;}

function addUnit(type,o){o=o||{};const free=(NAMES[type]||[]).filter(n=>!S.used.includes(n)),name=free.length?free[0]:PT[type].s+'-'+String(++S.seq).padStart(2,'0');S.used.push(name);
  const u={id:++S.uid,type,name,sector:0,fl:0,tz:0,mode:'normal',tr:o.tr==null?RI(58,72):o.tr,rd:o.rd==null?RI(80,92):o.rd,hp:100,ftr:0,aew:0,mods:[],refit:null,load:{}};
  S.units.push(u);_M=null;const c=cap(u);for(const k in c)u.load[k]=c[k];return u;}
function addGnd(type,loc,o){o=o||{};S.gseq[type]=(S.gseq[type]||0)+1;
  const g={id:++S.gid,type,name:`第${S.gseq[type]}${GT[type].n}`,hp:10,tr:o.tr==null?RI(55,70):o.tr,loc:loc||'home'};S.gnd.push(g);_M=null;return g;}
const mkIsl=()=>({seed:RI(1,999999999),fac:{hq:100,air:100,port:100,radar:100,depot:100,town:100},egar:[],fort:0,cover:0,blk:0,prep:{}});
function autoFleets(){const mkF=(n,zone,role)=>{const f={id:++S.fid,n,zone,dest:null,role};S.fleets.push(f);return f;};
  const cb=S.units.filter(u=>{const t=PT[u.type];return t.cat==='ship'&&!t.tcap&&!t.sup&&t.val>=30;}),cv=cb.filter(u=>PT[u.type].fcap),es=cb.filter(u=>!PT[u.type].fcap).sort((a,b)=>PT[b.type].val-PT[a.type].val);
  const n=cb.length?clamp(Math.max(cv.length,es.length>=9?3:es.length>=4?2:1),1,Math.max(1,Math.min(3,Math.floor(cb.length/2)))):0,fs=[];
  const posts=[7,4,1];for(let i=0;i<n;i++)fs.push(mkF(flName(0,i+1),posts[i],'cf'));
  cv.forEach((u,i)=>{u.fl=fs[i%n].id;});es.forEach((u,i)=>{u.fl=fs[(i+cv.length)%n].id;});
  const ss=S.units.filter(u=>PT[u.type].cat==='sub');if(ss.length){const f=mkF(flName(1),n<3?posts[n]:0,'ss');for(const u of ss)u.fl=f.id;}
  const rest=S.units.filter(u=>!u.fl);if(rest.length){const f=mkF(flName(2),0,'tr');for(const u of rest)u.fl=f.id;}
  syncSectors();}
function newGame(c){c=c||{};const C=Object.assign({},DEFCFG,c);C.fleet=Object.assign({},DEFCFG.fleet,c.fleet||{});C.gnd=Object.assign({},DEFCFG.gnd,c.gnd||{});C.air=Object.assign({},DEFCFG.air,c.air||{});_M=null;_PM=null;
  // 国を決め、その国の名称群に切り替えてから部隊を作る
  C.nat=NATS[C.nat]?C.nat:0;if(!NATS[C.riv]||C.riv===C.nat)C.riv=NATS[C.nat].rv;applyNation(C.nat,C.riv);if(c.nation==null)C.nation=NAT.f;if(c.fleetName==null)C.fleetName=DSTY[NAT.ds].hq;
  S={v:3,cfg:C,month:0,fy:0,funds:C.funds,budget:C.budget,support:C.support,tension:C.tension,bud:BITEM.map(()=>2),units:[],used:[],seq:0,pool:{ftr:0,aew:0},
    stock:{sam:48,asm:24,aam:32,torp:16},orders:[],debts:[],ledger:[],ext:0,pers:{morale:62,pipe:[],auto:true,pol:'auto',rep:[],sp:0,resv:0,resvEnd:0},off:[],enl:{},
    res:{},labs:[],projs:{},flags:{},unlock:{},kits:{},eqm:eqStart(C.nat,clamp(C.era||4,1,5)),air:[],aid:0,aseq:{},airlog:[],ebase:{},
    sectors:ZONES.map((z,i)=>{const t=i===1?30:i===4?38:i===7?52:z.lane?RI(22,36):0;return{threat:t,held:true,est:t};}),
    fleets:[],fid:0,gnd:[],gid:0,gseq:{},isl:{},efl:[],eid:0,gpend:null,laneL:0,
    log:[],stats:{wins:0,loss:0,eSunk:0,pSunk:0,blood0:0,scr:0,scrMiss:0},uid:0,oid:0,lid:0,pending:null,fore:null,foreK:false,over:null,restM:-1,fyAsk:0,fySupp:0,lastLoss:-99};
  for(const z of ISLZ)S.isl[z]=mkIsl();
  for(const r of RATE)S.enl[r[0]]={n:0,sk:60};
  if(C.techLv)for(const l of LINE){const v=clamp(Math.round(C.techLv+R(-1.5,1.2)),0,10);if(v)S.res[l[0]]={lv:v,prog:0};}
  const f=C.fleet;let ftr=f.ftr||0,aew=f.aew||0;
  for(const k of FLEETK)for(let i=0;i<(f[k]||0);i++){const u=addUnit(k,{tr:clamp(C.tr+RI(-7,7),20,95)});if(PT[k].lock){S.unlock[k]=1;S.flags[k]=1;}
    if(PT[k].fcap){u.ftr=Math.min(ftr,PT[k].fcap);ftr-=u.ftr;u.aew=Math.min(aew,PT[k].acap);aew-=u.aew;}}
  S.pool.ftr=ftr;S.pool.aew=aew;const sc=Math.max(.5,S.units.length/8);for(const k in S.stock)S.stock[k]=Math.round(S.stock[k]*sc);
  // 陸上部隊：守りの部隊は南から順に島へ、機動部隊は本土に置く
  const il=[7,4,1];let ii=0;for(const k of GTK)for(let i=0;i<(C.gnd[k]||0);i++)addGnd(k,k==='amp'||k==='arm'||k==='abn'||k==='ah'?'home':'i'+il[ii++%3],{tr:clamp(C.tr+RI(-7,7),20,95)});
  // 航空部隊：戦闘飛行隊は本土と島に分け、ほかは本土に置く
  polInit();
  {const fb=[0,4,7,1,0,0];let fi=0;for(const k of ATK)for(let i=0;i<(C.air[k]||0);i++)addAir(k,k==='ftr'?fb[fi++%fb.length]:0,{tr:clamp(C.tr+RI(-7,7),20,95)});}
  autoFleets();
  for(let i=0;i<clamp(C.labs,1,8);i++)S.labs.push({id:++S.lid,t:i,lv:1,fund:2,cur:null,auto:true,foc:-1});
  const rq=reqRates();for(const r of RATE)S.enl[r[0]]={n:Math.round(rq[r[0]]*R(.93,.99)),sk:RI(55,68)};
  const N=Math.round(allPosts().length*1.35)+10;RFRAC.forEach((fr,r)=>{for(let i=0;i<Math.max(1,Math.round(N*fr));i++)genOff(r);});
  autoAssign();_M=null;for(const u of S.units){const cp=cap(u);for(const k in cp)u.load[k]=cp[k];}
  hlog(`${esc(C.fleetName)}司令に着任。任期は${C.years}年`,'b');}
function deliver(o,rep){
  if(o.kind==='unit'){const u=addUnit(o.k);rep.push([`就役：${PT[o.k].n}「${u.name}」(母港)`,'g']);}
  else if(o.kind==='gnd'){const g=addGnd(o.k.slice(2));rep.push([`編成完結：${g.name}(本土)`,'g']);}
  else if(o.kind==='airu'){const a=addAir(o.k.slice(2));rep.push([`編成完結：${a.name}(本土基地)`,'g']);}
  else if(o.kind==='air'){S.pool[o.k]+=o.q;rep.push([`納入：${o.n}(予備機へ)`,'g']);}
  else if(o.kind==='ammo'){S.stock[o.k]+=o.q;rep.push([`納入：${o.n}`,'']);}
  else if(o.kind==='lab'){S.labs.push({id:++S.lid,t:o.t,lv:1,fund:2,cur:null,auto:true,foc:-1});rep.push([`新設：${LABT[o.t].n}`,'g']);}}

/* ---------- 島の占領と奪還 ---------- */
function mkEgar(L,add){if(add)return[{t:'inf',hp:8}];const a=[{t:'inf',hp:10},{t:'inf',hp:10},{t:'amp',hp:9}];if(L>=2)a.push({t:'art',hp:9});if(L>=2.4)a.push({t:'aa',hp:9});if(L>=2.8)a.push({t:'ssm',hp:9});return a;}
function mkAssault(L,fr){const n=clamp(Math.round((1.6+L*1.1)*(fr||1)),2,7),a=[];for(let i=0;i<n;i++)a.push({t:i===0?'amp':i===3&&L>=2?'arm':i===4&&L>=2.4?'art':i%2?'inf':'amp',hp:10});return a;}
function occupy(z,L,surv){const s=S.sectors[z],il=S.isl[z];s.held=false;s.threat=100;s.est=100;il.egar=(surv||[]).filter(e=>e.hp>0).concat(mkEgar(L,surv&&surv.length)).slice(0,7);
  il.fort=0;il.cover=1;il.blk=0;il.prep={};S.gnd=S.gnd.filter(g=>g.loc!=='i'+z);S.efl=S.efl.filter(e=>e.z!==z);S.lastLoss=S.month;hlog(`${ISL[z]}が占領された`,'r');_M=null;}
function liberate(z){const s=S.sectors[z],il=S.isl[z];s.held=true;s.threat=35;s.est=35;il.egar=[];il.fort=0;il.cover=0;il.blk=0;hlog(`${ISL[z]}を奪還した`,'g');_M=null;}
// 敵の空襲が島の施設と守備隊に及ぶ
function raidIsland(z){const il=S.isl[z];if(!il||!S.sectors[z].held)return'';const gs=garrison(z),aa=gs.some(g=>g.type==='aa'),k=pick(['air','port','radar','depot']);
  il.fac[k]=Math.max(0,il.fac[k]-Math.round((aa?20:45)*(1-clamp(mods().gndAA,-.5,.6)*(aa?1:.3))));if(gs.length&&!aa){const g=pick(gs);g.hp=Math.max(1,g.hp-2);}
  return `${ISL[z]}の${FAC[k][0]}が爆撃を受けた${aa?'(高射特科隊が被害を抑えた)':''}`;}
// 上陸前の準備攻撃(艦砲・空爆・ミサイル)
function prepStrike(z,kind){const il=S.isl[z],us=fightIn(z),L=[],pri=['ssm','aa','art','arm','amp','inf'],tg=()=>il.egar.filter(e=>e.hp>0).sort((a,b)=>pri.indexOf(a.t)-pri.indexOf(b.t));
  il.prep[kind]=S.month;
  if(kind==='gun'){for(const e of il.egar)e.hp-=RI(0,2);il.fort=Math.max(0,il.fort-1);L.push('守備隊の全体に損害を与え、陣地を崩した');for(const u of us)u.rd=Math.max(0,u.rd-2);
    if(il.egar.some(e=>e.hp>0&&(e.t==='art'||e.t==='ssm'))&&Math.random()<.3){const u=pick(us.filter(u=>PT[u.type].cat==='ship'));if(u){const d=RI(6,14);u.hp=Math.max(5,u.hp-d);L.push(`<span class="r">${u.name}が陸上からの反撃で損傷した(船体 −${d}%)</span>`);}}}
  else if(kind==='air'){const cv=us.find(u=>PT[u.type].fcap&&u.ftr>=2),aa=il.egar.some(e=>e.t==='aa'&&e.hp>0),ts=tg();
    if(ts[0])ts[0].hp-=RI(2,4)+(Math.random()<clamp(mods().strk,0,.9)?1:0);if(ts[1])ts[1].hp-=RI(0,2);for(const a of airStrikers(z))a.rdy=Math.max(0,a.rdy-12);L.push(`${ts[0]?GT[ts[0].t].n:'陣地'}を中心に爆撃した`);
    if(aa&&cv&&Math.random()<.35){cv.ftr--;L.push('<span class="r">対空砲火で戦闘機1機を失った</span>');}}
  else{let need=4;for(const u of us){const n=Math.min(need,u.load.asm||0);if(n){u.load.asm-=n;need-=n;}if(!need)break;}const ts=tg();if(ts[0]){ts[0].hp-=RI(3,5);L.push(`${GT[ts[0].t].n}の陣地にミサイルが命中した`);}}
  const dead=il.egar.filter(e=>e.hp<=0);il.egar=il.egar.filter(e=>e.hp>0);if(!il.egar.length&&dead.length){const e=dead.shift();e.hp=1;il.egar.push(e);}
  if(dead.length)L.push(`${dead.map(e=>GT[e.t].n).join('、')}を壊滅させた`);
  const nm={gun:'艦砲射撃',air:'空爆',msl:'ミサイル攻撃'}[kind];S.tension=clamp(S.tension+1,0,100);hlog(`${ISL[z]}：${nm}を実施`,'b');save();render();
  modal(`<div class="alert">準備攻撃</div><h2>${ISL[z]}　${nm}</h2>${L.map(l=>`<p class="sm">${l}。</p>`).join('')}<p class="sm mut">敵の守備隊は残り${il.egar.length}個。陣地は「${FORT[il.fort]}」。</p><div class="pol">緊張度 +1</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();A.prep(z);}});}
const FORT=['未構築','簡易','堅固','要塞化'];
// 決着を待っている地上戦。島への上陸が先で、本土の都市の攻防はそのあとに回る
const gpNext=()=>{if(!S.gpend&&S.lw&&S.lw.bat){S.gpend=S.lw.bat;S.lw.bat=null;}return S.gpend;};

/* ================= 月の進行 ================= */
function nextMonth(){
  if(S.over||mq.length||G)return;if(gpNext()){groundPrompt();return;}if(S.pending){showIncident();return;}
  _M=null;cleanPosts();if(S.pers.auto)autoAssign();
  S.month++;const rep=[],C=S.cfg;let M=mods();
  // 艦隊は1か月に2海域ぶん進む
  for(const f of S.fleets){if(f.dest==null)continue;const p=zpath(f.zone,f.dest);if(!p||p.length<2){f.dest=null;continue;}f.zone=p[Math.min(2,p.length-1)];if(f.zone===f.dest){f.dest=null;rep.push([`${f.n}：${SECT[f.zone]}に到着`,'']);}}
  for(const u of S.units)if(u.tz>0)u.tz--;syncSectors();
  const inc=income(),up=upkeep(),cc=BCAT.map((_,c)=>catCost(c)),debt=debtPay(),tot=up+cc.reduce((a,b)=>a+b,0)+debt;
  if(!C.sandbox)S.funds+=inc-tot;S.debts=S.debts.filter(d=>--d.left>0);
  S.ledger.push({m:S.month,inc,up:Math.round(up),cc:cc.map(Math.round),debt:Math.round(debt),ext:Math.round(S.ext||0),f:Math.round(S.funds)});S.ext=0;if(S.ledger.length>60)S.ledger.shift();
  // 艦
  const aoeIn={},pm=postMap();for(const u of S.units)if(PT[u.type].sup&&u.sector>0&&u.mode==='normal')aoeIn[u.sector]=1;
  for(const u of S.units){const xo=pm[u.id+':xo'],co=pm[u.id+':co'],en=pm[u.id+':en'],crew=PT[u.type].crew>0,ht=(o,t)=>!!o&&o.tr.includes(t);
    const tk=(1+M.trGain)*(crew?1+(xo?(xo.adm-10)*.03:-.15):1)*(ht(co,'drill')||ht(xo,'drill')?1.4:1)*(ht(co,'char')?1.15:1);
    const dk=(1-clamp(M.rdDecay,-.5,.7))*(crew?(en?1-(en.tec-10)*.02-(ht(en,'tech')?.1:0):1.15):1)*(aoeIn[u.sector]?.5:1)*(u.sector>0&&facOK(u.sector,'port')?.6:1);
    if(u.mode==='dock'){const s=1+clamp(M.dockSpd,-.5,1.5);u.rd=Math.min(100,u.rd+35*s);u.hp=Math.min(100,u.hp+34*s);u.tr=Math.max(0,u.tr-1);
      if(u.refit&&--u.refit.left<=0){u.mods.push(u.refit.k);rep.push([`${u.name}：${KIT[u.refit.k].n}の改修を完了`,'g']);u.refit=null;_M=null;}
      if(!u.refit&&u.rd>=100&&u.hp>=100){u.mode='normal';const f=u.fl?FL(u.fl):null;if(f&&f.zone!==0)u.tz=Math.ceil(HOP[0][f.zone]/2);rep.push([`${u.name}：ドックを出た${u.tz>0?'。艦隊へ向かう':''}`,'g']);}}
    else if(u.mode==='drill'){u.tr=Math.min(100,u.tr+4*Math.max(.3,tk));u.rd=Math.max(0,u.rd-4);}
    else if(u.sector!==0){u.rd=Math.max(0,u.rd-5*Math.max(.2,dk));u.tr=Math.min(100,u.tr+.5);}
    else{u.rd=Math.min(100,u.rd+7*Math.max(.2,1+M.rdRec));u.tr=clamp(u.tr+.6*tk-.4,0,100);}}
  syncSectors();
  // 陸上部隊と島の施設
  for(const g of S.gnd){const home=g.loc==='home',z=g.loc[0]==='i'?+g.loc.slice(1):-1;g.tr=clamp(g.tr+(home?1.2:z>=0?.5:0)*(1+M.trGain),0,100);
    if(g.hp<10&&(home||(z>=0&&facOK(z,'depot'))))g.hp=Math.min(10,g.hp+(home&&!S.lw?2:1));}
  for(const z of ISLZ)if(S.sectors[z].held){const fc=S.isl[z].fac;for(const k in fc)fc[k]=Math.min(100,fc[k]+8);}
  monthlyPers(rep,M);monthlyRD(rep,M);M=mods();
  S.orders=S.orders.filter(o=>{if(S.month<o.due)return true;deliver(o,rep);return false;});
  if(reload())rep.push(['弾薬の在庫が足りず、定数割れの艦がある','am']);
  airMonth(rep);polMonth(rep);
  // 情勢
  _M=null;M=mods();const det=fleetPower()/enemyPower();let unc=0,occ=0,lane=0;const pm2=postMap();
  for(const i of ISLZ){const s=S.sectors[i],il=S.isl[i],here=inZone(i),pw=fleetPower(here);
    if(!s.held){occ++;
      if(seaCtrl(i)){let hit=0;for(const e of il.egar)if(e.hp>2){e.hp--;hit++;}if(hit&&!il.blk)rep.push([`${ISL[i]}：海上封鎖で敵守備隊の補給が細っている`,'g']);il.blk=1;}
      else{il.blk=0;if(!il.cover&&Math.random()<(here.length?.25:.7)){il.cover=1;rep.push([`${ISL[i]}：敵艦隊が周辺に戻った`,'am']);}
        if(il.cover){for(const e of il.egar)e.hp=Math.min(10,e.hp+1);il.fort=Math.min(3,il.fort+1);if(il.egar.length<6&&Math.random()<.3)il.egar.push({t:pick(['inf','inf','art','aa','ssm']),hp:8});}}
      continue;}
    const bc=pm2['base:'+i];
    s.threat=clamp(s.threat+R(-7,7)+(S.tension-40)*.06+(pw>=150?-3:here.length?-1:3)+(i===7?.8:0)-M.threatSup-(bc?(bc.cmd-10)*.08:-.3)-(facOK(i,'air')?1:0)-Math.min(1.2,garrison(i).length*.3),5,100);if(s.threat>50&&!here.length)unc++;
    s.est=clamp(s.threat+R(-12,12)*(1-clamp(M.intel,0,.9)),0,100);}
  // シーレーン：緊張が高いほど荒れる。艦隊がいれば抑えられ、隣の海域にいるだけでも少し効く。放置すると通商妨害で収入が減る
  ZONES.forEach((Z,i)=>{if(!Z.lane)return;const s=S.sectors[i],here=inZone(i),pw=fleetPower(here),nb=ADJ[i].some(a=>!ZONES[a].enemy&&inZone(a).length);
    s.threat=clamp(s.threat+(18+S.tension*.55-s.threat)*.15+R(-5,5)-(pw>=120?7:here.length?4:0)-(nb?1.5:0)-M.threatSup,5,100);s.est=clamp(s.threat+R(-12,12)*(1-clamp(M.intel,0,.9)),0,100);if(s.threat>60&&!here.length)lane++;});
  if(lane){const c=Math.round(inc*.01*lane);if(!C.sandbox)S.funds-=c;if(S.laneL++%4===0)rep.push([`シーレーンで通商妨害が続いている(今月の損失 ${c}億円)`,'am']);}else S.laneL=0;
  S.calm=S.tension<=5?(S.calm||0)+1:0;S.tension=clamp(S.tension+.8*C.eAggr+(Math.min(60,28*C.eAggr)-S.tension)*.03+R(-1.5,1.5)-clamp((det-1)*4,-3,2.5)+unc*.8-M.tension,0,100);
  S.support=clamp(S.support+(50-S.support)*.04-occ-lane*.25-(S.funds<-300?2:S.funds<0?1:0)+M.support,0,100);
  // 敵の侵攻部隊：泊地に集結(あと2か月)→出撃(あと1か月)→来襲
  let arrive=null;
  S.efl=S.efl.filter(e=>{if(!S.sectors[e.z].held)return false;e.eta--;
    if(e.eta===1&&fleetPower(inZone(e.z))>forcePower(e.inc.force,e.inc.eT)*1.5&&Math.random()<.35){rep.push([`敵の侵攻部隊は${SECT[e.z]}の我が艦隊を前に引き返した`,'g']);S.tension=clamp(S.tension-2,0,100);return false;}
    if(e.eta<=0){if(!arrive){arrive=e;return false;}e.eta=1;}
    if(!e.known&&Math.random()<clamp(.55+M.foresee+M.intel*.3+(M.satT>0?.15:0),0,.97)){e.known=1;rep.push([`情報：敵の揚陸部隊が出撃した。目標は${ISL[e.z]}、到達まであと${e.eta}か月`,'r']);}
    return true;});
  let fis=null;if(S.month%12===0)fis=fiscal();
  for(const r of rep)hlog(r[0],r[1]);
  checkOver();const offer=!S.over&&!S.peaceAsked&&(S.calm||0)>=12&&S.month>=24;if(offer){S.peaceAsked=true;S.support=clamp(S.support+5,0,100);hlog('両国が海上連絡メカニズムの運用に合意','g');}
  if(!S.over){S.pending=arrive?arrive.inc:S.fore&&S.sectors[S.fore.sector].held?mkIncident(S.fore.sector,S.fore.type):null;S.fore=rollIncident();
    S.foreK=!!S.fore&&Math.random()<clamp(.15+M.foresee+M.intel*.2,0,.9);if(S.fore&&S.foreK)hlog(`情報：来月、${SECT[S.fore.sector]}で${SCN[S.fore.type].n}の兆候`,'am');}
  save();render();
  if(S.over){mq.length=0;$('#modal').hidden=true;showOver();return;}
  if(offer)showPeace();
  if(fis)showFiscal(fis);
  polShow();
  if(S.pending)showIncident();else if(!fis&&!offer&&gpNext())groundPrompt();else if(rep.length&&!fis)toast(rep[0][0]+(rep.length>1?`　ほか${rep.length-1}件`:''));}
function checkOver(){if(S.over)return;const occ=ISLZ.filter(i=>!S.sectors[i].held).length,y=S.cfg.years;
  if(S.support<=0)S.over={k:'fired',t:'更迭',d:'国民と政府の信任を失い、司令の任を解かれた。'};
  else if(lwCapLost())S.over={k:'lost',t:'首都陥落',d:lwOverText()};
  else if(occ>=3)S.over={k:'lost',t:'敗北',d:'すべての島嶼が占領された。'};
  else if(!S.units.length)S.over={k:'lost',t:'艦隊壊滅',d:'指揮すべき艦が残っていない。'};
  else if(S.month>=y*12)S.over={k:'end',t:'任期満了',d:`${y}年の任期を全うした。`};
  if(S.over&&S.edited)S.over.d+='(編集機能を使った記録)';
}
// 島嶼侵攻は即座の事案ではなく、泊地に集結する侵攻部隊として現れる
function rollIncident(){if(S.month<1)return null;
  if(S.air&&S.month>=2&&Math.random()<clamp(.02+S.tension/900,0,.11)*S.cfg.incF){const zs=AIRB.filter(z=>(!z||S.sectors[z].held)&&airCover(z,'ftr').length);if(zs.length)return mkIncident(pick(zs),'scramble');}
  for(const i of ISLZ.slice().sort(()=>Math.random()-.5)){const s=S.sectors[i];if(!s.held||S.efl.some(e=>e.z===i))continue;
    if(Math.random()<clamp((.04+(s.threat/100)*(.15+S.tension/250))*S.cfg.incF,0,.75)){const inc=mkIncident(i);if(inc.type!=='landing')return inc;if(ebDmg(EBASE[i])>R(0,160)){hlog(`敵は${ISL[i]}への侵攻を見送った。泊地の損害が響いている`,'g');return null;}
      const M=mods(),known=Math.random()<clamp(.2+M.foresee+M.intel*.3,0,.9)?1:0;S.efl.push({id:++S.eid,z:i,eta:2,known,inc});
      if(known)hlog(`情報：敵の泊地に揚陸部隊が集結している。目標は${ISL[i]}とみられる`,'r');return null;}}
  return null;}
function settle(o,inc){if(inc.type==='scramble')return airSettle(o,inc);let dS=0,dT=0;const z=inc.sector,sec=ISLZ.includes(z)?S.sectors[z]:null,L=[],pp=S.cfg.prePen*(1-clamp(mods().prePen,-.3,.6));
  dS-=o.pS*4;
  if(o.res==='win'){S.stats.wins++;
    if(o.bloodless){dS+=6;dT-=4;S.stats.blood0++;L.push('一発も撃たずに事態を収めた。国内外の評価は高い');}
    else{dS+=4+Math.min(4,o.eS);dT+=o.eS*1.5-3;}
    if(o.pursuitK){dT+=o.pursuitK*3;dS-=o.pursuitK;L.push('撤退中の敵への追撃が、緊張をさらに高めた');}
    if(inc.type==='retake'&&sec){S.isl[z].cover=0;L.push(`${ISL[z]}周辺の制海を得た。準備攻撃と上陸作戦に進める`);}
    else if(sec)sec.threat=Math.max(5,sec.threat-18);
  }else if(o.res==='draw'){dS-=4;dT+=1;if(sec)sec.threat=Math.min(100,sec.threat+8);L.push('敵は領海内で示威を続けたのち引き揚げた。侵入を許したとの批判が出た');
  }else{S.stats.loss++;dS-=8;dT+=4;
    if(sec&&inc.type==='landing'){let fr=o.fr==null?1:o.fr;if(B&&B.inc===inc)fr=B.u.filter(u=>u.key==='elst'&&!u.dead).length/Math.max(1,inc.force.elst||1);
      if(fr>0){S.gpend={z,L:inc.L,fr:clamp(fr,.4,1)};L.push(`敵の上陸部隊が${ISL[z]}に取りついた`);}else L.push('揚陸艦を失った敵は、上陸を断念した');}
    else if(sec&&inc.type==='airraid'){sec.threat=Math.min(100,sec.threat+10);L.push(raidIsland(z)||'敵の既成事実化が一歩進んだ');}
    else if(sec&&inc.type!=='retake'){sec.threat=Math.min(100,sec.threat+10);L.push('敵の既成事実化が一歩進んだ');}}
  if(o.pre){dS-=15*pp;dT+=15*pp;L.push('先制攻撃に国内外から非難が集中した');}
  S.stats.eSunk+=o.eS;dS=Math.round(dS);dT=Math.round(dT);
  S.support=clamp(S.support+dS,0,100);S.tension=clamp(S.tension+dT,0,100);return{dS,dT,L};}
function afterInc(html){S.pending=null;checkOver();save();render();modal(html+`<div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();else if(gpNext())groundPrompt();}});}
function ignoreInc(inc){if(inc.type==='scramble')return airIgnore(inc);const z=inc.sector,sec=S.sectors[z];let dS=-6,dT=2;const L=[];
  if(inc.type==='landing'){S.gpend={z,L:inc.L,fr:1};dS-=4;dT=5;L.push(`敵の上陸部隊は、海上で阻まれることなく${ISL[z]}に取りついた`);}
  else{sec.threat=clamp(sec.threat+12,0,100);L.push(inc.type==='airraid'&&raidIsland(z)||'敵の既成事実化が進んだ');}
  S.support=clamp(S.support+dS,0,100);S.tension=clamp(S.tension+dT,0,100);S.stats.loss++;hlog(`${SECT[z]}：${SCN[inc.type].n}に対処せず`,'r');
  afterInc(`<div class="alert r">静観</div><h2>${SECT[z]}</h2>${L.map(l=>`<p>${l}。</p>`).join('')}<div class="pol">支持率 ${sg(dS)}　緊張度 ${sg(dT)}</div>`);}
function autoResolve(inc){if(inc.type==='scramble')return airAuto(inc);
  const z=inc.sector,loc=fightIn(z),rs=reserve(z),us=loc.concat(rs.all),ep=forcePower(inc.force,inc.eT);
  const r=(fleetPower(loc)+fleetPower(rs.near)*.5+fleetPower(rs.far)*.25+airPower(z))/Math.max(1,ep),win=Math.random()<clamp(.15+.4*r,.05,.93),hot=inc.type!=='intrusion'||Math.random()<S.tension/120;
  let pS=0,eS=0;const lost=[];
  if(hot){for(const u of us){u.hp-=R(0,(win?35:80)/Math.max(.5,r))*(rs.far.includes(u)?.2:rs.near.includes(u)?.4:1);for(const k in u.load)u.load[k]=Math.round(u.load[k]*R(.3,.8));if(u.ftr)u.ftr=Math.max(0,u.ftr-RI(0,win?1:3));
      if(u.hp<=0){sink(u);pS++;lost.push(u.name);}else{u.hp=Math.round(u.hp);u.tr=Math.min(100,u.tr+3);u.rd=Math.max(0,u.rd-6);}}
    eS=win?RI(1,Math.max(1,Math.round(ep/80))):RI(0,1);}
  const o={res:win?'win':'lose',bloodless:win&&!hot,eS,pS,fr:R(.5,1)},pol=settle(o,inc);
  hlog(`${SECT[z]}：${SCN[inc.type].n} ― ${win?'現場部隊が対処に成功':'現場部隊は対処に失敗'}`,win?'g':'r');
  afterInc(`<div class="alert ${win?'g':'r'}">${win?'対処成功':'対処失敗'}</div><h2>${SECT[z]}　${SCN[inc.type].n}</h2><dl class="kv2"><dt>敵の損害</dt><dd>撃沈 ${eS}隻</dd><dt>我が損害</dt><dd>${pS?`沈没 ${pS}隻(${lost.join('、')})`:hot?'沈没なし。損傷艦は「部隊」で確認':'なし'}</dd></dl>${pol.L.map(l=>`<p class="sm">${l}。</p>`).join('')}<div class="pol">支持率 ${sg(pol.dS)}　緊張度 ${sg(pol.dT)}</div>`);}

/* ---------- 上陸された島の地上戦に入る ---------- */
const gstr=(list,q)=>list.reduce((a,x)=>{const t=GT[x.t||x.type];return a+x.hp*(t.atk+t.def)/2*(q?q(x):1);},0);
function polApply(dS,dT){S.support=clamp(S.support+dS,0,100);S.tension=clamp(S.tension+dT,0,100);}
function groundPrompt(){const gp=S.gpend;if(!gp||S.over)return;if(gp.home)return lwPrompt();const z=gp.z,gar=garrison(z);if(!gp.force)gp.force=mkAssault(gp.L,gp.fr);
  if(!gar.length&&gp.raid){S.gpend=null;const t=raidLoss(z);polApply(-3,2);checkOver();save();render();modal(`<div class="alert r">襲撃</div><h2>${ISL[z]}</h2><p>${t}。</p><div class="pol">支持率 −3　緊張度 +2</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});return;}
  if(!gar.length){S.gpend=null;occupy(z,gp.L,gp.force);polApply(-6,3);checkOver();save();render();
    modal(`<div class="alert r">占領</div><h2>${ISL[z]}</h2><p>守備隊のいない島に敵が上陸し、抵抗を受けずに占領した。</p><div class="pol">支持率 −6　緊張度 +3</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});return;}
  save();
  modal(`<div class="alert r">地上戦</div><h2>${ISL[z]}に敵が上陸</h2>${gp.raid?'<p class="al am">潜水艦で忍び寄った特殊部隊による奇襲。数は少ないが、司令部を狙ってくる。負ければ施設を破壊される。</p>':''}<p>敵は砂浜から司令部を目指してくる。司令部に乗り込まれたまま次の番を終えるか、守備隊が全滅すれば島は占領される。10ターン守り抜けば撃退できる。</p><dl class="kv2"><dt>敵の上陸部隊</dt><dd>${gp.force.length}個部隊(推定)</dd><dt>守備隊</dt><dd>${gar.map(g=>`${g.name}<span class="mut">(戦力${g.hp})</span>`).join('、')}</dd></dl><div class="mbtn"><button class="btn pri" data-m="f">守備隊を自ら指揮する</button><button class="btn" data-m="a">守備隊長に任せる(自動解決)</button></div>`,
  {f:()=>{closeModal();startGround('defend',z);},a:()=>{closeModal();autoGround(z);}});}
function autoGround(z){const gp=S.gpend,gar=garrison(z),M=mods();if(!gp)return;
  const P=gstr(gar,g=>.8+.4*g.tr/100)*(1+M.gndPow)*1.35,E=gstr(gp.force)*(1+.05*eTech()),win=Math.random()<clamp(.5+(P-E)/Math.max(1,P+E)*.9,.06,.94);S.gpend=null;let dS,dT,h;
  if(win){for(const g of gar){g.hp=Math.max(1,g.hp-RI(1,4));g.tr=Math.min(100,g.tr+5);}S.stats.wins++;dS=6;dT=-1;S.sectors[z].threat=Math.max(5,S.sectors[z].threat-15);hlog(`${ISL[z]}：守備隊が上陸した敵を撃退`,'g');
    h=`<div class="alert g">撃退</div><h2>${ISL[z]}を守り抜いた</h2><p>守備隊は損害を出しながらも、上陸した敵を海へ追い落とした。</p>`;}
  else if(gp.raid){S.stats.loss++;for(const g of gar)g.hp=Math.max(1,g.hp-RI(2,4));dS=-4;dT=2;h=`<div class="alert r">襲撃</div><h2>${ISL[z]}</h2><p>${raidLoss(z)}。</p>`;}
  else{S.stats.loss++;S.enl.gnd.n=Math.max(0,S.enl.gnd.n-gar.length*RI(40,90));occupy(z,gp.L,gp.force.filter(()=>Math.random()<.75).map(e=>({t:e.t,hp:Math.max(3,e.hp-RI(1,4))})));dS=-6;dT=3;
    h=`<div class="alert r">陥落</div><h2>${ISL[z]}が占領された</h2><p>守備隊は壊滅し、島は敵の手に落ちた。</p>`;}
  polApply(dS,dT);S.pers.morale=clamp(S.pers.morale+(win?3:-4),5,100);checkOver();save();render();
  modal(h+`<div class="pol">支持率 ${sg(dS)}　緊張度 ${sg(dT)}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});}
