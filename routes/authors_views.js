const express = require('express');
const router = express.Router();
const Author = require('../models/Author');
const buildPublicUrl = require('../utils/publicUrl');

router.get('/new', (req, res) => {
    res.render('Authors/new');
});

router.get('/:id/edit', async (req, res) => {
    try {
        const author = await Author.findById(req.params.id);
        if (!author) return res.status(404).send('Autor no encontrado');
        res.render('Authors/edit', { author });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

router.get('/:id', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).send('Autor no encontrado');

    const out = author.toObject ? author.toObject() : author;
    out.photoUrl = author.photoPath ? buildPublicUrl(req, author.photoPath) : (author.image || null);

    res.render('Authors/show', { author: out });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
