const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Sales = require('../models/Sales');
const { getAllBooks, purgeBooksCache } = require('./services/bookCache');

// GET ALL
router.get('/', async (req, res) => {
  try {
    const booksWithSales = await getAllBooks();
    res.json(booksWithSales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const book = new Book(req.body);
    const savedBook = await book.save();
    await purgeBooksCache();
    res.redirect('/?model=books');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET ID
router.get('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('author');
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    const sales = await Sales.find({ book: book._id });
    const totalSales = sales.reduce((sum, sale) => sum + sale.sales, 0);

    res.json({ ...book.toObject(), totalSales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE 
router.put('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('author');
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    await purgeBooksCache();
    res.redirect('/?model=books');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE 
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    const Review = require('../models/Review');
    await Review.deleteMany({ book: req.params.id });
    await Sales.deleteMany({ book: req.params.id });
    await Book.findByIdAndDelete(req.params.id);

    await purgeBooksCache();

    res.json({ message: 'Libro y todos sus datos relacionados eliminados correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;