/* ================= 航空部隊と空の作戦 ================= */
for(const k of ATK)SHOPX['a_'+k]={kind:'airu',n:AT[k].n,cost:AT[k].cost,build:AT[k].build,q:1,d:AT[k].d};
const AIRB=[0,1,4,7];
const airAt=z=>(S.air||[]).filter(a=>a.base===z);
const airBaseOK=z=>z===0||(ISLZ.includes(z)&&S.sectors[z].held&&facOK(z,'air'));
const airCap=z=>z===0?10:ISLZ.includes(z)&&S.sectors[z].held?3:0;
const airRng=a=>ARNG[a.type]+((a.type==='ftr'||a.type==='atk'||a.type==='ewa')&&S.air.some(t=>t.type==='tkr'&&t.base===a.base&&t.n>0&&t.rdy>=20)?1:0);
const airOK=a=>a.n>0&&a.rdy>=15&&airBaseOK(a.base);
const airCover=(z,type)=>(S.air||[]).filter(a=>a.type===type&&airOK(a)&&HOP[a.base][z]<=airRng(a));
const airForce=z=>(S.air||[]).filter(a=>(a.type==='ftr'||a.type==='atk')&&airOK(a)&&HOP[a.base][z]<=airRng(a));
const ebDist=(b,z)=>1+Math.min(99,...ADJ[z].filter(n=>!ZONES[n].enemy).map(n=>HOP[b][n]));
const airStrikers=z=>(S.air||[]).filter(a=>(a.type==='bmr'||a.type==='atk')&&airOK(a)&&a.rdy>=40&&(ZONES[z].enemy?ebDist(a.base,z):HOP[a.base][z])<=airRng(a));
const airBaseName=z=>z?ISL[z]+'飛行場':'本土基地';
const airAv=a=>Math.max(0,Math.round(a.n*clamp(a.rdy/100,.2,1)*.5/2)*2);   // 一度の戦闘に出せる機数(2機単位)
const atWar=()=>ISLZ.some(z=>!S.sectors[z].held)||S.efl.some(e=>e.known)||S.month-(S.lastHot==null?-99:S.lastHot)<=3;
const ebDmg=z=>((S.ebase||{})[z]||{dmg:0}).dmg;
function addAir(type,base,o){o=o||{};S.aseq[type]=(S.aseq[type]||0)+1;const t=AT[type],a={id:++S.aid,type,name:`第${S.aseq[type]}${t.n}`,base:base||0,n:t.ac,rdy:o.rdy==null?85:o.rdy,tr:o.tr==null?RI(55,70):o.tr};S.air.push(a);_M=null;return a;}
function airPower(z){const w={ftr:28,atk:40,bmr:30,ewa:10,aew:14,mpa:8};let p=0;for(const a of S.air||[]){if(!w[a.type]||!airOK(a)||HOP[a.base][z]>airRng(a))continue;p+=w[a.type]*a.n/AT[a.type].ac*a.rdy/100*(.6+.4*a.tr/100);}return p*(1+mods().airPow);}
// 上陸作戦に出せる部隊：その海域の艦隊に乗っている部隊と、輸送航空隊が届くなら本土の空挺
function landForce(z){const emb=S.fleets.filter(f=>f.zone===z).reduce((a,f)=>a.concat(fleetLoad(f)),[]);return emb.concat(S.gnd.filter(g=>g.type==='abn'&&g.loc==='home').slice(0,airCover(z,'trn').length));}
function raidLoss(z){const il=S.isl[z];for(const k of['radar','air','port','depot'])il.fac[k]=Math.min(il.fac[k],RI(0,30));hlog(`${ISL[z]}：敵の特殊部隊に施設を破壊された`,'r');return '特殊部隊は施設を破壊して引き揚げた。レーダーサイト・飛行場・港湾・補給処が使えない';}
/* ---------- 月ごとの処理：稼働率、緊急発進、哨戒 ---------- */
function airMonth(rep){if(!S.air)return;const M=mods(),C=S.cfg;
  for(const a of S.air)if(a.base&&!(ISLZ.includes(a.base)&&S.sectors[a.base].held)){const l=Math.ceil(a.n*.3);a.n=Math.max(1,a.n-l);a.base=0;a.rdy=Math.min(a.rdy,30);rep.push([`${a.name}は基地を失い、本土へ退いた(${l}機を喪失)`,'r']);}
  for(const a of S.air){const t=AT[a.type],ok=airBaseOK(a.base);a.rdy=clamp(a.rdy+(ok?12:3)*(1+M.airRdy)-(a.type==='mpa'?4:a.type==='uav'?2:0),0,100);{const c=postMap()['air:'+a.id];a.tr=clamp(a.tr+.5*(1+M.trGain)*(c?1+(c.cmd-10)*.04:.8),0,100);}
    if(a.n<t.ac&&ok&&S.month%2===0){const c=Math.round(t.cost/t.ac*.5);if(canPay(c)){spend(c);a.n++;}}}
  // 緊急発進：国籍不明機は緊張が高いほど多く来る。届く戦闘飛行隊がいなければ取り逃がす
  let tot=0,okN=0,miss=0;const byZ={};
  for(const z of AIRB){if(z&&!S.sectors[z].held)continue;const lam=(z?1:.6)*(.3+S.tension/70)*C.eAggr*(z?1+S.sectors[z].threat/250:1);let n=0;for(let i=0;i<6;i++)if(Math.random()<lam/6)n++;if(!n)continue;
    const aew=airCover(z,'aew').length>0,rad=z===0||facOK(z,'radar');let h=0,x=0;
    for(let i=0;i<n;i++){const sq=airCover(z,'ftr').sort((a,b)=>b.rdy-a.rdy)[0];if(!sq){x++;continue;}
      const cm=postMap()['air:'+sq.id],p=clamp(.6+M.scr+(aew?.12:0)+(rad?.08:-.1)+(sq.tr-60)/300+(sq.base===z?.06:0)+(cm?(effAb(cm,'atk')-10)*.008:-.04),.15,.97);sq.rdy=Math.max(0,sq.rdy-(sq.base===z?4:6));sq.tr=Math.min(100,sq.tr+.3);
      if(Math.random()<p)h++;else x++;
      if(sq.rdy<25&&sq.n>1&&Math.random()<.04){sq.n--;rep.push([`${sq.name}：緊急発進の事故で1機を失った`,'r']);}}
    tot+=n;okN+=h;miss+=x;byZ[z]=[h,x];if(z)S.sectors[z].threat=clamp(S.sectors[z].threat+1.5*x-.6*h,5,100);}
  S.scrM={m:S.month,tot,ok:okN,miss,byZ};S.stats.scr+=okN;S.stats.scrMiss+=miss;
  if(tot){if(!miss)S.tension=clamp(S.tension-.3,0,100);S.support=clamp(S.support-Math.min(1.2,miss*.25)+(miss?0:.2),0,100);rep.push([`緊急発進 ${tot}回：対処 ${okN}${miss?`、取り逃がし ${miss}`:''}`,miss?'am':'']);}
  // 哨戒機は受け持つ海域の敵活動を抑え、無人偵察機と哨戒機は侵攻部隊を見つける
  ZONES.forEach((Z,z)=>{if(Z.enemy||Z.home)return;const n=Math.min(2,airCover(z,'mpa').length);if(n&&(Z.lane||S.sectors[z].held))S.sectors[z].threat=clamp(S.sectors[z].threat-1.1*n,5,100);});
  for(const e of S.efl)if(!e.known&&(airCover(e.z,'uav').length||airCover(e.z,'mpa').length)&&Math.random()<.5){e.known=1;rep.push([`航空偵察が敵の揚陸部隊を捉えた。目標は${ISL[e.z]}、到達まであと${e.eta}か月`,'r']);}
  for(const k in S.ebase)S.ebase[k].dmg=Math.max(0,S.ebase[k].dmg-5);
  // 特殊部隊の襲撃：緊張が高いと、守りの薄い島に潜水艦から少数が上がってくる
  if(!S.gpend&&S.month>6&&Math.random()<clamp((S.tension-35)/700,0,.07)*C.incF){const zs=ISLZ.filter(z=>S.sectors[z].held&&garrison(z).length&&!S.efl.some(e=>e.z===z)&&!airCover(z,'mpa').length);
    if(zs.length){const z=pick(zs);S.gpend={z,L:1.2,fr:.5,raid:1,force:[{t:'amp',hp:9},{t:'inf',hp:8}].concat(S.tension>60?[{t:'amp',hp:8}]:[])};rep.push([`${ISL[z]}に敵の特殊部隊が上陸した`,'r']);}}}
