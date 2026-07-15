# Dan Maker Editor

段位图排版合成工具。支持 Individual（单图）和 Marathon（四槽位）两种模式。

## 功能

- Individual / Marathon 双模式切换
- 拖入图片到 Canvas 作为背景（Individual）或添加到 Marathon 图片列表
- 希腊符号选取器（Reform / RIP 分组），支持上传自定义符号
- Text Symbol：用文字替代希腊图片作为符号，支持字体/字号/字重/颜色
- Subtitle：在符号下方或上方叠加一行文字，支持字体/字号/缩放/偏移/字重/颜色/描边/投影，间距可调
- 符号与文字的独立颜色编辑
- Symbol 变换：缩放 / 旋转 / 水平翻转 / 垂直翻转
- Glitch / RGB Shift 着色器特效，强度可调
- 边框选择（Reform / RIP / 自定义），自动检测默认染色，RGB 染色调节
- Marathon Slot 编辑：为 4 个槽位分配图片，独立控制 X 偏移 / Y 偏移 / 缩放 / 翻转
- 导出 PNG（FHD / HD / 2K / 4K / 自定义尺寸）
- 所有设置（自定义符号、染色、变换参数）持久化到 localStorage

## 使用方法

1. 将希腊符号 PNG 放入 `assets/greek/`，边框 PNG 放入 `assets/borders/`（文件名 `reform.png` 和 `rip.png`）
2. 使用现代浏览器打开 `index.html`
3. 拖入图片到 Canvas 操作
4. 所有控制项分布在左右侧面板：左侧为符号/文字/变换，右侧为模式/槽位/着色器

## 致谢

- 原始项目：[Dan-Maker](https://github.com/Brofriendosu/Dan-Maker)
- 字体：[EB Garamond](https://github.com/octaviopardo/EBGaramond)（SIL Open Font License）
- 字体：[Source Han Serif CN / 思源宋体](https://github.com/adobe-fonts/source-han-serif)（SIL Open Font License）
