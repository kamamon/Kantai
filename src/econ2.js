/* ================= 産業・貿易・ドクトリン ================= */
// 国内の防衛産業を育て、資源と武器の貿易を細かく決め、陸海空のドクトリンを選ぶ。
// S.corp[k]={lv,xp,inv}  S.cfoc=重点企業  S.doc[b]={k,m}  S.trade={res:{k:{buy,exp,to,stT}},stock:{k},log}  S.arms={pol,cat,list,offers,seq,askM}
/* ---------- 企業 ---------- */
// [キー, 業種, 社名の語尾, 段階ごとの効果, 説明]
const CORP=[
  ['yard','造船','造船',{buildC:.012,buildT:.012},'艦の調達価格と建造期間が下がる'],
  ['aero','航空機','航空機',{airPow:.012,airRdy:.008},'基地航空隊の戦力と稼働が上がる'],
  ['msl','誘導武器','精機',{ammoC:.025,samPk:.003},'弾薬が安くなり、ミサイルの命中が上がる'],
  ['elec','電子・センサー','電機',{radA:.01,rp:.01},'探知距離と研究点が伸びる'],
  ['land','車両・火砲','重工',{gndPow:.012},'陸上部隊の戦闘力が上がる'],
  ['mat','素材・エネルギー','製鋼',{upk:.006,gdpG:.04},'部隊の維持費が下がり、経済が伸びる']];
const CORPK=CORP.map(c=>c[0]),corpD=k=>CORP.find(c=>c[0]===k),corpNeed=lv=>60+40*lv,corpInvC=lv=>120+60*lv;
function corpName(k){const d=corpD(k),cs=myStates().map(stCity),i=CORPK.indexOf(k);return (i%2?NAT.n:cs[(i>>1)%cs.length]||NAT.n)+d[2];}
const corpSlots=lv=>Math.ceil(lv/3);
/* ---------- ドクトリン ---------- */
// 分野ごとに1つ選ぶ。選んだ直後は習熟が低く、効果は4割から始まって毎月伸びる
const DOC={
  sea:['海上',[['strike','艦隊打撃','水上艦の対艦ミサイルで敵艦隊を叩く',{asmDmg:.08,asmR:.06,asmPen:.03}],['deny','海域拒否','潜水艦で近づけさせない',{torpPk:.06,torpDmg:.08,sosus:.08}],['sloc','シーレーン防衛','対潜と護衛で航路を守る',{aswPk:.06,sonar:.08,threatSup:.3}],['cvn','空母機動','艦上機で制空と打撃を担う',{deck:.1,ftrLoad:.1,ftrFuel:.08}]]],
  air:['航空',[['sup','航空優勢','まず空を取る',{ftrAam:.05,ftrSurv:.05,scr:.06}],['mar','対艦航空攻撃','基地の航空機で艦隊と上陸部隊を叩く',{ftrAsmR:.1,strk:.1,airPow:.06}],['iad','統合防空','レーダーとミサイルで空を閉じる',{samPk:.04,radA:.08,gndAA:.15,scr:.04}]]],
  land:['陸上',[['pos','陣地防御','地形と陣地で本土を守り抜く',{hdK:.15,gndPow:.02}],['mob','機動打撃','装甲と火力で押し返し、攻め込む',{ofK:.2,gndPow:.05}],['amph','島嶼機動','水陸両用と空挺で島を守り、取り返す',{strk:.08,gndPow:.05}],['mil','国民皆兵','予備役と郷土防衛隊を厚くする',{grdK:.45,recruit:.1,hdK:.05}]]]};
