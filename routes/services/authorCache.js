const { cacheGet, cacheSet, cacheDel } = require('../../cache');
const Author = require('../../models/Author');

async function getAuthorById(authorId) {
  const key = `author:${authorId}`;
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const author = await Author.findById(authorId);
  if (author) await cacheSet(key, author, 600);
  return author;
}

async function getAllAuthors() {
  const key = `authors:all`;
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const authors = await Author.find();
  await cacheSet(key, authors, 600);
  return authors;
}

async function purgeAuthorCache(authorId) {
  if (!authorId) return;
  await cacheDel(`author:${authorId}`);
  await cacheDel(`authors:all`);
}

module.exports = {
  getAuthorById,
  getAllAuthors,
  purgeAuthorCache
};
