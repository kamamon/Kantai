/* ================= 本土への陸からの侵攻 ================= */
// 陸で接する国との国境の緊張、開戦、前線の動き、都市の攻防、講和。
// S.lw={e:相手国, m0:開戦の月, att:こちらから起こした, st:構え, es:敵の勢い, ex:疲弊, k:先月の前線, bat:決着待ちの都市, q:[知らせ], sh:攻勢が止まる月}
// [キー, 名称, 説明, 防衛力の倍率, 損害の倍率]
const LWST=[['hold','持久防御','陣地に籠もって前線を保つ。損害は少ないが、失った土地は取り戻しにくい',1.25,.7],['mob','機動防御','守りながら、押し返せるところで押し返す',1,1],['ctr','反攻','損害をいとわず攻める。失地を取り戻し、そのまま相手の領内へ進む',.86,1.4]];
const LWTER=[1,1,1.08,1.14,1.18,1.32,1,1.08];
let _lwC=null,_lwV=-1,_shC=null,_shV=-1;
// 国境のようす：陸で接する国、失った土地、国境の地形
function lwGeo(){const Wd=WORLD,v=Wd.ver||0,me=ME();if(_lwC&&_lwV===v&&_lwC.me===me)return _lwC;const P=Wd.P,ow=Wd.pown,nb={},lost={};let tk=0,tn=0,orig=0,got=0,cap=null;
  for(const p of P){const o=ow[p.id];if(p.nat===me){orig++;if(p.cap)cap=p;if(o!==me)lost[o]=(lost[o]||0)+1;}
    if(o!==me)continue;if(p.nat!==me)got++;let b=0;for(const q of p.adj){const x=ow[q];if(x!==me){nb[x]=(nb[x]||0)+1;b=1;}}if(b){tk+=LWTER[p.ter]||1;tn++;}}
  _lwV=v;return _lwC={me,nb,lost,ter:tn?tk/tn:1,orig,got,cap};}
const lwNb=()=>Object.keys(lwGeo().nb).map(Number);
const lwOcc=()=>Object.values(lwGeo().lost).reduce((a,v)=>a+v,0);
const lwHot=e=>{const me=ME();return S.w.hot.find(h=>(h.a===me&&h.b===e)||(h.b===me&&h.a===e));};
const lwCapLost=()=>{if(!S||!S.w||!WORLD||!WORLD.pown)return false;const c=lwGeo().cap;return !!c&&WORLD.pown[c.id]!==ME();};
const lwOverText=()=>{const c=lwGeo().cap;return `${natN(WORLD.pown[c.id])}軍が首都${NAT.cap}に入り、政府は降伏した。`;};
// 州のうち自国が押さえている割合。中心都市を失った州は0
function stHeld(st){const Wd=WORLD,v=Wd.ver||0;if(_shV!==v||!_shC||_shC.me!==ME()){_shC={me:ME()};_shV=v;}let f=_shC[st.id];if(f===undefined){const me=ME(),ow=Wd.pown;f=_shC[st.id]=ow[st.city]!==me?0:st.provs.filter(p=>ow[p]===me).length/st.provs.length;}return f;}
const heldSt=()=>myStates().filter(st=>stHeld(st)>0);
/* ---------- 兵力 ---------- */
// 本土の防衛力：本土の陸上部隊＋郷土防衛隊(兵役と基地)＋本土の飛行隊、に同盟と地形を掛ける
function lwPow(){const M=mods(),me=ME(),W=S.w,al=natAlive(),G=lwGeo(),L=S.lw,un=S.gnd.filter(g=>g.loc==='home');
  const field=gstr(un,g=>.8+.4*g.tr/100)*(1+(M.gndPow||0)),guard=natEco()[me]*.026*[1,1.7,2.6][S.pol.law.con]*(1+Math.min(.5,.08*bldSum('base'))),air=airPower(0)*.7;
  const pb=W.n[me].bloc,nb=pb?W.n.filter((n,i)=>i!==me&&al[i]&&n.bloc===pb&&!(L&&L.e===i)).length:0,nd=W.n.filter((n,i)=>i!==me&&al[i]&&n.def&&!(pb&&n.bloc===pb)).length,ally=Math.min(.3,.05*nb)+Math.min(.24,.08*nd);
  const tot=(field+guard+air)*(1+ally),ter=G.ter*1.1;return{n:un.length,field,guard,air,ally,ter,tot,def:tot*ter};}
// 相手がこの国境に回してくる兵力。大国は小国を相手に全力を出さない
function lwEnemy(e){const W=S.w,al=natAlive(),me=ME(),eco=natEco(),n=W.n[e];
  const rel=Math.min(1,Math.sqrt(Math.max(1,eco[me])/Math.max(1,eco[e]))*1.3),bl=n.bloc?Math.min(.2,.04*W.n.filter((x,k)=>k!==e&&k!==me&&al[k]&&x.bloc===n.bloc).length):0;
  return natPw()[e]*.074*rel*(1+bl)*(e===RVN()?W.rivK:1)*clamp(1+.04*eTech(),.75,1.5)*(.8+.2*S.cfg.eAggr);}
