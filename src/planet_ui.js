/* ================= 惑星を選ぶ画面と、惑星ごとの国の姿 ================= */
// 地勢の国柄：その惑星での国土・隣国・地形から、国ごとにひとつ決まる。[名称, 説明, 効果]
const GEOT={
  isl:['島国','陸の国境がない。本土が陸から攻め込まれることはない',{intel:.04,rdDecay:.04}],
  tiny:['小さな国','国土が小さく、身軽に動ける',{cost:.05,budg:.03}],
  huge:['広大な国土','人は集まるが、国境が長く、維持の手間も大きい',{recruit:.12,upk:-.03}],
  mtn:['山岳の国','山と丘に守られている',{gndPow:.08}],
  des:['砂漠の国','砂と熱の中で、装備を保たせる術を知る',{rdDecay:.06,ammoC:.04}],
  ice:['極寒の国','寒さに鍛えられ、人が辞めない',{attr:.05,dc:.04}],
  wood:['森の国','森に隠れて戦う術を知る',{gndPow:.04,stealth:.02}],
  land:['四方を囲まれた国','いくつもの国と国境を接し、隣国の動きに敏い',{gndPow:.05,intel:.04}],
  sea:['海洋国家','国土のほとんどが海に面する',{rdRec:.08,spd:.02}],
  plain:['沃野の国','平地が広く、人が多い',{recruit:.07}]
};
// その惑星での国の姿：プロヴィンスと州の数、広さの順位、陸で接する国、主な地形、資源、地勢の国柄
function natGeo(i){const Wd=WORLD||genWorld();if(!Wd.geo){const n=NATS.length,o=NATS.map(()=>({prov:0,cells:0,coast:0,ter:[0,0,0,0,0,0,0,0],nb:new Set(),res:{},pop:0,st:0}));
    for(const p of Wd.P){const g=o[p.nat];g.prov++;g.cells+=p.n;if(p.coast)g.coast++;g.ter[p.ter]+=p.n;for(const a of p.adj)if(Wd.P[a].nat!==p.nat)g.nb.add(Wd.P[a].nat);}
    for(const s of Wd.ST){const g=o[s.nat];g.st++;g.pop+=s.pop;if(s.res)g.res[s.res]=(g.res[s.res]||0)+1;}
    const byC=o.map((g,k)=>k).sort((a,b)=>o[b].cells-o[a].cells),byP=o.map((g,k)=>k).sort((a,b)=>o[b].pop-o[a].pop);
    o.forEach((g,k)=>{g.rank=byC.indexOf(k)+1;g.prank=byP.indexOf(k)+1;g.nb=[...g.nb];const c=Math.max(1,g.cells),sh=t=>g.ter[t]/c;g.main=g.ter.indexOf(Math.max(...g.ter));
      g.k=!g.nb.length?'isl':g.rank>n-8?'tiny':g.rank<=5?'huge':sh(4)+sh(5)>=.36?'mtn':sh(6)>=.4?'des':sh(7)>=.4?'ice':sh(2)+sh(3)>=.5?'wood':g.nb.length>=5?'land':g.coast/Math.max(1,g.prov)>=.6?'sea':'plain';g.t=GEOT[g.k];g.fx=g.t[2];});
    Wd.geo=o;}
  return Wd.geo[i]||Wd.geo[0];}
const natGeoHTML=i=>{const g=natGeo(i),c=Math.max(1,g.cells),ter=g.ter.map((v,t)=>[v/c,t]).filter(x=>x[1]&&x[0]>=.12).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>`${TERN[x[1]]} ${Math.round(x[0]*100)}%`).join('、');
  return `<dt>国土</dt><dd>${g.prov}プロヴィンス・${g.st}州<span class="mut">(広さ ${NATS.length}か国中${g.rank}位、人口 ${g.prank}位)</span></dd><dt>陸で接する国</dt><dd>${g.nb.length?g.nb.length+'か国<span class="mut">('+g.nb.slice(0,5).map(k=>NATS[k].n).join('、')+(g.nb.length>5?' ほか':'')+')</span>':'なし'}</dd><dt>地形</dt><dd class="sm">${ter||'平地'}</dd>
  <dt>資源</dt><dd class="sm">${RES.filter(r=>g.res[r[0]]).map(r=>`${r[1]} ${g.res[r[0]]}州`).join('、')||'<span class="am">採れる州がない</span>'}</dd><dt>地勢</dt><dd><b class="am">${g.t[0]}</b><br><span class="sm">${g.t[1]}。${fxText(g.fx)}</span></dd>`;};
/* ---------- 惑星の条件を文にする ---------- */
function plSitText(k){const p=PLN[k]||PLN[0],s=Object.assign({},PLS0,p.sit),o=[],pc=v=>(v>1?'+':'−')+Math.round(Math.abs(v-1)*100)+'%';
  if(s.budget!==1)o.push(`防衛予算 ${pc(s.budget)}`);if(s.ten)o.push(`緊張度 ${s.ten>0?'+':'−'}${Math.abs(s.ten)}`);if(s.incF!==1)o.push(`海と空の事案 ${pc(s.incF)}`);if(s.eAggr!==1)o.push(`相手の攻撃性 ${pc(s.eAggr)}`);if(s.eGrow!==1)o.push(`相手の軍拡 ${pc(s.eGrow)}`);
  if(s.rivK!==1)o.push(`対峙する国の国力 ${pc(s.rivK)}`);if(s.landK!==1)o.push(`陸の国境の緊張 ${pc(s.landK)}`);if(s.price!==1)o.push(`資源の値 ${pc(s.price)}`);return o;}
