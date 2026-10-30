const fs=require('fs');
const [src,out]=process.argv.slice(2);
const css=fs.readFileSync(src,'utf8');
const blocks={light:css.match(/:root\s*{([\s\S]*?)}/)[1],dark:css.match(/\[data-theme="dark"\]\s*{([\s\S]*?)}/)[1]};
const type=(n,v)=>{
  if(/^#|^rgba/.test(v))return'color';
  if(n.startsWith('font-family'))return'fontFamily';
  if(n.startsWith('font-'))return'typography';
  if(n.startsWith('shadow')||n==='focus-ring')return'shadow';
  if(n.startsWith('easing'))return'cubicBezier';
  if(/ms$/.test(v))return'duration';
  if(/^-?[\d.]+(px|em)$/.test(v)||v==='0')return'dimension';
  if(/^[\d.]+$/.test(v))return'number';
  return'string';
};
const res={$description:'Adminsax design tokens (W3C Design Tokens). Fonte: tokens.css'};
for(const [theme,body] of Object.entries(blocks)){
  const t={};
  for(const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)){
    const [,n,v]=m;const [g,...r]=n.split('-');const k=r.join('-')||g;
    (t[g]??={})[k]={$value:v.trim(),$type:type(n,v.trim())};
  }
  res[theme]=t;
}
fs.writeFileSync(out,JSON.stringify(res,null,2)+'\n');
console.log(Object.keys(res.light).length,'grupos light,',Object.values(res.dark).reduce((a,o)=>a+Object.keys(o).length,0),'overrides dark');
