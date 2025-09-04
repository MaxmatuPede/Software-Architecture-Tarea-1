const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Author = require('../models/Author');
const buildPublicUrl = require('../utils/publicUrl');

router.get('/new', async (req, res) => {
  try {
    const authors = await Author.find().sort('name').select('_id name');
    res.render('Books/new', { authors });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error cargando el formulario de nuevo libro');
  }
});

router.get('/:id/edit', async (req, res) => {
  try {
    const bookDoc = await Book.findById(req.params.id).populate('author');
    if (!bookDoc) return res.status(404).send('Libro no encontrado');

    const authors = await Author.find().select('_id name').sort('name');

    const book = bookDoc.toObject();
    book.coverUrl = book.coverUrl ? buildPublicUrl(req, book.coverUrl) : null;

    res.render('Books/edit', { book, authors });
  } catch (e) {
    console.error(e);
    res.status(500).send('Error cargando la edición del libro');
  }
});

router.get('/:id', async (req, res) => {
  try {
    const bookDoc = await Book.findById(req.params.id).populate('author');
    if (!bookDoc) return res.status(404).send('Libro no encontrado');

    const book = bookDoc.toObject();
    book.coverUrl = book.coverUrl ? buildPublicUrl(req, book.coverUrl) : null;

    res.render('Books/show', { book });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error mostrando el libro');
  }
});

module.exports = router;
