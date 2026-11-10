/* ================= 司令部の画面 ================= */
const bar=(v,c)=>`<i class="bar"><b class="${c||''}" style="width:${clamp(v,0,100)}%"></b></i>`;
const seg=(vals,cur,fn)=>`<div class="seg">${vals.map(v=>`<button class="${v[0]===cur?'on':''}" onclick="${fn(v[0])}">${v[1]}</button>`).join('')}</div>`;
const subtabs=(tab,list)=>`<div class="sub">${list.map(x=>`<button class="${ui.sub[tab]===x[0]?'on':''}" onclick="A.sub('${tab}','${x[0]}')">${x[1]}</button>`).join('')}</div>`;
const oname=o=>o?`${o.name} ${RANK[o.rank]}`:'<span class="am">欠員</span>';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PD={co:'艦の戦闘効率、電子戦、警告',xo:'練度の伸び',we:'SAM命中率と対艦ミサイルの突破力',op:'探知距離と反応速度',en:'速力、整備度、被害の軽減',as:'対潜攻撃とソナー',ai:'発着艦と戦闘機'};
const VIEW={};
function render(){if(!S)return;
  $('#date').textContent=dateStr(S.month)+'　'+(Math.floor(S.month/12)+1)+'年目';
  const gf=$('#gf');gf.textContent=S.cfg.sandbox?'無制限':Math.round(S.funds).toLocaleString()+' 億円';gf.className=S.funds<0?'r':'';
  $('#gs').textContent=Math.round(S.support)+'%';const sb=$('#gsb');sb.style.width=S.support+'%';sb.className=S.support<25?'r':S.support<45?'am':'g';
  $('#gt').textContent=Math.round(S.tension)+'%';const tb=$('#gtb');tb.style.width=S.tension+'%';tb.className=S.tension>=65?'r':S.tension>=40?'am':'g';
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===ui.tab));
  $('#view').innerHTML=tx(VIEW[ui.tab]());$('#next').disabled=!!S.over;drawMaps();}

/* ---------- モーダル・トースト ---------- */
const mq=[];
function showM(){$('#mbox').innerHTML=tx(mq[0].html);drawMaps();$('#modal').hidden=false;$('#mbox').scrollTop=0;}
function modal(html,cbs){mq.push({html,cbs:cbs||{}});if(mq.length===1)showM();}
function closeModal(){mq.shift();if(mq.length)showM();else $('#modal').hidden=true;}
function confirmM(text,yes,yl,no){modal(`<p>${text}</p><div class="mbtn"><button class="btn pri" data-m="y">${yl||'実行する'}</button><button class="btn" data-m="n">やめる</button></div>`,{y:()=>{closeModal();yes();},n:()=>{closeModal();if(no)no();}});}
function toast(msg){const t=$('#toast');t.textContent=tx(msg);t.className='show';clearTimeout(toast.h);toast.h=setTimeout(()=>{t.className='';},2600);}
function showOver(){const o=S.over,occ=ISLZ.filter(i=>!S.sectors[i].held).length,st=S.stats;
  const score=st.wins*100+st.blood0*80+Math.round(S.support)*5-st.pSunk*60-occ*250+Math.min(S.month,60)*10+totalLv()+(o.k==='peace'?800:0);
  const rank=score>=2000?'S':score>=1400?'A':score>=900?'B':score>=400?'C':'D';
  modal(`<div class="alert ${o.k==='lost'||o.k==='fired'?'r':'g'}">${dateStr(S.month)}</div><h2>${o.t}</h2><p>${o.d}</p><dl class="kv2"><dt>戦績</dt><dd>${st.wins}勝 ${st.loss}敗(無血 ${st.blood0})</dd><dt>撃沈／喪失</dt><dd>${st.eSunk}隻／${st.pSunk}隻</dd><dt>確保した島</dt><dd>${3-occ}／3</dd><dt>技術の蓄積</dt><dd>${totalLv()}段階</dd><dt>最終支持率</dt><dd>${Math.round(S.support)}%</dd><dt>評価</dt><dd><b class="am">${rank}</b>(${score}点)</dd></dl><div class="mbtn"><button class="btn pri" data-m="new">新しい任期を始める</button><button class="btn" data-m="ok">記録を眺める</button></div>`,
  {new:()=>{closeModal();showTitle();}});}
