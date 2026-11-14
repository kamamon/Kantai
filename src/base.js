/* ================= 基地の整備 ================= */
// 本土と3つの島それぞれに、港湾・飛行場を広げ、対空・対艦ミサイル基地を置く。
// S.base[z]={port:段階, air:段階, sam:基数, ssm:基数, q:{k,left}|null}
const BASEZ=[0,1,4,7],BSMAX={port:5,air:5,sam:3,ssm:3},BSMO={port:7,air:6,sam:5,ssm:6};
const BSN={port:['港湾','整備を受けられる艦が増える'],air:['飛行場','置ける飛行隊が増える'],sam:['対空ミサイル基地','海戦と空襲で、基地の上空を守る'],ssm:['対艦ミサイル基地','海戦で陸から対艦ミサイルを撃ち、上陸を妨げる']};
const baseOf=z=>S&&S.base&&S.base[z]||null;
const baseLv=(z,k)=>{const b=baseOf(z);return b?b[k]:(k==='port'||k==='air'?1:0);};
const baseHeld=z=>z===0||(ISLZ.includes(z)&&S.sectors[z].held);
const baseName=z=>z===0?'本土':ISL[z];
const baseCost=(z,k)=>{const lv=baseLv(z,k);return k==='port'?300+150*lv:k==='air'?280+140*lv:k==='sam'?320:380;};
// 港の収容力。島では整備度の低下を抑えられる艦の数、本土では同時にドックへ入れられる艦の数
const portCap=z=>z===0?2+2*baseLv(0,'port'):3+2*baseLv(z,'port');
const baseUp=()=>BASEZ.reduce((a,z)=>{const b=baseOf(z);return a+(b?(b.port-1)+(b.air-1)+b.sam*2+b.ssm*2.5:0);},0);
function baseInit(){if(!S)return;if(!S.base)S.base={};for(const z of BASEZ)if(!S.base[z])S.base[z]={port:1,air:1,sam:0,ssm:0,q:null};}
// 今月、港の恩恵を受ける艦(島の港は古い艦から順に収容する)と、ドックに入れた艦
function portIn(){const o={};for(const z of ISLZ){if(!facOK(z,'port'))continue;inZone(z).slice().sort((a,b)=>a.id-b.id).slice(0,portCap(z)).forEach(u=>{o[u.id]=1;});}
  S.units.filter(u=>u.mode==='dock').sort((a,b)=>a.id-b.id).slice(0,portCap(0)).forEach(u=>{o[u.id]=1;});return o;}
function baseMonth(rep){baseInit();for(const z of BASEZ){const b=S.base[z];if(!b.q)continue;if(!baseHeld(z)){b.q=null;continue;}
    if(--b.q.left<=0){const k=b.q.k;b[k]=Math.min(BSMAX[k],b[k]+1);b.q=null;_M=null;rep.push([`${baseName(z)}：${BSN[k][0]}の${k==='port'||k==='air'?'拡張':'設置'}が終わった`,'g']);}}}
// 島を奪われると、ミサイル基地は失われ、港と飛行場も傷む
function baseLost(z){const b=baseOf(z);if(!b)return;b.sam=0;b.ssm=0;b.q=null;b.port=Math.max(1,b.port-1);b.air=Math.max(1,b.air-1);}
/* ---------- 海戦：基地のミサイルが陸上の拠点として加わる ---------- */
function baseSites(z){const b=baseOf(z);if(!b||!baseHeld(z))return;const o=B.obj,M=B.M,nm=baseName(z);
  for(let i=0;i<b.sam;i++)mkSite({name:`${nm} 対空ミサイル基地${b.sam>1?' '+(i+1):''}`,lab:'対空基地',sym:'SAM',x:o.x+7+i*2,y:o.y-7+i*2,hp:90,max:90,dA:260*(1+M.radA),dS:40,dM:45*(1+M.radM),sam:24,samR:70*(1+M.samRL),samPk:clamp(.6+M.samPk,0,.9),samRate:.35,cecS:clamp(M.cec,0,1),bref:[z,'sam']});
  for(let i=0;i<b.ssm;i++)mkSite({name:`${nm} 対艦ミサイル基地${b.ssm>1?' '+(i+1):''}`,lab:'対艦基地',sym:'SSM',x:o.x-7-i*2,y:o.y+7-i*2,hp:90,max:90,dS:70,dM:25,asm:12,asmR:180*(1+M.asmR),asmDmg:50*(1+M.asmDmg),pkB:M.asmPen,asmV:15*(1+M.asmSpd),bref:[z,'ssm']});
  if(b.sam||b.ssm)blog(`${nm}の基地が加わる：${b.sam?`対空ミサイル基地${b.sam}`:''}${b.sam&&b.ssm?'、':''}${b.ssm?`対艦ミサイル基地${b.ssm}。タップして対艦ミサイルを撃てる`:''}`,'');}
