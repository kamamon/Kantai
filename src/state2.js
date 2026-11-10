/* ================= 状態 ================= */
let S=null,_M=null,_PM=null;
const ui={tab:'home',sub:{rd:'labs',bud:'alloc',pers:'sum'},of:{rank:-1,spec:-1,free:0,page:0},pg:'hq',dom:0,bcat:0};
const SAVE='soukai_no_tate_v2';
function save(){_M=null;_PM=null;try{localStorage.setItem(SAVE,JSON.stringify(S));}catch(e){}}
function load(){try{const s=localStorage.getItem(SAVE);if(s){const o=JSON.parse(s);if(o&&o.v===2)return o;}}catch(e){}return null;}
const U=id=>S.units.find(u=>u.id===id);
const lineById={};LINE.forEach(l=>{lineById[l[0]]=l;});
const lvOf=id=>(S.res[id]||{}).lv||0;
const lineCost=(l,L)=>Math.round(l[5]*L*(1+L*.15));
const totalLv=()=>{let s=0;for(const k in S.res)s+=S.res[k].lv;return s;};
function dateStr(m){const a=m+3;return `${S.cfg.y0+Math.floor(a/12)}年${a%12+1}月`;}
function hlog(msg,c){S.log.unshift({m:S.month,msg,c:c||''});if(S.log.length>60)S.log.pop();}
function fmtEff(st,v){const f=STAT[st][1],a=Math.abs(v),s=v>=0?'+':'−',pc=x=>(x*100).toFixed(1).replace(/\.0$/,'');
  if(f==='p')return s+pc(a)+'pt';if(f==='%')return s+pc(a)+'%';if(f==='-%')return (v>=0?'−':'+')+pc(a)+'%';if(f==='-p')return (v>=0?'−':'+')+pc(a)+'pt';
  if(f==='m')return s+Math.round(a)+'分';if(f==='-m')return (v>=0?'−':'+')+Math.round(a)+'分';if(f==='km')return s+Math.round(a)+'km';return s+(Math.round(a*100)/100);}
function spend(x){if(!S.cfg.sandbox)S.funds-=x;S.ext=(S.ext||0)+x;}
const canPay=x=>S.cfg.sandbox||S.funds>=x;

/* ---------- 人事の基礎 ---------- */
function postMap(){if(_PM)return _PM;const m={};for(const o of S.off)if(o.post)m[o.post]=o;return _PM=m;}
const effAb=(o,k)=>o[k]+(k==='cool'&&o.tr.includes('cool')?3:0);
function shipPosts(u){const t=PT[u.type];if(!t.crew)return[];let ks=t.cat==='sub'?['co','xo','we','op','en']:t.val<20?['co','xo','en']:['co','xo','we','op','en','as'];if(t.fcap)ks=ks.concat('ai');return ks.map(k=>PSHIP.find(p=>p[0]===k));}
function allPosts(){const a=[];
  for(const p of PHQ)a.push({id:'hq:'+p[0],n:p[1],rk:p[2],ab:p[3],g:'hq',d:p[4],sp:p[0]==='av'?1:p[0]==='n2'?5:p[0]==='n4'||p[0]==='n8'?4:null});
  for(const l of S.labs)a.push({id:'lab:'+l.id,n:LABT[l.t].n+' 所長',rk:[4,6],ab:'tec',g:'org',d:'研究の速さ',sp:6});
  for(const p of POTH)a.push({id:p[0],n:p[1],rk:p[2],ab:p[3],g:'org',d:p[4],sp:null});
  for(const u of S.units){const sub=PT[u.type].cat==='sub';for(const p of shipPosts(u))a.push({id:u.id+':'+p[0],n:(sub&&SUBL[p[0]])||p[1],rk:p[2],ab:p[3],g:'u'+u.id,u,k:p[0],sp:sub?2:p[4]});}
  return a;}
function pickW(a){return a[Math.floor(Math.random()*a.length)];}
function genOff(rank){const sp=pickW([0,0,0,0,1,1,2,3,3,4,5,6]),b=4+rank*1.1;
  const o={id:++S.oid,name:pick(SUR)+' '+pick(GIV),rank,age:23+rank*5+RI(0,4)+(rank>4?RI(0,3):0),sp,pot:RI(11,20),merit:RI(0,20)+rank*4,tig:RI(0,3),sat:RI(55,85),post:null,sch:null,tr:[],bt:0};
  for(const k of ABK)o[k]=clamp(Math.round(b+R(-2.5,3.5)),2,19);
  for(const k of [['cmd','atk','def'],['atk','cool'],['asw','cool'],['tec'],['adm'],['tec','cool'],['tec','adm']][sp])o[k]=clamp(o[k]+RI(1,3),2,20);
  if(Math.random()<.45)o.tr.push(pick(TRAIT)[0]);if(Math.random()<.1){const t=pick(TRAIT)[0];if(!o.tr.includes(t))o.tr.push(t);}
  S.off.push(o);return o;}
function postScore(o,p){if(o.sch)return -1;const lo=p.rk[0],hi=p.rk[1];if(o.rank>hi||o.rank<lo-1)return -1;return effAb(o,p.ab)*2+(o.rank<lo?-6:0)+(p.sp!=null&&o.sp===p.sp?3:0)+o.cmd*.3+o.merit*.01;}
function cleanPosts(){_PM=null;const ps={};for(const p of allPosts())ps[p.id]=p;const seen={};
  for(const o of S.off){if(!o.post)continue;const p=ps[o.post];if(!p||o.rank>p.rk[1]||o.sch||seen[o.post]){o.post=null;continue;}seen[o.post]=1;}_PM=null;}
