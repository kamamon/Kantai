/* ---------- 画面：開発 → 装備 ---------- */
function eqCard(s){const e=EQS[s],c=eqCur(s),busy=eqBusy(s),need=d=>EQ_NEED[d];let h=`<div class="item"><div class="uh"><b>${e[1]}</b>${genTag(c.g)}</div><p class="sm">配備中：<b>${eqLabel(s)}</b><br><span class="mut">${c.m[2]}</span></p><p class="sm">${fxText(eqFx(s,c.i))}</p>`;
  if(busy){const p=PROJ.find(x=>x.k===busy),pj=S.projs[busy];h+=`<div class="cur"><span class="sm">開発中：<b>${p.n}</b>　${PHASE[pj.ph]}の段階　${pj.wait?'<b class="am">資金待ち</b>':`あと${pj.left}か月`}</span>${bar((pj.ph+(pj.wait?0:1-pj.left/Math.max(pj.left,p.t[pj.ph])))/3*100,'')}</div>`;}
  const cand=e[5].map((m,i)=>({m,i})).filter(x=>x.i!==c.i&&!S.flags[eqKey(s,x.i)]&&(x.m[0]>c.g||(x.m[0]===c.g&&x.m[0]>=4)));let shown=0,locked=0;
  for(const x of cand){const p=PROJ.find(q=>q.k===eqKey(s,x.i)),have=domLv(e[2]),nd=need(x.m[0]),ok=have>=nd;if(!ok&&locked++)continue;if(shown++>=3)break;
    const diff={},a=eqFx(s,x.i),b=eqFx(s,c.i);for(const k in a)diff[k]=a[k]-(b[k]||0);for(const k in b)if(!(k in a))diff[k]=-b[k];
    h+=`<div class="eqn"><div class="uh"><b>${x.m[1]}</b>${genTag(x.m[0])}<span class="loc">${p.c.reduce((u,v)=>u+v,0)}億円／${p.t.reduce((u,v)=>u+v,0)}か月</span></div><p class="sm mut">${x.m[2]}</p><p class="sm">いまとの差：${fxText(diff)}</p>
      ${ok?(busy?'':`<button class="btn sm" onclick="A.proj('${p.k}')">開発する(まず構想に ${p.c[0]}億円)</button>`):`<p class="sm am">「${DOM[e[2]]}」の研究が合わせて${nd}段階必要(いま${have})</p>`}</div>`;}
  if(!cand.length)h+=`<p class="sm mut">これより新しい機種はまだ構想もない。</p>`;
  return h+`<details class="lin"><summary>系譜(${e[5].length}機種)</summary>${e[5].map((m,i)=>`<div class="sm ${i===c.i?'':'mut'}">${genTag(m[0])} ${m[1]}${i===c.i?'　<b class="g">配備中</b>':m[0]<c.g||S.flags[eqKey(s,i)]?'　退役':''}</div>`).join('')}</details></div>`;}
RV.eqs=()=>{const g=ui.eqg||'air',n=k=>EQSK.filter(s=>EQS[s][0]===k).length,avg=(EQSK.reduce((a,s)=>a+eqCur(s).g,0)/EQSK.length).toFixed(1);
  return `<section class="sec"><h2>装備体系</h2><p class="sm mut">装備は系列ごとに、旧式(G1)から現用(G4)、構想中(G7)までの機種がある。新しい機種は、その分野の研究を進めたうえで開発すると全軍に行き渡る。いまの平均は G${avg}。</p>
  <div class="chips">${EQG.map(x=>`<button class="${g===x[0]?'on':''}" onclick="A.eqg('${x[0]}')">${x[1]}<small>${n(x[0])}</small></button>`).join('')}</div>${EQSK.filter(s=>EQS[s][0]===g).map(eqCard).join('')}</section>`;};
// 一覧(部隊 → 装備、国を選ぶ画面)
function eqTable(get){return EQG.map(x=>`<div class="eqt"><b>${x[1]}</b>${EQSK.filter(s=>EQS[s][0]===x[0]).map(s=>{const m=eqMdl(s,get(s));return `<div class="sm"><span class="mut">${EQS[s][1]}</span>　${m[1]} ${genTag(m[0])}</div>`;}).join('')}</div>`).join('');}
Object.assign(A,{eqg(k){ui.eqg=k;render();}});
