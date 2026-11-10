/* ---------- 戦闘：部隊の生成(研究・人事・改修を反映) ---------- */
function shipOff(su){const pm=postMap(),g=k=>pm[su.id+':'+k]||null;return{co:g('co'),xo:g('xo'),we:g('we'),op:g('op'),en:g('en'),as:g('as'),ai:g('ai')};}
function pShip(su,x,y){const t=PT[su.type],M=B.M,q=unitQ(su),o=shipOff(su),has=k=>su.mods.includes(k),sub=t.cat==='sub',crew=t.crew>0,co=o.co;
  const ob=(of,k)=>!crew?0:of?(effAb(of,k)-10)*.008:-.04,tr=(of,k)=>!!of&&of.tr.includes(k),usv=su.type==='usv'?1+M.usv:1,hpK=1+(sub?M.subHp:M.hp);
  return mk({side:'P',cat:t.cat,key:su.type,cvf:!!t.fcap,name:su.name,lab:su.name,sym:t.s,x,y,ref:su.id,q,
    spd:t.spd*(su.rd<30?.8:1)*(1+(sub?M.subSpd:M.spd)+ob(o.en,'tec')*.5+(has('k_bat')?.15:0)),hp:Math.max(1,t.hp*hpK*su.hp/100),max:t.hp*hpK,
    dA:t.dA*(1+M.radA+ob(o.op,'tec')),dS:(t.dS*(1+M.esm)+(t.cat==='ship'?M.radS:0)+(has('k_uav')?45:0))*usv,dM:t.dM*(1+M.radM+ob(o.op,'tec'))*usv,
    so:t.so*(1+(sub?M.sonarSub:M.sonar)+(has('k_vds')?.4:0)+ob(sub?o.op:o.as,'tec')+(tr(co,'subk')?.1:0)),
    sam:su.load.sam||0,samR:(t.samR||0)*(1+(t.samR>=100?M.samRL:M.samRS)),samPk:clamp(((t.samPk||0)+M.samPk+ob(o.we,'def')+ob(co,'cmd')*.5+(tr(co,'def')?.025:0))*q*usv,0,.95),
    samRate:(t.samRate||.3)/q/Math.max(.5,1+M.samRate+ob(o.op,'tec')*2),
    ciws:t.ciws?clamp((t.ciws+M.ciws+(has('k_laser')?.18:0))*(.5+.5*q),0,.92):0,ecm:t.ecm?clamp(t.ecm+M.ecm+(has('k_ecm')?.12:0)+ob(co,'cool')*.5-(tr(co,'aggr')?.015:0),0,.8):0,gun:has('k_rail')?.28+M.gun:0,
    asm:su.load.asm||0,asmR:(t.asmR||0)*(1+M.asmR+(sub?M.subAsm:0)),asmDmg:(t.asmDmg||0)*(1+M.asmDmg),pkB:M.asmPen+ob(o.we,'atk')+(tr(co,'aggr')?.03:0),asmV:15*(1+M.asmSpd),
    torp:su.load.torp||0,torpR:(t.torpR||0)*(1+(sub?M.torpR:M.aswR)),aswB:(sub?M.torpPk:M.aswPk)+ob(sub?o.we:o.as,'asw')+(tr(co,'subk')?.06:0),torpDmg:sub?1+M.torpDmg:1,
    stealth:clamp(M.stealth+(has('k_stl')?.2:0),0,.6),quiet:clamp(M.quiet+(t.quiet||0)+(has('k_bat')?.2:0),0,.7),dc:clamp(M.dc+(has('k_dc')?.2:0)+ob(o.en,'tec'),0,.6),decoy:clamp(.2+M.decoy,0,.7),
    luck:tr(co,'luck')?.12:0,care:tr(co,'care'),cecS:has('k_cec')?1:clamp(M.cec,0,1),hide:1-clamp(M.subHide,0,.8),
    ftr:su.ftr||0,aew:su.aew||0,aamS:su.load.aam||0,asmS:su.load.aasm||0,deckCd:0,turn:[],
    deckK:1/Math.max(.5,1+M.deck+ob(o.ai,'atk')*2+(has('k_deck')?.25:0)+(tr(o.ai,'ace')?.1:0)),airB:ob(o.ai,'atk')+(tr(o.ai,'ace')?.03:0),cool:co?effAb(co,'cool'):6});}
