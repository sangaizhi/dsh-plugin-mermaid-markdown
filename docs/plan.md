# Mermaid Markdown 渲染插件 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 DSH 工作区文件的 Markdown 预览和对话流 AI 回复中，把 ```mermaid 代码块实时渲染成 SVG 图表。

**Architecture:** 一个 client-only 插件，两个能力共享同一 mermaid 渲染核心 `MermaidDiagram`：能力 1 注册「扩展优先」的 Markdown 文档渲染器（`ctx.documentPreviews` + `sidebar.right.tab.document` 插槽）；能力 2 注册对话流 `mermaid` fence 层（`conversation.chat.markdown.fence` 插槽）。markdown-it / mermaid / dompurify 由 esbuild 打进 client bundle，仅 `react` 作为 external。

**Tech Stack:** JavaScript + JSX（esbuild 打包）、React 18、mermaid、markdown-it、dompurify、node:test（纯逻辑单测）、esbuild。

**Spec:** `docs/design.md`（本计划据此展开，随本计划一起读）。

## Global Constraints

- 禁止以模块方式 `require`/`import` 任何 `@deepseek-ai/*` client 包；只能使用 react（external）与自打包依赖。
- esbuild 打包时仅 `react`、`react/jsx-runtime` 为 external；mermaid、markdown-it、dompurify 全部内联进 `client.js`。
- 文档渲染器用 `priority: 'extension'`（或省略 priority）赢得内置 Markdown，**不得复用**内置 id `@deepseek-ai/dsh-client-ui-sidebar-documentpreview/markdown`。
- 渲染 SVG（非 canvas）；mermaid `theme` 随 `light`/`dark` 切换。
- 流式期间：fence 层渲染源码 `children`；文档预览不因未闭合的 ```mermaid 崩溃。
- 文案走 locale；英文用 sentence case（仅首字母/专有名词大写）。
- 构建与测试使用 `load_workspace_dependencies` 提供的 node / pnpm（`pnpm.mjs`），不用系统 PATH 里的 node。

## Review Focus

1. 一个语法错误的 mermaid 块：应显示源码 + 错误提示，不白屏、不崩溃。→ Task 6 验证（④）。
2. 一个文档含多个 mermaid 块：全部渲染且顺序正确。→ Task 2 单测。
3. 语言写成 `Mermaid`（大写）或 `mmd`：应识别为 mermaid。→ Task 2 单测。
4. 明暗主题切换时可见图表重绘为对应主题。→ Task 6 验证（③）。
5. 未闭合的 ```mermaid（流式中）：按普通代码/文本渲染，不抛异常。→ Task 2 单测。

---

### Task 1: Spike + 脚手架（打包管线 & mermaid 运行时可行性）

**Files:**
- Create: `mermaid/package.json`、`cordis.patch.yml`、`index.js`、`build.mjs`、`src/entry.js`、`src/plugin.js`、`src/spike/Spike.jsx`（临时）、`icon.svg`、`.gitignore`
- Init git: 在 `mermaid/` 内 `git init`

**Interfaces:**
- Consumes: 无（第一个任务）。
- Produces: 可运行的 `build.mjs`（产出 `client.js`）；验证过的 esbuild 配置；`package.json` 清单骨架。

- [ ] **Step 1: 初始化插件目录与 git**

Run: `cd mermaid && git init && git add -A && git commit -m "chore: scaffold plugin dir"`（目录已含 `docs/`，不再 `mkdir`）
Expected: `mermaid/.git` 存在。

- [ ] **Step 2: 写最小清单 package.json**

`dsh.bundle.patch` 指向 `./cordis.patch.yml`；`dsh.client` 为 `{ "platform": "web", "immediately": true, "inject": ["@deepseek-ai/dsh-client-ui-sidebar-documentpreview", "@deepseek-ai/dsh-client-ui-chat"] }`；`exports` 含 `.`→`./index.js`、`./client`→`./client.js`、`./locale/*.json`、`./icon`；`devDependencies` 含 `esbuild`、`mermaid`、`markdown-it`、`dompurify`；`scripts.build` = `node build.mjs`。

