/* ================= 司令部の画面 ================= */
const bar=(v,c)=>`<i class="bar"><b class="${c||''}" style="width:${clamp(v,0,100)}%"></b></i>`;
const seg=(vals,cur,fn)=>`<div class="seg">${vals.map(v=>`<button class="${v[0]===cur?'on':''}" onclick="${fn(v[0])}">${v[1]}</button>`).join('')}</div>`;
const subtabs=(tab,list)=>`<div class="sub">${list.map(x=>`<button class="${ui.sub[tab]===x[0]?'on':''}" onclick="A.sub('${tab}','${x[0]}')">${x[1]}</button>`).join('')}</div>`;
const oname=o=>o?`${o.name} ${RANK[o.rank]}`:'<span class="am">欠員</span>';
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const PD={co:'艦の戦闘効率、電子戦、警告',xo:'練度の伸び',we:'SAM命中率と対艦ミサイルの突破力',op:'探知距離と反応速度',en:'速力、整備度、被害の軽減',as:'対潜攻撃とソナー',ai:'発着艦と戦闘機'};
function alerts(){const a=[],pm=postMap();
  if(S.fore&&S.foreK)a.push([`情報：来月、${SECT[S.fore.sector]}で${SCN[S.fore.type].n}の兆候がある`,'am']);
  if(!S.units.some(u=>u.sector>0))a.push(['展開中の部隊がない。事案には母港からの増援だけで当たることになる','am']);
  for(let i=1;i<=3;i++){const s=S.sectors[i],here=S.units.some(u=>u.sector===i);if(!s.held)a.push([`${ISL[i]}が占領下にある。「概況」から奪還作戦を発動できる`,'r']);else if(thr(i).v>=55&&!here)a.push([`${SECT[i]}：敵の活動が活発だが、展開部隊がない`,'am']);}
  const low=S.units.filter(u=>u.rd<40&&u.mode!=='dock');if(low.length)a.push([`整備度が低い：${low.map(u=>u.name).join('、')}`,'am']);
  const dm=S.units.filter(u=>u.hp<70&&u.mode!=='dock');if(dm.length)a.push([`損傷艦：${dm.map(u=>u.name).join('、')}(ドック整備で修理)`,'r']);
  if(S.units.some(u=>{const c=cap(u);return Object.keys(c).some(k=>(u.load[k]||0)<c[k]);}))a.push(['弾薬が定数に足りない艦がある。「調達」で補充を','am']);
  if(fill()<.9)a.push([`曹士の充足率 ${Math.round(fill()*100)}%`,'am']);
  const vac=allPosts().filter(p=>!pm[p.id]).length;if(vac)a.push([`欠員のポストが ${vac} ある(人事の「補職」)`,'am']);
  if(S.labs.some(l=>!l.cur&&!l.auto))a.push(['課題が決まっていない研究所がある','am']);
  if(Object.keys(S.projs).some(k=>S.projs[k].wait))a.push(['資金不足で止まっている開発計画がある','am']);
  if(S.funds<0)a.push(['資金が赤字。続くと支持率が下がる','r']);
  return a;}
function mapSVG(){const pos=[null,[176,34],[204,92],[164,150]];
  let s=`<svg viewBox="0 0 320 180" class="smap" role="img" aria-label="作戦海域の略図"><rect width="320" height="180" fill="#081a2a"/><path d="M0,58 Q62,40 92,84 T72,180 L0,180Z" fill="#2c4a37" stroke="#5c8c6b"/><text x="12" y="128" class="t1">本土</text><text x="12" y="143" class="t2">母港 ${S.units.filter(u=>u.sector===0).length}隻</text>`;
  for(let i=1;i<=3;i++){const sec=S.sectors[i],x=pos[i][0],y=pos[i][1],lv=thr(i),n=S.units.filter(u=>u.sector===i).length,col=!sec.held||lv.c==='r'?'#ff6b5e':lv.c==='am'?'#f2b54a':'#63dba0';
    s+=`<circle cx="${x}" cy="${y}" r="26" fill="${col}" fill-opacity=".1" stroke="${col}" stroke-opacity=".6" stroke-dasharray="3 3"/><circle cx="${x}" cy="${y}" r="4" fill="${sec.held?'#5c8c6b':'#a8584e'}"/><text x="${x+34}" y="${y-3}" class="t1">${SECT[i]}</text><text x="${x+34}" y="${y+11}" class="t2">${sec.held?'敵活動 '+lv.t:'占領下'}／${n}隻</text>`;}
  return s+'</svg>';}
