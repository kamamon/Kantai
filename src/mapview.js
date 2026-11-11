/* ---------- 地図：高精細の下絵・境界線・拡大と移動 ---------- */
const HW=WW*WS,HH=WH*WS,SEA0=50000,ISLT=60000,NOC=65535;
function natRGB(i){const h=(i*137.5)%360/60,s=.42,l=.4+((i%3)-1)*.05,c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h%2-1)),m=l-c/2,v=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return v.map(k=>Math.round((k+m)*255));}
const hexA=(h,a)=>`rgba(${parseInt(h.slice(1,3),16)},${parseInt(h.slice(3,5),16)},${parseInt(h.slice(5,7),16)},${a})`;
const rgba32=(r,g,b,a)=>((Math.round(a*255)<<24)|(b<<16)|(g<<8)|r)>>>0;
const TERN=['','平地','森林','密林','丘陵','山岳','砂漠','雪原'],TERC=[[0,0,0],[128,152,94],[72,120,78],[50,110,70],[152,142,100],[126,116,108],[206,186,128],[214,220,224]],TERK=[1,1,.95,.92,.97,.86,1.05,1.08];
// 世界全体の下絵のもとを一度だけ作る。海岸線は高さの等高線でなめらかに、プロヴィンスの境は角を落として引く。
// 画素ごとに「どのプロヴィンス(または海域)か」と陰影を持っておき、色は地図の種類に応じてあとから塗る
function worldHi(){const Wd=WORLD||genWorld();if(Wd.hi!==undefined)return Wd.hi;Wd.hi=null;
  const thr=Wd.thr,ah=new Float32Array(WN),cl=new Uint16Array(WN),sh=new Float32Array(WN),isL=v=>v<SEA0||v===ISLT;
  for(let i=0;i<WN;i++){const L=Wd.land[i],h=Wd.hgt[i],x=i%WW;
    ah[i]=L===2?thr+.22:L===1?(h>thr?h:thr+.1):(h<thr?h:thr-.1);cl[i]=L===1?Wd.prov[i]:L===2?ISLT:Wd.reg[i]>=0?SEA0+Wd.reg[i]:NOC;
    sh[i]=clamp(1+((x>0?Wd.hgt[i-1]:h)-(x<WW-1?Wd.hgt[i+1]:h))*3.4,.78,1.2)*TERK[Wd.ter[i]];}
  const P2=typeof Path2D!=='undefined',pc=P2?new Path2D():null,pr=P2?new Path2D():null,rv1=P2?new Path2D():null,rv2=P2?new Path2D():null,sg=[],sa=[],sb=[];
  if(P2){for(let cy=0;cy<WH-1;cy++)for(let cx=0;cx<WW-1;cx++){const i=cy*WW+cx,c=[cl[i],cl[i+1],cl[i+WW+1],cl[i+WW]];if(c[0]===c[1]&&c[1]===c[2]&&c[2]===c[3])continue;
      const hs=[ah[i],ah[i+1],ah[i+WW+1],ah[i+WW]],X=cx+.5,Y=cy+.5,b=(hs[0]>thr?1:0)|(hs[1]>thr?2:0)|(hs[2]>thr?4:0)|(hs[3]>thr?8:0),hc=(hs[0]+hs[1]+hs[2]+hs[3])/4;
      if(b&&b!==15){const f=(a,z)=>(thr-a)/(z-a),T=()=>[X+f(hs[0],hs[1]),Y],Rt=()=>[X+1,Y+f(hs[1],hs[2])],Bm=()=>[X+f(hs[3],hs[2]),Y+1],Lf=()=>[X,Y+f(hs[0],hs[3])],ln=(p,q)=>{pc.moveTo(p[0],p[1]);pc.lineTo(q[0],q[1]);};
        if(b===5||b===10){if((b===5)===(hc>thr)){ln(T(),Rt());ln(Bm(),Lf());}else{ln(T(),Lf());ln(Rt(),Bm());}}
        else{const e=[];if((b&1)!==(b>>1&1))e.push(T());if((b>>1&1)!==(b>>2&1))e.push(Rt());if((b>>2&1)!==(b>>3&1))e.push(Bm());if((b&1)!==(b>>3&1))e.push(Lf());if(e.length===2)ln(e[0],e[1]);}}
      const M=[[X+.5,Y],[X+1,Y+.5],[X+.5,Y+1],[X,Y+.5]];
      // out(x1,y1,x2,y2,a,b)：a と b を分ける線分
      const bord=(ok,land,out)=>{const d=[0,0,0,0],u=[0,0,0,0];let any=0;for(let k=0;k<4;k++){const n=(k+1)&3;if(ok(c[k])&&ok(c[n])&&c[k]!==c[n]){d[k]=1;any=1;}}if(!any)return;
        for(let k=0;k<4;k++){const pv=(k+3)&3,n=(k+1)&3;if(ok(c[k])&&ok(c[pv])&&ok(c[n])&&c[pv]===c[n]&&c[pv]!==c[k]){out(M[pv][0],M[pv][1],M[k][0],M[k][1],c[k],c[pv]);u[pv]=u[k]=1;}}
        for(let k=0;k<4;k++)if(d[k]&&!u[k]){let t=1;const hm=(hs[k]+hs[(k+1)&3])/2;if(land?hc<=thr:hc>thr)t=clamp((hm-thr)/(hm-hc),0,1);out(M[k][0],M[k][1],M[k][0]+(X+.5-M[k][0])*t,M[k][1]+(Y+.5-M[k][1])*t,c[k],c[(k+1)&3]);}};
      bord(v=>v<SEA0,true,(a,b2,c2,d2,p,q)=>{sg.push(a,b2,c2,d2);sa.push(p);sb.push(q);});bord(v=>v>=SEA0&&v<ISLT,false,(a,b2,c2,d2)=>{pr.moveTo(a,b2);pr.lineTo(c2,d2);});}
    const jx=c=>c%WW+.5+((c*7919)%13/13-.5)*.7,jy=c=>Math.floor(c/WW)+.5+((c*104729)%11/11-.5)*.7;for(const q of Wd.riv){const a=q[0],b=q[1],w=q[2]>=120?rv2:rv1;w.moveTo(jx(a),jy(a));w.lineTo(jx(b),jy(b));}}
  let cv=null,hp=null,sd=null,tp=null,im=null;
  if(typeof document!=='undefined'){cv=document.createElement('canvas');cv.width=HW;cv.height=HH;const g=cv.getContext('2d');im=g&&g.createImageData?g.createImageData(HW,HH):null;
    if(im&&im.data&&im.data.length){const cc=(x,y)=>(y<0?0:y>=WH?WH-1:y)*WW+(x<0?0:x>=WW?WW-1:x),C=[0,0,0,0],I=[0,0,0,0],Wt=[0,0,0,0],hf=WS/2,ter=Wd.ter;hp=new Uint16Array(HW*HH);sd=new Uint8Array(HW*HH);tp=new Uint8Array(HW*HH);
      for(let cy=-1;cy<WH;cy++)for(let cx=-1;cx<WW;cx++){const i0=cc(cx,cy),i1=cc(cx+1,cy),i2=cc(cx+1,cy+1),i3=cc(cx,cy+1),h0=ah[i0],h1=ah[i1],h2=ah[i2],h3=ah[i3];
        C[0]=cl[i0];C[1]=cl[i1];C[2]=cl[i2];C[3]=cl[i3];I[0]=i0;I[1]=i1;I[2]=i2;I[3]=i3;const uni=C[0]===C[1]&&C[1]===C[2]&&C[2]===C[3],X0=cx*WS+hf,Y0=cy*WS+hf;
        for(let j=0;j<WS;j++){const py=Y0+j;if(py<0||py>=HH)continue;const v=(j+.5)/WS;
          for(let k=0;k<WS;k++){const qx=X0+k;if(qx<0||qx>=HW)continue;const u=(k+.5)/WS,w0=(1-u)*(1-v),w1=u*(1-v),w2=u*v,w3=(1-u)*v,h=h0*w0+h1*w1+h2*w2+h3*w3,land=h>thr,q=v<.5?(u<.5?0:1):(u<.5?3:2);let c=C[0],ti=I[q];
            if(!uni){
              if(isL(C[q])===land){const pv=(q+3)&3,n=(q+1)&3;c=C[q];if(isL(C[pv])===land&&isL(C[n])===land&&C[pv]===C[n]&&C[pv]!==c&&((q===0||q===3)?u:1-u)+((q<2)?v:1-v)>=.5){c=C[pv];ti=I[pv];}}
              else{Wt[0]=w0;Wt[1]=w1;Wt[2]=w2;Wt[3]=w3;let bw=-1;c=land?ISLT:NOC;for(let t=0;t<4;t++)if(isL(C[t])===land&&Wt[t]>bw){bw=Wt[t];c=C[t];ti=I[t];}}}
            const o=py*HW+qx;
            if(land){if(!isL(c))c=ISLT;sd[o]=c===ISLT?128:Math.min(255,(sh[i0]*w0+sh[i1]*w1+sh[i2]*w2+sh[i3]*w3)*128);tp[o]=ter[ti];}
            else{if(isL(c))c=NOC;sd[o]=clamp((thr-h)/.5,0,1)*255;}
            hp[o]=c;}}}}
    else cv=null;}
  const H=Wd.hi={cv,im,hp,sd,tp,pc,pr,rv1,rv2,sg:new Float32Array(sg),sa:new Uint16Array(sa),sb:new Uint16Array(sb),pp:null,ps:null,pb:null,key:null,bkey:null};return H;}
