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
const lwE=()=>{const L=S.lw;return L.eu?gstr(L.eu):lwEnemy(L.e);};
/* ---------- 国境の緊張 ---------- */
function lwSync(){if(!S||!S.w)return;const W=S.w,me=ME(),rv=RVN(),pb=W.n[me].bloc;if(S.lw===undefined)S.lw=null;if(!S.dep)S.dep={auto:1};if(WORLD&&WORLD.pown)lwPos();if(S.lw){const L=S.lw;if(!L.bq)L.bq=[];if(L.bat){L.bq.push(L.bat);L.bat=null;}if(!L.eu){L.bq=[];if(S.gpend&&S.gpend.home)S.gpend=null;lwPos();if(S.dep.auto)lwDeploy(true);lwArmy();}}   // 前の版の交戦中の記録：敵の部隊を並べ直し、待っていた戦いは組み直す
  for(const e of lwNb()){if(lwHot(e))continue;const n=W.n[e],hostile=n.rel<-15||(n.bloc===2&&pb!==2);W.hot.push({a:Math.min(me,e),b:Math.max(me,e),t:e===rv?RI(38,48):hostile?RI(26,40):RI(6,20)});}}
function lwMonth(rep){const W=S.w,me=ME(),rv=RVN(),al=natAlive(),C=S.cfg;lwSync();lwPos();if(S.lw)return lwStep(rep);if(S.dep.auto)lwDeploy();if(C.landW===0||C.landW===false)return;
  const nbs=lwNb(),P=lwPow(),pb=W.n[me].bloc;
  for(const h of W.hot){if(h.a!==me&&h.b!==me)continue;const e=h.a===me?h.b:h.a,n=W.n[e];if(!al[e]||!nbs.includes(e)){h.t=Math.max(0,h.t-2);continue;}
    if(inWar(e)){h.t=clamp(h.t-1.2,0,100);continue;}
    const E=lwEnemy(e),det=P.def/Math.max(1,E),opp=(n.bloc===2&&pb!==2)||(pb&&n.bloc&&n.bloc!==pb),nap=n.nap>S.month,calm=h.calm>S.month;
    h.t=clamp(h.t+(R(-2.2,3.2)+(n.rel<-40?1.4:n.rel<-15?.6:n.rel>30?-2.2:n.rel>10?-1:0)+(opp?.5:0)+(n.gov===4?.4:0)+(e===rv?clamp((S.tension-45)*.05,-.8,1.2):0))*(.6+.4*C.eAggr)+PL().pol.drift*.5*PL().sit.landK-(det>=1.25?1.4:det>=1?.6:det<.75?-.7:0)-(n.def?3:0)-(n.trd?.5:0)-(nap?4:0)-(calm?4:0),0,100);
    if(h.t<55){h.n1=0;h.n2=0;}
    if(h.t>=60&&!h.n1){h.n1=1;const t=`${natN(e)}が${NAT.n}との国境に兵力を集めている`;wNews(t,'am');rep.unshift(['国境：'+t,'am']);}
    if(h.t>=75&&!h.n2){h.n2=1;rep.unshift([`国境：${natN(e)}軍の動きが慌ただしい。侵攻の恐れがある(国政 → 国防)`,'r']);if(!S.pol.evq)S.pol.evq={k:'border',x:e};}
    if(h.t>=85&&S.month>=12&&!nap&&!calm&&n.rel<-10&&Math.random()<Math.min(.6,.22*PL().sit.landK)){
      if(E*R(.85,1.25)>P.def*.95){lwStart(e,rep);return;}
      if(h.t>=93){h.t-=RI(10,16);const t=`${natN(e)}は国境の部隊を引いた。${NAT.n}の守りを前に、踏み切れなかったとみられる`;wNews(t,'g');rep.push(['国境：'+t,'g']);}}}}
/* ---------- 開戦 ---------- */
function lwStart(e,rep,byMe){const W=S.w,me=ME(),rv=RVN(),n=W.n[e],h=lwHot(e),al=natAlive(),pb=W.n[me].bloc;
  S.lw={e,m0:S.month,att:byMe?1:0,st:byMe?'ctr':'hold',es:1,ex:0,k:0,bq:[],auto:0,res:[],mLost:0,mGain:0,askM:null,offM:null,q:byMe?[]:[{k:'start'}],sh:0,lost:0,won:0};
  W.wars.push({id:++W.seq,a:byMe?me:e,d:byMe?e:me,m0:S.month,ex:0,pl:1});n.trd=0;n.def=0;n.imp=0;n.nap=0;n.rel=Math.min(n.rel,-70);n.rb=Math.min(n.rb||0,-30);if(h){h.t=100;h.calm=0;}
  S.tension=clamp(S.tension+(e===rv?15:5),0,100);S.support=clamp(S.support+(byMe?-2:4),0,100);if(!byMe)S.pol.stab=clamp(S.pol.stab+3,0,100);
  const t=byMe?`${NAT.f}が失地の奪還を掲げ、${NATS[e].f}に攻め込んだ`:`${NATS[e].f}が${NAT.f}に侵攻した`;wNews(t,'r');rep.unshift([(byMe?'開戦：':'侵攻：')+t,'r']);
  const fr=W.n.map((x,i)=>i).filter(i=>i!==me&&i!==e&&al[i]&&((pb&&W.n[i].bloc===pb)||W.n[i].def));
  if(fr.length&&!byMe){for(const i of fr)relAdd(i,3);wNews(`${fr.slice(0,4).map(natN).join('、')}${fr.length>4?'など':''}が${NAT.n}への支援を表明`,'g');}
  lwPos();lwArmy();W.ver++;_M=null;}
/* ---------- 配置 ---------- */
// 本土の陸上部隊はプロヴィンスにいる(g.pv)。敵の部隊は交戦中だけ S.lw.eu に並ぶ。
// 戦いは、隣り合うプロヴィンスの部隊どうしで行う。部隊は月に1度、動くか攻めるかできる(g.am)
const LWSEQ_E=['inf','arm','inf','art','inf','inf','arm','aa'];
const lwCapP=()=>{const c=lwGeo().cap;return c?c.id:0;};
const lwAt=p=>S.gnd.filter(g=>g.loc==='home'&&g.pv===p);
const lwEAt=p=>S.lw&&S.lw.eu?S.lw.eu.filter(u=>u.pv===p):[];
const lwActed=g=>!!S.lw&&g.am===S.month;
const lwMvR=g=>{const m=gST(g).mv;return m>=4?4:m>=3?3:2;};
const lwByStr=(a,b)=>gPW(b)*b.hp-gPW(a)*a.hp;
const lwD=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
// pから、自国の土地だけを通って届くプロヴィンスと歩数
function lwReach(p,r){const P=WORLD.P,ow=WORLD.pown,me=ME(),d={[p]:0},q=[p];for(let i=0;i<q.length;i++){const c=q[i];if(d[c]>=r)continue;for(const n of P[c].adj)if(ow[n]===me&&d[n]==null){d[n]=d[c]+1;q.push(n);}}return d;}
function lwNearOwn(p){const P=WORLD.P,ow=WORLD.pown,me=ME();if(p!=null&&P[p]){const seen={[p]:1},q=[p];for(let i=0;i<q.length&&i<500;i++){if(ow[q[i]]===me)return q[i];for(const n of P[q[i]].adj)if(!seen[n]){seen[n]=1;q.push(n);}}}return lwCapP();}
// 本土の部隊の居場所を正す。本土に着いたばかりの部隊は首都に入る
function lwPos(){if(!S||!S.w||!WORLD||!WORLD.pown)return;const me=ME(),ow=WORLD.pown,cap=lwCapP();for(const g of S.gnd){if(g.loc!=='home'){if(g.pv!=null)delete g.pv;continue;}if(g.pv==null||!WORLD.P[g.pv])g.pv=cap;else if(ow[g.pv]!==me)g.pv=lwNearOwn(g.pv);}}
// fromの土地のうち、toの土地に接するもの。toが本来の持ち主の土地を先に、あとはfromの首都に近い順
function lwCand(from,to,ownOnly,jit){const P=WORLD.P,ow=WORLD.pown,tc=WORLD.nat[from],cand=[],sc={};
  for(let p=0;p<P.length;p++)if(ow[p]===from&&(!ownOnly||P[p].nat===to)&&P[p].adj.some(q=>ow[q]===to)){cand.push(p);sc[p]=(P[p].nat===to?-1e6:0)+((P[p].x-tc.x)*(P[p].x-tc.x)+(P[p].y-tc.y)*(P[p].y-tc.y))*(jit?R(.55,1.45):1);}
  return cand.sort((x,y)=>sc[x]-sc[y]);}