// 海戦で破壊された基地は失われる
function baseApply(){if(!B||B.drill)return;for(const u of B.u)if(u.bref&&u.dead){const b=baseOf(u.bref[0]);if(b&&b[u.bref[1]]>0){b[u.bref[1]]--;hlog(`${u.name}が破壊された`,'r');}}}
/* ---------- 画面 ---------- */
const UVB={};
UV.base=()=>{baseInit();let h=`<section class="sec"><h2>基地</h2><p class="mut sm">本土と島の基地を整える。費用は資金から払い、工事は基地ごとに1つずつ進む。島を奪われると、その島のミサイル基地は失われる。</p>`;
  for(const z of BASEZ){const b=S.base[z],held=baseHeld(z),nShip=z===0?S.units.filter(u=>u.mode==='dock').length:inZone(z).length,nAir=airAt(z).length;
    h+=`<div class="unit ${held?'':'away'}"><div class="uh"><b>${baseName(z)}</b><span class="loc">${SECT[z]}${held?'':'　占領下'}</span></div>`;
    if(!held){h+='<p class="al r">敵の占領下にある</p></div>';continue;}
    const rows=[['port',`段階 ${b.port}／${BSMAX.port}`,z===0?`同時にドックへ入れられる艦 ${portCap(0)}隻(いま${nShip}隻)。ドック整備 ${sg(Math.round((b.port-1)*8))}%`:`整備度の低下を抑えられる艦 ${portCap(z)}隻(いま${nShip}隻)`],
      ['air',`段階 ${b.air}／${BSMAX.air}`,`置ける飛行隊 ${airCap(z)}個(いま${nAir}個)`],['sam',`${b.sam}／${BSMAX.sam}基`,BSN.sam[1]],['ssm',`${b.ssm}／${BSMAX.ssm}基`,BSN.ssm[1]]];
    for(const r of rows){const k=r[0],c=baseCost(z,k),full=b[k]>=BSMAX[k],bad=z&&(k==='port'||k==='air')&&!facOK(z,k),why=full?'上限':b.q?'工事中':bad?'施設が壊れている':!canPay(c)?'資金不足':'';
      h+=`<div class="urow"><label>${BSN[k][0]}</label><div class="grow"><b>${r[1]}</b><br><span class="sm mut">${r[2]}</span></div>${b.q&&b.q.k===k?`<span class="tag">あと${b.q.left}か月</span>`:full?'':`<button class="btn sm" ${why?'disabled':''} onclick="A.bbuild(${z},'${k}')">${k==='port'||k==='air'?'拡張':'設置'}<small>${c}億・${BSMO[k]}か月</small></button>`}</div>`;}
    h+=`<p class="sm mut">維持費 月${((b.port-1)+(b.air-1)+b.sam*2+b.ssm*2.5).toFixed(1)}億円</p></div>`;}
  return h+'</section>';};
Object.assign(A,{
  bbuild(z,k){baseInit();const b=S.base[z],c=baseCost(z,k);if(!b||b.q||!baseHeld(z)||b[k]>=BSMAX[k]||!BSN[k])return;if(z&&(k==='port'||k==='air')&&!facOK(z,k))return toast('施設が壊れている。復旧を待つこと');if(!canPay(c))return toast('資金が足りない');
    confirmM(`${baseName(z)}の${BSN[k][0]}を${k==='port'||k==='air'?`段階${b[k]+1}へ拡張`:'1基設置'}する。<b>${c}億円</b>、${BSMO[k]}か月。${BSN[k][1]}。`,()=>{if(b.q||!canPay(c))return;spend(c);b.q={k,left:BSMO[k]};hlog(`${baseName(z)}：${BSN[k][0]}の${k==='port'||k==='air'?'拡張':'設置'}に着手`,'');save();render();toast('工事を始めた');},'着手する');}
});
