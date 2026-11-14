# Mermaid Markdown（DSH 插件）

在 DSH 工作区里打开 Markdown 文件时，把其中的 ` ```mermaid ` 代码块实时渲染成图表；点击图表可放大预览。

## 这个插件做什么

- **在 Markdown 文件里渲染 mermaid**：打开 `.md` / `.markdown`，文档里的 mermaid 代码块显示成 SVG 图表，其余 Markdown 仍由 DSH 内置渲染器渲染（标题、列表、表格、代码块等样式与原来完全一致）。
- **非破坏**：它是「扩展优先」的文档渲染器，内置 Markdown 渲染器保留，可在预览工具栏切换回去。
- **点击放大预览**：点图表打开全屏放大视图，支持缩放（− / + / 重置；键盘 `+` `-` `0`；`Esc` 或点遮罩关闭）。
- **跟随主题**：浅色/深色主题切换时图表自动按对应主题重绘。

> 对话流里 AI 回复中的 ```mermaid 由你已安装的 `dsh-plugin-mermaid-preview` 负责，本插件不重复注册（避免冲突）。

## 使用方式

1. 刷新 DSH 页面后，在右侧「文件」栏打开一个 `.md` 文件。
2. 文档里的 ```mermaid 代码块显示成图表。
3. 点击图表 → 打开放大预览；底部工具栏或键盘缩放。

## 如何安装到 DSH

### GUI 添加本地目录（推荐）

1. 先在插件目录构建一次（见下）。
2. 侧栏「插件」→「添加插件（Add plugin）」→ 输入本地目录路径，例如 `C:\Users\sanga\Desktop\hw\mermaid`。
3. 启用后刷新页面。

### 已安装时更新

改完代码后：

```bash
cd mermaid
node build.mjs   # 重新产出 client.js
```

刷新页面即可（`client.js` 会被重新加载）。

### 构建

```bash
cd mermaid
pnpm install
node build.mjs
```

构建用 esbuild 把 `mermaid`、`markdown-it` 打进 `client.js`；`react`、`react-dom`、`@deepseek-ai/dsh-client-ui-primitives` 声明为外部依赖，运行时由 DSH 提供。

## 实现逻辑原理

### 1. 注册「扩展优先」的文档渲染器

文档预览是「按扩展名注册渲染器」的机制：

- `ctx.documentPreviews.register({ id, extensions: ['md', 'markdown'], priority: 'extension', loading: 'text-pages', ... })` —— `priority: 'extension'` 让本渲染器排在 `builtin` 的内置 Markdown 渲染器之前，自动成为 `.md` 的默认渲染器，同时内置渲染器仍作为候选保留。
- `ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({ key: DOCUMENT_ID }, MermaidMarkdownDocument))` —— 把正文组件注册到按实现 id 分发的文档插槽。

这两个注册都通过 `ctx.effect(...)` 绑定插件生命周期，卸载即清理。`inject` 里声明了 `documentPreviews`、`theme` 等硬依赖，保证成员在 `apply` 时已经就绪。

### 2. 复用内置 MarkdownText，只接管 mermaid

为了不重做 Markdown 排版，正文组件把 Markdown 按 mermaid 围栏切成若干段：

- `splitMarkdownSegments` 用 markdown-it 解析 token，只识别**闭合的** ` ```mermaid ` / ` ```mmd ` 围栏（未闭合的围栏留在 Markdown 里，流式时显示源码）；
- 非 mermaid 片段交给 DSH 内置的 `<MarkdownText>` 渲染（标题/列表/代码块等样式完全一致）；
- mermaid 片段交给 `<MermaidDiagram>` 渲染。

前置的 YAML frontmatter 由 `splitFrontmatter` 拆出，单独显示为元数据框。

### 3. mermaid 渲染核心

- `mermaid.js`：`initMermaid(colorScheme)` 一次性配置 mermaid（`securityLevel: 'strict'` 自带消毒），`renderMermaid(id, code)` 异步返回 SVG 字符串。
- `MermaidDiagram.jsx`：防抖后渲染，代码或主题变化时重绘；渲染失败回退为源码 + 错误提示，不会白屏。
- `theme.js`：一个极小的外部 store，`plugin.js` 在 `apply` 时读取当前主题并监听 `theme/change`，把明暗状态同步给所有图表。

### 4. 放大预览

`MermaidZoomOverlay.jsx` 用 `createPortal` 把全屏浮层挂到 `document.body`（避免被侧栏裁切），缩放 25%–800% 档位，关闭时恢复页面滚动。

### 5. 样式与打包

- `styles.js`：以内联 `<style>` 注入插件样式（外层内边距、frontmatter 框、图表间距、放大浮层），颜色走 `--dsw-alias-*` 主题 token。
- `build.mjs`：用 esbuild 把源码打成 DSH 客户端要求的 `window.__ModuleLoader__.load({ id, factory })` 模块，`react` 等外部依赖保留为 `require(...)`。

## 目录结构

```
mermaid/
├─ package.json          # 插件清单（bundle 补丁 + client 声明 + 构建脚本）
├─ cordis.patch.yml      # 把插件插入 DSH 的 Loader 补丁
├─ index.js              # Host 侧（空实现，渲染全在客户端）
├─ build.mjs             # esbuild 打包脚本
├─ client.js             # 构建产物（由 build.mjs 生成）
├─ icon.svg / locale/    # 插件图标与显示文案
├─ src/
│  ├─ plugin.js          # 客户端 apply：注册渲染器/插槽/主题/样式
│  ├─ definition.js      # 注册常量与文档渲染器定义
│  ├─ document.jsx       # 文档正文组件（MarkdownText + mermaid）
│  ├─ markdown.js        # 纯逻辑：frontmatter 拆分 + mermaid 分段
│  ├─ mermaid.js         # mermaid 初始化与渲染
│  ├─ MermaidDiagram.jsx # 单张图：异步渲染 + 错误回退 + 点击放大
│  ├─ MermaidZoomOverlay.jsx # 全屏放大预览
│  └─ theme.js / styles.js   # 主题 store / 插件样式
└─ test/                 # node:test 纯逻辑单测
```

## 已知限制

- 只处理 `.md` / `.markdown` 文件；独立 `.mmd` 文件与对话流交给已安装的 `dsh-plugin-mermaid-preview`。
- 相对图片路径暂不解析（`![](./x.png)` 会显示破图）；绝对 URL 正常。
- 复用 DSH 内部 `MarkdownText` 组件，将来 DSH 内部 API 变动时可能需要跟进。

## 卸载

侧栏「插件」→ 找到本插件 → 停用或卸载。
