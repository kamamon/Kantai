/* ================= 世界情勢・外交・国政・経済 ================= */
/* ---------- 州と都市の名前 ---------- */
const MZ_ST=WL('北嶺 東雲 常磐 若狭野 八雲 高千穂 浪速 筑波嶺 伊吹野 瀬戸内 南海 朝霧'),MZ_CT=WL('白鷺 松風 鶴見 霧島 青柳 桜川 潮見 月岡 藤枝 若宮 鷹取 浦賀野');
function natPlace(i){const N=NATS[i];if(N._pl!==undefined)return N._pl;if(!N.ship)return N._pl=null;const r=rng32(104729*(i+1)),all=[];for(const a of N.ship.S)for(const b of N.ship.E)if(a!==b)all.push(a+b);
  for(let k=all.length-1;k>0;k--){const j=Math.floor(r()*(k+1)),t=all[k];all[k]=all[j];all[j]=t;}return N._pl=all;}
const stName=st=>{const a=natPlace(st.nat);return(a?a[st.k%a.length]:MZ_ST[st.k%MZ_ST.length])+'州';};
const stCity=st=>{if(st.cap)return NATS[st.nat].cap;const a=natPlace(st.nat);return a?a[a.length-1-st.k%a.length]:MZ_CT[st.k%MZ_CT.length];};
/* ---------- 世界 ---------- */
const BLOC=[{n:'非同盟',s:'非同盟'},{n:'環洋条約機構',s:'環洋機構'},{n:'大陸協商',s:'協商'},{n:'協約',s:'協約'}],BLOCC=[[120,124,128],[70,130,205],[200,84,70],[90,185,125]];
const GOV=['議会制共和国','立憲君主国','連邦共和国','一党制国家','軍事政権','首長制国家'],GOVL=['首相','首相','大統領','国家主席','議長','首長'];
const ME=()=>S.cfg.nat||0,RVN=()=>NATS.indexOf(RIV),natN=i=>NATS[i].n,blocN=b=>b===3?(S.w.bn||'協約'):BLOC[b].n;
let _alive=null,_aliveV=-1;
function natAlive(){const Wd=WORLD;if(_alive&&_aliveV===(Wd.ver||0))return _alive;_aliveV=Wd.ver||0;_alive=NATS.map(()=>false);for(let p=0;p<Wd.pown.length;p++)_alive[Wd.pown[p]]=true;return _alive;}
const stOwner=st=>WORLD.pown[st.city];
function natEco(){const e=NATS.map(()=>0);for(const st of WORLD.ST)e[stOwner(st)]+=st.pop*(.5+.1*stDev(st));return e;}
function natPw(){const e=natEco();return e.map((v,i)=>{const n=S.w.n[i];return v*n.mil*(n.gov===4?1.15:1)*(n.aid>S.month?1.25:1)*(n.sanc?.88:1)*(.6+n.stab/250);});}
const natCnt=i=>{let c=0;const ow=WORLD.pown;for(let p=0;p<ow.length;p++)if(ow[p]===i)c++;return c;};
const wNews=(t,c)=>{S.w.news.unshift({m:S.month,t,c:c||''});if(S.w.news.length>60)S.w.news.pop();};
const inWar=i=>S.w.wars.find(w=>w.a===i||w.d===i)||null;
const relAdd=(i,v)=>{const n=S.w.n[i];if(i===ME())return;n.rel=clamp(n.rel+v,-100,100);n.rb=clamp((n.rb||0)+v*.8,-60,60);};
function worldApply(){const Wd=WORLD||genWorld();for(let p=0;p<Wd.P.length;p++)Wd.pown[p]=Wd.P[p].nat;if(S&&S.w)for(const p in S.w.own)Wd.pown[p]=S.w.own[p];Wd.ver=(Wd.ver||0)+1;NMASK.length=0;}
const provTake=(p,o)=>{provSet(p,o);if(WORLD.P[p].nat===o)delete S.w.own[p];else S.w.own[p]=o;};
function worldInit(){const Wd=WORLD||genWorld(),me=ME(),rv=RVN(),r=rng32(7001+me*131+rv*17),d=(a,b)=>Math.hypot(Wd.nat[a].x-Wd.nat[b].x,Wd.nat[a].y-Wd.nat[b].y);
  const ord=NATS.map((N,i)=>i).filter(i=>i!==me&&i!==rv).map(i=>[d(i,me)/(d(i,me)+d(i,rv)+1e-6)+(r()-.5)*.36,i]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]),bl={};ord.forEach((i,k)=>{bl[i]=k<12?1:k>=ord.length-12?2:0;});
  const n=NATS.map((N,i)=>{const g=Math.floor(r()*6),bloc=i===me?0:i===rv?2:bl[i];
    const rel=i===me?100:i===rv?-60:Math.round((bloc===1?20:bloc===2?-22:0)+(r()-.5)*36);
    return{rel,rb:0,bloc,gov:bloc===2&&r()<.6?3+Math.floor(r()*2):g,ldr:mkName(N),stab:Math.round(45+r()*40),mil:+(.8+r()*.5).toFixed(2),imp:0,trd:0,def:0,sanc:0,aid:0};});
  S.w={n,own:{},wars:[],news:[],hot:[],ver:1,seq:0,rivK:1,bn:''};
  const seen={};for(const p of Wd.P)for(const a of p.adj){const q=Wd.P[a];if(q.nat<=p.nat||p.nat===me||q.nat===me)continue;const k=p.nat+'_'+q.nat;if(seen[k])continue;seen[k]=1;const A=n[p.nat],B=n[q.nat],opp=A.bloc&&B.bloc&&A.bloc!==B.bloc;
    if(opp||r()<.22)S.w.hot.push({a:p.nat,b:q.nat,t:Math.round((opp?35:18)+r()*25)});}
  // はじめから、関係のよい国のいくつかとは通商がある
  {const mine={};for(const st of Wd.nat[me].st)if(Wd.ST[st].res)mine[Wd.ST[st].res]=1;const sc=i=>n[i].rel+Object.keys(natRes0(i)).filter(k=>!mine[k]).length*25;
    n.map((x,i)=>i).filter(i=>i!==me&&i!==rv&&n[i].rel>=0).sort((a,b)=>sc(b)-sc(a)).slice(0,4).forEach(i=>{n[i].trd=1;});}
  wNews(`${NAT.f}と${RIV.f}の対立が深まる。${BLOC[1].n}と${BLOC[2].n}は互いに相手の出方をうかがっている`,'am');}
function warStart(a,d,rep){const W=S.w,me=ME(),rv=RVN();W.wars.push({id:++W.seq,a,d,m0:S.month,ex:0});W.n[a].stab=clamp(W.n[a].stab+4,5,95);
  const t=`${NATS[a].f}が${NATS[d].f}に侵攻した`;wNews(t,'r');rep.push(['世界：'+t,'r']);
  if(a===rv||d===rv)rep.push([`${RIV.n}は戦争に兵力を割いている。こちらへの圧力は弱まる見込み`,'g']);
  const D=W.n[d],pb=W.n[me].bloc;if(d!==rv&&a!==rv&&((pb&&D.bloc===pb)||D.def||D.rel>=45)&&!S.pol.evq)S.pol.evq={k:'aidreq',x:d,y:a};}
