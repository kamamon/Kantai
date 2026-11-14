/* ================= 惑星 ================= */
// 惑星ごとに、地形の作り方(gen)・気候(clim)・資源(res)・世界の情勢(pol)・自国を取り巻く条件(sit)が違う。
// 0番のペラギアは、これまでの世界とまったく同じものを作る(古い記録はプロヴィンスの番号で領土を覚えている)
// lv=[海の広さ, 資源, 戦乱, 豊かさ] を1〜5で示す
const PLG0={seed:48271,sea:.66,w:[1,.5,.25,.12,.055],edge:[24,.6,16.5,.7],shape:'',lake:0,isl:14,capIsl:68,pg:4.6,pmin:7,spd:0,rmin:100};
const PLC0={wob:0,pol:.78,jl:.34,jm:.55,d0:.3,d1:.64,dm:.37,fm:.58,mM:.93,mH:.79};
const PLR0={k:1,food:1,oil:1,steel:1,rare:1};
const PLP0={nb:12,hotP:.22,hot0:0,drift:0,maxWar:3,warP:1,coupP:1,war0:0,mil:0,stab:0,peaceK:1,govK:null,govP:0};
const PLS0={incF:1,eAggr:1,eGrow:1,landK:1,ten:0,budget:1,price:1,tradeN:4,rivK:1};
const PLN=[
  {n:'ペラギア',tag:'均衡の惑星',lv:[3,3,3,3],d:'海が地表の3分の2を占める。45の国が陸と海を分け合い、ふたつの陣営に割れて睨み合う。陸にも海にも火種がある、標準の世界。',
    pts:['陸と海の釣り合いがとれている','ふたつの陣営と非同盟が、ほぼ同じ数だけある'],gen:{}},
  {n:'テラニア',tag:'大陸の惑星',lv:[1,3,4,3],d:'海は地表の2割に満たない。ひと続きの大陸に内海と海峡が点々とあり、ほとんどの国が、陸でいくつもの国と接している。',
    pts:['陸の国境が多く、本土への侵攻が起きやすい','海は狭い内海と海峡ばかりで、海上の事案は少ない','山と丘が多く、国境の地形が守りを左右する'],
    gen:{seed:91813,sea:.23,w:[.42,.7,.5,.24,.1],edge:[9,.55,6,.6],lake:90,pg:6.6,pmin:9,capIsl:120,isl:20},clim:{mM:.9,mH:.72,wob:.16},pol:{hotP:.36,drift:.5,maxWar:5,warP:1.4},sit:{incF:.7,landK:1.5}},
  {n:'タラッサ',tag:'大洋の惑星',lv:[5,3,2,3],d:'地表の9割近くが海。国はどれも島々の集まりで、陸の国境はほとんどない。守るべきものは、海と航路と島である。',
    pts:['陸から攻め込まれることは、まずない','海上の事案が多く、相手の海軍の伸びも速い','資源は海を渡ってくる。輸入の値が高い'],
    gen:{seed:60617,sea:.875,w:[.7,.6,.5,.3,.14],pg:3.3,pmin:4,isl:8,capIsl:36},clim:{jl:.5,jm:.45,wob:.16},pol:{hotP:.3,maxWar:2},sit:{incF:1.5,landK:.6,eGrow:1.1,price:1.15}},
  {n:'ベルム',tag:'戦乱の惑星',lv:[2,3,5,2],d:'戦争が絶えない世界。国境という国境に兵が張りつき、任期の始まる日にも、いくつもの戦争が続いている。大国は小国を呑み、政変が相次ぐ。',
    pts:['着任の時点で、すでに5つ前後の戦争が起きている','国境の緊張が上がりやすく、同時に7つまで戦争が起きる','陣営は小さく、頼れる国が少ない。政変も多い','国の大きさに、ひどく差がある'],
    gen:{seed:33703,sea:.52,w:[.8,.65,.4,.2,.08],spd:.75,lake:160,pg:5.3,pmin:8},clim:{mM:.9,wob:.16},pol:{nb:7,hotP:.75,hot0:20,drift:1.2,maxWar:7,warP:2,coupP:2.2,war0:5,mil:.22,stab:-8,peaceK:.85,govK:[4,4,3],govP:.45},sit:{incF:1.4,eAggr:1.2,landK:1.7,ten:12}},
  {n:'ケノス',tag:'枯渇の惑星',lv:[3,1,4,2],d:'掘り尽くされた世界。石油も鉄も希少鉱も、採れる州は数えるほどしかない。資源のある土地をめぐって、国どうしが争う。',
    pts:['資源の採れる州が、ほかの惑星の3分の1ほどしかない','輸入の値はおよそ2倍。備蓄と通商の相手選びが効く','どの国も貧しく、防衛予算も少ない'],
    gen:{seed:77447,sea:.6,w:[1,.55,.3,.14,.06],pg:5,pmin:8},clim:{dm:.46,fm:.64,wob:.16},res:{k:.25},dev:-1,pol:{hotP:.34,drift:.6,maxWar:4,warP:1.5},sit:{price:1.9,budget:.88,tradeN:2,ten:6}},
  {n:'ニヴァリス',tag:'氷の惑星',lv:[3,3,2,2],d:'極の氷床が緯度の半ばまで張り出した、寒い世界。人が暮らせるのは赤道沿いの帯だけで、高緯度の国は広いばかりで人がいない。',
    pts:['国土の半分以上が雪原。国の大きさと豊かさが比例しない','石油は多いが、食料が乏しい','人口が少なく、予算も人も足りない'],
    gen:{seed:21589,sea:.56,shape:'caps',edge:[24,.6,10,.3],lake:150,pg:5.2,pmin:8},clim:{pol:.42,wob:.3,jl:0,jm:1,d0:.1,d1:.3,dm:.3,fm:.5},res:{oil:1.4,food:.55},pop:.8,pol:{maxWar:2,nb:10},sit:{budget:.9,incF:.9}},
  {n:'ザハラ',tag:'砂の惑星',lv:[2,4,3,3],d:'陸の大半を砂漠が覆う、乾いた世界。人は海沿いと内海のほとりに集まり、砂の下には石油が眠る。',
    pts:['石油の採れる州が多い。食料は乏しい','富は産油国に偏り、政変が起きやすい','陸が広く、国境は長い'],
    gen:{seed:14983,sea:.4,w:[1,.5,.3,.14,.06],lake:140,pg:5.9,pmin:9},clim:{pol:.92,wob:.2,jl:.12,jm:.7,d0:0,d1:.84,dm:.6,fm:.74},res:{oil:1.9,food:.3,rare:1.3},pol:{coupP:1.7,hotP:.32,maxWar:4,warP:1.2,govK:[5],govP:.45},sit:{price:1.25,landK:1.2}},
  {n:'ゲミナ',tag:'二極の惑星',lv:[3,3,3,3],d:'東西ふたつの大陸が、大洋をはさんで向かい合う。ほとんどの国がどちらかの陣営に属し、中立でいられる国はわずかしかない。',
    pts:['45か国のうち、ほぼすべてがふたつの陣営に分かれている','緊張が高いところから始まり、対峙する国の力も大きい','陣営どうしの国境は、いつも火種を抱えている'],
    gen:{seed:50411,sea:.6,shape:'two',w:[.8,.5,.3,.14,.06],pg:5,pmin:8},clim:{wob:.16},pol:{nb:21,hot0:8,drift:.3},sit:{ten:12,incF:1.3,rivK:1.15,eAggr:1.1}},
  {n:'メディオ',tag:'内海の惑星',lv:[2,3,3,4],d:'輪のようにつながった大陸が、ひとつの大きな内海を囲む。どの国の艦隊も同じ海に出てくるので、海の上はいつも混み合っている。',
    pts:['内海をはさんで多くの国が向かい合い、海上の事案がとても多い','外洋への出口は、いくつかの海峡だけ','交易で栄え、どの国もやや豊か'],
    gen:{seed:86243,sea:.55,shape:'ring',lake:300,w:[.8,.5,.3,.14,.06],pg:5.2,pmin:8},clim:{wob:.16},dev:.6,pol:{hotP:.3},sit:{incF:1.6,eAggr:1.15,ten:5}},
  {n:'エリュシア',tag:'平穏の惑星',lv:[4,4,1,5],d:'長い平和が続く、豊かな世界。戦争はめったに起きず、陣営も小さい。そのぶん、軍に金を出す理由を問われつづける。',
    pts:['国境の緊張が下がりやすく、戦争は同時にひとつまで','どの国も開発が進み、資源も多い。輸入の値は安い','防衛予算は2割ほど少ない。抑止を保てるかが勝負'],
    gen:{seed:29017,sea:.7},clim:{fm:.5,wob:.16},res:{k:1.35},dev:1.5,pol:{nb:6,hotP:.07,drift:-1.1,maxWar:1,warP:.3,coupP:.35,stab:10,peaceK:1.6,govK:[0,1,2],govP:.6},sit:{incF:.55,eAggr:.8,ten:-12,budget:.82,tradeN:8,price:.85}}
];
const PLLV=['海の広さ','資源','戦乱','豊かさ'];
let PLC=0,_plK=null;
// いまの惑星の設定(足りない項目は標準の値で埋める)
function PL(){if(_plK&&_plK.i===PLC)return _plK;const p=PLN[PLC]||PLN[0];
  return _plK={i:PLC,n:p.n,tag:p.tag,gen:Object.assign({},PLG0,p.gen),clim:Object.assign({},PLC0,p.clim),res:Object.assign({},PLR0,p.res),pol:Object.assign({},PLP0,p.pol),sit:Object.assign({},PLS0,p.sit),dev:p.dev||0,pop:p.pop||1};}
// 地形に足す大きな起伏。u,v は 0〜1
const WSHAPE={
  two:(u,v)=>-1.25*Math.exp(-Math.pow((u-.5)/.085,2))+.42*(Math.exp(-Math.pow((u-.25)/.16,2)-Math.pow((v-.5)/.36,2))+Math.exp(-Math.pow((u-.75)/.16,2)-Math.pow((v-.5)/.36,2))),
  ring:(u,v)=>{const dx=(u-.5)/.5,dy=(v-.5)/.46,d=Math.hypot(dx,dy),a=Math.atan2(dy,dx);let h=-1.2*Math.exp(-Math.pow(d/.4,2))+.52*Math.exp(-Math.pow((d-.72)/.19,2));
    for(const t of[.45,2.6,-1.75]){let da=Math.abs(a-t);if(da>Math.PI)da=2*Math.PI-da;if(d>.25)h-=.95*Math.exp(-Math.pow(da*d/.05,2));}return h;},
  caps:(u,v)=>{const la=Math.abs(v-.5)*2;return .75*Math.max(0,la-.5)-.22*Math.exp(-Math.pow(la/.28,2));}
};