/* ---------- 海戦に加わる基地航空 ---------- */
const abTx=h=>{const s=selUnits();return s.length===1&&s[0].ab?h.replace(/船体/g,'施設').replace(/甲板/g,'滑走路').replace(/発艦/g,'発進'):h;};
function airMods(M,z){if(!S.air)return;const c=t=>airCover(z,t).length;if(c('aew')){M.radA+=.15;M.radM+=.1;}if(c('mpa')){M.sosus+=.2;M.sonar+=.1;}if(c('ewa'))M.jam+=.12;if(c('uav')){M.radS+=15;M.eIntel+=.2;}}
function airSetup(z,drill){const o=B.obj,M=B.M,all=!S.air?[]:drill?S.air.filter(a=>a.n>0):S.air.filter(a=>airOK(a)&&HOP[a.base][z]<=airRng(a));
  const mk=(list,here)=>{let ftr=0,aew=0,asm=0;const sq=[];
    for(const a of list){if(a.type==='ftr'||a.type==='atk'){const v=airAv(a);if(v<2)continue;ftr+=v;if(a.type==='atk')asm+=v*2;sq.push([a.id,v,0]);}else if(a.type==='aew'&&!aew){aew=1;sq.push([a.id,0,1]);}}
    if(!ftr&&!aew)return null;
    return mkSite(Object.assign({cvf:true,ab:1,ftr,aew,ftr0:ftr,aew0:aew,aamS:ftr*6,asmS:asm,sq,sym:'AB'},here?{name:B.iname+' 航空基地',lab:'航空基地',x:o.x+9,y:o.y-9,hp:110,max:110,dA:120,dS:30,dM:20,fref:z&&!drill?'air':null}:{name:'域外の航空基地',lab:'域外基地',x:B.base.x,y:B.base.y,hp:400,max:400,stealth:1,far:1}));};
  B.ab=[mk(drill?all:all.filter(a=>a.base===z),true),mk(drill?[]:all.filter(a=>a.base!==z),false)].filter(Boolean);
  if(z===0&&!drill)mkSite({name:'本土 レーダーサイト',lab:'レーダー',sym:'RDR',x:o.x-4,y:o.y-3,dA:340*(1+M.radA),dS:80,dM:45});
  if(drill&&B.sc==='scramble'&&!B.ab.some(b=>b.ftr>=2)){B.ab=[mkSite({cvf:true,ab:1,ftr:8,aew:1,ftr0:8,aew0:1,aamS:48,asmS:0,sq:[],sym:'AB',lab:'航空基地',name:'演習島 航空基地',x:o.x+9,y:o.y-9,hp:110,max:110,dA:320,dS:30,dM:20})];}
  if(B.ab.length)blog(`基地の航空部隊が加わる：${B.ab.map(b=>`${b.lab}(戦闘機${b.ftr}機${b.aew?'、警戒機1機':''})`).join('、')}。基地をタップして発進させる`,'');
  if(B.airOnly){const b=B.ab.find(x=>!x.far&&x.ftr>=2)||B.ab.find(x=>x.ftr>=2);if(b){B.sel=[b.id];launch('cap');const f=B.u[B.u.length-1];B.sel=f&&f.cat==='air'?[f.id]:[];}
    blog('緊急発進した編隊を国籍不明機の15km以内に寄せ、「警告」を発する。領空(点線の内側)に入られる前に追い返せば最良','b');}}