// 交戦中の相手の兵力。損害で勢いが落ち、こちらの領内に深く入るほど補給が伸びて息切れする
const lwE=()=>{const L=S.lw;return lwEnemy(L.e)*L.es*clamp(1-.02*lwOcc(),.72,1);};
/* ---------- 国境の緊張 ---------- */
function lwSync(){if(!S||!S.w)return;const W=S.w,me=ME(),rv=RVN(),pb=W.n[me].bloc;if(S.lw===undefined)S.lw=null;
  for(const e of lwNb()){if(lwHot(e))continue;const n=W.n[e],hostile=n.rel<-15||(n.bloc===2&&pb!==2);W.hot.push({a:Math.min(me,e),b:Math.max(me,e),t:e===rv?RI(38,48):hostile?RI(26,40):RI(6,20)});}}
function lwMonth(rep){const W=S.w,me=ME(),rv=RVN(),al=natAlive(),C=S.cfg;lwSync();if(S.lw)return lwStep(rep);if(C.landW===0||C.landW===false)return;
  const nbs=lwNb(),P=lwPow(),pb=W.n[me].bloc;
  for(const h of W.hot){if(h.a!==me&&h.b!==me)continue;const e=h.a===me?h.b:h.a,n=W.n[e];if(!al[e]||!nbs.includes(e)){h.t=Math.max(0,h.t-2);continue;}
    if(inWar(e)){h.t=clamp(h.t-1.2,0,100);continue;}
    const E=lwEnemy(e),det=P.def/Math.max(1,E),opp=(n.bloc===2&&pb!==2)||(pb&&n.bloc&&n.bloc!==pb),nap=n.nap>S.month,calm=h.calm>S.month;
    h.t=clamp(h.t+(R(-2.2,3.2)+(n.rel<-40?1.4:n.rel<-15?.6:n.rel>30?-2.2:n.rel>10?-1:0)+(opp?.5:0)+(n.gov===4?.4:0)+(e===rv?clamp((S.tension-45)*.05,-.8,1.2):0))*(.6+.4*C.eAggr)-(det>=1.25?1.4:det>=1?.6:det<.75?-.7:0)-(n.def?3:0)-(n.trd?.5:0)-(nap?4:0)-(calm?4:0),0,100);
    if(h.t<55){h.n1=0;h.n2=0;}
    if(h.t>=60&&!h.n1){h.n1=1;const t=`${natN(e)}が${NAT.n}との国境に兵力を集めている`;wNews(t,'am');rep.unshift(['国境：'+t,'am']);}
    if(h.t>=75&&!h.n2){h.n2=1;rep.unshift([`国境：${natN(e)}軍の動きが慌ただしい。侵攻の恐れがある(国政 → 国防)`,'r']);if(!S.pol.evq)S.pol.evq={k:'border',x:e};}
    if(h.t>=85&&S.month>=12&&!nap&&!calm&&n.rel<-10&&Math.random()<.22){
      if(E*R(.85,1.25)>P.def*.95){lwStart(e,rep);return;}
      if(h.t>=93){h.t-=RI(10,16);const t=`${natN(e)}は国境の部隊を引いた。${NAT.n}の守りを前に、踏み切れなかったとみられる`;wNews(t,'g');rep.push(['国境：'+t,'g']);}}}}
/* ---------- 開戦 ---------- */
function lwStart(e,rep,byMe){const W=S.w,me=ME(),rv=RVN(),n=W.n[e],h=lwHot(e),al=natAlive(),pb=W.n[me].bloc;
  S.lw={e,m0:S.month,att:byMe?1:0,st:byMe?'ctr':'hold',es:1,ex:0,k:0,bat:null,askM:null,offM:null,q:byMe?[]:[{k:'start'}],sh:0,lost:0,won:0};
  W.wars.push({id:++W.seq,a:byMe?me:e,d:byMe?e:me,m0:S.month,ex:0,pl:1});n.trd=0;n.def=0;n.imp=0;n.nap=0;n.rel=Math.min(n.rel,-70);n.rb=Math.min(n.rb||0,-30);if(h){h.t=100;h.calm=0;}
  S.tension=clamp(S.tension+(e===rv?15:5),0,100);S.support=clamp(S.support+(byMe?-2:4),0,100);if(!byMe)S.pol.stab=clamp(S.pol.stab+3,0,100);
  const t=byMe?`${NAT.f}が失地の奪還を掲げ、${NATS[e].f}に攻め込んだ`:`${NATS[e].f}が${NAT.f}に侵攻した`;wNews(t,'r');rep.unshift([(byMe?'開戦：':'侵攻：')+t,'r']);
  const fr=W.n.map((x,i)=>i).filter(i=>i!==me&&i!==e&&al[i]&&((pb&&W.n[i].bloc===pb)||W.n[i].def));
  if(fr.length&&!byMe){for(const i of fr)relAdd(i,3);wNews(`${fr.slice(0,4).map(natN).join('、')}${fr.length>4?'など':''}が${NAT.n}への支援を表明`,'g');}
  W.ver++;_M=null;}
