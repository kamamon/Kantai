/* ================= 作戦図と部隊の画面 ================= */
function alerts(){const a=[],pm=postMap();
  for(const e of S.efl)if(e.known)a.push([`敵の揚陸部隊が${ISL[e.z]}を狙っている。到達まであと${e.eta}か月`,'r']);
  if(S.fore&&S.foreK)a.push([`情報：来月、${SECT[S.fore.sector]}で${SCN[S.fore.type].n}の兆候がある`,'am']);
  for(const i of ISLZ){const s=S.sectors[i],here=fightIn(i).length;
    if(!s.held){a.push([`${ISL[i]}が占領下にある。「作戦」の作戦図から奪還に動ける`,'r']);continue;}
    if(!here&&!reserve(i).all.length)a.push([`${SECT[i]}：艦隊がおらず、駆けつけられる増援もない`,'r']);else if(thr(i).v>=55&&!here)a.push([`${SECT[i]}：敵の活動が活発だが、所在の艦隊がない`,'am']);
    if(!garrison(i).length)a.push([`${ISL[i]}に守備隊がいない。上陸されれば無抵抗で占領される`,'am']);}
  const ln=ZONES.map((Z,i)=>Z.lane&&thr(i).v>=60&&!inZone(i).length?Z.n:null).filter(Boolean);if(ln.length)a.push([`シーレーンが脅かされている：${ln.join('、')}`,'am']);
  const low=S.units.filter(u=>u.rd<40&&u.mode!=='dock');if(low.length)a.push([`整備度が低い：${low.map(u=>u.name).join('、')}`,'am']);
  const dm=S.units.filter(u=>u.hp<70&&u.mode!=='dock');if(dm.length)a.push([`損傷艦：${dm.map(u=>u.name).join('、')}(ドック整備で修理)`,'r']);
  if(S.units.some(u=>{const c=cap(u);return Object.keys(c).some(k=>(u.load[k]||0)<c[k]);}))a.push(['弾薬が定数に足りない艦がある。「調達」で補充を','am']);
  if(fill()<.9)a.push([`曹士の充足率 ${Math.round(fill()*100)}%`,'am']);
  const vac=allPosts().filter(p=>!pm[p.id]).length;if(vac)a.push([`欠員のポストが ${vac} ある(人事の「補職」)`,'am']);
  if(S.labs.some(l=>!l.cur&&!l.auto))a.push(['課題が決まっていない研究所がある','am']);
  if(Object.keys(S.projs).some(k=>S.projs[k].wait))a.push(['資金不足で止まっている開発計画がある','am']);
  if(S.funds<0)a.push(['資金が赤字。続くと支持率が下がる','r']);
  return a;}
function thrCol(i){const s=S.sectors[i],lv=thr(i);return !s.held||lv.c==='r'?'#ff6b5e':lv.c==='am'?'#f2b54a':'#63dba0';}
const gLoc=g=>g.loc==='home'?'本土':g.loc[0]==='i'?ISL[+g.loc.slice(1)]:(FL(+g.loc.slice(1))||{n:'艦隊'}).n+'に乗船';
function gRow(g,act){const t=GT[g.type];return `<div class="unit ${g.loc==='home'?'':'away'}"><div class="uh"><span class="tag">${t.s}</span><b>${g.name}</b><span class="loc">${esc(gLoc(g))}</span></div>
  <div class="st3"><div><label>戦力 ${g.hp}/10</label>${bar(g.hp*10,g.hp<4?'r':g.hp<7?'am':'g')}</div><div><label>練度 ${Math.round(g.tr)}</label>${bar(g.tr,'b')}</div><div><label>攻${t.atk} 防${t.def} 移${t.mv}${t.rng>1?' 射'+t.rng:''}</label></div></div>${act||''}</div>`;}