function warEnd(w,win,lose,how,rep){const W=S.w,Wd=WORLD,P=Wd.P,ow=Wd.pown,rv=RVN(),a=w.a,d=w.d;W.wars=W.wars.filter(x=>x!==w);const h=W.hot.find(x=>(x.a===a&&x.b===d)||(x.a===d&&x.b===a));if(h){h.t=18;h.n1=0;}
  const occ=(by,of)=>{const o=[];for(let p=0;p<P.length;p++)if(P[p].nat===of&&ow[p]===by)o.push(p);return o;},give=ps=>{for(const p of ps)provTake(p,P[p].nat);};let t;
  if(how==='cap'){const left=natCnt(lose),orig=P.filter(p=>p.nat===lose).length;
    if(lose!==rv&&(left<=3||left<orig*.35)){for(let p=0;p<P.length;p++)if(ow[p]===lose)provTake(p,win);t=`${NATS[lose].f}は降伏し、${natN(win)}に併合された`;W.n[lose].bloc=0;}
    else{give(occ(lose,win));t=`${NATS[lose].f}が降伏。${natN(win)}は占領地を自国領とした`;const L=W.n[lose];L.stab=30;L.ldr=mkName(NATS[lose]);L.gov=L.gov>=3?0:L.gov;if(lose!==rv)L.bloc=0;}
    W.n[win].stab=clamp(W.n[win].stab+10,5,95);W.n[win].mil=Math.min(1.6,W.n[win].mil+.08);}
  else{const oa=occ(a,d),od=occ(d,a);
    if(Math.max(oa.length,od.length)<=3){give(oa);give(od);t=`${natN(a)}と${natN(d)}が停戦。国境は戦前の線に戻る`;}
    else if(oa.length>=od.length){give(od);t=`${natN(a)}と${natN(d)}が講和。${natN(a)}は占領地の一部を得た`;win=a;lose=d;}
    else{give(oa);t=`${natN(a)}と${natN(d)}が講和。攻め込んだ${natN(a)}が逆に領土を失った`;win=d;lose=a;}}
  W.ver++;wNews(t,how==='cap'?'r':'g');rep.push(['世界：'+t,how==='cap'?'r':'']);
  if(win===rv){W.rivK=Math.min(1.35,W.rivK+.06);rep.push([`${RIV.n}は戦勝で国力を増した`,'r']);}else if(lose===rv){W.rivK=Math.max(.75,W.rivK-.08);rep.push([`${RIV.n}は敗戦で国力を落とした`,'g']);}}
function warStep(w,rep,pw){const Wd=WORLD,P=Wd.P,ow=Wd.pown,W=S.w,a=w.a,d=w.d,mo=S.month-w.m0,al=natAlive(),rv=RVN();
  const sup=i=>pw[i]*(1+.05*W.n.filter((n,k)=>k!==i&&al[k]&&n.bloc&&n.bloc===W.n[i].bloc).length),ratio=sup(a)/Math.max(1,sup(d))*R(.72,1.32)*(mo<3?1.15:1);
  const k=clamp(Math.round((ratio>=1?(ratio-1)*5:-(1/ratio-1)*5)+R(-.8,1.2)),-4,5);
  const push=(from,to,n)=>{const tc=Wd.nat[from],cand=[],sc=p=>(P[p].nat===to?-1e6:0)+(P[p].x-tc.x)*(P[p].x-tc.x)+(P[p].y-tc.y)*(P[p].y-tc.y);for(let p=0;p<P.length;p++)if(ow[p]===from&&P[p].adj.some(q=>ow[q]===to))cand.push(p);cand.sort((x,y)=>sc(x)-sc(y));
    for(const p of cand.slice(0,n)){provTake(p,to);const st=Wd.ST[P[p].st];if(P[p].cap&&P[p].nat===from)w.cap=to;else if(st.city===p&&P[p].nat===from)wNews(`${natN(to)}軍が${natN(from)}の${stCity(st)}を占領`,'');}};
  if(k>0)push(d,a,k);else if(k<0)push(a,d,-k);W.ver++;w.ex+=1+Math.abs(k)*.3;W.n[d].stab=clamp(W.n[d].stab-1,5,95);W.n[a].stab=clamp(W.n[a].stab-.6,5,95);
  if(w.cap!=null)return warEnd(w,w.cap,w.cap===a?d:a,'cap',rep);
  if(natCnt(d)<=2&&d!==rv)return warEnd(w,a,d,'cap',rep);if(natCnt(a)<=2&&a!==rv)return warEnd(w,d,a,'cap',rep);
  if(mo>=9&&Math.random()<(mo-8)*.05+w.ex*.004)warEnd(w,null,null,'peace',rep);}
function coup(i,rep){const W=S.w,n=W.n[i],rv=RVN(),old=n.gov;n.gov=old>=3?pick([0,2]):pick([3,4]);n.ldr=mkName(NATS[i]);n.stab=55;
  const t=n.gov===4?`${NATS[i].f}で軍が政権を掌握。${n.ldr}${GOVL[4]}が全権を握った`:n.gov===3?`${NATS[i].f}で政変。一党支配の体制に移った`:`${NATS[i].f}で政権が倒れ、選挙による政府が生まれた`;wNews(t,i===rv?'r':'am');
  if(i===rv){const dT=n.gov>=3?8:-10;S.tension=clamp(S.tension+dT,0,100);rep.push([`${RIV.n}で政変。${dT>0?'強硬派が実権を握り、緊張が高まった':'新政府は対話を口にしている'}`,dT>0?'r':'g']);relAdd(i,dT>0?-8:12);}
  else{if(Math.random()<.4)n.bloc=n.gov>=3?(Math.random()<.6?2:0):(Math.random()<.6?1:0);if(Math.random()<.5&&!S.pol.evq&&Math.abs(n.rel)<60)S.pol.evq={k:'coup',x:i};}}
