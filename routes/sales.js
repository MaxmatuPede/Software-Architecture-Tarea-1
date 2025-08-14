const express = require('express');
const router = express.Router();
const Sales = require('../models/Sales');

router.get('/', async (req, res) => {
  try {
    const sales = await Sales.find().populate('book');
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const sale = new Sales(req.body);
    const savedSale = await sale.save();
    const populatedSale = await Sales.findById(savedSale._id).populate('book');
    res.redirect('/?model=sales');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id).populate('book');
    if (!sale) return res.status(404).json({ message: 'Registro de ventas no encontrado' });
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const sale = await Sales.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('book');
    if (!sale) return res.status(404).json({ message: 'Registro de ventas no encontrado' });
    res.redirect('/?model=sales');
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const sale = await Sales.findByIdAndDelete(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Registro de ventas no encontrado' });
    res.json({ message: 'Registro de ventas eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;