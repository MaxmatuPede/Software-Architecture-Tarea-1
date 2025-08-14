const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  sales: {
    type: Number,
    required: true,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sales', salesSchema);