// 地図の種類ごとの塗り色(プロヴィンス単位)
const MMODE=[['pol','政治'],['blo','陣営'],['rel','関係'],['ter','地形'],['sta','州'],['dev','開発']];
function provColors(mode){const Wd=WORLD,n=Wd.P.length,LR=new Uint8Array(n),LG=new Uint8Array(n),LB=new Uint8Array(n),me=S?S.cfg.nat||0:-1,nc=NATS.map((_,i)=>natRGB(i));
  for(let p=0;p<n;p++){const o=Wd.pown[p],q=Wd.P[p];let c;
    if(mode==='blo'&&S&&S.w)c=o===me?[110,190,255]:BLOCC[S.w.n[o].bloc];
    else if(mode==='rel'&&S&&S.w){if(o===me)c=[110,190,255];else{const r=clamp(S.w.n[o].rel/100,-1,1);c=r>=0?[120-50*r,124+56*r,128-28*r]:[120-85*r,124+50*r,128+62*r];}}
    else if(mode==='sta'){const h=(q.st*47)%360/60,x=1-Math.abs(h%2-1),v=h<1?[1,x,0]:h<2?[x,1,0]:h<3?[0,1,x]:h<4?[0,x,1]:h<5?[x,0,1]:[1,0,x];c=v.map(k=>Math.round(86+k*80));}
    else if(mode==='dev'){const d=clamp(stDev(Wd.ST[q.st])/10,0,1);c=[40+190*d,70+130*d,90-20*d];}
    else{c=nc[o];if(o!==q.nat)c=c.map(k=>Math.min(255,k*.72+70));}
    LR[p]=c[0];LG[p]=c[1];LB[p]=c[2];}
  return{LR,LG,LB};}