const lwDir=(pr,to)=>{const dx=to.x-pr.x,dy=to.y-pr.y;return Math.abs(dy)>=Math.abs(dx)?(dy<0?0:2):(dx>0?1:3);};
const lwPName=p=>{const pr=WORLD.P[p],s=WORLD.ST[pr.st];return s.city===p?stCity(s):`${stName(s)}の${TERN[pr.ter]||'平地'}`;};
// どのプロヴィンスにもいる郷土防衛隊。都市では少し厚く、首都には警備隊もいる
function lwMilitia(p){const con=S.pol.law.con,pr=WORLD.P[p],city=WORLD.ST[pr.st].city===p,hp=clamp(Math.round((5+con+(city?2:0))*(1+(polSum(1).grdK||0)*.5)),3,10),m=[{type:'inf',hp,name:'郷土防衛隊',tr:35+con*8}];if(city&&pr.cap)m.push({type:'inf',hp,name:'首都警備隊',tr:55});return m;}
// 守りにつくのは、そのプロヴィンスにいる部隊(強い順に7個)と郷土防衛隊
function lwDefenders(gp){return lwAt(gp.pid).sort(lwByStr).slice(0,7).map(gRef).concat(lwMilitia(gp.pid));}
// 参謀の配置：脅威の大きい国境に厚く置き、首都に1個残す。手で動かした部隊(pin)は動かさない
function lwDeploy(all){lwPos();const me=ME(),P=WORLD.P,ow=WORLD.pown,L=S.lw,cap=lwCapP(),w={},un=S.gnd.filter(g=>g.loc==='home'&&(all||!g.pin)&&!(L&&(g.am===S.month||g.fx===S.month)));if(!un.length)return 0;
  for(const p of P){if(ow[p.id]!==me)continue;let t=0;for(const q of p.adj){const o=ow[q];if(o===me)continue;if(L){if(o===L.e)t+=6+gstr(lwEAt(q))/10;}else{const h=lwHot(o);if(h&&h.t>=30)t+=h.t/10;}}
    if(t>0)w[p.id]=t*(WORLD.ST[p.st].city===p.id?1.5:1)*(1+2/(1+lwD(p,P[cap])/12));}
  const keys=Object.keys(w).map(Number);let n=0;if(!keys.length){for(const g of un)if(g.pv!==cap){g.pv=cap;n++;}return n;}
  const load={};for(const g of S.gnd)if(g.loc==='home'&&!un.includes(g))load[g.pv]=(load[g.pv]||0)+g.hp*gPW(g);
  un.sort(lwByStr);if(un.length>=4&&!(load[cap]>0)){const k=un.pop();if(k.pv!==cap){k.pv=cap;n++;}}
  for(const g of un){let best=keys[0],bv=-1;for(const k of keys){const v=w[k]/(1+(load[k]||0)/45);if(v>bv){bv=v;best=k;}}if(g.pv!==best){g.pv=best;n++;}load[best]=(load[best]||0)+g.hp*gPW(g);}
  return n;}
/* ---------- 敵の部隊 ---------- */
// 開戦のとき、相手がこの国境に回す兵力を、部隊として並べる
function lwArmy(){const L=S.lw,n=clamp(Math.round(lwEnemy(L.e)/50),3,16);L.eu=[];L.eseq=0;L.en0=n;for(let i=0;i<n;i++)L.eu.push({id:++L.eseq,t:LWSEQ_E[i%LWSEQ_E.length],hp:10,pv:-1,am:-1});lwEDeploy();}
// 敵の配置：こちらの首都に近い前線ほど厚い。前線を離れた部隊は前線へ送られる
function lwEDeploy(){const L=S.lw,me=ME(),e=L.e,P=WORLD.P,ow=WORLD.pown,cap=P[lwCapP()],F=lwCand(e,me,false,false);
  if(!F.length){const hc=P.find(p=>p.nat===e&&p.cap&&ow[p.id]===e)||P.find(p=>ow[p.id]===e);for(const u of L.eu)if(!P[u.pv]||ow[u.pv]!==e)u.pv=hc?hc.id:-1;return;}
  F.sort((a,b)=>lwD(P[a],cap)-lwD(P[b],cap));const inF=new Set(F),cnt={};for(const u of L.eu)if(inF.has(u.pv))cnt[u.pv]=(cnt[u.pv]||0)+1;
  for(const u of L.eu){if(inF.has(u.pv))continue;let best=F[0],bv=-1;F.forEach((p,i)=>{const v=1/(1+i*.3)/(1+(cnt[p]||0)*1.1);if(v>bv){bv=v;best=p;}});u.pv=best;cnt[best]=(cnt[best]||0)+1;}}
/* ---------- 戦いを組む ---------- */
// 敵が攻めてくる戦い。攻め手は、隣のプロヴィンスにいる敵の部隊
function lwMkBat(p,att){const Wd=WORLD,pr=Wd.P[p],s=Wd.ST[pr.st],city=s.city===p&&pr.nat===ME()?1:0,cap=city&&pr.cap?1:0;
  return{home:1,z:0,pid:p,seed:RI(1,999999999),name:lwPName(p),sname:stName(s),ter:pr.ter,cap,city,dir:lwDir(pr,Wd.P[att[0].pv]||Wd.nat[S.lw.e]),L:cap?2.8:city||att.length>=4?2.4:2.1,fr:1,force:att.map(u=>({t:u.t,hp:u.hp,eref:u.id}))};}
// こちらが攻める戦い。守り手は、そのプロヴィンスにいる敵の部隊と、都市の守備隊
function lwMkAtk(q,ids){const Wd=WORLD,pr=Wd.P[q],s=Wd.ST[pr.st],me=ME(),own=pr.nat===me?1:0,city=s.city===q?1:0,cap=city&&pr.cap&&!own?1:0,egar=lwEAt(q).sort(lwByStr).slice(0,6).map(u=>({t:u.t,hp:u.hp,eref:u.id})),g0=S.gnd.find(g=>ids&&ids[0]===g.id);
  if(city){egar.push({t:'inf',hp:own?6:7});if(cap){egar.push({t:'inf',hp:8});egar.push({t:'art',hp:7});}}
  return{home:1,atk:1,z:0,pid:q,seed:RI(1,999999999),name:lwPName(q),sname:stName(s),ter:pr.ter,cap,city,own,dir:lwDir(pr,g0&&Wd.P[g0.pv]||Wd.nat[me]),egar,empty:egar.length?0:1,fort:cap?2:city&&!own?1:0,units:ids||[]};}
