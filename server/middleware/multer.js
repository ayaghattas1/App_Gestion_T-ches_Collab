// const multer = require('multer');

// // Configuration de Multer
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, '../uploads/img');
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname);
//   }
// });

// const upload = multer({ storage: storage });

// module.exports = upload;
// uploadConfig.js
const multer = require('multer');
const path = require('path');

// Configure Multer storage with a custom directory and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the directory where files should be saved (adjust this path)
    const uploadPath = path.join(__dirname, 'uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Create a unique filename with a timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const newFilename = `${file.fieldname}-${uniqueSuffix}-${file.originalname}`;
    cb(null, newFilename);
  }
});

// Create the Multer instance with the specified storage
const upload = multer({ storage: storage });

module.exports = upload;
