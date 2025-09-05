const { cacheGet, cacheSet, cacheDel } = require('../../cache');
const Review = require('../../models/Review');

const TTL = 300; // seconds

// ---- KEYS ----
const kAll = () => 'reviews:all';
const kBook = (bookId) => `reviews:book:${bookId}`;
const kOne = (reviewId) => `review:${reviewId}`;

// ---- GETTERS (with cache) ----
async function getAllReviews() {
  const key = kAll();
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const reviews = await Review.find().populate('book').sort({ createdAt: -1 });
  await cacheSet(key, reviews, TTL);
  return reviews;
}

async function getReviewsByBook(bookId) {
  const key = kBook(bookId);
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const reviews = await Review.find({ book: bookId })
    .populate('book')
    .sort({ createdAt: -1 });

  await cacheSet(key, reviews, TTL);
  return reviews;
}

async function getReviewById(reviewId) {
  const key = kOne(reviewId);
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const review = await Review.findById(reviewId).populate('book');
  if (!review) return null;

  await cacheSet(key, review, TTL);
  return review;
}

// ---- PURGES ----
async function purgeAllReviews() {
  await cacheDel(kAll());
}

async function purgeReviewsByBook(bookId) {
  if (!bookId) return;
  await cacheDel(kBook(bookId));
}

async function purgeReviewById(reviewId) {
  if (!reviewId) return;
  await cacheDel(kOne(reviewId));
}

/**
 * Call this after create/update/delete of a review.
 * It invalidates:
 *  - the single review
 *  - the per-book list
 *  - the global list
 */
async function purgeAfterReviewChange({ reviewId, bookId }) {
  await Promise.all([
    purgeReviewById(reviewId),
    purgeReviewsByBook(bookId),
    purgeAllReviews(),
  ]);
}

module.exports = {
  // getters
  getAllReviews,
  getReviewsByBook,
  getReviewById,
  // purges
  purgeAllReviews,
  purgeReviewsByBook,
  purgeReviewById,
  purgeAfterReviewChange,
};