// 領空侵犯：国籍不明機は島の上空へ進み、しばらく旋回して引き揚げる
function airSetupE(f){const sp=B.sp,o=B.obj;let k=0;
  for(const key of['erec','ebmr','euav','eftr','estl'])for(let i=0;i<(f[key]||0);i++){const esc=key==='eftr'||key==='estl',t0=R(1,4)+(esc?1:k++*4);
    B.pend.push({sp:1,t:t0,f:()=>{const e=mkE(key,sp.x+R(-25,25),sp.y+R(-10,10),'intr',{reveal:45,tx:R(-.5,.5)*o.r,ty:R(-.5,.5)*o.r,ph:0,ox:R(-6,6),oy:R(-6,6)});
      if(esc){const l=B.u.find(x=>x.side==='E'&&!x.dead&&x.role==='intr'&&!x.lead&&!x.aam);if(l)e.lead=l.id;}}});}}
function airIntr(e,P,E){const o=B.obj;
  if(B._zt!==B.t){B._zt=B.t;if(E.some(x=>x.role==='intr'&&!x.wd&&dist(x,o)<o.r)){B.zoneT+=.5;if(B.zoneT>3&&!B.intruded){B.intruded=true;banner('領空侵犯を確認','am');blog('国籍不明機が領空に入った。警告を続けよ','am');uiRefresh(true);}}}
  if(B.hot){if(e.aam>0)e.role='ftr';else if(e.asm>0)e.role='bmr';else egress(e);return;}
  if(e.wd||e.ph===2)return egress(e);
  const l=e.lead?B.ui[e.lead]:null;if(l&&!l.dead){e.dx=clamp(l.x+e.ox,4,W-4);e.dy=clamp(l.y+e.oy,4,H-4);return;}
  if(!e.ph){e.dx=clamp(o.x+e.tx,4,W-4);e.dy=clamp(o.y+e.ty,4,H-4);if(dist(e,{x:e.dx,y:e.dy})<5){e.ph=1;e.lt=B.t+R(6,13);}}
  else{const a=B.t/4+e.id;e.dx=clamp(o.x+Math.cos(a)*o.r*.6,4,W-4);e.dy=clamp(o.y+Math.sin(a)*o.r*.6,4,H-4);if(B.t>e.lt)e.ph=2;}
  if(B.willFire&&e.asm>0)tryFire(e,P.filter(u=>u.seen&&u.cat==='ship'));}
