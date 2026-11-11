/* ================= プレイ中の編集 ================= */
// 装備の名前と型、能力の補正、艦種と陸上部隊の基準値、研究の段階、開発計画、資金や在庫を、遊びながら書き換える
const PT0=JSON.parse(JSON.stringify(PT)),GT0=JSON.parse(JSON.stringify(GT));
let CUR={eq:NATS[0].eq,eqa:NATS[0].eqa,efx:NATS[0].efx};
ui.sub.edit='gen';ui.edk='ddg';
const edS=()=>S.ed||(S.ed={fx:{},pt:{},gt:{},eqn:null,eqa:null});
// 国の素の値に戻してから、書き換えた分だけを重ねる。E を渡さなければ素のまま
function applyEdits(E){const N=NAT;
  for(const k in PT0){for(const f in PT[k])if(!(f in PT0[k]))delete PT[k][f];Object.assign(PT[k],PT0[k]);}
  for(const k in GT0)Object.assign(GT[k],GT0[k]);
  if(E){for(const k in E.pt)if(PT[k])Object.assign(PT[k],E.pt[k]);for(const k in E.gt)if(GT[k])Object.assign(GT[k],E.gt[k]);}
  const eqa=Object.assign({},N.eqa,E&&E.eqa||{}),efx={};for(const k of EQK){const f=EQARC[k][eqa[k]]?EQARC[k][eqa[k]][1]:{};for(const s in f)efx[s]=(efx[s]||0)+f[s];}
  const e=E&&E.eqn?E.eqn:N.eq;CUR={eq:e,eqa,efx,n:N.n};
  SHOPX.ftr.n=`艦上戦闘機「${e[0]}」×2機`;SHOPX.aew.n=`早期警戒機「${e[1]}」×1機`;SHOPX.sam.n=`艦対空ミサイル「${e[2]}」×16`;SHOPX.asm.n=`対艦ミサイル「${e[3]}」×8`;SHOPX.aam.n=`空対空ミサイル「${e[4]}」×16`;SHOPX.torp.n=`長魚雷「${e[5]}」・対潜弾 ×8`;
  for(const k of GTK){SHOPX['g_'+k].n=GT[k].n;SHOPX['g_'+k].cost=GT[k].cost;SHOPX['g_'+k].build=GT[k].build;}
  _M=null;}
// 編集できる項目
const EDEQ={ftr:['ftrRad','ftrFuel','ftrLoad','ftrAam','ftrAsmR','ftrSurv'],aew:['aewRad','deck'],sam:['samRL','samRS','samPk','samRate','samCap'],asm:['asmR','asmDmg','asmSpd','asmPen','asmCap'],aam:['ftrAamR','ftrAam'],torp:['torpR','torpDmg','torpPk']};
const KT=1.852/60;
// [項目, 表示名, 表示倍率, 下限, 上限]
const EDPT=[['hp','船体',1,10,999],['spd','速力(ノット)',1/KT,3,60],['dA','対空レーダー(km)',1,0,900],['dS','対水上探知(km)',1,0,400],['dM','ミサイル探知(km)',1,0,300],['so','ソナー(km)',1,0,200],
  ['sam','艦対空ミサイル(発)',1,0,200],['samR','SAMの射程(km)',1,5,400],['samPk','SAMの命中率(%)',100,5,95],['ciws','近接防御(%)',100,0,95],['ecm','電子妨害(%)',100,0,90],
  ['asm','対艦ミサイル(発)',1,0,64],['asmR','SSMの射程(km)',1,20,600],['asmDmg','SSMの威力',1,10,200],['torp','魚雷・対潜弾(発)',1,0,48],['torpR','魚雷の射程(km)',1,5,80],
  ['fcap','戦闘機(機)',1,0,60],['acap','警戒機(機)',1,0,8],['aam','空対空ミサイル(発)',1,0,300],['aasm','航空用の対艦ミサイル(発)',1,0,120],['tcap','輸送(個)',1,0,8],
  ['crew','乗員(名)',1,0,3000],['cost','価格(億円)',1,10,20000],['up','維持費(億円/月)',1,0,200],['build','建造(か月)',1,1,60]];