function showPeace(){modal(`<div class="alert g">緊張緩和</div><h2>海は1年のあいだ静かだった</h2><p>抑止が機能し、両国は海上連絡メカニズムの運用に合意した。ここで退任すれば、平和をもたらした司令として評価される。任期を続けることもできる。</p><div class="mbtn"><button class="btn pri" data-m="pc">任期を続ける</button><button class="btn" data-m="pe">ここで退任する</button></div>`,
  {pc:closeModal,pe:()=>{S.over={k:'peace',t:'緊張緩和',d:'抑止が機能し、海に静けさが戻った。'};S.pending=null;save();render();mq.length=0;showOver();}});}
function showFiscal(f){const p=a=>Math.round(askChance(a)*100);
  modal(`<div class="alert">${dateStr(S.month)}　年度替わり</div><h2>新年度の防衛予算</h2><dl class="kv2"><dt>前年度</dt><dd>${f.old.toLocaleString()} 億円</dd><dt>今年度の内示</dt><dd><b>${S.budget.toLocaleString()} 億円</b>(月 ${income()} 億円)</dd>${f.cut?`<dt>査定減</dt><dd class="am">使い残しが多く、${f.cut}億円を削られた</dd>`:''}<dt>定期異動</dt><dd>${f.pr.join('<br>')}</dd></dl>
  <p class="sm mut">内示を受け入れるか、増額を求めるか。通れば増えるが、退けられると内示から2%減り、支持率も下がる。</p>
  <div class="mbtn"><button class="btn pri" data-m="a0">内示を受け入れる</button><button class="btn" data-m="a1">5%の増額を求める(成算 ${p(.05)}%)</button><button class="btn" data-m="a2">12%の増額を求める(成算 ${p(.12)}%)</button><button class="btn" data-m="a3">25%の増額を求める(成算 ${p(.25)}%)</button></div>`,
  {a0:closeModal,a1:()=>A.ask(.05),a2:()=>A.ask(.12),a3:()=>A.ask(.25)});}

/* ---------- タイトルとカスタムスタート ---------- */
function begin(cfg){newGame(cfg);save();ui.tab='home';render();showHelp();}
function showTitle(){const has=!!load();mq.length=0;
  modal(`<div class="alert">惑星${PLANET}　機動艦隊司令部</div><h2 class="big">蒼海の盾</h2><p class="sm">海が地表の大半を占める惑星${PLANET}。20の国が海を分け合い、島と航路をめぐって睨み合っている。一国の艦隊を預かり、撃たせず、撃たずに守り抜けるか。</p>${has?'<p class="sm mut">新しく始めると、いまの記録は上書きされる。</p>':''}<div class="mbtn">${has?`<button class="btn pri" data-m="c">続きから</button>`:''}<button class="btn ${has?'':'pri'}" data-m="n">国を選んで始める</button></div>`,
  {c:()=>{closeModal();S=load();applyNation(S.cfg.nat,S.cfg.riv);_M=null;_PM=null;render();if(S.over)showOver();else if(S.gpend)groundPrompt();else if(S.pending)showIncident();},n:()=>{closeModal();ui.cs=null;ui.nview='list';ui.wsc=null;ui.nsc=0;showNation();}});}