Object.assign(POLXN,{hdK:['本土の防衛力',100,'%'],ofK:['進攻の戦力',100,'%'],grdK:['郷土防衛隊',100,'%']});
const docK=b=>.4+.6*clamp((S.doc[b].m||0)/100,0,1);
/* ---------- 貿易 ---------- */
const TBUY={oil:11,steel:8,rare:12,food:7},TSELL={oil:9,steel:6,rare:9,food:5},TDEST={any:['誰にでも',1],fr:['友好国だけ',.85],bloc:['自陣営だけ',.75]};
// 資源の値は惑星によって違う
const tBuy=k=>TBUY[k]*PL().sit.price,tSell=k=>TSELL[k]*PL().sit.price;
// 輸出先：その資源を産しない国のうち、方針に合う相手を関係のよい順に3か国まで
function tradeBuyers(k,to){const W=S.w,me=ME(),al=natAlive(),pb=W.n[me].bloc;return W.n.map((n,i)=>i).filter(i=>i!==me&&al[i]&&!W.n[i].sanc&&!(S.lw&&S.lw.e===i)&&!(natRes(i)[k])&&(to==='any'?W.n[i].rel>-60:to==='fr'?W.n[i].rel>=10:pb?W.n[i].bloc===pb:(W.n[i].def||W.n[i].trd))).sort((a,b)=>W.n[b].rel-W.n[a].rel).slice(0,3);}
/* ---------- 武器輸出 ---------- */
// [企業, 品目, 必要な段階]
const ARMS=[['yard','艦艇',4],['aero','航空機',5],['msl','ミサイル',4],['elec','レーダー・電子機器',3],['land','車両・火砲',3]];
const ARMPOL=[['禁輸','武器は輸出しない'],['同盟・友好国のみ','防衛協力か通商協定がある国、同じ陣営の国、関係が+20以上の国に限る'],['紛争当事国を除く','戦争をしている国には売らない'],['制限なし','相手を選ばない。対立陣営にも売れるが、相手を強くする']];
function armsOK(i,pol){const W=S.w,me=ME(),n=W.n[i],pb=W.n[me].bloc,rv=RVN();if(pol==null)pol=S.arms.pol;if(!pol||i===me||!natAlive()[i]||n.sanc||(S.lw&&S.lw.e===i)||n.rel<-55)return false;
  if(pol===1)return !!(n.def||n.trd||(pb&&n.bloc===pb)||n.rel>=20);if(pol===2)return !inWar(i)&&i!==rv;return true;}
function armsVal(k,i){const lv=S.corp[k].lv,eco=natEco()[i];return Math.round((6+lv*2.2)*clamp(eco/3000,.6,1.6)*(inWar(i)?1.5:1));}
function armsOffer(n){const A2=S.arms,al=natAlive(),W=S.w;let made=0;
  const cats=ARMS.filter(a=>A2.cat[a[0]]&&S.corp[a[0]].lv>=a[2]&&A2.list.filter(c=>c.cat===a[0]).length<corpSlots(S.corp[a[0]].lv));if(!cats.length)return 0;
  const ns=W.n.map((x,i)=>i).filter(i=>armsOK(i)&&!A2.list.some(c=>c.to===i)&&!A2.offers.some(o=>o.to===i)).sort((a,b)=>(inWar(b)?1:0)-(inWar(a)?1:0)+Math.random()-.5);
  for(const i of ns.slice(0,n)){if(A2.offers.length>=4)break;const a=pick(cats);A2.offers.push({id:++A2.seq,to:i,cat:a[0],months:RI(12,24),val:armsVal(a[0],i),exp:S.month+4});made++;}return made;}
/* ---------- 初期化 ---------- */
function econInit(){if(!S||!S.w)return;const r=rng32(977+ME()*13);
  if(!S.corp){S.corp={};const sp=CORPK[Math.floor(r()*CORPK.length)];for(const k of CORPK)S.corp[k]={lv:k===sp?4:3,xp:0,inv:null};S.cfoc=null;}
  if(!S.doc)S.doc={sea:{k:null,m:0},air:{k:null,m:0},land:{k:null,m:0}};
  if(!S.trade){S.trade={res:{},stock:{},log:{exp:0,buy:0,arms:0}};for(const x of RES){S.trade.res[x[0]]={buy:0,exp:1,to:'any',stT:0};S.trade.stock[x[0]]=0;}}
  if(!S.arms)S.arms={pol:1,cat:{yard:1,aero:1,msl:1,elec:1,land:1},list:[],offers:[],seq:0,askM:null};}