function autoAssign(){_PM=null;const pm=postMap(),posts=allPosts().filter(p=>!pm[p.id]);if(!posts.length)return 0;
  const pri=p=>p.id==='hq:cs'?100:p.k==='co'?90+PT[p.u.type].val/100:p.g==='hq'?70:p.k==='we'||p.k==='op'?60:p.g==='org'?50:40;
  posts.sort((a,b)=>pri(b)-pri(a));let n=0;const free=S.off.filter(o=>!o.post&&!o.sch);
  for(const p of posts){let best=null,bs=0;for(const o of free){if(o.post)continue;const s=postScore(o,p);if(s>bs){bs=s;best=o;}}if(best){best.post=p.id;n++;}}
  _PM=null;_M=null;return n;}
function crewK(){let v=0;for(const l of LINE)if(l[3]==='crewReq')v+=l[4]*lvOf(l[0]);return 1-clamp(v,0,.4);}
function airCount(){return S.units.reduce((a,u)=>a+(u.ftr||0)+(u.aew||0),0)+S.pool.ftr+S.pool.aew;}
function reqRates(){const r={},k=crewK();for(const x of RATE)r[x[0]]=0;
  for(const u of S.units){const t=PT[u.type],q=t.cat==='sub'?RQ.sub:t.fcap?RQ.cv:RQ.ship;for(const a in q)r[a]+=t.crew*k*q[a];const ac=(u.ftr||0)+(u.aew||0);r.avm+=ac*9;r.avo+=ac*3;}
  r.avm+=(S.pool.ftr+S.pool.aew)*5;for(const a in r)r[a]=Math.round(r[a]+(a==='sup'||a==='med'||a==='com'?40:12));return r;}
function reqPers(){const r=reqRates();let s=0;for(const k in r)s+=r[k];return s;}
function enlTotal(){let s=0;for(const k in S.enl)s+=S.enl[k].n;return s;}
function fill(){return enlTotal()/Math.max(1,reqPers());}

/* ---------- 研究・予算・人事を合算した全軍の補正値 ---------- */
function mods(){if(_M)return _M;const M={};for(const k in STAT)M[k]=0;
  for(const l of LINE){const v=lvOf(l[0]);if(v)M[l[3]]+=l[4]*v;}
  for(const p of PROJ)if(p.fx&&S.flags[p.k])for(const k in p.fx)M[k]+=p.fx[k];
  BITEM.forEach((b,i)=>{M[b[4]]+=b[5]*(S.bud[i]-2);});
  const pm=postMap(),has=(id,t)=>!!pm[id]&&pm[id].tr.includes(t),ab=(id,k)=>pm[id]?effAb(pm[id],k)-10:-4,cs=clamp(1+ab('hq:cs','adm')*.03,.8,1.4),st=(id,k)=>ab(id,k)*cs;
  M.reinT+=st('hq:n3','cmd')*1.5;M.q+=st('hq:n3','cmd')*.003;M.intel+=st('hq:n2','tec')*.02;M.satT+=st('hq:n2','tec');
  M.upk+=st('hq:n4','adm')*.004+(has('hq:n4','thrift')?.02:0);M.cec+=st('hq:n6','tec')*.01;M.radM+=st('hq:n6','tec')*.005;M.trGain+=st('hq:n7','cmd')*.03;
  M.attr+=st('hq:n1','adm')*.01;M.offGrow+=st('hq:n1','adm')*.02;M.budg+=st('hq:n5','adm')*.01+(has('hq:n5','pol')?.08:0)+(has('hq:cs','pol')?.08:0);M.projRisk+=st('hq:n5','adm')*.008;
  M.cost+=st('hq:n8','adm')*.004+(has('hq:n8','thrift')?.02:0);M.support+=st('hq:pa','cool')*.03;M.prePen+=st('hq:ja','cool')*.02;
  M.warn+=st('hq:ja','cool')*.006+(has('hq:ja','intl')?.03:0)+(has('hq:pa','intl')?.02:0);M.tension+=has('hq:ja','intl')?.05:0;
  M.ftrAam+=st('hq:av','atk')*.004+(has('hq:av','ace')?.03:0);M.deck+=st('hq:av','atk')*.01+(has('hq:av','ace')?.1:0);
  M.dockSpd+=ab('base:0','adm')*.01;M.offGrow+=ab('sch:0','adm')*.03;M.enlTr+=ab('sch:1','tec')*.02;M.recSk+=ab('sch:2','cmd')*.3;
  let men=0;for(const id in pm){const o=pm[id];if(o.rank>=5&&o.tr.includes('mentor'))men++;if(id.startsWith('hq:')&&o.tr.includes('char'))M.morale+=.1;}M.offGrow+=Math.min(.3,men*.05);
  const rq=reqRates();for(const r of RATE){const e=S.enl[r[0]],need=rq[r[0]];if(!need||!e)continue;M[r[2]]+=r[3]*((clamp(e.n/need,.5,1)-1)*2+(e.sk-60)/100*.5);}
  return _M=M;}
function unitQ(u){const M=mods(),rd=u.rd<30?.8:u.rd<50?.9:1;if(!PT[u.type].crew)return clamp((.85+M.usv*.5)*rd,.3,1.15);
  return clamp((0.6+0.4*u.tr/100)*rd*(.9+.1*S.pers.morale/100)*(.7+.3*clamp(fill(),.5,1))+M.q,.3,1.15);}