const stDev=st=>S&&S.eco&&S.eco.st[st.id]?S.eco.st[st.id].dev:st.dev;
function wPaint(){const Wd=WORLD,H=Wd&&Wd.hi;if(!H||!H.cv)return;const mode=S&&S.w?(ui.mmode||'pol'):'pol',key=mode+':'+(Wd.ver||0)+':'+(mode==='pol'||mode==='ter'||mode==='sta'?'':(S.w.ver||0)+'/'+(S.eco?S.eco.ver||0:0));if(H.key===key)return;H.key=key;
  const px=new Uint32Array(H.im.data.buffer),hp=H.hp,sd=H.sd,tp=H.tp,N=hp.length,sea=new Uint32Array(256),terr=mode==='ter',L=terr?null:provColors(mode);
  for(let k=0;k<256;k++){const d=k/255;sea[k]=(0xff000000|((92-42*d)<<16)|((62-34*d)<<8)|(24-15*d))>>>0;}
  const isl=(0xff000000|(112<<16)|(154<<8)|168)>>>0;
  for(let o=0;o<N;o++){const c=hp[o];if(c>=SEA0){px[o]=c===ISLT?isl:sea[sd[o]];continue;}const k=sd[o]/128;let r,g,b;if(terr){const t=TERC[tp[o]];r=t[0]*k;g=t[1]*k;b=t[2]*k;}else{r=L.LR[c]*k;g=L.LG[c]*k;b=L.LB[c]*k;}
    px[o]=(0xff000000|((b>255?255:b)<<16)|((g>255?255:g)<<8)|(r>255?255:r))>>>0;}
  H.cv.getContext('2d').putImageData(H.im,0,0);}
// 境界線を国境・州境・プロヴィンス境に仕分ける。国境は領土が動くたびに作り直す
function wBord(){const Wd=WORLD,H=Wd.hi;if(!H||!H.pc||H.bkey===(Wd.ver||0))return;H.bkey=Wd.ver||0;const first=!H.pp,pb=new Path2D(),pp=first?new Path2D():H.pp,ps=new Path2D(),P=Wd.P,ow=Wd.pown,sg=H.sg;
  for(let k=0,n=H.sa.length;k<n;k++){const a=H.sa[k],b=H.sb[k],o=k*4,w=ow[a]!==ow[b]?pb:P[a].st!==P[b].st?ps:first?pp:null;if(!w)continue;w.moveTo(sg[o],sg[o+1]);w.lineTo(sg[o+2],sg[o+3]);}
  H.pb=pb;H.ps=ps;H.pp=pp;}
// 領土の持ち主を変える
function provSet(p,o){const Wd=WORLD;if(Wd.pown[p]===o)return;Wd.pown[p]=o;Wd.ver=(Wd.ver||0)+1;NMASK.length=0;}
/* ---------- 表示範囲 ---------- */
// z=1 が基準の大きさ。cx,cy は画面の中心にくるマス
function mvGet(key,init){const m=ui.mv=ui.mv||{};return m[key]||(m[key]=Object.assign({z:1,cx:WW/2,cy:WH/2},init));}
function mvFit(st,cw,ch,s0,b,zmax){st.z=clamp(st.z,1,zmax);const s=s0*st.z,vw=cw/s,vh=ch/s;
  st.cx=vw>=b.w?b.x+b.w/2:clamp(st.cx,b.x+vw/2,b.x+b.w-vw/2);st.cy=vh>=b.h?b.y+b.h/2:clamp(st.cy,b.y+vh/2,b.y+b.h-vh/2);
  return{s,x0:st.cx-vw/2,y0:st.cy-vh/2,cw,ch,zmax};}
