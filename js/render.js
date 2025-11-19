// render.js - drawing pipeline with layered rendering & shader hooks
const Render = (function(){
  const OUT_W = 1920, OUT_H = 1080;
  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');

  function setCanvasHD(){
    const ratio = Math.max(1, window.devicePixelRatio||1);
    canvas.style.width = '100%';
    canvas.width = Math.round(OUT_W*ratio);
    canvas.height = Math.round(OUT_H*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);
  }
  setCanvasHD();
  window.addEventListener('resize', setCanvasHD);

  function clear(){ ctx.clearRect(0,0,OUT_W,OUT_H); ctx.fillStyle='#000'; ctx.fillRect(0,0,OUT_W,OUT_H); }

  function drawTransformedImage(img, x,y,w,h, meta={}, offsetX=0, offsetY=0){
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

  function drawImageClipped(img, slot, offsetX, meta){
    ctx.save();
    ctx.beginPath();
    ctx.rect(slot.x, slot.y, slot.w, slot.h);
    ctx.clip();
    drawTransformedImage(img, slot.x, slot.y, slot.w, slot.h, meta||{}, offsetX||0, 0);
    ctx.restore();
  }

  function drawBorderWithTint(img, tint, applyTint){
    if(!img) return;
    const bw = img.width, bh = img.height;
    const scale = Math.max(OUT_W/bw, OUT_H/bh);
    const drawW = bw*scale, drawH = bh*scale, bx=(OUT_W-drawW)/2, by=(OUT_H-drawH)/2;
    if(!applyTint || (tint.r===255&&tint.g===255&&tint.b===255)){
      ctx.drawImage(img, bx, by, drawW, drawH);
      return;
    }
    const off = document.createElement('canvas'); off.width = drawW; off.height = drawH;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0, drawW, drawH);
    octx.globalCompositeOperation = 'source-atop';
    octx.fillStyle = `rgb(${tint.r},${tint.g},${tint.b})`;
    octx.fillRect(0,0,drawW,drawH);
    ctx.drawImage(img, bx, by, drawW, drawH);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(off, bx, by, drawW, drawH);
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.14;
    ctx.drawImage(off, bx, by, drawW, drawH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawSymbolWithTint(img, x, y, w, h, symTint, applySymTint, meta, showSymbol){
    if(!showSymbol) return;
    const targetW = Math.round(w), targetH = Math.round(h);
    const off = document.createElement('canvas'); off.width = targetW; off.height = targetH;
    const octx = off.getContext('2d');
    octx.drawImage(img, 0, 0, targetW, targetH);
    if(!applySymTint || (symTint.r===255&&symTint.g===255&&symTint.b===255)){
      ctx.save(); applySymbolTransformAndDraw(off, x, y, targetW, targetH, meta); ctx.restore(); return;
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
      } else {
        // keep outline
      }
    }
    octx.putImageData(data,0,0);
    ctx.save(); applySymbolTransformAndDraw(off, x, y, targetW, targetH, meta); ctx.restore();
  }

  function applySymbolTransformAndDraw(offCanvas, x,y,w,h,meta){
    const cx = x + w/2, cy = y + h/2;
    ctx.translate(cx, cy);
    const rot = (meta.rotate||0)*Math.PI/180;
    ctx.rotate(rot);
    ctx.scale((meta.scaleX||100)/100, (meta.scaleY||100)/100);
    ctx.drawImage(offCanvas, -w/2, -h/2, w, h);
  }

  function drawSlotLabels(slots){
    const overlay = document.getElementById('overlayContainer');
    overlay.innerHTML = '';
    const canvasRect = canvas.getBoundingClientRect();
    const wrapperRect = document.getElementById('canvasContainer').getBoundingClientRect();
    for(let i=0;i<slots.length;i++){
      const s = slots[i];
      const el = document.createElement('div');
      el.className = 'slotOverlayLabel';
      const left = (s.x/OUT_W)*canvasRect.width + canvasRect.left - wrapperRect.left + 8;
      const top = (s.y/OUT_H)*canvasRect.height + canvasRect.top - wrapperRect.top + 8;
      el.style.position = 'absolute';
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.padding = '6px 8px';
      el.style.background = 'rgba(0,0,0,0.6)';
      el.style.color = '#fff';
      el.style.borderRadius = '6px';
      el.style.pointerEvents = 'none';
      el.textContent = 'Slot ' + (i+1);
      overlay.appendChild(el);
    }
  }

  function renderTo(offCtx){
    // offCtx is context of an offscreen canvas at desired export resolution (or main ctx)
    const S = State.state;
    // background
    if(S.mode === 'individual'){
      if(S.indBg) drawTransformedImageTo(offCtx, S.indBg, 0,0,OUT_W,OUT_H, S.indMeta, S.indMeta.offsetX, S.indMeta.offsetY);
      else {
        const g = offCtx.createLinearGradient(0,0,0,OUT_H); g.addColorStop(0,'#101014'); g.addColorStop(1,'#08080b'); offCtx.fillStyle = g; offCtx.fillRect(0,0,OUT_W,OUT_H);
      }
      // symbol
      if(S.selGreekIndex >= 0 && S.greekList[S.selGreekIndex] && S.greekList[S.selGreekIndex].img){
        const sym = S.greekList[S.selGreekIndex].img;
        const size = (S.symbolMeta.zoom || 100) / 100 * 0.36; // Scale down: 100% = 36% of screen
        const targetH = OUT_H * size;
        const targetW = targetH * (sym.width / sym.height);
        const x = (OUT_W - targetW)/2, y = (OUT_H - targetH)/2;
        drawSymbolWithTintTo(offCtx, sym, x, y, targetW, targetH, S.symbolTint, S.applySymbolTint, S.symbolMeta, S.showSymbol);
      }
    } else {
      // marathon mode
      const key = S.marBorderMode || 'reform';
      const slots = S.SLOTS[key] || S.SLOTS.reform;
      for(let i=0;i<4;i++){
        const slot = slots[i];
        offCtx.fillStyle='rgba(255,255,255,0.02)';
        offCtx.fillRect(slot.x, slot.y, slot.w, slot.h);
        const assigned = S.marImages.find(m=>m.slot === (i+1));
        if(assigned) drawImageClippedTo(offCtx, assigned.img, slot, assigned.offsetX||0, assigned.meta);
      }
      if(S.marBorderImg) drawBorderWithTintTo(offCtx, S.marBorderImg, S.borderTint, S.applyBorderTint);
      if(S.selGreekIndex >= 0 && S.greekList[S.selGreekIndex] && S.greekList[S.selGreekIndex].img){
        const sym = S.greekList[S.selGreekIndex].img;
        const size = (S.symbolMeta.zoom || 100) / 100 * 0.42; // Scale down: 100% = 42% of screen (marathon mode slightly larger)
        const targetH = OUT_H * size;
        const targetW = targetH * (sym.width / sym.height);
        const x = (OUT_W - targetW)/2, y = (OUT_H - targetH)/2;
        drawSymbolWithTintTo(offCtx, sym, x, y, targetW, targetH, S.symbolTint, S.applySymbolTint, S.symbolMeta, S.showSymbol);
      }
    }
  }

  // helper equivalents that draw to a provided ctx at the same coordinate system
  function drawTransformedImageTo(octx,img,x,y,w,h,meta={}, offsetX=0, offsetY=0){
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
    octx.save();
    const cx = x + w/2, cy = y + h/2;
    octx.translate(cx, cy);
    octx.rotate(rot);
    octx.scale(sx, sy);
    const drawX = left - cx;
    const drawY = dy - cy;
    octx.drawImage(img, drawX, drawY, dw, dh);
    octx.restore();
  }
  function drawImageClippedTo(octx, img, slot, offsetX, meta){
    octx.save();
    octx.beginPath();
    octx.rect(slot.x, slot.y, slot.w, slot.h);
    octx.clip();
    drawTransformedImageTo(octx, img, slot.x, slot.y, slot.w, slot.h, meta||{}, offsetX||0, 0);
    octx.restore();
  }
  function drawBorderWithTintTo(octx, img, tint, applyTint){
    if(!img) return;
    const bw = img.width, bh = img.height;
    const scale = Math.max(OUT_W/bw, OUT_H/bh);
    const drawW = bw*scale, drawH = bh*scale, bx=(OUT_W-drawW)/2, by=(OUT_H-drawH)/2;
    if(!applyTint || (tint.r===255&&tint.g===255&&tint.b===255)){
      octx.drawImage(img, bx, by, drawW, drawH);
      return;
    }
    const off = document.createElement('canvas'); off.width = drawW; off.height = drawH;
    const o = off.getContext('2d');
    o.drawImage(img, 0, 0, drawW, drawH);
    o.globalCompositeOperation = 'source-atop';
    o.fillStyle = `rgb(${tint.r},${tint.g},${tint.b})`;
    o.fillRect(0,0,drawW,drawH);
    octx.drawImage(img, bx, by, drawW, drawH);
    octx.globalCompositeOperation = 'multiply';
    octx.drawImage(off, bx, by, drawW, drawH);
    octx.globalCompositeOperation = 'screen';
    octx.globalAlpha = 0.14;
    octx.drawImage(off, bx, by, drawW, drawH);
    octx.globalAlpha = 1;
    octx.globalCompositeOperation = 'source-over';
  }
  function drawSymbolWithTintTo(octx,img,x,y,w,h,symTint,applySymTint,meta,showSymbol){
    if(!showSymbol) return;
    const targetW = Math.round(w), targetH = Math.round(h);
    const off = document.createElement('canvas'); off.width = targetW; off.height = targetH;
    const o = off.getContext('2d');
    o.drawImage(img, 0, 0, targetW, targetH);
    if(!applySymTint || (symTint.r===255&&symTint.g===255&&symTint.b===255)){
      applySymbolTransformAndDrawTo(octx, off, x, y, targetW, targetH, meta);
      return;
    }
    const data = o.getImageData(0,0,targetW,targetH);
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
      } else {
      }
    }
    o.putImageData(data,0,0);
    applySymbolTransformAndDrawTo(octx, off, x, y, targetW, targetH, meta);
  }
  function applySymbolTransformAndDrawTo(octx, offCanvas, x,y,w,h,meta){
    octx.save();
    const cx = x + w/2, cy = y + h/2;
    octx.translate(cx, cy);
    const rot = (meta.rotate||0)*Math.PI/180;
    octx.rotate(rot);
    octx.scale((meta.scaleX||100)/100, (meta.scaleY||100)/100);
    octx.drawImage(offCanvas, -w/2, -h/2, w, h);
    octx.restore();
  }

  // render public method: render to main canvas then call Effects module
  function render(){
    // draw onto an offscreen canvas of OUT_W x OUT_H with integer pixel sizes that correspond to 1:1 final output
    const off = document.createElement('canvas'); off.width = OUT_W; off.height = OUT_H;
    const octx = off.getContext('2d');
    renderTo(octx);

    // if effects enabled and shaders chosen, pass layered control to Effects module
    // Effects can apply to whole canvas or only BG depending on UI checkboxes
    const masterOn = document.getElementById('masterShaders').checked;
    if(masterOn){
      // We hand off the offscreen canvas to Effects for processing
      const processed = Effects.applyEffects(off);
      // draw processed back to main ctx (scaled by setCanvasHD)
      clear();
      ctx.drawImage(processed, 0, 0, OUT_W, OUT_H);
    } else {
      // draw final offscreen directly into canvas
      clear();
      ctx.drawImage(off, 0, 0, OUT_W, OUT_H);
    }

    // update overlays (slot labels)
    if(State.state.mode === 'marathon'){
      const slots = State.state.SLOTS[State.state.marBorderMode] || State.state.SLOTS.reform;
      drawSlotLabels(slots);
    } else {
      document.getElementById('overlayContainer').innerHTML = '';
    }
  }

  // export: render at arbitrary resolution and return a canvas
  function renderAtSize(w,h){
    const off = document.createElement('canvas'); off.width = w; off.height = h;
    const octx = off.getContext('2d');
    // scale factors: draw using the same logic but scaled to new size
    // set a temporary OUT values for drawing helpers
    // For simplicity we will scale content proportionally using current off rendering pipeline:
    // draw at base OUT_W x OUT_H then scale to target
    const tmp = document.createElement('canvas'); tmp.width = OUT_W; tmp.height = OUT_H;
    const tctx = tmp.getContext('2d');
    renderTo(tctx);
    // apply effects if needed using Effects.applyEffectsToCanvasAtSize
    if(document.getElementById('masterShaders').checked){
      const processed = Effects.applyEffects(tmp, {targetW:w, targetH:h});
      octx.drawImage(processed,0,0,w,h);
    } else {
      octx.drawImage(tmp,0,0,w,h);
    }
    return off;
  }

  return { render, canvas, renderAtSize };
})();
