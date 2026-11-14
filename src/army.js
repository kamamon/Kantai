/* ================= 陸上部隊の編成 ================= */
// 連隊は中隊を並べた「編成表」から作る。兵科は部隊ごとに決まっていて、主力の半分以上はその兵科の中隊にする。
// 編成表を持たない部隊は標準の編成(その兵科の中隊4個)で、能力は GT の値そのまま。
// 中隊：[名称, 記号, 攻撃, 防御, 移動, 調達費, 維持費, 説明]
const BN={
  inf:['普通科中隊','歩',5,6,2,40,.5,'徒歩の歩兵。守りに強い'],
  mec:['機械化中隊','機',5.5,6.5,3,60,.8,'装甲車に乗る歩兵。足が速く、守りも固い'],
  tnk:['戦車中隊','戦',8,6,4,75,1,'突破力がある。値が張る'],
  rcn:['機動戦闘車中隊','輪',7,4.5,4,62,.8,'装輪で速く、火力もある。守りは薄い'],
  amp:['水陸機動中隊','水',6,5,3,65,.75,'上陸の主力'],
  abn:['空挺中隊','挺',6,4,3,70,.75,'空から降りる軽歩兵'],
  how:['特科中隊','砲',7,2,2,55,.75,'榴弾砲。火力は高いが、守りは脆い'],
  rkt:['ロケット中隊','ロ',8,2,2,75,1,'多連装ロケット'],
  sam:['高射中隊','空',2,3,2,60,.75,'対空ミサイル'],
  ssm:['地対艦ミサイル中隊','艦',1,2,2,80,1,'対艦ミサイル'],
  ahs:['攻撃ヘリ飛行隊','ヘ',7,3,5,85,1,'攻撃ヘリコプター']};
// 兵科ごとの固有の中隊。先頭が標準の編成に入る
const BNAT={inf:['inf','mec'],arm:['tnk','rcn'],amp:['amp'],abn:['abn'],art:['how'],mlrs:['rkt'],aa:['sam'],ssm:['ssm'],ah:['ahs']};
const BPOOL=['inf','mec','tnk','rcn','amp','abn','how','rkt','sam','ssm'];
// 支援隊：[名称, 記号, 調達費, 維持費, 効果, 説明]
const BSUP={
  eng:['施設隊','施',30,.3,{def:.1},'陣地を築く。防御 +10%'],
  fsp:['重迫撃砲隊','迫',35,.3,{atk:.1},'近くから火力で支える。攻撃 +10%'],
  atg:['対戦車隊','対',35,.3,{at:.25},'戦車と攻撃ヘリに与える損害 +25%'],
  ads:['近距離防空隊','防',40,.4,{aa:1},'敵の爆撃を退けられる'],
  rec:['偵察隊','偵',30,.3,{vis:1},'視界が1マス広がる'],
  log:['後方支援隊','補',30,.3,{heal:1},'毎月の戦力の回復 +1']};
const TPL_LINE=8,TPL_SUP=3;
const stdLine=type=>[0,1,2,3].map(()=>BNAT[type][0]);
function orgRaw(line,sup){const n=line.length||1,sz=Math.sqrt(n/4),x={atk:0,def:0,at:0,aa:0,vis:0,heal:0};let a=0,d=0,m=99,c=0,u=0;
  for(const k of line){const b=BN[k];a+=b[2];d+=b[3];m=Math.min(m,b[4]);c+=b[5];u+=b[6];}
  for(const k of sup){const s=BSUP[k];c+=s[2];u+=s[3];for(const f in s[4])x[f]+=s[4][f];}
  return{a:a/n*sz*(1+x.atk),d:d/n*sz*(1+x.def),m:m===99?2:m,c,u,sz,x,n:line.length};}
// 編成から能力を出す。標準の編成との比を GT の値に掛けるので、標準ならちょうど GT の値になる
function tplStat(type,line,sup){const T=GT[type],r=orgRaw(line,sup),s=orgRaw(stdLine(type),[]),atk=+(T.atk*r.a/s.a).toFixed(1),def=+(T.def*r.d/s.d).toFixed(1);
  return{n:T.n,s:T.s,d:T.d,build:T.build,atk,def,mv:type==='ah'?T.mv:Math.max(1,T.mv+r.m-s.m),rng:T.rng,cost:Math.round(T.cost*r.c/s.c),up:+(T.up*r.u/s.u).toFixed(1),at:r.x.at,aa:r.x.aa,vis:r.x.vis,heal:r.x.heal,pw:(atk+def)/2*r.sz,size:r.n};}
