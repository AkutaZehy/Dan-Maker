// textoverlay.js - text symbol + text overlay UI binding
(function(){
  const S = State.state;

  // ── Text Symbol ──
  const tsEn = document.getElementById('tsEnabled');
  const tsCtrls = document.getElementById('tsControls');
  const tsInput = document.getElementById('tsInput');
  const tsFont = document.getElementById('tsFont');
  const tsSize = document.getElementById('tsSize');
  const tsSizeVal = document.getElementById('tsSizeVal');
  const tsWeight = document.getElementById('tsWeight');
  const tsWeightVal = document.getElementById('tsWeightVal');
  const tsColor = document.getElementById('tsColor');

  function syncTextSymbol(){
    const ts = S.textSymbol;
    tsEn.checked = ts.enabled;
    tsCtrls.style.display = ts.enabled ? 'block' : 'none';
    const gs = document.getElementById('greekSection');
    if(gs) gs.style.display = ts.enabled ? 'none' : 'block';
    tsInput.value = ts.text;
    tsFont.value = ts.fontFamily;
    tsSize.value = ts.fontSize; tsSizeVal.value = ts.fontSize;
    tsWeight.value = ts.fontWeight; tsWeightVal.value = ts.fontWeight;
    if(tsColor) tsColor.value = ts.color;
  }

  function writeTextSymbol(){
    const ts = S.textSymbol;
    ts.enabled = tsEn.checked;
    ts.text = tsInput.value;
    ts.fontFamily = tsFont.value;
    ts.fontSize = parseInt(tsSize.value,10) || 72;
    ts.fontWeight = parseInt(tsWeight.value,10) || 700;
    if(tsColor) ts.color = tsColor.value;
  }

  function onChangeTS(){ writeTextSymbol(); State.savePersistent(); Render.render(); }

  tsEn.addEventListener('change', ()=>{
    tsCtrls.style.display = tsEn.checked ? 'block' : 'none';
    // hide Greek picker when text symbol is enabled
    const gs = document.getElementById('greekSection');
    if(gs) gs.style.display = tsEn.checked ? 'none' : 'block';
    onChangeTS();
  });
  tsInput.addEventListener('input', onChangeTS);
  tsFont.addEventListener('change', onChangeTS);
  if(tsColor) tsColor.addEventListener('input', onChangeTS);
  [{el:tsSize, val:tsSizeVal},{el:tsWeight, val:tsWeightVal}].forEach(({el,val})=>{
    el.addEventListener('input', ()=>{ val.value = el.value; onChangeTS(); });
    val.addEventListener('change', ()=>{ const v=parseInt(val.value,10)||0; val.value=v; el.value=v; el.dispatchEvent(new Event('input')); });
  });

  // ── Text Overlay ──
  const enabled = document.getElementById('textEnabled');
  const controls = document.getElementById('textControls');
  const input = document.getElementById('textInput');
  const font = document.getElementById('textFont');
  const layout = document.getElementById('textLayout');
  const txtSize = document.getElementById('textSize');
  const txtSizeVal = document.getElementById('textSizeVal');
  const txtScale = document.getElementById('textScale');
  const txtScaleVal = document.getElementById('textScaleVal');
  const vOff = document.getElementById('textVOffset');
  const vOffVal = document.getElementById('textVOffsetVal');
  const weight = document.getElementById('textWeight');
  const weightVal = document.getElementById('textWeightVal');
  const txtColor = document.getElementById('textColor');
  const stroke = document.getElementById('textStroke');
  const strokeCtrls = document.getElementById('textStrokeControls');
  const strokeColor = document.getElementById('textStrokeColor');
  const strokeWidth = document.getElementById('textStrokeWidth');
  const strokeWidthVal = document.getElementById('textStrokeWidthVal');
  const shadow = document.getElementById('textShadow');
  const shadowCtrls = document.getElementById('textShadowControls');
  const shadowColor = document.getElementById('textShadowColor');
  const shadowBlur = document.getElementById('textShadowBlur');
  const shadowBlurVal = document.getElementById('textShadowBlurVal');
  const shadowX = document.getElementById('textShadowX');
  const shadowXVal = document.getElementById('textShadowXVal');
  const shadowY = document.getElementById('textShadowY');
  const shadowYVal = document.getElementById('textShadowYVal');

  function syncTO(){
    const t = S.textOverlay;
    enabled.checked = t.enabled;
    controls.style.display = t.enabled ? 'block' : 'none';
    input.value = t.text;
    font.value = t.fontFamily;
    layout.value = t.layout;
    txtSize.value = t.fontSize; txtSizeVal.value = t.fontSize;
    txtScale.value = t.scale; txtScaleVal.value = t.scale;
    vOff.value = t.textOffset; vOffVal.value = t.textOffset;
    weight.value = t.fontWeight; weightVal.value = t.fontWeight;
    if(txtColor) txtColor.value = t.color;
    stroke.checked = t.strokeEnabled; strokeCtrls.style.display = t.strokeEnabled ? 'block' : 'none';
    strokeColor.value = t.strokeColor;
    strokeWidth.value = t.strokeWidth; strokeWidthVal.value = t.strokeWidth;
    shadow.checked = t.shadowEnabled; shadowCtrls.style.display = t.shadowEnabled ? 'block' : 'none';
    shadowColor.value = t.shadowColor;
    shadowBlur.value = t.shadowBlur; shadowBlurVal.value = t.shadowBlur;
    shadowX.value = t.shadowOffsetX; shadowXVal.value = t.shadowOffsetX;
    shadowY.value = t.shadowOffsetY; shadowYVal.value = t.shadowOffsetY;
  }

  function writeTO(){
    const t = S.textOverlay;
    t.enabled = enabled.checked;
    t.text = input.value;
    t.fontFamily = font.value;
    t.layout = layout.value;
    t.fontSize = parseInt(txtSize.value,10) || 48;
    t.scale = parseInt(txtScale.value,10) || 100;
    t.textOffset = parseInt(vOff.value,10) || 0;
    t.fontWeight = parseInt(weight.value,10) || 400;
    if(txtColor) t.color = txtColor.value;
    t.strokeEnabled = stroke.checked;
    t.strokeColor = strokeColor.value;
    t.strokeWidth = parseInt(strokeWidth.value,10) || 2;
    t.shadowEnabled = shadow.checked;
    t.shadowColor = shadowColor.value;
    t.shadowBlur = parseInt(shadowBlur.value,10) || 4;
    t.shadowOffsetX = parseInt(shadowX.value,10) || 2;
    t.shadowOffsetY = parseInt(shadowY.value,10) || 2;
  }

  function onChangeTO(){ writeTO(); State.savePersistent(); Render.render(); }

  enabled.addEventListener('change', ()=>{ controls.style.display = enabled.checked ? 'block' : 'none'; onChangeTO(); });
  input.addEventListener('input', onChangeTO);
  font.addEventListener('change', onChangeTO);
  layout.addEventListener('change', onChangeTO);
  if(txtColor) txtColor.addEventListener('input', onChangeTO);

  const sliders = [
    {el:txtSize, val:txtSizeVal},
    {el:txtScale, val:txtScaleVal},
    {el:vOff, val:vOffVal},
    {el:weight, val:weightVal},
  ];
  sliders.forEach(({el,val})=>{
    el.addEventListener('input', ()=>{ if(val) val.value = el.value; onChangeTO(); });
    if(val) val.addEventListener('change', ()=>{ const v=parseInt(val.value,10)||0; val.value=v; el.value=v; el.dispatchEvent(new Event('input')); });
  });

  stroke.addEventListener('change', ()=>{ strokeCtrls.style.display = stroke.checked ? 'block' : 'none'; onChangeTO(); });
  strokeColor.addEventListener('input', onChangeTO);
  [{el:strokeWidth, val:strokeWidthVal}].forEach(({el,val})=>{
    el.addEventListener('input', ()=>{ val.value = el.value; onChangeTO(); });
    val.addEventListener('change', ()=>{ const v=parseInt(val.value,10)||1; val.value=v; el.value=v; el.dispatchEvent(new Event('input')); });
  });

  shadow.addEventListener('change', ()=>{ shadowCtrls.style.display = shadow.checked ? 'block' : 'none'; onChangeTO(); });
  shadowColor.addEventListener('input', onChangeTO);
  [{el:shadowBlur,val:shadowBlurVal},{el:shadowX,val:shadowXVal},{el:shadowY,val:shadowYVal}].forEach(({el,val})=>{
    el.addEventListener('input', ()=>{ val.value = el.value; onChangeTO(); });
    val.addEventListener('change', ()=>{ const v=parseInt(val.value,10)||0; val.value=v; el.value=v; el.dispatchEvent(new Event('input')); });
  });

  // expose for external reset
  window.tsResync = syncTextSymbol;
  window.toResync = syncTO;

  syncTextSymbol();
  syncTO();
})();