function worldMonth(rep){const W=S.w,me=ME(),rv=RVN(),al=natAlive(),pw=natPw(),pb=W.n[me].bloc,X=polSum();
  W.n.forEach((n,i)=>{if(i===me||!al[i])return;const base=(i===rv?-60:0)+(pb&&n.bloc===pb?38:pb===1&&n.bloc===2?-28:pb===3&&n.bloc===2?-14:pb===0&&n.bloc===1?10:pb===0&&n.bloc===2?-12:0)+(n.trd?12:0)+(n.def?18:0)-(n.sanc?45:0);
    n.rel=clamp(n.rel+(base+(n.rb||0)-n.rel)*.04+(n.imp>0?2.5*(1+(X.relG||0)):0),-100,100);if(n.imp>0)n.imp--;n.rb=(n.rb||0)*.97;
    n.stab=clamp(n.stab+R(-2.5,2.5)+(50-n.stab)*.03-(n.sanc?.8:0),5,95);});
  if(W.n[rv].sanc)W.rivK=Math.max(.85,W.rivK-.004);
  for(const w of W.wars.slice())warStep(w,rep,pw);
  for(const h of W.hot){const A=W.n[h.a],B=W.n[h.b];if(!al[h.a]||!al[h.b]||inWar(h.a)||inWar(h.b))continue;
    h.t=clamp(h.t+R(-3,3.6)+(A.bloc&&B.bloc&&A.bloc!==B.bloc?.5:0)+(A.gov===4||B.gov===4?.4:0)-(h.calm>S.month?3:0),0,100);
    if(h.t>70&&!h.n1&&Math.random()<.5){h.n1=1;wNews(`${natN(h.a)}と${natN(h.b)}の国境で衝突。双方が相手を非難している`,'am');}
    if(h.t>=85&&W.wars.length<3&&S.month>=6&&Math.random()<.25){const att=pw[h.a]*R(.8,1.25)>=pw[h.b]?h.a:h.b;warStart(att,att===h.a?h.b:h.a,rep);}}
  W.n.forEach((n,i)=>{if(i!==me&&al[i]&&!inWar(i)&&n.stab<42&&Math.random()<(45-n.stab)/700)coup(i,rep);});
  if(Math.random()<.6){const ids=W.n.map((n,i)=>i).filter(i=>al[i]&&i!==me),a=pick(ids),b=pick(ids.filter(i=>i!==a)),A=natN(a),Bn=natN(b),bl=W.n[a].bloc;
    wNews(pick([`${A}と${Bn}が海上で合同演習を実施`,`${A}が新型艦の進水を発表`,`${A}の${W.n[a].ldr}${GOVL[W.n[a].gov]}が${Bn}を訪問`,`${A}で反政府デモ。数万人が首都に集まった`,`${A}が国防費の増額を決定`,`${A}と${Bn}が通商協定に署名`,
      bl?`${blocN(bl)}の首脳会議が閉幕。結束を確認`:`${A}は非同盟の立場を改めて表明`,`${A}の沖で不審船。${Bn}の関与が疑われている`,`${A}が長射程ミサイルの発射試験に成功と発表`,`${A}で大規模な停電。サイバー攻撃との見方も`]),'');}
  if(S.month%12===9){const c=W.n.map((n,i)=>i).filter(i=>al[i]&&i!==me&&i!==rv&&!inWar(i)&&Math.random()<.06);for(const i of c){const n=W.n[i],o=n.bloc;n.bloc=o?0:(n.gov>=3?2:1);wNews(o?`${natN(i)}が${blocN(o)}からの離脱を表明`:`${natN(i)}が${blocN(n.bloc)}に加盟`,'am');}}}