function mkE(key,x,y,role,extra){const t=ET[key],air=t.cat==='air',i=B.ec[key]=(B.ec[key]||0)+1,L=String.fromCharCode(65+((i-1)%26)),e=B.eT,g=1+.06*e;
  return mk(Object.assign({side:'E',cat:t.cat,key,name:t.n+' '+L,lab:t.s+' '+L,sym:t.s,x:clamp(x,4,W-4),y:clamp(y,4,H-4),sx:clamp(B.sp.x+R(-20,20),4,W-4),sy:clamp(B.sp.y+R(-12,12),4,H-4),spd:t.spd,
    hp:air?t.ac:t.hp*g,max:air?t.ac:t.hp*g,n:t.ac||0,dA:t.dA*g,dS:t.dS,dM:t.dM*g,so:(t.so||0)*g,sam:Math.round((t.sam||0)*(1+.05*e)),samR:t.samR||0,samPk:t.samPk?Math.min(.88,t.samPk+.02*e):0,samRate:(t.samRate||.3)*(1+B.jam),
    ciws:t.ciws?Math.min(.8,t.ciws+.015*e):0,ecm:t.ecm?Math.min(.6,t.ecm+.015*e):0,asm:t.asm||0,asmR:(t.asmR||0)*(1+.03*e),asmDmg:(t.asmDmg||50)*(1+.04*e),
    aam:t.aam||0,aamR:(t.aamR||0)*(1+.04*e),aamPk:t.aamPk?Math.min(.85,t.aamPk+.02*e):0,torp:t.torp||0,torpR:t.torpR||0,lo:t.lo||0,role,val:t.val,air:t.air||0,born:B.t,ox:0,oy:0,fx:0,fy:0},extra||{}));}
function mkFlight(c,kind){const M=B.M,d=norm(B.sp.x-c.x,B.sp.y-c.y),base={side:'P',cat:'air',home:c.id,x:c.x+d.x*2,y:c.y+d.y*2,q:c.q,fl:kind,surv:clamp(M.ftrSurv,0,.5)};let f;
  if(kind==='aew'){const k=1+M.aewRad;f=mk(Object.assign(base,{key:'aew',name:'早期警戒機',lab:'早期警戒機',sym:'AEW',spd:8,hp:1,max:1,n:1,dA:400*k,dS:300*k,dM:150*k,fuel:300*(1+M.ftrFuel)}));f.dx=clamp(c.x+d.x*25,5,W-5);f.dy=clamp(c.y+d.y*25,5,H-5);}
  else{const ld=1+M.ftrLoad,aam=Math.min(Math.round((kind==='cap'?8:4)*ld),c.aamS);c.aamS-=aam;const asm=kind==='stk'?Math.min(Math.round(4*ld),c.asmS):0;c.asmS-=asm;B.fn++;const nm=CALL[(B.fn-1)%CALL.length]+(Math.floor((B.fn-1)/CALL.length)+1),r=1+M.ftrRad;
    f=mk(Object.assign(base,{key:'ftr',name:nm,lab:nm,sym:kind==='cap'?'CAP':'攻撃隊',spd:15,hp:2,max:2,n:2,dA:160*r,dS:200*(1+M.ftrRad*.5),dM:80*(1+M.ftrRad*.5),aam,aamR:80*(1+M.ftrAamR),aamPk:clamp((.6+M.ftrAam+(c.airB||0))*c.q,.2,.92),
      asm,asmR:110*(1+M.ftrAsmR),asmDmg:50*(1+M.asmDmg),pkB:M.asmPen,asmV:15*(1+M.asmSpd),fuel:150*(1+M.ftrFuel)}));
    if(kind==='cap'){f.dx=clamp(c.x+d.x*40,5,W-5);f.dy=clamp(c.y+d.y*40,5,H-5);}}
  return f;}
