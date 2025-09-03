const { cacheGet, cacheSet, cacheDel } = require('../../cache');
const Review = require('../../models/Review');

async function getReviewScore(bookId) {
  const key = `reviewScore:${bookId}`;
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const reviews = await Review.find({ book: bookId });
  if (reviews.length === 0) {
    await cacheSet(key, 0, 300);
    return 0;
  }

  const sum = reviews.reduce((acc, r) => acc + r.score, 0);
  const avg = sum / reviews.length;

  await cacheSet(key, avg, 300);
  return avg;
}

async function purgeReviewScore(bookId) {
  if (!bookId) return;
  await cacheDel(`reviewScore:${bookId}`);
}

module.exports = { getReviewScore, purgeReviewScore };