function wPrep(cv,cw,ch){const dpr=Math.min(2.5,window.devicePixelRatio||1);cv.style.height=Math.round(ch)+'px';cv.width=Math.round(cw*dpr);cv.height=Math.round(ch*dpr);const g=cv.getContext('2d');if(g)g.setTransform(dpr,0,0,dpr,0,0);return g;}
function wBase(g,v){const H=worldHi(),s=v.s;wPaint();g.fillStyle='#06141f';g.fillRect(0,0,v.cw,v.ch);if(!H||!H.cv)return;
  const a=Math.max(0,v.x0),b=Math.max(0,v.y0),c=Math.min(WW,v.x0+v.cw/s),d=Math.min(WH,v.y0+v.ch/s);if(c<=a||d<=b)return;
  g.imageSmoothingEnabled=true;g.drawImage(H.cv,a*WS,b*WS,(c-a)*WS,(d-b)*WS,(a-v.x0)*s,(b-v.y0)*s,(c-a)*s,(d-b)*s);}
function wLines(g,v){const H=worldHi();if(!H||!H.pc)return;wBord();const s=v.s;g.save();g.beginPath();g.rect(0,0,v.cw,v.ch);g.clip();g.translate(-v.x0*s,-v.y0*s);g.scale(s,s);g.lineJoin='round';g.lineCap='round';
  if(s>=1.1){g.strokeStyle='rgba(150,190,220,.22)';g.lineWidth=clamp(s*.18,.7,1.2)/s;g.stroke(H.pr);}
  if(s>=3){g.strokeStyle=`rgba(10,14,18,${clamp((s-2)*.07,.1,.34)})`;g.lineWidth=clamp(s*.09,.5,1)/s;g.stroke(H.pp);}
  if(s>=1.3){g.strokeStyle=`rgba(10,14,18,${clamp(s*.14,.22,.6)})`;g.lineWidth=clamp(s*.22,.5,1.4)/s;g.stroke(H.ps);}
  if(s>=1){g.strokeStyle='rgba(72,140,205,.85)';g.lineWidth=clamp(s*.22,.5,1.6)/s;g.stroke(H.rv1);g.lineWidth=clamp(s*.42,.8,3)/s;g.stroke(H.rv2);}
  g.strokeStyle='rgba(236,226,190,.62)';g.lineWidth=clamp(s*.45,.5,1.4)/s;g.stroke(H.pc);
  g.strokeStyle='rgba(6,6,6,.9)';g.lineWidth=clamp(s*.62,.7,2.4)/s;g.stroke(H.pb);g.restore();}