- [ ] **Step 3: 写 cordis.patch.yml（插入一行插件）**

`- insert: [{ id: mermaid-markdown, name: '@local/mermaid-markdown' }]`

- [ ] **Step 4: 写 Host no-op index.js**

`export function apply() {}`

- [ ] **Step 5: 写 build.mjs（esbuild 打包为 module-loader 格式）**

配置要点：`entryPoints: ['src/entry.js']`、`bundle: true`、`format: 'cjs'`、`platform: 'node'`、`external: ['react', 'react/jsx-runtime']`、`jsx: 'transform'`（`React.createElement`）、`outfile: 'client.js'`、`banner.js` 与 `footer.js` 包裹成 `window.__ModuleLoader__.load({ id: "@local/mermaid-markdown", factory: function(require){ var module={exports:{}}; var exports=module.exports;` … `return module.exports; }});`。

- [ ] **Step 6: 写 src/entry.js（ESM 入口，导出 inject/apply）**

`import * as React from 'react'`；导出 `inject`（`['slots', 'locale']`）与 `apply(ctx)`；`apply` 内先注册一个临时 Spike 组件到 `conversation.composer.dock` 插槽。

- [ ] **Step 7: 写 src/spike/Spike.jsx**

一个组件，`useEffect` 里调用 `mermaid.initialize({ startOnLoad:false })` + `mermaid.render('spike', 'graph TD; A-->B')`，把返回 SVG 用 `dangerouslySetInnerHTML` 渲染。

- [ ] **Step 8: 安装依赖并构建**

Run: `pnpm install && node build.mjs`
Expected: 生成 `client.js`，首行以 `window.__ModuleLoader__.load({` 开头、文件内含 mermaid 代码、`require("react")` 为 external 调用。

- [ ] **Step 9: 安装 bundle 并在浏览器验证 spike**

Run（经 plugin_manager）：`install_bundle` 指向 `mermaid/` 绝对路径。
Expected: 插件行出现；刷新 GUI 后 `conversation.composer.dock` 出现 Spike，显示一条 `graph TD` 的 SVG（A→B）。若 CSP/trusted-types 导致空白或报错，记录结论并调整注入方式（见设计文档「技术风险」）。

- [ ] **Step 10: 删除 spike 文件，提交**

删除 `src/spike/`，保留已验证的 `build.mjs` 与清单；`git commit -m "chore: verified esbuild client bundle pipeline"`。

---

### Task 2: markdown.js 纯逻辑（frontmatter 拆分 + mermaid 分段）

**Files:**
- Create: `src/markdown.js`
- Test: `test/markdown.test.js`
- Modify: `package.json`（`scripts.test` = `node --test test/`）

**Interfaces:**
- Consumes: `markdown-it`（devDep，打包时内联）。
- Produces:
  - `splitFrontmatter(text: string): { body: string, frontmatter: string | null }`
  - `isMermaidLanguage(info: string): boolean`（`mermaid`、`mmd`，大小写不敏感）
  - `splitMarkdownSegments(body: string): Array<{ kind: 'markdown', html: string } | { kind: 'mermaid', code: string }>`

- [ ] **Step 1: 写失败单测 test/markdown.test.js**

