/* ---------- 人事 ---------- */
const PV={};
VIEW.pers=()=>subtabs('pers',[['sum','概要'],['roster','幹部名簿'],['posts','補職'],['enl','曹士'],['edu','教育・施策']])+PV[ui.sub.pers]();
PV.sum=()=>{const P=S.pers,f=fill(),pm=postMap(),posts=allPosts(),vac=posts.filter(p=>!pm[p.id]).length,pipe=P.pipe.reduce((a,p)=>a+p.n,0),rk=RANK.map((n,i)=>S.off.filter(o=>o.rank===i).length),mx=Math.max(1,...rk);
  return `<section class="sec"><h2>人員の現況</h2><div class="st3"><div><label>曹士の充足率 ${Math.round(f*100)}%</label>${bar(f*100,f<.85?'r':f<.95?'am':'g')}</div><div><label>士気 ${Math.round(P.morale)}</label>${bar(P.morale,P.morale<40?'r':P.morale<60?'am':'g')}</div><div><label>教育中 ${pipe}名</label>${bar(Math.min(100,pipe),'b')}</div></div>
  <dl class="kv"><dt>曹士 現員／定員</dt><dd>${enlTotal().toLocaleString()}／${reqPers().toLocaleString()} 名</dd><dt>幹部</dt><dd>${S.off.length}名</dd><dt>ポスト／欠員</dt><dd>${posts.length}／<span class="${vac?'am':''}">${vac}</span></dd><dt>課程に派遣中</dt><dd>${S.off.filter(o=>o.sch).length}名</dd></dl></section>
  <section class="sec"><h2>幹部の階級構成</h2><div class="rkb">${RANK.map((n,i)=>`<div><span>${n}</span>${bar(rk[i]/mx*100,'b')}<b>${rk[i]}</b></div>`).reverse().join('')}</div></section>
  <section class="sec"><h2>補職の方針</h2>${seg([[true,'欠員を自動で埋める'],[false,'すべて手動']],P.auto,v=>`A.pauto(${v})`)}<div class="brow"><button class="btn sm" onclick="A.assignNow()">欠員をいま埋める</button></div><p class="mut sm">自動では毎月、欠員のポストに階級と適性の合う幹部を充てる。すでに就いている幹部を外すことはない。</p></section>
  ${P.rep.length?`<section class="sec"><h2>直近の定期異動</h2>${P.rep.map(l=>`<p class="sm">${l}</p>`).join('')}</section>`:''}`;};
function orow(o,posts,attr){const p=o.post&&posts[o.post];
  return `<div class="orow w" ${attr}><div><b>${o.name}</b> <span class="tag">${RANK[o.rank]}</span> <small class="mut">${SPEC[o.sp]}・${o.age}歳${o.tr.length?'・'+o.tr.map(t=>TRN[t][1]).join('・'):''}</small></div><div class="o2"><small class="${p?'b':o.sch?'am':'mut'}">${p?(p.u?p.u.name+' ':'')+p.n:o.sch?COURSE.find(c=>c[0]===o.sch.k)[1]+'に派遣中':'待命'}</small><div class="os">${ABK.map(k=>`<span>${ABN[k][0]}<b>${o[k]}</b></span>`).join('')}</div></div></div>`;}
PV.roster=()=>{const F=ui.of,L=S.off.filter(o=>(F.rank<0||o.rank===F.rank)&&(F.spec<0||o.sp===F.spec)&&(!F.free||(!o.post&&!o.sch)));
  L.sort((a,b)=>b.rank-a.rank||b.merit-a.merit);const per=15,pages=Math.max(1,Math.ceil(L.length/per));F.page=clamp(F.page,0,pages-1);const posts={};for(const p of allPosts())posts[p.id]=p;
  let h=`<section class="sec"><h2>幹部名簿 ${L.length}名</h2><div class="flt"><select onchange="A.of('rank',+this.value)" aria-label="階級で絞る"><option value="-1">全階級</option>${RANK.map((n,i)=>`<option value="${i}" ${F.rank===i?'selected':''}>${n}</option>`).join('')}</select><select onchange="A.of('spec',+this.value)" aria-label="職種で絞る"><option value="-1">全職種</option>${SPEC.map((n,i)=>`<option value="${i}" ${F.spec===i?'selected':''}>${n}</option>`).join('')}</select><label class="chk"><input type="checkbox" ${F.free?'checked':''} onchange="A.of('free',this.checked?1:0)">待命のみ</label></div>
  <p class="sm mut">数字は左から 指揮・攻撃・防空・対潜・技術・管理・沈着(20が最高)。タップで詳細。</p>`;
  for(const o of L.slice(F.page*per,F.page*per+per))h+=orow(o,posts,`onclick="A.off(${o.id})"`);
  return h+`<div class="pager"><button class="btn sm" ${F.page<=0?'disabled':''} onclick="A.of('page',${F.page-1})">前へ</button><span>${F.page+1}／${pages}</span><button class="btn sm" ${F.page>=pages-1?'disabled':''} onclick="A.of('page',${F.page+1})">次へ</button></div></section>`;};
