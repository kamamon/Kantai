/* ================= 国政の画面：情勢・外交・国家方針・政策・州 ================= */
ui.sub.gov='world';
const GV={};
const relCol=r=>r>=40?'g':r>=10?'b':r>-10?'':r>-40?'am':'r',relWord=r=>r>=60?'親密':r>=30?'友好':r>=10?'良好':r>-10?'中立':r>-30?'冷淡':r>-60?'険悪':'敵対';
const blocTag=b=>`<span class="btag" style="background:rgb(${BLOCC[b].join(',')})">${b===3?blocN(3):BLOC[b].s}</span>`;
const polBar=()=>{const P=S.pol,E=S.eco;return `<div class="pbar"><div><label>政治力</label><b>${Math.floor(P.pp)}</b><small>+${ppGain().toFixed(1)}/月</small></div><div><label>安定度</label><b class="${P.stab<35?'r':P.stab>70?'g':''}">${Math.round(P.stab)}</b><small>→${Math.round(stabTarget())}</small></div><div><label>国庫</label><b>${Math.round(E.tre).toLocaleString()}</b><small>+${E.inc||Math.round(30+gdp())}億/月</small></div></div>`;};
// 世界図の上に重ねる印：戦争の前線と、選んだ土地
function wOverlay(g,v){if(!S||!S.w)return;const Wd=WORLD,s=v.s;g.textAlign='center';g.textBaseline='middle';
  for(const w of S.w.wars){const a=Wd.nat[w.a],d=Wd.nat[w.d],x=((a.x+d.x)/2+.5-v.x0)*s,y=((a.y+d.y)/2+.5-v.y0)*s;if(x<-20||y<-20||x>v.cw+20||y>v.ch+20)continue;
    g.strokeStyle='rgba(255,90,70,.9)';g.lineWidth=2;g.setLineDash([5,4]);g.beginPath();g.moveTo((a.x+.5-v.x0)*s,(a.y+.5-v.y0)*s);g.lineTo((d.x+.5-v.x0)*s,(d.y+.5-v.y0)*s);g.stroke();g.setLineDash([]);
    g.fillStyle='#b3261e';g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.arc(x,y,9,0,6.3);g.fill();g.stroke();g.fillStyle='#fff';g.font='bold 11px sans-serif';g.fillText('戦',x,y+.5);}
  if(ui.wsel!=null&&Wd.P[ui.wsel]){const p=Wd.P[ui.wsel],x=(p.x+.5-v.x0)*s,y=(p.y+.5-v.y0)*s;g.strokeStyle='#ffd166';g.lineWidth=2;g.beginPath();g.arc(x,y,Math.max(7,Math.sqrt(p.n)*s*.55),0,6.3);g.stroke();}}