const tplOf=x=>x&&x.tp!=null&&S&&S.tpl?S.tpl.find(t=>t.id===x.tp)||null:null;
const _tc={};
// 部隊(または敵の部隊の記述)の、いまの能力
function gST(x){const type=x.t||x.type,tp=tplOf(x);if(!tp||tp.type!==type)return GT[type];const T=GT[type],key=tp.line.join()+'|'+tp.sup.join()+'|'+type+T.atk+','+T.def+','+T.mv+','+T.cost+','+T.up;return _tc[key]||(_tc[key]=tplStat(type,tp.line,tp.sup));}
const gPW=x=>{const t=gST(x);return t.pw||(t.atk+t.def)/2;};
// 戦場へ出すときの写し。編成表も連れていく
const gRef=g=>({type:g.type,hp:g.hp,ref:g.id,name:g.name,tr:g.tr,tp:g.tp});
function armyInit(){if(!S)return;if(!S.tpl)S.tpl=[];if(S.tseq==null)S.tseq=0;}
function tplBad(type,line,sup){const nat=BNAT[type];if(!line.length)return'主力の中隊を1個以上入れる';if(line.length>TPL_LINE)return`主力は${TPL_LINE}個まで`;if(sup.length>TPL_SUP)return`支援隊は${TPL_SUP}個まで`;
  if(line.some(k=>!BN[k])||sup.some(k=>!BSUP[k])||new Set(sup).size!==sup.length)return'編成が正しくない';
  if(type==='ah'?line.some(k=>k!=='ahs'):line.includes('ahs'))return type==='ah'?'攻撃ヘリコプター隊に入れられるのは攻撃ヘリ飛行隊だけ':'攻撃ヘリ飛行隊は攻撃ヘリコプター隊にしか入れられない';
  if(line.filter(k=>nat.includes(k)).length*2<line.length)return`主力の半分以上を${nat.map(k=>BN[k][0]).join('か')}にする`;return'';}
// 編成を改める費用：新しく加わる中隊と支援隊のぶんだけ払う
function orgDiff(l0,s0,l1,s1){const left=l0.concat(s0);let c=0;for(const k of l1.concat(s1)){const i=left.indexOf(k);if(i>=0)left.splice(i,1);else c+=(BN[k]||BSUP[k])[BN[k]?5:2];}return c;}
const tplLine=x=>{const tp=tplOf(x);return tp&&tp.type===(x.t||x.type)?[tp.line,tp.sup]:[stdLine(x.t||x.type),[]];};
const tplUsers=id=>S.gnd.filter(g=>g.tp===id);
const tplIcons=(line,sup)=>`<span class="ticons">${line.map(k=>`<i>${BN[k][1]}</i>`).join('')}${sup.map(k=>`<i class="s">${BSUP[k][1]}</i>`).join('')}</span>`;
const tplStatLine=t=>`攻${t.atk} 防${t.def} 移${t.mv}${t.rng>1?' 射'+t.rng:''}`;
/* ---------- 画面 ---------- */
UV.org=()=>{armyInit();const d=ui.tde;if(d)return tplDesigner(d);
  let h=`<section class="sec"><h2>編成表 ${S.tpl.length}</h2><p class="mut sm">陸上部隊は、中隊を並べた編成表から作る。編成表を作っておくと、新しい部隊をその編成で調達でき、本土にいる部隊を改編できる。主力は${TPL_LINE}個、支援隊は${TPL_SUP}個まで。規模を大きくするほど強くなるが、費用も増える。</p>`;
  if(!S.tpl.length)h+='<p class="sm mut">まだ編成表はない。いまの部隊はすべて標準の編成になっている。</p>';
  for(const tp of S.tpl){const t=tplStat(tp.type,tp.line,tp.sup),n=tplUsers(tp.id).length,T=GT[tp.type];
    h+=`<div class="unit"><div class="uh"><span class="tag">${T.s}</span><b>${esc(tp.name)}</b><span class="loc">${T.n}・${n?`使用 ${n}個`:'未使用'}</span></div>${tplIcons(tp.line,tp.sup)}
    <p class="sm">${tplStatLine(t)}　<span class="mut">標準は ${tplStatLine(T)}</span><br>調達 ${t.cost}億円・維持 月${t.up}億円</p>
    <div class="brow"><button class="btn sm" onclick="A.tedit(${tp.id})">改める</button><button class="btn sm" onclick="A.tcopy(${tp.id})">複製</button><button class="btn sm" onclick="A.tbuy(${tp.id})">この編成で調達<small>${t.cost}億・${T.build}か月</small></button>${n?'':`<button class="btn sm" onclick="A.tdel(${tp.id})">削除</button>`}</div></div>`;}
  h+=`<h3 class="sub">新しい編成表を作る</h3><p class="sm mut">兵科を選ぶ。兵科によって、戦場での振る舞い(砲撃、降下、上陸など)が決まる。</p><div class="chips">${GTK.map(k=>`<button onclick="A.tnew('${k}')">${GT[k].n}</button>`).join('')}</div></section>`;
  return h;};
