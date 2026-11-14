/* ================= 本土への陸からの侵攻 ================= */
// 陸で接する国との国境の緊張、開戦、前線の動き、都市の攻防、講和。
// S.lw={e:相手国, m0:開戦の月, att:こちらから起こした, st:構え, es:敵の勢い, ex:疲弊, bq:[決着待ちの防御戦], auto:前線を任せる, atkM/atkN:今月の進攻の回数, res:[最近の戦い], q:[知らせ], sh:攻勢が止まる月}
// [キー, 名称, 説明, 防衛力の倍率, 損害の倍率]
const LWST=[['hold','持久防御','陣地に籠もって前線を保つ。参謀は自分からは攻めない。任せた戦いの損害が少ない',1.25,.7],['mob','機動防御','守りながら、勝ち目のあるところで失地を奪い返す。参謀が月2回まで進攻する',1,1],['ctr','反攻','損害をいとわず攻める。参謀が月3回まで進攻し、相手の領内へも踏み込む',.86,1.4]];
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
function lwPow(){const M=mods(),X=polSum(1),me=ME(),W=S.w,al=natAlive(),G=lwGeo(),L=S.lw,un=S.gnd.filter(g=>g.loc==='home');
  const field=gstr(un,g=>.8+.4*g.tr/100)*(1+(M.gndPow||0)),guard=natEco()[me]*.026*[1,1.7,2.6][S.pol.law.con]*(1+Math.min(.5,.08*bldSum('base')))*(1+(X.grdK||0)),air=airPower(0)*.7;
  const pb=W.n[me].bloc,nb=pb?W.n.filter((n,i)=>i!==me&&al[i]&&n.bloc===pb&&!(L&&L.e===i)).length:0,nd=W.n.filter((n,i)=>i!==me&&al[i]&&n.def&&!(pb&&n.bloc===pb)).length,ally=Math.min(.3,.05*nb)+Math.min(.24,.08*nd);
  const tot=(field+guard+air)*(1+ally)*(1+(X.hdK||0)),ter=G.ter*1.1;return{n:un.length,field,guard,air,ally,ter,tot,def:tot*ter};}
// 相手がこの国境に回してくる兵力。大国は小国を相手に全力を出さない
function lwEnemy(e){const W=S.w,al=natAlive(),me=ME(),eco=natEco(),n=W.n[e];
  const rel=Math.min(1,Math.sqrt(Math.max(1,eco[me])/Math.max(1,eco[e]))*1.3),bl=n.bloc?Math.min(.2,.04*W.n.filter((x,k)=>k!==e&&k!==me&&al[k]&&x.bloc===n.bloc).length):0;
  return natPw()[e]*.074*rel*(1+bl)*(e===RVN()?W.rivK:1)*clamp(1+.04*eTech(),.75,1.5)*(.8+.2*S.cfg.eAggr);}
// 交戦中の相手の兵力。損害で勢いが落ち、こちらの領内に深く入るほど補給が伸びて息切れする
const lwE=()=>{const L=S.lw;return lwEnemy(L.e)*L.es*clamp(1-.02*lwOcc(),.72,1);};
/* ---------- 国境の緊張 ---------- */
function lwSync(){if(!S||!S.w)return;const W=S.w,me=ME(),rv=RVN(),pb=W.n[me].bloc;if(S.lw===undefined)S.lw=null;if(S.lw){const L=S.lw;if(!L.bq)L.bq=[];if(L.bat){L.bq.push(L.bat);L.bat=null;}for(const x of L.bq.concat(S.gpend&&S.gpend.home?[S.gpend]:[]))if(x.city==null&&!x.atk)x.city=1;}   // 前の版の記録では、待っている戦いはすべて都市の攻防
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
  S.lw={e,m0:S.month,att:byMe?1:0,st:byMe?'ctr':'hold',es:1,ex:0,k:0,bq:[],auto:0,atkM:null,atkN:0,res:[],mLost:0,mGain:0,askM:null,offM:null,q:byMe?[]:[{k:'start'}],sh:0,lost:0,won:0};
  W.wars.push({id:++W.seq,a:byMe?me:e,d:byMe?e:me,m0:S.month,ex:0,pl:1});n.trd=0;n.def=0;n.imp=0;n.nap=0;n.rel=Math.min(n.rel,-70);n.rb=Math.min(n.rb||0,-30);if(h){h.t=100;h.calm=0;}
  S.tension=clamp(S.tension+(e===rv?15:5),0,100);S.support=clamp(S.support+(byMe?-2:4),0,100);if(!byMe)S.pol.stab=clamp(S.pol.stab+3,0,100);
  const t=byMe?`${NAT.f}が失地の奪還を掲げ、${NATS[e].f}に攻め込んだ`:`${NATS[e].f}が${NAT.f}に侵攻した`;wNews(t,'r');rep.unshift([(byMe?'開戦：':'侵攻：')+t,'r']);
  const fr=W.n.map((x,i)=>i).filter(i=>i!==me&&i!==e&&al[i]&&((pb&&W.n[i].bloc===pb)||W.n[i].def));
  if(fr.length&&!byMe){for(const i of fr)relAdd(i,3);wNews(`${fr.slice(0,4).map(natN).join('、')}${fr.length>4?'など':''}が${NAT.n}への支援を表明`,'g');}
  W.ver++;_M=null;}
