const { cacheGet, cacheSet, cacheDel } = require('../../cache');
const Book = require('../../models/Book');
const Sales = require('../../models/Sales');

const TTL = 600;

// Keys
const kAll = 'books:all';
const kOne = (id) => `book:${id}`;

async function getSalesTotalsMap(bookIds) {
  if (!bookIds.length) return new Map();
  const rows = await Sales.aggregate([
    { $match: { book: { $in: bookIds.map((id) => typeof id === 'string' ? require('mongoose').Types.ObjectId.createFromHexString(id) : id ) } } },
    { $group: { _id: '$book', total: { $sum: '$sales' } } },
  ]);
  const map = new Map();
  for (const r of rows) map.set(String(r._id), r.total || 0);
  return map;
}

async function getAllBooks() {
  const cached = await cacheGet(kAll);
  if (cached !== null) return cached;

  const books = await Book.find({})
    .populate('author')
    .sort({ createdAt: -1 })
    .lean();

  const ids = books.map((b) => String(b._id));
  const totalsMap = await getSalesTotalsMap(ids);

  const enriched = books.map((b) => ({
    ...b,
    totalSales: totalsMap.get(String(b._id)) || 0,
  }));

  await cacheSet(kAll, enriched, TTL);
  return enriched;
}

async function getBookById(bookId) {
  const key = kOne(bookId);
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const book = await Book.findById(bookId).populate('author').lean();
  if (!book) return null;

  const totalsMap = await getSalesTotalsMap([String(book._id)]);
  const enriched = { ...book, totalSales: totalsMap.get(String(book._id)) || 0 };

  await cacheSet(key, enriched, TTL);
  return enriched;
}

// PURGES
async function purgeBookById(bookId) {
  if (!bookId) return;
  await cacheDel(kOne(bookId));
}

async function purgeAllBooks() {
  await cacheDel(kAll);
}

async function purgeAfterBookChange(bookId) {
  await Promise.all([purgeBookById(bookId), purgeAllBooks()]);
}

module.exports = {
  getAllBooks,
  getBookById,
  purgeBookById,
  purgeAllBooks,
  purgeAfterBookChange,
};