GV.world=()=>{const W=S.w,Wd=WORLD,me=ME(),rv=RVN(),al=natAlive(),pw=natPw(),mode=ui.mmode||'pol';let sel='<p class="sm mut">地図をタップすると、その土地の州と持ち主がわかる。＋－と2本指で拡大すると、州とプロヴィンスの境、河川、都市が見える。</p>';
  if(ui.wsel!=null&&Wd.P[ui.wsel]){const p=Wd.P[ui.wsel],st=Wd.ST[p.st],o=Wd.pown[p.id];
    sel=`<div class="item"><div class="uh"><b>${stName(st)}</b><span class="loc">${stCity(st)}${st.cap?'(首都)':''}</span></div><dl class="kv2"><dt>持ち主</dt><dd>${natN(o)}${o!==p.nat?`　<span class="r">占領下(本来は${natN(p.nat)})</span>`:''}</dd><dt>地形</dt><dd>${TERN[p.ter]}${p.coast?'・海沿い':''}</dd><dt>州の人口</dt><dd>${st.pop.toLocaleString()}万人</dd><dt>開発度</dt><dd>${stDev(st)}</dd><dt>資源</dt><dd>${st.res?RES.find(r=>r[0]===st.res)[1]:'なし'}</dd></dl>${lwProvPanel(p.id)}${o!==me?`<div class="brow"><button class="btn sm" onclick="A.nat(${o})">${natN(o)}を見る</button></div>`:''}</div>`;}
  const bl=[1,2,3,0].map(b=>{const ms=W.n.map((n,i)=>i).filter(i=>al[i]&&W.n[i].bloc===b);if(b===3&&!ms.length)return'';const tot=ms.reduce((a,i)=>a+pw[i],0);return{b,ms,tot};}).filter(Boolean),mx=Math.max(...bl.map(x=>x.tot),1);
  return `<section class="sec"><h2>世界情勢</h2>${polBar()}${mapBox('view',`data-hi="${me}" data-ri="${rv}"`)}
  <div class="chips">${MMODE.map(m=>`<button class="${mode===m[0]?'on':''}" onclick="A.mmode('${m[0]}')">${m[1]}</button>`).join('')}</div>${sel}</section>
  <section class="sec"><h2>陣営</h2>${bl.map(x=>`<div class="item"><div class="uh">${blocTag(x.b)}<b>${blocN(x.b)}</b><span class="loc">${x.ms.length}か国${W.n[me].bloc===x.b?'・自国が属する':''}</span></div>${bar(x.tot/mx*100,x.b===2?'r':x.b===1?'b':x.b===3?'g':'')}<p class="sm mut">${x.ms.slice().sort((a,b)=>pw[b]-pw[a]).slice(0,8).map(natN).join('、')}${x.ms.length>8?' ほか':''}</p></div>`).join('')}</section>
  <section class="sec"><h2>戦争</h2>${W.wars.length?W.wars.map(w=>{const oa=Wd.P.filter(p=>p.nat===w.d&&Wd.pown[p.id]===w.a).length,od=Wd.P.filter(p=>p.nat===w.a&&Wd.pown[p.id]===w.d).length;
    return `<div class="item"><div class="uh"><b>${natN(w.a)} → ${natN(w.d)}</b><span class="loc">${S.month-w.m0}か月目</span></div><p class="sm">${natN(w.a)}が${oa}プロヴィンスを占領${od?`、${natN(w.d)}が${od}プロヴィンスを占領`:''}。</p><div class="brow">${[w.a,w.d].map(i=>i===me?`<button class="btn sm" onclick="A.sub('gov','hd')">国防を開く</button>`:`<button class="btn sm" onclick="A.nat(${i})">${natN(i)}</button>`).join('')}</div></div>`;}).join(''):'<p class="mut sm">いま戦っている国はない。</p>'}
  ${W.hot.filter(h=>h.t>=60&&al[h.a]&&al[h.b]&&!inWar(h.a)&&!inWar(h.b)).sort((a,b)=>b.t-a.t).slice(0,4).map(h=>`<p class="al am">火種：${natN(h.a)}と${natN(h.b)}の国境(緊張 ${Math.round(h.t)})</p>`).join('')}</section>
  <section class="sec"><h2>世界の動き</h2>${W.news.slice(0,16).map(n=>`<div class="logl ${n.c}"><span>${dateStr(n.m).replace(/^海暦/,'')}</span>${n.t}</div>`).join('')}</section>`;};
GV.dip=()=>{const W=S.w,me=ME(),rv=RVN(),al=natAlive(),f=ui.dipf||'all',pw=natPw(),F=[['all','すべて'],['b1',BLOC[1].s],['b2',BLOC[2].s],['b0','非同盟'],['war','交戦中'],['tr','条約あり']];
  const ok=i=>f==='all'||(f==='b1'&&W.n[i].bloc===1)||(f==='b2'&&W.n[i].bloc===2)||(f==='b0'&&(W.n[i].bloc===0||W.n[i].bloc===3))||(f==='war'&&inWar(i))||(f==='tr'&&(W.n[i].trd||W.n[i].def||W.n[i].sanc));
  const ids=W.n.map((n,i)=>i).filter(i=>i!==me&&al[i]&&ok(i)).sort((a,b)=>(b===rv)-(a===rv)||W.n[b].rel-W.n[a].rel);
  return `<section class="sec"><h2>外交</h2>${polBar()}<p class="mut sm">国をタップすると、関係の改善、通商協定、防衛協力、援助、制裁、仲介ができる。動くたびに政治力を使う。</p>
  <div class="chips">${F.map(x=>`<button class="${f===x[0]?'on':''}" onclick="A.dipf('${x[0]}')">${x[1]}</button>`).join('')}</div>
  ${ids.map(i=>{const n=W.n[i];return `<button class="nrow" onclick="A.nat(${i})"><i class="flag" style="${flagCSS(NATS[i])}"></i><span class="nn"><b>${natN(i)}</b><small>${GOV[n.gov]}${i===rv?'・<em class="r">対峙する国</em>':''}${inWar(i)?'・<em class="r">交戦中</em>':''}</small></span>${blocTag(n.bloc)}<span class="tr">${n.trd?'通':''}${n.def?'防':''}${n.sanc?'制':''}${n.imp>0?'↑':''}</span><span class="rv ${relCol(n.rel)}">${n.rel>0?'+':''}${Math.round(n.rel)}<small>${relWord(n.rel)}</small></span></button>`;}).join('')||'<p class="mut sm">当てはまる国はない。</p>'}</section>`;};