const EDGT=[['atk','攻撃',1,1,20],['def','防御',1,1,20],['mv','移動(マス)',1,1,6],['rng','射程(マス)',1,1,5],['cost','価格(億円)',1,10,5000],['up','維持費(億円/月)',1,0,50],['build','編成(か月)',1,1,36]];
const edSc=k=>['%','-%','p'].includes(STAT[k][1])?100:1;
const edIn=(lab,val,act,step)=>`<div class="srow"><label>${lab}</label><input class="edin" type="number" inputmode="decimal" step="${step||1}" value="${val}" onchange="${act}" aria-label="${String(lab).replace(/<[^>]*>/g,' ')}"></div>`;
const edR=v=>Math.round(v*100)/100;
function edDone(msg){S.edited=true;applyEdits(S.ed);save();render();if(msg)toast(msg);}

const ED={};
ED.gen=()=>{const st=S.stock;
  let h=`<section class="sec"><h2>情勢と資金</h2>${edIn('資金(億円)',Math.round(S.funds),"A.edv('funds',+this.value)",100)}${edIn('年間の防衛予算(億円)',S.budget,"A.edv('budget',+this.value)",100)}${edIn('支持率(%)',Math.round(S.support),"A.edv('support',+this.value)")}${edIn('緊張度(%)',Math.round(S.tension),"A.edv('tension',+this.value)")}${edIn('士気',Math.round(S.pers.morale),"A.edv('morale',+this.value)")}</section>`;
  h+=`<section class="sec"><h2>在庫</h2>${edIn(`艦対空ミサイル「${CUR.eq[2]}」`,st.sam,"A.edv('sam',+this.value)",8)}${edIn(`対艦ミサイル「${CUR.eq[3]}」`,st.asm,"A.edv('asm',+this.value)",8)}${edIn(`空対空ミサイル「${CUR.eq[4]}」`,st.aam,"A.edv('aam',+this.value)",8)}${edIn(`長魚雷「${CUR.eq[5]}」・対潜弾`,st.torp,"A.edv('torp',+this.value)",8)}${edIn(`予備の戦闘機「${CUR.eq[0]}」`,S.pool.ftr,"A.edv('pftr',+this.value)")}${edIn(`予備の警戒機「${CUR.eq[1]}」`,S.pool.aew,"A.edv('paew',+this.value)")}</section>`;
  h+=`<section class="sec"><h2>まとめて書き換える</h2><div class="brow"><button class="btn sm" onclick="A.edall('rd')">全艦を整備完了にする</button><button class="btn sm" onclick="A.edall('tr')">全艦の練度 +10</button><button class="btn sm" onclick="A.edall('ammo')">全艦に弾薬を満載する</button><button class="btn sm" onclick="A.edall('gnd')">陸上部隊を全快させる</button><button class="btn sm" onclick="A.edall('fill')">曹士を定員まで満たす</button><button class="btn sm" onclick="A.edall('calm')">各海域の敵活動を下げる</button><button class="btn sm" onclick="A.edall('efl')">敵の侵攻部隊を消す</button></div></section>`;
  return h;};
ED.eq=()=>{const M=mods(),f=k=>M[k]||0,sp=eqSpec(CUR,f),E=S.ed||{fx:{}};
  let h=`<section class="sec"><h2>装備</h2><p class="mut sm">名前と型を変えられる。「補正」は、型や研究とは別に足し引きする値で、0が素の状態。</p>`;
  sp.forEach((e,i)=>{h+=`<div class="eqc"><div class="uh"><b>${EQL[e.k]}</b><span class="loc">${e.t}</span></div>
    <div class="srow"><label>名前</label><input class="edin wide" value="${esc(CUR.eq[i])}" maxlength="14" onchange="A.edn(${i},this.value)" aria-label="${EQL[e.k]}の名前"></div>
    <div class="srow"><label>型</label><select onchange="A.eda('${e.k}',+this.value)" aria-label="${EQL[e.k]}の型">${EQARC[e.k].map((a,k)=>`<option value="${k}" ${CUR.eqa[e.k]===k?'selected':''}>${a[0]}</option>`).join('')}</select></div>
    ${EDEQ[e.k].map(k=>edIn(`補正：${STAT[k][0]}(${edSc(k)===100?(STAT[k][1]==='p'?'pt':'%'):'値'})`,edR(((E.fx||{})[k]||0)*edSc(k)),`A.edfx('${k}',+this.value)`)).join('')}
    <dl class="kv">${e.r.map(x=>`<dt>${x[0]}</dt><dd>${x[1]}</dd>`).join('')}</dl></div>`;});
  h+=`<div class="brow"><button class="btn sm" onclick="A.edreset('eq')">装備を国の初期値に戻す</button></div></section><section class="sec"><h2>装備の世代</h2><p class="mut sm">系列ごとに、配備している機種を直接選べる。</p><div class="brow">${[1,2,3,4,5,6,7].map(g=>`<button class="btn sm" onclick="A.edmall(${g})">すべてG${g}</button>`).join('')}</div>`;
  for(const s of EQSK)h+=`<div class="srow"><label>${EQS[s][1]}</label><select onchange="A.edm('${s}',+this.value)" aria-label="${EQS[s][1]}の機種">${EQS[s][5].map((m,i)=>`<option value="${i}" ${eqCur(s).i===i?'selected':''}>G${m[0]} ${m[1]}</option>`).join('')}</select></div>`;
  return h+'</section>';};