/* ---------- 前線 ---------- */
// 前線の戦いはプロヴィンスごとに行う。敵は毎月いくつかのプロヴィンスへ攻めかかり、こちらからも月に3回まで進攻できる
const LW_ATK=3,LWSEQ_E=['inf','arm','inf','art','inf','arm','aa'],LWSEQ_G=['inf','inf','art','arm','aa','inf','arm'];
// fromの土地のうち、toの土地に接するもの。toが本来の持ち主の土地を先に、あとはfromの首都に近い順
function lwCand(from,to,ownOnly,jit){const P=WORLD.P,ow=WORLD.pown,tc=WORLD.nat[from],cand=[],sc={};
  for(let p=0;p<P.length;p++)if(ow[p]===from&&(!ownOnly||P[p].nat===to)&&P[p].adj.some(q=>ow[q]===to)){cand.push(p);sc[p]=(P[p].nat===to?-1e6:0)+((P[p].x-tc.x)*(P[p].x-tc.x)+(P[p].y-tc.y)*(P[p].y-tc.y))*(jit?R(.55,1.45):1);}
  return cand.sort((x,y)=>sc[x]-sc[y]);}
const lwDir=(pr,to)=>{const dx=to.x-pr.x,dy=to.y-pr.y;return Math.abs(dy)>=Math.abs(dx)?(dy<0?0:2):(dx>0?1:3);};
const lwPName=p=>{const pr=WORLD.P[p],s=WORLD.ST[pr.st];return s.city===p?stCity(s):`${stName(s)}の${TERN[pr.ter]||'平地'}`;};
// 守りにつく部隊：本土の陸上部隊のうち強い順(都市は7個、ほかは4個)と、郷土防衛隊
function lwDefenders(gp){const con=S.pol.law.con,n=gp&&!gp.city?4:7,un=S.gnd.filter(g=>g.loc==='home').sort((a,b)=>gPW(b)*b.hp-gPW(a)*a.hp).slice(0,n).map(gRef);
  un.push({type:'inf',hp:5+con,name:'郷土防衛隊',tr:35+con*8});return un;}
// 敵が攻めてくる戦い。敵の数は、守る部隊の戦力と、前線全体の兵力差から決める
function lwMkBat(p){const Wd=WORLD,pr=Wd.P[p],s=Wd.ST[pr.st],L=S.lw,city=s.city===p&&pr.nat===ME()?1:0,cap=city&&pr.cap?1:0,r=lwE()/Math.max(1,lwPow().def);
  const want=gstr(lwDefenders({city}))*clamp(r,.6,1.8)*(cap?1:city?.87:.8),hp=clamp(Math.round(6+L.es*4),7,10),force=[];for(let i=0;i<7&&(i<(city?3:2)||gstr(force)<want);i++)force.push({t:LWSEQ_E[i],hp:i?hp:10});
  return{home:1,z:0,pid:p,seed:RI(1,999999999),name:lwPName(p),sname:stName(s),ter:pr.ter,cap,city,dir:lwDir(pr,Wd.nat[L.e]),L:cap?2.8:city?2.4:2.1,fr:1,force};}
// こちらが攻める戦い。敵の守りは、兵力差と、都市・首都・敵地の奥深さで厚くなる
function lwMkAtk(p,ids){const Wd=WORLD,pr=Wd.P[p],s=Wd.ST[pr.st],L=S.lw,me=ME(),own=pr.nat===me?1:0,city=s.city===p?1:0,cap=city&&pr.cap&&!own?1:0,r=lwE()/Math.max(1,lwPow().def);
  const n=clamp(Math.round(1.4+clamp(r,.5,1.8)*1.3+city+cap*2+(own?0:lwGeo().got*.12)),2,7),hp=clamp(Math.round(6+L.es*4),6,10),egar=[];for(let i=0;i<n;i++)egar.push({t:LWSEQ_G[i],hp:i?hp:10});
  return{home:1,atk:1,z:0,pid:p,seed:RI(1,999999999),name:lwPName(p),sname:stName(s),ter:pr.ter,cap,city,own,dir:lwDir(pr,Wd.nat[me]),egar,fort:cap?2:city||!own?1:0,units:ids||[]};}