/* ---------- 国政のデータ ---------- */
const FOCB=[['mil','軍事'],['dip','外交'],['ind','産業'],['pol','政治'],['sci','科学']];
// [キー, 系統, 名称, 月数, 政治力, 前提(どれかひとつ), 同時に選べないもの, 能力への効果, 説明]
const FOC=[
  ['m1','mil','国防大綱の改定',3,15,[],[],{q:.005},'10年先を見据えて、何を守り、何を備えるかを定め直す'],
  ['m2a','mil','艦隊決戦の重視',5,25,['m1'],['m2b'],{asmDmg:.05,samPk:.015},'大型艦と長射程ミサイルに資源を集める'],
  ['m2b','mil','分散型の海上作戦',5,25,['m1'],['m2a'],{usv:.15,stealth:.03,upk:.03},'小型艦と無人艦を広く散らし、狙いを絞らせない'],
  ['m3','mil','統合運用体制',5,30,['m2a','m2b'],[],{cec:.15,reinT:6},'陸海空をひとつの司令部で動かす'],
  ['m4','mil','航空優勢の確立',5,30,['m1'],[],{scr:.05,ftrAam:.02,airRdy:.1},'警戒管制網と要撃態勢を厚くする'],
  ['m5','mil','島嶼防衛の要塞化',5,30,['m1'],[],{garr:4,gndPow:.06,gndAA:.1},'島に地下指揮所と掩体を造る'],
  ['m6','mil','予備戦力の充実',4,25,['m3'],[],{recruit:.12,reserve:.3,attr:.05},'いざという時に倍の人員を動かせるようにする'],
  ['m7','mil','反撃能力の保有',6,45,['m3','m4'],[],{strk:.2,prePen:.1},'相手の泊地を叩ける力を持ち、手を出させない'],
  ['d1','dip','外交方針の見直し',3,15,[],[],{warn:.01},'誰と組み、誰と距離を置くかを定める'],
  ['d2a','dip','環洋条約機構への加盟',6,40,['d1'],['d2b','d2c'],{reinT:6,intel:.1},'海洋国の同盟に加わる。協商の国々との関係は冷える'],
  ['d2b','dip','中立の宣言',5,30,['d1'],['d2a','d2c'],{tension:.25,support:.15},'どの陣営にも属さないと内外に示す'],
  ['d2c','dip','独自の協約を主導',7,50,['d1'],['d2a','d2b'],{},'近しい非同盟国を束ね、第三の陣営を築く'],
  ['d3','dip','通商網の拡大',4,25,['d1'],[],{},'通商協定からの収入が増える'],
  ['d4','dip','対話の窓口',4,25,['d2a','d2b','d2c'],[],{warn:.03,tension:.15},'相手国との連絡線を常設する'],
  ['d5','dip','情報の同盟',5,30,['d2a','d2c'],[],{intel:.15,foresee:.06,eIntel:.2},'友好国と情報を持ち寄る'],
  ['d6','dip','国際世論を味方に',5,30,['d4'],[],{prePen:.2,support:.1},'平素から立場を説明し、いざという時の理解を得る'],
  ['i1','ind','産業基盤の調査',3,15,[],[],{},'国内の工場・造船所・資源を洗い出す。開発と建設が1割安くなる'],
  ['i2','ind','造船業の再編',5,30,['i1'],[],{buildT:.08,buildC:.04},'造船所を束ね、同型艦を流れ作業で造る'],
  ['i3','ind','交通網の整備',5,30,['i1'],[],{},'州の開発と建設がさらに2割安くなる'],
  ['i4','ind','資源の自立',6,35,['i1'],[],{},'備蓄と代替で、資源不足の影響を半分にする'],
  ['i5','ind','防衛装備の輸出',5,30,['i2'],[],{},'毎月の国庫収入が増え、財界が喜ぶ'],
  ['i6','ind','経済特区',6,35,['i3'],[],{},'経済成長が年1%高まる'],
  ['i7','ind','国家総力の動員計画',6,45,['i2','i4'],[],{buildT:.07,dockSpd:.15},'有事に民間の力を借りる段取りを決めておく'],
  ['p1','pol','政治基盤の強化',3,15,[],[],{},'政治力の伸びが増える'],
  ['p2a','pol','文民統制の徹底',5,25,['p1'],['p2b'],{support:.15},'軍の動きを議会と国民に見えるようにする。安定度が上がる'],
  ['p2b','pol','安全保障体制の集権',5,25,['p1'],['p2a'],{},'決定を少人数に集め、速く動く。政治力が伸び、政策の変更が安くなるが、安定度は下がる'],
  ['p3','pol','国民との対話',4,25,['p2a','p2b'],[],{support:.15,recruit:.06},'基地の公開と説明会を重ねる'],
  ['p4','pol','防衛費の恒久財源',5,35,['p1'],[],{budg:.08},'年度ごとの予算が5%増える'],
  ['p5','pol','危機管理法制',5,35,['p2a','p2b'],[],{reinT:5,warn:.02},'有事の権限と手続きを前もって定める。政策を変えやすくなる'],
  ['p6','pol','挙国一致',6,45,['p3','p5'],[],{morale:.1},'与野党が安全保障で手を結ぶ。安定度が大きく上がる'],
  ['s1','sci','研究への投資',3,20,[],[],{rp:.06},'研究所の予算を底上げする'],
  ['s2','sci','宇宙の利用',5,30,['s1'],[],{satT:5,foresee:.04},'偵察・通信・測位の衛星を自前で上げる'],
  ['s3','sci','人工知能の戦略',5,30,['s1'],[],{q:.01,usv:.1},'判断を助ける機械を全軍に配る'],
  ['s4','sci','人材の育成',4,25,['s1'],[],{offGrow:.1,enlTr:.1,trGain:.05},'学校と部隊の教育を作り直す'],
  ['s5','sci','産学官の連携',5,30,['s2','s3'],[],{rp:.08,projRisk:.05},'大学と企業の研究を防衛に生かす'],
  ['s6','sci','次世代防衛構想',7,50,['s5'],[],{rp:.06,antiSS:.03},'構想段階の技術を、ほかより先に形にする']
];
const FOCX={d2b:{stabT:3},d3:{trdK:.15},i1:{devC:.1},i3:{devC:.2},i4:{resH:1},i5:{trdK:.1},i6:{gdpG:1},p1:{ppG:.5},p2a:{stabT:5},p2b:{ppG:.6,lawC:.3,stabT:-4},p4:{budK:.05},p5:{lawC:.2},p6:{stabT:8}},focBy={};for(const f of FOC)focBy[f[0]]=f;
// [キー, 名称, 選択肢[名称, 説明, 能力への効果, 国政への効果]]
const LAW=[
  ['def','防衛方針',[['専守防衛','相手が撃つまで撃たない。国際的な信頼は厚い',{}],['積極防衛','脅威が迫れば先に動ける余地を持つ',{prePen:.3,tension:-.12,warn:.02},{stabT:-2}],['先制行動の容認','必要なら先に叩く。周辺国は警戒する',{prePen:.6,tension:-.35,support:-.1},{stabT:-5,relG:-.3}]]],
  ['con','兵役',[['志願制','集まる人数は限られるが、士気は高い',{}],['選抜徴兵','必要な人数を確保する',{recruit:.3,morale:-.05},{stabT:-3}],['国民皆兵','人は足りるが、経済と世論に重い',{recruit:.7,reserve:.5,morale:-.12},{stabT:-8,gdpG:-.6}]]],
  ['eco','経済体制',[['平時経済','民間の成長を優先する',{},{gdpG:.3}],['防衛産業の優先','造船と兵器の生産に資源を回す',{buildT:.1,buildC:.03},{gdpG:-.2,budK:.06}],['戦時経済','国の生産をすべて防衛に向ける',{buildT:.22,dockSpd:.2},{gdpG:-1.2,budK:.2,stabT:-9}]]],
  ['trd','貿易',[['自由貿易','技術と富が入ってくるが、情報も出ていく',{rp:.04,eIntel:-.1},{trdK:.2}],['輸出管理','重要な技術の流出を防ぐ',{}],['自給優先','輸入に頼らない。成長は鈍る',{rp:-.04},{trdK:-.3,gdpG:-.4,stabT:2,resH:1}]]],
  ['inf','情報と報道',[['全面公開','作戦も予算も明かす。信頼は厚いが、相手にも見える',{eIntel:-.12,support:.1},{stabT:3}],['作戦の秘匿','部隊の動きに関わることは伏せる',{eIntel:.1}],['報道統制','伝える内容を政府が決める',{eIntel:.3,support:.15},{stabT:-6,ppG:-.3}]]],
  ['bud','防衛費の水準',[['GDP比 1%','最小限の備え',{},{budK:-.2,stabT:2,gdpG:.2}],['GDP比 1.5%','これまでの水準',{}],['GDP比 2%','周辺国に見合う水準',{},{budK:.2,stabT:-2}],['GDP比 3%','国力の限りを尽くす',{},{budK:.5,stabT:-7,gdpG:-.5}]]]
];
const LAW0={def:0,con:0,eco:0,trd:1,inf:1,bud:1};
// 政策を変えたときの各勢力の受け止め(選択肢が1段上がるごと)
const LAWG={def:{mil:4,aca:-4},con:{mil:5,reg:-8,lab:-3},eco:{biz:-7,mil:5,lab:-4},trd:{biz:-8,reg:4},inf:{aca:-8,lab:-3},bud:{mil:8,lab:-6,biz:-2}};
// [キー, 肩書, 能力への効果, 国政への効果]
const ADV=[['ind','産業界の重鎮',{buildT:.06,buildC:.03}],['dip','老練な外交官',{warn:.02},{relG:.5}],['thr','海軍理論家',{q:.012}],['air','航空戦の権威',{ftrAam:.02,scr:.04}],['sub','潜水艦隊の父',{quiet:.04,torpPk:.03}],['spy','情報機関の長',{intel:.12,eIntel:.15,foresee:.04}],
  ['fin','財政の魔術師',{budg:.08},{budK:.04}],['pr','広報の達人',{support:.2}],['log','兵站の専門家',{upk:.04,dockSpd:.1}],['tec','技術顧問',{rp:.07}],['hr','人事の達人',{offGrow:.1,morale:.05}],['cri','危機管理官',{warn:.03},{stabT:5}],['eco','経済学者',{},{gdpG:.5}],['org','党の実力者',{},{ppG:.4}]];