// 国を選ぶ画面。20か国の名称群を見比べて、対峙する国も決める
function showNation(){if(ui.nat==null)ui.nat=0;const info=ui.nview==='info',i=ui.nat,N=NATS[i],rv=ui.riv==null||ui.riv===i||!NATS[ui.riv]?N.rv:ui.riv,D=DSTY[N.ds],sv=TXL;let html;
  if(!info){
    html=`<div class="alert">惑星${PLANET}</div><h2>国を選ぶ</h2><p class="sm mut">世界地図か下の一覧で国をタップすると、その国の情報が開く。地図は指で動かせる。</p>
  <div class="wscroll"><canvas class="wmap" data-mode="sel" data-hi="${i}"></canvas></div>
  <div class="nlist">${NATS.map((x,k)=>`<button class="${k===i?'on':''}" onclick="A.nsel(${k})"><i class="flag" style="${flagCSS(x)}"></i>${x.n}</button>`).join('')}</div>
  <div class="mbtn"><button class="btn" data-m="back">タイトルへ戻る</button></div>`;
  }else{
    TXL=D.tx.concat(GSTY[N.gs].tx,RSTY[N.rk].tx);const nm=natNames(i),ex=k=>tx(PT[k].n)+'「'+nm[k].slice(0,2).join('」「')+'」',ppl=[0,1,2].map(()=>mkName(N)).join('、');
    html=`<div class="brow nnav"><button class="btn sm" onclick="A.nback()">← 国の選択に戻る</button><span class="grow"></span><button class="btn sm" onclick="A.nsel(${(i+NATS.length-1)%NATS.length})" aria-label="前の国">‹ 前</button><button class="btn sm" onclick="A.nsel(${(i+1)%NATS.length})" aria-label="次の国">次 ›</button></div>
  <div class="uh"><i class="flag big" style="${flagCSS(N)}"></i><b>${N.f}</b></div><p class="sm">${N.d}。</p>
  <canvas class="wmap loc" data-mode="loc" data-hi="${i}" data-ri="${rv}"></canvas><p class="sm mut">白が${N.n}、赤が対峙する国。</p>
  <dl class="kv2"><dt>首都</dt><dd>${N.cap}</dd><dt>海軍</dt><dd>${N.n}${N.navy}</dd><dt>国柄</dt><dd><b class="am">${N.tr[0]}</b><br><span class="sm">${N.tr[1]}</span></dd>
  <dt>艦の名</dt><dd class="sm">${ex('cvl')}<br>${ex('ddg')}<br>${ex('dd')}<br>${ex('ss')}</dd><dt>人の名</dt><dd class="sm">${ppl}</dd><dt>階級</dt><dd class="sm">${RSTY[N.rk].rank.slice(3).join('・')}</dd>
  <dt>陸上部隊</dt><dd class="sm">${GTK.slice(0,4).map(k=>GT[k].n).join('、')} ほか</dd><dt>守る島</dt><dd class="sm">${[1,4,7].map((z,k)=>seaName(N,z)+'の'+N.isl[k]).join('、')}</dd><dt>海域</dt><dd class="sm">${[2,3,5,6].map(z=>seaName(N,z)).join('、')}</dd></dl>
  <h3 class="sub">装備</h3>${eqCards(N,natF(N))}
  <div class="srow"><label>対峙する国</label><select onchange="A.nriv(+this.value)" aria-label="対峙する国">${NATS.map((x,k)=>k===i?'':`<option value="${k}" ${k===rv?'selected':''}>${x.f}${k===N.rv?'(宿敵)':''}</option>`).join('')}</select></div>
  <div class="mbtn"><button class="btn pri" data-m="go">${N.n}で着任する(標準の設定)</button><button class="btn" data-m="k">カスタムスタート</button><button class="btn" data-m="nb">国の選択に戻る</button></div>`;}
  const out=tx(html);TXL=sv;const pick1=()=>({nat:i,riv:rv,nation:N.f,fleetName:D.hq});
  if(mq.length&&mq[0].nat){mq[0].html=html;mq[0].cbs.cur=pick1;}
  else{modal(html,{cur:pick1,go:()=>{const c=mq[0].cbs.cur();closeModal();begin(c);},k:()=>{const c=mq[0].cbs.cur();closeModal();ui.cs=Object.assign(ui.cs||JSON.parse(JSON.stringify(DEFCFG)),c);showSetup();},nb:()=>A.nback(),back:()=>{closeModal();showTitle();}});mq[mq.length-1].nat=1;}
  $('#mbox').innerHTML=out;drawMaps();}
