// Text color endpoints for dark and light editor surfaces.
// Pure functions: never alter Shiki tokens or editor text.
export const DARK_BACKGROUND_COLORS=Object.freeze({
 keyword:'#8aaaff',string:'#a4df9e',comment:'#a0a7b4',
 function:'#7bd9dd',type:'#e6ba82',number:'#e4a4df',
 markup:'#c7b0ff',operator:'#c4c9d3',plain:'#e2e4eb'
});
export const LIGHT_BACKGROUND_COLORS=Object.freeze({
 keyword:'#2348b0',string:'#17632c',comment:'#515a67',
 function:'#08636b',type:'#80500e',number:'#8c287f',
 markup:'#6335a3',operator:'#414955',plain:'#1c2330'
});
export function linearLuminance(rgb){
 const c=rgb.map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
 return c[0]*.2126+c[1]*.7152+c[2]*.0722;
}
export function contrastRatio(a,b){
 const x=linearLuminance(a),y=linearLuminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
const decode=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
const encode=c=>'#'+c.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
const blend=(a,b,t)=>a.map((n,i)=>Math.round(n+(b[i]-n)*t));
export function resolveTextColors(background,minimum=4.5,overrides={}){
 if(!Array.isArray(background)||background.length!==3||
   !background.every(x=>Number.isFinite(x)&&x>=0&&x<=255))throw new TypeError('Invalid RGB background');
 const bg=background.map(Math.round);
 // Choose the endpoint according to which extreme has better contrast.
 // Continuous offset is based on the UI editor surface, not arbitrary token hues.
 const lightness=linearLuminance(bg);
 const white=[255,255,255],black=[0,0,0];
 const target=contrastRatio(white,bg)>=contrastRatio(black,bg)?white:black;
 const towardLight=target===black;
 const offset=Math.max(0,Math.min(1,lightness));
 const colors={};
 for(const category of Object.keys(DARK_BACKGROUND_COLORS)){
   const dark=decode(DARK_BACKGROUND_COLORS[category]);
   const light=decode(LIGHT_BACKGROUND_COLORS[category]);
   let color=overrides[category]?decode(overrides[category]):blend(dark,light,offset);
   if(contrastRatio(color,bg)<minimum){
     // Binary-search the smallest offset toward the high-contrast endpoint.
     let low=0,high=1;
     for(let i=0;i<20;i++){
       const mid=(low+high)/2;
       if(contrastRatio(blend(color,target,mid),bg)>=minimum)high=mid;
       else low=mid;
     }
     color=blend(color,target,high);
     // Quantization can lose a few hundredths of contrast.
     while(contrastRatio(color,bg)<minimum&&!color.every((n,i)=>n===target[i]))
       color=blend(color,target,.08).map((n,i)=>n===color[i]?n+Math.sign(target[i]-n):n);
   }
   colors[category]=encode(color);
 }
 return colors;
}
