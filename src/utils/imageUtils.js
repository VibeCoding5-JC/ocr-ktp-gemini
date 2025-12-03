const sharp = require('sharp');

// Allowed MIME types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Validasi file gambar
 * @param {Object} file - File dari multer
 * @returns {Object} - { valid: boolean, error?: string }
 */
function validateImage(file) {
  if (!file) {
    return { valid: false, error: 'No file uploaded' };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` 
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  return { valid: true };
}

/**
 * Process gambar - resize jika terlalu besar
 * @param {Buffer} imageBuffer - Buffer gambar
 * @returns {Promise<Buffer>} - Buffer gambar yang sudah diproses
 */
async function processImage(imageBuffer) {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Jika gambar lebih besar dari 2000px, resize
    const MAX_DIMENSION = 2000;
    
    if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
      return await image
        .resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    // Jika sudah kecil, kembalikan dengan sedikit optimisasi
    return await image
      .jpeg({ quality: 90 })
      .toBuffer();

  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Get MIME type yang tepat untuk Gemini API
 * @param {string} originalMimeType - MIME type asli
 * @returns {string} - MIME type untuk Gemini
 */
function getGeminiMimeType(originalMimeType) {
  // Gemini mendukung image/jpeg, image/png, image/webp, image/heic, image/heif
  const mimeTypeMap = {
    'image/jpg': 'image/jpeg',
    'image/jpeg': 'image/jpeg',
    'image/png': 'image/png',
    'image/webp': 'image/webp'
  };

  return mimeTypeMap[originalMimeType] || 'image/jpeg';
}

module.exports = {
  validateImage,
  processImage,
  getGeminiMimeType,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