function tplDesigner(d){const T=GT[d.type],t=tplStat(d.type,d.line,d.sup),bad=tplBad(d.type,d.line,d.sup),nat=BNAT[d.type],pool=d.type==='ah'?['ahs']:BPOOL,old=d.id?S.tpl.find(x=>x.id===d.id):null,users=old?tplUsers(old.id).length:0,dc=old?orgDiff(old.line,old.sup,d.line,d.sup):0;
  const dl=(v,b,inv)=>{const x=+(v-b).toFixed(1);return x?`<span class="${(x>0)!==!!inv?'g':'r'}">(${x>0?'+':''}${x})</span>`:'';};
  let slots='';for(let i=0;i<TPL_LINE;i++){const k=d.line[i];slots+=k?`<button class="tslot on${nat.includes(k)?' nat':''}" onclick="A.tdr(${i})" aria-label="${BN[k][0]}を外す"><b>${BN[k][1]}</b><small>${BN[k][0].replace(/中隊|飛行隊/,'')}</small></button>`:'<span class="tslot">＋</span>';}
  return `<section class="sec"><h2>${old?'編成表を改める':'新しい編成表'}</h2>
  <div class="urow"><label>名称</label><input class="tin" value="${esc(d.name)}" maxlength="14" onchange="A.tdn(this.value)" aria-label="編成表の名称"></div>
  <div class="urow"><label>兵科</label><div class="grow"><b>${T.n}</b><br><span class="sm mut">${T.d}</span></div></div>
  <h3 class="sub">主力 ${d.line.length}／${TPL_LINE}</h3><div class="tgrid">${slots}</div><p class="sm mut">入っている中隊をタップすると外れる。半分以上は${nat.map(k=>BN[k][0]).join('か')}にする。移動は、いちばん遅い中隊に合わせる。</p>
  <div class="tpal">${pool.map(k=>`<button class="btn sm" ${d.line.length>=TPL_LINE?'disabled':''} onclick="A.tdl('${k}')">＋${BN[k][0]}<small>攻${BN[k][2]} 防${BN[k][3]} 移${BN[k][4]}・${BN[k][5]}億</small></button>`).join('')}</div>
  <h3 class="sub">支援隊 ${d.sup.length}／${TPL_SUP}</h3><div class="tpal">${Object.keys(BSUP).map(k=>{const on=d.sup.includes(k);return `<button class="btn sm ${on?'pri':''}" ${!on&&d.sup.length>=TPL_SUP?'disabled':''} onclick="A.tds('${k}')">${on?'✓ ':'＋'}${BSUP[k][0]}<small>${BSUP[k][5]}・${BSUP[k][2]}億</small></button>`;}).join('')}</div>
  <h3 class="sub">諸元</h3><dl class="kv2"><dt>攻撃</dt><dd><b>${t.atk}</b> ${dl(t.atk,T.atk)}</dd><dt>防御</dt><dd><b>${t.def}</b> ${dl(t.def,T.def)}</dd><dt>移動／射程</dt><dd>${t.mv}マス ${dl(t.mv,T.mv)}／${t.rng}マス</dd><dt>規模</dt><dd>中隊${d.line.length}個＋支援${d.sup.length}個</dd>
  <dt>調達費</dt><dd>${t.cost}億円 ${dl(t.cost,T.cost,1)}</dd><dt>維持費</dt><dd>月${t.up}億円 ${dl(t.up,T.up,1)}</dd>${t.at||t.aa||t.vis||t.heal?`<dt>特性</dt><dd>${d.sup.map(k=>BSUP[k][5]).join('、')}</dd>`:''}</dl><p class="sm mut">かっこ内は標準の編成との差。</p>
  ${bad?`<p class="al am">${bad}</p>`:users?`<p class="al am">この編成表を使っている${users}個部隊を改編する。費用は${dc*users}億円(1個あたり${dc}億円)、練度が8下がる</p>`:''}
  <div class="brow"><button class="btn pri" ${bad||(users&&!canPay(dc*users))?'disabled':''} onclick="A.tdsave()">${users&&!canPay(dc*users)?'資金が足りない':'保存する'}</button><button class="btn" onclick="A.tdx()">やめる</button></div></section>`;}
{const row0=gRow,act0=gActs,shop0=VIEW.shop;
  gRow=function(g,act){const tp=tplOf(g);if(!tp)return row0(g,act);const t=gST(g),T=GT[g.type];
    return row0(g,act).replace(`攻${T.atk} 防${T.def} 移${T.mv}${T.rng>1?' 射'+T.rng:''}`,tplStatLine(t)).replace('</b><span class="loc">',`</b><span class="tag">${esc(tp.name)}</span><span class="loc">`);};
  gActs=function(g){return act0(g)+`<div class="urow"><label>編成</label><div class="grow">${tplIcons(...tplLine(g))}</div><button class="btn sm" onclick="A.torg(${g.id})">改編</button></div>`;};
  VIEW.shop=function(){armyInit();const h=shop0();if(!S.tpl.length)return h;
    const add='<h3 class="sub">編成表から調達する陸上部隊</h3>'+S.tpl.map(tp=>{const t=tplStat(tp.type,tp.line,tp.sup),T=GT[tp.type];return `<div class="item"><div class="uh"><b>${esc(tp.name)}<small class="mut">　${T.n}</small></b><span class="loc">${t.cost.toLocaleString()}億円／${T.build}か月</span></div>${tplIcons(tp.line,tp.sup)}<p class="sm mut">${tplStatLine(t)}、維持費は月${t.up}億円</p><button class="btn sm" ${canPay(t.cost)?'':'disabled'} onclick="A.tbuy(${tp.id})">発注する</button></div>`;}).join('');
    return h.replace('<h3 class="sub">航空部隊</h3>',add+'<h3 class="sub">航空部隊</h3>');};}