PV.posts=()=>{const pm=postMap(),all=allPosts(),groups=[['hq','司令部'],['org','研究所・学校・基地']].concat(S.units.filter(u=>PT[u.type].crew>0).map(u=>['u'+u.id,u.name]));if(!groups.some(x=>x[0]===ui.pg))ui.pg='hq';
  let h=`<section class="sec"><h2>補職</h2><div class="flt"><select onchange="A.pg(this.value)" aria-label="部署を選ぶ">${groups.map(x=>{const v=all.filter(p=>p.g===x[0]&&!pm[p.id]).length;return `<option value="${x[0]}" ${ui.pg===x[0]?'selected':''}>${x[1]}${v?`(欠員${v})`:''}</option>`;}).join('')}</select></div>`;
  for(const p of all.filter(p=>p.g===ui.pg)){const o=pm[p.id],d=p.d||PD[p.k]||'';
    h+=`<div class="orow" onclick="A.post('${p.id}')"><div><b>${p.n}</b> <small class="mut">${RANK[p.rk[0]]}〜${RANK[p.rk[1]]}</small><br><small>${oname(o)}</small><br><small class="mut">${d}</small></div><div class="os">${o?`<span>${ABN[p.ab]}<b>${effAb(o,p.ab)}</b></span>`:`<span>${ABN[p.ab]}</span>`}</div></div>`;}
  return h+`<p class="mut sm">ポストをタップすると、候補者から選んで任命できる。欠員のポストは能力6相当として扱われる。</p></section>`;};
PV.enl=()=>{const rq=reqRates(),P=S.pers,pend={};for(const p of P.pipe)pend[p.r]=(pend[p.r]||0)+p.n;
  let h=`<section class="sec"><h2>曹士 ${enlTotal().toLocaleString()}名</h2><p class="sm mut">職種ごとの充足と技能が、それぞれの能力に効く。定員を割ると下がり、技能が60を超えると上がる。</p>`;
  for(const r of RATE){const e=S.enl[r[0]],need=rq[r[0]],f=need?e.n/need:1;
    h+=`<div class="erow"><div><b>${r[1]}</b><br><small class="mut">${STAT[r[2]][0]}</small></div><div class="en">${e.n}／${need}${pend[r[0]]?` <small class="b">+${pend[r[0]]}</small>`:''}${bar(f*100,f<.85?'r':f<.95?'am':'g')}</div><div class="sk">技能<b>${Math.round(e.sk)}</b></div></div>`;}
  const opt=RATE.map(r=>`<option value="${r[0]}">${r[1]}</option>`).join('');
  return h+`</section><section class="sec"><h2>配分と転換</h2><div class="urow"><label>新隊員</label><select onchange="A.pol(this.value)" aria-label="新隊員の配分"><option value="auto">不足の大きい職種へ自動で配分</option>${RATE.map(r=>`<option value="${r[0]}" ${P.pol===r[0]?'selected':''}>${r[1]}に半数を回す</option>`).join('')}</select></div>
  <div class="urow"><label>職種転換</label><select id="tf" aria-label="転換元">${opt}</select><span>→</span><select id="tt" aria-label="転換先">${opt}</select><button class="btn sm" onclick="A.transfer()">20名</button></div><p class="mut sm">転換した隊員は、移った先の平均技能を下げる。</p></section>`;};
PV.edu=()=>{const inS=S.off.filter(o=>o.sch);
  return `<section class="sec"><h2>課程</h2>${COURSE.map(c=>`<div class="item"><div class="uh"><b>${c[1]}</b><span class="loc">${c[2]}か月・${c[3]*c[2]}億円</span></div><p class="sm mut">${Object.keys(c[4]).map(k=>ABN[k]+'+'+c[4][k]).join('、')}。対象は${RANK[c[5][0]]}〜${RANK[c[5][1]]}。派遣中 ${inS.filter(o=>o.sch.k===c[0]).length}名</p></div>`).join('')}<p class="mut sm">派遣は「幹部名簿」で幹部を選んで行う。派遣中はポストに就けない。</p></section>
  <section class="sec"><h2>施策</h2><div class="mbtn"><button class="btn sm" onclick="A.recruit()">緊急募集(60億円、3か月後に35名)</button><button class="btn sm" onclick="A.rest()">休養と福利厚生(50億円、士気+6)</button><button class="btn sm" onclick="A.reserve()">予備自衛官を招集(80億円、6か月間)</button><button class="btn sm" onclick="A.addOff()">幹部の中途採用(40億円、尉官3名)</button></div></section>`;};

