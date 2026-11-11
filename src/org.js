/* ================= 人事：組織図 ================= */
// 司令 → 司令部 → 艦隊 → 艦 → 幹部、の順にたどれる。枠をタップすると候補者が出る
function orgBox(p,pm,cls){const o=pm[p.id],v=o?effAb(o,p.ab):0;
  return `<div class="ob ${o?(v<9?'low':''):'vac'} ${cls||''}" onclick="A.post('${p.id}')" role="button" tabindex="0" aria-label="${p.n}：${o?o.name:'欠員'}"><small>${p.n}</small><b>${o?o.name:'欠員'}</b><span>${o?`${RANK[o.rank]}・${ABN[p.ab]}${v}`:`${RANK[p.rk[0]]}〜${RANK[p.rk[1]]}`}</span></div>`;}
PV.org=()=>{const pm=postMap(),all=allPosts(),by={};for(const p of all)(by[p.g]=by[p.g]||[]).push(p);
  const vn=ps=>ps.filter(p=>!pm[p.id]).length,vb=n=>n?`<em class="vb">欠員${n}</em>`:'',X=ui.orgx=ui.orgx||{},grid=ps=>`<div class="obg">${ps.map(p=>orgBox(p,pm)).join('')}</div>`;
  const hq=by.hq||[],cs=hq.find(p=>p.id==='hq:cs'),staff=hq.filter(p=>p!==cs),org=by.org||[],labs=org.filter(p=>p.id.startsWith('lab:')),base=org.filter(p=>p.id.startsWith('base:')),sch=org.filter(p=>p.id.startsWith('sch:'));
  const ship=u=>{const ps=by['u'+u.id]||[],co=ps.find(p=>p.k==='co'),rest=ps.filter(p=>p!==co),open=X['u'+u.id],v=vn(rest),ic=silSVG(sideKind(PT[u.type]),30,'#9fd0ff');
    if(!ps.length)return `<li><div class="oh2 flat">${ic}<b>${u.name}</b><small>${PT[u.type].n}・無人</small></div></li>`;
    return `<li><div class="orw">${co?orgBox(co,pm):''}<button class="oh2" onclick="A.orgx('u${u.id}')" aria-expanded="${!!open}">${ic}<b>${u.name}</b><small>${PT[u.type].n}</small><span>${open?'▲ 閉じる':'▼ 幹部'+rest.length+'名'}${v?`　<i class="r">欠員${v}</i>`:''}</span></button></div>${open?`<ul><li>${grid(rest)}</li></ul>`:''}</li>`;};
  const fleet=(name,sub,us)=>us.length?`<li><div class="oh">${name}${sub?`<small>${sub}</small>`:''}${vb(us.reduce((a,u)=>a+vn(by['u'+u.id]||[]),0))}</div><ul>${us.map(ship).join('')}</ul></li>`:'';
  const inF=new Set(S.fleets.map(f=>f.id)),loose=S.units.filter(u=>!inF.has(u.fl)),tot=vn(all);
  return `<section class="sec"><h2>組織図</h2><p class="mut sm">枠をタップすると、候補者から選んで任命できる。赤い点線は欠員、黄色は能力が足りていないポスト。艦は名前をタップすると、艦長のほかの幹部が開く。</p>
  <div class="brow"><button class="btn sm" onclick="A.assignNow()">欠員をまとめて埋める${tot?`(${tot})`:''}</button><button class="btn sm" onclick="A.orgAll(1)">すべて開く</button><button class="btn sm" onclick="A.orgAll(0)">すべて閉じる</button></div>
  <ul class="org"><li><div class="ob me"><small>${esc(S.cfg.fleetName)}</small><b>${esc(S.cfg.cmdr)||'司令'}</b><span>あなた</span></div><ul>
    <li><div class="oh">司令部${vb(vn(hq))}</div><ul><li>${cs?orgBox(cs,pm,'wide'):''}<ul><li>${grid(staff)}</li></ul></li></ul></li>
    ${S.fleets.map(f=>fleet(esc(f.n),ZS[f.zone]||SECT[f.zone],flUnits(f))).join('')}${fleet('艦隊に入っていない艦','母港',loose)}
    ${(by.air||[]).length?`<li><div class="oh">航空部隊${vb(vn(by.air))}</div><ul><li>${grid(by.air)}</li></ul></li>`:''}
    <li><div class="oh">基地${vb(vn(base))}</div><ul><li>${grid(base)}</li></ul></li>
    <li><div class="oh">学校${vb(vn(sch))}</div><ul><li>${grid(sch)}</li></ul></li>
    <li><div class="oh">研究所${vb(vn(labs))}</div><ul><li>${grid(labs)}</li></ul></li>
  </ul></li></ul></section>`;};
VIEW.pers=()=>subtabs('pers',[['org','組織図'],['sum','概要'],['roster','名簿'],['posts','補職'],['enl','曹士'],['edu','教育']])+(PV[ui.sub.pers]||PV.org)();
Object.assign(A,{
  orgx(k){const X=ui.orgx=ui.orgx||{};X[k]=!X[k];render();},
  orgAll(v){const X=ui.orgx={};if(v)for(const u of S.units)X['u'+u.id]=true;render();}
});