/* ---------- 前線 ---------- */
// fromの土地をtoが取る。自国の州の中心都市は、守る部隊がいれば戦って決める
function lwPush(from,to,n,ownOnly){const Wd=WORLD,P=Wd.P,ow=Wd.pown,L=S.lw,me=ME(),tc=Wd.nat[from],cand=[],out={n:0,own:0,st:{}};
  const sc={};for(let p=0;p<P.length;p++)if(ow[p]===from&&(!ownOnly||P[p].nat===to)&&P[p].adj.some(q=>ow[q]===to)){cand.push(p);sc[p]=(P[p].nat===to?-1e6:0)+((P[p].x-tc.x)*(P[p].x-tc.x)+(P[p].y-tc.y)*(P[p].y-tc.y))*R(.55,1.45);}
  cand.sort((x,y)=>sc[x]-sc[y]);
  for(const p of cand.slice(0,n)){const s=Wd.ST[P[p].st],city=s.city===p&&P[p].nat===from;
    if(from===me&&city){if(S.gnd.some(g=>g.loc==='home')){L.bat=lwMkBat(p);break;}
      provTake(p,to);out.n++;out.st[stName(s)]=1;L.lost=(L.lost||0)+1;wNews(`${natN(to)}軍が${P[p].cap?'首都':''}${stCity(s)}を占領`,'r');if(P[p].cap)break;continue;}
    provTake(p,to);out.n++;if(P[p].nat===to)out.own++;out.st[stName(s)]=1;
    if(from!==me&&city){if(P[p].cap){L.capE=1;break;}wNews(`${NAT.n}軍が${natN(from)}の${stCity(s)}を占領`,'g');}}
  return out;}
function lwMkBat(p){const Wd=WORLD,pr=Wd.P[p],s=Wd.ST[pr.st],L=S.lw,ec=Wd.nat[L.e],dx=ec.x-pr.x,dy=ec.y-pr.y,r=lwE()/Math.max(1,lwPow().def);
  // 敵の数は、守る部隊の戦力と、前線全体の兵力差から決める
  const want=gstr(lwDefenders())*clamp(r,.6,1.8)*(pr.cap?1:.87),seq=['inf','arm','inf','art','inf','arm','aa'],force=[];for(let i=0;i<7&&(i<3||gstr(force)<want);i++)force.push({t:seq[i],hp:10});
  return{home:1,z:0,pid:p,seed:RI(1,999999999),name:stCity(s),sname:stName(s),ter:pr.ter,cap:pr.cap?1:0,dir:Math.abs(dy)>=Math.abs(dx)?(dy<0?0:2):(dx>0?1:3),L:pr.cap?2.8:2.4,fr:1,force};}
function lwStep(rep){const L=S.lw,W=S.w,me=ME(),e=L.e,rv=RVN(),n=W.n[e],mo=S.month-L.m0,st=LWST.find(x=>x[0]===L.st)||LWST[0],pw=lwPow(),E=lwE(),occ0=lwOcc();
  n.rel=Math.min(n.rel,-60);if(e===rv)S.tension=Math.max(S.tension,70);if(L.bat)return;
  // 相手の領内へ攻め込むと、守る側に回った相手は手強くなる
  const deep=L.st==='ctr'&&!occ0;let ratio=E*(deep?1.3+.07*lwGeo().got:1)/Math.max(1,pw.def*st[3])*R(.8,1.25)*(mo<2&&!L.att?1.15:1);if(L.sh>=S.month)ratio=Math.min(ratio,.97);
  let k=clamp(Math.round((ratio>=1?(ratio-1)*3:-(1/ratio-1)*3)+R(-.7,.7)),-3,3),took={n:0,st:{}},back=0,adv=0;
  if(k<0){if(L.st==='hold')k=occ0?-1:0;else if(L.st==='mob')k=occ0?Math.max(k,-2):0;else if(deep)k=Math.max(-2,k);}
  if(k>0)took=lwPush(me,e,k);else if(k<0){const r=lwPush(e,me,-k,L.st!=='ctr');back=r.own;adv=r.n-r.own;}
  L.k=took.n?took.n:-(back+adv);L.ex+=1+Math.abs(k)*.3;
  // 損害：本土の部隊と、出撃を重ねる本土の飛行隊
  const inten=.6+Math.abs(k)*.3,rA=clamp(ratio,.6,1.7);let dead=0;
  for(const g of S.gnd.filter(g=>g.loc==='home')){if(Math.random()>=clamp(.5*inten*rA*st[4],.08,.95))continue;g.hp-=RI(1,2)+(k>=2?1:0);g.tr=Math.min(100,g.tr+2);
    if(g.hp<=0){dead++;S.gnd=S.gnd.filter(x=>x!==g);S.enl.gnd.n=Math.max(0,S.enl.gnd.n-RI(40,90));rep.push([`${g.name}が本土の戦いで壊滅した`,'r']);}}
  for(const a of S.air||[])if(a.base===0&&airOK(a)&&(a.type==='ftr'||a.type==='atk'||a.type==='bmr'))a.rdy=Math.max(15,a.rdy-6);
  L.es=clamp(L.es-.03*inten*clamp(1/rA,.6,1.6)*(L.st==='ctr'?1.25:1)-Math.min(.03,airStrikers(0).length*.012)+.014,.45,1.1);
  const fr=lwOcc()/Math.max(1,lwGeo().orig);S.support=clamp(S.support-took.n*.5+back*.8+adv*.3-fr*2.5-(dead?1:0),0,100);n.stab=clamp(n.stab-.6-(k<0?1:0),5,95);
  const lr=[];if(L.bat)lr.push([`本土：${natN(e)}軍が${L.bat.cap?'首都':''}${L.bat.name}に迫っている`,'r']);
  if(took.n)lr.push([`本土：${natN(e)}軍が${took.n}プロヴィンスを占領(${Object.keys(took.st).join('、')})`,'r']);
  if(back)lr.push([`本土：${back}プロヴィンスを奪い返した`,'g']);if(adv)lr.push([`反攻：${natN(e)}の領内へ${adv}プロヴィンス進んだ`,'g']);
  if(!lr.length)lr.push(['本土：前線は動いていない','']);rep.unshift(...lr);
  W.ver++;_M=null;
  if(L.capE){lwEnd('win',rep);return;}
  if(!L.bat&&!lwCapLost()&&mo>=4&&S.month-(L.offM==null?-99:L.offM)>=4&&Math.random()<clamp((mo-3)*.03+L.ex*.004+(L.es<.7?.12:0)+(k<0?.06:0),0,.45)){L.offM=S.month;L.q.push({k:'offer'});}}