/* ---------- 開発 ---------- */
const RV={};
VIEW.rd=()=>subtabs('rd',[['labs','研究所'],['tree','技術'],['proj','装備開発'],['fx','効果']])+RV[ui.sub.rd]();
RV.labs=()=>{const pm=postMap();let tot=0,h='';
  for(const l of S.labs){const T=LABT[l.t],rp=labRP(l),o=pm['lab:'+l.id],cur=l.cur&&lineById[l.cur],wide=T.d.length>6;tot+=rp;let cl;
    if(cur){const r=S.res[cur[0]]||{lv:0,prog:0},c=lineCost(cur,r.lv+1);cl=`<div class="cur"><b>${cur[1]}　${r.lv} → ${r.lv+1}</b><span class="sm">${Math.round(r.prog)}／${c} RP　${STAT[cur[3]][0]} ${fmtEff(cur[3],cur[4])}</span>${bar(r.prog/c*100,'')}<small class="mut">あと約 ${rp>0?Math.max(1,Math.ceil((c-r.prog)/rp)):'∞'} か月</small></div>`;}
    else cl=`<p class="al am">${l.auto?'来月から自動で課題を選ぶ':'課題が決まっていない'}</p>`;
    h+=`<div class="unit"><div class="uh"><b>${T.n}</b><small>規模${l.lv}</small><span class="loc">${Math.round(rp)} RP／月</span></div><p class="sm mut">担当：${wide?'全分野(効率60%)':T.d.map(d=>DOM[d]).join('、')}　所長：${o?o.name+' '+RANK[o.rank]:'欠員'}</p>${cl}
      <div class="urow"><label>課題</label><button class="btn sm" onclick="A.labPick(${l.id})">選ぶ</button>${seg([[true,'自動'],[false,'固定']],l.auto,v=>`A.labAuto(${l.id},${v})`)}</div>
      ${l.auto&&!wide?`<div class="urow"><label>重点</label>${seg([[-1,'全担当']].concat(T.d.map(d=>[d,DOM[d]])),l.foc,v=>`A.labFoc(${l.id},${v})`)}</div>`:''}
      <div class="urow"><label>研究費</label>${seg(LV.map((n,i)=>[i,n]),l.fund,v=>`A.labFund(${l.id},${v})`)}</div>
      <div class="urow"><label></label><span class="grow sm mut">月 ${Math.round(labCost(l))}億円</span>${l.lv<5?`<button class="btn sm" onclick="A.labUp(${l.id})">増強する(${250*l.lv}億円)</button>`:''}</div></div>`;}
  const free=LABT.map((t,i)=>i).filter(i=>!S.labs.some(l=>l.t===i)&&!S.orders.some(o=>o.kind==='lab'&&o.t===i));
  return `<section class="sec"><h2>研究所 ${S.labs.length}か所</h2><p class="sm mut">合計 ${Math.round(tot)} RP／月。「自動」は担当分野でいちばん安い課題から順に進め、「固定」は選んだ系統を上限まで続ける。</p>${h}</section>
  ${free.length?`<section class="sec"><h2>新設</h2><div class="mbtn">${free.map(i=>`<button class="btn sm" onclick="A.labNew(${i})">${LABT[i].n}(500億円・6か月)</button>`).join('')}</div></section>`:''}`;};
RV.tree=()=>{const d=ui.dom;
  let h=`<section class="sec"><h2>技術　${totalLv()}／${LINE.length*10}段階</h2><div class="chips">${DOM.map((n,i)=>`<button class="${d===i?'on':''}" onclick="A.dom(${i})">${n}<small>${LINE.filter(l=>l[2]===i).reduce((a,l)=>a+lvOf(l[0]),0)}</small></button>`).join('')}</div>`;
  for(const l of LINE.filter(l=>l[2]===d)){const lv=lvOf(l[0]),lab=S.labs.find(x=>x.cur===l[0]);
    h+=`<div class="item"><div class="uh"><b>${l[1]}</b><span class="loc">${lv}／10</span></div><div class="pips">${'<i class="on"></i>'.repeat(lv)}${'<i></i>'.repeat(10-lv)}</div><p class="sm mut">${STAT[l[3]][0]}　1段階ごとに ${fmtEff(l[3],l[4])}${lv?`、現在 ${fmtEff(l[3],l[4]*lv)}`:''}${lv<10?`　次は ${lineCost(l,lv+1)} RP`:''}${lab?`　<span class="b">${LABT[lab.t].n}が研究中</span>`:''}</p></div>`;}
  return h+'</section>';};
