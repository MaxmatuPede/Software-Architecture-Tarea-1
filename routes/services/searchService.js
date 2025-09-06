const axios = require('axios');

let searchClient = null;
let searchEnabled = false;
let connecting = false;

async function tryConnect(url = process.env.OPENSEARCH_URL || 'http://opensearch:9200') {
  if (connecting || searchEnabled) return;
  connecting = true;
  
  try {
    const response = await axios.get(`${url}/_cluster/health`);
    
    if (response.status === 200) {
      searchClient = axios.create({ 
        baseURL: url,
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      searchEnabled = true;
      console.log('✅ Connected to OpenSearch');
      
      await createIndicesIfNotExist();
    }
  } catch (err) {
    console.log('⚠️ OpenSearch not available:', err.message);
    searchEnabled = false;
    searchClient = null;
  } finally {
    connecting = false;
  }
}

tryConnect();
setInterval(() => {
  if (!searchEnabled) tryConnect();
}, 5000);

function isSearchEnabled() {
  return searchEnabled;
}

async function createIndicesIfNotExist() {
  if (!searchEnabled || !searchClient) return;
  
  try {
    await searchClient.put('/books', {
      mappings: {
        properties: {
          name: { type: 'text', analyzer: 'standard' },
          summary: { type: 'text', analyzer: 'standard' },
          author_name: { type: 'text', analyzer: 'standard' },
          author_id: { type: 'keyword' },
          date_publication: { type: 'date' },
          total_sales: { type: 'integer' }
        }
      }
    });
    console.log('📚 Books index created/verified');
  } catch (err) {
    if (!err.response?.data?.error?.type?.includes('resource_already_exists')) {
      console.log('Warning creating books index:', err.message);
    }
  }
  
  try {
    await searchClient.put('/reviews', {
      mappings: {
        properties: {
          book_id: { type: 'keyword' },
          book_name: { type: 'text', analyzer: 'standard' },
          review_content: { type: 'text', analyzer: 'standard' },
          score: { type: 'integer' },
          upvotes: { type: 'integer' }
        }
      }
    });
    console.log('💬 Reviews index created/verified');
  } catch (err) {
    if (!err.response?.data?.error?.type?.includes('resource_already_exists')) {
      console.log('Warning creating reviews index:', err.message);
    }
  }
}

async function indexBook(book) {
  if (!searchEnabled || !searchClient) return;
  
  try {
    await searchClient.put(`/books/_doc/${book._id}`, {
      name: book.name,
      summary: book.summary,
      author_name: book.author?.name || 'Unknown',
      author_id: book.author?._id?.toString(),
      date_publication: book.dateOfPublication,
      total_sales: book.numberOfSales || 0
    });
    console.log('indexBook', book._id, book.name);
  } catch (err) {
    console.log('indexBook error', err.message);
  }
}

async function indexReview(review) {
  if (!searchEnabled || !searchClient) return;
  
  try {
    await searchClient.put(`/reviews/_doc/${review._id}`, {
      book_id: review.book?._id?.toString() || review.book,
      book_name: review.book?.name || 'Unknown Book',
      review_content: review.review,
      score: review.score,
      upvotes: review.upvotes || 0
    });
    console.log('indexReview', review._id);
  } catch (err) {
    console.log('indexReview error', err.message);
  }
}

async function deleteBook(bookId) {
  if (!searchEnabled || !searchClient) return;
  
  try {
    await searchClient.delete(`/books/_doc/${bookId}`);
    console.log('deleteBook', bookId);
  } catch (err) {
    console.log('deleteBook error', err.message);
  }
}

async function deleteReview(reviewId) {
  if (!searchEnabled || !searchClient) return;
  
  try {
    await searchClient.delete(`/reviews/_doc/${reviewId}`);
    console.log('deleteReview', reviewId);
  } catch (err) {
    console.log('deleteReview error', err.message);
  }
}

async function searchBooks(query) {
  if (!searchEnabled || !searchClient) {
    const Book = require('../../models/Book');
    console.log('searchBooks FALLBACK to MongoDB:', query);
    return await Book.find({ 
      $or: [
        { name: new RegExp(query, 'i') },
        { summary: new RegExp(query, 'i') }
      ]
    }).populate('author').lean();
  }
  
  try {
    const response = await searchClient.post('/books/_search', {
      query: {
        multi_match: {
          query: query,
          fields: ['name^2', 'summary', 'author_name'],
          fuzziness: 'AUTO'
        }
      },
      size: 20
    });
    
    console.log('searchBooks OpenSearch:', query, `${response.data.hits.hits.length} results`);
    return response.data.hits.hits.map(hit => ({
      _id: hit._id,
      ...hit._source,
      _score: hit._score
    }));
  } catch (err) {
    console.log('searchBooks error:', err.message);
    return [];
  }
}

async function searchReviews(query) {
  if (!searchEnabled || !searchClient) {
    const Review = require('../../models/Review');
    console.log('searchReviews FALLBACK to MongoDB:', query);
    return await Review.find({ 
      review: new RegExp(query, 'i')
    }).populate('book').lean();
  }
  
  try {
    const response = await searchClient.post('/reviews/_search', {
      query: {
        multi_match: {
          query: query,
          fields: ['review_content^2', 'book_name'],
          fuzziness: 'AUTO'
        }
      },
      size: 20
    });
    
    console.log('searchReviews OpenSearch:', query, `${response.data.hits.hits.length} results`);
    return response.data.hits.hits.map(hit => ({
      _id: hit._id,
      ...hit._source,
      _score: hit._score
    }));
  } catch (err) {
    console.log('searchReviews error:', err.message);
    return [];
  }
}

async function searchAll(query) {
  const [books, reviews] = await Promise.all([
    searchBooks(query),
    searchReviews(query)
  ]);
  
  return {
    books: books,
    reviews: reviews,
    total: books.length + reviews.length
  };
}

module.exports = { 
  indexBook, 
  indexReview, 
  deleteBook, 
  deleteReview, 
  searchBooks, 
  searchReviews, 
  searchAll,
  isSearchEnabled
};