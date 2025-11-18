// dragOffset.js - dragging for marathon slots and individual background (left-click drag)
(function(){
  const canvas = Render.canvas;
  let dragging = false;
  let dragInfo = null;

  function getCanvasPos(e){
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches ? e.touches[0].clientX : e.clientX);
    const clientY = (e.touches ? e.touches[0].clientY : e.clientY);
    const x = (clientX - rect.left) * (1920 / rect.width);
    const y = (clientY - rect.top) * (1080 / rect.height);
    return {x,y};
  }

  function findSlotUnder(x,y){
    const S = State.state;
    const slots = S.SLOTS[S.marBorderMode] || S.SLOTS.reform;
    for(let i=0;i<slots.length;i++){
      const s = slots[i];
      if(x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h) return {slot: s, index: i};
    }
    return null;
  }

  canvas.addEventListener('pointerdown', (ev)=>{
    if(ev.button !== 0) return; // left button only
    const pos = getCanvasPos(ev);
    const S = State.state;
    // If in marathon and clicked inside slot with assigned image -> start slot dragging
    if(S.mode === 'marathon'){
      const found = findSlotUnder(pos.x,pos.y);
      if(found){
        const assigned = S.marImages.find(m=>m.slot === (found.index+1));
        if(assigned){
          dragging = true;
          dragInfo = { type:'slot', slotIndex: found.index, startX: pos.x, startOffset: assigned.offsetX || 0 };
          canvas.setPointerCapture(ev.pointerId);
          return;
        }
      }
    }
    // If in individual and clicked empty area (not symbol, not slot) -> start background pan
    if(S.mode === 'individual'){
      // we need to ensure click not on symbol: handled in app click selection; if selected background and click on canvas, allow drag
      const target = document.getElementById('editTargetSelect').value;
      if(target === 'individual'){
        dragging = true;
        dragInfo = { type:'bg', startX: pos.x, startY: pos.y, startOffsetX: S.indMeta.offsetX || 0, startOffsetY: S.indMeta.offsetY || 0 };
        canvas.setPointerCapture(ev.pointerId);
      }
    }
  });

  window.addEventListener('pointermove', (ev)=>{
    if(!dragging || !dragInfo) return;
    const pos = getCanvasPos(ev);
    if(dragInfo.type === 'slot'){
      const dx = pos.x - dragInfo.startX;
      const sensitivity = 0.22;
      const slot = State.state.SLOTS[State.state.marBorderMode][dragInfo.slotIndex];
      let delta = dx / slot.w * 2 * sensitivity;
      const assigned = State.state.marImages.find(m=>m.slot === (dragInfo.slotIndex+1));
      if(assigned){
        assigned.offsetX = Utils.clamp(dragInfo.startOffset + delta, -1, 1);
        Render.render();
      }
    } else if(dragInfo.type === 'bg'){
      const dx = pos.x - dragInfo.startX;
      const dy = pos.y - dragInfo.startY;
      const arImg = State.state.indBg ? (State.state.indBg.width / State.state.indBg.height) : 1;
      // translate deltas into offset units (visual choice)
      const nx = Utils.clamp(dragInfo.startOffsetX + dx / 600, -2, 2);
      const ny = Utils.clamp(dragInfo.startOffsetY + dy / 600, -2, 2);
      State.state.indMeta.offsetX = nx;
      State.state.indMeta.offsetY = ny;
      Render.render();
    }
  });

  window.addEventListener('pointerup', (ev)=>{
    if(!dragging) return;
    dragging = false; dragInfo = null;
    State.savePersistent();
  });

})();
