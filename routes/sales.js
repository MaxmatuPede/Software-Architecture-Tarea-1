const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');
const { getAllSales, purgeSalesCache } = require('./services/salesCache');

// GET ALL
router.get('/', async (req, res) => {
  try {
    const sales = await getAllSales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const sale = new Sales(req.body);
    const savedSale = await sale.save();
    await purgeSalesCache();
    res.redirect('/?model=sales');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET ID
router.get('/:id', async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id).populate('book');
    if (!sale) return res.status(404).json({ message: 'Registro de ventas no encontrado' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE 
router.put('/:id', async (req, res) => {
  try {
    const sale = await Sales.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('book');
    if (!sale) return res.status(404).json({ message: 'Registro de ventas no encontrado' });
    await purgeSalesCache();
    res.redirect('/?model=sales');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE 
router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sales.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Registro de ventas no encontrado' });
    await purgeSalesCache();
    res.json({ message: 'Registro de ventas eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