断言：
1. `splitFrontmatter('---\na: 1\n---\n# Hi')` → `{ frontmatter: 'a: 1', body: '# Hi' }`；无 frontmatter 输入 → `{ frontmatter: null, body: <原样> }`。
2. `isMermaidLanguage('mermaid')`、`'Mermaid'`、`'mmd'` → true；`'python'`、`'mermaidx'` → false。
3. `splitMarkdownSegments('# T\n\n```mermaid\ngraph TD; A-->B\n```\n\n- item')` → 三段：`{markdown, html 含 <h1>T</h1>}`、`{mermaid, code: 'graph TD; A-->B'}`、`{markdown, html 含 <li>item</li>}`，顺序正确。
4. 两个 mermaid 块 + 中间文本：全部识别、顺序正确。
5. 未闭合的 ```mermaid（无结束围栏）：整体作为 markdown 渲染，不抛异常、不产生 mermaid 段。

Run: `node --test test/`
Expected: FAIL（`splitFrontmatter`/`splitMarkdownSegments` 未定义）。

- [ ] **Step 2: 实现 src/markdown.js**

`splitFrontmatter` 用行级扫描识别开头 `---`…`---`/`...`；`splitMarkdownSegments` 用 markdown-it 的 token 流（`md.parse`）识别 `fence` 且 `isMermaidLanguage(token.info)` 的块，按行区间切分原文，非 mermaid 部分用 `md.render` 渲染（markdown-it 配置 `html: true` 并经 dompurify 消毒）。

- [ ] **Step 3: 运行单测通过**

Run: `node --test test/`
Expected: PASS。

- [ ] **Step 4: 提交**

`git add src/markdown.js test/markdown.test.js package.json && git commit -m "feat: markdown frontmatter split and mermaid segmentation"`

---

### Task 3: mermaid 核心（mermaid.js + theme store + MermaidDiagram.jsx）

**Files:**
- Create: `src/mermaid.js`、`src/theme.js`、`src/MermaidDiagram.jsx`

**Interfaces:**
- Consumes: `mermaid`（devDep）。
- Produces:
  - `initMermaid(colorScheme: 'light' | 'dark'): void`
  - `renderMermaid(id: string, code: string): Promise<string>`（resolve SVG 字符串，语法错误 reject）
  - `getColorScheme(): 'light' | 'dark'`、`subscribeColorScheme(fn: () => void): () => void`、`setColorScheme(v): void`
  - `<MermaidDiagram code={string} />`：渲染 SVG；渲染失败回退 `<pre>` 源码 + 错误文案。

- [ ] **Step 1: 写 src/mermaid.js 与 src/theme.js**

`mermaid.js`：单例 `initMermaid`（`mermaid.initialize({ startOnLoad:false, theme: colorScheme==='dark'?'dark':'default', securityLevel:'strict' })`）；`renderMermaid` 用计数器生成唯一 id、`await mermaid.render(id, code)` 返回 `svg`。
`theme.js`：模块级 `colorScheme` + 订阅集合 + `get/subscribe/set`（`set` 触发全部订阅）。

- [ ] **Step 2: 写 src/MermaidDiagram.jsx**

`useSyncExternalStore(subscribeColorScheme, getColorScheme)` 取主题；`useEffect` 里防抖调用 `renderMermaid(唯一id, code)`，写入 `svg` state，捕获错误写入 `error` state；卸载/更换 code 时取消过期结果（用 token 或 mermaid 的 cancel）。渲染：`error ? <pre>{code}</pre>+提示 : svg ? <div dangerouslySetInnerHTML={{__html: svg}}/> : 占位`。

- [ ] **Step 3: 构建验证**

Run: `node build.mjs`
Expected: 产出 `client.js`，无打包错误（mermaid 内联成功）。

- [ ] **Step 4: 提交**

`git add src/mermaid.js src/theme.js src/MermaidDiagram.jsx client.js && git commit -m "feat: mermaid render core and theme store"`

---

### Task 4: 能力 1 — 文档预览渲染器

**Files:**
- Create: `src/document.jsx`
- Modify: `src/plugin.js`、`src/entry.js`

**Interfaces:**
- Consumes: `splitMarkdownSegments`、`splitFrontmatter`（Task 2）、`MermaidDiagram`（Task 3）。
- Produces: `<MermaidMarkdownDocument content resourceAddress useResource />`；`plugin.js` 里注册文档渲染器。

- [ ] **Step 1: 写 src/document.jsx**

props 来自 `DocumentBodyOwner`：`content`（`{kind:'text', text, eof}`）、`resourceAddress`、`useResource`。取 `content.text`，`splitFrontmatter` 后对 body 用 `splitMarkdownSegments`，逐段渲染：markdown 段 `dangerouslySetInnerHTML`；mermaid 段 `<MermaidDiagram code={...} />`。相对图片路径用 `useResource` 解析到文件绝对路径（`markdownIt` 自定义 image render 或后处理）。

- [ ] **Step 2: 在 plugin.js 注册文档渲染器**

`ctx.documentPreviews.register({ id: '@local/mermaid/document', extensions: ['md','markdown'], priority: 'extension', loading: 'text-pages', wrap: false, title: () => t('document.title') })`；`ctx.slots.inject('sidebar.right.tab.document', () => ctx.slots.register({ name: 'sidebar.right.tab.document', key: '@local/mermaid/document', locale: NS }, MermaidMarkdownDocument))`。

- [ ] **Step 3: 构建 + 安装 + 浏览器验证**

Run: `node build.mjs`，再经 plugin_manager 重新安装/刷新。
Expected: 工作区打开 `.md`（含 ```mermaid）时，默认用本插件渲染，mermaid 显示为 SVG，其余 Markdown 正常；内置 Markdown 仍可在查看器切换（验证 Review Focus #2/#3）。