function zonePanel(z){const Z=ZONES[z],s=S.sectors[z],il=S.isl[z],here=inZone(z),fl=S.fleets.filter(f=>f.zone===z);
  let h=`<section class="sec zp"><h2>${Z.n}${il?'　'+Z.isl:''}</h2>`;
  if(Z.enemy){const es=S.efl.filter(e=>e.known&&EBASE[e.z]===z);
    return h+`<p class="sm">${RIV.f}の泊地。艦隊を踏み込ませることはできない。侵攻部隊はここに集結してから島へ向かう。</p>${es.map(e=>`<p class="al r">揚陸部隊が${e.eta>=2?'集結している':'出撃した'}。目標は${ISL[e.z]}、到達まであと${e.eta}か月</p>`).join('')||'<p class="sm mut">目立った動きは確認されていない。</p>'}</section>`;}
  const rs=reserve(z);h+='<dl class="kv2">';
  if(Z.home)h+='<dt>役割</dt><dd>母港と本土。ここにいる艦は整備度が回復する。演習とドック整備、陸上部隊の編成もここで行う</dd>';
  else if(Z.lane)h+=`<dt>航路の脅威</dt><dd class="${thr(z).c}">${thr(z).t}${thr(z).v>=60&&!here.length?'。通商妨害で毎月の収入と支持が削られている':''}</dd>`;
  else h+=`<dt>${s.held?'敵の活動':'状況'}</dt><dd class="${s.held?thr(z).c:'r'}">${s.held?thr(z).t:Z.isl+'は占領下'}</dd>`;
  h+=`<dt>所在の艦隊</dt><dd>${fl.length?fl.map(f=>esc(f.n)).join('、'):'なし'}${here.length?`<br><span class="mut sm">${here.length}隻、戦力 ${Math.round(fleetPower(here))}</span>`:''}</dd>`;
  if(!Z.home)h+=`<dt>増援に来られる艦</dt><dd>隣の海域 ${rs.near.length}隻、2つ先 ${rs.far.length}隻</dd>`;
  h+='</dl>';
  if(il&&s.held){const gar=garrison(z);
    h+=`<h3 class="sub">施設</h3><div class="facs">${Object.keys(FAC).map(k=>`<div class="${il.fac[k]<50?'dm':''}"><b>${FAC[k][0]}</b>${il.fac[k]<50?' <span class="r">損壊</span>':''}<small>${FACD[k]}</small></div>`).join('')}</div>
    <h3 class="sub">守備隊 ${gar.length}個</h3>${gar.length?gar.map(g=>gRow(g)).join(''):'<p class="al am">守備隊がいない。上陸されれば無抵抗で占領される。「部隊」の陸上部隊を輸送艦に乗せて運ぶこと。</p>'}`;}
  else if(il){const ctrl=seaCtrl(z),emb=landForce(z),str=e=>e.hp>=8?'充足':e.hp>=5?'消耗':'壊滅寸前';
    h+=`<h3 class="sub">敵の守備隊(推定)</h3><p class="sm">${il.egar.map(e=>`${GT[e.t].n}<span class="mut">(${str(e)})</span>`).join('、')}</p>
    <dl class="kv2"><dt>陣地</dt><dd>${FORT[il.fort]}</dd><dt>周辺の敵艦隊</dt><dd class="${il.cover?'r':'g'}">${il.cover?'居座っている':'排除済み'}</dd><dt>制海</dt><dd>${ctrl?'<span class="g">確保</span>。敵守備隊の補給を断っている':il.cover?'未確保':'未確保。この海域に戦闘艦を置くこと'}</dd><dt>上陸部隊</dt><dd>${emb.length?emb.map(g=>g.name+(g.loc==='home'?'(空挺降下)':'')).join('、'):'この海域の艦隊には乗っていない'}</dd></dl>
    <p class="sm mut">奪還の手順：①周辺の敵艦隊を排除して制海を得る　②艦砲射撃・空爆・ミサイルで守備隊と陣地を叩く(月に各1回)　③輸送艦に乗せた陸上部隊で上陸し、司令部を制圧する。制海を保つあいだは、封鎖で敵が毎月弱っていく。</p>
    <div class="brow"><button class="btn sm warn" ${il.cover?'':'disabled'} onclick="A.retake(${z})">①敵艦隊を排除</button><button class="btn sm" ${ctrl?'':'disabled'} onclick="A.prep(${z})">②準備攻撃</button><button class="btn sm pri" ${ctrl&&emb.length?'':'disabled'} onclick="A.land(${z})">③上陸作戦</button></div>`;}
  return h+'</section>';}
VIEW.home=()=>{const inc=income(),cost=Math.round(monthCost()),al=alerts(),C=S.cfg;
  let h=`<section class="sec"><h2>島嶼の情勢</h2><div class="sgrid">`;
  for(const i of ISLZ){const s=S.sectors[i],lv=thr(i),fl=S.fleets.filter(f=>f.zone===i),gn=garrison(i).length;
    h+=`<div class="sbox ${s.held?'':'occ'}" onclick="A.goz(${i})"><b>${ISL[i]}</b><span class="${s.held?lv.c:'r'}">${s.held?'敵活動 '+lv.t:'占領下'}</span>${bar(s.held?lv.v:100,s.held?lv.c:'r')}<small>${SECT[i]}<br>${fl.length?fl.map(f=>esc(f.n)).join('・'):'艦隊なし'}<br>守備隊 ${s.held?gn+'個':'―'}</small></div>`;}
  h+=`</div><p class="mut sm">島をタップすると作戦図が開く。</p></section>`;
  if(al.length)h+=`<section class="sec"><h2>要対処</h2>${al.map(a=>`<p class="al ${a[1]}">${a[0]}</p>`).join('')}</section>`;
  h+=`<section class="sec"><h2>今月の見通し</h2><dl class="kv"><dt>防衛予算(月割)</dt><dd class="g">+${inc} 億円</dd><dt>維持費と各種経費</dt><dd>−${cost} 億円</dd><dt>差引</dt><dd class="${inc-cost<0?'r':'g'}">${sg(inc-cost)} 億円</dd><dt>国</dt><dd><i class="flag" style="${flagCSS(NAT)}"></i> ${esc(C.nation)}</dd><dt>対峙する国</dt><dd>${RIV.f}</dd><dt>国柄</dt><dd>${NAT.tr[0]}<br><span class="sm mut">${NAT.tr[1]}</span></dd><dt>抑止力(我／敵)</dt><dd>${Math.round(fleetPower())}／${enemyPower()}</dd><dt>陸上部隊</dt><dd>${S.gnd.length}個</dd><dt>技術の蓄積</dt><dd>${totalLv()}段階</dd><dt>戦績</dt><dd>${S.stats.wins}勝 ${S.stats.loss}敗(うち無血 ${S.stats.blood0})</dd><dt>任期</dt><dd>${Math.floor(S.month/12)+1}年目／全${C.years}年</dd></dl></section>`;
  h+=`<section class="sec"><h2>記録</h2>${S.log.length?S.log.slice(0,12).map(l=>`<p class="lg ${l.c}"><span>${dateStr(l.m)}</span>${l.msg}</p>`).join(''):'<p class="mut sm">まだ記録はない</p>'}</section>`;
  h+=`<section class="sec"><div class="brow"><button class="btn sm" onclick="A.drill()">図上演習(海戦)</button><button class="btn sm" onclick="A.gdrill()">図上演習(上陸戦)</button><button class="btn sm" onclick="A.edit()">編集</button><button class="btn sm" onclick="A.help()">遊び方</button><button class="btn sm" onclick="A.reset()">新しく始める</button></div></section>`;
  return h;};
