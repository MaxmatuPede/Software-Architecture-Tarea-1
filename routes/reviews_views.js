const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Book = require('../models/Book');

router.get('/new', async (req, res) => {
    const books = await Book.find().sort('title');
    res.render('Reviews/new', { books });
});

router.get('/:id/edit', async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        const books = await Book.find().sort('title');
        if (!review) return res.status(404).send('Reseña no encontrada');
        res.render('Reviews/edit', { review, books });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
module.exports = router;