ED.ship=()=>{const k=PT[ui.edk]?ui.edk:'ddg',t=PT[k],b=PT0[k],ch=S.ed&&S.ed.pt[k];
  let h=`<section class="sec"><h2>艦種の基準値</h2><p class="mut sm">その艦種のすべての艦に効く。就役済みの艦にも反映される。</p><div class="srow"><label>艦種</label><select onchange="A.edk(this.value)" aria-label="編集する艦種">${SHIPK.map(x=>`<option value="${x}" ${x===k?'selected':''}>${PT[x].n}${S.ed&&S.ed.pt[x]?'(変更あり)':''}</option>`).join('')}</select></div>`;
  for(const d of EDPT){if(b[d[0]]==null)continue;h+=edIn(d[1]+(ch&&ch[d[0]]!=null?` <span class="am">元 ${edR(b[d[0]]*d[2])}</span>`:''),edR(t[d[0]]*d[2]),`A.edp('${k}','${d[0]}',+this.value)`);}
  if(b.lock)h+=`<div class="srow"><label>調達</label><button class="btn sm" onclick="A.edun('${k}')">${S.unlock[k]?'解禁済み(取り消す)':'解禁する'}</button></div>`;
  return h+`<div class="brow"><button class="btn sm" onclick="A.edreset('pt','${k}')">この艦種を元に戻す</button><button class="btn sm" onclick="A.edreset('pt')">すべての艦種を元に戻す</button></div></section>`;};
ED.gnd=()=>{let h=`<section class="sec"><h2>陸上部隊の基準値</h2><p class="mut sm">地上戦と調達に反映される。</p>`;
  for(const k of GTK){const t=GT[k],b=GT0[k],ch=S.ed&&S.ed.gt[k];h+=`<div class="eqc"><div class="uh"><b>${t.n}</b>${ch?'<span class="loc am">変更あり</span>':''}</div>${EDGT.map(d=>edIn(d[1]+(ch&&ch[d[0]]!=null?` <span class="am">元 ${b[d[0]]}</span>`:''),t[d[0]],`A.edg('${k}','${d[0]}',+this.value)`)).join('')}</div>`;}
  return h+`<div class="brow"><button class="btn sm" onclick="A.edreset('gt')">陸上部隊を元に戻す</button></div></section>`;};
ED.res=()=>{const d=ui.dom||0;
  let h=`<section class="sec"><h2>研究　${totalLv()}／${LINE.length*10}段階</h2><div class="brow"><button class="btn sm" onclick="A.edra(-1,1)">全分野を +1</button><button class="btn sm" onclick="A.edra(-1,10)">全分野を最大に</button><button class="btn sm" onclick="A.edra(-1,0)">全分野を 0 に</button></div>
  <div class="chips">${DOM.map((n,i)=>`<button class="${d===i?'on':''}" onclick="A.dom(${i})">${n}<small>${LINE.filter(l=>l[2]===i).reduce((a,l)=>a+lvOf(l[0]),0)}</small></button>`).join('')}</div>
  <div class="brow"><button class="btn sm" onclick="A.edra(${d},1)">${DOM[d]}を +1</button><button class="btn sm" onclick="A.edra(${d},10)">最大に</button><button class="btn sm" onclick="A.edra(${d},0)">0 に</button></div>`;
  for(const l of LINE.filter(l=>l[2]===d)){const lv=lvOf(l[0]);h+=`<div class="srow"><label>${l[1]}<br><small class="mut">${STAT[l[3]][0]}　${lv?fmtEff(l[3],l[4]*lv):'効果なし'}</small></label><div class="stp"><button onclick="A.edr('${l[0]}',-1)" aria-label="${l[1]}を下げる">－</button><span>${lv}</span><button onclick="A.edr('${l[0]}',1)" aria-label="${l[1]}を上げる">＋</button></div></div>`;}
  h+=`</section><section class="sec"><h2>装備開発</h2><p class="mut sm">計画を完了済みにしたり、取り消したりできる。</p>`;
  for(const p of PROJ.filter(p=>p.kind!=='eq')){const dn=!!S.flags[p.k];h+=`<div class="srow"><label>${p.n}<br><small class="${dn?'g':'mut'}">${dn?'完了':S.projs[p.k]?'開発中':'未着手'}</small></label><button class="btn sm" onclick="A.edpj('${p.k}')">${dn?'取り消す':'完了にする'}</button></div>`;}
  return h+'</section>';};
