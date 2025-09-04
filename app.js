const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const path = require('path');
const app = express();
const port = 3000;

const SERVE_STATIC = process.env.SERVE_STATIC === 'true';

const { getAllAuthors } = require('./routes/services/authorCache');
const { getAllBooks } = require('./routes/services/bookCache');
const { getAllReviews } = require('./routes/services/reviewCache');
const { getAllSales } = require('./routes/services/salesCache');

require('./cache');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.set('trust proxy', true);

if (SERVE_STATIC) {
  console.log('App sirviendo archivos estáticos');
  app.use(
    '/uploads',
    express.static(path.join(__dirname, 'public', 'uploads'), {
      maxAge: '1y',
      immutable: true,
      fallthrough: false,
    })
  );
} else {
  console.log('Varnish sirviendo archivos estáticos')
}

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
    
    res.render('index', { data, title, model });
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

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
module.exports = app;