const ftrCap=u=>PT[u.type].fcap+(u.mods.includes('k_deck')?4:0),aewCap=u=>PT[u.type].acap;
function cap(u){const t=PT[u.type],M=mods();return{sam:Math.round((t.sam||0)*(1+M.samCap)*(u.mods.includes('k_vls')?1.4:1)),asm:Math.round((t.asm||0)*(1+M.asmCap)),torp:t.torp||0,aam:t.aam||0,aasm:t.aasm||0};}
function upkeep(){return S.units.reduce((a,u)=>a+PT[u.type].up*(1+u.mods.length*.03)+(u.mode==='drill'?8:0)+(u.ftr||0)*2+(u.aew||0)*3,0)*(1-clamp(mods().upk,-.3,.4))+S.pool.ftr+S.pool.aew;}
function scaleK(sc){return sc==='p'?reqPers()/2300:sc==='u'?Math.max(.4,S.units.reduce((a,u)=>a+PT[u.type].up,0)/110):sc==='a'?Math.max(.3,airCount()/9):1;}
function itemCost(i,L){const b=BITEM[i];return b[2]*COSTK*LVM[L==null?S.bud[i]:L]*scaleK(b[3])*(1-clamp(mods().cost,-.2,.3));}
const labCost=l=>8*l.lv*LVM[l.fund];
function labRP(l){const o=postMap()['lab:'+l.id],dir=o?(o.tec-10)*.03+(o.tr.includes('tech')?.1:0):-.1;return LABRP[l.lv]*LVM[l.fund]*(LABT[l.t].eff||1)*(1+dir)*(1+mods().rp);}
function catCost(c){let s=0;BITEM.forEach((b,i)=>{if(b[1]===c)s+=itemCost(i);});if(c===4)for(const l of S.labs)s+=labCost(l);return s;}
const debtPay=()=>S.debts.reduce((a,d)=>a+d.per,0);
function monthCost(){let s=upkeep()+debtPay();for(let c=0;c<BCAT.length;c++)s+=catCost(c);return s;}
const income=()=>Math.round(S.budget/12);
function reserve(){return S.units.filter(u=>u.sector===0&&u.mode==='normal'&&PT[u.type].val>=10);}
function fleetPower(us){return (us||S.units).filter(u=>u.mode==='normal'||u.mode==='drill').reduce((a,u)=>a+PT[u.type].val*unitQ(u)*(u.hp/100)+(u.ftr||0)*8+(u.aew||0)*12,0)*(1+totalLv()/500);}
function enemyPower(){return Math.round((420+Math.min(S.month,120)*10+Math.max(0,S.month-120)*4)*(.5+.5*S.cfg.eGrow));}
const eTech=()=>S.month/60*S.cfg.eGrow;
const reinTime=()=>Math.round(clamp(S.cfg.reinT-mods().reinT,30,180));
function thr(i){const s=S.sectors[i],v=s.est==null?s.threat:s.est;return v<30?{t:'低',c:'g',v}:v<55?{t:'中',c:'am',v}:v<75?{t:'高',c:'r',v}:{t:'極めて高',c:'r',v};}
function price(k){const M=mods(),t=PT[k],s=SHOPX[k];return Math.round(t?t.cost*(1-clamp(M.buildC,0,.4)):s.cost*(s.kind==='ammo'?1-clamp(M.ammoC,-.2,.5):1));}
function buildMo(k){const t=PT[k],s=SHOPX[k];return Math.max(1,Math.round((t?t.build:s.build)*(t?1-clamp(mods().buildT,0,.45):1)));}

function addUnit(type,o){o=o||{};const free=(NAMES[type]||[]).filter(n=>!S.used.includes(n)),name=free.length?free[0]:PT[type].s+'-'+String(++S.seq).padStart(2,'0');S.used.push(name);
  const u={id:++S.uid,type,name,sector:0,mode:'normal',tr:o.tr==null?RI(58,72):o.tr,rd:o.rd==null?RI(80,92):o.rd,hp:100,ftr:0,aew:0,mods:[],refit:null,load:{}};
  S.units.push(u);_M=null;const c=cap(u);for(const k in c)u.load[k]=c[k];return u;}