ED.fx=()=>{const E=S.ed||{fx:{}},M=mods();
  let h=`<section class="sec"><h2>能力補正</h2><p class="mut sm">研究・予算・人事・国柄とは別に、能力値へ直接足し引きする。0が素の状態。右の小さな数字は、すべてを合わせた現在の値。</p>`;
  for(const k in STAT){const sc=edSc(k);h+=edIn(`${STAT[k][0]}<br><small class="mut">現在 ${fmtEff(k,M[k]||0)}</small>`,edR((E.fx[k]||0)*sc),`A.edfx('${k}',+this.value)`);}
  return h+`<div class="brow"><button class="btn sm" onclick="A.edreset('fx')">補正をすべて 0 に戻す</button></div></section>`;};
VIEW.edit=()=>`<section class="sec"><h2>編集</h2><p class="mut sm">遊びながら数値を直接書き換える。変更はすぐに反映され、記録にも残る。編集を使った記録は、任期の結果にその旨が出る。</p><div class="brow"><button class="btn sm" onclick="A.tab('home')">概況へ戻る</button></div></section>`+subtabs('edit',[['gen','全般'],['eq','装備'],['ship','艦種'],['gnd','陸上'],['res','研究'],['fx','補正']])+(ED[ui.sub.edit]||ED.gen)();
{const rd0=VIEW.rd,un0=UV.eq;
  VIEW.rd=()=>rd0()+`<section class="sec"><div class="brow"><button class="btn sm" onclick="A.edit('res')">研究と開発計画を編集する</button></div></section>`;
  UV.eq=()=>`<section class="sec"><div class="brow"><button class="btn sm" onclick="A.edit('eq')">装備を編集する</button><button class="btn sm" onclick="A.edit('ship')">艦種を編集する</button></div></section>`+un0();}

