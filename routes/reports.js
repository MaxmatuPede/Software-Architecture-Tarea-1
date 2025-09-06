const express = require('express');
const router = express.Router();
const Author = require('../models/Author');
const Book = require('../models/Book');
const Review = require('../models/Review');
const Sales = require('../models/Sales');

// ⬇️ AGREGAR OPENSEARCH PARA BÚSQUEDAS
const searchService = require('./services/searchService');

router.get('/', (req, res) => {
  res.render('Reports/index');
});

// Autores con número de libros, promedio de puntaje y total de ventas
router.get('/authors', async (req, res) => {
  try {
    const authors = await Author.aggregate([
      {
        $lookup: { from: 'books', localField: '_id', foreignField: 'author', as: 'books' }
      },
      {
        $addFields: {
          numberOfBooks: { $size: '$books' }
        }
      },
      { $project: { name: 1, numberOfBooks: 1 } }
    ]);

    for (let a of authors) {
      const authorBooks = await Book.find({ author: a._id });
      let totalScore = 0, totalReviews = 0, totalSales = 0;

      for (let b of authorBooks) {
        const reviews = await Review.find({ book: b._id });
        if (reviews.length) {
          totalScore += reviews.reduce((acc, r) => acc + r.score, 0);
          totalReviews += reviews.length;
        }

        const sales = await Sales.find({ book: b._id });
        if (sales.length) {
          totalSales += sales.reduce((acc, s) => acc + s.sales, 0);
        }
      }

      a.averageScore = totalReviews ? totalScore / totalReviews : null;
      a.totalSales = totalSales;
    }

    res.render('Reports/authors', { authors });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Top 10 libros mejor valorados
router.get('/top-rated', async (req, res) => {
  try {
    const books = await Book.find().populate('author');
    const booksWithScores = [];

    for (let b of books) {
      const reviews = await Review.find({ book: b._id });
      if (!reviews.length) continue;

      const scores = reviews.map(r => r.score);
      booksWithScores.push({
        id: b.id,
        name: b.name,
        averageScore: scores.reduce((acc, s) => acc + s, 0) / scores.length,
        highestReview: Math.max(...scores),
        lowestReview: Math.min(...scores)
      });
    }

    booksWithScores.sort((a, b) => b.averageScore - a.averageScore);
    res.render('Reports/topRated', { books: booksWithScores.slice(0, 10) });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Top 50 libros más vendidos
router.get('/top-selling', async (req, res) => {
  try {
    const books = await Book.find().populate('author');
    const result = [];

    for (let b of books) {
      const sales = await Sales.find({ book: b._id });
      const totalSales = sales.reduce((acc, s) => acc + s.sales, 0);

      // Calcular si fue top 5 el año de publicación
      const sameYearSales = await Sales.find({ year: b.dateOfPublication.getFullYear() }).sort({ sales: -1 });
      const wasTop5 = sameYearSales.slice(0, 5).some(s => s.book.toString() === b._id.toString());

      result.push({
        name: b.name,
        totalSales,
        authorName: b.author ? b.author.name : 'Desconocido',
        wasTop5
      });
    }

    result.sort((a, b) => b.totalSales - a.totalSales);
    res.render('Reports/topSelling', { books: result.slice(0, 50) });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ⬇️ BÚSQUEDA ACTUALIZADA PARA USAR OPENSEARCH
router.get('/search', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const q = req.query.q || '';
    
    if (!q) {
      return res.render('Reports/search', { books: [], page: 1, total: 0, q: '' });
    }

    // 🔍 USAR OPENSEARCH (con fallback a MongoDB)
    const searchResults = await searchService.searchBooks(q);
    
    // Paginar resultados
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = searchResults.slice(startIndex, endIndex);
    
    // Si los resultados vienen de OpenSearch, necesitamos obtener los objetos completos de MongoDB
    const books = [];
    for (const result of paginatedResults) {
      try {
        // Si viene de OpenSearch, result._id existe
        // Si viene de MongoDB fallback, result ya es el objeto completo
        const book = result._score ? await Book.findById(result._id).populate('author') : result;
        if (book) {
          books.push({
            ...book.toObject ? book.toObject() : book,
            _score: result._score || 0
          });
        }
      } catch (err) {
        console.log('Error fetching book:', err.message);
      }
    }

    res.render('Reports/search', { 
      books, 
      page, 
      total: searchResults.length, 
      q,
      isOpenSearchResult: searchResults.length > 0 && searchResults[0]._score !== undefined
    });
    
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;