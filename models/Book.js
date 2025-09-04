const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    required: true
  },
  dateOfPublication: {
    type: Date,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Author',
    required: true
  },
  coverUrl: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

bookSchema.statics.findWithTotalSales = async function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'sales',
        localField: '_id',
        foreignField: 'book',
        as: 'salesData'
      }
    },
    {
      $lookup: {
        from: 'authors',
        localField: 'author',
        foreignField: '_id',
        as: 'author'
      }
    },
    {
      $unwind: { path: '$author', preserveNullAndEmptyArrays: true }
    },
    {
      $addFields: {
        totalSales: { $sum: '$salesData.sales' }
      }
    },
    {
      $project: {
        salesData: 0
      }
    }
  ]);
};

module.exports = mongoose.model('Book', bookSchema);