function airWarn(){if(B.hot||B.over||B.eWd)return;
  const es=B.u.filter(u=>u.side==='E'&&!u.dead&&u.seen&&u.cat==='air');if(!es.length)return toast('警告する相手をまだ探知していない');
  const near=B.u.filter(u=>u.side==='P'&&!u.dead&&u.cat==='air'&&u.key==='ftr'&&es.some(e=>dist(u,e)<=15));if(!near.length)return toast('戦闘機を相手の15km以内まで寄せること');
  const go=()=>{if(B.warnCd>0)return toast(`次の警告まであと ${Math.ceil(B.warnCd)} 分`);B.warnCd=4;B.warnN++;blog('無線と機体信号で警告：「貴機は我が国の領空に接近している。直ちに針路を変えよ」','b');
    const p=clamp(.5-S.tension*S.cfg.eAggr/260+B.M.warn+Math.min(.12,(near.length-1)*.06)+(B.willFire?-.3:.08)-(B.warnN-1)*.04-(B.intruded?.04:0),.06,.9);
    B.pend.push({t:B.t+1,f:()=>{if(B.hot||B.over||B.eWd)return;
      if(Math.random()<p){for(const e of B.u)if(e.side==='E'&&e.role==='intr')e.wd=true;withdraw('警告に応じて変針');}
      else{blog('応答なし。針路を変えない','');if(B.warnN>=3&&B.intruded&&!B.auth){B.auth=true;banner('武器使用許可','am');blog('再三の警告を無視して領空を侵している。政府は武器の使用を認めた。もう一度「警告」を押すと、撃墜を命じられる','am');uiRefresh(true);}}}});uiRefresh(true);};
  if(B.auth){const was=B.paused;B.paused=true;confirmM('相手は再三の警告に応じない。<b class="r">撃墜</b>を命じることもできる。撃てば緊張は大きく高まる。',()=>{if(!was)setSpeed(B.speed);goHot('P');},'撃墜を命じる',()=>{if(!was)setSpeed(B.speed);go();});}
  else go();}