const VIEW={};
VIEW.home=()=>{const inc=income(),cost=Math.round(monthCost()),al=alerts(),C=S.cfg;
  let h=`<section class="sec"><h2>海域情勢</h2><div class="sgrid">`;
  for(let i=1;i<=3;i++){const s=S.sectors[i],lv=thr(i),us=S.units.filter(u=>u.sector===i);
    h+=`<div class="sbox ${s.held?'':'occ'}"><b>${SECT[i]}</b><span class="${s.held?lv.c:'r'}">${s.held?'敵活動 '+lv.t:ISL[i]+' 占領下'}</span>${bar(s.held?lv.v:100,s.held?lv.c:'r')}<small>${us.length?us.map(u=>u.name).join('・'):'展開なし'}</small>${!s.held?`<button class="btn sm warn" onclick="A.retake(${i})">奪還作戦を発動</button>`:''}</div>`;}
  h+=`</div></section>`;
  if(al.length)h+=`<section class="sec"><h2>要対処</h2>${al.map(a=>`<p class="al ${a[1]}">${a[0]}</p>`).join('')}</section>`;
  h+=`<section class="sec"><h2>今月の見通し</h2><dl class="kv"><dt>防衛予算(月割)</dt><dd class="g">+${inc} 億円</dd><dt>維持費と各種経費</dt><dd>−${cost} 億円</dd><dt>差引</dt><dd class="${inc-cost<0?'r':'g'}">${sg(inc-cost)} 億円</dd><dt>抑止力(我／敵)</dt><dd>${Math.round(fleetPower())}／${enemyPower()}</dd><dt>技術の蓄積</dt><dd>${totalLv()}段階</dd><dt>戦績</dt><dd>${S.stats.wins}勝 ${S.stats.loss}敗(うち無血 ${S.stats.blood0})</dd><dt>任期</dt><dd>${Math.floor(S.month/12)+1}年目／全${C.years}年</dd></dl></section>`;
  h+=`<section class="sec"><h2>記録</h2>${S.log.length?S.log.slice(0,12).map(l=>`<p class="lg ${l.c}"><span>${dateStr(l.m)}</span>${l.msg}</p>`).join(''):'<p class="mut sm">まだ記録はない</p>'}</section>`;
  h+=`<section class="sec"><div class="brow"><button class="btn sm" onclick="A.drill()">図上演習(戦闘の練習)</button><button class="btn sm" onclick="A.help()">遊び方</button><button class="btn sm" onclick="A.reset()">新しく始める</button></div></section>`;
  return h;};
VIEW.deploy=()=>{let h=`<section class="sec"><h2>作戦海域</h2>${mapSVG()}<p class="mut sm">事案は敵の活動が活発な海域ほど起きやすい。展開した艦は最初から現場にいて、兵力が大きいほどその海域の敵活動を抑え込む。ただし毎月、整備度が下がる。母港の艦はどの海域にも増援に出られるが、到着は戦闘開始の${reinTime()}分後になる。</p></section><section class="sec"><h2>部隊の配置</h2>`;
  for(const u of S.units){const lock=u.mode!=='normal';
    h+=`<div class="drow"><div><span class="tag">${PT[u.type].s}</span> ${u.name}${lock?` <small class="am">${u.refit?'改修中':u.mode==='dock'?'整備中':'演習中'}</small>`:''}</div><div class="seg">${SECT.map((n,i)=>`<button class="${u.sector===i?'on':''}" ${lock&&i>0?'disabled':''} onclick="A.sector(${u.id},${i})">${n.replace('海域','')}</button>`).join('')}</div></div>`;}
  return h+'</section>';};
