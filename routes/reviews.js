const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const { getReviewScore, purgeReviewScore } = require('./services/reviewCache');

router.get('/score/:bookId', async (req, res) => {
  try {
    const score = await getReviewScore(req.params.bookId);
    res.json({ book: req.params.bookId, avgScore: score });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find().populate('book');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


router.post('/', async (req, res) => {
  try {
    const review = new Review(req.body);
    await review.save();
    await purgeReviewScore(review.book);
    res.redirect('/?model=reviews');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('book');
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    await purgeReviewScore(review.book);
    res.redirect('/?model=reviews');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: 'Reseña no encontrada' });
    await purgeReviewScore(review.book);
    res.json({ message: 'Reseña eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;