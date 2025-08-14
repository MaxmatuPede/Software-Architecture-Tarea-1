const mongoose = require('mongoose');
const Author = require('./models/Author');
const Book = require('./models/Book');
const Review = require('./models/Review');
const Sales = require('./models/Sales');


mongoose.connect('mongodb://localhost:27017/bookreview');


const countries = ['Colombia', 'Argentina', 'España', 'México', 'Chile', 'Perú', 'Estados Unidos', 'Reino Unido', 'Francia', 'Italia'];
const genres = ['Realismo mágico', 'Novela histórica', 'Ciencia ficción', 'Romance', 'Thriller', 'Fantasía', 'Drama', 'Misterio'];


function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomText(words) {
  const lorem = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua'];
  return Array.from({length: words}, () => lorem[Math.floor(Math.random() * lorem.length)]).join(' ');
}

async function seedDatabase() {
  try {

    await Author.deleteMany({});
    await Book.deleteMany({});
    await Review.deleteMany({});
    await Sales.deleteMany({});
    
    console.log('Iniciando seeding...');

    const authors = [];
    for (let i = 1; i <= 50; i++) {
      const author = new Author({
        name: `Autor ${i}`,
        dateOfBirth: randomDate(new Date(1920, 0, 1), new Date(1990, 11, 31)),
        countryOfOrigin: countries[Math.floor(Math.random() * countries.length)],
        shortDescription: `Descripción del autor ${i}. ${randomText(10)}`
      });
      authors.push(await author.save());
    }
    console.log('✅ 50 autores creados');

    const books = [];
    for (let i = 1; i <= 300; i++) {
      const book = new Book({
        name: `Libro ${i}`,
        summary: `Resumen del libro ${i}. ${randomText(20)}`,
        dateOfPublication: randomDate(new Date(1950, 0, 1), new Date(2023, 11, 31)),
        author: authors[Math.floor(Math.random() * authors.length)]._id
      });
      books.push(await book.save());
    }
    console.log('✅ 300 libros creados');

    for (const book of books) {
      const numReviews = Math.floor(Math.random() * 10) + 1;
      for (let i = 0; i < numReviews; i++) {
        await new Review({
          book: book._id,
          review: `Reseña del libro ${book.name}. ${randomText(15)}`,
          score: Math.floor(Math.random() * 5) + 1,
          upvotes: Math.floor(Math.random() * 1000)
        }).save();
      }
    }
    console.log('✅ Reviews creadas');

    for (const book of books) {
      const startYear = book.dateOfPublication.getFullYear();
      for (let year = startYear; year <= startYear + 5; year++) {
        await new Sales({
          book: book._id,
          year: year,
          sales: Math.floor(Math.random() * 100000)
        }).save();
      }
    }
    console.log('✅ Datos de ventas creados');

    console.log('🎉 Seeding completado exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seeding:', error);
    process.exit(1);
  }
}

seedDatabase();