function newGame(c){c=c||{};const C=Object.assign({},DEFCFG,c);C.fleet=Object.assign({},DEFCFG.fleet,c.fleet||{});_M=null;_PM=null;
  S={v:2,cfg:C,month:0,fy:0,funds:C.funds,budget:C.budget,support:C.support,tension:C.tension,bud:BITEM.map(()=>2),units:[],used:[],seq:0,pool:{ftr:0,aew:0},
    stock:{sam:48,asm:24,aam:32,torp:16},orders:[],debts:[],ledger:[],ext:0,pers:{morale:62,pipe:[],auto:true,pol:'auto',rep:[],sp:0,resv:0,resvEnd:0},off:[],enl:{},
    res:{},labs:[],projs:{},flags:{},unlock:{},kits:{},sectors:[null,{threat:30,held:true,est:30},{threat:38,held:true,est:38},{threat:52,held:true,est:52}],
    log:[],stats:{wins:0,loss:0,eSunk:0,pSunk:0,blood0:0},uid:0,oid:0,lid:0,pending:null,fore:null,foreK:false,over:null,restM:-1,fyAsk:0,fySupp:0,lastLoss:-99};
  for(const r of RATE)S.enl[r[0]]={n:0,sk:60};
  if(C.techLv)for(const l of LINE){const v=clamp(Math.round(C.techLv+R(-1.5,1.2)),0,10);if(v)S.res[l[0]]={lv:v,prog:0};}
  const f=C.fleet;let ftr=f.ftr||0,aew=f.aew||0;
  for(const k of['cv','cvl','ddg','dd','ffm','ss','opv','aoe'])for(let i=0;i<(f[k]||0);i++){const u=addUnit(k,{tr:clamp(C.tr+RI(-7,7),20,95)});if(PT[k].lock){S.unlock[k]=1;S.flags[k]=1;}
    if(PT[k].fcap){u.ftr=Math.min(ftr,PT[k].fcap);ftr-=u.ftr;u.aew=Math.min(aew,PT[k].acap);aew-=u.aew;}}
  S.pool.ftr=ftr;S.pool.aew=aew;const sc=Math.max(.5,S.units.length/8);for(const k in S.stock)S.stock[k]=Math.round(S.stock[k]*sc);
  for(let i=0;i<clamp(C.labs,1,8);i++)S.labs.push({id:++S.lid,t:i,lv:1,fund:2,cur:null,auto:true,foc:-1});
  const rq=reqRates();for(const r of RATE)S.enl[r[0]]={n:Math.round(rq[r[0]]*R(.93,.99)),sk:RI(55,68)};
  const N=Math.round(allPosts().length*1.35)+10;RFRAC.forEach((fr,r)=>{for(let i=0;i<Math.max(1,Math.round(N*fr));i++)genOff(r);});
  autoAssign();_M=null;for(const u of S.units){const cp=cap(u);for(const k in cp)u.load[k]=cp[k];}
  hlog(`${C.fleetName}司令に着任。任期は${C.years}年`,'b');}

/* ================= 月の進行 ================= */
function reload(){const order=[...S.units].sort((a,b)=>a.sector-b.sector);let short=false;
  for(const u of order){const c=cap(u);for(const k in c){const need=c[k]-(u.load[k]||0);if(need>0){const give=Math.min(need,S.cfg.sandbox?need:S.stock[STK[k]]);u.load[k]=(u.load[k]||0)+give;if(!S.cfg.sandbox)S.stock[STK[k]]-=give;if(give<need)short=true;}else if(need<0)u.load[k]=c[k];}}
  return short;}
function deliver(o,rep){
  if(o.kind==='unit'){const u=addUnit(o.k);rep.push([`就役：${PT[o.k].n}「${u.name}」(母港)`,'g']);}
  else if(o.kind==='air'){S.pool[o.k]+=o.q;rep.push([`納入：${o.n}(予備機へ)`,'g']);}
  else if(o.kind==='ammo'){S.stock[o.k]+=o.q;rep.push([`納入：${o.n}`,'']);}
  else if(o.kind==='lab'){S.labs.push({id:++S.lid,t:o.t,lv:1,fund:2,cur:null,auto:true,foc:-1});rep.push([`新設：${LABT[o.t].n}`,'g']);}}
function distribute(n,due){if(n<=0)return;const rq=reqRates(),P=S.pers,pend={};for(const p of P.pipe)pend[p.r]=(pend[p.r]||0)+p.n;
  let w=RATE.map(r=>Math.max(0,(rq[r[0]]||0)-S.enl[r[0]].n-(pend[r[0]]||0))),sum=w.reduce((a,b)=>a+b,0);
  if(sum<=0){w=RATE.map(r=>rq[r[0]]||0);sum=w.reduce((a,b)=>a+b,0)||1;}
  if(P.pol!=='auto'){const i=RATE.findIndex(r=>r[0]===P.pol);if(i>=0){w=w.map(x=>x*.5/sum);w[i]+=.5;sum=1;}}
  let left=n;RATE.forEach((r,i)=>{const k=Math.min(left,Math.round(n*w[i]/sum));if(k>0){P.pipe.push({n:k,r:r[0],due});left-=k;}});
  if(left>0)P.pipe.push({n:left,r:RATE[w.indexOf(Math.max(...w))][0],due});}
function monthlyPers(rep,M){const P=S.pers,dep=S.units.filter(u=>u.sector>0).length/Math.max(1,S.units.length),f0=fill();
  P.morale=clamp(P.morale+M.morale+(dep>.7?-1.2:dep<.4?.5:0)+(f0<.85?-1.5:0)+(60-P.morale)*.03,5,100);
  const ar=clamp((.0065+(55-P.morale)*.0002)*(1-clamp(M.attr,-.5,.7)),.0015,.03);
  for(const r of RATE){const e=S.enl[r[0]];e.n=Math.max(0,e.n-Math.round(e.n*ar*R(.6,1.4)));e.sk=clamp(e.sk+.25+M.enlTr+M.trGain*.2-(e.sk-55)*.012,20,98);}
  if(P.resv&&S.month>=P.resvEnd){const rq=reqRates(),tot=reqPers();for(const r of RATE){const e=S.enl[r[0]];e.n=Math.max(0,e.n-Math.round(P.resv*(rq[r[0]]||0)/Math.max(1,tot)));}P.resv=0;rep.push(['予備自衛官の招集を解除した','']);}
  distribute(Math.round(reqPers()*.0062*(1+clamp(M.recruit,-.8,1.5))*(.6+S.support/125)),S.month+3);
  P.pipe=P.pipe.filter(p=>{if(S.month<p.due)return true;const e=S.enl[p.r],sk=38+M.recSk*6;e.sk=(e.sk*e.n+sk*p.n)/Math.max(1,e.n+p.n);e.n+=p.n;return false;});
  if(f0>=.85&&fill()<.85)rep.push(['人員充足率が85%を割った','am']);
  const posts={};for(const p of allPosts())posts[p.id]=p;
  for(const o of S.off.slice()){
    if(o.sch){if(S.month>=o.sch.until){const c=COURSE.find(x=>x[0]===o.sch.k);for(const k in c[4])o[k]=clamp(o[k]+c[4][k],1,20);o.merit+=8;if(o.sch.k==='abr'&&!o.tr.includes('intl')&&Math.random()<.5)o.tr.push('intl');o.sch=null;rep.push([`${o.name}${RANK[o.rank]}：${c[1]}を修了`,'g']);}continue;}
    const p=o.post&&posts[o.post];
    if(p){o.sat=Math.min(100,o.sat+1);o.merit+=(.4+o.rank*.05)*(o.tr.includes('amb')?1.3:1);if(Math.random()<.05*(1+clamp(M.offGrow,-.5,2))&&o[p.ab]<o.pot)o[p.ab]++;}
    else if(o.rank>=3){o.sat-=2;if(o.sat<20&&Math.random()<.04){S.off=S.off.filter(x=>x!==o);if(o.rank>=4)rep.push([`${o.name}${RANK[o.rank]}が処遇への不満から退職した`,'am']);}}}
  _PM=null;}
