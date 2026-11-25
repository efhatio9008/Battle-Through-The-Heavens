# 斗破苍穹 · 九年炎帝盛典

2017 — 2026 动画九周年纪念站 V3（第六页 3D 角色与移动端优化）。使用 HTML5、CSS3 和 JavaScript ES Modules，无需构建或安装 npm 依赖。浏览器验收在 GitHub Pages 上进行。

## 页面与交互

| 页面 | 内容 |
| --- | --- |
| `index.html` | 四图轮播。可点击翻页、暂停、选择指示器，或在轮播区域使用方向键与触屏滑动。 |
| `pages/game.html` | 逐批解锁并收集 22 种异火，完成六次融合后诞生帝炎。 |
| `pages/journey.html` | 四段成长纪念。2017 — 2026 是动画纪念跨度。 |
| `pages/video.html` | 原生 HTML5 播放器。预加载元数据，播放、进度、音量和全屏由浏览器提供。 |
| `pages/dialogue.html` | 填写五项资料后，从五个预设问题中选择并查看萧炎的回复。资料和记录只在当前页面使用。 |
| `pages/character.html` | 萧炎 3D 模型、拳击、前踢、跑步、暂停、停止、变速、旋转、缩放及隐藏。 |

轮播在指针悬停、键盘焦点进入或标签页不可见时暂停计时，并在开启减少动态效果时默认停止自动播放。

六个页面由 `js/site-router.js` 接管普通站内链接和前进、后退。导航替换主内容并清理离开的页面，由同一顶层文档中的 `js/background-music.js` 持续循环播放 `music/1.mp3`（《遂愿》）。首次载入尝试播放，遇到浏览器自动播放限制时在首次有效互动中重试一次。刷新、地址栏完整导航或新标签页会启动各自的文档和音乐实例。

## 异火融合

| 阶段 | 新解锁 | 累计门槛 | 融合结果 |
| --- | ---: | ---: | --- |
| 初炼异火 | 5 | 5 | 第一次融合 |
| 双脉同燃 | 5 | 10 | 第二次融合 |
| 焰阵初成 | 5 | 15 | 第三次融合 |
| 百炼一心 | 5 | 20 | 第四次融合 |
| 二十二火 | 2 | 22 | 万火归宗 |
| 帝炎觉醒 | 0 | 22 | 第 23 种异火帝炎诞生 |