// [キー, 名称, 政治力, 説明, できる条件(国, 番号) → 理由の文字列ならできない]
const DIP=[
  ['imp','関係の改善',12,'特使を送り、半年かけて関係を温める',(n)=>n.sanc?'制裁中':n.imp>0?'進行中':''],
  ['trd','通商協定',25,'国庫の収入が増え、相手に余っている資源を輸入できる',(n)=>n.trd?'締結済み':n.sanc?'制裁中':n.rel<15?'関係が+15以上必要':''],
  ['def','防衛協力',40,'情報を持ち寄る。敵情の精度が上がる',(n,i)=>n.def?'締結済み':i===RVN()?'対峙する国とは結べない':n.rel<45?'関係が+45以上必要':''],
  ['aid','軍事援助',15,'戦っている国に装備と弾薬を送る(資金300億円、1年間)',(n,i)=>!inWar(i)?'交戦中の国だけ':n.aid>S.month?'援助中':!canPay(300)?'資金が足りない':''],
  ['med','和平の仲介',40,'戦争の当事国に停戦を働きかける',(n,i)=>!inWar(i)?'交戦中の国だけ':S.month-inWar(i).m0<4?'開戦からまだ日が浅い':''],
  ['sum','首脳会談',50,'相手国の首脳と会い、緊張を和らげる(年に1度)',(n,i)=>i!==RVN()?'対峙する国とだけ':S.pol.sumM!=null&&S.month-S.pol.sumM<12?'前回から1年たっていない':''],
  ['sanc','経済制裁',30,'通商を止める。相手の国力は落ちるが、関係は決定的に悪くなる',(n)=>n.sanc?'発動中':n.rel>=0?'関係が悪い国だけ':''],
  ['unsanc','制裁の解除',10,'通商を再開する',(n)=>n.sanc?'':'制裁していない']
];
function showNat(i){const W=S.w,n=W.n[i],N=NATS[i],rv=RVN(),pw=natPw(),al=natAlive(),rank=pw.map((v,k)=>k).filter(k=>al[k]).sort((a,b)=>pw[b]-pw[a]).indexOf(i)+1,w=inWar(i),res=natRes(i),cnt=natCnt(i),orig=WORLD.P.filter(p=>p.nat===i).length,cbs={ok:closeModal};
  const acts=DIP.map(d=>{const why=d[4](n,i),lack=S.pol.pp<d[2];cbs['d_'+d[0]]=()=>{closeModal();A.dip(i,d[0]);};return why==='締結済み'||(d[0]==='unsanc'&&why)||(d[0]==='sum'&&i!==rv)||(d[0]==='sanc'&&n.sanc)?'':`<div class="item"><div class="uh"><b>${d[1]}</b><span class="loc">政治力 ${d[2]}</span></div><p class="sm mut">${d[3]}</p><button class="btn sm" data-m="d_${d[0]}" ${why||lack?'disabled':''}>${why||(lack?'政治力が足りない':'実行する')}</button></div>`;}).join('');
  modal(`<div class="nhead"><i class="flag big" style="${flagCSS(N)}"></i><div><h2>${N.f}</h2><p class="sm mut">${N.d}</p></div></div>
  <dl class="kv2"><dt>首脳</dt><dd>${n.ldr}${GOVL[n.gov]}</dd><dt>政体</dt><dd>${GOV[n.gov]}</dd><dt>陣営</dt><dd>${blocN(n.bloc)}</dd><dt>国力</dt><dd>世界${rank}位(${Math.round(pw[i]).toLocaleString()})</dd><dt>領土</dt><dd>${cnt}プロヴィンス${cnt!==orig?`(もとは${orig})`:''}</dd><dt>政情</dt><dd>${n.stab>=65?'安定':n.stab>=42?'ふつう':'<span class="r">不安定</span>'}</dd><dt>地勢</dt><dd>${natGeo(i).t[0]}<span class="mut">(もとの国土は広さ${natGeo(i).rank}位、陸で接する国 ${natGeo(i).nb.length})</span></dd>
  <dt>我が国との関係</dt><dd><b class="${relCol(n.rel)}">${n.rel>0?'+':''}${Math.round(n.rel)}　${relWord(n.rel)}</b></dd><dt>取り決め</dt><dd>${[n.trd?'通商協定':'',n.def?'防衛協力':'',n.sanc?'<span class="r">制裁中</span>':'',n.aid>S.month?'援助中':'',n.imp>0?'関係を改善中':''].filter(Boolean).join('、')||'なし'}</dd>
  <dt>産出する資源</dt><dd>${RES.filter(r=>res[r[0]]).map(r=>r[1]+(res[r[0]]>=2?'(余り)':'')).join('、')||'なし'}</dd><dt>戦争</dt><dd>${w?`<span class="r">${natN(w.a===i?w.d:w.a)}と交戦中(${S.month-w.m0}か月目)</span>`:'なし'}</dd></dl>
  <h3 class="sub">外交</h3><p class="sm">政治力 <b>${Math.floor(S.pol.pp)}</b></p>${acts}<div class="mbtn"><button class="btn pri" data-m="ok">閉じる</button></div>`,cbs);}