/* ---------- 講和 ---------- */
function lwTerms(){const occ=lwOcc(),got=lwGeo().got;
  if(got>=3&&got>occ){const v=100+got*30;return{k:'rep',v,t:`${NAT.n}は占領地から兵を引き、相手は賠償(国庫に${v}億円)を払う。国境は戦前の線に戻る`};}
  if(occ<=3)return{k:'sq',t:'双方が兵を引き、国境を戦前の線に戻す'};
  return{k:'cede',n:occ,t:`いま占領されている${occ}プロヴィンスを相手に割譲する`};}
function lwEnd(how,rep){const L=S.lw,W=S.w,P=WORLD.P,ow=WORLD.pown,me=ME(),e=L.e,rv=RVN(),n=W.n[e],h=lwHot(e),T=how==='win'?{k:'win'}:lwTerms();let t,c='g';
  const back=()=>{for(let p=0;p<P.length;p++)if(P[p].nat===me&&ow[p]===e)provTake(p,me);},out=()=>{for(let p=0;p<P.length;p++)if(P[p].nat!==me&&ow[p]===me)provTake(p,P[p].nat);};
  if(T.k==='win'){back();out();S.eco.tre+=600;S.funds+=300;S.support=clamp(S.support+12,0,100);S.pol.stab=clamp(S.pol.stab+8,0,100);S.stats.wins++;n.stab=30;n.ldr=mkName(NATS[e]);n.gov=n.gov>=3?0:n.gov;n.mil=Math.max(.6,+(n.mil-.15).toFixed(2));
    if(e===rv){W.rivK=Math.max(.75,W.rivK-.1);S.tension=clamp(S.tension-20,0,100);}else n.bloc=0;t=`${NATS[e].f}が降伏。${NAT.n}は占領地から兵を引き、賠償を受け取った`;}
  else if(T.k==='rep'){back();out();S.eco.tre+=T.v;S.support=clamp(S.support+5,0,100);t=`${NAT.n}と${natN(e)}が講和。${natN(e)}は賠償を払い、国境は戦前の線に戻った`;}
  else if(T.k==='sq'){back();out();S.support=clamp(S.support+2,0,100);t=`${NAT.n}と${natN(e)}が停戦。国境は戦前の線に戻る`;}
  else{out();S.support=clamp(S.support-6,0,100);S.pol.stab=clamp(S.pol.stab-5,0,100);c='r';t=`${NAT.n}と${natN(e)}が講和。${NAT.n}は${T.n}プロヴィンスを失った`;}
  W.wars=W.wars.filter(w=>!w.pl);if(h){h.t=22;h.n1=0;h.n2=0;h.calm=S.month+24;}n.rel=Math.max(n.rel,-50);n.rb=Math.max(n.rb||0,-15);if(e===rv&&T.k!=='win')S.tension=clamp(S.tension-8,0,100);
  S.lw=null;W.ver++;_M=null;wNews(t,c);rep.push(['講和：'+t,c]);return T;}
/* ---------- 都市の攻防 ---------- */
// 守りにつく部隊：本土の陸上部隊のうち強い順に7個と、郷土防衛隊
function lwDefenders(){const con=S.pol.law.con,un=S.gnd.filter(g=>g.loc==='home').sort((a,b)=>(GT[b.type].atk+GT[b.type].def)*b.hp-(GT[a.type].atk+GT[a.type].def)*a.hp).slice(0,7).map(g=>({type:g.type,hp:g.hp,ref:g.id,name:g.name,tr:g.tr}));
  un.push({type:'inf',hp:5+con,name:'郷土防衛隊',tr:35+con*8});return un;}