function annualPers(){const P=S.pers,L=[],M=mods();let ret=0,pro=0;
  for(const o of S.off.slice()){o.age++;o.tig++;if(o.sch)continue;if(o.age>=RET[o.rank]||(o.tr.includes('frail')&&Math.random()<.15)){S.off=S.off.filter(x=>x!==o);ret++;if(o.rank>=5)L.push(`${o.name}${RANK[o.rank]}が退官`);}}
  const N=S.off.length;
  for(let r=6;r>=0;r--){const need=Math.max(r>=6?1:2,Math.round(N*RFRAC[r+1]))-S.off.filter(o=>o.rank===r+1).length;if(need<=0)continue;
    const c=S.off.filter(o=>o.rank===r&&o.tig>=TIG[r]&&!o.sch).sort((a,b)=>b.merit-a.merit);
    c.slice(0,need).forEach(o=>{o.rank++;o.tig=0;o.merit*=.4;o.sat=Math.min(100,o.sat+15);pro++;if(o.rank>=5)L.push(`${o.name}が${RANK[o.rank]}に昇任`);});
    c.slice(need).forEach(o=>{if(o.tr.includes('amb'))o.sat-=12;});}
  const inN=Math.max(2,Math.round(allPosts().length*.09*(1+clamp(M.cadet,-.6,1))));for(let i=0;i<inN;i++){const o=genOff(0);o.age=RI(22,25);o.merit=0;o.tig=0;}
  P.sp=0;cleanPosts();if(P.auto)autoAssign();P.rep=[`退官・退職 ${ret}名、昇任 ${pro}名、新任3尉 ${inN}名`].concat(L.slice(0,6));return P.rep;}
function autoPick(lab){const busy=S.labs.filter(l=>l!==lab&&l.cur).map(l=>l.cur),ds=lab.foc>=0?[lab.foc]:LABT[lab.t].d;let best=null,bc=1e9;
  for(const l of LINE){if(!ds.includes(l[2])||busy.includes(l[0]))continue;const lv=lvOf(l[0]);if(lv>=10)continue;const c=lineCost(l,lv+1)-((S.res[l[0]]||{}).prog||0)+Math.random();if(c<bc){bc=c;best=l[0];}}
  return best;}
function projOK(p){if(S.flags[p.k]||S.projs[p.k])return false;for(const k in p.req)if(lvOf(k)<p.req[k])return false;return true;}
function monthlyRD(rep,M){const done=[];
  for(const lab of S.labs){if(lab.cur&&lvOf(lab.cur)>=10)lab.cur=null;if(!lab.cur&&lab.auto)lab.cur=autoPick(lab);if(!lab.cur)continue;
    const l=lineById[lab.cur],r=S.res[l[0]]||(S.res[l[0]]={lv:0,prog:0});r.prog+=labRP(lab);let g=0;
    while(r.lv<10&&r.prog>=lineCost(l,r.lv+1)&&g++<6){r.prog-=lineCost(l,r.lv+1);r.lv++;done.push(`${l[1]} ${r.lv}`);}
    if(r.lv>=10){r.prog=0;lab.cur=lab.auto?autoPick(lab):null;}else if(lab.auto&&g)lab.cur=autoPick(lab)||lab.cur;}
  if(done.length){_M=null;rep.push([`研究が進展：${done.slice(0,3).join('、')}${done.length>3?` ほか${done.length-3}件`:''}`,'g']);}
  for(const k of Object.keys(S.projs)){const pj=S.projs[k],p=PROJ.find(x=>x.k===k);
    if(pj.wait){if(canPay(p.c[pj.ph])){spend(p.c[pj.ph]);pj.wait=false;}else continue;}
    if(--pj.left>0)continue;
    if(!pj.rolled&&Math.random()<clamp(.22-M.projRisk,.03,.5)){pj.rolled=true;pj.left=RI(1,3);const ov=Math.round(p.c[pj.ph]*R(.1,.25));spend(ov);rep.push([`${p.n}：${PHASE[pj.ph]}の段階で不具合。${pj.left}か月の遅れ、追加費用${ov}億円`,'am']);continue;}
    pj.ph++;pj.rolled=false;
    if(pj.ph>=3){delete S.projs[k];S.flags[k]=1;if(p.kind==='unit')S.unlock[k]=1;if(p.kind==='kit')S.kits[k]=1;_M=null;rep.push([`開発完了：${p.n}${p.kind==='unit'?'(調達できる)':p.kind==='kit'?'(各艦に改修できる)':'(全軍に配備)'}`,'g']);}
    else{pj.left=p.t[pj.ph];if(canPay(p.c[pj.ph]))spend(p.c[pj.ph]);else pj.wait=true;}}}