游戏阶段、解锁顺序与帝炎触发方式属于本站纪念玩法。[原著目录](https://www.webnovel.com/book/22344671000280502) · [八色火莲](https://www.webnovel.com/book/22344671000280502/95970430060954011) · [双帝之战](https://www.webnovel.com/book/22344671000280502/95970464413155743)

第五次融合完成后，玩家点击「融合帝炎」进入庆祝画面。按 Esc 或「返回游戏」可关闭，修炼完成后也可重看。重置会清空异火与阶段进度。

## 萧炎对白

系统提供五个预设问题，每题对应四条固定回复，在各自题组内依序轮换。所选问题和萧炎的回复会依次加入对话记录。

「清除对话」清空消息并保留资料，方便继续交流。「重新填写资料」清除旧对话，并打开表单供修改。所有资料和消息仅在浏览器页面中使用。

## 文件维护

- `css/site.css` 包含共享排版、色彩、导航及通用组件。六个页面各有独立样式文件。
- 各页面将对应的同名模块挂载到当前主内容。离开页面时，路由中止该视图的生命周期。`js/media-image.js` 提供共享图片创建逻辑。
- `js/data/media.js` 记录媒体文件、图片尺寸、替代文字、裁切位置和纪念文案。
- `js/data/flames.js` 配置异火和阶段，`js/ascension.js` 管理收集、融合与重置，`css/victory.css` 定义最终庆祝效果。
- `js/data/dialogue.js` 保存五个问题及 20 条回复，`js/dialogue-rules.js` 负责按题轮换。
- `photo/` 保存实际提供的 8 张 JPEG。Home 使用 `1.jpg`、`5.jpg`、`6.jpg`、`7.jpg`，Journey 使用 `8.jpeg`、`2.jpg`、`3.jpg`、`4.jpg`。
- `video/1.mp4` 是原始纪念视频，约 348 MB。Video 使用 `5.jpg` 作为封面。如浏览器读取或解码失败，播放器会显示原因并提供原视频下载。

游戏进度保存在本页内存中，刷新页面会重新开始。替换轮播首图时，同步更新 `index.html` 的首屏图片和 `js/data/media.js` 的第一项。

## 部署到 GitHub Pages

原始视频 `video/1.mp4` 有 **347,978,230 字节（331.86 MiB）**，超过 GitHub 普通 Git 的 100 MiB 单文件限制。它由 `.gitignore` 排除。发布时把原视频作为同仓库 GitHub Release 的附件，手动触发的 Pages 工作流会下载附件并打包为站点内的 `video/1.mp4`。本地和线上共用同一个相对媒体路径。[GitHub 文件大小限制](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github) · [Release 附件大小限制](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)

1. 将站点源文件、`photo/`、`models/` 和 `music/1.mp3` 提交并推送到 GitHub 仓库的默认分支。检查普通 Git 提交中没有 `video/1.mp4`，并包含 `.github/workflows/pages.yml` 和 `.gitignore`。
2. 初次部署时，在同一仓库打开 **Releases → Draft a new release**，创建标签 `anniversary-media`，将原视频作为名为 `1.mp4` 的附件上传并发布。V2 可继续使用已发布的同名附件。
3. 在 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。[配置发布来源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
4. 在 **Actions → Deploy anniversary site to GitHub Pages → Run workflow** 选择默认分支。使用 `anniversary-media`，或填写第 2 步实际使用的标签。工作流仅支持手动启动。
5. 在部署任务中打开站点链接。项目站点通常为 `https://<账号>.github.io/<仓库名>/`。在桌面和手机检查切页时的音乐、浏览器前进后退、轮播与视频，并走完六次融合、关闭与重看庆祝、重置、填写资料、选择五个问题和清除对话。

GitHub Pages 公布的站点容量上限为 1 GB、每月流量软上限为 100 GB。当前发布包约 349 MB，主要由原视频占用。[GitHub Pages 使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

## V3：3D 角色与移动端优化

- `models/xiao-yan.glb` 为用户提供的原始文件，保持原始 4K 色彩纹理、65 个骨骼关节和 3 个动画。
- `models/xiao-yan-mobile.glb` 保留几何和骨骼动画数据，色彩纹理缩至 2K，其余纹理 1K。手机和触屏设备自动选择轻量模型，限制渲染分辨率与动画刷新率（目标约 30 FPS）。
- `js/character-renderer.js` 为适用于此 GLB 的独立 WebGL 2 蒙皮播放器；不依赖 CDN。网页采用简化实时灯光，视觉可能与 Tripo 或 Godot 不完全相同。浏览器需支持 WebGL 2。
- 角色页按需加载，静止、隐藏、离开页面或切换后台时停止持续渲染，切页释放图形资源。
- 手机按钮使用原生快速点击，保留网页双指缩放；iOS 的异火闪烁、光晕和庆祝特效简化，缩短普通融合演出时间。原有游戏规则不变。
- 原视频未随本 ZIP 提供。若本地使用，将原 `1.mp4` 放回 `video/`；GitHub Pages 继续从原 Release 下载，不必重新上传已经发布的视频。
- 本地预览：解压后在网站目录运行 `node serve.mjs`，打开 `http://127.0.0.1:8000/`。也可以使用已有静态服务器。不要直接双击 HTML（ES Modules 需 HTTP）。
- 验收：在真实 iPhone Safari 测试首次点击、视频原生控件、Game 双指缩放、Character 三个动作、暂停/复位及手机温度/流畅度。当前环境未能执行真实浏览器 WebGL 测试。
