const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { extractKtpData } = require('../services/geminiService');
const { validateImage, processImage, getGeminiMimeType } = require('../utils/imageUtils');

/**
 * POST /api/extract-ktp
 * Upload dan ekstrak data dari foto KTP
 */
router.post('/extract-ktp', upload.single('file'), async (req, res) => {
  try {
    // Validasi file
    const validation = validateImage(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Process gambar (resize jika perlu)
    const processedImage = await processImage(req.file.buffer);
    
    // Get MIME type untuk Gemini
    const mimeType = getGeminiMimeType(req.file.mimetype);

    // Ekstrak data KTP menggunakan Gemini
    const result = await extractKtpData(processedImage, mimeType);

    // Return hasil
    res.json(result);

  } catch (error) {
    console.error('Error in extract-ktp:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

// Error handler untuk multer
router.use((error, req, res, next) => {
  if (error instanceof require('multer').MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 5MB'
      });
    }
  }
  
  res.status(400).json({
    success: false,
    error: error.message
  });
});

module.exports = router;