VIEW.deploy=()=>{const fsel=ui.fsel!=null?FL(ui.fsel):null,T=reinTime();
  let h=`<section class="sec"><h2>作戦図</h2>${fsel?`<p class="al am">${esc(fsel.n)}の行き先を選ぶ。作戦図の海域をタップ</p>`:''}${mapBox('th')}<div class="brow"><button class="btn sm" onclick="A.world()">世界地図を見る</button></div><p class="mut sm">艦隊は1か月に2海域ぶん進む。事案にはその海域の艦隊が当たり、隣の海域の艦は${T}分後、2つ先の海域の艦は${T*2}分後に増援として着く。海域をタップすると詳細、艦隊の番号をタップすると行き先を選べる。</p></section>`;
  if(ui.zsel!=null)h+=zonePanel(ui.zsel);
  h+=`<section class="sec"><h2>艦隊</h2>`;
  S.fleets.forEach((f,k)=>{const us=flUnits(f),cp=fleetCap(f),ld=fleetLoad(f),mv=f.dest!=null;
    h+=`<div class="unit ${f.zone>0?'away':''}"><div class="uh"><span class="fb">${k+1}</span><b>${esc(f.n)}</b><span class="loc">${SECT[f.zone]}${mv?` → ${ZS[f.dest]}(あと${Math.ceil(HOP[f.zone][f.dest]/2)}か月)`:''}</span></div>
      <p class="sm mut">${us.length?us.map(u=>PT[u.type].s+' '+u.name+(u.tz>0?'(合流中)':u.mode!=='normal'?'(母港)':'')).join('、'):'所属艦なし'}<br>戦力 ${Math.round(fleetPower(us.filter(u=>u.sector===f.zone)))}${cp||ld.length?`　輸送 ${ld.length}/${cp}個`:''}</p>
      <div class="zb">${[0,1,2,3,4,5,6,7].map(z=>`<button class="${f.zone===z&&!mv?'on':f.dest===z?'dst':''}" onclick="A.fdest(${f.id},${z})">${ZS[z]}</button>`).join('')}</div></div>`;});
  const free=S.units.filter(u=>!u.fl);
  h+=`${S.fleets.length?'':'<p class="mut sm">艦隊がない。「部隊」の艦隊編成で編成する。</p>'}${free.length?`<p class="sm mut">母港で待機中(無所属)：${free.map(u=>u.name).join('、')}</p>`:''}<div class="brow"><button class="btn sm" onclick="A.sub('units','fleets');A.tab('units')">艦隊の編成を変える</button></div></section>`;
  return h;};
const UV={};
UV.ships=()=>{const st=S.stock,pm=postMap();
  let h=`<section class="sec"><h2>在庫</h2><dl class="kv"><dt>艦対空ミサイル「${eqName('sam')}」</dt><dd>${st.sam}</dd><dt>対艦ミサイル「${eqName('asm')}」</dt><dd>${st.asm}</dd><dt>空対空ミサイル「${eqName('aam')}」</dt><dd>${st.aam}</dd><dt>長魚雷「${eqName('torp')}」・対潜弾</dt><dd>${st.torp}</dd><dt>予備の戦闘機「${eqName('ftr')}」</dt><dd>${S.pool.ftr}</dd><dt>予備の警戒機「${eqName('aew')}」</dt><dd>${S.pool.aew}</dd></dl><p class="mut sm">弾薬は月が替わるときに在庫から各艦へ自動で補給される。</p></section><section class="sec"><h2>艦艇 ${S.units.length}隻</h2>`;
  for(const u of S.units){const t=PT[u.type],c=cap(u),ps=shipPosts(u),vac=ps.filter(p=>!pm[u.id+':'+p[0]]).length;
    h+=`<div class="unit ${u.sector!==0?'away':''}"><div class="uh"><span class="tag">${t.s}</span><b>${u.name}</b><small>${clsName(u.type)} ${t.n}</small><span class="loc">${u.refit?`改修中 あと${u.refit.left}か月`:u.mode==='dock'?'ドック整備中':u.mode==='drill'?'演習中':u.tz>0?`合流中 あと${u.tz}か月`:SECT[u.sector]}</span></div>
      <div class="st3"><div><label>練度 ${Math.round(u.tr)}</label>${bar(u.tr,'b')}</div><div><label>整備度 ${Math.round(u.rd)}</label>${bar(u.rd,u.rd<40?'r':u.rd<60?'am':'g')}</div><div><label>船体 ${Math.round(u.hp)}%</label>${bar(u.hp,u.hp<50?'r':u.hp<80?'am':'g')}</div></div>
      <div class="amm">${Object.keys(c).filter(k=>c[k]).map(k=>`<span class="${(u.load[k]||0)<c[k]?'am':''}">${AMN[k]} ${u.load[k]||0}/${c[k]}</span>`).join('')}${t.tcap?`<span>陸上部隊 ${t.tcap}個を輸送</span>`:''}<span class="mut">戦闘効率 ${Math.round(unitQ(u)*100)}%</span></div>
      <div class="urow"><label>所属</label><select onchange="A.ufl(${u.id},+this.value)" aria-label="${u.name}の所属" ${u.tz>0?'disabled':''}><option value="0">母港(無所属)</option>${S.fleets.map(f=>`<option value="${f.id}" ${u.fl===f.id?'selected':''}>${esc(f.n)}(${ZS[f.zone]})</option>`).join('')}</select></div>
      ${t.fcap?`<div class="urow"><label>搭載機</label><span>戦闘機 ${u.ftr}/${ftrCap(u)}</span><button class="mini" onclick="A.air(${u.id},'ftr',1)" aria-label="戦闘機を積む">＋</button><button class="mini" onclick="A.air(${u.id},'ftr',-1)" aria-label="戦闘機を降ろす">－</button><span>警戒機 ${u.aew}/${aewCap(u)}</span><button class="mini" onclick="A.air(${u.id},'aew',1)" aria-label="警戒機を積む">＋</button><button class="mini" onclick="A.air(${u.id},'aew',-1)" aria-label="警戒機を降ろす">－</button></div>`:''}
      ${ps.length?`<div class="urow"><label>幹部</label><span class="grow sm">艦長 ${oname(pm[u.id+':co'])}${vac?`　<span class="am">欠員${vac}</span>`:''}</span><button class="btn sm" onclick="A.gopost(${u.id})">補職</button></div>`:''}
      <div class="urow"><label>改修</label><span class="grow sm">${u.mods.length?u.mods.map(k=>KIT[k].n).join('、'):'なし'}</span><button class="btn sm" onclick="A.kit(${u.id})">改修・除籍</button></div>
      <div class="urow"><label>運用</label><div class="seg">${['normal','drill','dock'].map((m,i)=>`<button class="${u.mode===m?'on':''}" ${u.refit?'disabled':''} onclick="A.mode(${u.id},'${m}')">${['通常','演習','ドック整備'][i]}</button>`).join('')}</div></div></div>`;}
  return h+`<p class="mut sm">演習は練度が大きく伸びるが整備度が下がり、月8億円かかる。ドック整備は整備度と船体を回復する。どちらも母港で行い、終わると艦隊へ戻る(離れた海域なら合流に時間がかかる)。</p></section>`;};