RV.proj=()=>{const ord=p=>S.projs[p.k]?0:projOK(p)?1:S.flags[p.k]?3:2;
  let h=`<section class="sec"><h2>装備開発計画</h2><p class="sm mut">必要な技術が揃うと着手できる。構想・試作・試験の3段階を経て完成する。費用は各段階に入るときに支払う。</p>`;
  for(const p of PROJ.slice().sort((a,b)=>ord(a)-ord(b))){const pj=S.projs[p.k],done=S.flags[p.k],ok=projOK(p),kd=p.kind==='unit'?'新艦種':p.kind==='kit'?'改修キット':'全軍に配備';
    const req=Object.keys(p.req).map(k=>`<span class="${lvOf(k)>=p.req[k]?'g':'am'}">${lineById[k][1]} ${lvOf(k)}/${p.req[k]}</span>`).join('、')||'なし';
    const eff=p.fx?Object.keys(p.fx).map(k=>`${STAT[k][0]} ${fmtEff(k,p.fx[k])}`).join('、'):p.kind==='unit'?PT[p.k].d:KIT[p.k].d;
    h+=`<div class="item"><div class="uh"><b>${p.n}</b><small>${kd}</small><span class="loc">${p.c.reduce((a,b)=>a+b,0)}億円／${p.t.reduce((a,b)=>a+b,0)}か月</span></div><p class="sm">${eff}</p><p class="sm mut">必要な技術：${req}</p>
      ${done?'<span class="g sm">完了</span>':pj?`<div class="cur"><span class="sm">${PHASE[pj.ph]}の段階　${pj.wait?'<b class="am">資金待ち</b>':`あと${pj.left}か月`}</span>${bar((pj.ph+(pj.wait?0:1-pj.left/Math.max(pj.left,p.t[pj.ph])))/3*100,'')}</div>`:ok?`<button class="btn sm" onclick="A.proj('${p.k}')">着手する(まず構想に ${p.c[0]}億円)</button>`:''}</div>`;}
  return h+'</section>';};
RV.fx=()=>{const M=mods();let h=`<section class="sec"><h2>全軍に効いている補正</h2><p class="sm mut">研究、開発計画、予算、幕僚、曹士の充足と技能を合算した値。緑は有利、赤は不利。</p><dl class="kv">`,n=0;
  for(const k in STAT){const v=M[k];if(Math.abs(v)<1e-4)continue;n++;h+=`<dt>${STAT[k][0]}</dt><dd class="${v>0?'g':'r'}">${fmtEff(k,v)}</dd>`;}
  return h+`</dl>${n?'':'<p class="sm mut">いまは補正なし</p>'}</section>`;};

/* ---------- 予算 ---------- */
const BV={};
VIEW.bud=()=>subtabs('bud',[['alloc','配分'],['nego','折衝'],['ledger','台帳'],['debt','契約']])+BV[ui.sub.bud]();
const suppAmt=()=>Math.round(S.budget*(.05+S.tension/1000)/10)*10;
BV.alloc=()=>{const inc=income(),up=upkeep(),cc=BCAT.map((_,c)=>catCost(c)),debt=debtPay(),tot=up+cc.reduce((a,b)=>a+b,0)+debt,c=ui.bcat;
  let h=`<section class="sec"><h2>月次収支</h2><dl class="kv"><dt>防衛予算(月割)</dt><dd class="g">+${inc}</dd><dt>部隊の維持費</dt><dd>−${Math.round(up)}</dd>${BCAT.map((n,i)=>`<dt>${n}</dt><dd>−${Math.round(cc[i])}</dd>`).join('')}${debt?`<dt>分割払い</dt><dd>−${Math.round(debt)}</dd>`:''}<dt>差引(調達や開発に回せる額)</dt><dd class="${inc-tot<0?'r':'g'}">${sg(Math.round(inc-tot))} 億円</dd></dl></section>
  <section class="sec"><h2>費目の配分</h2><div class="chips">${BCAT.map((n,i)=>`<button class="${c===i?'on':''}" onclick="A.bcat(${i})">${n}<small>${Math.round(cc[i])}</small></button>`).join('')}</div>
  <div class="brow"><span class="sm mut">この分野をまとめて</span>${[1,2,3].map(L=>`<button class="btn sm" onclick="A.budCat(${c},${L})">${LV[L]}</button>`).join('')}</div>`;
  BITEM.forEach((b,i)=>{if(b[1]!==c)return;const L=S.bud[i],e=b[5]*(L-2);
    h+=`<div class="item"><div class="uh"><b>${b[0]}</b><span class="loc">月 ${itemCost(i).toFixed(1)}億円</span></div><p class="sm mut">${STAT[b[4]][0]}　<span class="${e>0?'g':e<0?'r':''}">${e?fmtEff(b[4],e):'標準'}</span></p>${seg(LV.map((n,j)=>[j,n]),L,v=>`A.bud(${i},${v})`)}</div>`;});
  if(c===4)h+=`<p class="sm mut">各研究所の研究費(計 月${Math.round(S.labs.reduce((a,l)=>a+labCost(l),0))}億円)は「開発」の研究所ごとに決める。</p>`;
  return h+'</section>';};