const SLOTK={cv:'cvl',cvl:'cvl',ddg:'ddg',ddgx:'ddg',dd:'dd',dd2:'dd',ffm:'ffm',ffm2:'ffm',opv:'ffm',usv:'usv',ss:'ss',ssx:'ss',aoe:'aoe'};
const SLOT={cvl:[[0,0],[-20,14]],ddg:[[26,-12],[26,12],[42,0]],dd:[[10,-31],[10,31],[-16,-26],[-16,26]],ffm:[[-24,0],[-28,-16],[-28,16],[-36,-8],[-36,8]],usv:[[18,0],[14,-18],[14,18]],ss:[[80,-34],[80,34],[100,0]],aoe:[[-40,0],[-44,12]]};
function setupP(us,pc){const d=norm(B.sp.x-pc.x,B.sp.y-pc.y),p={x:-d.y,y:d.x},at=(a,b)=>({x:clamp(pc.x+d.x*a+p.x*b,8,W-8),y:clamp(pc.y+d.y*a+p.y*b,8,H-8)}),cnt={};
  for(const su of us){const k=SLOTK[su.type]||'ffm',i=cnt[k]=(cnt[k]||0)+1,sl=SLOT[k],s=sl[(i-1)%sl.length],ov=Math.floor((i-1)/sl.length),q=at(s[0]-ov*12,s[1]+ov*7);pShip(su,q.x,q.y);}}
function setupE(f){const sp=B.sp,o=B.obj,d=norm(o.x-sp.x,o.y-sp.y),p={x:-d.y,y:d.x},at=(a,b)=>({x:clamp(sp.x+d.x*a+p.x*b,6,W-6),y:clamp(sp.y+d.y*a+p.y*b,6,H-6)}),n=k=>f[k]||0,big=n('ecg')+n('eddg');
  const subX=()=>({reveal:Math.random()<clamp(B.M.sosus,0,.9)?25:0});
  if(B.sc==='retake'){const tot=Math.max(1,big+n('eff'));let k=0;const put=key=>{const a=k++/tot*6.283+R(-.3,.3),r=R(12,24);mkE(key,o.x+Math.cos(a)*r,o.y+Math.sin(a)*r,'guard');};
    for(let i=0;i<n('ecg');i++)put('ecg');for(let i=0;i<n('eddg');i++)put('eddg');for(let i=0;i<n('eff');i++)put('eff');
    for(let i=0;i<n('ess');i++)mkE('ess',o.x-R(30,70),o.y+R(30,70),'sub',subX());
    for(const k2 of['eftr','estl'])for(let i=0;i<n(k2);i++)mkE(k2,o.x+R(-20,20),o.y+R(-20,20),'ftr',{orbit:true});return;}
  let lst=null;
  for(let i=0;i<n('elst');i++){const q=at(0,(i-(n('elst')-1)/2)*14),l=mkE('elst',q.x,q.y,'lst');lst=lst||l;}
  const esc=(key,a,b)=>{const q=at(a,b),e=mkE(key,q.x,q.y,'surf',{ox:R(-12,12),oy:R(-12,12)});if(lst){e.fx=e.x-lst.x;e.fy=e.y-lst.y;}};let bi=0;
  for(const k2 of['ecg','eddg'])for(let i=0;i<n(k2);i++){esc(k2,22,(bi-(big-1)/2)*26);bi++;}
  for(let i=0;i<n('eff');i++)esc('eff',36+(i%2)*8,(i-(n('eff')-1)/2)*30);
  if(n('ecv')){const q=at(-5,40);mkE('ecv',q.x,q.y,'cv');}
  for(let i=0;i<n('ess');i++){const t=R(.4,.65);mkE('ess',sp.x+(B.pc.x-sp.x)*t+R(-40,40),sp.y+(B.pc.y-sp.y)*t+R(-40,40),'sub',subX());}
  const t0=B.sc==='airraid'?R(10,30):R(40,90);
  for(let i=0;i<n('ebmr');i++)B.pend.push({sp:1,t:t0+R(0,12),f:()=>{const q=at(R(-5,5),R(-40,40));mkE('ebmr',q.x,q.y,'bmr');}});
  for(const k2 of['eftr','estl'])for(let i=0;i<n(k2);i++)B.pend.push({sp:1,t:Math.max(1,t0+R(-3,6)),f:()=>{const q=at(R(0,10),R(-40,40));mkE(k2,q.x,q.y,'ftr');}});}