// 決着を世界に反映する。支持率と緊張度の増減、結果の文を返す
function lwBatEnd(win,why,gp){const L=S.lw,e=L.e,o=[];let dS,dT=0;
  if(win){L.es=Math.max(.45,L.es-.12);L.ex+=3;L.sh=S.month+1;L.won=(L.won||0)+1;S.stats.wins++;dS=gp.cap?8:5;o.push(`${gp.name}を守り抜いた。${natN(e)}軍の攻勢は勢いを失った`);hlog(`${gp.name}：迫る${natN(e)}軍を退けた`,'g');}
  else{provTake(gp.pid,e);S.w.ver++;L.lost=(L.lost||0)+1;if(why!=='retreat')S.stats.loss++;dS=why==='retreat'?-4:gp.cap?-10:-6;dT=1;
    o.push(gp.cap?`首都${gp.name}が${natN(e)}軍の手に落ちた`:`${gp.name}は${natN(e)}軍の手に落ちた。${gp.sname}は経済から外れる`);hlog(`${gp.name}が${natN(e)}軍に占領された`,'r');wNews(`${natN(e)}軍が${gp.cap?'首都':''}${gp.name}を占領`,'r');}
  _M=null;return{dS,dT,L:o};}
function lwPrompt(){const gp=S.gpend,L=S.lw,me=ME();if(!gp||!gp.home||S.over)return;if(!L||WORLD.pown[gp.pid]!==me){S.gpend=null;save();return;}
  const e=L.e,done=(ttl,body,r)=>{polApply(r.dS,r.dT);checkOver();save();render();modal(`<div class="alert r">${ttl}</div><h2>${gp.name}</h2>${body}<div class="pol">支持率 ${sg(r.dS)}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});};
  if(!S.gnd.some(g=>g.loc==='home')){S.gpend=null;return done('陥落',`<p>守る部隊がなく、${natN(e)}軍は抵抗を受けずに市内へ入った。</p>`,lwBatEnd(false,'none',gp));}
  save();
  modal(`<div class="alert r">${gp.cap?'首都防衛戦':'都市の攻防'}</div><h2>${natN(e)}軍が${gp.name}に迫る</h2><p>${gp.cap?'<b class="r">ここが落ちれば、政府は降伏し、任期は終わる。</b>':`${gp.sname}の中心都市。落とされると、この州は経済から外れる。`}敵は${['北','東','南','西'][gp.dir]}から司令部を目指してくる。司令部に乗り込まれたまま次の番を終えるか、守る部隊が全滅すれば市は落ちる。10ターン守り抜けば退けられる。</p>
  <dl class="kv2"><dt>敵</dt><dd>${gp.force.length}個部隊(推定)</dd><dt>守る部隊</dt><dd>${lwDefenders().map(g=>`${g.name}<span class="mut">(戦力${g.hp})</span>`).join('、')}</dd><dt>地形</dt><dd>${TERN[gp.ter]||'平地'}</dd></dl>
  <div class="mbtn col"><button class="btn pri" data-m="f">自ら指揮する</button><button class="btn" data-m="a">現地の指揮官に任せる<small>自動で決着をつける</small></button>${gp.cap?'':'<button class="btn" data-m="r">戦わずに明け渡す<small>部隊は無傷で下がる。支持率 −4</small></button>'}</div>`,
  Object.assign({f:()=>{closeModal();startGround('defend',0);},a:()=>{closeModal();lwAuto();}},gp.cap?{}:{r:()=>{closeModal();S.gpend=null;done('後退',`<p>部隊は${gp.name}を離れ、次の線まで下がった。${natN(e)}軍が市内に入った。</p>`,lwBatEnd(false,'retreat',gp));}}));}
function lwAuto(){const gp=S.gpend,L=S.lw;if(!gp||!gp.home||!L)return;const M=mods(),def=lwDefenders(),un=S.gnd.filter(g=>def.some(d=>d.ref===g.id));
  const P=gstr(def,g=>.8+.4*g.tr/100)*(1+(M.gndPow||0))*1.35+airStrikers(0).length*25,E=gstr(gp.force)*(1+.05*eTech()),win=Math.random()<clamp(.5+(P-E)/Math.max(1,P+E)*.9,.06,.94);S.gpend=null;
  for(const g of un){g.hp-=win?RI(1,3):RI(2,5);g.tr=Math.min(100,g.tr+4);}const dead=un.filter(g=>g.hp<=0);S.gnd=S.gnd.filter(g=>g.hp>0);if(dead.length)S.enl.gnd.n=Math.max(0,S.enl.gnd.n-dead.length*RI(40,90));
  const r=lwBatEnd(win,'auto',gp);polApply(r.dS,r.dT);S.pers.morale=clamp(S.pers.morale+(win?3:-4),5,100);checkOver();save();render();
  modal(`<div class="alert ${win?'g':'r'}">${win?'防衛成功':'陥落'}</div><h2>${gp.name}</h2>${r.L.map(l=>`<p>${l}。</p>`).join('')}${dead.length?`<p class="sm r">壊滅：${dead.map(g=>g.name).join('、')}</p>`:''}<div class="pol">支持率 ${sg(r.dS)}${r.dT?`　緊張度 ${sg(r.dT)}`:''}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});}