const GRP=[['biz','財界','経済成長'],['mil','軍部','士気'],['lab','労働界','建造の速さ'],['reg','地方','入隊者と安定度'],['aca','学術界','研究']];
const PARTY=[['国民協調党','中道。いまの備えを保つ',{}],['国防同志会','防衛力の増強を掲げる',{prePen:.1,tension:-.1},{budK:.06}],['市民連合','軍縮と暮らしを掲げる',{support:.1,tension:.12},{budK:-.07,stabT:2}]];
const POLXN={ppG:['政治力の伸び(毎月)',1],stabT:['安定度',1],gdpG:['経済成長(年)',1,'%'],budK:['防衛予算',100,'%'],trdK:['交易の収入',100,'%'],devC:['開発と建設の費用',-100,'%'],relG:['関係改善の速さ',100,'%'],lawC:['政策変更の費用',-100,'%'],resH:['資源不足の影響を半減',0]};
const polFxText=(fx0,x0)=>{const fx={},x={};for(const o of[fx0,x0])if(o)for(const k in o)(STAT[k]?fx:x)[k]=o[k];const a=fxText(fx),b=Object.keys(x).filter(k=>POLXN[k]&&x[k]).map(k=>{const d=POLXN[k],v=x[k]*(d[1]||1);return d[1]?`<span class="${x[k]>0?'g':'r'}">${d[0]} ${v>0?'+':'−'}${Math.abs(+v.toFixed(1))}${d[2]||''}</span>`:`<span class="g">${d[0]}</span>`;}).join('、');return [a==='基準どおり'?'':a,b].filter(Boolean).join('、')||'数値の変化はない';};
/* ---------- 経済 ---------- */
// [キー, 名称, 説明, 条件(1=海沿いのみ, 2=資源のある州のみ)]
const BLD=[['ind','工業地帯','州のGDPが8%伸びる',0],['port','港湾','州のGDPが4%伸び、国庫の交易収入が増える',1],['infra','交通網','この州の開発と建設が4%安くなり、人口が伸びる',0],['yard','造船所','全国の建造期間が2%縮む',1],['uni','研究拠点','研究点が2%増える',0],['mine','資源開発','産出が1増える',2],['base','基地と駐屯地','入隊者が3%増え、安定度が上がる',0]];
const RES=[['oil','石油','部隊の維持費と航空部隊の稼働'],['steel','鋼材','艦の建造期間'],['rare','希少金属','研究'],['food','食料','安定度']];
const myStates=()=>WORLD.nat[ME()].st.map(i=>WORLD.ST[i]);
const stGDP=st=>{const e=S.eco.st[st.id],b=e.b;return st.pop*e.pg*(.7+.06*e.dev)*(1+.05*(b.ind||0)+.03*(b.port||0)+.015*(b.infra||0))/100;};
const gdp=()=>myStates().reduce((a,st)=>a+stGDP(st),0)*S.eco.g;
const bldSum=k=>myStates().reduce((a,st)=>a+(S.eco.st[st.id].b[k]||0),0);
const stSlots=e=>e.dev*2+2,stUsed=e=>Object.values(e.b).reduce((a,v)=>a+v,0);
const bldCost=(st,k)=>{const e=S.eco.st[st.id],X=polSum();return Math.round((100+70*(e.b[k]||0))*(1-clamp(X.devC||0,0,.5))*(1-.04*(e.b.infra||0))/10)*10;};
const devCost=st=>{const e=S.eco.st[st.id],X=polSum();return Math.round((150+70*e.dev)*(1-clamp(X.devC||0,0,.5))*(1-.04*(e.b.infra||0))/10)*10;};
const natRes0=i=>{const o={};for(const s of WORLD.nat[i].st){const k=WORLD.ST[s].res;if(k)o[k]=(o[k]||0)+1;}return o;};
function natRes(i){const o={};for(const st of WORLD.ST)if(st.res&&stOwner(st)===i)o[st.res]=(o[st.res]||0)+1;return o;}
// 資源の収支：産出と輸入が必要量に足りないと、それぞれの分野に響く
function resBal(){const me=ME(),E=S.eco,X=polSum(1),W=S.w,al=natAlive(),lanes=ZONES.map((Z,i)=>i).filter(i=>ZONES[i].lane),open=lanes.length?1-lanes.filter(i=>S.sectors[i].threat>=60).length/lanes.length:1,tk=[1.2,1,.5][S.pol.law.trd];
  const need={oil:.5+S.units.length/14+(S.air||[]).length/8,steel:1+S.orders.filter(o=>o.kind==='unit').length*.7,rare:S.labs.length/4,food:1+myStates().reduce((a,s)=>a+s.pop*S.eco.st[s.id].pg,0)/3000},o={};
  for(const r of RES){const k=r[0];let prod=0,imp=0;for(const st of myStates())if(st.res===k)prod+=1+(E.st[st.id].b.mine||0);
    W.n.forEach((n,i)=>{const c=i!==me&&al[i]&&n.trd&&!n.sanc?natRes(i)[k]||0:0;if(c)imp+=c>=2?1.5:1;});imp*=open*tk;
    const nd=+need[k].toFixed(1),d=clamp(nd-prod-imp,0,4);o[k]={need:nd,prod,imp:+imp.toFixed(1),def:+d.toFixed(1),sur:Math.max(0,prod-nd)};}
  o.open=open;return o;}
/* ---------- 効果の合計 ---------- */
// 国家方針・政策・顧問・勢力・与党・建物・資源・同盟・一時的な出来事を合わせる。能力値(STAT)と国政の値が混ざって返る
let _PX=null,_PXm=-1;
function polSum(noRes){if(!S||!S.pol)return{};const P=S.pol,o={},add=(fx,k2)=>{if(fx)for(const k in fx)o[k]=(o[k]||0)+fx[k]*(k2||1);};
  for(const k in P.foc.done){add(focBy[k][7]);add(FOCX[k]);}
  for(const L of LAW){const c=L[2][P.law[L[0]]];add(c[2]);add(c[3]);}
  for(const id of P.adv){const a=P.pool.find(x=>x.id===id);if(a){const d=ADV.find(x=>x[0]===a.t);add(d[2]);add(d[3]);}}
  const g=k=>(P.grp[k]-50)/50;add({gdpG:g('biz')*.5,morale:g('mil')*.08,buildT:g('lab')*.05,recruit:g('reg')*.1,stabT:g('reg')*4,rp:g('aca')*.05});
  add(PARTY[P.gov.p][2]);add(PARTY[P.gov.p][3]);
  for(const m of P.mods)if(m.until>S.month)add(m.fx);
  if(S.eco){add({buildT:Math.min(.2,.02*bldSum('yard')),rp:Math.min(.2,.02*bldSum('uni')),recruit:Math.min(.3,.03*bldSum('base')),stabT:Math.min(6,.6*bldSum('base')),trdK:Math.min(.4,.03*bldSum('port'))});
    if(!noRes){const rb=resBal(),h=o.resH?.5:1;add({upk:-.02*rb.oil.def*h,airRdy:-.04*rb.oil.def*h,buildT:-.03*rb.steel.def*h,rp:-.03*rb.rare.def*h,stabT:-1.5*rb.food.def*h});}}
  const W=S.w,me=ME(),rv=RVN();if(W){const al=natAlive();add({tension:(W.n[rv].rel+60)/100*.5+(inWar(rv)?.5:0)-(W.n[me].bloc===1?.1:0),intel:Math.min(.12,.04*W.n.filter((n,i)=>n.def&&al[i]).length),trdK:Math.min(.5,.05*W.n.filter((n,i)=>n.trd&&al[i]).length)});}
  if(P.stab<35)add({ppG:-.5,morale:-.05,gdpG:-.5});else if(P.stab>70)add({ppG:.3,support:.1});
  return o;}
