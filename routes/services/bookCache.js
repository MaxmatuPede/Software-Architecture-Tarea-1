const { cacheGet, cacheSet, cacheDel } = require('../../cache');
const Book = require('../../models/Book');
const Sales = require('../../models/Sales');


async function getAllBooks() {
  const key = 'books:all';
  const cached = await cacheGet(key);
  if (cached !== null) return cached;
  const books = await Book.find().populate('author');

  const booksWithSales = await Promise.all(
    books.map(async (book) => {
      const sales = await Sales.find({ book: book._id });
      const totalSales = sales.reduce((sum, s) => sum + s.sales, 0);
      return { ...book.toObject(), totalSales };
    })
  );

  await cacheSet(key, booksWithSales, 600);
  return booksWithSales;
}

async function purgeBooksCache() {
  await cacheDel('books:all');
}

module.exports = { getAllBooks, purgeBooksCache };