const focDepth=k=>{const f=focBy[k];return f[5].length?1+Math.min(...f[5].map(focDepth)):0;};
GV.focus=()=>{const P=S.pol,cur=P.foc.cur,br=ui.fbr||'mil',D=P.foc.done,rows=[];for(const f of FOC.filter(f=>f[1]===br)){const d=focDepth(f[0]);(rows[d]=rows[d]||[]).push(f);}
  const node=f=>{const k=f[0],done=D[k],isCur=cur&&cur.k===k,ok=focusOK(f),ex=f[6].find(x=>D[x]),need=f[5].length&&!f[5].some(x=>D[x]);
    return `<div class="fnode ${done?'done':isCur?'cur':ok?'':'lock'}"><div class="uh"><b>${f[2]}</b><span class="loc">${done?'完了':`${f[3]}か月・政治力${f[4]}`}</span></div><p class="sm mut">${f[8]}</p><p class="sm">${polFxText(f[7],FOCX[k])}</p>
    ${done?'':isCur?`${bar((1-cur.left/f[3])*100,'')}<span class="sm">あと${cur.left}か月</span>`:ex?`<p class="sm r">「${focBy[ex][2]}」を選んだため進めない</p>`:need?`<p class="sm am">前提：${f[5].map(x=>focBy[x][2]).join(' か ')}</p>`:`<button class="btn sm" ${cur||P.pp<f[4]?'disabled':''} onclick="A.focus('${k}')">${cur?'ほかの方針を進めている':P.pp<f[4]?'政治力が足りない':'この方針を進める'}</button>`}
    ${f[6].length&&!done&&!ex?`<p class="sm mut">「${f[6].map(x=>focBy[x][2]).join('」「')}」とは同時に選べない</p>`:''}</div>`;};
  return `<section class="sec"><h2>国家方針</h2>${polBar()}<p class="mut sm">国の進む向きを定める。一度にひとつずつ進み、終えると効果がずっと続く。分かれ道では片方しか選べない。</p>
  ${cur?`<div class="cur"><span class="sm">進行中：<b>${focBy[cur.k][2]}</b>　あと${cur.left}か月</span>${bar((1-cur.left/focBy[cur.k][3])*100,'')}</div>`:'<p class="al am">進めている方針がない</p>'}
  <div class="chips">${FOCB.map(b=>`<button class="${br===b[0]?'on':''}" onclick="A.fbr('${b[0]}')">${b[1]}<small>${FOC.filter(f=>f[1]===b[0]&&D[f[0]]).length}/${FOC.filter(f=>f[1]===b[0]).length}</small></button>`).join('')}</div>
  <div class="ftree">${rows.map((r,i)=>`${i?'<div class="fline"></div>':''}<div class="frow">${r.map(node).join('')}</div>`).join('')}</div></section>`;};