const polBudK=()=>{if(!S.pol||!S.eco)return 1;const X=polSum(1);return Math.pow(gdp()/S.eco.gdp0,.7)*(1+(X.budK||0));};
const ppGain=()=>{const X=polSum(1);return Math.max(.5,2+(X.ppG||0)+S.pol.stab/100);};
const stabTarget=()=>{const X=polSum();return clamp(48+(S.support-50)*.35+(X.stabT||0)-(S.tension>70?(S.tension-70)*.3:0)-ISLZ.filter(z=>!S.sectors[z].held).length*6,5,95);};
const polMod=(n,fx,mo)=>{S.pol.mods.push({n,fx,until:S.month+mo});_M=null;};
const grpAdd=o=>{for(const k in o)S.pol.grp[k]=clamp(S.pol.grp[k]+o[k],0,100);};
function polInit(){const C=S.cfg,r=rng32(331+ME()*7);worldInit();worldApply();
  S.pol={pp:30,stab:55,foc:{done:{},cur:null},law:Object.assign({},LAW0),lawM:{},adv:[],pool:[],aid:0,grp:{biz:55,mil:55,lab:55,reg:55,aca:55},gov:{p:0,next:30},mods:[],evM:0,evq:null,sumM:null};
  const ts=ADV.map(a=>a[0]);for(let k=ts.length-1;k>0;k--){const j=Math.floor(r()*(k+1)),t=ts[k];ts[k]=ts[j];ts[j]=t;}for(const t of ts.slice(0,6))S.pol.pool.push({id:++S.pol.aid,t,n:mkName()});
  S.eco={st:{},g:1,gdp0:1,tre:200,ver:1};
  for(const st of myStates()){const b={ind:Math.floor(st.dev/2),infra:1};if(st.coast)b.port=1;if(st.cap){b.uni=1;if(st.coast)b.yard=1;b.base=1;}if(st.res)b.mine=1;S.eco.st[st.id]={dev:st.dev,b,q:null,pg:1};}
  S.eco.gdp0=gdp();_M=null;}
// 以前の記録や、国を選び直したあとの読み込みで呼ぶ
function polLoad(){if(!S)return;if(!S.w||!S.pol||!S.eco||!myStates().every(st=>S.eco.st[st.id]))polInit();else worldApply();}
function focusOK(f){const D=S.pol.foc.done;return !D[f[0]]&&(!f[5].length||f[5].some(k=>D[k]))&&!f[6].some(k=>D[k]);}
function focusDone(k,rep){const W=S.w,me=ME(),rv=RVN(),al=natAlive(),f=focBy[k];S.pol.foc.done[k]=1;S.pol.foc.cur=null;_M=null;rep.push([`国家方針「${f[2]}」が完了した`,'g']);
  if(k==='d2a'){W.n[me].bloc=1;W.n.forEach((n,i)=>{if(i===me)return;if(n.bloc===1)relAdd(i,15);else if(n.bloc===2)relAdd(i,-10);});S.tension=clamp(S.tension+3,0,100);wNews(`${NAT.f}が${BLOC[1].n}に加盟`,'am');}
  if(k==='d2b'){W.n.forEach((n,i)=>{if(i!==me)relAdd(i,i===rv?6:4);});wNews(`${NAT.f}が中立を宣言`,'');}
  if(k==='d2c'){W.bn=NAT.n+'協約';W.n[me].bloc=3;const c=W.n.map((n,i)=>i).filter(i=>i!==me&&al[i]&&W.n[i].bloc===0&&W.n[i].rel>=20).sort((a,b)=>W.n[b].rel-W.n[a].rel).slice(0,6);for(const i of c){W.n[i].bloc=3;relAdd(i,12);}
    wNews(`${NAT.f}の呼びかけで「${W.bn}」が発足。${c.length?c.map(natN).join('、')+'が加わった':'いまのところ加盟国はない'}`,'am');W.ver++;}
  if(k==='i5')grpAdd({biz:10});if(k==='i2')grpAdd({biz:5,lab:5});if(k==='p3')grpAdd({reg:8});if(k==='s5')grpAdd({aca:10});if(k==='m6')grpAdd({mil:6});if(k==='p6')S.pol.stab=clamp(S.pol.stab+8,0,100);}
function election(rep){const P=S.pol,g=P.grp,inc=P.gov.p,sc=[34+(S.support-50)*.1,30+(S.tension-40)*.35+(g.mil-50)*.1,30+(50-S.tension)*.25+(g.lab-50)*.12+(50-S.support)*.08];
  sc[inc]+=(P.stab-50)*.3+(S.support-50)*.25;for(let i=0;i<3;i++)sc[i]+=R(-6,6);const w=sc.indexOf(Math.max(...sc)),chg=w!==inc;P.gov={p:w,next:S.month+48};_M=null;
  const t=`総選挙：${PARTY[w][0]}が第一党${chg?'となり、政権が交代した':'を保った'}`;wNews(t,chg?'am':'');rep.push([t,chg?'am':'']);
  if(chg){P.stab=clamp(P.stab-4,0,100);grpAdd(w===1?{mil:8,lab:-5}:w===2?{mil:-8,lab:8,reg:4}:{biz:4});}
  modal(`<div class="alert ${chg?'':'g'}">総選挙</div><h2>${PARTY[w][0]}が第一党に</h2><p>${chg?'政権が交代した。':'与党が議席を守った。'}${PARTY[w][1]}。</p><p class="sm">${polFxText(PARTY[w][2],PARTY[w][3])}</p><p class="sm mut">次の総選挙は4年後。支持率と安定度が高いほど、与党は議席を守りやすい。</p><div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:closeModal});}
// 年に一度の情勢報告：陣営の力、この1年の戦争、相手国の様子
function polYear(){const W=S.w,me=ME(),rv=RVN(),al=natAlive(),pw=natPw(),bp=b=>W.n.reduce((a,n,i)=>a+(al[i]&&n.bloc===b?pw[i]:0),0),b1=bp(1),b2=bp(2),yr=W.news.filter(n=>S.month-n.m<=12&&(n.c==='r'||n.c==='g')).slice(0,5),R=W.n[rv];
  const lean=b1>b2*1.15?`${BLOC[1].n}が優位に立っている`:b2>b1*1.15?`${BLOC[2].n}が勢いを増している`:'ふたつの陣営の力は拮抗している';
  modal(`<div class="alert">年次情勢報告</div><h2>${dateStr(S.month)}の世界</h2><p>${lean}。${W.wars.length?`いまも${W.wars.map(w=>natN(w.a)+'と'+natN(w.d)).join('、')}が戦っている。`:'大きな戦争は起きていない。'}</p>
  <dl class="kv2"><dt>${BLOC[1].s}</dt><dd>${W.n.filter((n,i)=>al[i]&&n.bloc===1).length}か国</dd><dt>${BLOC[2].s}</dt><dd>${W.n.filter((n,i)=>al[i]&&n.bloc===2).length}か国</dd><dt>${RIV.n}</dt><dd>${GOV[R.gov]}・${R.ldr}${GOVL[R.gov]}。国力は${W.rivK>1.04?'<span class="r">増している</span>':W.rivK<.96?'<span class="g">落ちている</span>':'変わらない'}。我が国との関係 ${Math.round(R.rel)}(${relWord(R.rel)})</dd><dt>自国</dt><dd>${blocN(W.n[me].bloc)}・安定度 ${Math.round(S.pol.stab)}・GDPは着任時の${Math.round(gdp()/S.eco.gdp0*100)}%</dd></dl>
  ${yr.length?`<h3 class="sub">この1年の主な出来事</h3>${yr.map(n=>`<div class="logl ${n.c}"><span>${dateStr(n.m).replace(/^海暦/,'')}</span>${n.t}</div>`).join('')}`:''}<div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:closeModal});}