const lwAtkPool=m=>S.gnd.filter(g=>g.loc==='home'&&g.fm!==m&&g.hp>=3).sort((a,b)=>gPW(b)*b.hp-gPW(a)*a.hp);
const lwAtkUsed=()=>{const L=S.lw;return L&&L.atkM===S.month?L.atkN||0:0;};
const lwCanAtk=p=>{const L=S.lw;return !!L&&WORLD.pown[p]===L.e&&WORLD.P[p].adj.some(q=>WORLD.pown[q]===ME());};
const lwAtkWhy=()=>{const L=S.lw;return !L?'交戦中ではない':S.gpend||(L.bq&&L.bq.length)||S.pending?'先に、決着を待っている戦いを片づける':lwAtkUsed()>=LW_ATK?`進攻は月に${LW_ATK}回まで`:!lwAtkPool(S.month).length?'進攻に出せる部隊がいない(本土にいて、戦力3以上、今月まだ攻めていない部隊)':'';};
// 進攻の見込み。こちらの戦力÷敵の守り
const lwArtSup=ids=>Math.min(3,S.gnd.filter(g=>g.loc==='home'&&gArt(g.type)&&g.hp>=4&&!ids.includes(g.id)).length);
function lwAtkOdds(d,un){const M=mods(),X=polSum(1);return (gstr(un,g=>.8+.4*g.tr/100)*(1+(M.gndPow||0))*(1+(X.ofK||0))+airStrikers(0).length*20+lwArtSup(un.map(g=>g.id))*15)/Math.max(1,gstr(d.egar)*(1+.05*eTech())*(1.15+.1*d.fort)*(LWTER[d.ter]||1));}
/* ---------- 戦いの決着を世界に反映する ---------- */
function lwNote(t,name,win){const L=S.lw;if(!L)return;(L.res=L.res||[]).unshift({t,name,win:win?1:0});if(L.res.length>8)L.res.pop();}
// 守る戦い。支持率と緊張度の増減、結果の文を返す
function lwBatEnd(win,why,gp){const L=S.lw,e=L.e,o=[],big=gp.city;let dS,dT=0;lwNote('def',gp.name,win);
  if(win){L.es=Math.max(.45,L.es-(big?.12:.05));L.ex+=big?3:1;if(big)L.sh=S.month+1;L.won=(L.won||0)+1;if(big||why!=='auto')S.stats.wins++;dS=gp.cap?8:big?5:2;o.push(`${gp.name}を守り抜いた${big?`。${natN(e)}軍の攻勢は勢いを失った`:''}`);hlog(`${gp.name}：迫る${natN(e)}軍を退けた`,'g');}
  else{provTake(gp.pid,e);S.w.ver++;L.lost=(L.lost||0)+1;L.mLost=(L.mLost||0)+1;if(why!=='retreat'&&(big||why!=='auto'))S.stats.loss++;dS=why==='retreat'?(big?-4:-1):gp.cap?-10:big?-6:-2;dT=big?1:0;
    o.push(gp.cap?`首都${gp.name}が${natN(e)}軍の手に落ちた`:big?`${gp.name}は${natN(e)}軍の手に落ちた。${gp.sname}は経済から外れる`:`${gp.name}を失った`);hlog(`${gp.name}が${natN(e)}軍に占領された`,'r');if(big)wNews(`${natN(e)}軍が${gp.cap?'首都':''}${gp.name}を占領`,'r');}
  _M=null;return{dS,dT,L:o};}
// 攻める戦い
function lwAtkEnd(win,why,d){const L=S.lw,e=L.e,o=[];let dS,dT=0;lwNote('atk',d.name,win);
  if(win){provTake(d.pid,ME());S.w.ver++;L.es=Math.max(.45,L.es-(d.city?.08:.04));L.ex+=1;L.mGain=(L.mGain||0)+1;if(why!=='auto')S.stats.wins++;dS=d.own?(d.city?5:2):(d.city?3:1);
    o.push(d.own?`${d.name}を奪い返した${d.city?`。${d.sname}が経済に戻る`:''}`:`${natN(e)}の${d.name}を占領した`);hlog(d.own?`${d.name}を${natN(e)}軍から奪い返した`:`${natN(e)}の${d.name}を占領した`,'g');if(d.city)wNews(`${NAT.n}軍が${d.own?'':natN(e)+'の'}${d.name}を${d.own?'奪還':'占領'}`,'g');if(d.cap)L.capE=1;}
  else{L.es=Math.min(1.1,L.es+.01);if(why!=='auto')S.stats.loss++;dS=why==='retreat'?-1:-2;o.push(`${d.name}への進攻は失敗した`);hlog(`${d.name}への進攻は失敗した`,'r');}
  _M=null;return{dS,dT,L:o};}