/* ---------- 知らせ ---------- */
function lwOffer(asked){const L=S.lw;if(!L)return;const e=L.e,T=lwTerms(),bad=T.k==='cede';
  modal(`<div class="alert ${bad?'r':'g'}">講和</div><h2>${asked?`${natN(e)}が交渉に応じた`:`${natN(e)}が講和を打診してきた`}</h2><p>条件：<b>${T.t}</b>。</p><p class="sm mut">${bad?'受け入れれば戦いは終わるが、中心都市を失った州は経済から外れたままになる。あとから奪還の戦いを起こすこともできる。':'受け入れれば、2年のあいだ国境は静かになる。'}</p><div class="mbtn"><button class="btn ${bad?'':'pri'}" data-m="y">受け入れる</button><button class="btn ${bad?'pri':''}" data-m="n">戦いを続ける</button></div>`,
  {y:()=>{closeModal();if(!S.lw)return;const rep=[];lwEnd('peace',rep);for(const r of rep)hlog(r[0],r[1]);checkOver();save();render();toast(rep[0][0]);if(S.over)showOver();},n:()=>{closeModal();hlog('講和の条件を退けた','');save();render();}});}
function lwShow(){const L=S.lw;if(!L||S.over||!L.q||!L.q.length)return;const q=L.q.shift(),e=L.e;
  if(q.k==='offer')return lwOffer(false);
  const pw=lwPow(),E=lwE(),cbs={hd:()=>{closeModal();ui.tab='gov';ui.sub.gov='hd';render();window.scrollTo(0,0);}};for(const s of LWST.slice(0,2))cbs['s_'+s[0]]=()=>{closeModal();L.st=s[0];save();render();};
  modal(`<div class="alert r">侵攻</div><h2>${NATS[e].f}軍が国境を越えた</h2><p>宣戦の通告はなかった。${natN(e)}軍は首都${NAT.cap}を目指して進んでくる。<b>首都が落ちれば、政府は降伏し、任期はそこで終わる。</b></p>
  <dl class="kv2"><dt>敵の兵力(見積り)</dt><dd>${Math.round(E)}</dd><dt>我が防衛力</dt><dd>${Math.round(pw.def)}(本土の陸上部隊 ${pw.n}個)</dd></dl><p class="sm mut">島の部隊を本土へ戻す、緊急動員をかける、停戦を探る。打てる手は「国政 → 国防」にまとめてある。まず構えを決める。</p>
  <div class="mbtn col">${LWST.slice(0,2).map((s,i)=>`<button class="btn ${i?'':'pri'}" data-m="s_${s[0]}">${s[1]}<small>${s[2]}</small></button>`).join('')}<button class="btn" data-m="hd">国防の画面を開く</button></div>`,cbs);}
{const f0=polShow;polShow=function(){lwShow();f0();};}
/* ---------- 国境危機の出来事と、不可侵条約 ---------- */
PEV.border={t:'国境危機',cond:()=>false,d:q=>`${NATS[q.x].f}が国境に部隊を集めている。${S.w.n[q.x].ldr}${GOVL[S.w.n[q.x].gov]}は演説で「歴史的な領土の回復」を口にした。`,o:[
  ['国境に部隊と資材を送る',{funds:-120,hot:-8,ten:2,grp:{mil:4}},'予備の部隊と資材を国境へ送り、陣地を固めた。相手は出方をうかがっている。','資金 −120'],
  ['特使を送り、対話を求める',{pp:-20,hot:-14,rel:[['x',8]],risk:[.35,{hot:4,sup:-2,rel:null}]},(q,r)=>r.bad?'特使は門前払いを受けた。':'協議の場が設けられ、国境の部隊は一部が下がった。','政治力 −20、35%で不調'],
  ['各国に訴える',{pp:-10,hot:-6,sup:1},'各国が相次いで自制を求める声明を出した。','政治力 −10'],
  ['様子を見る',{},'事態を見守ることにした。','']]};