/* ---------- 月ごとの処理 ---------- */
function polMonth(rep){if(!S.pol)return;const P=S.pol,E=S.eco,X=polSum();
  P.pp=Math.min(400,P.pp+ppGain());P.stab=clamp(P.stab+(stabTarget()-P.stab)*.12,0,100);P.mods=P.mods.filter(m=>m.until>S.month);
  for(const k in P.grp)P.grp[k]=clamp(P.grp[k]+(50-P.grp[k])*.02,0,100);
  if(P.foc.cur&&--P.foc.cur.left<=0)focusDone(P.foc.cur.k,rep);
  // 経済：成長、国庫、建設
  E.g*=1+(.8+(X.gdpG||0)+(P.stab-50)*.02)/1200;const rb=resBal(),G=gdp(),sur=RES.reduce((a,r)=>a+rb[r[0]].sur,0);
  E.inc=Math.round((30+G)*(1+(X.trdK||0))+sur*6*rb.open);E.tre+=E.inc;
  for(const st of myStates()){const e=E.st[st.id];e.pg*=1+(.0008+.0003*(e.b.infra||0));if(e.q&&--e.q.left<=0){if(e.q.k==='dev')e.dev++;else e.b[e.q.k]=(e.b[e.q.k]||0)+1;rep.push([`${stName(st)}：${e.q.k==='dev'?'開発が進んだ(開発度 '+e.dev+')':BLD.find(b=>b[0]===e.q.k)[1]+'が完成'}`,'g']);e.q=null;E.ver++;}}
  for(const r of RES)if(rb[r[0]].def>=1.5&&S.month%3===0)rep.push([`${r[1]}が足りない(不足 ${rb[r[0]].def})。${r[2]}に響いている`,'am']);
  if(S.month%12===6){const have=P.pool.map(a=>a.t),c=ADV.map(a=>a[0]).filter(t=>!have.includes(t));P.pool=P.pool.filter(a=>P.adv.includes(a.id)||Math.random()<.6);for(let i=0;i<2&&c.length&&P.pool.length<8;i++){const t=c.splice(Math.floor(Math.random()*c.length),1)[0];P.pool.push({id:++P.aid,t,n:mkName()});}}
  worldMonth(rep);
  if(S.month%12===0&&S.month>0)polYear();
  if(S.month>=P.gov.next)election(rep);
  if(!P.evq&&S.month-P.evM>=3&&Math.random()<.3)P.evq=polEvPick();
  _M=null;}
function polShow(){const P=S.pol;if(!P||!P.evq||S.over)return;const q=P.evq;P.evq=null;P.evM=S.month;const ev=PEV[q.k];if(!ev)return;const cbs={};
  ev.o.forEach((o,i)=>{cbs['e'+i]=()=>{closeModal();const res=polEvApply(o[1],q);hlog(`${ev.t}：${o[0]}`,'');save();render();
    modal(`<div class="alert">${ev.t}</div><p>${typeof o[2]==='function'?o[2](q,res):o[2]}</p>${res.txt?`<div class="pol">${res.txt}</div>`:''}<div class="mbtn"><button class="btn pri" data-m="ok">確認</button></div>`,{ok:()=>{closeModal();if(S.over)showOver();}});};});
  modal(`<div class="alert am">情勢</div><h2>${ev.t}</h2><p>${ev.d(q)}</p><div class="mbtn col">${ev.o.map((o,i)=>`<button class="btn ${i?'':'pri'}" data-m="e${i}">${typeof o[0]==='function'?o[0](q):o[0]}<small>${o[3]||''}</small></button>`).join('')}</div>`,cbs);}
// 出来事の結果を当てはめる。{sup,ten,stab,pp,funds,tre,rel:[[国,値]],grp,mod:[名,効果,月],rd,rp,risk:[確率,結果]}
function polEvApply(e,q){const out=[],me=ME(),rv=RVN(),who=x=>x==='x'?q.x:x==='y'?q.y:x==='rv'?rv:x;if(e.risk&&Math.random()<e.risk[0])e=Object.assign({},e,e.risk[1],{bad:1});
  if(e.sup){S.support=clamp(S.support+e.sup,0,100);out.push(`支持率 ${sg(e.sup)}`);}if(e.ten){S.tension=clamp(S.tension+e.ten,0,100);out.push(`緊張度 ${sg(e.ten)}`);}
  if(e.stab){S.pol.stab=clamp(S.pol.stab+e.stab,0,100);out.push(`安定度 ${sg(e.stab)}`);}if(e.pp){S.pol.pp=Math.max(0,S.pol.pp+e.pp);out.push(`政治力 ${sg(e.pp)}`);}
  if(e.funds){S.funds+=e.funds;out.push(`資金 ${sg(e.funds)}億円`);}if(e.tre){S.eco.tre+=e.tre;out.push(`国庫 ${sg(e.tre)}億円`);}
  if(e.rel)for(const r of e.rel){if(r[0]==='b1'||r[0]==='b2'){S.w.n.forEach((n,i)=>{if(i!==me&&n.bloc===(r[0]==='b1'?1:2))relAdd(i,r[1]);});out.push(`${BLOC[r[0]==='b1'?1:2].s}の国々との関係 ${sg(r[1])}`);}else{const i=who(r[0]);if(i!=null&&i!==me){relAdd(i,r[1]);out.push(`${natN(i)}との関係 ${sg(r[1])}`);}}}
  if(e.grp){grpAdd(e.grp);out.push(Object.keys(e.grp).map(k=>`${GRP.find(g=>g[0]===k)[1]} ${sg(e.grp[k])}`).join('、'));}
  if(e.mod){polMod(e.mod[0],e.mod[1],e.mod[2]);out.push(`${e.mod[2]}か月のあいだ ${polFxText(e.mod[1]).replace(/<[^>]+>/g,'')}`);}
  if(e.rd){for(const u of S.units)u.rd=clamp(u.rd+e.rd,5,100);out.push(`全艦の即応 ${sg(e.rd)}`);}
  if(e.rp){const ls=LINE.filter(l=>lvOf(l[0])<10);for(let i=0;i<e.rp&&ls.length;i++){const l=ls.splice(Math.floor(Math.random()*ls.length),1)[0];S.res[l[0]]={lv:lvOf(l[0])+1,prog:0};out.push(`研究「${l[1]}」が1段階進んだ`);}}
  if(e.aid&&q.x!=null)S.w.n[q.x].aid=S.month+12;
  _M=null;checkOver();return{txt:out.join('　'),bad:!!e.bad};}