// 国名と首都。小さく縮めたときは大きな国だけ名前を出す
function wNames(g,v,al){const Wd=WORLD,s=v.s;g.textAlign='center';g.textBaseline='middle';g.lineJoin='round';g.globalAlpha=al||1;
  if(s>=4.2){g.font='10px sans-serif';for(const st of Wd.ST){if(st.cap)continue;const x=(st.x+.5-v.x0)*s,y=(st.y+.5-v.y0)*s;if(x<-30||y<-10||x>v.cw+30||y>v.ch+10)continue;
      g.fillStyle='#e8e2c8';g.strokeStyle='#000';g.lineWidth=1;g.beginPath();g.rect(x-2.2,y-2.2,4.4,4.4);g.fill();g.stroke();if(s>=6.5){g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.65)';g.strokeText(stCity(st),x,y+10);g.fillStyle='#e8e2c8';g.fillText(stCity(st),x,y+10);}}}
  const alive=typeof natAlive==='function'&&S&&S.w?natAlive():null;
  Wd.nat.forEach((N,i)=>{if(alive&&!alive[i])return;const x=(N.x+.5-v.x0)*s,y=(N.y+.5-v.y0)*s;
    if(x>-20&&y>-20&&x<v.cw+20&&y<v.ch+20){g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=1;g.beginPath();g.arc(x,y,clamp(s*.9,1.3,4),0,6.3);g.fill();g.stroke();
      if(s>=5.5){g.font='10px sans-serif';g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.7)';g.strokeText(NATS[i].cap,x,y+12);g.fillStyle='#e8e2c8';g.fillText(NATS[i].cap,x,y+12);}}
    const fs=Math.min(30,Math.sqrt(N.main)*.21*s)*(s>9?clamp(1.6-s/15,.55,1):1),lx=(N.lx+.5-v.x0)*s,ly=(N.ly+.5-v.y0)*s;if(fs<7||lx<-80||ly<-20||lx>v.cw+80||ly>v.ch+20)return;
    g.font=`bold ${Math.round(fs)}px serif`;g.lineWidth=Math.max(2,fs*.22);g.strokeStyle='rgba(0,0,0,.62)';g.strokeText(NATS[i].n,lx,ly);g.fillStyle='rgba(255,255,255,.92)';g.fillText(NATS[i].n,lx,ly);});g.globalAlpha=1;}
// 国の領土を塗る型(高精細)。直近に使ったものだけ残す
const NMASK=[];
function natMask(i,col){const H=worldHi(),Wd=WORLD;if(!H||!H.hp||!Wd.nat[i])return null;const key=i+':'+col,hit=NMASK.find(m=>m.key===key);if(hit)return hit;
  let x0=WW,x1=0,y0=WH,y1=0;Wd.P.forEach((p,k)=>{if(Wd.pown[k]!==i)return;const r=Math.sqrt(p.n)*1.6+3;x0=Math.min(x0,p.x-r);x1=Math.max(x1,p.x+r);y0=Math.min(y0,p.y-r);y1=Math.max(y1,p.y+r);});if(x1<x0)return null;
  x0=Math.max(0,Math.floor(x0));y0=Math.max(0,Math.floor(y0));x1=Math.min(WW-1,Math.ceil(x1));y1=Math.min(WH-1,Math.ceil(y1));const w=(x1-x0+1)*WS,h=(y1-y0+1)*WS,cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const g=cv.getContext('2d'),im=g.createImageData(w,h),px=new Uint32Array(im.data.buffer),ow=Wd.pown;for(let y=0;y<h;y++){const o=(y0*WS+y)*HW+x0*WS,q=y*w;for(let x=0;x<w;x++){const c=H.hp[o+x];if(c<SEA0&&ow[c]===i)px[q+x]=col;}}
  g.putImageData(im,0,0);const m={key,cv,x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};NMASK.push(m);if(NMASK.length>6)NMASK.shift();return m;}
/* ---------- 世界地図(国を選ぶ画面・国の位置・ゲーム中の世界図) ---------- */
function drawWorldCv(cv){const Wd=WORLD||genWorld(),m=cv.dataset.mode,cw=cv.clientWidth||(cv.parentNode&&cv.parentNode.clientWidth)||320,s0=cw/WW,ch=m==='loc'?Math.round(WH*s0):Math.min(340,Math.round(cw*.78));
  const hi=cv.dataset.hi,ri=cv.dataset.ri,N0=Wd.nat[+hi||0],st=mvGet(m,m==='loc'?{}:{z:2.2,cx:N0.x,cy:N0.y});
  if(m!=='sel'&&st.hi!==hi){st.hi=hi;if(m==='view'||st.z>1.05){st.cx=N0.x;st.cy=N0.y;}}
  const v=mvFit(st,cw,ch,s0,{x:0,y:0,w:WW,h:WH},40),g=wPrep(cv,cw,ch),s=v.s;(ui.mvv=ui.mvv||{})[m]=v;if(!g)return;
  wBase(g,v);if(m==='loc'){g.fillStyle='rgba(3,9,16,.35)';g.fillRect(0,0,cw,ch);}
  const fill=(ni,col,a)=>{if(ni==null||ni===''||!Wd.nat[+ni])return;const k=natMask(+ni,col);if(!k)return;g.globalAlpha=a;g.drawImage(k.cv,(k.x-v.x0)*s,(k.y-v.y0)*s,k.w*s,k.h*s);g.globalAlpha=1;};
  if(m!=='view'){fill(ri,rgba32(255,70,60,1),.45);fill(hi,rgba32(255,255,255,1),m==='sel'?.25:.36);}wLines(g,v);
  const ring=(ni,col)=>{if(ni==null||ni===''||!Wd.nat[+ni])return;const N=Wd.nat[+ni];g.strokeStyle=col;g.lineWidth=2;g.beginPath();g.arc((N.x+.5-v.x0)*s,(N.y+.5-v.y0)*s,m==='loc'?9:13,0,6.3);g.stroke();};
  ring(ri,'#ff6b5e');ring(hi,'#fff');wNames(g,v);if(m==='view'&&typeof wOverlay==='function')wOverlay(g,v);}
/* ---------- 作戦図 ---------- */
// 海域の色分け(高精細)。色が変わったときだけ作り直す
function thTint(th,b,key,lut,dark){const H=worldHi();if(!H||!H.hp)return null;if(th.tl&&th.tl.key===key)return th.tl;
  const w=b.w*WS,h=b.h*WS,cv=th.tl?th.tl.cv:document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d'),im=g.createImageData(w,h),px=new Uint32Array(im.data.buffer);
  for(let y=0;y<h;y++){const o=(b.y*WS+y)*HW+b.x*WS,q=y*w;for(let x=0;x<w;x++){const c=H.hp[o+x];px[q+x]=c<SEA0||c===ISLT?0:c===NOC?dark:lut[c-SEA0];}}
  g.putImageData(im,0,0);return th.tl={key,cv};}
function drawTheater(cv){const Wd=WORLD||genWorld(),ni=S.cfg.nat||0,th=natTheater(ni),bx=th.box,cw=cv.clientWidth||334;let s0=cw/bx.w,ch=bx.h*s0;if(ch>480){ch=480;s0=ch/bx.h;}
  const vw0=cw/s0,mx=bx.x+bx.w/2,lx0=Math.max(0,Math.floor(mx-vw0/2)),lx1=Math.min(WW,Math.ceil(mx+vw0/2)),ly0=Math.max(0,Math.floor(bx.y)),ly1=Math.min(WH,Math.ceil(bx.y+bx.h)),lim={x:lx0,y:ly0,w:lx1-lx0,h:ly1-ly0};
  let st=mvGet('th',{cx:mx,cy:bx.y+bx.h/2,nat:ni});if(st.nat!==ni){delete ui.mv.th;st=mvGet('th',{cx:mx,cy:bx.y+bx.h/2,nat:ni});}
  const v=mvFit(st,cw,ch,s0,lim,18),g=wPrep(cv,cw,ch),s=v.s,X=x=>(x+.5-v.x0)*s,Y=y=>(y+.5-v.y0)*s,fl=[];ui.wthv=Object.assign(v,{fl});cv.style.touchAction=st.z>1.01?'none':'pan-y';if(!g)return;
  wBase(g,v);
  const fsel=ui.fsel!=null?FL(ui.fsel):null,zc=ZONES.map((Z,i)=>{const sel=ui.zsel===i;if(Z.enemy)return[255,80,70,sel?.4:.24];if(Z.home)return[95,176,255,sel?.4:.18];const h=thrCol(i);return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16),sel?.4:fsel?.26:.15];});
  const dark=rgba32(3,9,16,.52),lut=new Uint32Array(Wd.R.length).fill(dark);for(const r in th.idx){const z=th.idx[r];lut[r]=rgba32(zc[z][0],zc[z][1],zc[z][2],zc[z][3]);}
  const tl=thTint(th,lim,zc.join('|'),lut,dark);if(tl){g.imageSmoothingEnabled=true;g.drawImage(tl.cv,(lim.x-v.x0)*s,(lim.y-v.y0)*s,lim.w*s,lim.h*s);}
  wLines(g,v);wNames(g,v,.7);
  g.lineJoin='round';g.lineCap='round';g.textAlign='center';g.textBaseline='middle';
  const inV=(x,y,m)=>x>-m&&y>-m&&x<cw+m&&y<ch+m;
  for(const f of S.fleets)if(f.dest!=null){const p=zpath(f.zone,f.dest);if(!p)continue;g.strokeStyle='rgba(120,200,255,.95)';g.lineWidth=2.5;g.setLineDash([6,5]);g.beginPath();p.forEach((z,k)=>{k?g.lineTo(X(ZONES[z].x),Y(ZONES[z].y)+18):g.moveTo(X(ZONES[z].x),Y(ZONES[z].y)+18);});g.stroke();g.setLineDash([]);}
  const txt=(t,x,y,fs,col,bold)=>{g.font=`${bold?'bold ':''}${fs}px sans-serif`;const hw=String(t).length*fs*.52+3;x=clamp(x,hw,cw-hw);y=clamp(y,fs*.7,ch-fs*.7);g.lineWidth=3;g.strokeStyle='rgba(0,0,0,.75)';g.strokeText(t,x,y);g.fillStyle=col;g.fillText(t,x,y);};
  const cnt={},mine=`rgb(${natRGB(ni).map(c=>Math.min(255,c+50)).join(',')})`,big=st.z>=2.4;
  ZONES.forEach((Z,i)=>{const x=X(Z.x),y=Y(Z.y),sec=S.sectors[i],isI=ISLZ.includes(i);let stt='';if(!inV(x,y,10))return;
    if(Z.enemy){g.fillStyle='#ff6b5e';g.strokeStyle='#fff';g.lineWidth=1.2;g.beginPath();g.moveTo(x,y-8);g.lineTo(x+8,y);g.lineTo(x,y+8);g.lineTo(x-8,y);g.closePath();g.fill();g.stroke();txt(Z.n,x,y-18,10.5,'#ffd0c8',1);txt(RIV.n,x,y+17,9.5,'#ffb3aa');return;}
    if(isI){g.fillStyle=sec.held?mine:'#ff5a4e';g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.arc(x,y,5.5,0,6.3);g.fill();g.stroke();stt=sec.held?'敵活動 '+thr(i).t+(garrison(i).length?'・陸'+garrison(i).length:''):'占領下';
      if(!sec.held&&S.isl[i].cover)silSide(g,'dd',x+22,y+2,22,'#ff6b5e','#fff');}
    else stt=Z.home?'母港':thr(i).v>=60?'通商妨害':'航路 '+thr(i).t;
    txt(ZS[i]||Z.n,x,y-(isI?26:20),11,ui.zsel===i?'#fff':'#e4eef5',1);txt(tx(stt),x,y-(isI?14:8),9.5,Z.home?'#9fd0ff':thrCol(i));
    if(typeof airAt==='function'){const sq=airAt(i);if(sq.length){silTop(g,'ftr',x-20,y-1,13,0,'#ffe9a8','#3b2f00');txt('×'+sq.length,x-33,y-1,9,'#ffe9a8',1);}}});
  S.fleets.forEach((f,k)=>{const Z=ZONES[f.zone],n=cnt[f.zone]=(cnt[f.zone]||0)+1,tot=S.fleets.filter(o=>o.zone===f.zone).length,row=Math.floor((n-1)/3),col=(n-1)%3,inRow=Math.min(3,tot-row*3),x=X(Z.x)+(col-(inRow-1)/2)*(big?104:34),y=Y(Z.y)+20+row*(big?92:21),sel=ui.fsel===f.id;if(!inV(x,y,20))return;
    const us=flUnits(f),lead=us.slice().sort((a,b)=>PT[b.type].val-PT[a.type].val)[0],kd=lead?sideKind(PT[lead.type]):'dd';
    g.fillStyle=sel?'rgba(255,255,255,.95)':'rgba(13,42,62,.88)';g.strokeStyle=sel?'#ffd166':'#9fd0ff';g.lineWidth=sel?2.5:1.3;g.beginPath();g.rect(x-15,y-9,30,18);g.fill();g.stroke();
    silSide(g,kd,x+2,y+6,23,sel?'#0b1b2a':'#dff1ff',null);g.font='bold 9px sans-serif';g.fillStyle=sel?'#0b1b2a':'#ffd166';g.fillText(String(k+1),x-10,y-4);fl.push({id:f.id,x,y});
    if(big){g.textAlign='left';g.font='9px sans-serif';us.slice(0,7).forEach((u,j)=>{const yy=y+21+j*10;silSide(g,sideKind(PT[u.type]),x-34,yy+3,17,u.tz?'#7f97a8':'#cfe6f7',null);g.lineWidth=2.5;g.strokeStyle='rgba(0,0,0,.7)';g.strokeText(tx(u.name),x-23,yy);g.fillStyle=u.tz?'#9fb2c0':'#e4eef5';g.fillText(tx(u.name),x-23,yy);});if(us.length>7){g.fillStyle='#9fb2c0';g.fillText('ほか'+(us.length-7)+'隻',x-23,y+21+70);}g.textAlign='center';}});
  for(const e of S.efl)if(e.known){const a=ZONES[EBASE[e.z]],b=ZONES[e.z],t=e.eta>=2?.15:.45,x=X(a.x+(b.x-a.x)*t),y=Y(a.y+(b.y-a.y)*t);g.strokeStyle='rgba(255,107,94,.8)';g.lineWidth=1.5;g.setLineDash([3,4]);g.beginPath();g.moveTo(X(a.x),Y(a.y));g.lineTo(X(b.x),Y(b.y));g.stroke();g.setLineDash([]);
    if(!inV(x,y,20))continue;g.fillStyle='rgba(60,10,8,.85)';g.strokeStyle='#ff6b5e';g.lineWidth=1.3;g.beginPath();g.rect(x-15,y-9,30,18);g.fill();g.stroke();silSide(g,'tr',x,y+6,24,'#ff8a7e',null);txt('侵攻部隊',x+40,y,9.5,'#ffd0c8',1);}
  if(st.z>1.01){g.font='10px sans-serif';g.textAlign='left';g.fillStyle='rgba(223,233,240,.7)';g.fillText('×'+st.z.toFixed(1),6,ch-9);g.textAlign='center';}}
function drawMaps(){if(typeof document==='undefined')return;for(const cv of document.querySelectorAll('canvas.wmap'))drawWorldCv(cv);const t=document.getElementById('wth');if(t&&S)drawTheater(t);}
// 地図の枠(拡大・縮小・戻すのボタンつき)
const mapBox=(key,attr,cls)=>`<div class="mvw"><canvas class="${key==='th'?'wth':'wmap'+(cls?' '+cls:'')} mv" ${key==='th'?'id="wth"':`data-mode="${key}"`} ${attr||''}></canvas><div class="mvb"><button onclick="mvBtn('${key}',1)" aria-label="地図を拡大">＋</button><button onclick="mvBtn('${key}',-1)" aria-label="地図を縮小">－</button><button onclick="mvBtn('${key}',0)" aria-label="地図の表示を戻す">⟲</button></div></div>`;
const mvV=k=>k==='th'?ui.wthv:(ui.mvv||{})[k];
function mvZoomAt(k,f,px,py){const st=ui.mv&&ui.mv[k],v=mvV(k);if(!st||!v)return;const z=clamp(st.z*f,1,v.zmax||14),r=z/st.z;if(r===1)return;const wx=v.x0+px/v.s,wy=v.y0+py/v.s;v.s*=r;v.x0=wx-px/v.s;v.y0=wy-py/v.s;st.z=z;st.cx=v.x0+v.cw/v.s/2;st.cy=v.y0+v.ch/v.s/2;}
function mvBtn(k,d){const v=mvV(k);if(!d){if(ui.mv)delete ui.mv[k];}else if(v)mvZoomAt(k,d>0?1.7:1/1.7,v.cw/2,v.ch/2);drawMaps();}
// 地図のタップ：作戦図は艦隊か海域、国を選ぶ地図は国
function wTap(e){const cv=e.target&&e.target.closest?e.target.closest('canvas'):null;if(!cv||Date.now()-(ui.mvDrag||0)<350)return;const rc=cv.getBoundingClientRect(),px=e.clientX-rc.left,py=e.clientY-rc.top,Wd=WORLD,H=Wd&&Wd.hi;
  const at=v=>{const fx=px/v.s+v.x0,fy=py/v.s+v.y0,x=Math.floor(fx),y=Math.floor(fy);if(x<0||y<0||x>=WW||y>=WH)return null;const i=y*WW+x,c=H&&H.hp?H.hp[Math.min(HH-1,Math.floor(fy*WS))*HW+Math.min(HW-1,Math.floor(fx*WS))]:null;return{i,c};};
  if(cv.id==='wth'&&ui.wthv){const v=ui.wthv,f=v.fl.find(o=>Math.abs(o.x-px)<=16&&Math.abs(o.y-py)<=11);if(f)return A.fsel(f.id);
    const p=at(v);if(!p)return;const r=p.c!=null&&p.c>=SEA0&&p.c<ISLT?p.c-SEA0:Wd.reg[p.i],z=natTheater(S.cfg.nat||0).idx[r];if(z!=null)A.zone(z);return;}
  if(cv.classList.contains('wmap')&&(cv.dataset.mode==='sel'||cv.dataset.mode==='view')){const m=cv.dataset.mode,v=mvV(m);if(!v)return;const p=at(v);if(!p)return;const pid=p.c!=null?(p.c<SEA0?p.c:-1):(Wd.land[p.i]===1?Wd.prov[p.i]:-1);if(pid<0)return;if(m==='sel')A.nsel(Wd.P[pid].nat);else if(A.wsel)A.wsel(pid);}}
if(typeof document!=='undefined'){document.addEventListener('click',wTap);
  const pts=new Map();let cur=null,moved=false,pd=0,rafId=0;
  const keyOf=cv=>cv.id==='wth'?'th':cv.dataset.mode,redraw=()=>{if(rafId)return;rafId=requestAnimationFrame(()=>{rafId=0;drawMaps();});};
  document.addEventListener('pointerdown',e=>{const cv=e.target&&e.target.closest?e.target.closest('canvas.mv'):null;if(!cv)return;if(cur!==cv)pts.clear();cur=cv;pts.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY});
    if(pts.size===1)moved=false;else if(pts.size===2){const a=[...pts.values()];pd=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);moved=true;}});
  document.addEventListener('pointermove',e=>{if(!cur||!pts.has(e.pointerId))return;const p=pts.get(e.pointerId),k=keyOf(cur),st=ui.mv&&ui.mv[k],v=mvV(k);if(!st||!v)return;
    if(pts.size===1){if(!moved&&Math.hypot(e.clientX-p.sx,e.clientY-p.sy)>6)moved=true;if(moved){st.cx-=(e.clientX-p.x)/v.s;st.cy-=(e.clientY-p.y)/v.s;redraw();}p.x=e.clientX;p.y=e.clientY;}
    else if(pts.size===2){p.x=e.clientX;p.y=e.clientY;const a=[...pts.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),rc=cur.getBoundingClientRect();if(pd>0&&d>0){mvZoomAt(k,d/pd,(a[0].x+a[1].x)/2-rc.left,(a[0].y+a[1].y)/2-rc.top);redraw();}pd=d;}});
  const up=e=>{if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(moved)ui.mvDrag=Date.now();if(!pts.size)cur=null;else{const p=[...pts.values()][0];p.sx=p.x;p.sy=p.y;}};
  document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
  document.addEventListener('wheel',e=>{const cv=e.target&&e.target.closest?e.target.closest('canvas.mv'):null;if(!cv)return;e.preventDefault();const rc=cv.getBoundingClientRect();mvZoomAt(keyOf(cv),e.deltaY<0?1.2:1/1.2,e.clientX-rc.left,e.clientY-rc.top);redraw();},{passive:false});}
