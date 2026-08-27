#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const { embedJSToImage } = require('../src/encoder');

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.log(`
🔒 SecretScript CLI

Usage:
  npx secretscript <input.js> <base.png> <output.png> [secretKey]

Example:
  npx secretscript target.js soren.png stego_output.png myPassword123
    `);
    process.exit(1);
  }

  const [jsFile, inputImg, outputImg, key = 'default-secret-key'] = args;

  const resolvedJS = path.resolve(process.cwd(), jsFile);
  const resolvedInput = path.resolve(process.cwd(), inputImg);
  const resolvedOutput = path.resolve(process.cwd(), outputImg);
  const outputDir = path.dirname(resolvedOutput);

  console.log('🚀 難読化パッキングを開始します...');

  try {
    // 1. 画像への書き込み完了を待機
    await embedJSToImage(resolvedJS, resolvedInput, resolvedOutput, key);

    // 2. Wasmフォルダのコピー
    const wasmSrcDir = path.resolve(__dirname, '../wasm');
    const wasmDestDir = path.join(outputDir, 'wasm');

    if (!fs.existsSync(wasmSrcDir)) {
      console.error(`❌ エラー: コピー元の Wasm フォルダが存在しません: ${wasmSrcDir}`);
      process.exit(1);
    }

    if (!fs.existsSync(wasmDestDir)) {
      fs.mkdirSync(wasmDestDir, { recursive: true });
    }

    fs.readdirSync(wasmSrcDir).forEach((file) => {
      const srcFile = path.join(wasmSrcDir, file);
      const destFile = path.join(wasmDestDir, file);
      fs.copyFileSync(srcFile, destFile);
    });

    console.log(`📦 Wasmデコーダー一式を出力しました: ${wasmDestDir}`);
  } catch (err) {
    console.error('❌ パッキング失敗:', err);
    process.exit(1);
  }
}

main();