const anyWar=()=>S.w.wars[0]||null;
const PEV={
  aidreq:{t:'支援の要請',d:q=>`${NATS[q.y].f}に攻め込まれた${NATS[q.x].f}の${S.w.n[q.x].ldr}${GOVL[S.w.n[q.x].gov]}が、我が国に支援を求めてきた。`,o:[
    ['艦隊と部隊を送る',{funds:-150,rd:-12,rel:[['x',22],['y',-18]],ten:3,sup:1,aid:1,grp:{mil:4}},'艦隊の一部を派遣した。相手国は深く感謝している。留守のあいだ、手元の艦の即応は落ちる。','資金 −150、即応 −12'],
    ['装備と資金を送る',{funds:-200,rel:[['x',12],['y',-8]],aid:1},'輸送船が物資を届けた。','資金 −200'],
    ['見送る',{rel:[['x',-15]],sup:-1},'「遺憾である」とだけ伝えた。相手国は失望している。','']]},
  coup:{t:'政変への対応',d:q=>`${NATS[q.x].f}で政権が替わった。新しい指導者は${S.w.n[q.x].ldr}${GOVL[S.w.n[q.x].gov]}。各国が承認するかどうかを見定めている。`,o:[
    ['新政権を承認する',{rel:[['x',16]],sup:-1},'いち早い承認に、新政権は謝意を示した。',''],['非難の声明を出す',{rel:[['x',-20]],sup:1,pp:5},'力による政権の交代は認めないと表明した。',''],['静観する',{},'情勢が落ち着くまで、態度を保留した。','']]},
  refugee:{t:'難民船の到来',cond:()=>!!anyWar(),ctx:()=>({x:anyWar().d}),d:q=>`${natN(q.x)}の戦火を逃れた人々を乗せた船が、領海のすぐ外に集まっている。`,o:[
    ['受け入れる',{stab:-2,sup:2,rel:[['x',10]],grp:{reg:-4},tre:-80},'港を開き、仮の住まいを用意した。国際社会は評価している。','国庫 −80'],['第三国への移送を手配する',{funds:-120,rel:[['x',4]]},'艦艇が護衛し、受け入れを表明した国へ送り届けた。','資金 −120'],['領海の外にとどめる',{sup:-3,rel:[['x',-10]]},'水と食料だけを渡した。報道は厳しい。','']]},
  spy:{t:'諜報員の拘束',d:()=>`基地の周辺で情報を集めていた${RIV.n}の諜報員を拘束した。`,o:[
    ['公表して抗議する',{ten:4,sup:3,rel:[['rv',-8]]},'記者会見で証拠を示した。相手国は「でっち上げ」と反発している。',''],['水面下で身柄を交換する',{rel:[['rv',5]],mod:['身柄交換で得た情報',{intel:.1},12]},'拘束されていた我が国の関係者が戻ってきた。',''],
    ['泳がせて偽の情報を流す',{mod:['偽情報の工作',{eIntel:.3},12],risk:[.3,{sup:-4,ten:3,mod:null}]},(q,r)=>r.bad?'工作は露見し、かえって手の内を知られた。':'相手は偽の配置図を信じ込んでいる。','3割の確率で露見']]},
  arms:{t:'軍縮会議への招待',d:()=>`${BLOC[1].n}と${BLOC[2].n}の双方が参加する軍縮会議に、我が国も招かれた。`,o:[
    ['参加し、譲歩を示す',{ten:-6,grp:{mil:-12},mod:['軍縮の約束',{budK:-.03},12],rel:[['rv',6]]},'艦艇の建造を一部遅らせると約束した。緊張は和らいだが、軍部は不満を隠さない。',''],['参加し、立場を譲らない',{sup:2,ten:2,rel:[['b2',-3]]},'一歩も引かない演説は国内で喝采を浴びた。',''],['欠席する',{rel:[['b1',-2],['b2',-2]]},'代表を送らなかった。','']]},
  oil:{t:'資源価格の高騰',d:()=>'産出国の政情不安で、燃料と原料の値が跳ね上がった。',o:[
    ['備蓄を放出する',{funds:-200},'備蓄で急場をしのいだ。','資金 −200'],['値上がりを受け入れる',{stab:-4,mod:['燃料の高騰',{upk:-.05},6]},'半年のあいだ、部隊の維持費がかさむ。',''],['産出国と直接交渉する',{pp:-20,risk:[.4,{stab:-3}]},(q,r)=>r.bad?'交渉はまとまらなかった。':'長期の供給契約を取りつけた。','政治力 −20、4割で不調']]},
  strike:{t:'造船所のストライキ',cond:()=>S.pol.grp.lab<52,d:()=>'造船所の労働者が、待遇の改善を求めて作業を止めた。',o:[
    ['要求を受け入れる',{funds:-150,grp:{lab:15}},'作業は再開された。','資金 −150'],['応じない',{stab:-3,grp:{lab:-15},mod:['ストライキ',{buildT:-.1},6]},'半年のあいだ、建造が遅れる。',''],['調停にあたる',{pp:-15,grp:{lab:6}},'双方が歩み寄った。','政治力 −15']]},
  export:{t:'装備輸出の打診',ctx:()=>{const c=S.w.n.map((n,i)=>i).filter(i=>i!==ME()&&i!==RVN()&&natAlive()[i]&&S.w.n[i].rel>0);return c.length?{x:pick(c)}:null;},d:q=>`${NATS[q.x].f}が、我が国の艦載ミサイルの購入を打診してきた。財界は乗り気だ。`,o:[
    ['輸出を認める',{funds:350,rel:[['x',10]],grp:{biz:10},ten:1},'契約が結ばれた。','資金 +350'],['認めない',{grp:{biz:-8}},'技術の流出を理由に断った。','']]},
  crash:{t:'墜落機の捜索',d:()=>`${RIV.n}の軍用機が、我が国の島の沖に墜落した。相手国は捜索のための立ち入りを求めている。`,o:[
    ['共同で捜索する',{ten:-4,rel:[['rv',6]]},'両国の艦が並んで海面を探した。異例の光景だった。',''],['こちらで回収して調べる',{ten:3,mod:['回収した機体の解析',{intel:.15},12],rel:[['rv',-6]]},'機体を引き揚げ、電子機器を調べている。',''],['立ち入りを拒み、抗議する',{sup:1,ten:1},'そもそもなぜそこを飛んでいたのか、と問いただした。','']]},
  scoop:{t:'報道された不祥事',d:()=>'ある部隊で訓練中の事故が報告されていなかったと、新聞が伝えた。',o:[
    ['事実を公表し、関係者を処分する',{sup:-2,stab:3},'批判は受けたが、対応は評価された。',''],['事実関係を確認中として伏せる',{risk:[.35,{sup:-7,stab:-2}]},(q,r)=>r.bad?'続報で隠していたことが明るみに出た。':'続報は出ず、話題は移っていった。','35%で露見']]},
  defect:{t:'亡命の申し出',d:()=>`${RIV.n}の兵器開発に携わっていた技術者が、亡命を求めてきた。`,o:[
    ['受け入れる',{rp:2,ten:5,rel:[['rv',-8]]},'技術者は持ち出した資料とともに保護された。',''],['送り返す',{rel:[['rv',8]],sup:-2,ten:-2},'人道にもとる、との批判が国内で上がった。','']]},
  quake:{t:'大規模な災害',d:()=>'国内で大きな地震が起きた。被災地は救援を待っている。',o:[
    ['全力で部隊を出す',{funds:-120,sup:4,stab:2,rd:-6,grp:{reg:8}},'艦は物資を運び、隊員は瓦礫の中を歩いた。','資金 −120、即応 −6'],['警戒を崩さず、最小限にとどめる',{sup:-2,grp:{reg:-6}},'救援の遅れに、被災地から不満の声が上がった。','']]}
};
function polEvPick(){const ks=Object.keys(PEV).filter(k=>k!=='aidreq'&&k!=='coup'&&(!PEV[k].cond||PEV[k].cond())),k=pick(ks),ev=PEV[k],c=ev.ctx?ev.ctx():{};return c?Object.assign({k},c):null;}