function extInit(){baseInit();armyInit();econInit();}
// 国政の効果の合計に足す(polSum から呼ばれる)
function econSum(add){if(!S.corp)return;for(const c of CORP)add(c[3],S.corp[c[0]].lv-1);
  for(const b in DOC){const d=S.doc[b];if(d&&d.k){const x=DOC[b][1].find(y=>y[0]===d.k);if(x)add(x[3],docK(b));}}}
/* ---------- 月の処理 ---------- */
// 資源の売り買い、備蓄、武器輸出、企業の成長。国庫に入る正味の額を返す
function econMonth(rep,rb){econInit();const T=S.trade,W=S.w,A2=S.arms;let inc=0;T.log={exp:0,buy:0,arms:0};
  for(const x of RES){const k=x[0],c=T.res[k],b=rb[k];T.stock[k]=Math.max(0,T.stock[k]-(b.cov||0));
    const cost=(c.buy||0)*rb.open*tBuy(k)*(rb.open<.99?1.3:1);if(cost>0&&S.eco.tre+inc<cost){c.buy=0;rep.push([`国庫が足りず、${x[1]}の買い付けを止めた`,'am']);}else{inc-=cost;T.log.buy+=cost;}
    const bs=tradeBuyers(k,c.to),sold=Math.min(b.sur*c.exp,bs.length);T.stock[k]=clamp(T.stock[k]+b.sur-sold+(b.ext||0),0,Math.max(c.stT,T.stock[k]));
    if(sold>0){const v=sold*tSell(k)*TDEST[c.to][1]*rb.open;inc+=v;T.log.exp+=v;bs.slice(0,Math.ceil(sold)).forEach(i=>relAdd(i,c.to==='any'?.25:.5));}}
  // 武器輸出
  A2.offers=A2.offers.filter(o=>o.exp>S.month&&armsOK(o.to));
  for(const c of A2.list.slice()){const n=W.n[c.to],ok=natAlive()[c.to]&&!n.sanc&&!(S.lw&&S.lw.e===c.to);
    if(!ok){A2.list=A2.list.filter(y=>y!==c);rep.push([`${natN(c.to)}への${ARMS.find(a=>a[0]===c.cat)[1]}の輸出は打ち切られた`,'am']);continue;}
    inc+=c.val;T.log.arms+=c.val;S.corp[c.cat].xp+=2;relAdd(c.to,.4);if(n.bloc===2&&W.n[ME()].bloc!==2)W.rivK=Math.min(1.6,W.rivK+.002);
    if(--c.left<=0){A2.list=A2.list.filter(y=>y!==c);rep.push([`${natN(c.to)}への${ARMS.find(a=>a[0]===c.cat)[1]}の輸出が完了した`,'g']);}}
  if(S.month%3===0&&A2.pol){const m=armsOffer(RI(1,2));if(m)rep.push([`武器輸出の引き合いが${m}件届いた(国政 → 貿易)`,'']);}
  // 企業：受注と輸出で経験を積み、段階が上がる
  const ord=k=>S.orders.filter(o=>k==='yard'?o.kind==='unit':k==='aero'?o.kind==='airu'||o.k==='ftr'||o.k==='aew':k==='msl'?o.kind==='ammo':k==='land'?o.kind==='gnd':false).length;
  for(const k of CORPK){const c=S.corp[k];if(c.lv>=10)continue;c.xp+=(2+Math.min(3,ord(k))+(k==='elec'?Math.min(2,S.labs.length/3):0)+(k==='mat'?Math.min(2,bldSum('ind')/3):0))*(S.cfoc===k?1.5:1);
    if(c.xp>=corpNeed(c.lv)){c.xp-=corpNeed(c.lv);c.lv++;_M=null;grpAdd({biz:2});rep.push([`${corpName(k)}が力をつけた(${corpD(k)[1]}　段階 ${c.lv})`,'g']);wNews(`${NAT.n}の${corpName(k)}が新工場を稼働`,'');}}
  for(const b in DOC){const d=S.doc[b];if(d.k&&d.m<100)d.m=Math.min(100,d.m+5);}
  return inc;}