Object.assign(A,{
  tnew(type){if(!GT[type])return;ui.tde={id:null,type,name:GT[type].n.replace(/連隊|中隊|隊$/,'')+'改',line:stdLine(type),sup:[]};render();window.scrollTo(0,0);},
  tedit(id){const tp=S.tpl.find(x=>x.id===id);if(!tp)return;ui.tde={id,type:tp.type,name:tp.name,line:tp.line.slice(),sup:tp.sup.slice()};render();window.scrollTo(0,0);},
  tcopy(id){const tp=S.tpl.find(x=>x.id===id);if(!tp)return;ui.tde={id:null,type:tp.type,name:(tp.name+'2').slice(0,14),line:tp.line.slice(),sup:tp.sup.slice()};render();window.scrollTo(0,0);},
  tdel(id){if(tplUsers(id).length)return;confirmM('この編成表を削除する。',()=>{S.tpl=S.tpl.filter(x=>x.id!==id);for(const o of S.orders)if(o.tp===id)delete o.tp;save();render();},'削除する');},
  tdl(k){const d=ui.tde;if(!d||!BN[k]||d.line.length>=TPL_LINE)return;d.line.push(k);render();},
  tdr(i){const d=ui.tde;if(!d)return;d.line.splice(i,1);render();},
  tds(k){const d=ui.tde;if(!d||!BSUP[k])return;const i=d.sup.indexOf(k);if(i>=0)d.sup.splice(i,1);else if(d.sup.length<TPL_SUP)d.sup.push(k);render();},
  tdn(v){const d=ui.tde;if(d)d.name=String(v).trim().slice(0,14)||d.name;},
  tdx(){ui.tde=null;render();},
  tdsave(){const d=ui.tde;if(!d||tplBad(d.type,d.line,d.sup))return;armyInit();
    if(!d.id){S.tpl.push({id:++S.tseq,name:d.name,type:d.type,line:d.line.slice(),sup:d.sup.slice()});ui.tde=null;hlog(`編成表「${d.name}」を作った`,'');save();render();return toast('編成表を保存した');}
    const tp=S.tpl.find(x=>x.id===d.id);if(!tp)return;const us=tplUsers(tp.id),c=orgDiff(tp.line,tp.sup,d.line,d.sup)*us.length;if(us.length&&!canPay(c))return toast('資金が足りない');
    if(us.length){spend(c);for(const g of us)g.tr=Math.max(20,g.tr-8);hlog(`編成表「${d.name}」を改め、${us.length}個部隊を改編した`,'');}
    tp.name=d.name;tp.line=d.line.slice();tp.sup=d.sup.slice();ui.tde=null;_M=null;save();render();toast('編成表を保存した');},
  // 部隊の改編：同じ兵科の編成表から選ぶ
  torg(gid){armyInit();const g=S.gnd.find(x=>x.id===gid);if(!g)return;const cur=tplLine(g),T=GT[g.type],opts=[{id:0,name:'標準の編成',line:stdLine(g.type),sup:[],t:T}].concat(S.tpl.filter(x=>x.type===g.type).map(x=>({id:x.id,name:x.name,line:x.line,sup:x.sup,t:tplStat(x.type,x.line,x.sup)}))),cbs={x:closeModal},home=g.loc==='home';
    const rows=opts.map(o=>{const on=(g.tp||0)===o.id||(!tplOf(g)&&!o.id),c=orgDiff(cur[0],cur[1],o.line,o.sup);cbs['t'+o.id]=()=>{closeModal();A.tapply(gid,o.id);};
      return `<div class="lopt ${on?'on':''}"><div class="uh"><b>${on?'● ':''}${esc(o.name)}</b><span class="loc">${tplStatLine(o.t)}</span></div>${tplIcons(o.line,o.sup)}${on?'':`<button class="btn sm" data-m="t${o.id}" ${home&&canPay(c)?'':'disabled'}>この編成に改める<small>${c}億円・練度 −8</small></button>`}</div>`;}).join('');
    modal(`<div class="alert">改編</div><h2>${g.name}</h2><p class="sm mut">${T.n}の編成表から選ぶ。改編できるのは本土にいる部隊だけ。新しく加わる中隊のぶんだけ費用がかかる。</p>${home?'':'<p class="al am">この部隊は本土にいない</p>'}${rows}${opts.length<2?'<p class="sm mut">この兵科の編成表はまだない。「部隊 → 編成表」で作れる。</p>':''}<div class="mbtn"><button class="btn" data-m="x">閉じる</button></div>`,cbs);},
  tapply(gid,tid){const g=S.gnd.find(x=>x.id===gid),tp=tid?S.tpl.find(x=>x.id===tid):null;if(!g||g.loc!=='home'||(tid&&(!tp||tp.type!==g.type)))return;const cur=tplLine(g),c=orgDiff(cur[0],cur[1],tp?tp.line:stdLine(g.type),tp?tp.sup:[]);if(!canPay(c))return toast('資金が足りない');
    spend(c);if(tp)g.tp=tp.id;else delete g.tp;g.tr=Math.max(20,g.tr-8);_M=null;hlog(`${g.name}を「${tp?tp.name:'標準の編成'}」に改編した`,'');save();render();toast('改編した');},
  tbuy(id){const tp=S.tpl.find(x=>x.id===id);if(!tp)return;const t=tplStat(tp.type,tp.line,tp.sup),T=GT[tp.type],build=buildMo('g_'+tp.type),n=`${T.n}(${tp.name})`;if(!canPay(t.cost))return toast('資金が足りない');
    confirmM(`<b>${esc(n)}</b>を発注する。${t.cost.toLocaleString()}億円、${build}か月で本土に編成される。`,()=>{if(!canPay(t.cost))return;spend(t.cost);S.orders.push({k:'g_'+tp.type,kind:'gnd',n,due:S.month+build,q:1,tp:tp.id});hlog(`発注：${n}`,'');save();render();toast(`${n}を発注した`);},'発注する');}
});
