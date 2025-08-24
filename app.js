const express = require('express');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const app = express();
const port = 3000;


const Author = require('./models/Author');
const Book = require('./models/Book');
const Review = require('./models/Review');
const Sales = require('./models/Sales');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

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
app.use(express.static('public'));

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
          data = await Author.find();
          title = 'Autores';
          break;
        case 'books':
          data = await Book.findWithTotalSales();
          title = 'Libros';
          break;
        case 'reviews':
          data = await Review.find().populate('book');
          title = 'Reseñas';
          break;
        case 'sales':
          data = await Sales.find().populate('book');
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