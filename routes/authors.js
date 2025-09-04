const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const Author = require('../models/Author');
const { getAuthorById, getAllAuthors, purgeAuthorCache } = require('./services/authorCache');
const buildPublicUrl = require('../utils/publicUrl');

const AUTHORS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'authors');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, AUTHORS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const fileFilter = (req, file, cb) => cb(null, /^image\//.test(file.mimetype));
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

async function removeFileIfExists(relativePath) {
  if (!relativePath) return;
  const full = path.join(__dirname, '..', 'public', 'uploads', relativePath);
  try { await fs.promises.unlink(full); } catch (_) {}
}

// GET ALL
router.get('/', async (req, res) => {
  try {
    const authors = await getAllAuthors();
    const enriched = authors.map(a => ({
      ...a,
      photoUrl: a.photoPath ? buildPublicUrl(req, a.photoPath) : null
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE
router.post('/', upload.single('photo'), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) body.photoPath = path.posix.join('authors', req.file.filename);

    const author = new Author(body);
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

    const out = author.toObject ? author.toObject() : author;
    out.photoUrl = author.photoPath ? buildPublicUrl(req, author.photoPath) : null;
    res.json(out);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE 
router.put('/:id', upload.single('photo'), async (req, res) => {
  try {
    const current = await Author.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Autor no encontrado' });

    const updates = { ...req.body };
    const wantsRemove = req.body.removePhoto === '1' || req.body.removePhoto === 'on';

    if (wantsRemove) {
      await removeFileIfExists(current.photoPath);
      updates.photoPath = undefined;
    }

    if (req.file) {
      await removeFileIfExists(current.photoPath);
      updates.photoPath = path.posix.join('authors', req.file.filename);
    }

    const author = await Author.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    await purgeAuthorCache(author._id);

    res.redirect('/?model=authors');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
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

    await removeFileIfExists(author.photoPath);
    await Author.findByIdAndDelete(req.params.id);
    await purgeAuthorCache(req.params.id);

    res.json({ message: 'Autor y todos sus datos relacionados eliminados correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
