// routes/books.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const Book = require('../models/Book');
const buildPublicUrl = require('../utils/publicUrl');

const BOOKS_DIR = path.join(__dirname, '..', 'public', 'uploads', 'books');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BOOKS_DIR),
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

// LIST
router.get('/', async (req, res) => {
  const books = await Book.find().populate('author');
  const enriched = books.map(b => ({
    ...b.toObject(),
    coverUrl: b.coverUrl ? buildPublicUrl(req, b.coverUrl) : null
  }));
  res.json(enriched);
});

// CREATE (new)
router.post('/', upload.single('cover'), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) body.coverUrl = path.posix.join('books', req.file.filename);

    const saved = await new Book(body).save();
    res.redirect('/?model=books');
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// UPDATE (edit)
router.put('/:id', upload.single('cover'), async (req, res) => {
  try {
    const current = await Book.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Libro no encontrado' });

    const wantsRemove = req.body.removeCover === '1' || req.body.removeCover === 'on';

    const updateDoc = {};
    updateDoc.$set = { ...req.body };

    if (wantsRemove) {
      await removeFileIfExists(current.coverUrl);
      updateDoc.$unset = { coverUrl: 1 };
    }

    if (req.file) {
      await removeFileIfExists(current.coverUrl);
      updateDoc.$set.coverUrl = path.posix.join('books', req.file.filename);
      if (updateDoc.$unset) delete updateDoc.$unset.coverUrl;
    }

    await Book.findByIdAndUpdate(req.params.id, updateDoc, {
      new: true,
      runValidators: true
    });

    res.redirect('/?model=books');
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});



module.exports = router;