GV.law=()=>{const P=S.pol,X=polSum(),lc=k=>Math.round(30*(1-clamp(X.lawC||0,0,.6))),cd=X.lawC>=.2?6:12;
  const laws=LAW.map(L=>{const k=L[0],cur=P.law[k],wait=P.lawM[k]!=null?cd-(S.month-P.lawM[k]):0;
    return `<div class="item"><div class="uh"><b>${L[1]}</b><span class="loc">${wait>0?`あと${wait}か月は変えられない`:`変更に政治力 ${lc(k)}`}</span></div>${L[2].map((o,i)=>{const why=i===cur?'':wait>0?'x':P.pp<lc(k)?'政治力が足りない':k==='eco'&&i===2&&!atWar()&&!S.lw&&S.tension<70?'緊張度70以上か、侵攻を受けているときだけ':k==='def'&&i===2&&!P.foc.done.m7&&!P.foc.done.p5?'方針「反撃能力の保有」か「危機管理法制」が必要':'';
      return `<div class="lopt ${i===cur?'on':''}"><div class="uh"><b>${i===cur?'● ':''}${o[0]}</b>${i===cur?'<span class="loc">いまの政策</span>':''}</div><p class="sm mut">${o[1]}</p><p class="sm">${polFxText(o[2],o[3])}</p>${i===cur||why==='x'?'':`<button class="btn sm" ${why?'disabled':''} onclick="A.law('${k}',${i})">${why||'この政策に改める'}</button>`}</div>`;}).join('')}</div>`;}).join('');
  const hired=P.adv.map(id=>P.pool.find(a=>a.id===id)).filter(Boolean),adv=a=>{const d=ADV.find(x=>x[0]===a.t),h=P.adv.includes(a.id);return `<div class="item"><div class="uh"><b>${a.n}</b><span class="loc">${d[1]}</span></div><p class="sm">${polFxText(d[2],d[3])}</p><button class="btn sm" ${h||(P.adv.length<3&&P.pp>=35)?'':'disabled'} onclick="A.adv(${a.id})">${h?'解任する':P.adv.length>=3?'枠がいっぱい':P.pp<35?'政治力が足りない':'登用する(政治力 35)'}</button></div>`;};
  return `<section class="sec"><h2>政権</h2>${polBar()}<dl class="kv2"><dt>与党</dt><dd><b>${PARTY[P.gov.p][0]}</b>　${PARTY[P.gov.p][1]}</dd><dt>与党の影響</dt><dd>${polFxText(PARTY[P.gov.p][2],PARTY[P.gov.p][3])}</dd><dt>次の総選挙</dt><dd>${Math.max(0,P.gov.next-S.month)}か月後</dd></dl>
  <h3 class="sub">国内の勢力</h3><p class="mut sm">満足しているほど、それぞれの分野が伸びる。政策や出来事で上下し、放っておくと50に戻る。</p>${GRP.map(g=>`<div class="st3 one"><div><label>${g[1]}　${Math.round(P.grp[g[0]])}<span class="mut">　${g[2]}</span></label>${bar(P.grp[g[0]],P.grp[g[0]]<40?'r':P.grp[g[0]]>60?'g':'')}</div></div>`).join('')}</section>
  <section class="sec"><h2>政策</h2>${laws}</section>
  <section class="sec"><h2>顧問 ${hired.length}/3</h2><p class="mut sm">登用しているあいだ効果がある。顔ぶれは年に一度入れ替わる。</p>${hired.map(adv).join('')}<h3 class="sub">候補</h3>${P.pool.filter(a=>!P.adv.includes(a.id)).map(adv).join('')||'<p class="mut sm">候補はいない</p>'}</section>`;};