function nextMonth(){
  if(S.over||mq.length)return;if(S.pending){showIncident();return;}
  _M=null;cleanPosts();if(S.pers.auto)autoAssign();
  S.month++;const rep=[],C=S.cfg;let M=mods();
  const inc=income(),up=upkeep(),cc=BCAT.map((_,c)=>catCost(c)),debt=debtPay(),tot=up+cc.reduce((a,b)=>a+b,0)+debt;
  if(!C.sandbox)S.funds+=inc-tot;S.debts=S.debts.filter(d=>--d.left>0);
  S.ledger.push({m:S.month,inc,up:Math.round(up),cc:cc.map(Math.round),debt:Math.round(debt),ext:Math.round(S.ext||0),f:Math.round(S.funds)});S.ext=0;if(S.ledger.length>60)S.ledger.shift();
  // 部隊
  const aoeIn={},pm=postMap();for(const u of S.units)if(PT[u.type].sup&&u.sector>0&&u.mode==='normal')aoeIn[u.sector]=1;
  for(const u of S.units){const xo=pm[u.id+':xo'],co=pm[u.id+':co'],en=pm[u.id+':en'],crew=PT[u.type].crew>0,ht=(o,t)=>!!o&&o.tr.includes(t);
    const tk=(1+M.trGain)*(crew?1+(xo?(xo.adm-10)*.03:-.15):1)*(ht(co,'drill')||ht(xo,'drill')?1.4:1)*(ht(co,'char')?1.15:1);
    const dk=(1-clamp(M.rdDecay,-.5,.7))*(crew?(en?1-(en.tec-10)*.02-(ht(en,'tech')?.1:0):1.15):1)*(aoeIn[u.sector]?.5:1);
    if(u.mode==='dock'){const s=1+clamp(M.dockSpd,-.5,1.5);u.rd=Math.min(100,u.rd+35*s);u.hp=Math.min(100,u.hp+34*s);u.tr=Math.max(0,u.tr-1);
      if(u.refit&&--u.refit.left<=0){u.mods.push(u.refit.k);rep.push([`${u.name}：${KIT[u.refit.k].n}の改修を完了`,'g']);u.refit=null;_M=null;}
      if(!u.refit&&u.rd>=100&&u.hp>=100){u.mode='normal';rep.push([`${u.name}：ドックを出た`,'g']);}}
    else if(u.mode==='drill'){u.tr=Math.min(100,u.tr+4*Math.max(.3,tk));u.rd=Math.max(0,u.rd-4);}
    else if(u.sector>0){u.rd=Math.max(0,u.rd-5*Math.max(.2,dk));u.tr=Math.min(100,u.tr+.5);}
    else{u.rd=Math.min(100,u.rd+7*Math.max(.2,1+M.rdRec));u.tr=clamp(u.tr+.6*tk-.4,0,100);}}
  monthlyPers(rep,M);monthlyRD(rep,M);M=mods();
  S.orders=S.orders.filter(o=>{if(S.month<o.due)return true;deliver(o,rep);return false;});
  if(reload())rep.push(['弾薬の在庫が足りず、定数割れの艦がある','am']);
  // 情勢
  _M=null;M=mods();const det=fleetPower()/enemyPower();let unc=0,occ=0;const pm2=postMap();
  for(let i=1;i<=3;i++){const s=S.sectors[i];if(!s.held){occ++;continue;}const here=S.units.filter(u=>u.sector===i&&u.mode==='normal'),pw=fleetPower(here),bc=pm2['base:'+i];
    s.threat=clamp(s.threat+R(-7,7)+(S.tension-40)*.06+(pw>=150?-3:here.length?-1:3)+(i===3?.8:0)-M.threatSup-(bc?(bc.cmd-10)*.08:-.3),5,100);if(s.threat>50&&!here.length)unc++;
    s.est=clamp(s.threat+R(-12,12)*(1-clamp(M.intel,0,.9)),0,100);}
  S.calm=S.tension<=5?(S.calm||0)+1:0;S.tension=clamp(S.tension+.8*C.eAggr+(Math.min(60,28*C.eAggr)-S.tension)*.03+R(-1.5,1.5)-clamp((det-1)*4,-3,2.5)+unc*.8-M.tension,0,100);
  S.support=clamp(S.support+(50-S.support)*.04-occ-(S.funds<-300?2:S.funds<0?1:0)+M.support,0,100);
  let fis=null;if(S.month%12===0)fis=fiscal();
  for(const r of rep)hlog(r[0],r[1]);
  checkOver();const offer=!S.over&&!S.peaceAsked&&(S.calm||0)>=12&&S.month>=24;if(offer){S.peaceAsked=true;S.support=clamp(S.support+5,0,100);hlog('両国が海上連絡メカニズムの運用に合意','g');}
  if(!S.over){S.pending=S.fore&&S.sectors[S.fore.sector].held?mkIncident(S.fore.sector,S.fore.type):null;S.fore=rollIncident();
    S.foreK=!!S.fore&&Math.random()<clamp(.15+M.foresee+M.intel*.2,0,.9);if(S.fore&&S.foreK)hlog(`情報：来月、${SECT[S.fore.sector]}で${SCN[S.fore.type].n}の兆候`,'am');}
  save();render();
  if(S.over){mq.length=0;$('#modal').hidden=true;showOver();return;}
  if(offer)showPeace();
  if(fis)showFiscal(fis);
  if(S.pending)showIncident();else if(rep.length&&!fis)toast(rep[0][0]+(rep.length>1?`　ほか${rep.length-1}件`:''));}