VIEW.units=()=>{const st=S.stock,pm=postMap();
  let h=`<section class="sec"><h2>在庫</h2><dl class="kv"><dt>艦対空ミサイル</dt><dd>${st.sam}</dd><dt>対艦ミサイル</dt><dd>${st.asm}</dd><dt>空対空ミサイル</dt><dd>${st.aam}</dd><dt>魚雷・対潜弾</dt><dd>${st.torp}</dd><dt>予備機(戦闘機／早期警戒機)</dt><dd>${S.pool.ftr}／${S.pool.aew}</dd></dl><p class="mut sm">弾薬は月が替わるときに在庫から各艦へ自動で補給される。</p></section><section class="sec"><h2>艦艇 ${S.units.length}隻</h2>`;
  for(const u of S.units){const t=PT[u.type],c=cap(u),ps=shipPosts(u),vac=ps.filter(p=>!pm[u.id+':'+p[0]]).length;
    h+=`<div class="unit ${u.sector>0?'away':''}"><div class="uh"><span class="tag">${t.s}</span><b>${u.name}</b><small>${t.n}</small><span class="loc">${u.refit?`改修中 あと${u.refit.left}か月`:u.mode==='dock'?'ドック整備中':u.mode==='drill'?'演習中':SECT[u.sector]}</span></div>
      <div class="st3"><div><label>練度 ${Math.round(u.tr)}</label>${bar(u.tr,'b')}</div><div><label>整備度 ${Math.round(u.rd)}</label>${bar(u.rd,u.rd<40?'r':u.rd<60?'am':'g')}</div><div><label>船体 ${Math.round(u.hp)}%</label>${bar(u.hp,u.hp<50?'r':u.hp<80?'am':'g')}</div></div>
      <div class="amm">${Object.keys(c).filter(k=>c[k]).map(k=>`<span class="${(u.load[k]||0)<c[k]?'am':''}">${AMN[k]} ${u.load[k]||0}/${c[k]}</span>`).join('')}<span class="mut">戦闘効率 ${Math.round(unitQ(u)*100)}%</span></div>
      ${t.fcap?`<div class="urow"><label>搭載機</label><span>戦闘機 ${u.ftr}/${ftrCap(u)}</span><button class="mini" onclick="A.air(${u.id},'ftr',1)" aria-label="戦闘機を積む">＋</button><button class="mini" onclick="A.air(${u.id},'ftr',-1)" aria-label="戦闘機を降ろす">－</button><span>警戒機 ${u.aew}/${aewCap(u)}</span><button class="mini" onclick="A.air(${u.id},'aew',1)" aria-label="警戒機を積む">＋</button><button class="mini" onclick="A.air(${u.id},'aew',-1)" aria-label="警戒機を降ろす">－</button></div>`:''}
      ${ps.length?`<div class="urow"><label>幹部</label><span class="grow sm">艦長 ${oname(pm[u.id+':co'])}${vac?`　<span class="am">欠員${vac}</span>`:''}</span><button class="btn sm" onclick="A.gopost(${u.id})">補職</button></div>`:''}
      <div class="urow"><label>改修</label><span class="grow sm">${u.mods.length?u.mods.map(k=>KIT[k].n).join('、'):'なし'}</span><button class="btn sm" onclick="A.kit(${u.id})">改修・除籍</button></div>
      <div class="urow"><label>運用</label><div class="seg">${['normal','drill','dock'].map((m,i)=>`<button class="${u.mode===m?'on':''}" ${u.refit?'disabled':''} onclick="A.mode(${u.id},'${m}')">${['通常','演習','ドック整備'][i]}</button>`).join('')}</div></div></div>`;}
  return h+`<p class="mut sm">演習は練度が大きく伸びるが整備度が下がり、月8億円かかる。ドック整備は整備度と船体を回復する。どちらも母港で行う。</p></section>`;};