UV.fleets=()=>{let h=`<section class="sec"><h2>艦隊 ${S.fleets.length}個</h2><p class="mut sm">艦は艦隊ごとに動く。各艦の所属は「艦艇」で変える。別の海域にいる艦隊へ移すと、合流に時間がかかる。輸送艦を含む艦隊は陸上部隊を運べる。</p>`;
  S.fleets.forEach((f,k)=>{const us=flUnits(f),cp=fleetCap(f),ld=fleetLoad(f);
    h+=`<div class="unit ${f.zone>0?'away':''}"><div class="uh"><span class="fb">${k+1}</span><b>${esc(f.n)}</b><span class="loc">${SECT[f.zone]}${f.dest!=null?' → '+ZS[f.dest]:''}</span></div>
      <p class="sm">${us.length?us.map(u=>`<span class="tag">${PT[u.type].s}</span> ${u.name}${u.tz>0?' <small class="am">合流中</small>':u.mode!=='normal'?' <small class="am">母港</small>':''}`).join('　'):'<span class="mut">所属艦なし</span>'}</p>
      ${cp||ld.length?`<p class="sm">輸送 ${ld.length}/${cp}個：${ld.length?ld.map(g=>g.name).join('、'):'<span class="mut">空き</span>'}</p>`:''}
      <div class="brow"><button class="btn sm" onclick="A.fname(${f.id})">名前を変える</button><button class="btn sm" onclick="A.fdel(${f.id})">解隊</button></div></div>`;});
  return h+`<div class="brow"><button class="btn sm pri" onclick="A.fnew()">新しい艦隊を編成する</button></div></section>`;};
function gActs(g){let b='';
  if(g.loc[0]!=='f'){const z=g.loc==='home'?0:+g.loc.slice(1);for(const f of S.fleets)if(f.zone===z&&fleetCap(f)>fleetLoad(f).length)b+=`<button class="btn sm" onclick="A.gmove(${g.id},'f${f.id}')">${esc(f.n)}に乗船</button>`;
    if(!b)b=`<span class="sm mut">${z?SECT[z]:'本土近海'}に、空きのある輸送艦を含む艦隊がいない</span>`;}
  else{const f=FL(+g.loc.slice(1));if(f){if(f.zone===0)b=`<button class="btn sm" onclick="A.gmove(${g.id},'home')">本土に下ろす</button>`;
      else if(ISLZ.includes(f.zone)&&S.sectors[f.zone].held)b=`<button class="btn sm" onclick="A.gmove(${g.id},'i${f.zone}')">${ISL[f.zone]}に下ろす</button>`;
      else b=`<span class="sm mut">${ISLZ.includes(f.zone)?'島は占領下。「作戦」の上陸作戦で揚げる':'本土近海か、島のある海域に着くと下ろせる'}</span>`;}}
  return `<div class="urow"><label>移動</label><div class="brow grow" style="margin:0">${b}</div></div><div class="urow"><label>管理</label><button class="btn sm" onclick="A.gdis(${g.id})">解隊</button></div>`;}
