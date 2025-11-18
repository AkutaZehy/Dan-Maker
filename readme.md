# Dan Maker — Editor

Files included:
- index.html
- css/*.css
- js/*.js
- assets/greek/ (put your symbol PNG files here)
- assets/borders/reform.png and rip.png

Features:
- Individual & Marathon modes
- Drag images onto canvas (individual => set background, marathon => append images)
- Drag horizontally on a slot to offset the image inside that slot (no overlap)
- Grouped symbol picker (Reform / RIP) with green '+' to add custom symbols
- Border selection with left/right toggle and vertical RGB sliders (auto-detect default tint)
- Simple crop/scale editor (right panel) with scaleX/scaleY/rotate
- Persist custom symbols & tint values in localStorage

How to use:
1. Put your greek PNGs in `assets/greek/` and border PNGs in `assets/borders/` (names `reform.png` and `rip.png`).
2. Open `index.html` in a modern browser.
3. Drop images onto the canvas or use the Marathon drop area to add multiple images.
4. Assign images to slots from the marathon list, drag inside a slot to reposition, use Edit to scale/rotate.

Notes:
- This is a modular starter. You can enhance the crop editor to add resizable cropping rectangles.
- Persisted custom symbols are stored in localStorage under key `danmaker_v1`.