// qへ攻め込める部隊：隣のプロヴィンスにいて、今月まだ動いておらず、戦力が3以上
function lwAtkPool(q,m){lwPos();const me=ME(),adj=new Set(WORLD.P[q].adj.filter(x=>WORLD.pown[x]===me));if(m==null)m=S.month;return S.gnd.filter(g=>g.loc==='home'&&adj.has(g.pv)&&g.am!==m&&g.hp>=3).sort(lwByStr);}
const lwCanAtk=p=>{const L=S.lw;return !!L&&WORLD.pown[p]===L.e&&WORLD.P[p].adj.some(q=>WORLD.pown[q]===ME());};
const lwAtkWhy=q=>{const L=S.lw;return !L?'交戦中ではない':S.gpend||(L.bq&&L.bq.length)||S.pending?'先に、決着を待っている戦いを片づける':q!=null&&!lwAtkPool(q).length?'隣のプロヴィンスに、今月動ける部隊がいない(戦力3以上で、まだ動いていない部隊を寄せる)':'';};
// 後方からの支援射撃：戦場に出ない特科・ロケットの部隊のうち、そのプロヴィンスか隣にいるもの
function lwArtSup(pid,used){const me=ME(),near=new Set(WORLD.P[pid].adj.filter(x=>WORLD.pown[x]===me).concat([pid]));return Math.min(3,S.gnd.filter(g=>g.loc==='home'&&near.has(g.pv)&&gArt(g.type)&&g.hp>=4&&!used.includes(g.id)).length);}
// 進攻の見込み。こちらの戦力÷敵の守り
function lwAtkOdds(d,un){if(d.empty)return 9;const M=mods(),X=polSum(1);return (gstr(un,g=>.8+.4*g.tr/100)*(1+(M.gndPow||0))*(1+(X.ofK||0))+airStrikers(0).length*20+lwArtSup(d.pid,un.map(g=>g.id))*15)/Math.max(1,gstr(d.egar)*(1+.05*eTech())*(1.15+.1*d.fort)*(LWTER[d.ter]||1));}
/* ---------- 戦いの決着を世界に反映する ---------- */
function lwNote(t,name,win){const L=S.lw;if(!L)return;(L.res=L.res||[]).unshift({t,name,win:win?1:0});if(L.res.length>8)L.res.pop();}
// 退く：隣の自国のプロヴィンスのうち首都に近いほうへ。退路がなければ、戦力を失って首都へ逃れる
function lwRetreatP(p){const P=WORLD.P,ow=WORLD.pown,me=ME(),cap=P[lwCapP()],to=P[p].adj.filter(q=>ow[q]===me).sort((a,b)=>lwD(P[a],cap)-lwD(P[b],cap))[0],un=lwAt(p);for(const g of un){if(to!=null)g.pv=to;else{g.pv=cap.id;g.hp=Math.min(g.hp,2);}}return to==null?un.length:0;}
function lwRetreatE(q){const L=S.lw,P=WORLD.P,ow=WORLD.pown,ec=WORLD.nat[L.e],to=P[q].adj.filter(x=>ow[x]===L.e).sort((a,b)=>lwD(P[a],ec)-lwD(P[b],ec))[0];let lost=0;for(const u of lwEAt(q)){if(to!=null)u.pv=to;else{L.eu=L.eu.filter(y=>y!==u);lost++;}}return lost;}
// 戦術戦のあと、戦場に出た敵部隊の戦力を写す。自動の決着では、勝敗に応じて削る
function lwEWrite(){const L=S.lw;if(!L||!L.eu||!G)return;for(const u of G.u){if(u.side!=='E'||!u.eref)continue;const x=L.eu.find(y=>y.id===u.eref);if(!x)continue;x.fx=S.month;if(u.hp<=0)L.eu=L.eu.filter(y=>y!==x);else x.hp=u.hp;}}
function lwEHit(list,lost){const L=S.lw;for(const x of list){const u=L.eu.find(y=>y.id===x.eref);if(!u)continue;u.fx=S.month;u.hp-=lost?RI(1,3):RI(0,1);if(u.hp<=0)L.eu=L.eu.filter(y=>y!==u);}}
// 守る戦い。支持率と緊張度の増減、結果の文を返す
function lwBatEnd(win,why,gp){const L=S.lw,e=L.e,o=[],big=gp.city;let dS,dT=0;lwNote('def',gp.name,win);
  if(win){L.ex+=big?3:1;if(big)L.sh=S.month+1;L.won=(L.won||0)+1;if(big||why!=='auto')S.stats.wins++;dS=gp.cap?8:big?5:2;o.push(`${gp.name}を守り抜いた${big?`。${natN(e)}軍の攻勢は勢いを失った`:''}`);hlog(`${gp.name}：迫る${natN(e)}軍を退けた`,'g');}
  else{provTake(gp.pid,e);S.w.ver++;const cut=lwRetreatP(gp.pid);let n=0;for(const x of gp.force){const u=L.eu.find(y=>y.id===x.eref);if(u&&n<3){u.pv=gp.pid;n++;}}
    L.lost=(L.lost||0)+1;L.mLost=(L.mLost||0)+1;if(why!=='retreat'&&(big||why!=='auto'))S.stats.loss++;dS=why==='retreat'?(big?-4:-1):gp.cap?-10:big?-6:-2;dT=big?1:0;
    o.push(gp.cap?`首都${gp.name}が${natN(e)}軍の手に落ちた`:big?`${gp.name}は${natN(e)}軍の手に落ちた。${gp.sname}は経済から外れる`:`${gp.name}を失った`);if(cut)o.push(`退路を断たれた${cut}個部隊が、戦力を失って首都へ逃れた`);
    hlog(`${gp.name}が${natN(e)}軍に占領された`,'r');if(big)wNews(`${natN(e)}軍が${gp.cap?'首都':''}${gp.name}を占領`,'r');}
  _M=null;return{dS,dT,L:o};}
// 攻める戦い。勝てば、攻めた部隊がそのプロヴィンスへ進む
function lwAtkEnd(win,why,d){const L=S.lw,e=L.e,o=[];let dS,dT=0;lwNote('atk',d.name,win);
  if(win){provTake(d.pid,ME());S.w.ver++;const cut=lwRetreatE(d.pid);for(const g of S.gnd)if(d.units.includes(g.id)&&g.loc==='home'&&g.rt!==S.month)g.pv=d.pid;
    L.ex+=1;L.mGain=(L.mGain||0)+1;if(why!=='auto'&&!d.empty)S.stats.wins++;dS=d.own?(d.city?5:2):(d.city?3:1);
    o.push(d.own?`${d.name}を奪い返した${d.city?`。${d.sname}が経済に戻る`:''}`:`${natN(e)}の${d.name}を占領した`);if(cut)o.push(`退路を断たれた敵の${cut}個部隊が降伏した`);
    hlog(d.own?`${d.name}を${natN(e)}軍から奪い返した`:`${natN(e)}の${d.name}を占領した`,'g');if(d.city)wNews(`${NAT.n}軍が${d.own?'':natN(e)+'の'}${d.name}を${d.own?'奪還':'占領'}`,'g');if(d.cap)L.capE=1;}
  else{if(why!=='auto')S.stats.loss++;dS=why==='retreat'?-1:-2;o.push(`${d.name}への進攻は失敗した`);hlog(`${d.name}への進攻は失敗した`,'r');}
  _M=null;return{dS,dT,L:o};}