for(const d of DIP){const f0=d[4];d[4]=(n,i)=>S.lw&&S.lw.e===i?'交戦中の相手':f0(n,i);}
DIP.splice(3,0,['nap','不可侵条約',35,'陸で接する国と結ぶ。4年のあいだ、相手は国境を越えない。相手の国で政変が起きれば破られる',(n,i)=>S.lw&&S.lw.e===i?'交戦中の相手':!lwNb().includes(i)?'陸で接する国だけ':n.nap>S.month?'締結済み':n.rel<-25?'関係が−25以上必要':'']);
/* ---------- 画面 ---------- */
const lwMobWhy=()=>{const W=S.w,me=ME();return !(S.lw||W.hot.some(h=>(h.a===me||h.b===me)&&h.t>=70))?'侵攻を受けているか、国境の緊張が70以上のときだけ使える':W.mobM!=null&&S.month-W.mobM<24?`前回の動員から2年たっていない(あと${24-(S.month-W.mobM)}か月)`:S.pol.pp<20?'政治力が足りない':!canPay(150)?'資金が足りない':'';};
GV.hd=()=>{const W=S.w,L=S.lw,G=lwGeo(),pw=lwPow(),al=natAlive(),P=S.pol,con=P.law.con,mob=lwMobWhy(),ids=lwNb().concat(Object.keys(G.lost).map(Number)).filter((i,k,a)=>al[i]&&a.indexOf(i)===k),tOf=i=>(lwHot(i)||{t:0}).t;let h='';
  if(L){const e=L.e,E=lwE(),mo=S.month-L.m0,occ=lwOcc(),st=LWST.find(x=>x[0]===L.st)||LWST[0],eff=pw.def*st[3],mx=Math.max(E,eff,1),ask=L.askM!=null&&S.month-L.askM<3,gone=myStates().filter(s=>stHeld(s)===0);
    h+=`<section class="sec"><h2>本土の戦い</h2><p class="al r">${L.att?`${natN(e)}と交戦中`:`${natN(e)}軍が侵攻している`}(${mo}か月目)</p>${L.bat||(S.gpend&&S.gpend.home)?`<p class="al r">${(L.bat||S.gpend).name}に敵が迫っている。「翌月へ」を押すと対応を決められる</p>`:''}
    <dl class="kv2"><dt>占領された土地</dt><dd class="${occ?'r':''}">${occ}／${G.orig}プロヴィンス${gone.length?`(${gone.map(stName).join('、')}を失った)`:''}</dd><dt>こちらが占領</dt><dd>${G.got}プロヴィンス</dd><dt>先月の前線</dt><dd>${L.k>0?`<span class="r">敵が${L.k}プロヴィンス前進</span>`:L.k<0?`<span class="g">${-L.k}プロヴィンス押し返した</span>`:'動かず'}</dd><dt>敵の勢い</dt><dd>${Math.round(L.es*clamp(1-.02*occ,.72,1)*100)}%<span class="mut">(損害と、補給線の伸びで落ちる)</span></dd><dt>首都</dt><dd>${NAT.cap}<span class="mut">(落ちれば任期は終わる)</span></dd></dl>
    <div class="st3"><div><label>我が防衛力 ${Math.round(eff)}</label>${bar(eff/mx*100,'b')}</div><div><label>敵の兵力 ${Math.round(E)}</label>${bar(E/mx*100,'r')}</div></div>
    <h3 class="sub">構え</h3>${LWST.map(s=>`<div class="lopt ${L.st===s[0]?'on':''}"><div class="uh"><b>${L.st===s[0]?'● ':''}${s[1]}</b><span class="loc">防衛力 ${sg(Math.round((s[3]-1)*100))}%・損害 ${sg(Math.round((s[4]-1)*100))}%</span></div><p class="sm mut">${s[2]}</p>${L.st===s[0]?'':`<button class="btn sm" onclick="A.lwst('${s[0]}')">この構えに改める</button>`}</div>`).join('')}
    <h3 class="sub">講和</h3><p class="sm">いま講和すれば：${lwTerms().t}。</p><div class="brow"><button class="btn sm" ${P.pp>=30&&!ask?'':'disabled'} onclick="A.lwask()">${ask?'申し入れたばかり':P.pp<30?'政治力が足りない':'停戦を申し入れる(政治力 30)'}</button><button class="btn sm" onclick="A.nat(${e})">${natN(e)}を見る</button></div></section>`;}
  h+=`<section class="sec"><h2>本土の防衛力</h2>${polBar()}<dl class="kv2"><dt>本土の陸上部隊</dt><dd>${Math.round(pw.field)}<span class="mut">(${pw.n}個)</span></dd><dt>郷土防衛隊</dt><dd>${Math.round(pw.guard)}<span class="mut">(兵役：${LAW.find(l=>l[0]==='con')[2][con][0]})</span></dd><dt>本土の飛行隊</dt><dd>${Math.round(pw.air)}</dd><dt>同盟と防衛協力</dt><dd>+${Math.round(pw.ally*100)}%</dd><dt>地形と陣地</dt><dd>+${Math.round((pw.ter-1)*100)}%</dd><dt>合計</dt><dd><b>${Math.round(pw.def)}</b></dd></dl>
  <p class="mut sm">本土にいる陸上部隊、兵役の政策、基地と駐屯地、本土の飛行隊、同じ陣営の国と防衛協力が効く。島や艦にいる部隊は数に入らない。</p>
  <div class="brow"><button class="btn sm" onclick="A.sub('units','gnd');A.tab('units')">陸上部隊を見る</button><button class="btn sm" ${mob?'disabled':''} onclick="A.lwmob()">緊急動員(資金150・政治力20)</button></div>${mob?`<p class="sm mut">緊急動員：${mob}</p>`:`<p class="sm mut">緊急動員：予備役を招集し、普通科連隊を${2+con}個ただちに編成する。</p>`}</section>
  <section class="sec"><h2>陸の国境 ${ids.length}</h2>`;
  if(!ids.length)h+='<p class="mut sm">陸で接する国はない。本土が陸から攻め込まれることはない。</p>';
  else{h+=`<p class="mut sm">関係が悪く、こちらの守りが薄いほど緊張が上がる。85を超えると、勝てると見た相手は国境を越えてくる。${S.cfg.landW===0||S.cfg.landW===false?'<b class="am">この任期は「陸からの侵攻 なし」で始めている。</b>':''}</p>`;
    for(const i of ids.sort((a,b)=>tOf(b)-tOf(a))){const n=W.n[i],ht=lwHot(i),t=tOf(i),E=lwEnemy(i),det=pw.def/Math.max(1,E),war=L&&L.e===i,nap=n.nap>S.month,calm=ht&&ht.calm>S.month,lost=G.lost[i]||0;
      h+=`<div class="item"><div class="uh"><b>${natN(i)}</b><span class="loc">関係 ${n.rel>0?'+':''}${Math.round(n.rel)}(${relWord(n.rel)})</span></div>
      <div class="st3 one"><div><label>国境の緊張 ${Math.round(t)}</label>${bar(t,t>=75?'r':t>=55?'am':'g')}</div><div><label>相手の兵力 ${Math.round(E)}<span class="mut">　こちらの防衛力 ${Math.round(pw.def)}</span></label>${bar(E/Math.max(E,pw.def,1)*100,'r')}</div></div>
      <p class="sm">${blocTag(n.bloc)} ${war?'<b class="r">交戦中</b>':inWar(i)?'ほかの国と交戦中':`守りの見込み：<b class="${det>=1.25?'g':det>=1?'':det>=.75?'am':'r'}">${det>=1.25?'優勢':det>=1?'互角':det>=.75?'やや劣勢':'劣勢'}</b>`}${nap?`　不可侵条約(あと${n.nap-S.month}か月)`:''}${calm?`　停戦の取り決め(あと${ht.calm-S.month}か月)`:''}${lost?`　<span class="r">${lost}プロヴィンスを占領されている</span>`:''}</p>
      <div class="brow"><button class="btn sm" onclick="A.nat(${i})">外交</button>${lost&&!L?`<button class="btn sm" ${P.pp>=40&&!inWar(i)?'':'disabled'} onclick="A.lwret(${i})">奪還の戦いを起こす(政治力 40)</button>`:''}</div></div>`;}}
  return h+'</section>';};