VIEW.shop=()=>{
  let h=`<section class="sec"><h2>発注中</h2>${S.orders.length?S.orders.map(o=>`<div class="drow"><div style="flex:1">${o.n}</div><div class="mut">あと ${o.due-S.month} か月</div></div>`).join(''):'<p class="mut sm">発注中のものはない</p>'}</section><section class="sec"><h2>調達</h2><p class="mut sm">400億円以上のものは、一括払いか分割払いかを選べる。艦は母港で就役する。</p>`;
  const item=(k,n,d)=>{const c=price(k);return `<div class="item"><div class="uh"><b>${n}</b><span class="loc">${c.toLocaleString()}億円／${buildMo(k)}か月</span></div><p class="sm mut">${d}</p><button class="btn sm" ${canPay(c)||c>=400?'':'disabled'} onclick="A.buy('${k}')">発注する</button></div>`;};
  h+='<h3 class="sub">艦艇</h3>';const locked=[];
  for(const k of SHIPK){const t=PT[k];if(t.lock&&!S.unlock[k]){locked.push(t.n);continue;}h+=item(k,t.n,`${t.d}。乗員${t.crew}名、維持費は月${t.up}億円`);}
  if(locked.length)h+=`<p class="sm mut">開発計画を終えると調達できる：${locked.join('、')}</p>`;
  h+='<h3 class="sub">航空機</h3>';for(const k of['ftr','aew'])h+=item(k,SHOPX[k].n,SHOPX[k].d);
  h+='<h3 class="sub">弾薬</h3>';for(const k of['sam','asm','aam','torp'])h+=item(k,SHOPX[k].n,SHOPX[k].d+`(在庫 ${S.stock[k]})`);
  return h+'</section>';};
function render(){if(!S)return;
  $('#date').textContent=dateStr(S.month)+'　'+(Math.floor(S.month/12)+1)+'年目';
  const gf=$('#gf');gf.textContent=S.cfg.sandbox?'無制限':Math.round(S.funds).toLocaleString()+' 億円';gf.className=S.funds<0?'r':'';
  $('#gs').textContent=Math.round(S.support)+'%';const sb=$('#gsb');sb.style.width=S.support+'%';sb.className=S.support<25?'r':S.support<45?'am':'g';
  $('#gt').textContent=Math.round(S.tension)+'%';const tb=$('#gtb');tb.style.width=S.tension+'%';tb.className=S.tension>=65?'r':S.tension>=40?'am':'g';
  document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.t===ui.tab));
  $('#view').innerHTML=VIEW[ui.tab]();$('#next').disabled=!!S.over;}

/* ---------- モーダル・トースト ---------- */
const mq=[];
function showM(){$('#mbox').innerHTML=mq[0].html;$('#modal').hidden=false;$('#mbox').scrollTop=0;}
function modal(html,cbs){mq.push({html,cbs:cbs||{}});if(mq.length===1)showM();}
function closeModal(){mq.shift();if(mq.length)showM();else $('#modal').hidden=true;}
function confirmM(text,yes,yl,no){modal(`<p>${text}</p><div class="mbtn"><button class="btn pri" data-m="y">${yl||'実行する'}</button><button class="btn" data-m="n">やめる</button></div>`,{y:()=>{closeModal();yes();},n:()=>{closeModal();if(no)no();}});}
function toast(msg){const t=$('#toast');t.textContent=msg;t.className='show';clearTimeout(toast.h);toast.h=setTimeout(()=>{t.className='';},2600);}
function showIncident(){const inc=S.pending;if(!inc)return;const us=S.units.filter(u=>u.sector===inc.sector&&u.mode==='normal'),rn=reserve(),rt=inc.type==='retake',can=us.length||rn.length;
  modal(`<div class="alert r">${rt?'作戦計画':'事案発生'}</div><h2>${SECT[inc.sector]}　${SCN[inc.type].n}</h2><p>${SCN[inc.type].d(inc)}</p><dl class="kv2"><dt>敵情(推定)</dt><dd>${inc.intel}</dd><dt>現場の兵力</dt><dd>${us.length?us.map(u=>u.name).join('、'):'<b class="r">展開部隊なし</b>'}</dd><dt>母港からの増援</dt><dd>${rn.length?rn.map(u=>u.name).join('、')+`<br><span class="mut sm">戦闘開始の${reinTime()}分後に、海域の南西へ到着する</span>`:'なし'}</dd></dl><div class="mbtn">${can?`<button class="btn pri" data-m="fight">出撃し、自ら指揮を執る</button><button class="btn" data-m="auto">現場指揮官に任せる(自動解決)</button>`:''}<button class="btn" data-m="ignore">${rt?'作戦を中止する':can?'静観する':'対処できない(静観)'}</button></div>`,
  {fight:()=>{closeModal();if(can)startBattle(inc);else ignoreInc(inc);},auto:()=>{closeModal();if(can)autoResolve(inc);else ignoreInc(inc);},ignore:()=>{closeModal();if(rt){S.pending=null;save();render();}else ignoreInc(inc);}});}