// 相手の首都を落としていれば、その場で降伏させる。知らせの文を返す
function lwCapEnd(){if(!S.lw||!S.lw.capE)return'';const rep=[];lwEnd('win',rep);for(const r of rep)hlog(r[0],r[1]);return rep.length?rep[rep.length-1][0].replace(/^講和：/,''):'';}
// 本土の戦いで戦力が尽きた部隊は、消えずに潰走する(戦力1で残る)
const lwKill=un=>{const dead=un.filter(g=>g.hp<=0);for(const g of dead){g.hp=1;g.tr=Math.max(20,g.tr-6);g.rt=S.month;}return dead;};
// 自動で決着をつける
function lwResolveDef(gp){const L=S.lw,M=mods(),X=polSum(1),st=LWST.find(x=>x[0]===L.st)||LWST[0],def=lwDefenders(gp),un=S.gnd.filter(g=>def.some(d=>d.ref===g.id));
  const P=gstr(def,g=>.8+.4*g.tr/100)*(1+(M.gndPow||0))*1.35*st[3]*(1+(X.hdK||0))*(LWTER[gp.ter]||1)+(un.length?airStrikers(0).length*25+lwArtSup(gp.pid,un.map(g=>g.id))*15:0),E=gstr(gp.force)*(1+.05*eTech()),win=Math.random()<clamp(.5+(P-E)/Math.max(1,P+E)*.9,.06,.94);
  for(const g of un){g.hp-=Math.round((win?RI(0,1):RI(0,2)+(gp.city?1:0))*st[4]);g.tr=Math.min(100,g.tr+2);g.fx=S.month;}lwEHit(gp.force,win);return{win,dead:lwKill(un),r:lwBatEnd(win,'auto',gp)};}
function lwResolveAtk(d,un){const od=lwAtkOdds(d,un),win=d.empty||Math.random()<clamp(.5+(od-1)/(od+1)*.9,.05,.95);
  if(!d.empty)for(const g of un){g.hp-=win?RI(0,1):RI(1,2);g.tr=Math.min(100,g.tr+2);g.fx=S.month;}lwEHit(d.egar,win);return{win,dead:lwKill(un),r:lwAtkEnd(win,'auto',d)};}
/* ---------- 月の処理 ---------- */
// 参謀による進攻。構えに従い、勝ち目のある相手にだけ仕掛ける。先月動かなかった部隊を使う
function lwStaff(lr){const L=S.lw,me=ME(),e=L.e,pm=S.month-1;if(L.st==='hold')return;const ctr=L.st==='ctr';let n=0;
  for(const q of lwCand(e,me,!ctr,false)){if(n>=(ctr?3:2)||L.capE)break;const un=lwAtkPool(q,pm).filter(g=>g.sm!==S.month&&g.hp>=4).slice(0,5);if(!un.length)continue;const d=lwMkAtk(q,un.map(g=>g.id));if(lwAtkOdds(d,un)<(ctr?.9:1.05))continue;
    for(const g of un)g.sm=S.month;const o=lwResolveAtk(d,un);n++;S.support=clamp(S.support+o.r.dS*.5,0,100);lr.push([`本土：参謀の進攻　${o.r.L.join('。')}${o.dead.length?`(潰走：${o.dead.map(g=>g.name).join('、')})`:''}`,o.win?'g':'r']);}}
// 敵の番：補充し、前線へ寄せ、勝ち目のあるプロヴィンスへ攻めかかる(月に3か所まで)
function lwETurn(lr){const L=S.lw,me=ME(),e=L.e,P=WORLD.P,ow=WORLD.pown,st=LWST.find(x=>x[0]===L.st)||LWST[0],M=mods(),X=polSum(1),mo=S.month-L.m0,cap=P[lwCapP()];
  for(const u of L.eu){const deep=P[u.pv]&&P[u.pv].nat!==e;u.hp=Math.min(10,u.hp+(u.fx>=S.month-1?(deep?0:1):2));}
  if(L.eu.length<L.en0&&S.month%2===0&&L.ex<45)L.eu.push({id:++L.eseq,t:LWSEQ_E[L.eseq%LWSEQ_E.length],hp:8,pv:-1,am:-1});
  lwEDeploy();if(L.sh>=S.month)return 0;
  const cands=[];for(const p of lwCand(me,e,false,false)){const att=[];for(const q of P[p].adj)if(ow[q]===e)for(const u of lwEAt(q))if(u.am!==S.month&&u.hp>=4)att.push(u);if(!att.length)continue;att.sort(lwByStr);
    const a6=att.slice(0,6),dv=gstr(lwDefenders({pid:p}),g=>.8+.4*(g.tr||50)/100)*(1+(M.gndPow||0))*1.35*st[3]*(1+(X.hdK||0))*(LWTER[P[p].ter]||1),od=gstr(a6)*(1+.05*eTech())*(mo<2&&!L.att?1.15:1)/Math.max(1,dv);
    cands.push({p,a6,od,v:od*(WORLD.ST[P[p].st].city===p?1.4:1)*(1+1.5/(1+lwD(P[p],cap)/10))*R(.8,1.2)});}
  cands.sort((a,b)=>b.v-a.v);let n=0;const used=new Set();
  for(const c of cands){if(n>=3)break;if(c.od<.95||c.a6.some(u=>used.has(u.id)))continue;for(const u of c.a6){used.add(u.id);u.am=S.month;}n++;const b=lwMkBat(c.p,c.a6);
    if(lwAt(c.p).length&&(b.city||!L.auto)){L.bq.push(b);continue;}
    const o=lwResolveDef(b);S.support=clamp(S.support+o.r.dS*.5,0,100);lr.push([`本土：${o.r.L.join('。')}${o.dead.length?`(潰走：${o.dead.map(g=>g.name).join('、')})`:''}`,o.win?'g':'r']);if(lwCapLost())break;}
  return n;}
function lwStep(rep){const L=S.lw,W=S.w,me=ME(),e=L.e,rv=RVN(),n=W.n[e],mo=S.month-L.m0,lr=[];
  n.rel=Math.min(n.rel,-60);if(e===rv)S.tension=Math.max(S.tension,70);if(!L.bq)L.bq=[];if(!L.eu)lwArmy();lwPos();if(L.bq.length||(S.gpend&&S.gpend.home))return;
  L.k=(L.mLost||0)-(L.mGain||0);L.mLost=0;L.mGain=0;
  if(S.dep.auto)lwDeploy();
  lwStaff(lr);if(L.capE){rep.unshift(...lr);lwEnd('win',rep);return;}
  const nE=lwETurn(lr);
  if(L.bq.length)lr.unshift([`本土：${natN(e)}軍が${L.bq.map(b=>(b.cap?'首都':'')+b.name).join('、')}に攻めかかってきた`,'r']);
  L.ex+=1+.3*nE;if(nE||lr.length)for(const a of S.air||[])if(a.base===0&&airOK(a)&&(a.type==='ftr'||a.type==='atk'||a.type==='bmr'))a.rdy=Math.max(15,a.rdy-6);
  for(const u of L.eu)if(airStrikers(0).length&&WORLD.P[u.pv]&&WORLD.P[u.pv].nat===me&&Math.random()<.2)u.hp=Math.max(2,u.hp-1);   // こちらの領内へ入った敵は、爆撃にさらされる
  L.es=clamp(gstr(L.eu)/Math.max(1,L.en0*55),.1,1.2);
  S.support=clamp(S.support-lwOcc()/Math.max(1,lwGeo().orig)*2.5,0,100);n.stab=clamp(n.stab-.6,5,95);
  if(!lr.length)lr.push(['本土：前線は動いていない','']);rep.unshift(...lr);W.ver++;_M=null;
  if(!L.bq.length&&!lwCapLost()&&mo>=4&&S.month-(L.offM==null?-99:L.offM)>=4&&Math.random()<clamp((mo-3)*.03+L.ex*.004+(L.es<.7?.12:0)+(L.es<.45?.2:0)+(L.k<0?.06:0),0,.6)){L.offM=S.month;L.q.push({k:'offer'});}}
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
  S.lw=null;W.ver++;_M=null;for(const g of S.gnd){delete g.am;delete g.sm;}lwPos();wNews(t,c);rep.push(['講和：'+t,c]);return T;}