// 相手の首都を落としていれば、その場で降伏させる。知らせの文を返す
function lwCapEnd(){if(!S.lw||!S.lw.capE)return'';const rep=[];lwEnd('win',rep);for(const r of rep)hlog(r[0],r[1]);return rep.length?rep[rep.length-1][0].replace(/^講和：/,''):'';}
// 本土の戦いで戦力が尽きた部隊は、消えずに潰走する(戦力1で後方へ下がる)
const lwKill=un=>{const dead=un.filter(g=>g.hp<=0);for(const g of dead){g.hp=1;g.tr=Math.max(20,g.tr-6);}return dead;};
// 自動で決着をつける
function lwResolveDef(gp){const L=S.lw,M=mods(),X=polSum(1),st=LWST.find(x=>x[0]===L.st)||LWST[0],def=lwDefenders(gp),un=S.gnd.filter(g=>def.some(d=>d.ref===g.id));
  const P=gstr(def,g=>.8+.4*g.tr/100)*(1+(M.gndPow||0))*1.35*st[3]*(1+(X.hdK||0))+airStrikers(0).length*25,E=gstr(gp.force)*(1+.05*eTech()),win=Math.random()<clamp(.5+(P-E)/Math.max(1,P+E)*.9,.06,.94);
  for(const g of un){g.hp-=Math.round((win?RI(0,1):RI(0,2)+(gp.city?1:0))*st[4]);g.tr=Math.min(100,g.tr+2);g.fx=S.month;}return{win,dead:lwKill(un),r:lwBatEnd(win,'auto',gp)};}
function lwResolveAtk(d,un){const win=Math.random()<clamp(.5+(lwAtkOdds(d,un)-1)/(lwAtkOdds(d,un)+1)*.9,.05,.95);
  for(const g of un){g.hp-=win?RI(0,1):RI(1,2);g.tr=Math.min(100,g.tr+2);g.fx=S.month;}return{win,dead:lwKill(un),r:lwAtkEnd(win,'auto',d)};}
// 参謀による進攻。構えに従い、司令が先月使わなかった回数だけ、勝ち目のある相手に仕掛ける
function lwStaff(lr){const L=S.lw,me=ME(),e=L.e,pm=S.month-1;if(L.st==='hold')return;const ctr=L.st==='ctr',used=L.atkM===pm?L.atkN||0:0;
  for(let i=used;i<(ctr?LW_ATK:2);i++){const tg=lwCand(e,me,!ctr,false);if(!tg.length)break;const un=S.gnd.filter(g=>g.loc==='home'&&g.fm!==pm&&g.fs!==S.month&&g.hp>=4).sort((a,b)=>gPW(b)*b.hp-gPW(a)*a.hp).slice(0,5);if(!un.length)break;
    const d=lwMkAtk(tg[0],un.map(g=>g.id));if(lwAtkOdds(d,un)<(ctr?.9:1.05))break;for(const g of un)g.fs=S.month;const o=lwResolveAtk(d,un);S.support=clamp(S.support+o.r.dS*.5,0,100);
    lr.push([`本土：参謀の進攻　${o.r.L[0]}${o.dead.length?`(潰走：${o.dead.map(g=>g.name).join('、')})`:''}`,o.win?'g':'r']);if(L.capE)break;}}
