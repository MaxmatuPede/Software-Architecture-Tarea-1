const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Review = require('../models/Review');
const Book = require('../models/Book');
const { cacheGet, cacheSet } = require('../cache')

const BOOKS_LIST_KEY = 'books:options';
const BOOKS_TTL_SEC = 300;

async function getBooksForSelect() {
  // Try cache first
  const cached = await cacheGet(BOOKS_LIST_KEY);
  if (cached) return cached;

  const books = await Book.find({}, { _id: 1, title: 1 })
    .sort({ title: 1 })
    .lean();

  await cacheSet(BOOKS_LIST_KEY, books, BOOKS_TTL_SEC);
  return books;
}
// GET /reviews/new
router.get('/new', async (req, res) => {
  try {
    const books = await getBooksForSelect();
    res.render('Reviews/new', { books });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cargando el formulario de nueva reseña');
  }
});

// GET /reviews/:id/edit
router.get('/:id/edit', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).send('ID inválido');
    }

    const [review, books] = await Promise.all([
      Review.findById(id).lean(),
      getBooksForSelect(),
    ]);

    if (!review) return res.status(404).send('Reseña no encontrada');

    res.render('Reviews/edit', { review, books });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cargando la edición de la reseña');
  }
});

module.exports = router;