VIEW.gov=()=>subtabs('gov',[['world','情勢'],['dip','外交'],['hd','国防'],['focus','方針'],['law','政策'],['land','内政']])+(GV[ui.sub.gov]||GV.world)();
{const al0=alerts;
  alerts=function(){const a=al0(),L=S.lw,me=ME();if(!S.w||!S.pol)return a;const al=natAlive();
    if(L){a.unshift([`${natN(L.e)}${L.att?'と本土で交戦中':'軍が本土に侵攻している'}。占領された土地 ${lwOcc()}プロヴィンス(国政 → 国防)`,'r']);const b=L.bat||(S.gpend&&S.gpend.home?S.gpend:null);if(b)a.unshift([`${b.cap?'首都':''}${b.name}に敵が迫っている。「翌月へ」で対応を決める`,'r']);}
    else{for(const h of S.w.hot){if((h.a!==me&&h.b!==me)||h.t<60)continue;const e=h.a===me?h.b:h.a;if(al[e]&&lwGeo().nb[e])a.push([`${natN(e)}との国境の緊張が高い(${Math.round(h.t)})。国政 → 国防`,h.t>=75?'r':'am']);}
      if(lwOcc())a.push(['占領されたままの土地がある(国政 → 国防)','am']);}
    return a;};}
Object.assign(A,{
  lwst(k){const L=S.lw;if(!L||!LWST.some(s=>s[0]===k)||L.st===k)return;L.st=k;hlog(`本土の構えを「${LWST.find(s=>s[0]===k)[1]}」に改めた`,'');save();render();},
  lwask(){const L=S.lw,P=S.pol;if(!L||L.bat||S.gpend||mq.length||P.pp<30||(L.askM!=null&&S.month-L.askM<3))return;P.pp-=30;L.askM=S.month;const mo=S.month-L.m0,T=lwTerms(),p=clamp(.12+L.ex*.02+mo*.012+(L.es<.75?.2:0)+(T.k==='cede'?.3:0)+(T.k==='rep'?.15:0),.05,.92);
    if(Math.random()<p){save();render();lwOffer(true);}else{hlog(`${natN(L.e)}に停戦を申し入れたが、応じなかった`,'');save();render();toast('相手は交渉に応じなかった');}},
  lwmob(){const P=S.pol,why=lwMobWhy();if(why)return toast(why);const n=2+P.law.con;
    confirmM(`予備役を招集し、普通科連隊を<b>${n}個</b>ただちに編成する。練度と戦力は低い。資金150億円と政治力20を使い、安定度が4下がる。次に使えるのは2年後。`,()=>{if(lwMobWhy())return;spend(150);P.pp-=20;P.stab=clamp(P.stab-4,0,100);grpAdd({reg:-5,lab:-3,mil:3});
      for(let i=0;i<n;i++){const g=addGnd('inf','home',{tr:RI(30,40)});g.hp=7;}S.enl.gnd.n+=n*90;S.w.mobM=S.month;hlog(`緊急動員：普通科連隊 ${n}個を編成`,'am');wNews(`${NAT.n}が予備役の招集を発表`,'am');_M=null;save();render();toast(`${n}個連隊を編成した`);},'動員する');},
  lwret(e){const P=S.pol,n=lwGeo().lost[e]||0;if(S.lw||!n||P.pp<40||S.gpend||S.pending||S.over||inWar(e))return;
    confirmM(`${natN(e)}が占領している${n}プロヴィンスを取り戻すため、こちらから戦いを起こす。政治力40を使う。攻め込む側になるので、周辺国の目は厳しくなる。`,()=>{if(S.lw||inWar(e))return;P.pp-=40;const rep=[],W=S.w;W.n.forEach((x,i)=>{if(i!==ME()&&i!==e)relAdd(i,x.bloc&&x.bloc===W.n[e].bloc?-8:-2);});lwStart(e,rep,true);for(const r of rep)hlog(r[0],r[1]);save();render();},'開戦する');}
});
