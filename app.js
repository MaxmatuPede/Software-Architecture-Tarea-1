const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const app = express();
const port = 3000;
const { getAllAuthors } = require('./routes/services/authorCache');
const { getAllBooks } = require('./routes/services/bookCache');
const { getAllReviews } = require('./routes/services/reviewCache');
const { getAllSales } = require('./routes/services/salesCache');
const searchService = require('./routes/services/searchService');
require('./cache');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// proxy
const {
  UPLOAD_PATH,
  STATIC_PREFIX,
} = require('./config/static');

app.set('trust proxy', true);
app.use(
  STATIC_PREFIX,
  express.static(UPLOAD_PATH, {
    maxAge: '1y',
    immutable: true,
    fallthrough: false,
  })
);

// Base de datos
mongoose.connect('mongodb://mongodb:27017/bookreview');
mongoose.connection.on('connected', () => {
  console.log('✅ Conectado a MongoDB');
});
mongoose.connection.on('error', (err) => {
  console.log('❌ Error de conexión:', err);
});

//NAvegacion
app.set('view engine', 'ejs');

// Rutas
//Esto se debera cambiar (creo) lo encerrado entre los 2 textos
app.get('/', async (req, res) => {
  try {
    const model = req.query.model;
    let data = [];
    let title = '';
    if (model) {
      switch(model) {
        case 'authors':
          data = await getAllAuthors();
          title = 'Autores';
          break;
        case 'books':
          data = await getAllBooks();
          title = 'Libros';
          break;
        case 'reviews':
          data = await getAllReviews();
          title = 'Reseñas';
          break;
        case 'sales':
          data = await getAllSales();
          title = 'Ventas';
          break;
      }
    }
    
    res.render('index', { data, title, model, searchEnabled: searchService.isSearchEnabled() });
  } catch (error) {
    res.status(500).send('Error: ' + error.message);
  }
});
//Esto se debera cambiar (creo) lo encerrado entre los 2 textos

app.use('/api/authors', require('./routes/authors'));
app.use('/authors', require('./routes/authors_views'));
app.use('/api/books', require('./routes/books'));
app.use('/books', require('./routes/books_views'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/reviews', require('./routes/reviews_views'));
app.use('/api/sales', require('./routes/sales'));
app.use('/sales', require('./routes/sales_views'));
app.use('/reports', require('./routes/reports'));
app.use('/search', require('./routes/search'));

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});

module.exports = app;