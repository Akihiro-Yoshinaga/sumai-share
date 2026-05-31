import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const distDir = resolve(import.meta.dirname, '../dist');
const gasDir  = resolve(import.meta.dirname, '../gas-deploy');

mkdirSync(gasDir, { recursive: true });

// JS取得
const distFiles = readdirSync(distDir);
const jsFile = distFiles.find(f => f.endsWith('.js'));
if (!jsFile) { console.error('JS not found'); process.exit(1); }
const js = readFileSync(join(distDir, jsFile), 'utf-8');

// CSS取得
let css = '';
try {
  const assetsFiles = readdirSync(join(distDir, 'assets'));
  const cssFile = assetsFiles.find(f => f.endsWith('.css'));
  if (cssFile) css = readFileSync(join(distDir, 'assets', cssFile), 'utf-8');
} catch {}

// JS を85KBチャンクに分割（プレーンテキスト — タグなし）
// Code.gs が getContent() で取得して文字列結合する
const CHUNK_SIZE = 85000;
const chunks = [];
for (let i = 0; i < js.length; i += CHUNK_SIZE) {
  chunks.push(js.slice(i, i + CHUNK_SIZE));
}

if (chunks.length !== 4) {
  // Code.gs のチャンク数と合わせる必要があるので警告
  console.warn(`WARNING: ${chunks.length} chunks generated but Code.gs expects 4. Update Code.gs accordingly.`);
}

chunks.forEach((chunk, i) => {
  writeFileSync(join(gasDir, `js_part_${i}.html`), chunk, 'utf-8');
  console.log(`js_part_${i}.html: ${(chunk.length / 1024).toFixed(1)} KB`);
});

// CSS もプレーンテキストとして保存
writeFileSync(join(gasDir, 'app_css.html'), css, 'utf-8');
console.log(`app_css.html: ${(css.length / 1024).toFixed(1)} KB`);

// index.html は不要（Code.gs が直接HTMLを組み立てる）
// ただしclaspのpushに必要なのでダミーとして残す
writeFileSync(join(gasDir, 'index.html'), '<!-- unused: Code.gs builds HTML directly -->', 'utf-8');

console.log(`\n✓ Done. ${chunks.length} JS chunks + app_css + index(dummy)`);