/* ---------- 画面 ---------- */
GV.ind=()=>{econInit();const E=S.eco;let h=`<section class="sec"><h2>防衛産業</h2>${polBar()}<p class="mut sm">国内の企業は、発注と輸出で経験を積み、段階が上がる。国庫から投資して早めることもできる。段階が高いほど効果が大きく、武器輸出で同時に抱えられる契約も増える。</p>`;
  for(const d of CORP){const k=d[0],c=S.corp[k],need=corpNeed(c.lv),ic=corpInvC(c.lv),wait=c.inv!=null&&S.month-c.inv<3,foc=S.cfoc===k,fx={};for(const f in d[3])fx[f]=d[3][f]*(c.lv-1);const arm=ARMS.find(a=>a[0]===k),n=S.arms.list.filter(x=>x.cat===k).length;
    h+=`<div class="unit"><div class="uh"><b>${corpName(k)}</b><span class="loc">${d[1]}${foc?'　<b class="g">重点</b>':''}</span></div>
    <div class="st3 one"><div><label>段階 ${c.lv}／10${c.lv<10?`　次まで ${Math.round(c.xp)}／${need}`:''}</label>${bar(c.lv>=10?100:c.xp/need*100,'b')}</div></div>
    <p class="sm">${c.lv>1?polFxText(fx):'まだ効果はない'}<br><span class="mut">${d[4]}${arm?`。${arm[1]}の輸出は段階${arm[2]}から(契約 ${n}／${c.lv>=arm[2]?corpSlots(c.lv):0})`:''}</span></p>
    <div class="brow"><button class="btn sm" ${c.lv>=10||wait||E.tre<ic?'disabled':''} onclick="A.cinv('${k}')">${c.lv>=10?'上限':wait?'投資したばかり':`投資する(国庫 ${ic}億)`}</button><button class="btn sm ${foc?'pri':''}" onclick="A.cfoc('${k}')">${foc?'重点企業':'重点にする'}</button></div></div>`;}
  return h+'<p class="sm mut">重点企業は1社だけ選べ、経験の伸びが1.5倍になる。</p></section>';};