UV.gnd=()=>{let h=`<section class="sec"><h2>陸上部隊 ${S.gnd.length}個</h2><p class="mut sm">島の守備と奪還を担う。海を渡るには、輸送艦を含む艦隊に乗せて運ぶ。本土にいるあいだは練度と戦力が回復する。新しい部隊は「調達」で編成できる。</p>`;
  if(!S.gnd.length)h+='<p class="al am">陸上部隊がない</p>';
  for(const g of S.gnd)h+=gRow(g,gActs(g));
  return h+'</section>';};
// 装備の諸元。研究や国柄の補正を含めた、いまの値を出す
UV.eq=()=>{const M=mods(),f=k=>M[k]||0,kt=v=>Math.round(v*60/1.852);
  let h=`<section class="sec"><h2>${NAT.n}の装備</h2><p class="mut sm">研究・予算・国柄による補正を含めた現在の値。装備の型は国ごとに決まっていて、長所と短所がある。</p>${eqCards(CUR,f)}</section><section class="sec"><h2>装備の世代</h2><p class="mut sm">系列ごとに、いま配備している機種。新しい機種への更新は「開発」の装備で進める。</p>${eqTable(s=>eqCur(s).i)}</section><section class="sec"><h2>艦艇</h2>`;
  for(const k of SHIPK){const t=PT[k];if(t.lock&&!S.unlock[k])continue;const sub=t.cat==='sub',r=[['船体',Math.round(t.hp*(1+(sub?f('subHp'):f('hp'))))],['速力',kt(t.spd*(1+(sub?f('subSpd'):f('spd'))))+'ノット']];
    if(t.dA)r.push(['対空レーダー',Math.round(t.dA*(1+f('radA')))+'km']);r.push(['対水上探知',Math.round(t.dS*(1+f('esm')))+'km']);if(t.so)r.push(['ソナー',Math.round(t.so*(1+(sub?f('sonarSub'):f('sonar'))))+'km']);
    if(t.sam)r.push(['艦対空ミサイル',`${Math.round(t.sam*(1+f('samCap')))}発、射程${Math.round(t.samR*(1+(t.samR>=100?f('samRL'):f('samRS'))))}km`]);if(t.asm)r.push(['対艦ミサイル',`${Math.round(t.asm*(1+f('asmCap')))}発、射程${Math.round(t.asmR*(1+f('asmR')))}km`]);
    if(t.torp)r.push(['魚雷・対潜弾',t.torp+'発']);if(t.fcap)r.push(['搭載機',`戦闘機${t.fcap}機、警戒機${t.acap}機`]);if(t.tcap)r.push(['輸送',`陸上部隊${t.tcap}個`]);r.push(['乗員',t.crew?t.crew+'名':'無人']);
    h+=`<div class="eqc"><div class="uh"><b>${t.n}</b><span class="loc">${clsName(k)||t.s}</span></div><p class="sm mut">${t.d}</p><dl class="kv">${r.map(x=>`<dt>${x[0]}</dt><dd>${x[1]}</dd>`).join('')}</dl></div>`;}
  h+=`</section><section class="sec"><h2>陸上部隊</h2>`;
  for(const k of GTK){const t=GT[k];h+=`<div class="eqc"><div class="uh"><b>${t.n}</b><span class="loc">戦闘力 ${sg(Math.round(f('gndPow')*100))}%</span></div><p class="sm mut">${t.d}</p><dl class="kv"><dt>攻撃／防御</dt><dd>${t.atk}／${t.def}</dd><dt>移動／射程</dt><dd>${t.mv}マス／${t.rng}マス</dd></dl></div>`;}
  return h+'</section>';};
VIEW.units=()=>subtabs('units',[['ships','艦艇'],['fleets','艦隊編成'],['gnd','陸上部隊'],['eq','装備']])+(UV[ui.sub.units]||UV.ships)();
VIEW.shop=()=>{
  let h=`<section class="sec"><h2>発注中</h2>${S.orders.length?S.orders.map(o=>`<div class="drow"><div style="flex:1">${o.n}</div><div class="mut">あと ${o.due-S.month} か月</div></div>`).join(''):'<p class="mut sm">発注中のものはない</p>'}</section><section class="sec"><h2>調達</h2><p class="mut sm">400億円以上のものは、一括払いか分割払いかを選べる。艦は母港で就役し、陸上部隊は本土で編成される。</p>`;
  const item=(k,n,d)=>{const c=price(k);return `<div class="item"><div class="uh"><b>${n}</b><span class="loc">${c.toLocaleString()}億円／${buildMo(k)}か月</span></div><p class="sm mut">${d}</p><button class="btn sm" ${canPay(c)||c>=400?'':'disabled'} onclick="A.buy('${k}')">発注する</button></div>`;};
  h+='<h3 class="sub">艦艇</h3>';const locked=[];
  for(const k of SHIPK){const t=PT[k];if(t.lock&&!S.unlock[k]){locked.push(t.n);continue;}h+=item(k,t.n+(clsName(k)?`<small class="mut">　${clsName(k)}</small>`:''),`${t.d}。乗員${t.crew}名、維持費は月${t.up}億円`);}
  if(locked.length)h+=`<p class="sm mut">開発計画を終えると調達できる：${locked.join('、')}</p>`;
  h+='<h3 class="sub">陸上部隊</h3>';for(const k of GTK){const t=GT[k];h+=item('g_'+k,t.n,`${t.d}。攻撃${t.atk}・防御${t.def}・移動${t.mv}、維持費は月${t.up}億円`);}
  h+='<h3 class="sub">航空機</h3>';for(const k of['ftr','aew'])h+=item(k,SHOPX[k].n,SHOPX[k].d);
  h+='<h3 class="sub">弾薬</h3>';for(const k of['sam','asm','aam','torp'])h+=item(k,SHOPX[k].n,SHOPX[k].d+`(在庫 ${S.stock[k]})`);
  return h+'</section>';};
