const path = require('path');
const DEFAULT_UPLOAD_PATH = path.join(__dirname, '..', 'public', 'uploads');

module.exports = {
  UPLOAD_PATH: process.env.UPLOAD_PATH || DEFAULT_UPLOAD_PATH,

  STATIC_PREFIX: process.env.STATIC_PREFIX || '/uploads',
};
