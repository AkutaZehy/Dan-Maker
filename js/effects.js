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

    // master flags
    const onlyBG = document.getElementById('shadersOnlyBG').checked;
    const applyWhole = document.getElementById('shadersWhole').checked;

    // We'll implement BG-only by reconstructing layers: render BG-only -> process -> composite symbol/border on top.
    // For simplicity keep everything in single canvas unless OnlyBG is checked.

    if(onlyBG){
      // approximate: get BG by recollecting from original State.renderTo helpers is complex.
      // We'll fallback to applying effects to whole for now, but the pipeline keeps the correct size.
      // Flagging this with a console.warning for future refinement.
      console.warn('OnlyBG requested: current implementation applies effects to whole canvas (will refine later).');
    }

    // Sequentially apply selected effects, using cheap pixel operations
    if(document.getElementById('chkGlitch').checked){
      applyGlitch(pctx, w, h, parseInt(document.getElementById('glitchIntensity').value,10) || 0, opts);
    }
    if(document.getElementById('chkRGB').checked){
      applyRGBShift(pctx, w, h, parseInt(document.getElementById('rgbIntensity').value,10) || 0);
    }
    if(document.getElementById('chkWave').checked){
      applyWave(pctx, w, h, parseInt(document.getElementById('waveIntensity').value,10) || 0);
    }

    return proc;
  }

  function applyGlitch(ctx, w, h, intensity=30, opts={}){
    // static glitch: shuffle several horizontal slices with offsets depending on intensity
    const slices = Math.max(2, Math.floor(intensity / 10) + 3);
    const maxOff = Math.min(200, Math.round(intensity * 3));
    for(let s=0;s<slices;s++){
      const y = Math.floor(Math.random()*h);
      const hh = Math.max(2, Math.floor(Math.random()*(Math.min(80,h/6))));
      const offx = Math.round((Math.random()*2-1) * maxOff);
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

  function applyWave(ctx, w, h, intensity=10){
    const imgd = ctx.getImageData(0,0,w,h);
    const data = imgd.data;
    const out = ctx.createImageData(w,h);
    const amp = Math.max(1, intensity/3);
    const freq = 0.02 + intensity / 1200;
    for(let y=0;y<h;y++){
      const dx = Math.floor(Math.sin(y*freq) * amp);
      for(let x=0;x<w;x++){
        const sx = Math.min(w-1, Math.max(0, x + dx));
        const si = (y*w + sx)*4;
        const di = (y*w + x)*4;
        out.data[di] = data[si];
        out.data[di+1] = data[si+1];
        out.data[di+2] = data[si+2];
        out.data[di+3] = data[si+3];
      }
    }
    ctx.putImageData(out,0,0);
  }

  // regenerate: for glitch, we store a random seed/time on regen to produce a new static frame
  function regenerateGlitch(){
    // simply trigger a render (on next render gltich uses random slices)
  }

  return { applyEffects, regenerateGlitch };
})();