BV.nego=()=>{const left=12-S.month%12,ex=S.cfg.sandbox?0:Math.max(0,S.funds-S.budget*.25);
  return `<section class="sec"><h2>今年度の予算</h2><dl class="kv"><dt>年度予算</dt><dd>${S.budget.toLocaleString()} 億円</dd><dt>次の改定まで</dt><dd>${left}か月</dd><dt>使い残し</dt><dd class="${ex>0?'am':''}">${ex>0?`基準を ${Math.round(ex)}億円 超過`:'基準内'}</dd>${ex>0?`<dt>このままなら来年度</dt><dd class="am">${Math.round(ex*.3)}億円の査定減</dd>`:''}</dl>
  <p class="sm mut">年度末に資金が年度予算の25%を超えて残っていると、超えた分の3割が来年度の予算から削られる。予算は緊張度、支持率、戦績でも増減し、年度替わりには増額を折衝できる。</p></section>
  <section class="sec"><h2>補正予算</h2><p class="sm">情勢の悪化を理由に、年度の途中で追加の予算を求める。年度に1回だけ。</p><dl class="kv"><dt>見込み額</dt><dd>${suppAmt()} 億円</dd><dt>成算</dt><dd>${Math.round(suppChance()*100)}%</dd></dl><div class="brow"><button class="btn sm" ${S.fySupp?'disabled':''} onclick="A.supp()">${S.fySupp?'今年度は要求済み':'補正予算を要求する'}</button></div><p class="sm mut">緊張度が高いほど、また艦を失った直後ほど通りやすい。退けられると支持率が下がる。</p></section>`;};
BV.ledger=()=>{const L=S.ledger.slice(-24);if(!L.length)return `<section class="sec"><h2>台帳</h2><p class="mut sm">翌月から記録される</p></section>`;
  const mx=Math.max(1,...L.map(x=>Math.abs(x.f))),w=300/L.length;
  const svg=`<svg viewBox="0 0 300 90" class="smap" role="img" aria-label="資金残高の推移">${L.map((x,i)=>{const hh=Math.abs(x.f)/mx*40;return `<rect x="${(i*w+1).toFixed(1)}" y="${(x.f>=0?45-hh:45).toFixed(1)}" width="${Math.max(1,w-2).toFixed(1)}" height="${hh.toFixed(1)}" fill="${x.f>=0?'#63dba0':'#ff6b5e'}"/>`;}).join('')}<line x1="0" y1="45" x2="300" y2="45" stroke="#24445c"/></svg>`;
  return `<section class="sec"><h2>資金残高の推移(直近${L.length}か月)</h2>${svg}<table class="tb"><tr><th>月</th><th>収入</th><th>経常</th><th>臨時</th><th>残高</th></tr>${L.slice(-12).reverse().map(x=>`<tr><td>${dateStr(x.m).slice(2)}</td><td>${x.inc}</td><td>${x.up+x.cc.reduce((a,b)=>a+b,0)+x.debt}</td><td>${x.ext}</td><td class="${x.f<0?'r':''}">${x.f.toLocaleString()}</td></tr>`).join('')}</table><p class="sm mut">経常は維持費・費目・分割払いの合計。臨時は調達、開発計画、改修などの一時金。</p></section>`;};
BV.debt=()=>`<section class="sec"><h2>分割払いの契約</h2>${S.debts.length?S.debts.map(d=>`<div class="drow"><div style="flex:1">${d.n}</div><div class="mut">月 ${d.per}億円 × あと${d.left}か月</div></div>`).join(''):'<p class="mut sm">分割払いの契約はない</p>'}<dl class="kv"><dt>月額の合計</dt><dd>${Math.round(debtPay())} 億円</dd><dt>上限(月収の35%)</dt><dd>${Math.round(income()*.35)} 億円</dd></dl><p class="sm mut">400億円以上の調達は分割にできる。総額は8%増える。</p></section>`;