// 戦闘のあと：失った機数と疲労を飛行隊に戻す
function airApply(){if(!B.ab||B.drill)return;const hot=B.hot;
  for(const b of B.ab){const surv=(b.dead?0:b.ftr+b.turn.reduce((a,x)=>a+x.n,0))+(b.ret||0),lost=Math.max(0,b.ftr0-surv),lostA=Math.max(0,b.aew0-((b.dead?0:b.aew)+(b.retA||0)));
    const fs=b.sq.filter(q=>q[1]>0),tot=fs.reduce((a,q)=>a+q[1],0);let rem=lost;
    fs.forEach((q,i)=>{const a=S.air.find(x=>x.id===q[0]);if(!a)return;const l=i===fs.length-1?rem:Math.min(rem,Math.round(lost*q[1]/Math.max(1,tot)));rem-=l;a.n=Math.max(0,a.n-l);a.rdy=Math.max(0,a.rdy-(hot?14:6));a.tr=Math.min(100,a.tr+(hot?4:2));});
    for(const q of b.sq)if(q[2]){const a=S.air.find(x=>x.id===q[0]);if(!a)continue;if(lostA>0)a.n=Math.max(0,a.n-1);a.rdy=Math.max(0,a.rdy-6);}}
  S.air=S.air.filter(a=>{if(a.n>0)return true;hlog(`${a.name}は全機を失い、解隊された`,'r');return false;});if(hot)S.lastHot=S.month;}
function airSettle(o,inc){let dS=-o.pS*4,dT=0;const L=[],z=inc.sector,pp=S.cfg.prePen*(1-clamp(mods().prePen,-.3,.6)),shot=B&&B.inc===inc?B.eAir:0;
  if(o.pre){dS-=12*pp;dT+=12*pp;L.push('警告を尽くさないままの撃墜に、国内外から非難が集中した');}
  else if(o.res==='win'&&o.bloodless){S.stats.wins++;S.stats.blood0++;dS+=3;dT-=2;L.push('国籍不明機は針路を変え、領空の外へ去った');}
  else if(o.res==='win'){S.stats.wins++;dS+=shot?1:2;dT+=shot?6+shot:3;L.push(shot?'領空を侵した機を撃墜した。相手国は激しく抗議している':'交戦のすえ、相手は引き揚げた');}
  else if(o.res==='draw'){dS-=3;dT+=1;S.stats.scrMiss++;if(z)S.sectors[z].threat=clamp(S.sectors[z].threat+5,5,100);L.push('領空侵犯を許した。対処の遅れが批判された');}
  else{S.stats.loss++;dS-=5;dT+=3;L.push('対処に失敗した');}
  dS=Math.round(dS);dT=Math.round(dT);S.support=clamp(S.support+dS,0,100);S.tension=clamp(S.tension+dT,0,100);return{dS,dT,L};}
function airAuto(inc){const z=inc.sector,M=mods(),sq=airCover(z,'ftr').sort((a,b)=>b.rdy-a.rdy)[0];if(!sq)return airIgnore(inc);
  const ok=Math.random()<clamp(.55+M.scr+(airCover(z,'aew').length?.12:0)+(sq.tr-60)/250,.15,.95);sq.rdy=Math.max(0,sq.rdy-8);sq.tr=Math.min(100,sq.tr+1);
  const pol=airSettle({res:ok?'win':'draw',bloodless:ok,eS:0,pS:0},inc);hlog(`${SECT[z]}：${SCN.scramble.n} ― ${ok?sq.name+'が退去させた':'領空侵犯を許す'}`,ok?'g':'am');
  afterInc(`<div class="alert ${ok?'g':''}">${ok?'対処成功':'事態終息'}</div><h2>${SECT[z]}　${SCN.scramble.n}</h2><p class="sm">${sq.name}が緊急発進した。</p>${pol.L.map(l=>`<p class="sm">${l}。</p>`).join('')}<div class="pol">支持率 ${sg(pol.dS)}　緊張度 ${sg(pol.dT)}</div>`);}
function airIgnore(inc){const z=inc.sector;S.support=clamp(S.support-3,0,100);S.tension=clamp(S.tension+1,0,100);S.stats.scrMiss++;if(z)S.sectors[z].threat=clamp(S.sectors[z].threat+6,5,100);hlog(`${SECT[z]}：${SCN.scramble.n}に対処せず`,'r');
  afterInc(`<div class="alert r">静観</div><h2>${SECT[z]}</h2><p>国籍不明機は領空を横切り、悠々と引き揚げた。</p><div class="pol">支持率 −3　緊張度 +1</div>`);}
