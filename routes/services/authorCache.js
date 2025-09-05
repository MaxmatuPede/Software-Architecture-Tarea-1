const { cacheGet, cacheSet, cacheDel } = require('../../cache');
const Author = require('../../models/Author');

const TTL = 600;

// Keys
const kAll = 'authors:all';
const kOne = (id) => `author:${id}`;

// GET: all authors
async function getAllAuthors() {
  const cached = await cacheGet(kAll);
  if (cached !== null) return cached;

  const authors = await Author.find({})
    .sort({ name: 1 })
    .lean();

  await cacheSet(kAll, authors, TTL);
  return authors;
}

// GET: author by id (cached)
async function getAuthorById(authorId) {
  const key = kOne(authorId);
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const author = await Author.findById(authorId).lean();
  if (author) await cacheSet(key, author, TTL);
  return author;
}

// PURGES
async function purgeAuthorById(authorId) {
  if (!authorId) return;
  await cacheDel(kOne(authorId));
}

async function purgeAllAuthors() {
  await cacheDel(kAll);
}

async function purgeAfterAuthorChange(authorId) {
  await Promise.all([purgeAuthorById(authorId), purgeAllAuthors()]);
}

module.exports = {
  getAllAuthors,
  getAuthorById,
  purgeAuthorById,
  purgeAllAuthors,
  purgeAfterAuthorChange,
};