/* ---------- 戦いの前の決定 ---------- */
const lwEList=l=>l.map(u=>`${GT[u.t].n}<span class="mut">(戦力${u.hp})</span>`).join('、');
// 敵が攻めてきたとき：自ら指揮する、任せる、明け渡す
function lwPrompt(){const gp=S.gpend,L=S.lw,me=ME();if(!gp||!gp.home||S.over)return;const next=()=>{if(S.over)showOver();else if(gpNext())groundPrompt();};
  if(!L||WORLD.pown[gp.pid]!==me){S.gpend=null;save();return next();}
  gp.force=gp.force.filter(x=>L.eu.some(u=>u.id===x.eref));if(!gp.force.length){S.gpend=null;save();return next();}
  const e=L.e,done=(ttl,body,r)=>{polApply(r.dS,r.dT);checkOver();save();render();modal(`<div class="alert r">${ttl}</div><h2>${gp.name}</h2>${body}<div class="pol">支持率 ${sg(r.dS)}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();next();}});};
  if(!lwAt(gp.pid).length||(L.auto&&!gp.city))return lwAuto(!gp.city);
  save();const left=(L.bq||[]).length;
  modal(`<div class="alert r">${gp.cap?'首都防衛戦':gp.city?'都市の攻防':'前線の防御'}</div><h2>${natN(e)}軍が${gp.name}に${gp.city?'迫る':'攻めかかる'}</h2><p>${gp.cap?'<b class="r">ここが落ちれば、政府は降伏し、任期は終わる。</b>':gp.city?`${gp.sname}の中心都市。落とされると、この州は経済から外れる。`:`${gp.sname}のプロヴィンス。失えば、ここの部隊は隣へ退く。`}敵は${['北','東','南','西'][gp.dir]}から司令部を目指してくる。${gp.city?10:8}ターン守り抜けば退けられる。</p>
  <dl class="kv2"><dt>攻めてくる敵</dt><dd>${lwEList(gp.force)}</dd><dt>ここを守る部隊</dt><dd>${lwDefenders(gp).map(g=>`${g.name}<span class="mut">(戦力${g.hp})</span>`).join('、')}</dd><dt>地形</dt><dd>${TERN[gp.ter]||'平地'}</dd>${left?`<dt>ほかの戦い</dt><dd>このあと${left}か所</dd>`:''}</dl>
  <div class="mbtn col"><button class="btn pri" data-m="f">自ら指揮する</button><button class="btn" data-m="a">現地の指揮官に任せる<small>自動で決着をつける</small></button>${gp.cap?'':`<button class="btn" data-m="r">戦わずに明け渡す<small>部隊は無傷で隣へ退く。支持率 ${gp.city?'−4':'−1'}</small></button>`}${gp.city?'':'<button class="btn" data-m="all">この戦争では、前線の戦いを任せる<small>都市と首都の戦いだけ、判断を求められる。「国政 → 国防」で戻せる</small></button>'}</div>`,
  Object.assign({f:()=>{closeModal();startGround('defend',0);},a:()=>{closeModal();lwAuto();}},gp.cap?{}:{r:()=>{closeModal();S.gpend=null;done('後退',`<p>部隊は${gp.name}を離れ、隣のプロヴィンスへ退いた。</p>`,lwBatEnd(false,'retreat',gp));}},gp.city?{}:{all:()=>{closeModal();L.auto=1;hlog('前線の戦いを現地の指揮官に任せることにした','');lwAuto(true);}}));}
function lwAuto(quiet){const gp=S.gpend,L=S.lw;if(!gp||!gp.home||!L)return;S.gpend=null;const o=lwResolveDef(gp),r=o.r,win=o.win,next=()=>{if(S.over)showOver();else if(gpNext())groundPrompt();};
  polApply(r.dS,r.dT);S.pers.morale=clamp(S.pers.morale+(win?(gp.city?3:1):(gp.city?-4:-1)),5,100);checkOver();save();render();
  if(quiet&&!S.over){toast(r.L[0]);return next();}
  modal(`<div class="alert ${win?'g':'r'}">${win?'防衛成功':gp.city?'陥落':'後退'}</div><h2>${gp.name}</h2>${r.L.map(l=>`<p>${l}。</p>`).join('')}${o.dead.length?`<p class="sm r">潰走：${o.dead.map(g=>g.name).join('、')}</p>`:''}<div class="pol">支持率 ${sg(r.dS)}${r.dT?`　緊張度 ${sg(r.dT)}`:''}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();next();}});}