Object.assign(A,{
  edit(sub){ui.tab='edit';if(sub)ui.sub.edit=sub;render();window.scrollTo(0,0);},
  edk(k){ui.edk=k;render();},
  edv(k,v){if(!isFinite(v))return render();
    if(k==='funds')S.funds=clamp(Math.round(v),-99999,9999999);else if(k==='budget')S.budget=clamp(Math.round(v),1000,999999);else if(k==='support')S.support=clamp(v,1,100);else if(k==='tension')S.tension=clamp(v,0,100);
    else if(k==='morale')S.pers.morale=clamp(v,5,100);else if(k==='pftr')S.pool.ftr=clamp(Math.round(v),0,999);else if(k==='paew')S.pool.aew=clamp(Math.round(v),0,99);else if(k in S.stock)S.stock[k]=clamp(Math.round(v),0,99999);
    edDone();},
  edall(w){let msg='';
    if(w==='rd'){for(const u of S.units){u.rd=100;u.hp=100;}msg='全艦の整備度と船体を100にした';}
    else if(w==='tr'){for(const u of S.units)u.tr=Math.min(100,u.tr+10);msg='全艦の練度を上げた';}
    else if(w==='ammo'){_M=null;for(const u of S.units){const c=cap(u);for(const k in c)u.load[k]=c[k];}msg='全艦に弾薬を満載した';}
    else if(w==='gnd'){for(const g of S.gnd){g.hp=10;g.tr=Math.min(100,g.tr+10);}msg='陸上部隊を全快させた';}
    else if(w==='fill'){const rq=reqRates();for(const r of RATE)S.enl[r[0]].n=Math.max(S.enl[r[0]].n,rq[r[0]]);msg='曹士を定員まで満たした';}
    else if(w==='calm'){S.sectors.forEach((s,i)=>{if(s.held&&s.threat>0){s.threat=Math.max(5,s.threat-20);s.est=s.threat;}});msg='各海域の敵活動を下げた';}
    else if(w==='efl'){S.efl=[];S.fore=null;S.foreK=false;msg='敵の侵攻部隊と来月の兆候を消した';}
    edDone(msg);},
  edn(i,v){v=String(v).replace(/[<>&"'`「」]/g,'').trim().slice(0,14);const E=edS();if(!E.eqn)E.eqn=NAT.eq.slice();E.eqn[i]=v||NAT.eq[i];edDone();},
  edm(s,i){if(!EQS[s]||!EQS[s][5][i])return;edS();S.eqm[s]=i;const b=eqBusy(s);if(b)delete S.projs[b];edDone(`${EQS[s][1]}を${EQS[s][5][i][1]}にした`);},
  edmall(g){edS();for(const s of EQSK){S.eqm[s]=eqDef(s,g);const b=eqBusy(s);if(b)delete S.projs[b];}edDone(`すべての装備を第${g}世代にそろえた`);},
  eda(k,i){if(!EQARC[k]||!EQARC[k][i])return;const E=edS();E.eqa=E.eqa||{};E.eqa[k]=i;edDone(`${EQL[k]}を${EQARC[k][i][0]}にした`);},
  edfx(k,v){if(!STAT[k]||!isFinite(v))return render();const E=edS(),sc=edSc(k),x=clamp(v/sc,sc===100?-.9:-999,sc===100?5:999);if(x)E.fx[k]=x;else delete E.fx[k];edDone();},
  edp(t,f,v){const d=EDPT.find(x=>x[0]===f);if(!d||!PT0[t]||PT0[t][f]==null||!isFinite(v))return render();const E=edS(),x=clamp(v,d[3],d[4])/d[2];(E.pt[t]=E.pt[t]||{})[f]=d[2]===1?Math.round(x):x;
    if(Math.abs(E.pt[t][f]-PT0[t][f])<1e-6){delete E.pt[t][f];if(!Object.keys(E.pt[t]).length)delete E.pt[t];}edDone();},
  edg(t,f,v){const d=EDGT.find(x=>x[0]===f);if(!d||!GT0[t]||!isFinite(v))return render();const E=edS();(E.gt[t]=E.gt[t]||{})[f]=Math.round(clamp(v,d[3],d[4]));
    if(E.gt[t][f]===GT0[t][f]){delete E.gt[t][f];if(!Object.keys(E.gt[t]).length)delete E.gt[t];}edDone();},
  edun(t){if(!PT0[t]||!PT0[t].lock)return;if(S.unlock[t])delete S.unlock[t];else S.unlock[t]=1;edDone(S.unlock[t]?`${PT[t].n}を調達できるようにした`:`${PT[t].n}の解禁を取り消した`);},
  edr(id,d){const l=LINE.find(x=>x[0]===id);if(!l)return;const lv=clamp(lvOf(id)+d,0,10);if(lv)S.res[id]={lv,prog:0};else delete S.res[id];for(const lab of S.labs)if(lab.cur===id&&lv>=10)lab.cur=null;edDone();},
  edra(dom,mode){for(const l of LINE){if(dom>=0&&l[2]!==dom)continue;const lv=mode===1?Math.min(10,lvOf(l[0])+1):mode;if(lv)S.res[l[0]]={lv,prog:0};else delete S.res[l[0]];}
    for(const lab of S.labs)if(lab.cur&&lvOf(lab.cur)>=10)lab.cur=null;edDone(mode===10?'研究を最大にした':mode===0?'研究を0に戻した':'研究を1段階進めた');},
  edpj(k){const p=PROJ.find(x=>x.k===k);if(!p)return;
    if(S.flags[k]){delete S.flags[k];if(p.kind==='unit')delete S.unlock[k];if(p.kind==='kit')delete S.kits[k];}else{delete S.projs[k];S.flags[k]=1;if(p.kind==='unit')S.unlock[k]=1;if(p.kind==='kit')S.kits[k]=1;}
    edDone(`${p.n}：${S.flags[k]?'完了にした':'取り消した'}`);},
  edreset(w,k){const E=edS();
    if(w==='eq'){E.eqn=null;E.eqa=null;for(const g in EDEQ)for(const s of EDEQ[g])delete E.fx[s];}else if(w==='pt'){if(k)delete E.pt[k];else E.pt={};}else if(w==='gt')E.gt={};else if(w==='fx')E.fx={};
    edDone('元に戻した');}
});