function showOver(){const o=S.over,occ=[1,2,3].filter(i=>!S.sectors[i].held).length,st=S.stats;
  const score=st.wins*100+st.blood0*80+Math.round(S.support)*5-st.pSunk*60-occ*250+Math.min(S.month,60)*10+totalLv()+(o.k==='peace'?800:0);
  const rank=score>=2000?'S':score>=1400?'A':score>=900?'B':score>=400?'C':'D';
  modal(`<div class="alert ${o.k==='lost'||o.k==='fired'?'r':'g'}">${dateStr(S.month)}</div><h2>${o.t}</h2><p>${o.d}</p><dl class="kv2"><dt>戦績</dt><dd>${st.wins}勝 ${st.loss}敗(無血 ${st.blood0})</dd><dt>撃沈／喪失</dt><dd>${st.eSunk}隻／${st.pSunk}隻</dd><dt>確保した島</dt><dd>${3-occ}／3</dd><dt>技術の蓄積</dt><dd>${totalLv()}段階</dd><dt>最終支持率</dt><dd>${Math.round(S.support)}%</dd><dt>評価</dt><dd><b class="am">${rank}</b>(${score}点)</dd></dl><div class="mbtn"><button class="btn pri" data-m="new">新しい任期を始める</button><button class="btn" data-m="ok">記録を眺める</button></div>`,
  {new:()=>{closeModal();showTitle();}});}
function showHelp(){const C=S.cfg;modal(`<div class="alert">着任</div><h2>${esc(C.fleetName)}司令部</h2><p>${C.cmdr?esc(C.cmdr)+'司令。':''}あなたは${esc(C.nation)}海上防衛軍の艦隊を預かる。任期の${C.years}年間、3つの島嶼を守り抜く。支持率が0%になれば更迭される。</p>
<ul class="sm"><li><b>配置・部隊</b>：艦を海域に出し、演習・整備・改修を回す</li><li><b>人事</b>：幹部を艦と司令部のポストに就け、曹士の職種ごとの充足を保つ。任せきりにもできる</li><li><b>開発</b>：研究所ごとに課題を進め、技術が揃えば新しい艦や装備の開発計画に着手できる</li><li><b>予算</b>：64の費目に配分し、年度替わりには増額を折衝する</li><li><b>翌月へ進む</b>で時間が進み、事案が起きれば戦闘になる</li></ul>
<p><b>戦闘の操作</b></p><ul class="sm"><li>自部隊をタップで選択、海面をタップで移動、敵をタップで目標に指定</li><li>右下の「3D」で立体表示に切り替えられる。ドラッグで視点を回し、2本指で拡大と移動</li><li>海面すれすれのミサイルは艦のレーダーでは30〜45kmまで見えない。早期警戒機と戦闘機を前に出すと早く見つかる</li><li>敵が撃つか領海に居座るまで、武器は使えない。艦を相手の50km以内に寄せて「警告」し、退去させれば最良の結果になる</li></ul>
<div class="mbtn"><button class="btn pri" data-m="ok">任務に就く</button></div>`);}
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
  modal(`<div class="alert">機動護衛群司令部</div><h2 class="big">蒼海の盾</h2><p class="sm">現代の海で、艦隊の指揮と運営を担う。撃たせず、撃たずに守り抜けるか。</p>${has?'<p class="sm mut">新しく始めると、いまの記録は上書きされる。</p>':''}<div class="mbtn">${has?`<button class="btn pri" data-m="c">続きから</button>`:''}<button class="btn ${has?'':'pri'}" data-m="s">標準の設定で始める</button><button class="btn" data-m="k">カスタムスタート</button></div>`,
  {c:()=>{closeModal();S=load();_M=null;_PM=null;render();if(S.over)showOver();else if(S.pending)showIncident();},s:()=>{closeModal();begin({});},k:()=>{closeModal();ui.cs=JSON.parse(JSON.stringify(DEFCFG));showSetup();}});}