function fiscal(){const C=S.cfg,old=S.budget;S.fy++;
  let b=C.budget*Math.pow(1.015,S.fy)*(1+(S.tension-35)*.004+(S.support-50)*.004+Math.min(.15,S.stats.wins*.004));
  const cut=C.sandbox?0:Math.round(Math.max(0,S.funds-old*.25)*.3);b=Math.max(1200,Math.round((b-cut)/10)*10);S.budget=b;S.fyAsk=0;S.fySupp=0;
  const pr=annualPers();hlog(`新年度予算 ${b.toLocaleString()}億円`,'b');return{old,cut,pr};}
function askChance(a){return clamp(.78-a*3+(S.support-50)*.008+(S.tension-40)*.006+mods().budg,.05,.95);}
function suppChance(){return clamp(.35+(S.tension-50)*.01+mods().budg+(S.support-50)*.005+(S.month-S.lastLoss<6?.15:0),.05,.9);}
function checkOver(){if(S.over)return;const occ=[1,2,3].filter(i=>!S.sectors[i].held).length,y=S.cfg.years;
  if(S.support<=0)S.over={k:'fired',t:'更迭',d:'国民と政府の信任を失い、司令の任を解かれた。'};
  else if(occ>=3)S.over={k:'lost',t:'敗北',d:'すべての島嶼が占領された。'};
  else if(!S.units.length)S.over={k:'lost',t:'艦隊壊滅',d:'指揮すべき艦が残っていない。'};
  else if(S.month>=y*12)S.over={k:'end',t:'任期満了',d:`${y}年の任期を全うした。`};
}
function genForce(type,L,eT){const r=x=>Math.max(0,Math.round(x));let f;
  if(type==='intrusion')f={eff:Math.max(1,r(.8+L*.6)),eddg:r(L*.45-.3),ess:Math.random()<.25*L?1:0};
  else if(type==='airraid')f={ebmr:Math.max(1,r(.6+L*.8)),eftr:r(L*.6-.3),eff:1,eddg:r(L*.4-.3)};
  else if(type==='landing')f={elst:L>2.6?2:1,eddg:Math.max(1,r(L*.5)),eff:Math.max(1,r(L*.7)),ess:r(L*.4),ebmr:r(L*.6),eftr:r(L*.6),ecv:L>3?1:0};
  else f={eddg:Math.max(1,r(L*.5)),eff:Math.max(1,r(L*.8)),ess:1,eftr:r(L*.5)};
  eT=eT||0;if(eT>=1.5&&f.eddg){f.ecg=Math.min(f.eddg,Math.floor(eT/1.5));f.eddg-=f.ecg;}if(eT>=2&&f.eftr){f.estl=f.eftr;f.eftr=0;}
  if(eT>=2.5){if(f.eff)f.eff++;if(f.ebmr)f.ebmr++;}
  for(const k in f)if(!f[k])delete f[k];return f;}
function intelStr(f){const acc=clamp(mods().intel,0,1),ex=acc>=.6,n=k=>f[k]||0,rng=x=>ex?`${x}`:x<=0?'0〜1':`${Math.max(1,x-1)}〜${x+1}`;
  return `水上艦 ${rng(n('eff')+n('eddg')+n('ecg')+n('elst')+n('ecv'))}隻、航空機 ${rng(n('ebmr')+n('eftr')+n('estl'))}編隊、潜水艦 ${acc>=.3?n('ess')+'隻':'不明'}`;}
function mkIncident(i,type){const C=S.cfg,T=clamp(S.tension*C.eAggr,0,100),L=1+Math.min(2.5,S.month/30*C.eGrow)+S.tension/100,eT=eTech();
  if(!type){const r=Math.random();type=T<40?(r<.8?'intrusion':'airraid'):T<65?(r<.45?'intrusion':r<.85?'airraid':'landing'):(r<.2?'intrusion':r<.6?'airraid':'landing');
    if(S.stats.wins+S.stats.loss===0)type='intrusion';}
  const force=genForce(type,L,eT);return{sector:i,type,L,eT,force,intel:intelStr(force)};}
function rollIncident(){if(S.month<1)return null;
  for(const i of [1,2,3].sort(()=>Math.random()-.5)){const s=S.sectors[i];if(!s.held)continue;if(Math.random()<clamp((.04+(s.threat/100)*(.15+S.tension/250))*S.cfg.incF,0,.75))return mkIncident(i);}
  return null;}
function sink(su){S.units=S.units.filter(u=>u!==su);const t=PT[su.type],lost=t.crew*R(.3,.7),q=t.cat==='sub'?RQ.sub:t.fcap?RQ.cv:RQ.ship;
  for(const k in q)S.enl[k].n=Math.max(0,S.enl[k].n-Math.round(lost*q[k]));S.stats.pSunk++;S.lastLoss=S.month;S.pers.morale=Math.max(5,S.pers.morale-5);
  for(const o of S.off.slice())if(o.post&&o.post.startsWith(su.id+':')){if(Math.random()<.35){S.off=S.off.filter(x=>x!==o);if(o.post.endsWith(':co'))hlog(`${o.name}${RANK[o.rank]}、艦と運命を共にする`,'r');}else{o.post=null;o.sat-=10;}}
  _PM=null;_M=null;}
