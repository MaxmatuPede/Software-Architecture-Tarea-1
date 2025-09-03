const { cacheGet, cacheSet, cacheDel } = require('../../cache');
const Sales = require('../../models/Sales');

async function getAllSales() {
  const key = 'sales:all';
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const sales = await Sales.find().populate('book');
  await cacheSet(key, sales, 600);
  return sales;
}

async function purgeSalesCache() {
  await cacheDel('sales:all');
}

module.exports = { getAllSales, purgeSalesCache };
