/* Turns a spoken/typed Levantine-Arabic sentence into card rows. Rule-based: no server, works offline. */
(function(root){
const U={'واحد':1,'واحده':1,'تنين':2,'اتنين':2,'اثنين':2,'تلاته':3,'تلات':3,'ثلاث':3,'ثلاثه':3,'اربعه':4,'اربع':4,'خمسه':5,'خمس':5,'سته':6,'ست':6,'سبعه':7,'سبع':7,'تمانه':8,'تماني':8,'تمانيه':8,'ثمانيه':8,'ثمان':8,'ثماني':8,'تسعه':9,'تسع':9,'عشره':10,'عشر':10,
'حدعش':11,'احدعش':11,'تنعش':12,'اتنعش':12,'اثنعش':12,'تلتعش':13,'تلاتعش':13,'اربعتعش':14,'خمستعش':15,'ستعش':16,'سبعتعش':17,'تمنتعش':18,'تسعتعش':19,
'عشرين':20,'تلاتين':30,'ثلاثين':30,'اربعين':40,'خمسين':50,'ستين':60,'سبعين':70,'تمانين':80,'ثمانين':80,'تسعين':90,
'ميه':100,'مئه':100,'مايه':100,'ميتين':200,'مئتين':200,'تلاتميه':300,'ثلاثمئه':300,'تلتميه':300,'اربعميه':400,'اربعمئه':400,'خمسميه':500,'خمسمئه':500,'ستميه':600,'ستمئه':600,'سبعميه':700,'سبعمئه':700,'تمنميه':800,'تمانميه':800,'ثمانمئه':800,'تسعميه':900,'تسعمئه':900,
'الف':1000,'الفين':2000,'الاف':-1000,'تلاف':-1000};
const norm=s=>s.replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/ـ/g,'').replace(/[ً-ْ]/g,'').replace(/(\d)[,٬](\d{3})/g,'$1$2').replace(/[$]/g,' ');
const nt=x=>x.replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه');
function look(tok){ tok=nt(tok); if(tok in U) return [U[tok],'']; const p=tok[0]; if((p==='و'||p==='ب')&&tok.slice(1) in U) return [U[tok.slice(1)],p]; return null }
function wordsToNumbers(t){
  const toks=t.split(/(\s+)/), out=[]; let i=0;
  while(i<toks.length){
    const first=look(toks[i]);
    if(!first){out.push(toks[i]);i++;continue}
    let j=i, total=0, cur=0, n=0, lead=first[1]==='ب'?'ب ':first[1]==='و'?'و ':'';
    while(j<toks.length){
      const r=look(toks[j]); if(!r) { if(/^\s+$/.test(toks[j])&&j+1<toks.length&&look(toks[j+1])&&(n===0||look(toks[j+1])[1]==='و'||Math.abs(look(toks[j+1])[0])>=1000)){j++;continue} break }
      if(n>0&&r[1]==='ب') break;
      const v=r[0];
      if(v===1000||v===-1000){cur=(cur||1)*1000;total+=cur;cur=0}else cur+=v;
      n++; j++;
    }
    total+=cur;
    const single=n===1&&(first[0]===1||nt(toks[i])==='ست');
    if(single){out.push(toks[i]);i++;continue}
    out.push(lead+total); i=j;
  }
  return out.join('');
}
const MODELS=new Set('550 560 570 580 590 1030 1050 1060 1070 1080 1630 1650 1660 2060 2070 2080 3050 3060 3070 3080 3090 4060 4070 4080 4090 5050 5060 5070 5080 5090 5500 5600 5700 6400 6500 6600 6650 6700 6750 6800 6900 6950 7600 7700 7800 7900 9060 9070'.split(' '));
function brand(n){n=Number(n); if(n<1000||(n>=5500&&n<8000)||n===9060||n===9070) return 'RX'; if(n<2000) return 'GTX'; return 'RTX'}
const STOP=new Set(['شان','زمان','يومين','اسبوع','شهر','وين','هون','هناك','مبارح','ما','انو','كن','ه','و','سا','سه','ي','ك','نا','هم','ا','حالي','بيت','اليوم','الي','ال']);
const NAME='((?:(?:[اأ]بو|[اأ]م|محل|سوق|شرك[ةه]|معرض|زبون|مكتب)\\s+)?[\\u0621-\\u064Aa-zA-Z]{2,})';
function person(txt,re){for(const m of txt.matchAll(re)){const w=m[1].trim(); const last=w.split(/\s+/).pop(); if(!STOP.has(last)&&!/^\d/.test(w)) return w.replace(/^ابو /,'أبو ').replace(/^ام /,'أم ')}return ''}
const firstNum=txt=>{const a=txt.match(/(?:^|\s)ب\s*(\d+(?:\.\d+)?)/);if(a)return Number(a[1]);const b=txt.match(/\d+(?:\.\d+)?/);return b?Number(b[0]):null};
const BUY=/جبت|[اإ]شتري|شريت|[اأ]خدت|ر[اأ]س\s*مال|كلف/;
const SELL=/بعت|انباع|ببيع|مبيع|بيع|باع/;
const NOTSOLD=/(?:ما|مو|مش)\s+(?:انباع|بعت|مبيوع|مباع|باع)|(?:^|\s)(?:لسا|لسه|لسة|بالمخزن)(?=\s|[،,.]|$)/;
function ymd(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function parseBody(body){
  const o={cost:null,price:null,supplier:'',customer:''};
  const notSold=NOTSOLD.test(body);
  const cleaned=notSold?body.replace(NOTSOLD,' '):body;
  const si=notSold?-1:cleaned.search(SELL);
  let before=si<0?cleaned:cleaned.slice(0,si), after=si<0?'':cleaned.slice(si);
  const bi=after.search(BUY);
  if(bi>0){before=after.slice(bi)+' '+before;after=after.slice(0,bi)}
  o.cost=firstNum(before);
  if(after) o.price=firstNum(after);
  else if(!notSold){const all=[...before.matchAll(/\d+(?:\.\d+)?/g)].map(m=>Number(m[0]));if(all.length>=2){o.cost=all[0];o.price=all[1]}}
  o.supplier=person(before,new RegExp('(?:من\\s+عند|من)\\s+'+NAME,'g'));
  if(after) o.customer=person(after,new RegExp('(?:\\s[إا]ل[ىي]\\s+|\\sلعند\\s+|\\sل\\s?)'+NAME,'g'));
  return o;
}
function parseCards(raw,now){
  now=now||new Date();
  let t=' '+wordsToNumbers(norm(raw))+' ';
  t=t.replace(/[آاأ]?ر\s*تي\s*[اإأ]?كس/g,'RTX').replace(/جي\s*تي\s*[اإأ]?كس/g,'GTX').replace(/(?:^|\s)[آاأ]ر\s*[اإأ]?كس/g,' RX')
     .replace(/تي\s*[آاأ][يى]/g,'Ti').replace(/سوبر/g,'Super').replace(/ا?كس\s*تي/g,'XT').replace(/جيجا(?:بايت)?|غيغا|جيغا|جيقا/g,'GB');
  const re=/(?:(RTX|GTX|RX|GT|ARC)\s*-?\s*)?(\d{3,4})(?:\s*(Ti|XTX|XT|Super))?(?:\s*(Super))?(?:\s*(\d{1,2})\s*(?:GB|G)(?![a-z]))?/gi;
  const anchors=[];
  for(const m of t.matchAll(re)){
    const pre=t.slice(Math.max(0,m.index-12),m.index);
    if(!m[1]){ if(!MODELS.has(m[2])) continue; if(/(?:ب|بسعر|سعر|حق|بحق)\s*$/.test(pre)) continue; if(/\d$/.test(pre)) continue }
    const name=[(m[1]||brand(m[2])).toUpperCase(),m[2],m[3]&&(m[3][0].toUpperCase()+m[3].slice(1).replace(/^t$/i,'T')),m[4]&&'Super',m[5]&&m[5]+'GB'].filter(Boolean).join(' ').replace(/\bTI\b/i,'Ti').replace(/\bXt\b/,'XT').replace(/\bXtx\b/,'XTX');
    anchors.push({i:m.index,end:m.index+m[0].length,name});
  }
  const date=/مبارح|البارح[ةه]/.test(t)?ymd(new Date(now.getFullYear(),now.getMonth(),now.getDate()-1)):ymd(now);
  const out=[];
  if(!anchors.length){
    const o=parseBody(t); if(o.cost==null&&o.price==null&&!o.supplier&&!o.customer) return [];
    return [{name:'',...o,date}];
  }
  const head=t.slice(0,anchors[0].i);
  const defSup=person(head,new RegExp('(?:من\\s+عند|من)\\s+'+NAME,'g'));
  anchors.forEach((a,k)=>{
    const body=t.slice(a.end,k+1<anchors.length?anchors[k+1].i:t.length);
    const pre=t.slice(Math.max(0,a.i-28),a.i); let n=1;
    const lead=pre.split(/[،,.؛]/).pop(), vs=[...lead.matchAll(new RegExp(SELL.source+'|'+BUY.source,'g'))];
    const o=parseBody((vs.length?vs[vs.length-1][0]+' ':'')+body); if(!o.supplier) o.supplier=defSup;
    const c=pre.match(/(\d+)\s*(?:كروت|كرت|قطع|حبات|حب[ةه])\s*(?:من\s+)?(?:ال)?\s*$/); if(c) n=Math.min(20,Math.max(1,Number(c[1])));
    else if(/(?:كرتين|قطعتين|حبتين)\s*(?:من\s+)?(?:ال)?\s*$/.test(pre)) n=2;
    for(let x=0;x<n;x++) out.push({name:a.name,...o,date});
  });
  return out.slice(0,40);
}
root.parseCards=parseCards;
if(typeof module!=='undefined') module.exports={parseCards,wordsToNumbers,norm};
})(typeof window!=='undefined'?window:globalThis);
