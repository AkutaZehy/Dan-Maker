// transform.js: syncing inputs to state for correct target separation
(function(){
  function bind(){
    const zoom = document.getElementById('zoom');
    const zoomVal = document.getElementById('zoomVal');
    const scaleX = document.getElementById('editScaleX');
    const scaleY = document.getElementById('editScaleY');
    const scaleXVal = document.getElementById('scaleXVal');
    const scaleYVal = document.getElementById('scaleYVal');
    const rotate = document.getElementById('editRotate');
    const rotateVal = document.getElementById('rotateVal');
    const advToggle = document.getElementById('advToggle');

    function updateLabels(){
      zoomVal.value = zoom.value;
      scaleXVal.value = scaleX.value;
      scaleYVal.value = scaleY.value;
      rotateVal.value = rotate.value;
    }

    [zoom, scaleX, scaleY, rotate].forEach(el=> el.addEventListener('input', ()=>{
      const target = document.getElementById('editTargetSelect').value;
      if(target === 'symbol'){
        // symbol uses its own symbolZoom slider; don't apply zoom here
      } else if(target === 'individual'){
        State.state.indMeta.zoom = parseInt(zoom.value,10);
        State.state.indMeta.scaleX = parseInt(scaleX.value,10);
        State.state.indMeta.scaleY = parseInt(scaleY.value,10);
        State.state.indMeta.rotate = parseFloat(rotate.value) || 0;
      } else if(target === 'marathon'){
        const sel = document.getElementById('editTargetSelect').dataset.slotIndex;
        if(sel){
          const assigned = State.state.marImages.find(m=>m.slot === parseInt(sel,10));
          if(assigned){
            assigned.meta.zoom = parseInt(zoom.value,10);
            assigned.meta.scaleX = parseInt(scaleX.value,10);
            assigned.meta.scaleY = parseInt(scaleY.value,10);
            assigned.meta.rotate = parseFloat(rotate.value) || 0;
          }
        }
      }
      updateLabels();
      State.savePersistent();
      Render.render();
    }));

    // numeric inputs editable
    ['zoomVal','scaleXVal','scaleYVal','rotateVal'].forEach(id=>{
      const el = document.getElementById(id);
      el.addEventListener('change', ()=>{
        const val = parseFloat(el.value) || 0;
        if(id==='zoomVal') document.getElementById('zoom').value = val;
        if(id==='scaleXVal') document.getElementById('editScaleX').value = val;
        if(id==='scaleYVal') document.getElementById('editScaleY').value = val;
        if(id==='rotateVal') document.getElementById('editRotate').value = val;
        // trigger input
        document.getElementById('zoom').dispatchEvent(new Event('input'));
      });
    });
  }
  bind();
})();