function startBattle(inc){
  const drill=!!inc.drill,us=S.units.filter(u=>u.mode==='normal'&&(drill||u.sector===inc.sector)),rein=drill?[]:reserve();
  if(!us.length&&!rein.length){toast('出撃できる部隊がない');return;}
  _M=null;const M=mods(),eT=inc.eT||0,C=S.cfg;
  B={inc,drill,M,eT,sc:inc.type,iname:ISL[inc.sector]||'演習島',t:0,u:[],m:[],ui:{},mi:{},uid:0,mid:0,fx:[],log:[],pend:[],sel:[],tsel:null,hot:false,auth:false,pre:false,eWd:false,over:null,paused:true,speed:1,
    obj:{x:255,y:285,r:22},pc:{x:125,y:405},base:{x:14,y:H-14},sp:pick([{x:260,y:22},{x:455,y:55},{x:472,y:240}]),cam:{x:W/2,y:H/2,z:1},k:1,cw:300,ch:300,dpr:1,g:null,
    view:ui.view||'2d',c3:Object.assign({},C3DEF),fol:false,
    dT:0,aT:0,intelT:15,intel:null,zoneT:0,landT:0,landNeed:Math.max(10,20+M.garr),warnCd:0,warnN:0,fireAt:null,vampCd:0,satT:Math.max(0,M.satT),sup:eT>=3?2:(inc.L>=2.6||eT>=1)?1:0,
    antiSS:clamp(M.antiSS,0,.25),asmLow:clamp(M.asmLow,0,.6),antiLO:M.antiLO,jam:clamp(M.jam,0,.5),eIn:25*(1+clamp(M.eIntel,-.5,2)),reinT0:reinTime(),
    willFire:inc.type!=='intrusion'||Math.random()<clamp((S.tension*C.eAggr-10)/80+.15,.25,.95),
    eAir:0,pAir:0,eLost:0,eInit:0,pursuitK:0,divert:{ftr:0,aew:0},st:{sam:0,asm:0,aam:0,torp:0},ec:{},fn:0,tmax:420,intruded:false,logD:true,mk:null};
  if(inc.type==='landing'||inc.type==='retake'){B.hot=true;B.auth=true;}
  for(const k in inc.force)B.eInit+=ET[k].val*inc.force[k];
  setupP(us,B.pc);setupE(inc.force);
  if(rein.length)B.pend.push({rein:1,t:B.reinT0,f:()=>{setupP(rein,{x:B.pc.x-35,y:B.pc.y+35});blog(`母港からの増援が到着：${rein.map(u=>u.name).join('、')}`,'g');banner('増援　到着','g');if(B.speed>4)setSpeed(4);uiRefresh(true);}});
  B.intel={x:B.pc.x+R(-B.eIn,B.eIn),y:B.pc.y+R(-B.eIn,B.eIn)};
  blog(`${drill?'図上演習':SCN[B.sc].n}　目標：${SCN[B.sc].o}`,'b');
  if(rein.length)blog(`母港の部隊が増援に向かっている。到着は${B.reinT0}分後(海域の南西)`,'');
  if(B.sup)blog(B.sup>=2?'敵は極超音速の対艦ミサイルを配備している':'敵は超音速の対艦ミサイルを配備している','am');
  if(B.hot)blog('防衛出動が発令されている。武器の使用は自由','am');else blog('武器の使用は許可されていない。敵が撃つまで監視と警告のみ','');
  detect();
  $('#hq').hidden=true;$('#bt').hidden=false;fit();setSpeed(0);setView(B.view);uiRefresh(true);banner('作戦開始　速度ボタンで時間を進める','');
  lastTs=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(frame);}

