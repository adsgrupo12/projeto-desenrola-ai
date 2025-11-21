const express = require('express');
const Parse = require('parse/node');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { q, category } = req.query;
    const Service = Parse.Object.extend('Servico');
    const query = new Parse.Query(Service);

    if (q) {
      query.contains('titulo', q);
    }
    if (category) {
      query.equalTo('categoria', category);
    }

    const results = await query.find();

    const prestadorIds = [...new Set(results.map((svc) => svc.get('prestadorId')).filter(Boolean))];
    const prestadorMap = {};
    if (prestadorIds.length) {
      try {
        const userQuery = new Parse.Query(Parse.User);
        userQuery.containedIn('objectId', prestadorIds);
        const users = await userQuery.find({ useMasterKey: Boolean(Parse.masterKey) });
        users.forEach((u) => {
          prestadorMap[u.id] = u.get('nome') || u.get('username');
        });
      } catch (err) {
        console.warn('Não foi possível carregar nomes de prestadores sem masterKey.');
      }
    }

    res.json(
      results.map((svc) => ({
        id: svc.id,
        titulo: svc.get('titulo'),
        descricao: svc.get('descricao'),
        categoria: svc.get('categoria'),
        preco: svc.get('preco'),
        prestadorId: svc.get('prestadorId'),
        prestadorNome: prestadorMap[svc.get('prestadorId')] || svc.get('prestadorNome') || 'Prestador',
        cidade: svc.get('cidade'),
        uf: svc.get('uf'),
        latitude: svc.get('latitude'),
        longitude: svc.get('longitude')
      }))
    );
  })
);

router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const body = req.body || {};
    const required = ['titulo', 'descricao', 'categoria'];
    const missing = required.filter((f) => !body[f]);
    if (missing.length) {
      return res.status(400).json({ message: `Campos obrigatórios: ${missing.join(', ')}` });
    }

    const Service = Parse.Object.extend('Servico');
    const svc = new Service();
    svc.set('titulo', body.titulo);
    svc.set('descricao', body.descricao);
    svc.set('categoria', body.categoria);
    svc.set('preco', body.preco || null);
    svc.set('prestadorId', user.id);
    svc.set('prestadorNome', user.get('nome') || user.get('username') || 'Prestador');
    svc.set('cep', body.cep || user.get('cep') || null);
    svc.set('logradouro', body.logradouro || user.get('logradouro') || null);
    svc.set('numero', body.numero || user.get('numero') || null);
    svc.set('bairro', body.bairro || user.get('bairro') || null);
    svc.set('cidade', body.cidade || user.get('cidade') || null);
    svc.set('uf', body.uf || user.get('uf') || null);
    svc.set('complemento', body.complemento || null);
    svc.set('latitude', body.latitude || null);
    svc.set('longitude', body.longitude || null);
    svc.set('geocode_precision', body.geocode_precision || null);

    const saved = await svc.save(null, { sessionToken: req.sessionToken });

    res.status(201).json({
      id: saved.id,
      titulo: saved.get('titulo'),
      categoria: saved.get('categoria'),
      preco: saved.get('preco')
    });
  })
);

router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const Service = Parse.Object.extend('Servico');
    const query = new Parse.Query(Service);
    const svc = await query.get(req.params.id);

    if (svc.get('prestadorId') !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const body = req.body || {};
    [
      'titulo',
      'descricao',
      'categoria',
      'preco',
      'prestadorNome',
      'cep',
      'logradouro',
      'numero',
      'bairro',
      'cidade',
      'uf',
      'complemento',
      'latitude',
      'longitude',
      'geocode_precision'
    ].forEach((field) => {
      if (body[field] !== undefined) svc.set(field, body[field]);
    });

    const saved = await svc.save(null, { sessionToken: req.sessionToken });

    res.json({
      id: saved.id,
      titulo: saved.get('titulo'),
      descricao: saved.get('descricao'),
      categoria: saved.get('categoria'),
      preco: saved.get('preco')
    });
  })
);

router.delete(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const Service = Parse.Object.extend('Servico');
    const query = new Parse.Query(Service);
    const svc = await query.get(req.params.id);

    if (svc.get('prestadorId') !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await svc.destroy({ sessionToken: req.sessionToken });
    res.status(204).send();
  })
);

module.exports = router;