function showSetup(){const c=ui.cs,f=c.fleet;
  const st=(k,lbl,step,min,max,unit)=>`<div class="srow"><label>${lbl}</label><div class="stp"><button onclick="A.cs('${k}',${-step},${min},${max})" aria-label="${lbl}を減らす">－</button><span>${c[k].toLocaleString()}${unit||''}</span><button onclick="A.cs('${k}',${step},${min},${max})" aria-label="${lbl}を増やす">＋</button></div></div>`;
  const fs=(k,lbl,step,max)=>`<div class="srow"><label>${lbl}</label><div class="stp"><button onclick="A.csf('${k}',${-step},${max})" aria-label="${lbl}を減らす">－</button><span>${f[k]||0}</span><button onclick="A.csf('${k}',${step},${max})" aria-label="${lbl}を増やす">＋</button></div></div>`;
  const sg2=(k,lbl,opts)=>`<div class="srow col"><label>${lbl}</label><div class="seg">${opts.map(o=>`<button class="${c[k]===o[0]?'on':''}" onclick="A.css('${k}',${o[0]})">${o[1]}</button>`).join('')}</div></div>`;
  let up=0,crew=0,val=0;for(const k of['cv','cvl','ddg','dd','ffm','ss','opv','aoe']){const n=f[k]||0;up+=PT[k].up*n;crew+=PT[k].crew*n;val+=PT[k].val*n;}
  const html=`<div class="alert">カスタムスタート</div><h2>任期の条件を決める</h2><div class="brow">${PRESET.map((p,i)=>`<button class="btn sm" onclick="A.csp(${i})">${p[0]}</button>`).join('')}</div>
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
  ${fs('cv','多用途航空母艦',1,3)}${fs('cvl','航空護衛艦',1,4)}${fs('ddg','ミサイル護衛艦',1,8)}${fs('dd','汎用護衛艦',1,10)}${fs('ffm','多機能護衛艦',1,10)}${fs('ss','潜水艦',1,8)}${fs('opv','哨戒艦',1,8)}${fs('aoe','補給艦',1,3)}${fs('ftr','艦上戦闘機',2,60)}${fs('aew','早期警戒機',1,6)}
  <p class="sm mut">維持費 月${up}億円、乗員 ${crew.toLocaleString()}名、戦力値 ${val}(標準は 590)。空母に積みきれない機体は予備機になる。</p>
  ${st('tr','初期の練度',5,35,90,'')}
  <h3 class="sub">技術と増援</h3>
  ${sg2('techLv','技術水準',[[0,'現行'],[1,'やや進む'],[2,'進む'],[3,'先進']])}${st('labs','研究所の数',1,1,8,'')}${sg2('reinT','増援の到着',[[60,'60分'],[90,'90分'],[120,'120分'],[150,'150分']])}
  <div class="mbtn"><button class="btn pri" data-m="go">この条件で着任する</button><button class="btn" data-m="back">戻る</button></div>`;
  if(mq.length&&mq[0].setup){const sc=$('#mbox').scrollTop;mq[0].html=html;$('#mbox').innerHTML=html;$('#mbox').scrollTop=sc;}
  else{modal(html,{go:()=>{closeModal();begin(ui.cs);},back:()=>{closeModal();showTitle();}});mq[mq.length-1].setup=1;}}
