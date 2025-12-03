const multer = require('multer');
const { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } = require('../utils/imageUtils');

// Gunakan memory storage untuk menyimpan file di RAM
const storage = multer.memoryStorage();

// File filter untuk validasi tipe file
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`), false);
  }
};

// Konfigurasi multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

module.exports = upload;
