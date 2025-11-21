const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 900 }); // 15 min

router.get(
  '/viacep/:cep',
  asyncHandler(async (req, res) => {
    const cep = (req.params.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) {
      return res.status(400).json({ message: 'CEP inválido' });
    }

    const cacheKey = `viacep:${cep}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const base = process.env.VIACEP_BASE_URL || 'https://viacep.com.br/ws';
    const url = `${base}/${cep}/json/`;
    const resp = await axios.get(url, { timeout: 5000 });

    if (resp.data && resp.data.erro) {
      return res.status(404).json({ message: 'CEP não encontrado' });
    }

    const payload = {
      cep: resp.data.cep,
      logradouro: resp.data.logradouro,
      complemento: resp.data.complemento,
      bairro: resp.data.bairro,
      localidade: resp.data.localidade,
      uf: resp.data.uf
    };

    cache.set(cacheKey, payload);
    res.json(payload);
  })
);

router.get(
  '/geocode',
  asyncHandler(async (req, res) => {
    const { endereco } = req.query;
    if (!endereco) {
      return res.status(400).json({ message: 'Parâmetro endereco é obrigatório' });
    }

    const cacheKey = `geocode:${endereco}`;
    const cached = cache.get(cacheKey);
    if (cached) return res.json(cached);

    const provider = process.env.GEOCODE_PROVIDER || 'nominatim';
    if (provider === 'nominatim') {
      const base = process.env.GEOCODE_BASE_URL || 'https://nominatim.openstreetmap.org';
      const url = `${base}/search`;
      const resp = await axios.get(url, {
        params: { format: 'json', q: endereco, addressdetails: 1, limit: 1 },
        headers: { 'User-Agent': 'DesenrolaAI/1.0' },
        timeout: 5000
      });

      const [first] = resp.data || [];
      if (!first) {
        return res.status(404).json({ message: 'Endereço não encontrado' });
      }

      const payload = {
        latitude: parseFloat(first.lat),
        longitude: parseFloat(first.lon),
        geocode_precision: first.type || 'approximate'
      };
      cache.set(cacheKey, payload);
      return res.json(payload);
    }

    return res.status(400).json({ message: 'Provider de geocode não suportado' });
  })
);

module.exports = router;
