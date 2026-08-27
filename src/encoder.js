const fs = require('fs');
const { PNG } = require('pngjs');

function encrypt(buffer, key) {
  const result = Buffer.alloc(buffer.length);
  const keyBuf = Buffer.from(key);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] ^ keyBuf[i % keyBuf.length];
  }
  return result;
}

function embedJSToImage(jsPath, inputImgPath, outputImgPath, secretKey) {
  return new Promise((resolve, reject) => {
    const jsContent = fs.readFileSync(jsPath);
    const encryptedJS = encrypt(jsContent, secretKey);

    const lengthBuffer = Buffer.alloc(4);
    lengthBuffer.writeUInt32BE(encryptedJS.length, 0);
    
    const payload = Buffer.concat([lengthBuffer, encryptedJS]);
    const totalBits = payload.length * 8;

    fs.createReadStream(inputImgPath)
      .pipe(new PNG({ filterType: 4 }))
      .on('parsed', function () {
        const maxBits = (this.width * this.height * 3);

        if (totalBits > maxBits) {
          console.error(`❌ エラー: 画像サイズが小さすぎます (必要: ${totalBits} bits / 最大: ${maxBits} bits)`);
          return reject(new Error('Image size too small'));
        }

        let bitIndex = 0;
        for (let y = 0; y < this.height; y++) {
          for (let x = 0; x < this.width; x++) {
            const idx = (this.width * y + x) << 2;
            for (let channel = 0; channel < 3; channel++) {
              if (bitIndex < totalBits) {
                const byteIdx = Math.floor(bitIndex / 8);
                const bitOffset = 7 - (bitIndex % 8);
                const bit = (payload[byteIdx] >> bitOffset) & 1;

                this.data[idx + channel] = (this.data[idx + channel] & 0xFE) | bit;
                bitIndex++;
              }
            }
          }
        }

        this.pack().pipe(fs.createWriteStream(outputImgPath))
          .on('finish', () => {
            console.log(`✅ 生成成功: ${outputImgPath}`);
            resolve();
          })
          .on('error', reject);
      })
      .on('error', reject);
  });
}

module.exports = { embedJSToImage };