function showIncident(){const inc=S.pending;if(!inc)return;const z=inc.sector,us=fightIn(z),rs=reserve(z),rt=inc.type==='retake',sc=inc.type==='scramble',af=airForce(z),can=sc?airCover(z,'ftr').length>0:us.length||rs.all.length,T=reinTime(),gar=garrison(z);
  const rn=(rs.near.length?`隣の海域から：${rs.near.map(u=>u.name).join('、')}<br><span class="mut sm">戦闘開始の${T}分後に着く</span>`:'')+(rs.near.length&&rs.far.length?'<br>':'')+(rs.far.length?`2つ先の海域から：${rs.far.map(u=>u.name).join('、')}<br><span class="mut sm">${T*2}分後に着く</span>`:'');
  modal(`<div class="alert r">${rt?'作戦計画':'事案発生'}</div><h2>${SECT[z]}　${SCN[inc.type].n}</h2><p>${SCN[inc.type].d(inc)}</p><dl class="kv2"><dt>敵情(推定)</dt><dd>${inc.intel}</dd><dt>現場の兵力</dt><dd>${us.length?us.map(u=>u.name).join('、'):sc?'所在の艦隊なし':'<b class="r">所在の艦隊なし</b>'}</dd><dt>増援</dt><dd>${rn||'なし'}</dd><dt>基地の航空部隊</dt><dd>${af.length?af.map(a=>a.name).join('、'):sc?'<b class="r">届く戦闘飛行隊がいない</b>':'なし'}</dd>${inc.type==='landing'?`<dt>島の守備隊</dt><dd>${gar.length?gar.map(g=>g.name).join('、'):'<b class="r">なし</b>'}</dd>`:''}</dl><div class="mbtn">${can?`<button class="btn pri" data-m="fight">出撃し、自ら指揮を執る</button><button class="btn" data-m="auto">現場指揮官に任せる(自動解決)</button>`:''}<button class="btn" data-m="ignore">${rt?'作戦を中止する':can?'静観する':'対処できない(静観)'}</button></div>`,
  {fight:()=>{closeModal();if(can)startBattle(inc);else ignoreInc(inc);},auto:()=>{closeModal();if(can)autoResolve(inc);else ignoreInc(inc);},ignore:()=>{closeModal();if(rt){S.pending=null;save();render();}else ignoreInc(inc);}});}
function showHelp(){const C=S.cfg;modal(`<div class="alert">着任</div><h2>${esc(C.fleetName)}司令部</h2><p>${C.cmdr?esc(C.cmdr)+'司令。':''}惑星${PLANET}。あなたは${esc(C.nation)}の${NAT.navy}で艦隊を預かる。対峙するのは${RIV.f}。任期の${C.years}年間、${[1,4,7].map(z=>SECT[z]+'の'+ISL[z]).join('、')}を守り抜く。支持率が0%になれば更迭される。</p>
<p class="sm">世界は${BLOC[1].n}(${S.w.n.filter(n=>n.bloc===1).length}か国)と${BLOC[2].n}(${S.w.n.filter(n=>n.bloc===2).length}か国)に割れている。${RIV.n}は${BLOC[2].s}の一員で、${NAT.n}はどちらにも属していない。どの国と組み、どこまで備えるかも、あなたが決める。</p>
<p class="sm mut">国柄「${NAT.tr[0]}」：${NAT.tr[1]}</p>
<ul class="sm"><li><b>作戦</b>：艦隊を海域へ送る。事案にはその海域の艦隊が当たり、隣と2つ先の海域からは増援が遅れて着く。シーレーンを空けたままにすると収入が減る</li><li><b>部隊</b>：艦の所属と演習・整備・改修、艦隊の編成、航空部隊の基地、陸上部隊の輸送と空輸</li><li><b>航空部隊</b>：本土と島の飛行場に置く。国籍不明機には戦闘飛行隊が緊急発進し、受け持つ海域の海戦には基地から戦闘機を出せる</li><li><b>陸上部隊</b>：島の守備隊になる。敵に上陸されると地上戦になり、守備隊がいなければ無抵抗で占領される</li><li><b>本土の守り</b>：${lwNb().length?`${lwNb().map(natN).join('、')}と陸で接している。関係が悪く守りが薄いと、相手は国境を越えてくる。本土にいる陸上部隊と兵役の政策が抑えになる。前線が首都に届き、首都が落ちれば任期は終わる。「国政」の国防で国境の緊張と構えを見られる`:'この国は陸で他国と接していないので、本土が陸から攻め込まれることはない'}</li><li><b>奪還</b>：占領された島は、制海を得て、砲爆撃で叩き、上陸して司令部を制圧すれば取り戻せる</li><li><b>人事</b>：組織図の枠をタップして幹部を任命する</li><li><b>開発</b>：16分野の研究と、旧式から構想中までの装備の世代交代、新しい艦種の開発</li><li><b>予算</b>：64費目の配分と年度の折衝</li><li><b>国政</b>：世界情勢と外交、国家方針、政策と顧問、州の開発。政治力をためて使う</li><li><b>翌月へ進む</b>で時間が進む</li></ul>
<p><b>海戦の操作</b></p><ul class="sm"><li>自部隊をタップで選択、海面をタップで移動、敵をタップで目標に指定。右下の「3D」で立体表示。＋－と2本指で大きく拡大できる</li><li>領空侵犯には、航空基地をタップして戦闘機を上げ、相手の15km以内に寄せて「警告」する</li><li>敵が撃つか領海に居座るまで、武器は使えない。艦を相手の50km以内に寄せて「警告」し、退去させれば最良の結果になる</li></ul>
<p><b>地上戦の操作</b></p><ul class="sm"><li>ターン制。自部隊をタップして、水色のマスへ移動、赤い枠の敵をタップで攻撃</li><li>動かず撃たなかった部隊は陣地を固める。森・丘・市街は守りやすい</li><li>艦砲射撃・爆撃・ミサイルは、その海域にいる艦隊が支援する。施設を制圧すると効果が自軍に移る</li></ul>
<p class="sm mut">「概況」の図上演習で、海戦・上陸戦・緊急発進を練習できる。作戦図と世界地図は、＋－か2本指で拡大し、指で動かせる。</p>
<div class="mbtn"><button class="btn pri" data-m="ok">任務に就く</button></div>`);}

