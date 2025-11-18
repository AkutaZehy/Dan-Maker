// utils.js
const Utils = (function(){
  async function loadImageFromFile(file){
    return new Promise((resolve,reject)=>{
      const r = new FileReader();
      r.onload = e => {
        const img = new Image();
        img.onload = ()=>resolve(img);
        img.onerror = ()=>reject(new Error('img'));
        img.src = e.target.result;
      };
      r.onerror = ()=>reject(new Error('read'));
      r.readAsDataURL(file);
    });
  }
  function loadImage(url){
    return new Promise((resolve,reject)=>{
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = ()=>resolve(img);
      img.onerror = ()=>reject(new Error('load'));
      img.src = url;
    });
  }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function debounce(fn,ms=120){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a),ms); }; }

  function averageColor(img, sampleW=200, sampleH=120){
    try{
      const c = document.createElement('canvas');
      c.width = Math.min(sampleW, img.width);
      c.height = Math.min(sampleH, img.height);
      const cx = c.getContext('2d');
      cx.drawImage(img, 0, 0, c.width, c.height);
      const data = cx.getImageData(0,0,c.width,c.height).data;
      let r=0,g=0,b=0,count=0;
      for(let i=0;i<data.length;i+=4){
        const a = data[i+3];
        if(a < 16) continue;
        r += data[i]; g += data[i+1]; b += data[i+2]; count++;
      }
      if(count===0) return {r:255,g:255,b:255};
      return { r: Math.round(r/count), g: Math.round(g/count), b: Math.round(b/count) };
    }catch(e){ return {r:255,g:255,b:255}; }
  }

  function createEl(tag,props={},children=[]){
    const el = document.createElement(tag);
    Object.entries(props).forEach(([k,v])=>{
      if(k==='class') el.className = v;
      else if(k==='html') el.innerHTML = v;
      else el.setAttribute(k,v);
    });
    (Array.isArray(children)?children:[children]).forEach(c=>{ if(!c) return; if(typeof c === 'string') el.appendChild(document.createTextNode(c)); else el.appendChild(c); });
    return el;
  }

  return { loadImage, loadImageFromFile, clamp, averageColor, debounce, createEl };
})();
