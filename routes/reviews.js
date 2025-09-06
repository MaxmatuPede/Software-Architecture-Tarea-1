const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const {
  getAllReviews,
  getReviewsByBook,
  getReviewById,
  purgeAfterReviewChange,
} = require('./services/reviewCache');

// ⬇️ AGREGAR OPENSEARCH
const searchService = require('./services/searchService');

// index (all)
router.get('/', async (req, res) => {
  try {
    const reviews = await getAllReviews();
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// per book
router.get('/book/:bookId', async (req, res) => {
  try {
    const reviews = await getReviewsByBook(req.params.bookId);
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// one
router.get('/:id', async (req, res) => {
  try {
    const review = await getReviewById(req.params.id);
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    res.json(review);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// create
router.post('/', async (req, res) => {
  try {
    const review = await new Review(req.body).save();
    await review.populate('book'); // Para tener datos completos del libro
    
    await purgeAfterReviewChange({ reviewId: String(review._id), bookId: String(review.book._id) });
    
    // ⬇️ SINCRONIZAR CON OPENSEARCH
    await searchService.indexReview(review);
    
    res.redirect('/?model=reviews');
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// update
router.put('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('book');
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    
    await purgeAfterReviewChange({ reviewId: String(review._id), bookId: String(review.book._id) });
    
    // ⬇️ SINCRONIZAR CON OPENSEARCH
    await searchService.indexReview(review);
    
    res.redirect('/?model=reviews');
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
});

// delete
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    
    await purgeAfterReviewChange({ reviewId: String(review._id), bookId: String(review.book) });
    
    // ⬇️ SINCRONIZAR CON OPENSEARCH
    await searchService.deleteReview(String(review._id));
    
    res.json({ message: 'Reseña eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;