/* ---------- 兵装(高速ミサイル・被害軽減・回避を反映) ---------- */
function fireASM(u,t,n,d0){n=Math.min(n,u.asm);const spd=u.side==='E'?(B.sup>=2?55:B.sup?32:15):(u.asmV||15);
  for(let i=0;i<n;i++)reg({side:u.side,type:'asm',x:u.x,y:u.y,spd,ss:spd>25,hs:spd>45,tgt:t.id,tm:false,dmg:u.asmDmg,pkB:u.pkB||0,life:60,delay:(d0||0)+i*.12});u.asm-=n;if(u.side==='P')B.st.asm+=n;return n;}
function fireTorp(u,t,n,kind){n=Math.min(n,u.torp);const asw=kind==='asw';for(let i=0;i<n;i++)reg({side:u.side,type:'torp',asw,x:u.x,y:u.y,spd:asw?18:1.6,tgt:t.id,tm:false,dmg:(asw?70:95)*(u.torpDmg||1),pk:clamp((asw?.45:.75)+(u.aswB||0),.1,.95),life:asw?5:40,delay:i*.3});u.torp-=n;if(u.side==='P')B.st.torp+=n;return n;}
function impact(m,t){m.dead=true;
  if(m.type==='sam'||m.type==='aam'){
    if(m.tm){const pen=t.ss?Math.max(0,(t.hs?.28:.15)-(t.side==='E'?B.antiSS:0)):0;if(Math.random()<m.pk-pen){t.dead=true;fx(t.x,t.y,'int');}else t.eng=Math.max(0,t.eng-1);}
    else if(Math.random()<m.pk&&!(t.surv&&Math.random()<t.surv)){t.n--;t.hp=t.n;fx(t.x,t.y,'hit',1);if(t.side==='E'){B.eAir++;B.eLost+=t.val/2;}else B.pAir++;if(t.n<=0)kill(t);else{t.eng=Math.max(0,t.eng-1);blog(`${t.name} 1機を${t.side==='P'?'喪失':'撃墜'}`,t.side==='P'?'r':'g');}}
    else t.eng=Math.max(0,t.eng-1);
    return;}
  if(m.type==='asm'){if(t.cat!=='ship')return;const pen=m.hs?.2:m.ss?.12:0;
    if(t.gun&&Math.random()<t.gun){fx(t.x,t.y,'int');return;}
    if(t.luck&&Math.random()<t.luck){blog(`${t.name} 間一髪でミサイルを躱した`,'');return;}
    if(Math.random()<t.ecm-pen*.4-m.pkB){if(t.side==='P')blog(`${t.name} 電子妨害でミサイルを逸らした`,'');return;}
    if(Math.random()<t.ciws-pen-m.pkB*.5){fx(t.x,t.y,'int');if(t.side==='P')blog(`${t.name} 近接防御で撃墜`,'');return;}
    dmg(t,m.dmg*R(.8,1.2)*(1-(t.dc||0)),'被弾');return;}
  if(Math.random()<m.pk*(m.asw?1:1-(t.decoy||0)))dmg(t,m.dmg*R(.8,1.2)*(1-(t.dc||0)),m.asw?'に対潜弾命中':'被雷');else if(t.side==='P')blog(`${t.name} 魚雷を回避`,'');}
