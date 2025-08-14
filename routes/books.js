const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Sales = require('../models/Sales');

router.get('/', async (req, res) => {
  try {
    const books = await Book.find().populate('author');
    
    const booksWithSales = await Promise.all(books.map(async (book) => {
      const sales = await Sales.find({ book: book._id });
      const totalSales = sales.reduce((sum, sale) => sum + sale.sales, 0);
      
      return {
        ...book.toObject(),
        totalSales: totalSales
      };
    }));
    
    res.json(booksWithSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save();
    const populatedBook = await Book.findById(savedBook._id).populate('author');
    
    res.status(201).json({
      ...populatedBook.toObject(),
      totalSales: 0
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('author');
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
    
    const sales = await Sales.find({ book: book._id });
    const totalSales = sales.reduce((sum, sale) => sum + sale.sales, 0);
    
    res.json({
      ...book.toObject(),
      totalSales: totalSales
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('author');
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
    
    const sales = await Sales.find({ book: book._id });
    const totalSales = sales.reduce((sum, sale) => sum + sale.sales, 0);
    
    res.json({
      ...book.toObject(),
      totalSales: totalSales
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });
    
    const Review = require('../models/Review');
    await Review.deleteMany({ book: req.params.id });
    await Sales.deleteMany({ book: req.params.id });
    
    await Book.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Libro y todos sus datos relacionados eliminados correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;