const plDots=v=>'●'.repeat(v)+'○'.repeat(5-v);
// いま作ってある世界の統計
function plStat(){const Wd=WORLD;if(Wd.stat)return Wd.stat;let land=0;const tc=[0,0,0,0,0,0,0,0];for(let i=0;i<WN;i++)if(Wd.land[i]===1){land++;tc[Wd.ter[i]]++;}let isl=0,mx=0;for(let i=0;i<NATS.length;i++){const g=natGeo(i);if(!g.nb.length)isl++;if(g.prov>mx)mx=g.prov;}
  return Wd.stat={sea:Math.round(100-land/WN*100),P:Wd.P.length,ST:Wd.ST.length,R:Wd.R.length,isl,mx,res:Math.round(Wd.ST.filter(s=>s.res).length/Wd.ST.length*100),ter:tc.map((v,t)=>[v/Math.max(1,land),t]).filter(x=>x[1]&&x[0]>=.1).sort((a,b)=>b[0]-a[0]).slice(0,4).map(x=>`${TERN[x[1]]} ${Math.round(x[0]*100)}%`).join('、')};}
function showPlanet(){if(ui.pl==null||!PLN[ui.pl])ui.pl=WORLD&&PLN[WORLD.pl]?WORLD.pl:0;if(ui.pmode==null)ui.pmode='ter';const k=ui.pl,p=PLN[k];setPlanet(k,true);const g=plStat(),sit=plSitText(k),pp=Object.assign({},PLP0,p.pol);
  const html=`<div class="alert">機動艦隊司令部</div><h2>惑星を選ぶ</h2><p class="sm mut">惑星ごとに、陸と海の広さ、気候、資源、世界の情勢が大きく違う。名前か、下の一覧をタップすると、その惑星の地図と情勢が出る。どの惑星にも、同じ45の国がある。</p>
  <div class="sub plq">${PLN.map((x,i)=>`<button class="${i===k?'on':''}" onclick="A.plsel(${i})">${x.n}</button>`).join('')}</div>
  <div class="plsel"><div class="uh"><b>惑星${p.n}</b><span class="loc">${p.tag}</span></div>${mapBox('loc','','loc')}<div class="chips"><button class="${ui.pmode==='ter'?'on':''}" onclick="A.plmode('ter')">地形</button><button class="${ui.pmode==='pol'?'on':''}" onclick="A.plmode('pol')">国</button></div><p class="sm">${p.d}</p><ul class="pts">${p.pts.map(x=>`<li>${x}</li>`).join('')}</ul>
  <dl class="kv2"><dt>海</dt><dd>地表の${g.sea}%<span class="mut">(海域 ${g.R})</span></dd><dt>陸</dt><dd>${g.P.toLocaleString()}プロヴィンス・${g.ST}州</dd><dt>地形</dt><dd class="sm">${g.ter}</dd><dt>資源の採れる州</dt><dd>${g.res}%</dd><dt>陸の国境のない国</dt><dd>${g.isl}か国</dd><dt>いちばん大きな国</dt><dd>${g.mx}プロヴィンス</dd>
  <dt>陣営</dt><dd>${pp.nb>=18?'ほぼすべての国が、ふたつの陣営のどちらかに属する':pp.nb<=8?`ふたつの陣営はどちらも${pp.nb}か国ほど。あとは非同盟`:`ふたつの陣営がそれぞれ${pp.nb}か国ほど`}</dd><dt>戦争</dt><dd>同時に${pp.maxWar}つまで${pp.war0?`<span class="r">　着任時に${pp.war0}つほど進行中</span>`:''}</dd>
  <dt>自国への条件</dt><dd class="sm">${sit.length?sit.join('、'):'標準'}</dd></dl></div>
  <h3 class="sub">惑星の一覧</h3><div class="pllist">${PLN.map((x,i)=>`<button class="${i===k?'on':''}" onclick="A.plsel(${i})"><span class="pn"><b>${x.n}</b><small>${x.tag}</small></span><span class="lv">${PLLV.map((l,j)=>`<i>${['海','資源','戦乱','富'][j]} ${plDots(x.lv[j])}</i>`).join('')}</span></button>`).join('')}</div>
  <div class="mbtn"><button class="btn pri" data-m="go">惑星${p.n}で国を選ぶ</button><button class="btn" data-m="back">タイトルへ戻る</button></div>`;
  if(mq.length&&mq[0].planet){mq[0].html=html;$('#mbox').innerHTML=tx(html);drawMaps();const on=document.querySelector('.plq .on');if(on&&on.parentNode)on.parentNode.scrollLeft=Math.max(0,on.offsetLeft-on.parentNode.offsetLeft-90);}
  else{modal(html,{go:()=>{closeModal();ui.pmode=null;ui.nview='list';ui.wsc=null;ui.nsc=0;showNation();},back:()=>{closeModal();ui.pmode=null;showTitle();}});mq[mq.length-1].planet=1;}}
Object.assign(A,{
  // 地形を作り直すので、ひと呼吸おいてから描く
  plsel(i){if(!PLN[i]||i===ui.pl)return;ui.pl=i;toast(`惑星${PLN[i].n}の地形を作っている`);setTimeout(()=>{if(mq.length&&mq[0].planet){showPlanet();$('#mbox').scrollTop=0;}},30);},
  plmode(m){ui.pmode=m;const sc=$('#mbox').scrollTop;showPlanet();$('#mbox').scrollTop=sc;}
});
/* ---------- 情勢の画面に、惑星の名前と性格を出す ---------- */
{const f0=GV.world;GV.world=()=>{const p=PLN[PLC]||PLN[0];return `<p class="sm mut plhd"><b>惑星${p.n}</b>　${p.tag}。${p.pts[0]}。</p>`+f0();};}
