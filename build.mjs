/**
 * Bundle the client half into the `window.__ModuleLoader__.load` format the
 * DSH client runtime loads. React stays external (resolved from the browser
 * module table through the factory's `require`); mermaid, markdown-it, and
 * dompurify are inlined.
 *
 * esbuild's JS API spawns its native binary with piped stdio, which this
 * sandbox blocks, so we invoke the esbuild binary directly with inherited
 * stdio.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, globSync } from 'node:fs'

const id = '@local/mermaid-markdown'

const exe = [
  'node_modules/@esbuild/win32-x64/esbuild.exe',
  ...globSync('node_modules/.pnpm/@esbuild+win32-x64*/node_modules/@esbuild/win32-x64/esbuild.exe'),
].find((p) => existsSync(p))
if (!exe) throw new Error('esbuild native binary not found')

const args = [
  'src/plugin.js',
  '--bundle',
  '--format=cjs',
  '--platform=node',
  '--target=es2020',
  '--external:react',
  '--external:react/jsx-runtime',
  '--external:react-dom',
  '--external:@deepseek-ai/dsh-client-ui-primitives',
  '--jsx=automatic',
  '--outfile=client.js',
  `--banner:js=window.__ModuleLoader__.load({id:${JSON.stringify(id)},factory:function(require){var module={exports:{}};var exports=module.exports;`,
  '--footer:js=return module.exports;}});',
  '--log-level=info',
]

const r = spawnSync(exe, args, { stdio: 'inherit' })
process.exit(r.status ?? 1)
