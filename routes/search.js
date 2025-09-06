const express = require('express');
const router = express.Router();
const searchService = require('./services/searchService');

router.get('/', async (req, res) => {
  res.render('search/index', { query: '', results: null, type: 'all' });
});

router.post('/', async (req, res) => {
  try {
    const { query, type } = req.body;
    let results = {};

    if (!query || query.trim() === '') {
      return res.render('search/index', { query: '', results: null, type });
    }

    switch (type) {
      case 'books':
        results.books = await searchService.searchBooks(query);
        results.reviews = [];
        break;
      case 'reviews':
        results.books = [];
        results.reviews = await searchService.searchReviews(query);
        break;
      default:
        results = await searchService.searchAll(query);
    }

    res.render('search/results', { query, results, type });
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});

router.get('/api', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q) {
      return res.json({ books: [], reviews: [], total: 0 });
    }

    let results = {};
    switch (type) {
      case 'books':
        results.books = await searchService.searchBooks(q);
        results.reviews = [];
        break;
      case 'reviews':
        results.books = [];
        results.reviews = await searchService.searchReviews(q);
        break;
      default:
        results = await searchService.searchAll(q);
    }

    results.total = results.books.length + results.reviews.length;
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;