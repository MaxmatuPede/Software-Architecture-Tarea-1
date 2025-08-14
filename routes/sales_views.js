const express = require('express');
const router = express.Router();
const Sale = require('../models/Sales');
const Book = require('../models/Book');

router.get('/new', async (req, res) => {
    const books = await Book.find();
    res.render('Sales/new', { books});
});

router.get('/:id/edit', async (req, res) => {
    try {
        const sale = await Sale.findById(req.params.id);
        const books = await Book.find();
        if (!sale) return res.status(404).send('Venta no encontrada');
        res.render('Sales/edit', { sale, books });
    } catch (err) {
        res.status(500).send(err.message);
    }
});
module.exports = router;
