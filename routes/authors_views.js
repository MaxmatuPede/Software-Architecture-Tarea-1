const express = require('express');
const router = express.Router();
const { getAuthorById } = require('./services/authorCache');
const Author = require('../models/Author');
const buildPublicUrl = require('../utils/publicUrl');

// new
router.get('/new', (req, res) => res.render('Authors/new'));

// edit
router.get('/:id/edit', async (req, res) => {
  try {
    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).send('Autor no encontrado');
    res.render('Authors/edit', { author });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// show
router.get('/:id', async (req, res) => {
  try {
    const author = await getAuthorById(req.params.id);
    if (!author) return res.status(404).send('Autor no encontrado');

    const out = { ...author, photoUrl: author.photoPath ? buildPublicUrl(author.photoPath) : null };
    res.render('Authors/show', { author: out });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