GV.trade=()=>{econInit();const T=S.trade,E=S.eco,rb=resBal(),A2=S.arms,W=S.w,num=(v,act,min,max,step)=>`<span class="stp"><button onclick="${act}(${Math.max(min,+(v-step).toFixed(1))})" ${v<=min?'disabled':''} aria-label="減らす">−</button><b>${v}</b><button onclick="${act}(${Math.min(max,+(v+step).toFixed(1))})" ${v>=max?'disabled':''} aria-label="増やす">＋</button></span>`;
  let h=`<section class="sec"><h2>貿易</h2>${polBar()}<dl class="kv2"><dt>国庫</dt><dd>${Math.round(E.tre).toLocaleString()}億円(月 ${sg(E.inc)})</dd><dt>先月の内訳</dt><dd>資源の輸出 +${Math.round(T.log.exp)}　武器の輸出 +${Math.round(T.log.arms)}　買い付け −${Math.round(T.log.buy)}</dd><dt>航路</dt><dd class="${rb.open<.99?'am':''}">${rb.open>=.99?'安全':`脅かされている(取引の${Math.round(rb.open*100)}%しか通らず、買い値が3割上がる)`}</dd></dl></section><section class="sec"><h2>資源</h2><p class="mut sm">足りない資源は、通商協定の相手から入るぶんに加えて、国庫で買い付けられる。余った資源は売るか、備蓄に回す。備蓄は、航路が閉じたときの不足を埋める。</p>`;
  for(const x of RES){const k=x[0],c=T.res[k],b=rb[k],bs=tradeBuyers(k,c.to),sold=Math.min(b.sur*c.exp,bs.length),v=sold*tSell(k)*TDEST[c.to][1]*rb.open;
    h+=`<div class="unit"><div class="uh"><b>${x[1]}</b><span class="loc ${b.def>0?'r':''}">${b.def>0?`不足 ${b.def}`:b.sur>0?`余り ${b.sur.toFixed(1)}`:'足りている'}</span></div>
    <p class="sm">産出 ${b.prod}　必要 ${b.need}　協定で輸入 ${b.imp}${b.buy?`　買い付け ${b.buy}`:''}${b.cov?`　備蓄から ${b.cov}`:''}<br><span class="mut">不足すると：${x[2]}に響く</span></p>
    <div class="urow"><label>買い付け</label><div class="grow">${num(c.buy,`A.tbuyr.bind(null,'${k}')`,0,4,.5)}<span class="sm mut">　月${Math.round(c.buy*rb.open*tBuy(k)*(rb.open<.99?1.3:1))}億円</span></div></div>
    <div class="urow"><label>備蓄</label><div class="grow"><b>${T.stock[k].toFixed(1)}</b><span class="sm mut">　目標 </span>${num(c.stT,`A.tstk.bind(null,'${k}')`,0,6,1)}</div></div>
    ${b.prod>0?`<div class="urow"><label>輸出</label><div class="chips" style="margin:0">${[[0,'売らない'],[.5,'半分'],[1,'すべて']].map(o=>`<button class="${c.exp===o[0]?'on':''}" onclick="A.texp('${k}',${o[0]})">${o[1]}</button>`).join('')}</div></div>
    <div class="urow"><label>売り先</label><div class="chips" style="margin:0">${Object.keys(TDEST).map(d=>`<button class="${c.to===d?'on':''}" onclick="A.tto('${k}','${d}')">${TDEST[d][0]}</button>`).join('')}</div></div>
    <p class="sm mut">${b.sur>0?(bs.length?`買い手：${bs.map(natN).join('、')}。月 +${Math.round(v)}億円${c.to==='any'?'':'(安く売るぶん、関係がよくなる)'}`:'この方針では買い手がいない'):'国内で使い切っていて、売るぶんはない'}</p>`:''}</div>`;}
  h+=`</section><section class="sec"><h2>武器の輸出</h2><p class="mut sm">企業の段階が足りる品目だけ売れる。契約のあいだ毎月国庫に入り、企業が経験を積み、相手国との関係がよくなる。</p><h3 class="sub">輸出の方針</h3><div class="chips">${ARMPOL.map((p,i)=>`<button class="${A2.pol===i?'on':''}" onclick="A.apol(${i})">${p[0]}</button>`).join('')}</div><p class="sm mut">${ARMPOL[A2.pol][1]}。</p>
  <h3 class="sub">売ってよい品目</h3><div class="chips">${ARMS.map(a=>{const lv=S.corp[a[0]].lv;return `<button class="${A2.cat[a[0]]?'on':''}" onclick="A.acat('${a[0]}')">${a[1]}<small>${lv>=a[2]?`契約${A2.list.filter(c=>c.cat===a[0]).length}／${corpSlots(lv)}`:`段階${a[2]}から`}</small></button>`;}).join('')}</div>
  <h3 class="sub">引き合い ${A2.offers.length}</h3>`;
  const an=k=>ARMS.find(a=>a[0]===k)[1];
  h+=A2.offers.length?A2.offers.map(o=>{const n=W.n[o.to],full=A2.list.filter(c=>c.cat===o.cat).length>=corpSlots(S.corp[o.cat].lv),war=inWar(o.to);
    return `<div class="item"><div class="uh"><b>${natN(o.to)}　${an(o.cat)}</b><span class="loc">月${o.val}億円 × ${o.months}か月</span></div><p class="sm">${blocTag(n.bloc)} 関係 ${n.rel>0?'+':''}${Math.round(n.rel)}${war?'　<b class="am">交戦中の国。売れば高く売れるが、国内で反発が出る</b>':''}${n.bloc===2&&W.n[ME()].bloc!==2?'　<b class="am">対立する陣営の国</b>':''}<span class="mut">　あと${o.exp-S.month}か月で流れる</span></p><div class="brow"><button class="btn sm pri" ${full?'disabled':''} onclick="A.aacc(${o.id})">${full?'企業の手がふさがっている':'契約する'}</button><button class="btn sm" onclick="A.adec(${o.id})">断る</button></div></div>`;}).join(''):'<p class="sm mut">いま届いている引き合いはない。3か月ごとに届く。</p>';
  h+=`<div class="brow"><button class="btn sm" ${!A2.pol||S.pol.pp<10||(A2.askM!=null&&S.month-A2.askM<2)?'disabled':''} onclick="A.aask()">${!A2.pol?'禁輸中':A2.askM!=null&&S.month-A2.askM<2?'探したばかり':'売り込み先を探す(政治力 10)'}</button></div><h3 class="sub">契約中 ${A2.list.length}</h3>`;
  h+=A2.list.length?A2.list.map(c=>`<div class="urow"><div class="grow"><b>${natN(c.to)}</b>　${an(c.cat)}<br><span class="sm mut">月${c.val}億円・あと${c.left}か月</span></div><button class="btn sm" onclick="A.acan(${c.id})">打ち切る</button></div>`).join(''):'<p class="sm mut">契約はない。</p>';
  return h+'</section>';};
