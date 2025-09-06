const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const Book = require('../models/Book');
const buildPublicUrl = require('../utils/publicUrl');
const { UPLOAD_PATH } = require('../config/static');
const {
  getAllBooks,
  getBookById,
  purgeAfterBookChange,
} = require('./services/bookCache');

// ⬇️ AGREGAR OPENSEARCH
const searchService = require('./services/searchService');

const BOOKS_DIR = path.join(UPLOAD_PATH, 'books');
fs.mkdirSync(BOOKS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BOOKS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => cb(null, /^image\//.test(file.mimetype));
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

async function removeFileIfExists(relativePath) {
  if (!relativePath) return;
  const full = path.join(UPLOAD_PATH, relativePath);
  try { await fs.promises.unlink(full); } catch (_) {}
}

// LIST
router.get('/', async (req, res) => {
  try {
    const books = await getAllBooks();
    const enriched = books.map(b => ({
      ...b,
      coverUrl: b.coverUrl ? buildPublicUrl(b.coverUrl) : null,
    }));
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// CREATE
router.post('/', upload.single('cover'), async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) body.coverUrl = path.posix.join('books', req.file.filename);
    
    const saved = await new Book(body).save();
    await saved.populate('author'); // Para tener datos completos de autor
    
    await purgeAfterBookChange(String(saved._id));
    
    // ⬇️ SINCRONIZAR CON OPENSEARCH
    await searchService.indexBook(saved);
    
    res.redirect('/?model=books');
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// UPDATE
router.put('/:id', upload.single('cover'), async (req, res) => {
  try {
    const current = await Book.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Libro no encontrado' });

    const wantsRemove = req.body.removeCover === '1' || req.body.removeCover === 'on';
    const updateDoc = { $set: { ...req.body } };

    if (wantsRemove) {
      await removeFileIfExists(current.coverUrl);
      updateDoc.$unset = { coverUrl: 1 };
    }

    if (req.file) {
      await removeFileIfExists(current.coverUrl);
      updateDoc.$set.coverUrl = path.posix.join('books', req.file.filename);
      if (updateDoc.$unset) delete updateDoc.$unset.coverUrl;
    }

    const updated = await Book.findByIdAndUpdate(req.params.id, updateDoc, {
      new: true,
      runValidators: true,
    }).populate('author'); // Para tener datos completos de autor

    await purgeAfterBookChange(String(updated._id));
    
    // ⬇️ SINCRONIZAR CON OPENSEARCH
    await searchService.indexBook(updated);

    res.redirect('/?model=books');
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ message: 'Libro no encontrado' });

    await removeFileIfExists(book.coverUrl);
    await purgeAfterBookChange(String(book._id));
    
    // ⬇️ SINCRONIZAR CON OPENSEARCH
    await searchService.deleteBook(String(book._id));

    res.json({ message: 'Libro eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;