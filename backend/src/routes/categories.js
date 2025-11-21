const express = require('express');

const router = express.Router();

// Lista padrão de categorias; pode ser movida para banco no futuro.
const CATEGORIES = [
  'Educação',
  'Jardinagem',
  'Manutenção',
  'Limpeza',
  'Informática',
  'Beleza',
  'Construção',
  'Transporte',
  'Saúde',
  'Eventos',
  'Outros'
];

router.get('/', (req, res) => {
  res.json({ categories: CATEGORIES });
});

module.exports = router;