function lwStep(rep){const L=S.lw,W=S.w,me=ME(),e=L.e,rv=RVN(),n=W.n[e],mo=S.month-L.m0,st=LWST.find(x=>x[0]===L.st)||LWST[0],lr=[],P=WORLD.P;
  n.rel=Math.min(n.rel,-60);if(e===rv)S.tension=Math.max(S.tension,70);if(!L.bq)L.bq=[];if(L.bat){L.bq.push(L.bat);L.bat=null;}if(L.bq.length||(S.gpend&&S.gpend.home))return;
  L.k=(L.mLost||0)-(L.mGain||0);L.mLost=0;L.mGain=0;
  lwStaff(lr);if(L.capE){rep.unshift(...lr);lwEnd('win',rep);return;}
  // 敵の攻勢。兵力差が開くほど、攻めかかる場所が増える
  const pw=lwPow(),E=lwE(),ratio=E/Math.max(1,pw.def*st[3])*R(.85,1.2)*(mo<2&&!L.att?1.15:1),field=S.gnd.some(g=>g.loc==='home');
  let nE=L.sh>=S.month?0:ratio>=1.6?3:ratio>=1.1?2:ratio>=.7?1:Math.random()<.45?1:0;if(nE&&Math.random()<.25)nE+=Math.random()<.5?1:-1;nE=clamp(nE,0,3);
  for(const p of lwCand(me,e,false,true).slice(0,nE)){const b=lwMkBat(p);
    if(b.city&&!field){provTake(p,e);L.lost=(L.lost||0)+1;L.mLost++;lwNote('def',b.name,0);wNews(`${natN(e)}軍が${b.cap?'首都':''}${b.name}を占領`,'r');lr.push([`本土：守る部隊がなく、${b.cap?'首都':''}${b.name}が${natN(e)}軍の手に落ちた`,'r']);S.support=clamp(S.support-(b.cap?10:5),0,100);if(b.cap)break;continue;}
    if(b.city||(field&&!L.auto)){L.bq.push(b);continue;}
    const o=lwResolveDef(b);S.support=clamp(S.support+o.r.dS*.5,0,100);lr.push([`本土：${o.r.L[0]}${o.dead.length?`(潰走：${o.dead.map(g=>g.name).join('、')})`:''}`,o.win?'g':'r']);}
  if(L.bq.length)lr.unshift([`本土：${natN(e)}軍が${L.bq.map(b=>(b.cap?'首都':'')+b.name).join('、')}に攻めかかってきた`,'r']);
  L.ex+=1+.3*nE;if(nE||lr.length)for(const a of S.air||[])if(a.base===0&&airOK(a)&&(a.type==='ftr'||a.type==='atk'||a.type==='bmr'))a.rdy=Math.max(15,a.rdy-6);
  L.es=clamp(L.es+.014-Math.min(.03,airStrikers(0).length*.012),.45,1.1);
  S.support=clamp(S.support-lwOcc()/Math.max(1,lwGeo().orig)*2.5,0,100);n.stab=clamp(n.stab-.6,5,95);
  if(!lr.length)lr.push(['本土：前線は動いていない','']);rep.unshift(...lr);W.ver++;_M=null;
  if(!L.bq.length&&!lwCapLost()&&mo>=4&&S.month-(L.offM==null?-99:L.offM)>=4&&Math.random()<clamp((mo-3)*.03+L.ex*.004+(L.es<.7?.12:0)+(L.k<0?.06:0),0,.45)){L.offM=S.month;L.q.push({k:'offer'});}}
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
/* ---------- 戦いの前の決定 ---------- */
// 敵が攻めてきたとき：自ら指揮する、任せる、明け渡す
function lwPrompt(){const gp=S.gpend,L=S.lw,me=ME();if(!gp||!gp.home||S.over)return;const next=()=>{if(S.over)showOver();else if(gpNext())groundPrompt();};
  if(!L||WORLD.pown[gp.pid]!==me){S.gpend=null;save();return next();}
  const e=L.e,done=(ttl,body,r)=>{polApply(r.dS,r.dT);checkOver();save();render();modal(`<div class="alert r">${ttl}</div><h2>${gp.name}</h2>${body}<div class="pol">支持率 ${sg(r.dS)}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();next();}});};
  if(!S.gnd.some(g=>g.loc==='home')&&gp.city){S.gpend=null;return done('陥落',`<p>守る部隊がなく、${natN(e)}軍は抵抗を受けずに市内へ入った。</p>`,lwBatEnd(false,'none',gp));}
  if(L.auto&&!gp.city)return lwAuto(true);
  save();const left=(L.bq||[]).length;
  modal(`<div class="alert r">${gp.cap?'首都防衛戦':gp.city?'都市の攻防':'前線の防御'}</div><h2>${natN(e)}軍が${gp.name}に${gp.city?'迫る':'攻めかかる'}</h2><p>${gp.cap?'<b class="r">ここが落ちれば、政府は降伏し、任期は終わる。</b>':gp.city?`${gp.sname}の中心都市。落とされると、この州は経済から外れる。`:`${gp.sname}のプロヴィンス。失えば、前線が1つ内へ下がる。`}敵は${['北','東','南','西'][gp.dir]}から司令部を目指してくる。${gp.city?10:8}ターン守り抜けば退けられる。</p>
  <dl class="kv2"><dt>敵</dt><dd>${gp.force.length}個部隊(推定)</dd><dt>守る部隊</dt><dd>${lwDefenders(gp).map(g=>`${g.name}<span class="mut">(戦力${g.hp})</span>`).join('、')}</dd><dt>地形</dt><dd>${TERN[gp.ter]||'平地'}</dd>${left?`<dt>ほかの戦い</dt><dd>このあと${left}か所</dd>`:''}</dl>
  <div class="mbtn col"><button class="btn pri" data-m="f">自ら指揮する</button><button class="btn" data-m="a">現地の指揮官に任せる<small>自動で決着をつける</small></button>${gp.cap?'':`<button class="btn" data-m="r">戦わずに明け渡す<small>部隊は無傷で下がる。支持率 ${gp.city?'−4':'−1'}</small></button>`}${gp.city?'':'<button class="btn" data-m="all">この戦争では、前線の戦いを任せる<small>都市と首都の戦いだけ、判断を求められる。「国政 → 国防」で戻せる</small></button>'}</div>`,
  Object.assign({f:()=>{closeModal();startGround('defend',0);},a:()=>{closeModal();lwAuto();}},gp.cap?{}:{r:()=>{closeModal();S.gpend=null;done('後退',`<p>部隊は${gp.name}を離れ、次の線まで下がった。</p>`,lwBatEnd(false,'retreat',gp));}},gp.city?{}:{all:()=>{closeModal();L.auto=1;hlog('前線の戦いを現地の指揮官に任せることにした','');lwAuto(true);}}));}
function lwAuto(quiet){const gp=S.gpend,L=S.lw;if(!gp||!gp.home||!L)return;S.gpend=null;const o=lwResolveDef(gp),r=o.r,win=o.win,next=()=>{if(S.over)showOver();else if(gpNext())groundPrompt();};
  polApply(r.dS,r.dT);S.pers.morale=clamp(S.pers.morale+(win?(gp.city?3:1):(gp.city?-4:-1)),5,100);checkOver();save();render();
  if(quiet&&!S.over){toast(r.L[0]);return next();}
  modal(`<div class="alert ${win?'g':'r'}">${win?'防衛成功':gp.city?'陥落':'後退'}</div><h2>${gp.name}</h2>${r.L.map(l=>`<p>${l}。</p>`).join('')}${o.dead.length?`<p class="sm r">潰走：${o.dead.map(g=>g.name).join('、')}</p>`:''}<div class="pol">支持率 ${sg(r.dS)}${r.dT?`　緊張度 ${sg(r.dT)}`:''}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();next();}});}
