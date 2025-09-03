const express = require('express');
const router = express.Router();
const Author = require('../models/Author');
const { getAuthorById, getAllAuthors, purgeAuthorCache } = require('./services/authorCache');

// GET ALL
router.get('/', async (req, res) => {
  try {
    const authors = await getAllAuthors();
    res.json(authors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const author = new Author(req.body);
    const savedAuthor = await author.save();
    await purgeAuthorCache(savedAuthor._id);
    res.redirect('/?model=authors');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET ID
router.get('/:id', async (req, res) => {
  try {
    const author = await getAuthorById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Autor no encontrado' });
    res.json(author);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE 
router.put('/:id', async (req, res) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!author) return res.status(404).json({ message: 'Autor no encontrado' });
    await purgeAuthorCache(author._id);
    res.redirect('/?model=authors');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// EDIT
router.get('/:id/edit', async (req, res) => {
  const author = await Author.findById(req.params.id);
  if (!author) return res.status(404).send('Autor no encontrado');
  res.render('Authors/edit', { author });
});

// DELETE 
router.delete('/:id', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ message: 'Autor no encontrado' });

    const Book = require('../models/Book');
    const Review = require('../models/Review');
    const Sales = require('../models/Sales');

    const books = await Book.find({ author: req.params.id });

    for (const book of books) {
      await Review.deleteMany({ book: book._id });
      await Sales.deleteMany({ book: book._id });
    }

    await Book.deleteMany({ author: req.params.id });
    await Author.findByIdAndDelete(req.params.id);

    await purgeAuthorCache(req.params.id);

    res.json({ message: 'Autor y todos sus datos relacionados eliminados correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