function showSetup(){const c=ui.cs,f=c.fleet;
  const st=(k,lbl,step,min,max,unit)=>`<div class="srow"><label>${lbl}</label><div class="stp"><button onclick="A.cs('${k}',${-step},${min},${max})" aria-label="${lbl}を減らす">－</button><span>${c[k].toLocaleString()}${unit||''}</span><button onclick="A.cs('${k}',${step},${min},${max})" aria-label="${lbl}を増やす">＋</button></div></div>`;
  const fs=(k,lbl,step,max)=>`<div class="srow"><label>${lbl}</label><div class="stp"><button onclick="A.csf('${k}',${-step},${max})" aria-label="${lbl}を減らす">－</button><span>${f[k]||0}</span><button onclick="A.csf('${k}',${step},${max})" aria-label="${lbl}を増やす">＋</button></div></div>`;
  const sg2=(k,lbl,opts)=>`<div class="srow col"><label>${lbl}</label><div class="seg">${opts.map(o=>`<button class="${c[k]===o[0]?'on':''}" onclick="A.css('${k}',${o[0]})">${o[1]}</button>`).join('')}</div></div>`;
  let up=0,crew=0,val=0;for(const k of FLEETK){const n=f[k]||0;up+=PT[k].up*n;crew+=PT[k].crew*n;val+=PT[k].val*n;}
  const gs=(k,max)=>`<div class="srow"><label>${GT[k].n}</label><div class="stp"><button onclick="A.csg('${k}',-1,${max})" aria-label="${GT[k].n}を減らす">－</button><span>${c.gnd[k]||0}</span><button onclick="A.csg('${k}',1,${max})" aria-label="${GT[k].n}を増やす">＋</button></div></div>`;
  const html=`<div class="alert">カスタムスタート</div><h2>任期の条件を決める</h2><div class="brow">${PRESET.map((p,i)=>`<button class="btn sm" onclick="A.csp(${i})">${p[0]}</button>`).join('')}</div>
  <h3 class="sub">国</h3>
  <div class="srow"><label><i class="flag" style="${flagCSS(NATS[c.nat])}"></i> ${NATS[c.nat].n}</label><button class="btn sm" onclick="A.csnat()">国を選び直す</button></div>
  <p class="sm mut">対峙する国：${NATS[c.riv==null?NATS[c.nat].rv:c.riv].f}　国柄：${NATS[c.nat].tr[0]}</p>
  <h3 class="sub">名前</h3>
  <div class="srow"><label>司令官</label><input value="${esc(c.cmdr)}" placeholder="(任意)" oninput="ui.cs.cmdr=this.value" maxlength="16" aria-label="司令官の名前"></div>
  <div class="srow"><label>国名</label><input value="${esc(c.nation)}" oninput="ui.cs.nation=this.value" maxlength="12" aria-label="国名"></div>
  <div class="srow"><label>部隊名</label><input value="${esc(c.fleetName)}" oninput="ui.cs.fleetName=this.value" maxlength="16" aria-label="部隊名"></div>
  <h3 class="sub">期間と敵</h3>
  ${sg2('years','任期',[[5,'5年'],[10,'10年'],[20,'20年'],[30,'30年']])}${sg2('eGrow','敵の軍拡',[[.6,'緩やか'],[1,'標準'],[1.5,'急速'],[2,'苛烈']])}${sg2('eAggr','敵の攻撃性',[[.7,'慎重'],[1,'標準'],[1.4,'攻撃的']])}${sg2('incF','事案の頻度',[[.6,'少ない'],[1,'標準'],[1.6,'多い']])}
  <h3 class="sub">政治と予算</h3>
  ${st('budget','年間の防衛予算',400,2400,24000,' 億円')}${st('funds','手持ちの資金',200,0,30000,' 億円')}${st('tension','緊張度',5,5,85,'%')}${st('support','支持率',5,25,85,'%')}
  ${sg2('prePen','先制攻撃への非難',[[.5,'緩い'],[1,'標準'],[1.6,'厳しい']])}${sg2('sandbox','資金',[[false,'通常'],[true,'無制限']])}
  <h3 class="sub">艦隊</h3>
  ${fs('cv','多用途航空母艦',1,3)}${fs('cvl','航空護衛艦',1,4)}${fs('ddg','ミサイル護衛艦',1,8)}${fs('dd','汎用護衛艦',1,10)}${fs('ffm','多機能護衛艦',1,10)}${fs('ss','潜水艦',1,8)}${fs('lst','輸送艦',1,6)}${fs('opv','哨戒艦',1,8)}${fs('aoe','補給艦',1,3)}${fs('ftr','艦上戦闘機',2,60)}${fs('aew','早期警戒機',1,6)}
  <p class="sm mut">維持費 月${up}億円、乗員 ${crew.toLocaleString()}名、戦力値 ${val}(標準は 590)。空母に積みきれない機体は予備機になる。</p>
  <h3 class="sub">陸上部隊</h3>
  ${GTK.map(k=>gs(k,12)).join('')}
  <p class="sm mut">普通科・特科・高射・地対艦は3つの島に順に配置され、水陸機動と戦車は本土に置かれる。島へ運ぶには輸送艦が要る。</p>
  ${st('tr','初期の練度',5,35,90,'')}
  <h3 class="sub">技術と増援</h3>
  ${sg2('techLv','技術水準',[[0,'現行'],[1,'やや進む'],[2,'進む'],[3,'先進']])}${st('labs','研究所の数',1,1,8,'')}${sg2('reinT','増援の到着',[[60,'60分'],[90,'90分'],[120,'120分'],[150,'150分']])}
  <div class="mbtn"><button class="btn pri" data-m="go">この条件で着任する</button><button class="btn" data-m="back">戻る</button></div>`;
  if(mq.length&&mq[0].setup){const sc=$('#mbox').scrollTop;mq[0].html=html;$('#mbox').innerHTML=tx(html);$('#mbox').scrollTop=sc;}
  else{modal(html,{go:()=>{closeModal();begin(ui.cs);},back:()=>{closeModal();showNation();}});mq[mq.length-1].setup=1;}}
