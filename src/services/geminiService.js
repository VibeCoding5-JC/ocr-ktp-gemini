const { GoogleGenerativeAI } = require('@google/generative-ai');
const { geminiApiKey } = require('../config');

// Validasi API key
if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
  console.error('❌ GEMINI_API_KEY tidak ditemukan atau belum dikonfigurasi!');
  console.error('   Silakan set GEMINI_API_KEY di file .env');
}

// Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI(geminiApiKey);

/**
 * Ekstrak data KTP dari gambar menggunakan Gemini Flash
 * @param {Buffer} imageBuffer - Buffer gambar KTP
 * @param {string} mimeType - MIME type gambar (image/jpeg, image/png)
 * @returns {Promise<Object>} - Data KTP yang diekstrak
 */
async function extractKtpData(imageBuffer, mimeType) {
  // Cek API key sebelum request
  if (!geminiApiKey || geminiApiKey === 'your_gemini_api_key_here') {
    throw new Error('Gemini API key belum dikonfigurasi. Silakan set GEMINI_API_KEY di file .env');
  }

  try {
    // Gunakan model Gemini Flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Convert buffer ke base64
    const base64Image = imageBuffer.toString('base64');

    // Prompt untuk ekstraksi data KTP
    const prompt = `Anda adalah sistem OCR untuk KTP Indonesia. 

LANGKAH 1: Pertama, periksa apakah gambar ini adalah KTP (Kartu Tanda Penduduk) Indonesia yang valid.
- Jika BUKAN KTP Indonesia (misalnya: SIM, Passport, KK, foto selfie, dokumen lain, atau gambar random), kembalikan HANYA:
{"is_ktp": false, "error": "Gambar yang diupload bukan KTP Indonesia. Silakan upload foto KTP yang valid."}

- Jika ADALAH KTP Indonesia yang valid, lanjutkan ke langkah 2.

LANGKAH 2: Ekstrak SEMUA informasi dari KTP tersebut.
Kembalikan response dalam format JSON dengan struktur berikut:

{
  "is_ktp": true,
  "nik": "nomor NIK 16 digit",
  "nama": "nama lengkap",
  "tempat_lahir": "tempat lahir",
  "tanggal_lahir": "tanggal lahir (DD-MM-YYYY)",
  "jenis_kelamin": "LAKI-LAKI atau PEREMPUAN",
  "alamat": "alamat lengkap",
  "rt_rw": "nomor RT/RW",
  "kelurahan": "nama kelurahan/desa",
  "kecamatan": "nama kecamatan",
  "agama": "agama",
  "status_perkawinan": "status perkawinan",
  "pekerjaan": "jenis pekerjaan",
  "kewarganegaraan": "WNI atau WNA",
  "berlaku_hingga": "masa berlaku",
  "provinsi": "nama provinsi",
  "kabupaten_kota": "nama kabupaten/kota"
}

Jika ada field yang tidak terbaca jelas, isi dengan null.
PENTING: Kembalikan HANYA JSON, tanpa markdown, tanpa backtick, tanpa teks tambahan apapun.`;

    // Kirim gambar ke Gemini
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();

    // Parse JSON dari response
    // Bersihkan response dari kemungkinan markdown code blocks
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7);
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3);
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3);
    }
    cleanText = cleanText.trim();

    const ktpData = JSON.parse(cleanText);

    // Cek apakah gambar adalah KTP
    if (ktpData.is_ktp === false) {
      return {
        success: false,
        error: ktpData.error || 'Gambar yang diupload bukan KTP Indonesia. Silakan upload foto KTP yang valid.'
      };
    }

    // Hapus field is_ktp dari response
    delete ktpData.is_ktp;

    return {
      success: true,
      data: ktpData
    };

  } catch (error) {
    console.error('Error extracting KTP data:', error);
    
    // Handle specific errors
    if (error.message.includes('API key')) {
      throw new Error('Invalid or missing Gemini API key');
    }
    
    if (error instanceof SyntaxError) {
      throw new Error('Failed to parse KTP data from image. Please ensure the image is clear and readable.');
    }

    throw new Error(`Failed to extract KTP data: ${error.message}`);
  }
}

module.exports = {
  extractKtpData
};
