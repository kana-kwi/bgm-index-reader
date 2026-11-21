# 项目规则

## 修改前必须备份

修改 `bgm-index-reader.user.js` 之前，必须先把当前版本备份到 `backups/`：

- 源码：`backups/bgm-index-reader-{version}-{YYYY-MM-DD}.user.js`
- 若 `dist/bgm-index-reader.lean.user.js` 存在，一并备份为 `backups/bgm-index-reader-{version}-{YYYY-MM-DD}.lean.user.js`
- `{version}` 从源码头部 `@version` 读取（如 `0.1.39`）；同一天多次修改时追加序号（`-2`、`-3`）
- 使用 Node 的 `fs.copyFileSync` 复制，不要用 PowerShell `Get-Content`/`Set-Content` 读写源码（曾因 GBK 解码损坏中文）
- 备份文件不要删除，除非用户明确要求

任何会改变行为的编辑（含回退、重做、紧急修复）都先执行备份；不要因为“只是改一行”而跳过。

## 构建与验证

- 测试：`npm test`；精简版回归：`$env:BGM_IDX_SCRIPT="../dist/bgm-index-reader.lean.user.js"; npm test`
- 构建：`npm run build`
- UI 缺陷先到真实浏览器验证，再下结论（见项目记忆中的 CDP 验证方法）