/* ---------- 敵の泊地への航空攻撃 ---------- */
function ebStrike(z){const sq=airStrikers(z),M=mods(),eb=S.ebase[z]||(S.ebase[z]={dmg:0}),war=atWar(),pp=S.cfg.prePen*(1-clamp(M.prePen,-.3,.6)),L=[];if(!sq.length||eb.m===S.month)return;let pow=0,lost=0;
  for(const a of sq){pow+=(a.type==='bmr'?16:9)*a.n/AT[a.type].ac*(.6+.4*a.tr/100);a.rdy=Math.max(0,a.rdy-35);a.tr=Math.min(100,a.tr+2);const l=Math.random()<clamp(.4+eTech()*.06,.1,.8)?RI(1,2):0;if(l&&a.n>1){a.n=Math.max(1,a.n-l);lost+=l;}}
  const d=Math.round(pow*(1+M.strk)*R(.8,1.2));eb.dmg=Math.min(100,eb.dmg+d);eb.m=S.month;L.push(`${sq.map(a=>a.name).join('、')}が泊地の施設と艦艇を攻撃した(損害 +${d}%、いま ${eb.dmg}%)`);
  if(lost)L.push(`<span class="r">防空網に阻まれ、${lost}機を失った</span>`);
  for(const e of S.efl)if(EBASE[e.z]===z&&e.eta>=2&&Math.random()<eb.dmg/120){e.eta++;L.push('集結していた揚陸部隊に損害を与え、出撃を遅らせた');}
  let dS,dT;if(war){dS=1;dT=4;L.push('侵攻への反撃として、国内はおおむね支持している');}else{dS=-Math.round(10*pp);dT=Math.round(14*pp);L.push('侵攻の兆しもないなかでの攻撃に、国内外から非難が集中した');}
  S.support=clamp(S.support+dS,0,100);S.tension=clamp(S.tension+dT,0,100);hlog(`${SECT[z]}：泊地を航空攻撃`,'b');checkOver();save();render();
  modal(`<div class="alert">航空攻撃</div><h2>${SECT[z]}</h2>${L.map(l=>`<p class="sm">${l}。</p>`).join('')}<div class="pol">支持率 ${sg(dS)}　緊張度 ${sg(dT)}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});}
/* ---------- 画面 ---------- */
function airRow(a){const t=AT[a.type],r=airRng(a),zs=ZONES.map((Z,i)=>i).filter(i=>!ZONES[i].enemy&&HOP[a.base][i]<=r),ok=airBaseOK(a.base);
  const mv=AIRB.filter(z=>z!==a.base&&airBaseOK(z)&&airAt(z).length<airCap(z));
  return `<div class="unit"><div class="uh"><span class="tag">${t.s}</span><b>${a.name}</b><span class="loc">${a.n}/${t.ac}機</span></div>
  <div class="st3"><div><label>稼働率 ${Math.round(a.rdy)}</label>${bar(a.rdy,a.rdy<30?'r':a.rdy<60?'am':'g')}</div><div><label>練度 ${Math.round(a.tr)}</label>${bar(a.tr,'b')}</div><div><label>${r}海域先まで</label></div></div>
  <p class="sm mut">${ok?'受け持ち：'+zs.map(i=>ZS[i]||ZONES[i].n).join('、'):'<span class="r">飛行場が使えず、飛べない</span>'}</p>
  <div class="urow"><label>基地</label><select onchange="A.amove(${a.id},+this.value)" aria-label="${a.name}の基地"><option value="-1">${airBaseName(a.base)}</option>${mv.map(z=>`<option value="${z}">→ ${airBaseName(z)}へ移す</option>`).join('')}</select><button class="btn sm" onclick="A.adis(${a.id})">解隊</button></div></div>`;}
UV.air=()=>{const m=S.scrM,st=S.stats;let h=`<section class="sec"><h2>航空部隊 ${S.air.length}個</h2><p class="mut sm">基地は本土と、飛行場のある3つの島。戦闘飛行隊は基地から2海域先までを受け持ち、国籍不明機が近づくと緊急発進する。受け持つ海域で海戦が起きれば、基地から戦闘機と攻撃機を出せる。新しい飛行隊は「調達」で編成する。</p>
  <dl class="kv2"><dt>先月の緊急発進</dt><dd>${m&&m.tot?`${m.tot}回(対処 ${m.ok}${m.miss?`、<span class="r">取り逃がし ${m.miss}</span>`:''})`:'なし'}</dd><dt>着任からの累計</dt><dd>対処 ${st.scr}、取り逃がし ${st.scrMiss}</dd></dl>
  <div class="brow"><button class="btn sm" onclick="A.adrill()">図上演習(緊急発進)</button></div></section>`;
  for(const z of AIRB){const sq=airAt(z),cap=airCap(z);if(z&&!S.sectors[z].held){h+=`<section class="sec"><h2>${airBaseName(z)}</h2><p class="al r">島は占領下にある</p></section>`;continue;}
    h+=`<section class="sec"><h2>${airBaseName(z)}　${sq.length}/${cap}</h2>${z&&!facOK(z,'air')?'<p class="al am">飛行場が損壊している。直るまで飛べない</p>':''}${sq.length?sq.map(airRow).join(''):'<p class="mut sm">飛行隊はいない</p>'}</section>`;}
  return h;};
VIEW.units=()=>subtabs('units',[['ships','艦艇'],['fleets','艦隊'],['air','航空'],['gnd','陸上'],['eq','装備']])+(UV[ui.sub.units]||UV.ships)();
function airZoneHTML(z){const Z=ZONES[z];if(!S.air)return'';
  if(Z.enemy){const sq=airStrikers(z),eb=S.ebase[z]||{dmg:0},dn=eb.m===S.month;
    return `<h3 class="sub">泊地への航空攻撃</h3><p class="sm">泊地の損害 ${eb.dmg}%。損害が大きいほど、ここから出る侵攻は遅れ、取りやめになりやすい(毎月5%ずつ復旧する)。${atWar()?'':'<br><span class="am">いまは侵攻の兆しがない。攻撃すれば先制攻撃として強い非難を受ける。</span>'}</p>
    <p class="sm mut">${sq.length?'出撃できる：'+sq.map(a=>a.name).join('、'):'届く爆撃飛行隊・攻撃飛行隊がいない(稼働率40以上が必要)'}</p><div class="brow"><button class="btn sm warn" ${sq.length&&!dn?'':'disabled'} onclick="A.ebs(${z})">${dn?'今月は実施済み':'航空攻撃を命じる'}</button></div>`;}
  const nm=t=>airCover(z,t).map(a=>a.name).join('、'),f=nm('ftr');
  let h=`<h3 class="sub">空の守り</h3><dl class="kv2"><dt>緊急発進</dt><dd>${f||'<span class="r">届く戦闘飛行隊がいない</span>'}</dd><dt>警戒・哨戒</dt><dd>${[nm('aew'),nm('mpa'),nm('uav')].filter(Boolean).join('、')||'なし'}</dd><dt>攻撃・支援</dt><dd>${[nm('atk'),nm('bmr'),nm('ewa')].filter(Boolean).join('、')||'なし'}</dd></dl>`;
  if(AIRB.includes(z)&&airCap(z)){const sq=airAt(z);h+=`<p class="sm mut">${airBaseName(z)}：${sq.length?sq.map(a=>a.name).join('、'):'飛行隊はいない'}(${sq.length}/${airCap(z)})</p>`;}
  return h;}
{const zp0=zonePanel,al0=alerts,shop0=VIEW.shop,home0=VIEW.home,ga0=gActs;
  zonePanel=function(z){const h=zp0(z),add=airZoneHTML(z);return add?h.replace(/<\/section>$/,add+'</section>'):h;};
  alerts=function(){const a=al0();if(S.air){for(const z of ISLZ)if(S.sectors[z].held&&!airCover(z,'ftr').length)a.push([`${ISL[z]}の空に届く戦闘飛行隊がいない。国籍不明機を取り逃がす`,'am']);if(S.scrM&&S.scrM.miss>=2)a.push([`先月は緊急発進で${S.scrM.miss}回取り逃がした`,'am']);}return a;};
  VIEW.shop=()=>shop0().replace('<h3 class="sub">航空機</h3>',`<h3 class="sub">航空部隊</h3>${ATK.map(k=>{const t=AT[k],c=price('a_'+k);return `<div class="item"><div class="uh"><b>${t.n}</b><span class="loc">${c.toLocaleString()}億円／${buildMo('a_'+k)}か月</span></div><p class="sm mut">${t.d}。${t.ac}機、維持費は月${t.up}億円</p><button class="btn sm" ${canPay(c)||c>=400?'':'disabled'} onclick="A.buy('a_${k}')">発注する</button></div>`;}).join('')}<h3 class="sub">艦上機(空母の予備機)</h3>`);
  VIEW.home=()=>home0().replace('onclick="A.gdrill()">図上演習(上陸戦)</button>','onclick="A.gdrill()">図上演習(上陸戦)</button><button class="btn sm" onclick="A.adrill()">図上演習(緊急発進)</button>');
  // 陸上部隊の空輸：輸送航空隊が月に1個ずつ運ぶ。空挺は飛行場のない島にも降りられる
  gActs=function(g){let h=ga0(g);if(!S.air||g.loc[0]==='f')return h;const from=g.loc==='home'?0:+g.loc.slice(1),free=S.air.filter(a=>a.type==='trn'&&airOK(a)&&a.liftM!==S.month),can=z=>free.some(a=>HOP[a.base][z]<=2&&HOP[a.base][from]<=2);let b='';
    if(from===0){for(const z of ISLZ)if(S.sectors[z].held&&(g.type==='abn'||facOK(z,'air'))&&can(z))b+=`<button class="btn sm" onclick="A.gair(${g.id},${z})">${ISL[z]}へ</button>`;}
    else if(facOK(from,'air')&&can(0))b=`<button class="btn sm" onclick="A.gair(${g.id},0)">本土へ</button>`;
    return h.replace('<div class="urow"><label>管理</label>',`<div class="urow"><label>空輸</label><div class="brow grow" style="margin:0">${b||`<span class="sm mut">${S.air.some(a=>a.type==='trn')?(free.length?'飛行場のある行き先に届かない':'今月の空輸は使い切った'):'輸送航空隊がない'}</span>`}</div></div><div class="urow"><label>管理</label>`);};}
Object.assign(A,{
  amove(id,z){const a=S.air.find(x=>x.id===id);if(!a||z<0||z===a.base)return;if(!airBaseOK(z)||airAt(z).length>=airCap(z)){render();return toast('その基地には移せない');}a.base=z;a.rdy=Math.max(0,a.rdy-20);save();render();toast(`${a.name}：${airBaseName(z)}へ移った(稼働率 −20)`);},
  adis(id){const a=S.air.find(x=>x.id===id);if(!a)return;confirmM(`${a.name}を解隊する。機体は戻らない。`,()=>{S.air=S.air.filter(x=>x!==a);hlog(`${a.name}を解隊`,'');save();render();},'解隊する');},
  gair(gid,z){const g=S.gnd.find(x=>x.id===gid);if(!g||g.loc[0]==='f')return;const from=g.loc==='home'?0:+g.loc.slice(1),sq=S.air.find(a=>a.type==='trn'&&airOK(a)&&a.liftM!==S.month&&HOP[a.base][z]<=2&&HOP[a.base][from]<=2);
    if(!sq||(z&&!(S.sectors[z].held&&(g.type==='abn'||facOK(z,'air'))))||(from&&!facOK(from,'air')))return toast('空輸できない');
    g.loc=z?'i'+z:'home';sq.liftM=S.month;sq.rdy=Math.max(0,sq.rdy-10);save();render();toast(`${g.name}：${sq.name}が${z?ISL[z]:'本土'}へ空輸した`);},
  ebs(z){if(S.pending||S.over||S.gpend)return;const sq=airStrikers(z);if(!sq.length)return toast('届く飛行隊がいない');
    confirmM(`<b>${SECT[z]}</b>の泊地を航空攻撃する。<br>出撃：${sq.map(a=>a.name).join('、')}<br>${atWar()?'侵攻への反撃として行う。緊張は高まる。':'<b class="r">侵攻の兆しがないなかでの先制攻撃になる。</b>支持率を大きく失い、緊張は一気に高まる。'}`,()=>ebStrike(z),'攻撃を命じる');},
  adrill(){if(S.pending||S.gpend||B||G)return;const z=ISLZ.find(i=>S.sectors[i].held)||1,L=1.6;startBattle({drill:true,sector:z,type:'scramble',L,eT:eTech(),force:{ebmr:1,eftr:1},intel:''});},
  csa(k,d,max){ui.cs.air=ui.cs.air||Object.assign({},DEFCFG.air);ui.cs.air[k]=clamp((ui.cs.air[k]||0)+d,0,max);showSetup();}
});