function docHTML(){econInit();const P=S.pol;let h='<section class="sec"><h2>ドクトリン</h2><p class="mut sm">分野ごとに1つ選ぶ。選ぶのに政治力25を使う。選んだ直後は習熟が低く、効果は4割から始まり、20か月かけて満額になる。選び直すと習熟はやり直しになる。</p>';
  for(const b in DOC){const d=S.doc[b],cur=d.k?DOC[b][1].find(x=>x[0]===d.k):null;h+=`<h3 class="sub">${DOC[b][0]}${cur?`　${cur[1]}(習熟 ${Math.round(d.m)}%)`:'　未選択'}</h3>`;
    for(const x of DOC[b][1]){const on=d.k===x[0];h+=`<div class="lopt ${on?'on':''}"><div class="uh"><b>${on?'● ':''}${x[1]}</b><span class="loc">${on?`効果 ${Math.round(docK(b)*100)}%`:''}</span></div><p class="sm mut">${x[2]}</p><p class="sm">${polFxText(x[3])}</p>${on?'':`<button class="btn sm" ${P.pp<25?'disabled':''} onclick="A.docset('${b}','${x[0]}')">${cur?'これに改める':'これを選ぶ'}(政治力 25)</button>`}</div>`;}}
  return h+'</section>';}
{const hd0=GV.hd;GV.hd=()=>hd0()+docHTML();}
VIEW.gov=()=>subtabs('gov',[['world','情勢'],['dip','外交'],['hd','国防'],['focus','方針'],['law','政策'],['land','内政'],['ind','産業'],['trade','貿易']])+(GV[ui.sub.gov]||GV.world)();
Object.assign(A,{
  cinv(k){const c=S.corp[k],E=S.eco;if(!c||c.lv>=10)return;const ic=corpInvC(c.lv);if(E.tre<ic||(c.inv!=null&&S.month-c.inv<3))return;E.tre-=ic;c.inv=S.month;c.xp+=40;grpAdd({biz:1});
    if(c.xp>=corpNeed(c.lv)){c.xp-=corpNeed(c.lv);c.lv++;_M=null;hlog(`${corpName(k)}が力をつけた(段階 ${c.lv})`,'g');}else hlog(`${corpName(k)}に投資した`,'');save();render();},
  cfoc(k){if(!S.corp[k])return;S.cfoc=S.cfoc===k?null:k;save();render();},
  docset(b,k){const d=S.doc[b],x=DOC[b]&&DOC[b][1].find(y=>y[0]===k),P=S.pol;if(!d||!x||d.k===k||P.pp<25)return;
    const go=()=>{if(P.pp<25)return;P.pp-=25;d.k=k;d.m=20;_M=null;hlog(`${DOC[b][0]}のドクトリンを「${x[1]}」に定めた`,'');save();render();toast('ドクトリンを定めた');};
    if(d.k)confirmM(`${DOC[b][0]}のドクトリンを「${x[1]}」に改める。いまの習熟(${Math.round(d.m)}%)は失われ、20%からやり直しになる。`,go,'改める');else go();},
  tbuyr(k,v){const c=S.trade.res[k];if(!c)return;c.buy=clamp(+v||0,0,4);_M=null;save();render();},
  tstk(k,v){const c=S.trade.res[k];if(!c)return;c.stT=clamp(Math.round(+v||0),0,6);save();render();},
  texp(k,v){const c=S.trade.res[k];if(!c)return;c.exp=v===0?0:v===.5?.5:1;save();render();},
  tto(k,d){const c=S.trade.res[k];if(!c||!TDEST[d])return;c.to=d;save();render();},
  apol(i){const A2=S.arms;if(!ARMPOL[i]||A2.pol===i)return;const go=()=>{A2.pol=i;A2.offers=A2.offers.filter(o=>armsOK(o.to));if(!i)A2.offers=[];grpAdd(i>A2.pol?{biz:2,aca:-2}:{biz:-2,aca:2});hlog(`武器輸出の方針を「${ARMPOL[i][0]}」に改めた`,'');save();render();};
    if(i===3)confirmM('相手を選ばずに武器を売る。対立する陣営の国にも売れるが、相手の軍は強くなり、国内の一部は強く反発する。',go,'改める');else go();},
  acat(k){const A2=S.arms;if(!(k in A2.cat))return;A2.cat[k]=A2.cat[k]?0:1;if(!A2.cat[k])A2.offers=A2.offers.filter(o=>o.cat!==k);save();render();},
  aacc(id){const A2=S.arms,o=A2.offers.find(x=>x.id===id);if(!o||!armsOK(o.to)||A2.list.filter(c=>c.cat===o.cat).length>=corpSlots(S.corp[o.cat].lv))return;A2.offers=A2.offers.filter(x=>x!==o);A2.list.push({id:o.id,to:o.to,cat:o.cat,left:o.months,val:o.val});
    relAdd(o.to,4);grpAdd({biz:2});S.corp[o.cat].xp+=6;const w=inWar(o.to);if(w){S.pol.stab=clamp(S.pol.stab-2,0,100);grpAdd({aca:-3});const other=w.a===o.to?w.d:w.a;if(other!==ME())relAdd(other,-8);}
    const t=`${NAT.n}が${natN(o.to)}に${ARMS.find(a=>a[0]===o.cat)[1]}を輸出`;wNews(t,'');hlog(`武器輸出：${natN(o.to)}と${ARMS.find(a=>a[0]===o.cat)[1]}の契約を結んだ(月${o.val}億円、${o.months}か月)`,'g');save();render();toast('契約を結んだ');},
  adec(id){const A2=S.arms,o=A2.offers.find(x=>x.id===id);if(!o)return;A2.offers=A2.offers.filter(x=>x!==o);relAdd(o.to,-1);save();render();},
  aask(){const A2=S.arms,P=S.pol;if(!A2.pol||P.pp<10||(A2.askM!=null&&S.month-A2.askM<2))return;P.pp-=10;A2.askM=S.month;const m=armsOffer(2);save();render();toast(m?`引き合いが${m}件届いた`:'いまは買い手が見つからなかった');},
  acan(id){const A2=S.arms,c=A2.list.find(x=>x.id===id);if(!c)return;confirmM(`${natN(c.to)}への輸出を打ち切る。相手国との関係が悪くなる。`,()=>{A2.list=A2.list.filter(x=>x!==c);relAdd(c.to,-8);hlog(`${natN(c.to)}への武器輸出を打ち切った`,'am');save();render();},'打ち切る');}
});