// こちらから攻める：隣のプロヴィンスにいる部隊から、投入する部隊を決める
function lwAtkModal(){const a=ui.lwa,L=S.lw;if(!a||!L)return;const q=a.q,pool=lwAtkPool(q),un=pool.filter(g=>a.ids.includes(g.id)),d=lwMkAtk(q,un.map(g=>g.id)),od=un.length?lwAtkOdds(d,un):0,cbs={x:()=>{closeModal();ui.lwa=null;}};
  for(const g of pool)cbs['u'+g.id]=()=>{const i=a.ids.indexOf(g.id);if(i>=0)a.ids.splice(i,1);else if(a.ids.length<5)a.ids.push(g.id);closeModal();lwAtkModal();};
  const go=f=>()=>{closeModal();ui.lwa=null;const us=lwAtkPool(q).filter(g=>a.ids.includes(g.id));if(!us.length||lwAtkWhy(q)||!lwCanAtk(q))return;const d2=lwMkAtk(q,us.map(g=>g.id));for(const g of us){g.am=S.month;g.pin=1;}
    if(f&&!d2.empty)return startGround('assault',0,d2);
    const o=lwResolveAtk(d2,us),r=o.r,cap=lwCapEnd();polApply(r.dS,r.dT);if(!d2.empty)S.pers.morale=clamp(S.pers.morale+(o.win?1:-1),5,100);checkOver();save();render();
    modal(`<div class="alert ${o.win?'g':'r'}">${o.win?(d2.own?'奪還':'占領'):'進攻失敗'}</div><h2>${d2.name}</h2>${r.L.map(l=>`<p>${l}。</p>`).join('')}${o.win?'<p class="sm mut">攻めた部隊は、このプロヴィンスへ進んだ。</p>':''}${cap?`<p><b class="g">${cap}。</b></p>`:''}${o.dead.length?`<p class="sm r">潰走：${o.dead.map(g=>g.name).join('、')}</p>`:''}<div class="pol">支持率 ${sg(r.dS)}</div><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});};
  cbs.f=go(1);cbs.a=go(0);
  modal(`<div class="alert">進攻</div><h2>${d.name}</h2><p class="sm">${d.own?'占領されている自国の土地':`${natN(L.e)}の領土`}・${TERN[d.ter]||'平地'}${d.city?'・州の中心都市':''}${d.cap?'・<b class="am">相手の首都。落とせば降伏させられる</b>':''}</p>
  <dl class="kv2"><dt>守る敵</dt><dd>${d.empty?'<b class="g">いない。戦わずに占領できる</b>':lwEList(d.egar)+(d.fort?`<br><span class="sm mut">陣地${d.fort>1?'は堅い':'あり'}</span>`:'')}</dd>${d.empty?'':`<dt>見込み</dt><dd>${!un.length?'部隊を選ぶ':`<b class="${od>=1.3?'g':od>=.95?'':od>=.7?'am':'r'}">${od>=1.3?'優勢':od>=.95?'互角':od>=.7?'やや劣勢':'劣勢'}</b>`}</dd><dt>支援</dt><dd>砲兵の射撃 ${lwArtSup(q,a.ids)}回　爆撃 ${Math.min(3,airStrikers(0).length)}回<br><span class="sm mut">隣にいて投入しない特科・ロケットの部隊が、後方から撃つ</span></dd>`}</dl>
  <h3 class="sub">隣のプロヴィンスから投入する部隊 ${un.length}／5</h3><div class="chips">${pool.map(g=>`<button class="${a.ids.includes(g.id)?'on':''}" data-m="u${g.id}">${g.name}<small>戦力${g.hp}・${lwPName(g.pv)}</small></button>`).join('')}</div><p class="sm mut">勝てば、攻めた部隊がこのプロヴィンスへ進む。攻めた部隊は、今月はもう動けない。</p>
  <div class="mbtn col">${d.empty?`<button class="btn pri" data-m="a" ${un.length?'':'disabled'}>前進して占領する</button>`:`<button class="btn pri" data-m="f" ${un.length?'':'disabled'}>自ら指揮する</button><button class="btn" data-m="a" ${un.length?'':'disabled'}>参謀に任せる<small>自動で決着をつける</small></button>`}<button class="btn" data-m="x">やめる</button></div>`,cbs);}
// 部隊を動かす：選んだプロヴィンスへ、届く部隊を呼ぶ
function lwCallModal(){const c=ui.lwc;if(!c)return;lwPos();const p=c.p,war=!!S.lw,pool=S.gnd.filter(g=>g.loc==='home'&&g.pv!==p&&(!war||(g.am!==S.month&&lwReach(g.pv,lwMvR(g))[p]!=null))).sort(lwByStr),cbs={x:()=>{closeModal();ui.lwc=null;}};
  for(const g of pool)cbs['u'+g.id]=()=>{const i=c.ids.indexOf(g.id);if(i>=0)c.ids.splice(i,1);else c.ids.push(g.id);closeModal();lwCallModal();};
  cbs.go=()=>{closeModal();ui.lwc=null;const us=pool.filter(g=>c.ids.includes(g.id));if(!us.length||WORLD.pown[p]!==ME())return;for(const g of us){g.pv=p;g.pin=1;if(S.lw)g.am=S.month;}hlog(`${us.length}個部隊を${lwPName(p)}へ動かした`,'');save();render();toast(`${us.length}個部隊を動かした`);};
  modal(`<div class="alert">移動</div><h2>${lwPName(p)}へ</h2><p class="sm mut">${war?'交戦中は、部隊は月に1度だけ動ける。徒歩の部隊は2つ先、機械化は3つ先、戦車は4つ先のプロヴィンスまで届く。':'平時は、本土のどこへでも動かせる。'}手で動かした部隊は、参謀の配置から外れてその場にとどまる。</p>
  ${pool.length?`<div class="chips">${pool.map(g=>`<button class="${c.ids.includes(g.id)?'on':''}" data-m="u${g.id}">${g.name}<small>戦力${g.hp}・${lwPName(g.pv)}</small></button>`).join('')}</div>`:'<p class="al am">ここへ届く、今月まだ動いていない部隊がいない</p>'}
  <div class="mbtn"><button class="btn pri" data-m="go" ${c.ids.length?'':'disabled'}>${c.ids.length}個部隊を動かす</button><button class="btn" data-m="x">やめる</button></div>`,cbs);}
/* ---------- 地図と配置の画面 ---------- */
// 選んだプロヴィンスにいる部隊と、そこでできること
function lwProvPanel(p){lwPos();const L=S.lw,me=ME(),ow=WORLD.pown[p],un=lwAt(p);let h='';
  if(ow===me){h+=un.length?`<p class="sm"><b>ここにいる部隊 ${un.length}</b><br>${un.map(g=>`${g.name}<span class="mut">(戦力${g.hp}${lwActed(g)?'・行動済み':''}${g.pin?'・固定':''})</span>`).join('、')}</p>`:'<p class="sm mut">ここに部隊はいない。攻められたら、郷土防衛隊だけで守る。</p>';
    if(L){const th=WORLD.P[p].adj.filter(q=>WORLD.pown[q]===L.e).reduce((a,q)=>a.concat(lwEAt(q)),[]);if(th.length)h+=`<p class="sm"><b class="r">隣にいる敵 ${th.length}</b><br>${lwEList(th)}</p>`;}
    h+=`<div class="brow"><button class="btn sm pri" onclick="A.lwcall(${p})">ここへ部隊を動かす</button>${un.some(g=>g.pin)?`<button class="btn sm" onclick="A.lwunpin(${p})">固定を解く</button>`:''}</div>`;}
  else if(L&&ow===L.e){const adj=WORLD.P[p].adj.some(q=>WORLD.pown[q]===me),eu=lwEAt(p);
    h+=adj?`<p class="sm"><b>敵の部隊 ${eu.length}</b>${eu.length?'<br>'+lwEList(eu):'<span class="mut">　いない</span>'}</p><div class="brow"><button class="btn sm pri" onclick="A.lwatk(${p})">ここへ進攻する</button></div>`:'<p class="sm mut">前線から離れていて、敵の配置はわからない。</p>';}
  return h;}
function lwMapSec(){lwPos();const me=ME(),L=S.lw,p=ui.wsel,P=WORLD.P,dep=S.dep||{auto:1};
  let h=`<section class="sec"><h2>部隊の配置</h2><p class="mut sm">本土の陸上部隊は、プロヴィンスごとに置く。地図の青い札が味方、赤い札が前線の敵で、数字は部隊の数。敵は隣のプロヴィンスへ攻めてくるので、そこにいる部隊が戦う。地図をタップして、部隊を動かす先や攻める先を選ぶ。</p>${mapBox('view',`data-hi="${me}" data-ri="${L?L.e:RVN()}"`)}
  <div class="brow"><button class="btn sm" onclick="A.lwzoom()">自国を大きく映す</button></div>`;
  h+=p!=null&&P[p]?`<div class="item"><div class="uh"><b>${lwPName(p)}</b><span class="loc">${natN(WORLD.pown[p])}・${TERN[P[p].ter]||'平地'}${WORLD.ST[P[p].st].city===p?(P[p].cap?'・首都':'・都市'):''}</span></div>${lwProvPanel(p)||'<p class="sm mut">他国の土地。</p>'}</div>`:'<p class="sm mut">プロヴィンスをタップすると、そこの部隊が見える。</p>';
  h+=`<h3 class="sub">配置のしかた</h3><div class="chips"><button class="${dep.auto?'on':''}" onclick="A.lwdep(1)">参謀が配置する</button><button class="${dep.auto?'':'on'}" onclick="A.lwdep(0)">自分で配置する</button></div><p class="sm mut">${dep.auto?'参謀は毎月、脅威の大きい国境に部隊を寄せ、首都に1個残す。手で動かした部隊は、固定を解くまで動かさない。':'部隊は、動かさないかぎりその場にとどまる。本土に着いた部隊は首都に入る。'}</p><div class="brow"><button class="btn sm" onclick="A.lwredep()">いま参謀に配置させる</button></div>`;
  if(L){const e=L.e,fr=lwCand(me,e,false,false).map(q=>({q,un:lwAt(q),th:P[q].adj.filter(x=>WORLD.pown[x]===e).reduce((a,x)=>a+gstr(lwEAt(x)),0)})).sort((a,b)=>b.th-a.th).slice(0,6),tg=lwCand(e,me,false,false).slice(0,8),why=lwAtkWhy();
    h+=`<h3 class="sub">前線　脅威の大きい順</h3>${fr.length?fr.map(f=>`<div class="urow"><div class="grow"><b>${lwPName(f.q)}</b>${P[f.q].cap?' <span class="tag">首都</span>':''}<br><span class="sm ${f.un.length?'mut':'am'}">味方 ${f.un.length}個(戦力 ${f.un.reduce((a,g)=>a+g.hp,0)})　隣の敵の戦力 ${Math.round(f.th/5.5)}</span></div><button class="btn sm" onclick="A.wsel(${f.q})">選ぶ</button></div>`).join(''):'<p class="sm mut">敵と接するプロヴィンスはない。</p>'}
    <h3 class="sub">攻め込める先</h3>${why?`<p class="sm mut">${why}</p>`:''}${tg.length?tg.map(q=>{const pr=P[q],own=pr.nat===me,city=WORLD.ST[pr.st].city===q,eu=lwEAt(q),pool=lwAtkPool(q);return `<div class="urow"><div class="grow"><b>${lwPName(q)}</b> <span class="tag">${own?'奪還':'敵地'}</span>${city?` <span class="tag">${pr.cap&&!own?'首都':'都市'}</span>`:''}<br><span class="sm mut">敵 ${eu.length}個${eu.length?`(戦力 ${eu.reduce((a,u)=>a+u.hp,0)})`:''}${city?'＋守備隊':''}　隣の味方 ${pool.length}個</span></div><button class="btn sm" ${why||!pool.length?'disabled':''} onclick="A.lwatk(${q})">進攻</button></div>`;}).join(''):'<p class="sm mut">攻め込めるプロヴィンスがない。</p>'}`;}
  return h+'</section>';}
// 地図に重ねる札：味方は青、前線の敵は赤。数字は部隊の数
function lwCounters(g,v){if(!S||!S.w||!S.gnd||!WORLD.pown)return;const P=WORLD.P,me=ME(),L=S.lw,s=v.s,mine={},foe={};
  for(const u of S.gnd)if(u.loc==='home'&&u.pv!=null&&P[u.pv])mine[u.pv]=(mine[u.pv]||0)+1;
  if(L&&L.eu)for(const u of L.eu)if(P[u.pv]&&P[u.pv].adj.some(q=>WORLD.pown[q]===me))foe[u.pv]=(foe[u.pv]||0)+1;
  const box=(p,n,c)=>{const x=(P[p].x+.5-v.x0)*s,y=(P[p].y+.5-v.y0)*s;if(x<-12||y<-12||x>v.cw+12||y>v.ch+12)return;
    if(s<2.2){g.fillStyle=c;g.fillRect(x-2.5,y-2.5,5,5);g.strokeStyle='#fff';g.lineWidth=.8;g.strokeRect(x-2.5,y-2.5,5,5);return;}
    const w=s<4?14:18,h=s<4?10:13;g.fillStyle=c;g.strokeStyle='#fff';g.lineWidth=1.2;g.fillRect(x-w/2,y-h/2,w,h);g.strokeRect(x-w/2,y-h/2,w,h);g.fillStyle='#fff';g.font=`bold ${s<4?9:11}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(String(n),x,y+.5);};
  for(const p in mine)box(+p,mine[p],'#1f6fd0');for(const p in foe)box(+p,foe[p],'#c23028');}
{const ov0=wOverlay;wOverlay=function(g,v){ov0(g,v);lwCounters(g,v);};}
// 保存の前に、本土を離れた部隊の居場所を消し、本土に着いた部隊に居場所を与える
{const sv0=save;save=function(){if(S&&S.w&&WORLD&&WORLD.pl===(S.cfg.planet||0))lwPos();sv0();};}
/* ---------- 知らせ ---------- */
function lwOffer(asked){const L=S.lw;if(!L)return;const e=L.e,T=lwTerms(),bad=T.k==='cede';
  modal(`<div class="alert ${bad?'r':'g'}">講和</div><h2>${asked?`${natN(e)}が交渉に応じた`:`${natN(e)}が講和を打診してきた`}</h2><p>条件：<b>${T.t}</b>。</p><p class="sm mut">${bad?'受け入れれば戦いは終わるが、中心都市を失った州は経済から外れたままになる。あとから奪還の戦いを起こすこともできる。':'受け入れれば、2年のあいだ国境は静かになる。'}</p><div class="mbtn"><button class="btn ${bad?'':'pri'}" data-m="y">受け入れる</button><button class="btn ${bad?'pri':''}" data-m="n">戦いを続ける</button></div>`,
  {y:()=>{closeModal();if(!S.lw)return;const rep=[];lwEnd('peace',rep);for(const r of rep)hlog(r[0],r[1]);checkOver();save();render();toast(rep[0][0]);if(S.over)showOver();},n:()=>{closeModal();hlog('講和の条件を退けた','');save();render();}});}
function lwShow(){const L=S.lw;if(!L||S.over||!L.q||!L.q.length)return;const q=L.q.shift(),e=L.e;
  if(q.k==='offer')return lwOffer(false);
  const pw=lwPow(),E=lwE(),cbs={hd:()=>{closeModal();ui.tab='gov';ui.sub.gov='hd';render();window.scrollTo(0,0);}};for(const s of LWST.slice(0,2))cbs['s_'+s[0]]=()=>{closeModal();L.st=s[0];save();render();};
  modal(`<div class="alert r">侵攻</div><h2>${NATS[e].f}軍が国境を越えた</h2><p>宣戦の通告はなかった。${natN(e)}軍は首都${NAT.cap}を目指して進んでくる。<b>首都が落ちれば、政府は降伏し、任期はそこで終わる。</b></p>
  <dl class="kv2"><dt>敵の兵力(見積り)</dt><dd>${Math.round(E)}</dd><dt>我が防衛力</dt><dd>${Math.round(pw.def)}(本土の陸上部隊 ${pw.n}個)</dd></dl><p class="sm mut">敵の部隊は、隣のプロヴィンスへ攻めかかってくる。守るのは、そこにいる部隊と郷土防衛隊。「国政 → 国防」の地図で部隊を動かし、隣の敵地へ進攻する。配置は参謀に任せることもできる。島の部隊を戻す、緊急動員、停戦といった手も国防にまとめてある。まず構えを決める。</p>
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
    <dl class="kv2"><dt>占領された土地</dt><dd class="${occ?'r':''}">${occ}／${G.orig}プロヴィンス${gone.length?`(${gone.map(stName).join('、')}を失った)`:''}</dd><dt>こちらが占領</dt><dd>${G.got}プロヴィンス</dd><dt>今月の前線</dt><dd>${L.mLost?`<span class="r">失った ${L.mLost}</span>`:''}${L.mLost&&L.mGain?'　':''}${L.mGain?`<span class="g">取った ${L.mGain}</span>`:''}${L.mLost||L.mGain?'':'動かず'}</dd><dt>敵の部隊</dt><dd>${L.eu?L.eu.length:0}個<span class="mut">(開戦時 ${L.en0||0}個。戦力は当初の${Math.round(L.es*100)}%)</span></dd><dt>首都</dt><dd>${NAT.cap}<span class="mut">(落ちれば任期は終わる)</span></dd></dl>
    <div class="st3"><div><label>我が防衛力 ${Math.round(eff)}</label>${bar(eff/mx*100,'b')}</div><div><label>敵の兵力 ${Math.round(E)}</label>${bar(E/mx*100,'r')}</div></div>
    <h3 class="sub">構え</h3>${LWST.map(s=>`<div class="lopt ${L.st===s[0]?'on':''}"><div class="uh"><b>${L.st===s[0]?'● ':''}${s[1]}</b><span class="loc">防衛力 ${sg(Math.round((s[3]-1)*100))}%・損害 ${sg(Math.round((s[4]-1)*100))}%</span></div><p class="sm mut">${s[2]}</p>${L.st===s[0]?'':`<button class="btn sm" onclick="A.lwst('${s[0]}')">この構えに改める</button>`}</div>`).join('')}
    <h3 class="sub">前線の戦い</h3><div class="chips"><button class="${L.auto?'':'on'}" onclick="A.lwauto(0)">そのつど自分で決める</button><button class="${L.auto?'on':''}" onclick="A.lwauto(1)">現地の指揮官に任せる</button></div><p class="sm mut">任せても、州の中心都市と首都の戦いは判断を求められる。</p>
    ${L.res&&L.res.length?`<h3 class="sub">最近の戦い</h3><p class="sm">${L.res.slice(0,6).map(r=>`<span class="${r.win?'g':'r'}">${r.t==='atk'?'攻':'守'}　${r.name}　${r.win?(r.t==='atk'?'奪取':'保持'):(r.t==='atk'?'失敗':'喪失')}</span>`).join('<br>')}</p>`:''}
    <h3 class="sub">講和</h3><p class="sm">いま講和すれば：${lwTerms().t}。</p><div class="brow"><button class="btn sm" ${P.pp>=30&&!ask?'':'disabled'} onclick="A.lwask()">${ask?'申し入れたばかり':P.pp<30?'政治力が足りない':'停戦を申し入れる(政治力 30)'}</button><button class="btn sm" onclick="A.nat(${e})">${natN(e)}を見る</button></div></section>`;}
  h+=lwMapSec()+`<section class="sec"><h2>本土の防衛力</h2>${polBar()}<dl class="kv2"><dt>本土の陸上部隊</dt><dd>${Math.round(pw.field)}<span class="mut">(${pw.n}個)</span></dd><dt>郷土防衛隊</dt><dd>${Math.round(pw.guard)}<span class="mut">(兵役：${LAW.find(l=>l[0]==='con')[2][con][0]})</span></dd><dt>本土の飛行隊</dt><dd>${Math.round(pw.air)}</dd><dt>同盟と防衛協力</dt><dd>+${Math.round(pw.ally*100)}%</dd><dt>地形と陣地</dt><dd>+${Math.round((pw.ter-1)*100)}%</dd><dt>合計</dt><dd><b>${Math.round(pw.def)}</b></dd></dl>
  <p class="mut sm">相手が攻め込むかどうかを決める、本土全体の守りの厚さ。本土にいる陸上部隊、兵役の政策、基地と駐屯地、本土の飛行隊、同じ陣営の国と防衛協力が効く。島や艦にいる部隊は数に入らない。</p>
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
  lwatk(p){const L=S.lw;if(!L)return;if(!lwCanAtk(p))return toast('ここへは攻め込めない。自国の土地に接する、相手の持つプロヴィンスを選ぶ');const why=lwAtkWhy(p);if(why)return toast(why);
    ui.lwa={q:p,ids:lwAtkPool(p).slice(0,5).map(g=>g.id)};lwAtkModal();},
  lwcall(p){if(WORLD.pown[p]!==ME()||S.gpend||(S.lw&&S.lw.bq&&S.lw.bq.length))return;ui.lwc={p,ids:[]};lwCallModal();},
  lwunpin(p){for(const g of lwAt(p))delete g.pin;save();render();},
  lwdep(v){if(!S.dep)S.dep={auto:1};S.dep.auto=v?1:0;save();render();},
  lwredep(){if(S.gpend||(S.lw&&S.lw.bq&&S.lw.bq.length))return toast('先に、決着を待っている戦いを片づける');const n=lwDeploy();save();render();toast(n?`${n}個部隊を配置し直した`:'動かす部隊はなかった');},
  lwzoom(){const c=WORLD.P[lwCapP()],m=mvGet('view');m.z=5;m.cx=c.x;m.cy=c.y;render();},
  lwst(k){const L=S.lw;if(!L||!LWST.some(s=>s[0]===k)||L.st===k)return;L.st=k;hlog(`本土の構えを「${LWST.find(s=>s[0]===k)[1]}」に改めた`,'');save();render();},
  lwask(){const L=S.lw,P=S.pol;if(!L||(L.bq&&L.bq.length)||S.gpend||mq.length||P.pp<30||(L.askM!=null&&S.month-L.askM<3))return;P.pp-=30;L.askM=S.month;const mo=S.month-L.m0,T=lwTerms(),p=clamp(.12+L.ex*.02+mo*.012+(L.es<.75?.2:0)+(T.k==='cede'?.3:0)+(T.k==='rep'?.15:0),.05,.92);
    if(Math.random()<p){save();render();lwOffer(true);}else{hlog(`${natN(L.e)}に停戦を申し入れたが、応じなかった`,'');save();render();toast('相手は交渉に応じなかった');}},
  lwmob(){const P=S.pol,why=lwMobWhy();if(why)return toast(why);const n=2+P.law.con;
    confirmM(`予備役を招集し、普通科連隊を<b>${n}個</b>ただちに編成する。練度と戦力は低い。資金150億円と政治力20を使い、安定度が4下がる。次に使えるのは2年後。`,()=>{if(lwMobWhy())return;spend(150);P.pp-=20;P.stab=clamp(P.stab-4,0,100);grpAdd({reg:-5,lab:-3,mil:3});
      for(let i=0;i<n;i++){const g=addGnd('inf','home',{tr:RI(30,40)});g.hp=7;}S.enl.gnd.n+=n*90;S.w.mobM=S.month;hlog(`緊急動員：普通科連隊 ${n}個を編成`,'am');wNews(`${NAT.n}が予備役の招集を発表`,'am');_M=null;save();render();toast(`${n}個連隊を編成した`);},'動員する');},
  lwret(e){const P=S.pol,n=lwGeo().lost[e]||0;if(S.lw||!n||P.pp<40||S.gpend||S.pending||S.over||inWar(e))return;
    confirmM(`${natN(e)}が占領している${n}プロヴィンスを取り戻すため、こちらから戦いを起こす。政治力40を使う。攻め込む側になるので、周辺国の目は厳しくなる。`,()=>{if(S.lw||inWar(e))return;P.pp-=40;const rep=[],W=S.w;W.n.forEach((x,i)=>{if(i!==ME()&&i!==e)relAdd(i,x.bloc&&x.bloc===W.n[e].bloc?-8:-2);});lwStart(e,rep,true);for(const r of rep)hlog(r[0],r[1]);save();render();},'開戦する');}
});
