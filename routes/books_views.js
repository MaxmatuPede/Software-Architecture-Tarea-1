const express = require('express');
const router = express.Router();
const Book = require('../models/Book');
const Author = require('../models/Author');

router.get('/new', async (req, res) => {
    const authors = await Author.find().sort('name');
    res.render('Books/new', { authors });
});

router.get('/:id/edit', async (req, res) => {
    try {
        const book = await Book.findById(req.params.id);
        const authors = await Author.find().sort('name');
        if (!book) return res.status(404).send('Libro no encontrado');
        res.render('Books/edit', { book, authors });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
module.exports = router;