- [ ] **Step 4: 提交**

`git add src/document.jsx src/plugin.js src/entry.js client.js && git commit -m "feat: workspace markdown preview with mermaid"`

---

### Task 5: 能力 2 — 对话流 fence 层

**Files:**
- Create: `src/fence.jsx`
- Modify: `src/plugin.js`、`src/entry.js`

**Interfaces:**
- Consumes: `MermaidDiagram`（Task 3）。
- Produces: `<MermaidFenceLayer code lang streaming children />`；`plugin.js` 里注册 fence 层。

- [ ] **Step 1: 写 src/fence.jsx**

props `{ code, lang, streaming, children }`：`streaming` 时渲染 `children`（源码块）；否则渲染 `<MermaidDiagram code={code} />`。

- [ ] **Step 2: 在 plugin.js 注册 fence 层**

`ctx.slots.inject('conversation.chat.markdown.fence', () => ctx.slots.register({ name: 'conversation.chat.markdown.fence', key: 'mermaid', id: '@local/mermaid/fence/mermaid' }, MermaidFenceLayer))`。

- [ ] **Step 3: 构建 + 安装 + 浏览器验证**

Run: `node build.mjs`，重新安装/刷新。
Expected: 对话里 AI 回复的 ```mermaid 在流式期间显示源码、结束后渲染 SVG（验证 Review Focus #1/#5）。

- [ ] **Step 4: 提交**

`git add src/fence.jsx src/plugin.js src/entry.js client.js && git commit -m "feat: chat mermaid fence layer"`

---

### Task 6: 集成验证 + 显示元数据 + 收尾

**Files:**
- Create: `locale/en.json`、`locale/zh.json`（`meta.title`、`meta.description` 及本插件文案）
- Modify: `src/plugin.js`（theme store 接线）、`src/entry.js`、`package.json`（`files` 列表）

**Interfaces:**
- Consumes: `theme.js` 的 `setColorScheme`。
- Produces: 完整可安装 bundle；locale/icon 显示项。

- [ ] **Step 1: 在 plugin.js 接线主题**

`apply` 里：`const theme = ctx.get('theme'); if (theme) { setColorScheme(theme.getTheme().active.colorScheme); }` 并 `ctx.on('theme/change', snap => setColorScheme(snap.active.colorScheme))`（在 `ctx.effect` 内注册并返回清理）。

- [ ] **Step 2: 写 locale/en.json 与 locale/zh.json**

`meta.title`（如 `Mermaid in Markdown` / `Markdown Mermaid 渲染`）、`meta.description`（能力与限制一句话）、`document.title`、错误/加载文案。

- [ ] **Step 3: 补齐 package.json 的 files 与 icon**

`files: ["index.js", "client.js", "cordis.patch.yml", "locale/*.json", "docs", "icon.svg"]`；确认 icon 为合法 SVG 且 <256KiB。

- [ ] **Step 4: 最终构建 + 安装 + 全量验证**

Run: `node build.mjs`，重新安装。
Expected：① 工作区 `.md` 的 mermaid 渲染、切回内置查看器正常；② 对话 mermaid 渲染；③ 明暗主题切换重绘；④ 语法错误块显示源码+错误不白屏；⑤ 插件页标题/描述/图标正常。

- [ ] **Step 5: 提交**

`git add -A && git commit -m "feat: theme sync, locales, and plugin metadata"`
