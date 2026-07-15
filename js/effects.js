// effects.js - multi-effect pipeline, uses offscreen canvas sized to source canvas
const Effects = (function(){

  function applyEffects(sourceCanvas, opts = {}) {
    // sourceCanvas is a canvas element; opts may include { targetW, targetH } when exporting
    const w = opts.targetW || sourceCanvas.width;
    const h = opts.targetH || sourceCanvas.height;

    // create processing canvas with exact pixel size to avoid scaling artifacts
    const proc = document.createElement('canvas'); proc.width = w; proc.height = h;
    const pctx = proc.getContext('2d');

    // draw the source into proc at scale if needed
    if(opts.targetW && (opts.targetW !== sourceCanvas.width || opts.targetH !== sourceCanvas.height)){
      pctx.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height, 0,0,w,h);
    } else {
      pctx.drawImage(sourceCanvas, 0, 0);
    }

    // Check if we should apply only to background
    const onlyBG = document.getElementById('shadersOnlyBG').checked;

    if(onlyBG && State.state.mode === 'individual'){
      // For individual mode: render BG only, apply effects, then composite symbol on top
      const bgCanvas = document.createElement('canvas'); bgCanvas.width = w; bgCanvas.height = h;
      const bgCtx = bgCanvas.getContext('2d');
      
      // Render only background
      const S = State.state;
      if(S.indBg){
        const scale = opts.targetW ? (w / 1920) : 1;
        drawTransformedImageForEffects(bgCtx, S.indBg, 0,0,w,h, S.indMeta, S.indMeta.offsetX, S.indMeta.offsetY, scale);
      } else {
        const g = bgCtx.createLinearGradient(0,0,0,h); g.addColorStop(0,'#101014'); g.addColorStop(1,'#08080b'); bgCtx.fillStyle = g; bgCtx.fillRect(0,0,w,h);
      }
      
      // Apply effects to background
      if(document.getElementById('chkGlitch').checked){
        applyGlitch(bgCtx, w, h, parseInt(document.getElementById('glitchIntensity').value,10) || 0, opts);
      }
      if(document.getElementById('chkRGB').checked){
        applyRGBShift(bgCtx, w, h, parseInt(document.getElementById('rgbIntensity').value,10) || 0);
      }
      
      // Draw processed BG to proc
      pctx.clearRect(0,0,w,h);
      pctx.drawImage(bgCanvas, 0,0);
      
      // Now composite the symbol on top (unaffected by effects)
      if(S.selGreekIndex >= 0 && S.greekList[S.selGreekIndex] && S.greekList[S.selGreekIndex].img){
        const sym = S.greekList[S.selGreekIndex].img;
        const scale = opts.targetW ? (w / 1920) : 1;
        const baseSize = (S.symbolMeta.zoom || 100) / 100 * 0.36;
        const targetH = h * baseSize;
        const targetW = targetH * (sym.width / sym.height);
        const x = (w - targetW)/2, y = (h - targetH)/2;
        drawSymbolForEffects(pctx, sym, x, y, targetW, targetH, S.symbolTint, S.applySymbolTint, S.symbolMeta, S.showSymbol);
      }
      
      return proc;
    }

    // Default: apply effects to whole canvas
    if(document.getElementById('chkGlitch').checked){
      applyGlitch(pctx, w, h, parseInt(document.getElementById('glitchIntensity').value,10) || 0, opts);
    }
    if(document.getElementById('chkRGB').checked){
      applyRGBShift(pctx, w, h, parseInt(document.getElementById('rgbIntensity').value,10) || 0);
    }
    
    return proc;
  }

  function applyGlitch(ctx, w, h, intensity=30, opts={}){
    // static glitch: shuffle several horizontal slices with offsets depending on intensity
    // Use glitchSeed from state for deterministic random
    const seed = State.state.glitchSeed || 0;
    const slices = Math.max(2, Math.floor(intensity / 10) + 3);
    const maxOff = Math.min(200, Math.round(intensity * 3));
    
    // Simple seeded random using seed
    let rnd = seed;
    const random = () => {
      rnd = (rnd * 9301 + 49297) % 233280;
      return rnd / 233280;
    };
    
    for(let s=0;s<slices;s++){
      const y = Math.floor(random()*h);
      const hh = Math.max(2, Math.floor(random()*(Math.min(80,h/6))));
      const offx = Math.round((random()*2-1) * maxOff);
      try {
        const slice = ctx.getImageData(0,y,w,hh);
        const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = hh;
        tmp.getContext('2d').putImageData(slice,0,0);
        ctx.clearRect(0,y,w,hh);
        ctx.drawImage(tmp, offx, y);
      } catch(e){}
    }
  }

  function applyRGBShift(ctx, w, h, intensity=20){
    // shift channels by number of pixels = intensity
    const imgdata = ctx.getImageData(0,0,w,h);
    const data = imgdata.data;
    const out = new Uint8ClampedArray(data.length);
    const shift = Math.min(200, intensity);
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const i = (y*w + x)*4;
        const ri = (y*w + Math.max(0, x-shift))*4;
        const bi = (y*w + Math.min(w-1, x+shift))*4;
        out[i] = data[ri]; // red
        out[i+1] = data[i+1]; // green unchanged
        out[i+2] = data[bi+2]; // blue
        out[i+3] = data[i+3];
      }
    }
    const newImg = new ImageData(out, w, h);
    ctx.putImageData(newImg, 0, 0);
  }

  // regenerate: for glitch, change the seed to produce a new static frame
  function regenerateGlitch(){
    State.state.glitchSeed = Date.now();
    State.savePersistent();
  }

  // Helper functions for rendering layers (simplified versions from render.js)
  function drawTransformedImageForEffects(ctx,img,x,y,w,h,meta={}, offsetX=0, offsetY=0, scale=1){
    const zoom = (meta.zoom || 100) / 100;
    const sx = (meta.scaleX || 100) / 100;
    const sy = (meta.scaleY || 100) / 100;
    const rot = (meta.rotate || 0) * Math.PI / 180;
    const arImg = img.width / img.height; const arBox = w / h;
    let dw, dh;
    if(arImg > arBox){ dh = h * zoom; dw = dh * arImg; } else { dw = w * zoom; dh = dw / arImg; }
    const surplus = Math.max(0, dw - w);
    const dx = x + (w - dw)/2;
    const left = dx - (surplus/2) + (offsetX * surplus);
    const dy = y + (h - dh)/2 + offsetY;
    ctx.save();
    const cx = x + w/2, cy = y + h/2;
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(sx, sy);
    const drawX = left - cx;
    const drawY = dy - cy;
    ctx.drawImage(img, drawX, drawY, dw, dh);
    ctx.restore();
  }

  function drawSymbolForEffects(ctx,img,x,y,w,h,symTint,applySymTint,meta,showSymbol){
    if(!showSymbol) return;
    const targetW = Math.round(w), targetH = Math.round(h);
    const off = document.createElement('canvas'); off.width = targetW; off.height = targetH;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0, targetW, targetH);
    if(!applySymTint || (symTint.r===255&&symTint.g===255&&symTint.b===255)){
      ctx.save();
      const cx = x + w/2, cy = y + h/2;
      ctx.translate(cx, cy);
      const rot = (meta.rotate||0)*Math.PI/180;
      ctx.rotate(rot);
      ctx.scale((meta.scaleX||100)/100, (meta.scaleY||100)/100);
      ctx.drawImage(off, -w/2, -h/2, w, h);
      ctx.restore();
      return;
    }
    const data = octx.getImageData(0,0,targetW,targetH);
    const pixels = data.data;
    const thr = 45;
    for(let i=0;i<pixels.length;i+=4){
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2], a = pixels[i+3];
      if(a < 8) continue;
      const lum = 0.299*r + 0.587*g + 0.114*b;
      if(lum > thr){
        const intensity = lum / 255;
        pixels[i] = Math.round(symTint.r * intensity);
        pixels[i+1] = Math.round(symTint.g * intensity);
        pixels[i+2] = Math.round(symTint.b * intensity);
      }
    }
    octx.putImageData(data,0,0);
    ctx.save();
    const cx = x + w/2, cy = y + h/2;
    ctx.translate(cx, cy);
    const rot = (meta.rotate||0)*Math.PI/180;
    ctx.rotate(rot);
    ctx.scale((meta.scaleX||100)/100, (meta.scaleY||100)/100);
    ctx.drawImage(off, -w/2, -h/2, w, h);
    ctx.restore();
  }

  return { applyEffects, regenerateGlitch };
})();
