import re,sys
B=open('src/base.html').read()
rd=lambda n:open('src/'+n).read()
head=B[:B.index('</style>')]+rd('css_add.css')+B[B.index('</style>'):B.index('<script>')]
def hrep(a,b):
    global head
    assert head.count(a)==1,(a,head.count(a));head=head.replace(a,b)
hrep('<button data-t="pers">人員</button>','<button data-t="pers">人事</button>')
hrep('<div class="zoom"><button data-z="1" aria-label="拡大">＋</button>','<div class="zoom"><button data-z="v" id="b3d" aria-label="表示の切り替え">3D</button><button data-z="f" id="bfol" aria-label="選択中の部隊を追尾" hidden>追</button><button data-z="1" aria-label="拡大">＋</button>')
sc=B[B.index('<script>')+8:B.index('</script>')]
common=sc[sc.index("'use strict';"):sc.index('/* ================= データ')]
common=common.replace("const SAVE='soukai_no_tate_v1';\n","")
bt=sc[sc.index('/* ================= 戦闘 ================= */'):sc.index('function initDOM(){')]
def drop(name):
    global bt
    i=bt.index('\nfunction '+name+'(')
    m=re.compile(r'\n(function |const |let |/\* )').search(bt,i+5)
    j=m.start() if m else len(bt)
    bt=bt[:i]+bt[j:]
for n in ['pShip','mkE','mkFlight','setupP','setupE','startBattle','fireASM','fireTorp','impact','detect','applyUnits','tap']:drop(n)
def rep(a,b,cnt=1):
    global bt
    assert bt.count(a)==cnt,(a[:70],bt.count(a));bt=bt.replace(a,b)
rep("let B=null,raf=0,lastTs=0;const REIN_T=90;","let B=null,raf=0,lastTs=0;")
rep("function fx(x,y,c){B.fx.push({x,y,c,t:performance.now()});}","function fx(x,y,c,z){B.fx.push({x,y,c,z:z||0,t:performance.now()});}")
rep("let best=null,bs=1e9;const cec=u.side==='P'&&B.cec;","let best=null,bs=1e9;")
rep("if(!(d<=u.dM||(cec&&m.seen)))continue;","if(!(d<=u.dM||(u.cecS&&m.seen&&d<=Math.max(u.dM,u.samR*u.cecS))))continue;")
rep("if(u.cat==='sub')u.reveal=3;","if(u.cat==='sub')u.reveal=3*(u.hide||1);")
rep("  c.deckCd=3;}","  c.deckCd=3*(c.deckK||1);}")
rep("h.turn.push({n:u.n,t:15});","h.turn.push({n:u.n,t:15*(h.deckK||1)});")
rep("cool=fl?fl.cool:5;","cool=fl?fl.cool:8;")
rep("const p=clamp(.5-S.tension/220+(cool-5)*.02+","const p=clamp(.5-S.tension*S.cfg.eAggr/220+B.M.warn+(fl&&fl.care?.05:0)+(cool-10)*.012+")
rep("if(B.landT>=20)finish(","if(B.landT>=B.landNeed)finish(")
rep("Math.min(1,B.landT/20)","Math.min(1,B.landT/B.landNeed)",2)
rep("REIN_T-B.t","B.reinT0-B.t")
rep("p.key==='ddg'?2:1","p.sam>=60?2:1")
rep("B.intel={x:clamp(flag.x+R(-25,25),4,W-4),y:clamp(flag.y+R(-25,25),4,H-4)};","B.intel={x:clamp(flag.x+R(-B.eIn,B.eIn),4,W-4),y:clamp(flag.y+R(-B.eIn,B.eIn),4,H-4)};")
rep("function draw(){const g=B.g;","function draw2D(){const g=B.g;")
rep("t.dead=true;t.hp=0;fx(t.x,t.y,'kill');","t.dead=true;t.hp=0;fx(t.x,t.y,'kill',t.cat==='air'?1:0);")
bt,n1=re.subn(r"(\w+)\.key==='cvl'",r"\1.cvf",bt);bt,n2=re.subn(r"(\w+)\.key!=='cvl'",r"!\1.cvf",bt)
print('cvl patches',n1,n2)
js=common+rd('data2.js')+'\n'+rd('state2.js')+'\n'+rd('hq2a.js')+'\n'+rd('hq2b.js')+'\n'+bt+'\n'+rd('battle2.js')+'\n'+rd('view3d.js')
for bad in ['tech(','S.officers','REIN_T','B.cec','su.cmd',"PT.cvl."]:
    if bad in js:print('STALE:',bad,[js[m.start()-60:m.start()+40].replace('\n',' ') for m in re.finditer(re.escape(bad),js)][:3])
out=head+'<script>\n'+js+'</script>\n</body>\n</html>\n'
open('index.html','w').write(out);open(sys.argv[1] if len(sys.argv)>1 else '/dev/null','w').write(js)
print('bytes',len(out.encode()),'lines',out.count('\n'))