GV.land=()=>{const E=S.eco,G=gdp(),rb=resBal(),X=polSum();
  const st=myStates().map(s=>{const e=E.st[s.id],used=stUsed(e),slots=stSlots(e),free=used<slots,busy=e.q,hf=stHeld(s);
    if(!hf)return `<div class="unit away"><div class="uh"><b>${stName(s)}</b><span class="loc">${stCity(s)}${s.cap?'(首都)':''}</span></div><p class="al r">${natN(stOwner(s))}の占領下にある。経済には数えられず、開発も建設もできない</p></div>`;
    const opts=BLD.filter(b=>(b[3]!==1||s.coast)&&(b[3]!==2||s.res)).map(b=>`<option value="${b[0]}">${b[1]} ${(e.b[b[0]]||0)+1}へ(${bldCost(s,b[0])}億・${4+(e.b[b[0]]||0)}か月)　${b[2]}</option>`).join('');
    return `<div class="unit"><div class="uh"><b>${stName(s)}</b><span class="loc">${stCity(s)}${s.cap?'(首都)':''}</span></div>
    <p class="sm">人口 ${Math.round(s.pop*e.pg).toLocaleString()}万人・${TERN[s.ter]}${s.coast?'・海沿い':''}${s.res?`・<b class="am">${RES.find(r=>r[0]===s.res)[1]}</b>`:''}　GDP ${(stGDP(s)*E.g*hf).toFixed(1)}兆円${hf<1?`　<span class="r">土地の${Math.round((1-hf)*100)}%を占領されている</span>`:''}</p>
    <div class="st3"><div><label>開発度 ${e.dev}/10</label>${bar(e.dev*10,'b')}</div><div><label>区画 ${used}/${slots}</label>${bar(used/slots*100,used>=slots?'am':'')}</div></div>
    <p class="sm">${BLD.filter(b=>e.b[b[0]]).map(b=>`<span class="tag">${b[1]} ${e.b[b[0]]}</span>`).join(' ')||'<span class="mut">建物はない</span>'}</p>
    ${busy?`<div class="cur"><span class="sm">${busy.k==='dev'?'開発を進めている':BLD.find(b=>b[0]===busy.k)[1]+'を建設中'}　あと${busy.left}か月</span></div>`:`<div class="urow"><label>開発</label><button class="btn sm" ${e.dev<10&&E.tre>=devCost(s)?'':'disabled'} onclick="A.dev(${s.id})">${e.dev>=10?'上限':`開発度を上げる(${devCost(s)}億・6か月)`}</button></div>
    <div class="urow"><label>建設</label><select id="bs${s.id}" aria-label="${stName(s)}に建てるもの" ${free?'':'disabled'}>${opts}</select><button class="btn sm" ${free?'':'disabled'} onclick="A.bld(${s.id})">${free?'建てる':'区画がない'}</button></div>`}</div>`;}).join('');
  return `<section class="sec"><h2>経済</h2>${polBar()}<dl class="kv2"><dt>国内総生産</dt><dd><b>${G.toFixed(1)}兆円</b>(着任時の${Math.round(G/E.gdp0*100)}%)</dd><dt>成長の見込み</dt><dd>年 ${(.8+(X.gdpG||0)+(S.pol.stab-50)*.02).toFixed(1)}%</dd><dt>防衛予算への反映</dt><dd>来年度の予算は基準の ${Math.round(polBudK()*100)}%</dd><dt>国庫</dt><dd>${Math.round(E.tre).toLocaleString()}億円(毎月 +${E.inc||0}億円)</dd></dl>
  <p class="mut sm">国庫は州の開発と建設に使う。GDPが伸びると、年度ごとの防衛予算も増える。</p><div class="brow"><button class="btn sm" ${E.tre>=300&&S.pol.pp>=15?'':'disabled'} onclick="A.tre2f()">国庫から防衛費へ300億円を回す(政治力 15)</button></div>
  <h3 class="sub">資源</h3><p class="mut sm">足りない分は、通商協定を結んだ国の余りを輸入する。航路が妨害されると輸入は細る(いま ${Math.round(rb.open*100)}%)。</p>
  <table class="rt"><tr><th>資源</th><th>必要</th><th>産出</th><th>輸入</th><th>不足</th></tr>${RES.map(r=>{const b=rb[r[0]];return `<tr><td>${r[1]}</td><td>${b.need}</td><td>${b.prod}</td><td>${b.imp}</td><td class="${b.def>0?'r':'g'}">${b.def>0?b.def:'なし'}</td></tr>`;}).join('')}</table><p class="mut sm">不足すると、${RES.map(r=>`${r[1]}は${r[2]}`).join('、')}に響く。</p></section>
  <section class="sec"><h2>州 ${heldSt().length}${heldSt().length<myStates().length?'／'+myStates().length:''}</h2>${st}</section>`;};
