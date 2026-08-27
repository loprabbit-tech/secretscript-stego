# secretscript-stego 🚀

> JavaScript steganography obfuscator powered by WebAssembly

JavaScript コードを難読化・暗号化し、ステガノグラフィー技術を用いて PNG 画像の LSB（Least Significant Bit）領域へ潜伏・パッキングするツールです。

出力された画像データと付属の WebAssembly (Wasm) デコーダー環境を使用することで、Webブラウザや軽量ランタイム上でスクリプトを復元・実行できます。

---

## 🌟 特徴

- **ステガノグラフィーパッキング**: JavaScript コードを暗号化した上で、画像のピクセルデータ（RGBチャンネルの最下位ビット）へ非破壊的に埋め込みます。
- **WebAssembly 連携**: デコード・実行環境として高速かつ安全な Wasm モジュールキットを自動出力します。
- **CLI 対応**: `npx` コマンドで簡単に実行可能です。

---

## 📦 インストール

npm からグローバルまたはローカルにインストールできます。

```bash
# グローバルインストール
npm install -g secretscript-stego

# または npx で直接実行
npx secretscript-stego <input.js> <base.png> <output.png> [secretKey]
