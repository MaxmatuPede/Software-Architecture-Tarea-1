const mongoose = require('mongoose');

const Author = require('./models/Author');
const Book = require('./models/Book');
const Review = require('./models/Review');
const Sales = require('./models/Sales');

const searchService = require('./routes/services/searchService');

async function syncExistingData() {
  try {
    await mongoose.connect('mongodb://mongodb:27017/bookreview');
    console.log('📊 Conectado a MongoDB');

    let attempts = 0;
    const maxAttempts = 30;
    
    console.log('⏳ Esperando conexión a OpenSearch...');
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    }

    console.log('🔄 Iniciando sincronización de datos existentes...');

    const books = await Book.find().populate('author');
    console.log(`📚 Encontrados ${books.length} libros para sincronizar`);

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      await searchService.indexBook(book);
      
      if ((i + 1) % 50 === 0) {
        console.log(`📚 Sincronizados ${i + 1}/${books.length} libros`);
      }
    }
    console.log('✅ Libros sincronizados con OpenSearch');

    const reviews = await Review.find().populate('book');
    console.log(`💬 Encontradas ${reviews.length} reseñas para sincronizar`);

    for (let i = 0; i < reviews.length; i++) {
      const review = reviews[i];
      await searchService.indexReview(review);
      
      if ((i + 1) % 100 === 0) {
        console.log(`💬 Sincronizadas ${i + 1}/${reviews.length} reseñas`);
      }
    }
    console.log('✅ Reseñas sincronizadas con OpenSearch');

    console.log('🎉 Sincronización completada exitosamente!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en sincronización:', error);
    process.exit(1);
  }
}

syncExistingData();