/* ---------- 司令部の操作 ---------- */
const A={
  help:showHelp,
  sub(t,s){ui.sub[t]=s;render();},dom(i){ui.dom=i;render();},bcat(i){ui.bcat=i;render();},pg(v){ui.pg=v;render();},
  of(k,v){ui.of[k]=v;if(k!=='page')ui.of.page=0;render();},
  bud(i,v){S.bud[i]=v;save();render();},
  budCat(c,L){BITEM.forEach((b,i)=>{if(b[1]===c)S.bud[i]=L;});save();render();},
  air(id,k,d){const u=U(id);if(!u)return;const mx=k==='ftr'?ftrCap(u):aewCap(u);
    if(d>0){if(S.pool[k]<1)return toast('予備機がない。「調達」で発注を');if(u[k]>=mx)return toast('これ以上は積めない');S.pool[k]--;u[k]++;}
    else{if(u[k]<1)return;u[k]--;S.pool[k]++;}save();render();},
  gopost(id){ui.tab='pers';ui.sub.pers='posts';ui.pg='u'+id;render();window.scrollTo(0,0);},
  buy(k){const t=PT[k],s=SHOPX[k],cost=price(k),build=buildMo(k),n=t?t.n:s.n;
    const place=inst=>{if(inst)S.debts.push({n,per:Math.ceil(cost*1.08/build),left:build});else{if(!canPay(cost))return toast('資金が足りない');spend(cost);}
      S.orders.push({k,kind:t?'unit':s.kind,n,due:S.month+build,q:s?s.q:0});hlog(`発注：${n}${inst?'(分割払い)':''}`,'');save();render();toast(`${n}を発注した`);};
    if(cost<400)return place(false);
    const per=Math.ceil(cost*1.08/build),ok=debtPay()+per<=income()*.35;
    modal(`<h2>${n}を発注</h2><p>価格 ${cost.toLocaleString()}億円。納入は${build}か月後。</p><dl class="kv2"><dt>一括払い</dt><dd>いま ${cost.toLocaleString()}億円</dd><dt>分割払い</dt><dd>月 ${per}億円 × ${build}か月(総額 +8%)</dd></dl>${ok?'':'<p class="sm am">分割払いの月額合計が月収の35%を超えるので、これ以上は組めない。</p>'}<div class="mbtn"><button class="btn pri" data-m="a" ${canPay(cost)?'':'disabled'}>一括で発注する</button><button class="btn" data-m="b" ${ok?'':'disabled'}>分割で発注する</button><button class="btn" data-m="n">やめる</button></div>`,{a:()=>{closeModal();place(false);},b:()=>{closeModal();place(true);},n:closeModal});},
  kit(id){const u=U(id);if(!u)return;const t=PT[u.type],ks=Object.keys(S.kits).filter(k=>KIT[k].ok(t)&&!u.mods.includes(k)),cbs={x:closeModal,sc:()=>{closeModal();confirmM(`${u.name}を除籍する。艦は戻らない。`,()=>{S.units=S.units.filter(x=>x!==u);hlog(`${u.name}を除籍`,'');cleanPosts();save();render();},'除籍する');}};
    let h=`<div class="alert">${t.n}</div><h2>${u.name}の改修</h2><p class="sm">取り付け済み：${u.mods.length?u.mods.map(k=>KIT[k].n).join('、'):'なし'}</p>`;
    if(u.refit)h+=`<p class="al am">${KIT[u.refit.k].n}を改修中。あと${u.refit.left}か月</p>`;
    else if(!ks.length)h+=`<p class="sm mut">取り付けられるキットがない。「開発」の装備開発計画で改修キットを完成させると、ここに並ぶ。</p>`;
    else for(const k of ks){const K=KIT[k];cbs['k_'+k]=()=>{closeModal();A.refit(id,k);};h+=`<div class="item"><div class="uh"><b>${K.n}</b><span class="loc">${K.cost}億円／ドック${K.mo}か月</span></div><p class="sm mut">${K.d}</p><button class="btn sm" data-m="k_${k}" ${canPay(K.cost)?'':'disabled'}>取り付ける</button></div>`;}
    modal(h+`<div class="mbtn"><button class="btn warn" data-m="sc">この艦を除籍する</button><button class="btn pri" data-m="x">閉じる</button></div>`,cbs);},
  refit(id,k){const u=U(id),K=KIT[k];if(!u||u.refit||!canPay(K.cost))return;spend(K.cost);u.refit={k,left:K.mo};u.mode='dock';hlog(`${u.name}：${K.n}の改修に着手`,'');save();render();toast('ドックに入れた');},
  // 開発
  labPick(id){const l=S.labs.find(x=>x.id===id);if(!l)return;const T=LABT[l.t],cbs={x:closeModal};let h=`<div class="alert">${Math.round(labRP(l))} RP／月</div><h2>${T.n}の課題</h2>`;
    for(const d of T.d){h+=`<h3 class="sub">${DOM[d]}</h3>`;for(const ln of LINE.filter(x=>x[2]===d)){const lv=lvOf(ln[0]),busy=S.labs.some(x=>x!==l&&x.cur===ln[0]);cbs['l_'+ln[0]]=()=>{closeModal();l.cur=ln[0];l.auto=false;save();render();};
        h+=`<div class="orow ${lv>=10||busy?'dis':''}" ${lv>=10||busy?'':`data-m="l_${ln[0]}"`}><div><b>${ln[1]}</b> <small class="mut">${lv}／10</small><br><small class="mut">${STAT[ln[3]][0]} ${fmtEff(ln[3],ln[4])}${busy?'　他の研究所が研究中':''}</small></div><div class="os"><span>${lv>=10?'完了':lineCost(ln,lv+1)+' RP'}</span></div></div>`;}}
    modal(h+`<div class="mbtn"><button class="btn pri" data-m="x">閉じる</button></div>`,cbs);},
  labAuto(id,v){const l=S.labs.find(x=>x.id===id);if(l){l.auto=v;save();render();}},
  labFoc(id,v){const l=S.labs.find(x=>x.id===id);if(l){l.foc=v;l.cur=null;save();render();}},
  labFund(id,v){const l=S.labs.find(x=>x.id===id);if(l){l.fund=v;save();render();}},
  labUp(id){const l=S.labs.find(x=>x.id===id);if(!l||l.lv>=5)return;const c=250*l.lv;if(!canPay(c))return toast('資金が足りない');spend(c);l.lv++;hlog(`${LABT[l.t].n}を増強(規模${l.lv})`,'');save();render();},
  labNew(t){if(!canPay(500))return toast('資金が足りない');spend(500);S.orders.push({k:'lab',kind:'lab',t,n:LABT[t].n+'の新設',due:S.month+6});hlog(`${LABT[t].n}の新設に着手`,'');save();render();},
  proj(k){const p=PROJ.find(x=>x.k===k);if(!p||!projOK(p))return;if(!canPay(p.c[0]))return toast('資金が足りない');spend(p.c[0]);S.projs[k]={ph:0,left:p.t[0],wait:false,rolled:false};hlog(`開発計画に着手：${p.n}`,'b');save();render();},
  // 人事
  pauto(v){S.pers.auto=v;save();render();},
  assignNow(){cleanPosts();const n=autoAssign();save();render();toast(n?`${n}のポストを埋めた`:'充てられる幹部がいない');},
  pol(v){S.pers.pol=v;save();},
  transfer(){const a=$('#tf').value,b=$('#tt').value;if(a===b)return;const x=S.enl[a],y=S.enl[b],n=Math.min(20,x.n);if(n<=0)return;x.n-=n;y.sk=(y.sk*y.n+35*n)/(y.n+n);y.n+=n;save();render();toast(`${n}名を転換した`);},
  recruit(){if(!canPay(60))return toast('資金が足りない');spend(60);distribute(35,S.month+3);save();render();toast('緊急募集を実施した');},
  rest(){if(S.restM===S.month)return toast('今月はすでに実施した');if(!canPay(50))return toast('資金が足りない');spend(50);S.restM=S.month;S.pers.morale=Math.min(100,S.pers.morale+6);save();render();toast('士気が上がった');},
  reserve(){const P=S.pers;if(P.resv)return toast('すでに招集している');if(!canPay(80))return toast('資金が足りない');spend(80);const rq=reqRates(),tot=reqPers(),n=Math.round(tot*.04*(1+clamp(mods().reserve,-.6,1.5)));
    for(const r of RATE)S.enl[r[0]].n+=Math.round(n*(rq[r[0]]||0)/tot);P.resv=n;P.resvEnd=S.month+6;S.support=clamp(S.support-1,0,100);hlog(`予備自衛官 ${n}名を招集`,'');save();render();toast(`${n}名を招集した`);},
  addOff(){if(!canPay(40))return toast('資金が足りない');spend(40);for(let i=0;i<3;i++)genOff(RI(0,2));save();render();toast('尉官3名を採用した');},
  off(id){const o=S.off.find(x=>x.id===id);if(!o)return;const posts={};for(const p of allPosts())posts[p.id]=p;const p=o.post&&posts[o.post],pg=o.pot>=18?'A':o.pot>=15?'B':o.pot>=13?'C':'D',cbs={x:closeModal};
    for(const c of COURSE)cbs['c_'+c[0]]=()=>{closeModal();A.course(id,c[0]);};
    cbs.pro=()=>{closeModal();o.rank++;o.tig=0;o.sat=Math.min(100,o.sat+20);S.pers.sp++;hlog(`${o.name}を${RANK[o.rank]}に特別昇任`,'');cleanPosts();save();render();};
    cbs.aw=()=>{closeModal();if(!canPay(5))return toast('資金が足りない');spend(5);o.sat=Math.min(100,o.sat+20);o.merit+=5;save();render();toast('表彰した');};
    cbs.dis=()=>{closeModal();confirmM(`${o.name} ${RANK[o.rank]}に退職を勧める。`,()=>{S.off=S.off.filter(x=>x!==o);save();render();},'退職させる');};
    modal(`<div class="alert">${SPEC[o.sp]}・${o.age}歳・在級${o.tig}年</div><h2>${o.name} ${RANK[o.rank]}</h2><p class="sm">${p?'現職：'+(p.u?p.u.name+' ':'')+p.n:o.sch?'課程に派遣中':'待命'}</p><p class="sm mut">功績 ${Math.round(o.merit)}　実戦 ${o.bt}回　満足度 ${Math.round(o.sat)}　素質 ${pg}</p>
    <div class="abl">${ABK.map(k=>`<div><label>${ABN[k]} ${o[k]}</label>${bar(o[k]*5,'b')}</div>`).join('')}</div>
    ${o.tr.length?o.tr.map(t=>`<p class="sm"><b class="am">${TRN[t][1]}</b>　${TRN[t][2]}</p>`).join(''):'<p class="sm mut">特性なし</p>'}
    <h3 class="sub">課程へ派遣</h3><div class="mbtn">${COURSE.map(c=>`<button class="btn sm" data-m="c_${c[0]}" ${o.sch||o.rank<c[5][0]||o.rank>c[5][1]?'disabled':''}>${c[1]}(${c[2]}か月・${c[3]*c[2]}億円)</button>`).join('')}</div>
    <div class="mbtn"><button class="btn" data-m="pro" ${o.rank>=7||o.tig<1||S.pers.sp>=3||o.sch?'disabled':''}>特別昇任(今年度あと${Math.max(0,3-S.pers.sp)}回)</button><button class="btn" data-m="aw">表彰する(5億円)</button><button class="btn warn" data-m="dis">退職を勧める</button><button class="btn pri" data-m="x">閉じる</button></div>`,cbs);},
  course(id,k){const o=S.off.find(x=>x.id===id),c=COURSE.find(x=>x[0]===k);if(!o||o.sch)return;const cost=c[3]*c[2];if(!canPay(cost))return toast('資金が足りない');spend(cost);o.sch={k,until:S.month+c[2]};o.post=null;save();render();toast(`${c[1]}へ派遣した`);},
  post(pid){const p=allPosts().find(x=>x.id===pid);if(!p)return;const cur=postMap()[pid],posts={};for(const x of allPosts())posts[x.id]=x;
    const c=S.off.filter(o=>o!==cur&&postScore(o,p)>0).sort((a,b)=>postScore(b,p)-postScore(a,p)).slice(0,14),cbs={x:closeModal,un:()=>{closeModal();if(cur){cur.post=null;save();render();}}};
    let h=`<div class="alert">${p.u?p.u.name:p.g==='hq'?'司令部':'研究所・学校・基地'}</div><h2>${p.n}</h2><p class="sm">現職：${cur?`${cur.name} ${RANK[cur.rank]}(${ABN[p.ab]} ${effAb(cur,p.ab)})`:'欠員'}</p><p class="sm mut">効く能力は${ABN[p.ab]}。${p.d||PD[p.k]||''}</p>`;
    for(const o of c){cbs['o'+o.id]=()=>{closeModal();A.setPost(pid,o.id);};const op=o.post&&posts[o.post];
      h+=`<div class="orow" data-m="o${o.id}"><div><b>${o.name}</b> <span class="tag">${RANK[o.rank]}</span> <small class="mut">${SPEC[o.sp]}${o.tr.length?'・'+o.tr.map(t=>TRN[t][1]).join('・'):''}</small><br><small class="${op?'am':'mut'}">${op?'現：'+(op.u?op.u.name+' ':'')+op.n:'待命'}</small></div><div class="os"><span>${ABN[p.ab]}<b>${effAb(o,p.ab)}</b></span></div></div>`;}
    if(!c.length)h+='<p class="sm mut">階級の合う候補者がいない</p>';
    modal(h+`<div class="mbtn">${cur?'<button class="btn" data-m="un">解任して欠員にする</button>':''}<button class="btn pri" data-m="x">閉じる</button></div>`,cbs);},
  setPost(pid,oid){const o=S.off.find(x=>x.id===oid),cur=postMap()[pid];if(!o)return;if(cur)cur.post=null;o.post=pid;o.sat=Math.min(100,o.sat+5);save();render();},
  // 予算
  ask(a){closeModal();if(Math.random()<askChance(a)){S.budget=Math.round(S.budget*(1+a)/10)*10;hlog(`予算折衝：${Math.round(a*100)}%の増額を獲得`,'g');toast('増額が認められた');}
    else{S.budget=Math.round(S.budget*.98/10)*10;S.support=clamp(S.support-2,0,100);hlog('予算折衝：増額要求は退けられた','r');toast('増額要求は退けられた');}S.fyAsk=1;save();render();},
  supp(){if(S.fySupp)return;S.fySupp=1;if(Math.random()<suppChance()){const a=suppAmt();S.funds+=a;hlog(`補正予算 ${a}億円が成立`,'g');toast(`補正予算 ${a}億円が成立した`);}else{S.support=clamp(S.support-2,0,100);hlog('補正予算の要求は退けられた','r');toast('補正予算は退けられた');}save();render();},
  drill(){const L=1.6;startBattle({drill:true,sector:0,type:'landing',L,eT:eTech(),force:genForce('landing',L,0)});},
  reset(){confirmM('いまの任期を離れて、タイトルに戻る。進行は保存されている。',()=>showTitle(),'タイトルへ');},
  // カスタムスタート
  cs(k,d,min,max){ui.cs[k]=clamp(ui.cs[k]+d,min,max);showSetup();},
  csf(k,d,max){ui.cs.fleet[k]=clamp((ui.cs.fleet[k]||0)+d,0,max);showSetup();},
  css(k,v){ui.cs[k]=v;showSetup();},
  csp(i){const keep={cmdr:ui.cs.cmdr,nation:ui.cs.nation,fleetName:ui.cs.fleetName,nat:ui.cs.nat,riv:ui.cs.riv},p=PRESET[i][1];ui.cs=Object.assign(JSON.parse(JSON.stringify(DEFCFG)),JSON.parse(JSON.stringify(p)),keep);ui.cs.fleet=Object.assign({},DEFCFG.fleet,p.fleet||{});ui.cs.gnd=Object.assign({},DEFCFG.gnd,p.gnd||{});showSetup();}
};
window.A=A;