// こちらから攻める：目標のプロヴィンスと、投入する部隊を決める
function lwAtkModal(){const a=ui.lwa,L=S.lw;if(!a||!L)return;const d=a.d,pool=lwAtkPool(S.month),un=pool.filter(g=>a.ids.includes(g.id)),od=un.length?lwAtkOdds(d,un):0,cbs={x:()=>{closeModal();ui.lwa=null;}};
  for(const g of pool)cbs['u'+g.id]=()=>{const i=a.ids.indexOf(g.id);if(i>=0)a.ids.splice(i,1);else if(a.ids.length<5)a.ids.push(g.id);closeModal();lwAtkModal();};
  const go=f=>()=>{closeModal();ui.lwa=null;const us=lwAtkPool(S.month).filter(g=>a.ids.includes(g.id));if(!us.length||lwAtkWhy()||!lwCanAtk(d.pid))return;L.atkN=lwAtkUsed()+1;L.atkM=S.month;for(const g of us)g.fm=S.month;d.units=us.map(g=>g.id);
    if(f)return startGround('assault',0,d);
    const o=lwResolveAtk(d,us),r=o.r,cap=lwCapEnd();polApply(r.dS,r.dT);S.pers.morale=clamp(S.pers.morale+(o.win?1:-1),5,100);checkOver();save();render();
    modal(`<div class="alert ${o.win?'g':'r'}">${o.win?(d.own?'奪還':'占領'):'進攻失敗'}</div><h2>${d.name}</h2>${r.L.map(l=>`<p>${l}。</p>`).join('')}${cap?`<p><b class="g">${cap}。</b></p>`:''}${o.dead.length?`<p class="sm r">潰走：${o.dead.map(g=>g.name).join('、')}</p>`:''}<div class="pol">支持率 ${sg(r.dS)}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});};
  cbs.f=go(1);cbs.a=go(0);
  modal(`<div class="alert">進攻</div><h2>${d.name}</h2><p class="sm">${d.own?'占領されている自国の土地':`${natN(L.e)}の領土`}・${TERN[d.ter]||'平地'}${d.city?'・州の中心都市':''}${d.cap?'・<b class="am">相手の首都。落とせば降伏させられる</b>':''}</p>
  <dl class="kv2"><dt>敵の守り</dt><dd>${d.egar.length}個部隊(推定)${d.fort?`・陣地${d.fort>1?'は堅い':'あり'}`:''}</dd><dt>見込み</dt><dd>${!un.length?'部隊を選ぶ':`<b class="${od>=1.3?'g':od>=.95?'':od>=.7?'am':'r'}">${od>=1.3?'優勢':od>=.95?'互角':od>=.7?'やや劣勢':'劣勢'}</b>`}</dd><dt>支援</dt><dd>砲兵の射撃 ${lwArtSup(a.ids)}回　爆撃 ${Math.min(3,airStrikers(0).length)}回<br><span class="sm mut">投入しない特科・ロケットの部隊が後方から撃つ</span></dd><dt>今月の進攻</dt><dd>${lwAtkUsed()+1}回目／${LW_ATK}回</dd></dl>
  <h3 class="sub">投入する部隊 ${un.length}／5</h3><div class="chips">${pool.map(g=>`<button class="${a.ids.includes(g.id)?'on':''}" data-m="u${g.id}">${g.name}<small>戦力${g.hp}</small></button>`).join('')}</div><p class="sm mut">攻めた部隊は、今月はもう進攻に出せない。敵が攻めてきたときの守りにはつける。</p>
  <div class="mbtn col"><button class="btn pri" data-m="f" ${un.length?'':'disabled'}>自ら指揮する</button><button class="btn" data-m="a" ${un.length?'':'disabled'}>参謀に任せる<small>自動で決着をつける</small></button><button class="btn" data-m="x">やめる</button></div>`,cbs);}
/* ---------- 知らせ ---------- */
function lwOffer(asked){const L=S.lw;if(!L)return;const e=L.e,T=lwTerms(),bad=T.k==='cede';
  modal(`<div class="alert ${bad?'r':'g'}">講和</div><h2>${asked?`${natN(e)}が交渉に応じた`:`${natN(e)}が講和を打診してきた`}</h2><p>条件：<b>${T.t}</b>。</p><p class="sm mut">${bad?'受け入れれば戦いは終わるが、中心都市を失った州は経済から外れたままになる。あとから奪還の戦いを起こすこともできる。':'受け入れれば、2年のあいだ国境は静かになる。'}</p><div class="mbtn"><button class="btn ${bad?'':'pri'}" data-m="y">受け入れる</button><button class="btn ${bad?'pri':''}" data-m="n">戦いを続ける</button></div>`,
  {y:()=>{closeModal();if(!S.lw)return;const rep=[];lwEnd('peace',rep);for(const r of rep)hlog(r[0],r[1]);checkOver();save();render();toast(rep[0][0]);if(S.over)showOver();},n:()=>{closeModal();hlog('講和の条件を退けた','');save();render();}});}
function lwShow(){const L=S.lw;if(!L||S.over||!L.q||!L.q.length)return;const q=L.q.shift(),e=L.e;
  if(q.k==='offer')return lwOffer(false);
  const pw=lwPow(),E=lwE(),cbs={hd:()=>{closeModal();ui.tab='gov';ui.sub.gov='hd';render();window.scrollTo(0,0);}};for(const s of LWST.slice(0,2))cbs['s_'+s[0]]=()=>{closeModal();L.st=s[0];save();render();};
  modal(`<div class="alert r">侵攻</div><h2>${NATS[e].f}軍が国境を越えた</h2><p>宣戦の通告はなかった。${natN(e)}軍は首都${NAT.cap}を目指して進んでくる。<b>首都が落ちれば、政府は降伏し、任期はそこで終わる。</b></p>
  <dl class="kv2"><dt>敵の兵力(見積り)</dt><dd>${Math.round(E)}</dd><dt>我が防衛力</dt><dd>${Math.round(pw.def)}(本土の陸上部隊 ${pw.n}個)</dd></dl><p class="sm mut">敵は毎月、国境のプロヴィンスへ攻めかかってくる。そのつど、自ら指揮するか任せるかを選ぶ。こちらからも「国政 → 国防」か世界地図から、月に3回まで進攻できる。島の部隊を戻す、緊急動員、停戦といった手も国防にまとめてある。まず構えを決める。</p>
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
    h+=`<section class="sec"><h2>本土の戦い</h2><p class="al r">${L.att?`${natN(e)}と交戦中`:`${natN(e)}軍が侵攻している`}(${mo}か月目)</p>${(L.bq&&L.bq.length)||(S.gpend&&S.gpend.home)?`<p class="al r">決着を待っている戦いがある。「翌月へ」を押すと対応を決められる</p>`:''}
    <dl class="kv2"><dt>占領された土地</dt><dd class="${occ?'r':''}">${occ}／${G.orig}プロヴィンス${gone.length?`(${gone.map(stName).join('、')}を失った)`:''}</dd><dt>こちらが占領</dt><dd>${G.got}プロヴィンス</dd><dt>今月の前線</dt><dd>${L.mLost?`<span class="r">失った ${L.mLost}</span>`:''}${L.mLost&&L.mGain?'　':''}${L.mGain?`<span class="g">取った ${L.mGain}</span>`:''}${L.mLost||L.mGain?'':'動かず'}</dd><dt>敵の勢い</dt><dd>${Math.round(L.es*clamp(1-.02*occ,.72,1)*100)}%<span class="mut">(損害と、補給線の伸びで落ちる)</span></dd><dt>首都</dt><dd>${NAT.cap}<span class="mut">(落ちれば任期は終わる)</span></dd></dl>
    <div class="st3"><div><label>我が防衛力 ${Math.round(eff)}</label>${bar(eff/mx*100,'b')}</div><div><label>敵の兵力 ${Math.round(E)}</label>${bar(E/mx*100,'r')}</div></div>
    <h3 class="sub">構え</h3>${LWST.map(s=>`<div class="lopt ${L.st===s[0]?'on':''}"><div class="uh"><b>${L.st===s[0]?'● ':''}${s[1]}</b><span class="loc">防衛力 ${sg(Math.round((s[3]-1)*100))}%・損害 ${sg(Math.round((s[4]-1)*100))}%</span></div><p class="sm mut">${s[2]}</p>${L.st===s[0]?'':`<button class="btn sm" onclick="A.lwst('${s[0]}')">この構えに改める</button>`}</div>`).join('')}
    <h3 class="sub">前線の戦い</h3><div class="chips"><button class="${L.auto?'':'on'}" onclick="A.lwauto(0)">そのつど自分で決める</button><button class="${L.auto?'on':''}" onclick="A.lwauto(1)">現地の指揮官に任せる</button></div><p class="sm mut">任せても、州の中心都市と首都の戦いは判断を求められる。</p>
    <h3 class="sub">進攻　今月 ${lwAtkUsed()}／${LW_ATK}回</h3>${(()=>{const why=lwAtkWhy(),tg=lwCand(e,ME(),false,false).slice(0,6);if(!tg.length)return'<p class="sm mut">攻め込めるプロヴィンスがない。</p>';
      return `<p class="sm mut">${why||`出せる部隊 ${lwAtkPool(S.month).length}個。世界地図(国政 → 情勢)でプロヴィンスを選んで攻めることもできる。`}</p>`+tg.map(p=>{const pr=WORLD.P[p],own=pr.nat===ME(),city=WORLD.ST[pr.st].city===p;return `<div class="urow"><div class="grow"><b>${lwPName(p)}</b> <span class="tag">${own?'奪還':'敵地'}</span>${city?` <span class="tag">${pr.cap&&!own?'首都':'都市'}</span>`:''}<br><span class="sm mut">${stName(WORLD.ST[pr.st])}・${TERN[pr.ter]||'平地'}</span></div><button class="btn sm" ${why?'disabled':''} onclick="A.lwatk(${p})">進攻</button></div>`;}).join('');})()}
    ${L.res&&L.res.length?`<h3 class="sub">最近の戦い</h3><p class="sm">${L.res.slice(0,6).map(r=>`<span class="${r.win?'g':'r'}">${r.t==='atk'?'攻':'守'}　${r.name}　${r.win?(r.t==='atk'?'奪取':'保持'):(r.t==='atk'?'失敗':'喪失')}</span>`).join('<br>')}</p>`:''}
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
    if(L){a.unshift([`${natN(L.e)}${L.att?'と本土で交戦中':'軍が本土に侵攻している'}。占領された土地 ${lwOcc()}プロヴィンス(国政 → 国防)`,'r']);const b=(S.gpend&&S.gpend.home?S.gpend:null)||(L.bq&&L.bq[0]);if(b)a.unshift([`${b.cap?'首都':''}${b.name}に敵が攻めかかっている。「翌月へ」で対応を決める`,'r']);}
    else{for(const h of S.w.hot){if((h.a!==me&&h.b!==me)||h.t<60)continue;const e=h.a===me?h.b:h.a;if(al[e]&&lwGeo().nb[e])a.push([`${natN(e)}との国境の緊張が高い(${Math.round(h.t)})。国政 → 国防`,h.t>=75?'r':'am']);}
      if(lwOcc())a.push(['占領されたままの土地がある(国政 → 国防)','am']);}
    return a;};}
Object.assign(A,{
  lwauto(v){const L=S.lw;if(!L)return;L.auto=v?1:0;save();render();},
  lwatk(p){const L=S.lw,why=lwAtkWhy();if(!L)return;if(why)return toast(why);if(!lwCanAtk(p))return toast('ここへは攻め込めない。自国の土地に接する、相手の持つプロヴィンスを選ぶ');
    ui.lwa={d:lwMkAtk(p),ids:lwAtkPool(S.month).slice(0,5).map(g=>g.id)};lwAtkModal();},
  lwst(k){const L=S.lw;if(!L||!LWST.some(s=>s[0]===k)||L.st===k)return;L.st=k;hlog(`本土の構えを「${LWST.find(s=>s[0]===k)[1]}」に改めた`,'');save();render();},
  lwask(){const L=S.lw,P=S.pol;if(!L||(L.bq&&L.bq.length)||S.gpend||mq.length||P.pp<30||(L.askM!=null&&S.month-L.askM<3))return;P.pp-=30;L.askM=S.month;const mo=S.month-L.m0,T=lwTerms(),p=clamp(.12+L.ex*.02+mo*.012+(L.es<.75?.2:0)+(T.k==='cede'?.3:0)+(T.k==='rep'?.15:0),.05,.92);
    if(Math.random()<p){save();render();lwOffer(true);}else{hlog(`${natN(L.e)}に停戦を申し入れたが、応じなかった`,'');save();render();toast('相手は交渉に応じなかった');}},
  lwmob(){const P=S.pol,why=lwMobWhy();if(why)return toast(why);const n=2+P.law.con;
    confirmM(`予備役を招集し、普通科連隊を<b>${n}個</b>ただちに編成する。練度と戦力は低い。資金150億円と政治力20を使い、安定度が4下がる。次に使えるのは2年後。`,()=>{if(lwMobWhy())return;spend(150);P.pp-=20;P.stab=clamp(P.stab-4,0,100);grpAdd({reg:-5,lab:-3,mil:3});
      for(let i=0;i<n;i++){const g=addGnd('inf','home',{tr:RI(30,40)});g.hp=7;}S.enl.gnd.n+=n*90;S.w.mobM=S.month;hlog(`緊急動員：普通科連隊 ${n}個を編成`,'am');wNews(`${NAT.n}が予備役の招集を発表`,'am');_M=null;save();render();toast(`${n}個連隊を編成した`);},'動員する');},
  lwret(e){const P=S.pol,n=lwGeo().lost[e]||0;if(S.lw||!n||P.pp<40||S.gpend||S.pending||S.over||inWar(e))return;
    confirmM(`${natN(e)}が占領している${n}プロヴィンスを取り戻すため、こちらから戦いを起こす。政治力40を使う。攻め込む側になるので、周辺国の目は厳しくなる。`,()=>{if(S.lw||inWar(e))return;P.pp-=40;const rep=[],W=S.w;W.n.forEach((x,i)=>{if(i!==ME()&&i!==e)relAdd(i,x.bloc&&x.bloc===W.n[e].bloc?-8:-2);});lwStart(e,rep,true);for(const r of rep)hlog(r[0],r[1]);save();render();},'開戦する');}
});
