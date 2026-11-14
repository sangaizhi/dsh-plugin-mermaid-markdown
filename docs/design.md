# 设计文档：Mermaid Markdown 渲染插件

日期：2026-11-14
包名（拟定）：`@local/mermaid-markdown`
目录：`mermaid/`

## 意图与动机

用户在工作区文件里打开 Markdown 文件时，希望其中的 ```mermaid 代码块自动渲染成图表；同时也希望对话里 AI 回复中的 mermaid 代码块渲染成图。当前 DSH 的 Markdown 预览只把 mermaid 当普通代码块显示。

## 目标

1. **工作区文件预览**：打开 `.md` / `.markdown` 时，```mermaid 块渲染成 SVG 图表，其余 Markdown 照常渲染。
2. **对话流**：AI 回复中的 ```mermaid 块在流式结束后渲染成图；流式期间显示源码。
3. **实时性**：文件内容变化时重绘；明暗主题切换时重绘。
4. **非破坏**：内置 Markdown 渲染器保留，用户可在工具栏切换回去。

## 非目标

- 不做 Markdown 编辑器（只读预览）。
- 不渲染 mermaid 之外的其他图表格式（如 PlantUML）。
- 不修改源文件。

## 反目标

- 不读取/改写其他插件渲染出的 DOM。
- 不以模块方式 require DSH 内部 client 包（`@deepseek-ai/dsh-client-ui-*` 等）。
- 不用 CDN / UMD 脚本加载 mermaid。

## 约束

- 插件规范禁止 import `@deepseek-ai/dsh-client-ui-primitives` 等内部包，因此必须自行打包 markdown 解析器 + mermaid。
- mermaid 较重（约 2–3 MB）→ 打进 client bundle。
- 本机有 node / pnpm，可用 esbuild 打包。

## 已确认契约（来自源码 / 运行时检查）

以下契约已核实，实现者无需再猜：

- **文档预览注册表**（`@deepseek-ai/dsh-client-ui-sidebar-documentpreview` 的 `document/registry.ts`）：`DocumentPreviewDefinition = { id, extensions, binaryExtensions?, priority?: 'builtin' | 'extension', title: () => string, loading: 'text-pages' | 'bytes-complete' | 'renderer', wrap?: boolean, sourceLines?: boolean }`。排序规则：`priority === 'builtin'` 记为 0，否则（含省略）记为 1，先按此降序、再按后缀长度、再按注册顺序 → **省略 priority 即默认「扩展」带，优先级高于内置**。
- **文档正文插槽 props**（`document/contract.ts`）：`DocumentBodyOwner = { addResource, setResources, resourceAddress, content: DocumentContent, wrap, scrollportRef }`；文本模式 `content = { kind: 'text', text, pages, eof }`。标准 props 含 `useResource`。
- **主题服务**：`ctx.theme.getTheme(): ThemeSnapshot`，`snapshot.active.colorScheme` 为 `'light' | 'dark'`；主题变化通过 `theme/change` 事件同步（`ctx.on('theme/change', …)`）。
- **fence 插槽契约**：HOC 层收到 `{ lang, code, streaming, meta? }`，`children` 为默认代码块；注册形如 `ctx.slots.inject('conversation.chat.markdown.fence', () => ctx.slots.register({ name, key: 'mermaid', id, locale }, Layer))`。

## 方案

唯一合理路线：注册「扩展优先」的 Markdown 渲染器（工作区预览）+ 注册 `mermaid` fence 层（对话流），两者共享同一个 mermaid 渲染核心 `MermaidDiagram`。

其他路线为何不行：

- 对话流的 `conversation.chat.markdown.fence` 插槽只作用于 AI 回复，管不到文件预览，单独用它无法满足「工作区文件」需求。
- 「渲染后再改 DOM」的 hack 既脆弱又违反插件规范（不得读取其他插件 DOM）。

## 实现要点

### 能力 1：工作区 Markdown 预览

- 在 `ctx.documentPreviews` 注册元数据：`{ id: '<pkg>/markdown', extensions: ['md','markdown'], priority: 'extension', loading: 'text-pages', wrap: false, title }`。`priority: 'extension'` 使其优先于内置 Markdown 渲染器，内置的仍作为候选可切换。
- 在 `sidebar.right.tab.document` 插槽以该 id 为 key 注册组件。
- 组件读取 `content.text`（含 `eof` 流式标记），用 markdown-it 渲染 HTML（DOMPurify 消毒），mermaid 代码块替换为 `<MermaidDiagram>`。
- 处理 frontmatter（简单正则拆分，避免误渲染）；相对图片路径按文件所在目录解析（用 `resourceAddress` / `useResource` 得到绝对路径）。

### 能力 2：对话流 fence 层

- 在 `conversation.chat.markdown.fence` 插槽以 `key: 'mermaid'` 注册一个 HOC 层。
- 层收到 `{ code, lang, streaming, children }`：`streaming` 时渲染 `children`（源码块），结束后渲染 `<MermaidDiagram code={code} />`。

### 共享核心：MermaidDiagram

- 一次 `mermaid.initialize({ startOnLoad: false, theme, ... })`。
- `mermaid.render(唯一id, code)` → SVG，写入 React state。
- `code` / 主题变化时防抖重绘；渲染失败回退到源码 + 小提示。
- 每个实例用计数器/哈希生成唯一 id，避免 mermaid 渲染 id 冲突。

### 主题

- 读 `ctx.theme.getTheme().active.colorScheme`（'light' | 'dark'）→ mermaid `theme: 'default' | 'dark'`。
- 监听 `theme/change` 重绘当前图表。

### 打包与清单

- client 源码 → esbuild 打包（external：`react`、`react-dom`、`react/jsx-runtime`），产出 `window.__ModuleLoader__.load` 格式。
- 依赖：`mermaid`、`markdown-it`、`dompurify`。
- Host 侧 `index.js` 为 no-op `apply() {}`（渲染全在 client）。
- manifest：`dsh.bundle.patch` + `dsh.client.inject`（声明 documentpreview / chat 等包的加载顺序）。
- 显示清单：locale 标题/描述 + icon。

## 已知取舍

- 替换 Markdown 渲染器意味着本插件要负责全部 Markdown 渲染（标题、列表、表格、代码块、图片等）。markdown-it 覆盖常见语法，但内置渲染器的代码块交互（复制/换行等）不会完全复刻，第一版以「正确渲染 + mermaid」为目标。

## 技术风险与待验证（实现期优先处理）

1. **mermaid 在此 client 运行时能否真正渲染（最高风险，先 spike）**：需验证应用 CSP / trusted-types 是否放行 mermaid 产出的内联 `<style>`、`foreignObject` 等，以及 mermaid 自带消毒在 client 运行时是否生效。若不行，需要换注入方式（例如只允许 SVG 子集 / 转 `<img src="data:image/svg+xml">`）。实现第一步就做这个 spike。
2. **「切回内置渲染器」机制**：确认预览宿主在存在多个候选时是否自动提供查看器切换（registry 会保留「较低优先级候选」，倾向于是免费的），否则需自建切换控件。

## 留给实现者

- mermaid 具体版本与 render API 选择（`mermaid.render` vs `mermaid.run`）。
- 消毒策略细节（markdown HTML 消毒；信任 mermaid 自身对 SVG 的消毒）。
- 防抖时间与唯一 id 生成。
