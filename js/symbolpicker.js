// symbolPicker.js
(function(){
  const modal = document.getElementById('pickerModal');
  const overlay = document.getElementById('pickerOverlay');
  const openBtn = document.getElementById('openSymbolPicker');

  async function buildModal(){
    modal.innerHTML = '';
    const header = Utils.createEl('div',{class:'section-title'}, 'Symbols (click to pick, or + to add)');
    modal.appendChild(header);

    // Reform
    const reformSec = Utils.createEl('div',{class:'pickerSection'});
    reformSec.appendChild(Utils.createEl('div',{class:'section-title'},'Reform group'));
    const grid = Utils.createEl('div',{class:'pickerGrid'});
    State.defaultGreek.reform.forEach(fname=>{
      const btn = Utils.createEl('button',{class:'thumb'});
      const img = new Image(); img.src = 'assets/greek/' + fname;
      btn.appendChild(img);
      btn.addEventListener('click', ()=> selectBuiltInSymbol(fname,'reform',img));
      grid.appendChild(btn);
    });
    reformSec.appendChild(grid);
    modal.appendChild(reformSec);

    // RIP
    const ripSec = Utils.createEl('div',{class:'pickerSection'});
    ripSec.appendChild(Utils.createEl('div',{class:'section-title'},'RIP group'));
    const grid2 = Utils.createEl('div',{class:'pickerGrid'});
    State.defaultGreek.rip.forEach(fname=>{
      const btn = Utils.createEl('button',{class:'thumb'});
      const img = new Image(); img.src = 'assets/greek/' + fname;
      btn.appendChild(img);
      btn.addEventListener('click', ()=> selectBuiltInSymbol(fname,'rip',img));
      grid2.appendChild(btn);
    });
    ripSec.appendChild(grid2);
    modal.appendChild(ripSec);

    // Custom group with add button
    const customSec = Utils.createEl('div',{class:'pickerSection'});
    customSec.appendChild(Utils.createEl('div',{class:'section-title'},'Custom symbols'));
    const grid3 = Utils.createEl('div',{class:'pickerGrid'});
    const addBtn = Utils.createEl('button',{class:'thumb add'}, '+');
    addBtn.title = 'Add custom symbol';
    addBtn.addEventListener('click', ()=> promptAddSymbol());
    grid3.appendChild(addBtn);

    State.state.greekList.filter(g=>g.custom).forEach(g=>{
      const btn = Utils.createEl('button',{class:'thumb'});
      const im = g.img.cloneNode();
      btn.appendChild(im);
      btn.addEventListener('click', ()=> selectCustomSymbol(g));
      grid3.appendChild(btn);
    });

    customSec.appendChild(grid3);
    modal.appendChild(customSec);

    overlay.style.display = 'block';
    modal.style.display = 'block';
  }

  function closeModal(){ modal.style.display='none'; overlay.style.display='none'; }
  overlay.addEventListener('click', closeModal);

  openBtn.addEventListener('click', ()=> buildModal());

  function promptAddSymbol(){
    const input = document.createElement('input'); input.type='file'; input.accept='image/*';
    input.onchange = async (e)=>{
      const f = e.target.files[0]; if(!f) return;
      const img = await Utils.loadImageFromFile(f);
      State.addCustomSymbol(img, f.name);
      await buildModal();
    };
    input.click();
  }

  function selectBuiltInSymbol(fname, group, img){
    const idx = State.state.greekList.findIndex(g=>g.filename===fname && g.group===group);
    if(idx>=0){ State.state.selGreekIndex = idx; }
    else { State.state.greekList.push({ filename: fname, name: fname, img, custom:false, group }); State.state.selGreekIndex = State.state.greekList.length-1; }
    State.savePersistent();
    closeModal();
    updateSelectedPreview();
    Render.render();
    updateSelectedLabel();
  }

  function selectCustomSymbol(g){
    const idx = State.state.greekList.indexOf(g);
    if(idx>=0) State.state.selGreekIndex = idx;
    State.savePersistent();
    closeModal();
    updateSelectedPreview();
    Render.render();
    updateSelectedLabel();
  }

  function updateSelectedPreview(){
    const pv = document.getElementById('selectedSymbolPreview'); if(pv) pv.innerHTML='';
    const sidx = State.state.selGreekIndex;
    if(sidx >= 0 && State.state.greekList[sidx] && State.state.greekList[sidx].img){
      const im = State.state.greekList[sidx].img.cloneNode();
      im.style.width='100%'; im.style.height='100%'; im.style.objectFit='contain';
      const spot = document.getElementById('selectedSymbolPreview');
      if(spot){ spot.innerHTML=''; spot.appendChild(im); }
    }
  }

  window.SymbolPicker = { buildModal, updateSelectedPreview, closeModal };
})();