/* ---------- 操作 ---------- */
Object.assign(A,{
  help:showHelp,
  tab(t){ui.tab=t;render();window.scrollTo(0,0);},
  goz(z){ui.tab='deploy';ui.zsel=z;ui.fsel=null;render();const e=document.querySelector('.zp');if(e&&e.scrollIntoView)e.scrollIntoView({block:'start'});},
  zone(z){if(ui.fsel!=null&&!ZONES[z].enemy){const id=ui.fsel;ui.fsel=null;return A.fdest(id,z);}ui.fsel=null;ui.zsel=ui.zsel===z?null:z;render();},
  fsel(id){ui.fsel=ui.fsel===id?null:id;render();},
  fdest(id,z){const f=FL(id);if(!f||ZONES[z].enemy)return;f.dest=z===f.zone?null:z;save();render();toast(f.dest==null?`${f.n}：${SECT[f.zone]}にとどまる`:`${f.n}：${SECT[z]}へ向かう(${Math.ceil(HOP[f.zone][z]/2)}か月)`);},
  fnew(){if(S.fleets.length>=12)return toast('艦隊はこれ以上編成できない');let n=1;while(S.fleets.some(f=>f.n===flName(3,n)))n++;S.fleets.push({id:++S.fid,n:flName(3,n),zone:0,dest:null});save();render();toast('母港で艦隊を編成した。「艦艇」で艦を所属させること');},
  fname(id){const f=FL(id);if(!f)return;modal(`<h2>艦隊の名前</h2><div class="srow"><input id="fnm" value="${esc(f.n)}" maxlength="14" aria-label="艦隊の名前"></div><div class="mbtn"><button class="btn pri" data-m="ok">決める</button><button class="btn" data-m="n">やめる</button></div>`,
    {ok:()=>{const v=$('#fnm').value.replace(/[<>&"'`]/g,'').trim();closeModal();if(v){f.n=v;save();render();}},n:closeModal});},
  fdel(id){const f=FL(id);if(!f)return;if(fleetLoad(f).length)return toast('陸上部隊を乗せている。先に下船させること');
    confirmM(`${esc(f.n)}を解隊する。所属の艦は母港へ戻る。`,()=>{for(const u of flUnits(f)){if(f.zone!==0&&u.mode==='normal')u.tz=Math.max(u.tz||0,Math.ceil(HOP[f.zone][0]/2));u.fl=0;}S.fleets=S.fleets.filter(x=>x!==f);if(ui.fsel===id)ui.fsel=null;save();render();},'解隊する');},
  ufl(uid,fid){const u=U(uid),f=fid?FL(fid):null;if(!u||(fid&&!f)||u.fl===fid)return;const of=u.fl?FL(u.fl):null;
    if(u.tz>0){render();return toast('合流中の艦は所属を変えられない');}
    if(of&&PT[u.type].tcap&&u.mode==='normal'&&fleetCap(of)-PT[u.type].tcap<fleetLoad(of).length){render();return toast('陸上部隊を乗せている。先に下船させること');}
    const from=of&&u.mode==='normal'?of.zone:0,to=f?f.zone:0;u.fl=fid;if(u.mode==='normal'&&from!==to)u.tz=Math.ceil(HOP[from][to]/2);save();render();
    toast(u.tz>0?`${u.name}：合流まで${u.tz}か月`:`${u.name}：${f?f.n+'に所属':'母港で待機'}`);},
  mode(id,m){const u=U(id);if(!u||u.refit||u.mode===m)return;const f=u.fl?FL(u.fl):null;
    if(m!=='normal'&&u.tz>0)return toast('合流中は切り替えられない');
    if(m!=='normal'&&u.mode==='normal'&&f&&PT[u.type].tcap&&fleetCap(f)-PT[u.type].tcap<fleetLoad(f).length)return toast('陸上部隊を乗せている。先に下船させること');
    if(u.mode==='normal')u.mm=S.month;u.mode=m;if(m==='normal'&&f&&f.zone!==0&&u.mm!==S.month)u.tz=Math.ceil(HOP[0][f.zone]/2);save();render();if(u.tz>0)toast(`${u.name}：艦隊への合流まで${u.tz}か月`);},
  gmove(gid,dest){const g=S.gnd.find(x=>x.id===gid);if(!g)return;
    if(dest[0]==='f'){const f=FL(+dest.slice(1)),z=g.loc==='home'?0:g.loc[0]==='i'?+g.loc.slice(1):-1;if(!f||f.zone!==z||fleetCap(f)<=fleetLoad(f).length)return toast('乗船できない');}
    else{const f=g.loc[0]==='f'?FL(+g.loc.slice(1)):null;if(!f||(dest==='home'?f.zone!==0:!(dest==='i'+f.zone&&ISLZ.includes(f.zone)&&S.sectors[f.zone].held)))return toast('ここでは下ろせない');}
    g.loc=dest;save();render();toast(`${g.name}：${gLoc(g)}`);},
  gdis(gid){const g=S.gnd.find(x=>x.id===gid);if(!g)return;confirmM(`${g.name}を解隊する。部隊は戻らない。`,()=>{S.gnd=S.gnd.filter(x=>x!==g);hlog(`${g.name}を解隊`,'');save();render();},'解隊する');},
  retake(z){if(S.pending||S.over||S.gpend)return;if(!S.isl[z].cover)return toast('周辺に敵艦隊はいない');S.pending=mkIncident(z,'retake');save();showIncident();},
  prep(z){const il=S.isl[z];if(S.sectors[z].held)return;if(!seaCtrl(z))return toast('制海を確保していない');
    const us=fightIn(z),gun=us.filter(u=>PT[u.type].cat==='ship'&&PT[u.type].val>=30).length,ftr=us.reduce((a,u)=>a+(PT[u.type].fcap?u.ftr:0),0),asm=us.reduce((a,u)=>a+(u.load.asm||0),0),dn=k=>il.prep[k]===S.month;
    const it=(k,n,cnt,ok,d)=>`<div class="item"><div class="uh"><b>${n}</b><span class="loc">${cnt}</span></div><p class="sm mut">${d}</p><button class="btn sm" data-m="${k}" ${ok&&!dn(k)?'':'disabled'}>${dn(k)?'今月は実施済み':ok?'実施する':'実施できない'}</button></div>`;
    modal(`<div class="alert">準備攻撃</div><h2>${ISL[z]}</h2><p class="sm">上陸の前に、敵の守備隊(残り${il.egar.length}個)と陣地(${FORT[il.fort]})を叩く。それぞれ月に1回。実施のたびに緊張度が1上がる。</p>
    ${it('gun','艦砲射撃',`水上戦闘艦 ${gun}隻`,gun>0,'守備隊の全体を少しずつ削り、陣地を一段崩す。敵に特科か地対艦ミサイルが残っていると、撃ち返されることがある。')}
    ${it('air','空爆',`艦上戦闘機 ${ftr}機、基地の飛行隊 ${airStrikers(z).length}個`,ftr>=2||airStrikers(z).length>0,'地対艦・高射・特科の陣地から順に叩く。敵の高射特科が残っていると、戦闘機を失うことがある。')}
    ${it('msl','ミサイル攻撃',`対艦ミサイル ${asm}発`,asm>=4,'対艦ミサイル4発を使い、もっとも厄介な陣地を1つ確実に叩く。反撃は受けない。')}
    <div class="mbtn"><button class="btn pri" data-m="x">閉じる</button></div>`,{x:closeModal,gun:()=>{closeModal();prepStrike(z,'gun');},air:()=>{closeModal();prepStrike(z,'air');},msl:()=>{closeModal();prepStrike(z,'msl');}});},
  land(z){if(S.pending||S.over||S.gpend||S.sectors[z].held)return;if(!seaCtrl(z))return toast('制海を確保していない');const il=S.isl[z],emb=landForce(z);
    if(!emb.length)return toast('この海域に、陸上部隊を乗せた艦隊がいない');
    confirmM(`<b>${ISL[z]}への上陸作戦</b>を発動する。<br>上陸部隊：${emb.map(g=>g.name).join('、')}<br>敵の守備隊(推定)：${il.egar.length}個、陣地は「${FORT[il.fort]}」<br><span class="sm mut">司令部に乗り込んで敵の番を持ちこたえるか、敵を全滅させれば奪還できる。16ターンで決着がつかなければ艦へ引き揚げる。</span>`,()=>startGround('assault',z),'上陸を開始する');},
  gdrill(){startGround('drill',0);},
  csg(k,d,max){ui.cs.gnd[k]=clamp((ui.cs.gnd[k]||0)+d,0,max);showSetup();},
  // 国の一覧 ⇄ 国の情報。戻ると、一覧と地図を見ていた位置に帰る
  nsel(i){if(ui.nview!=='info')ui.nsc=$('#mbox').scrollTop;ui.nat=i;ui.riv=null;ui.nview='info';showNation();$('#mbox').scrollTop=0;},
  nback(){ui.nview='list';showNation();$('#mbox').scrollTop=ui.nsc||0;},
  nriv(i){ui.riv=i;const sc=$('#mbox').scrollTop;showNation();$('#mbox').scrollTop=sc;},
  csnat(){closeModal();ui.nat=ui.cs.nat;ui.riv=ui.cs.riv;ui.nview='list';ui.wsc=null;ui.nsc=0;showNation();},
  world(){modal(`<div class="alert">惑星${PLANET}</div><h2>世界地図</h2><p class="sm mut">白が${NAT.n}、赤が${RIV.n}。地図は指で動かせて、＋－か2本指で拡大できる。</p>${mapBox('view',`data-hi="${S.cfg.nat||0}" data-ri="${NATS.indexOf(RIV)}"`)}<div class="mbtn"><button class="btn pri" data-m="ok">閉じる</button></div>`);}
});