function settle(o,inc){let dS=0,dT=0;const sec=inc.sector>0?S.sectors[inc.sector]:null,L=[],pp=S.cfg.prePen*(1-clamp(mods().prePen,-.3,.6));
  dS-=o.pS*4;
  if(o.res==='win'){S.stats.wins++;
    if(o.bloodless){dS+=6;dT-=4;S.stats.blood0++;L.push('一発も撃たずに事態を収めた。国内外の評価は高い');}
    else{dS+=4+Math.min(4,o.eS);dT+=o.eS*1.5-3;}
    if(o.pursuitK){dT+=o.pursuitK*3;dS-=o.pursuitK;L.push('撤退中の敵への追撃が、緊張をさらに高めた');}
    if(inc.type==='retake'&&sec){sec.held=true;sec.threat=35;dS+=8;L.push(`${ISL[inc.sector]}を奪還した`);}
    else if(sec)sec.threat=Math.max(5,sec.threat-18);
  }else if(o.res==='draw'){dS-=4;dT+=1;if(sec)sec.threat=Math.min(100,sec.threat+8);L.push('敵は領海内で示威を続けたのち引き揚げた。侵入を許したとの批判が出た');
  }else{S.stats.loss++;dS-=8;dT+=4;
    if(sec&&inc.type!=='retake'&&(o.occupied||inc.type==='landing')){sec.held=false;dS-=6;L.push(`${ISL[inc.sector]}が占領された`);}
    else if(sec&&inc.type!=='retake'){sec.threat=Math.min(100,sec.threat+10);L.push('敵の既成事実化が一歩進んだ');}}
  if(o.pre){dS-=15*pp;dT+=15*pp;L.push('先制攻撃に国内外から非難が集中した');}
  S.stats.eSunk+=o.eS;dS=Math.round(dS);dT=Math.round(dT);
  S.support=clamp(S.support+dS,0,100);S.tension=clamp(S.tension+dT,0,100);return{dS,dT,L};}
function afterInc(html){S.pending=null;checkOver();save();render();modal(html+`<div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});}
function ignoreInc(inc){const sec=S.sectors[inc.sector];let dS=-6,dT=2;const L=[];
  if(inc.type==='landing'){sec.held=false;dS-=10;dT=6;L.push(`${ISL[inc.sector]}が抵抗を受けずに占領された`);}else{sec.threat=clamp(sec.threat+12,0,100);L.push('敵の既成事実化が進んだ');}
  S.support=clamp(S.support+dS,0,100);S.tension=clamp(S.tension+dT,0,100);S.stats.loss++;hlog(`${SECT[inc.sector]}：${SCN[inc.type].n}に対処せず`,'r');
  afterInc(`<div class="alert r">静観</div><h2>${SECT[inc.sector]}</h2>${L.map(l=>`<p>${l}。</p>`).join('')}<div class="pol">支持率 ${sg(dS)}　緊張度 ${sg(dT)}</div>`);}
function autoResolve(inc){
  const loc=S.units.filter(u=>u.sector===inc.sector&&u.mode==='normal'),rn=reserve(),us=loc.concat(rn);let ep=0;for(const k in inc.force)ep+=ET[k].val*inc.force[k]*(1+.06*(inc.eT||0));
  const r=(fleetPower(loc)+fleetPower(rn)*.5)/Math.max(1,ep),win=Math.random()<clamp(.15+.4*r,.05,.93),hot=inc.type!=='intrusion'||Math.random()<S.tension/120;
  let pS=0,eS=0;const lost=[];
  if(hot){for(const u of us){u.hp-=R(0,(win?35:80)/Math.max(.5,r))*(rn.includes(u)?.4:1);for(const k in u.load)u.load[k]=Math.round(u.load[k]*R(.3,.8));if(u.ftr)u.ftr=Math.max(0,u.ftr-RI(0,win?1:3));
      if(u.hp<=0){sink(u);pS++;lost.push(u.name);}else{u.hp=Math.round(u.hp);u.tr=Math.min(100,u.tr+3);u.rd=Math.max(0,u.rd-6);}}
    eS=win?RI(1,Math.max(1,Math.round(ep/80))):RI(0,1);}
  const o={res:win?'win':'lose',bloodless:win&&!hot,eS,pS,occupied:!win&&inc.type==='landing'},pol=settle(o,inc);
  hlog(`${SECT[inc.sector]}：${SCN[inc.type].n} ― ${win?'現場部隊が対処に成功':'現場部隊は対処に失敗'}`,win?'g':'r');
  afterInc(`<div class="alert ${win?'g':'r'}">${win?'対処成功':'対処失敗'}</div><h2>${SECT[inc.sector]}　${SCN[inc.type].n}</h2><dl class="kv2"><dt>敵の損害</dt><dd>撃沈 ${eS}隻</dd><dt>我が損害</dt><dd>${pS?`沈没 ${pS}隻(${lost.join('、')})`:hot?'沈没なし。損傷艦は「部隊」で確認':'なし'}</dd></dl>${pol.L.map(l=>`<p class="sm">${l}。</p>`).join('')}<div class="pol">支持率 ${sg(pol.dS)}　緊張度 ${sg(pol.dT)}</div>`);}