VIEW.gov=()=>subtabs('gov',[['world','情勢'],['dip','外交'],['focus','方針'],['law','政策'],['land','内政']])+(GV[ui.sub.gov]||GV.world)();
{const home0=VIEW.home,al0=alerts;
  VIEW.home=()=>{const P=S.pol,cur=P.foc.cur;return home0()+`<section class="sec"><h2>国政と世界</h2>${polBar()}<p class="sm">${cur?`国家方針「${focBy[cur.k][2]}」を進めている(あと${cur.left}か月)`:'<span class="am">国家方針が選ばれていない</span>'}　与党：${PARTY[P.gov.p][0]}</p>${S.w.news.slice(0,4).map(n=>`<div class="logl ${n.c}"><span>${dateStr(n.m).replace(/^海暦/,'')}</span>${n.t}</div>`).join('')}<div class="brow"><button class="btn sm" onclick="A.tab('gov')">国政を開く</button></div></section>`;};
  alerts=function(){const a=al0(),P=S.pol;if(P){if(!P.foc.cur&&FOC.some(f=>focusOK(f)&&P.pp>=f[4]))a.push(['国家方針を選べる(国政 → 方針)','am']);if(P.stab<35)a.push(['安定度が低い。政治力と経済が伸びない','r']);if(S.eco.tre>=600)a.push([`国庫に${Math.round(S.eco.tre)}億円ある。州の開発に使える`,'']);const rb=resBal();for(const r of RES)if(rb[r[0]].def>=1)a.push([`${r[1]}が不足している(${r[2]}に響く)`,'am']);}return a;};}