function detect(){const al=B.u.filter(u=>!u.dead);
  for(const t of al){let s=t.reveal>0||(B.satT>0&&t.side==='E'&&t.cat==='ship');
    if(!s)for(const o of al){if(o.side===t.side)continue;let r=t.cat==='air'?o.dA:t.cat==='sub'?o.so:(o.cat==='sub'?Math.max(o.dS,o.so):o.dS);
      if(t.cat==='ship'&&t.stealth)r*=1-t.stealth;else if(t.cat==='sub'&&t.quiet)r*=1-t.quiet;else if(t.cat==='air'&&t.lo)r*=Math.min(1,t.lo*(1+B.antiLO));
      if(r>0&&dist(o,t)<=r){s=true;break;}}
    if(s){if(t.side==='E'&&!t.rep){t.rep=true;blog(`新目標を探知：${t.name}`,'am');if(B.speed>4)setSpeed(4);}t.ls={x:t.x,y:t.y};}
    t.seen=s;}
  let nv=0,nt=0;
  for(const m of B.m){if(m.dead||m.delay>0)continue;if(m.type!=='asm'&&m.type!=='torp'){m.seen=true;continue;}let s=false;const k=m.side==='P'&&m.type==='asm'?1-B.asmLow:1;
    for(const o of al){if(o.side===m.side)continue;const r=(m.type==='asm'?o.dM:o.so*.6)*k;if(r>0&&dist(o,m)<=r){s=true;break;}}
    if(s&&!m.rep&&m.side==='E'){m.rep=true;if(m.type==='asm')nv++;else nt++;}m.seen=s;}
  if((nv||nt)&&B.vampCd<=0){B.vampCd=1.5;banner(nv?'対艦ミサイル接近':'魚雷音を探知','r');blog(nv?`敵対艦ミサイルを探知　${nv}発`:`敵魚雷を探知　${nt}本`,'r');if(B.speed>1)setSpeed(1);}}
function applyUnits(){
  for(const f of B.u){if(f.side!=='P'||f.cat!=='air'||f.dead)continue;const h=B.ui[f.home];
    if(h&&!h.dead){if(f.key==='aew')h.aew++;else{h.ftr+=f.n;h.aamS+=f.aam;h.asmS+=f.asm;}}else B.divert[f.key==='aew'?'aew':'ftr']+=f.n;}
  S.pool.ftr+=B.divert.ftr;S.pool.aew+=B.divert.aew;const win=B.over.res==='win';
  for(const b of B.u){if(b.side!=='P'||b.ref==null)continue;const su=U(b.ref);if(!su)continue;
    if(b.dead){sink(su);continue;}
    const t=PT[su.type];su.hp=Math.max(5,Math.round(b.hp/b.max*100));su.load.sam=b.sam;
    if(t.fcap){su.load.aam=Math.min(t.aam,b.aamS);su.load.aasm=Math.min(t.aasm,b.asmS);su.ftr=b.ftr+b.turn.reduce((a,x)=>a+x.n,0);su.aew=b.aew;}else{su.load.asm=b.asm;su.load.torp=b.torp;}
    su.tr=Math.min(100,su.tr+(B.hot?5:2));su.rd=Math.max(0,su.rd-(B.hot?6:2));
    for(const o of S.off)if(o.post&&o.post.startsWith(su.id+':')){o.bt++;o.merit+=(B.hot?4:2)+(win?2:0);if(B.hot&&Math.random()<.3){const k=pick(ABK);if(o[k]<o.pot)o[k]++;}}}
  for(const k of['avm','avo'])S.enl[k].n=Math.max(0,S.enl[k].n-B.pAir);
  S.pers.morale=clamp(S.pers.morale+(win?3:B.over.res==='draw'?-1:-4),5,100);_M=null;}
