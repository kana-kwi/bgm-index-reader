# bgm-index-reader

Bangumi 目录页 / 收藏页的卡片化阅读优化，单文件 UserScript，同时可作为 Bangumi 超合金组件使用。

## 功能

- 目录页 `/index/{id}`、我的目录 `/user/{name}/index`：双列卡片、封面墙、时间轴、类型分隔、搜索与排序
- 收藏页 `/anime|book|music|game|real/list/{user}/{status}`：与目录页统一卡片样式、每页数量/全部、懒加载、全收藏搜索
  - 主分数显示**收藏主人**的个人评分（不显示站点平均分与评分人数）
  - 同时保留**访问者自己**的评分（粉色小数字）
- 条目页 `/subject/{id}`：收藏框「收录」按钮
- 角色目录：角色卡片与立绘

只修改页面展示，不接管站点的收藏/评分写入；可通过 `window.__BGM_IDX_READER_DESTROY__()` 一键回滚。

## 安装

### Tampermonkey

安装 `dist/bgm-index-reader.lean.user.js`（精简版，推荐）或 `bgm-index-reader.user.js`（源码版）。

### Bangumi 超合金组件

把 `dist/bgm-index-reader.lean.user.js` 的内容粘贴到组件编辑页的脚本框并更新。

## 开发

```bash
npm install
npm test
npm run build
```

- `npm test`：jsdom 回归测试
- 精简版回归：`$env:BGM_IDX_SCRIPT="../dist/bgm-index-reader.lean.user.js"; npm test`
- `npm run build`：生成 `dist/bgm-index-reader.lean.user.js`

## 备份约定

修改 `bgm-index-reader.user.js` 前，先把当前版本复制到 `backups/`：

- `backups/bgm-index-reader-{version}-{YYYY-MM-DD}.user.js`
- `backups/bgm-index-reader-{version}-{YYYY-MM-DD}.lean.user.js`（精简版）

同日多次修改追加 `-2`、`-3`。详见 `AGENTS.md`。

## 目录结构

```
bgm-index-reader.user.js        源码
dist/bgm-index-reader.lean.user.js  构建产物
build.mjs                       构建脚本
test/                           jsdom 测试与夹具
backups/                        历史版本备份
```