Object.assign(A,{
  mmode(k){ui.mmode=k;render();},wsel(p){ui.wsel=p;if(ui.tab==='gov'&&(ui.sub.gov==='world'||ui.sub.gov==='hd'))render();else drawMaps();},nat(i){showNat(i);},dipf(k){ui.dipf=k;render();},fbr(k){ui.fbr=k;render();},
  dip(i,k){const W=S.w,n=W.n[i],d=DIP.find(x=>x[0]===k),P=S.pol,rv=RVN();if(!d||d[4](n,i)||P.pp<d[2])return;P.pp-=d[2];let msg='';
    if(k==='imp'){n.imp=6;msg=`${natN(i)}に特使を送った`;}
    else if(k==='trd'){n.trd=1;relAdd(i,5);grpAdd({biz:3});msg=`${natN(i)}と通商協定を結んだ`;wNews(`${NAT.n}と${natN(i)}が通商協定に署名`,'');}
    else if(k==='def'){n.def=1;relAdd(i,8);if(n.bloc===1||n.bloc===3)relAdd(rv,-4);msg=`${natN(i)}と防衛協力を結んだ`;wNews(`${NAT.n}と${natN(i)}が防衛協力で合意`,'am');}
    else if(k==='nap'){n.nap=S.month+48;relAdd(i,5);const h=lwHot(i);if(h)h.t=Math.max(0,h.t-20);msg=`${natN(i)}と不可侵条約を結んだ`;wNews(`${NAT.n}と${natN(i)}が不可侵条約に署名`,'g');}
    else if(k==='aid'){spend(300);n.aid=S.month+12;relAdd(i,15);const w=inWar(i),o=w.a===i?w.d:w.a;relAdd(o,-15);if(W.n[o].bloc===2||o===rv)S.tension=clamp(S.tension+2,0,100);msg=`${natN(i)}へ装備と弾薬を送った`;wNews(`${NAT.n}が${natN(i)}への軍事援助を発表。${natN(o)}は反発`,'am');}
    else if(k==='sanc'){n.sanc=1;n.trd=0;relAdd(i,-30);if(i===rv)S.tension=clamp(S.tension+4,0,100);grpAdd({biz:-4});msg=`${natN(i)}への経済制裁を発動した`;wNews(`${NAT.n}が${natN(i)}に経済制裁`,'r');}
    else if(k==='unsanc'){n.sanc=0;relAdd(i,10);msg=`${natN(i)}への制裁を解いた`;}
    else if(k==='med'){const w=inWar(i),o=w.a===i?w.d:w.a,p=clamp(.25+(n.rel+W.n[o].rel)/400+(S.support-50)/200+(S.month-w.m0)/40,.05,.8),rep=[];
      if(Math.random()<p){warEnd(w,null,null,'peace',rep);relAdd(i,10);relAdd(o,10);S.support=clamp(S.support+3,0,100);for(const r of rep)hlog(r[0],r[1]);msg='仲介が実り、両国は停戦に合意した(支持率 +3)';}else{relAdd(i,-3);relAdd(o,-3);msg='仲介は実らなかった';}}
    else if(k==='sum'){P.sumM=S.month;const p=clamp(.55+(n.rel+60)/120+mods().warn*2,.15,.9);if(Math.random()<p){const dT=RI(5,9);S.tension=clamp(S.tension-dT,0,100);relAdd(i,8);S.support=clamp(S.support+2,0,100);msg=`首脳会談は成功した(緊張度 −${dT}、支持率 +2)`;wNews(`${NAT.n}と${RIV.n}の首脳が会談。対話の継続で一致`,'g');}
      else{S.tension=clamp(S.tension+1,0,100);S.support=clamp(S.support-1,0,100);msg='首脳会談は物別れに終わった';wNews(`${NAT.n}と${RIV.n}の首脳会談は成果なく終わる`,'am');}}
    W.ver++;_M=null;hlog('外交：'+msg,'b');checkOver();save();render();toast(msg);if(S.over)showOver();},
  focus(k){const P=S.pol,f=focBy[k];if(!f||P.foc.cur||!focusOK(f)||P.pp<f[4])return;P.pp-=f[4];P.foc.cur={k,left:f[3]};hlog(`国家方針「${f[2]}」に着手`,'b');save();render();},
  law(k,i){const P=S.pol,L=LAW.find(x=>x[0]===k),X=polSum(),c=Math.round(30*(1-clamp(X.lawC||0,0,.6))),cd=X.lawC>=.2?6:12,old=P.law[k];if(!L||i===old||!L[2][i]||P.pp<c||(P.lawM[k]!=null&&S.month-P.lawM[k]<cd))return;
    if((k==='eco'&&i===2&&!atWar()&&!S.lw&&S.tension<70)||(k==='def'&&i===2&&!P.foc.done.m7&&!P.foc.done.p5))return;
    confirmM(`<b>${L[1]}</b>を「${L[2][old][0]}」から「<b>${L[2][i][0]}</b>」に改める。政治力 ${c} を使い、しばらくは変えられない。`,()=>{const k0=polBudK();P.pp-=c;P.law[k]=i;P.lawM[k]=S.month;const g=LAWG[k],d=i-old,o={};for(const q in g)o[q]=g[q]*d;grpAdd(o);_M=null;
      if(k==='bud'){const r=polBudK()/k0;S.budget=Math.max(1200,Math.round(S.budget*r/10)*10);}if(k==='def'&&d>0){S.w.n.forEach((n,j)=>{if(j!==ME()&&n.bloc===2)relAdd(j,-4*d);});S.tension=clamp(S.tension+2*d,0,100);}
      hlog(`政策：${L[1]}を「${L[2][i][0]}」に改めた`,'b');wNews(`${NAT.n}が${L[1]}を「${L[2][i][0]}」に改める`,'');save();render();},'改める');},
  adv(id){const P=S.pol,a=P.pool.find(x=>x.id===id);if(!a)return;if(P.adv.includes(id))P.adv=P.adv.filter(x=>x!==id);else{if(P.adv.length>=3||P.pp<35)return;P.pp-=35;P.adv.push(id);hlog(`${a.n}を顧問に登用`,'');}_M=null;save();render();},
  dev(sid){const st=WORLD.ST[sid],e=S.eco.st[sid],c=devCost(st);if(!e||e.q||e.dev>=10||S.eco.tre<c||!stHeld(st))return;S.eco.tre-=c;e.q={k:'dev',left:6};save();render();},
  bld(sid){const st=WORLD.ST[sid],e=S.eco.st[sid],sel=document.getElementById('bs'+sid),k=sel&&sel.value,b=BLD.find(x=>x[0]===k);if(!e||e.q||!b||stUsed(e)>=stSlots(e)||!stHeld(st))return;const c=bldCost(st,k);if(S.eco.tre<c)return toast('国庫が足りない');S.eco.tre-=c;e.q={k,left:4+(e.b[k]||0)};save();render();},
  tre2f(){if(S.eco.tre<300||S.pol.pp<15)return;S.eco.tre-=300;S.pol.pp-=15;S.funds+=300;hlog('国庫から防衛費へ300億円を回した','');save();render();}
});
