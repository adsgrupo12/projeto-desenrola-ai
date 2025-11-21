const express = require('express');
const Parse = require('parse/node');
const { authenticate } = require('../middlewares/auth');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.post(
  '/',
  authenticate,
  asyncHandler(async (req, res) => {
    const { servicoId, endereco = {}, detalhes = '' } = req.body || {};
    if (!servicoId) {
      return res.status(400).json({ message: 'servicoId é obrigatório' });
    }

    const Service = Parse.Object.extend('Servico');
    const serviceQuery = new Parse.Query(Service);
    const service = await serviceQuery.get(servicoId);

    // Guardamos dados textuais para que os cartões exibam nomes/contatos
    // mesmo que o objeto original seja alterado depois.
    const clienteNome = req.user.get('nome') || req.user.get('username') || '';
    const clienteEmail = req.user.get('email') || '';
    const clienteTelefone = req.user.get('telefone') || '';

    let prestadorNome = service.get('prestadorNome') || '';
    let prestadorEmail = '';
    let prestadorTelefone = '';
    try {
      const prestadorUser = await new Parse.Query(Parse.User)
        .equalTo('objectId', service.get('prestadorId'))
        .first({ useMasterKey: Boolean(Parse.masterKey) });
      if (prestadorUser) {
        prestadorNome = prestadorNome || prestadorUser.get('nome') || prestadorUser.get('username') || '';
        prestadorEmail = prestadorUser.get('email') || '';
        prestadorTelefone = prestadorUser.get('telefone') || '';
      }
    } catch (err) {
      // se não houver masterKey, seguimos com o que temos
    }

    const Request = Parse.Object.extend('Solicitacao');
    const reqObj = new Request();
    reqObj.set('servicoId', servicoId);
    reqObj.set('clienteId', req.user.id);
    reqObj.set('clienteNome', clienteNome);
    reqObj.set('clienteEmail', clienteEmail);
    reqObj.set('clienteTelefone', clienteTelefone);
    reqObj.set('status', 'PENDENTE');
    reqObj.set('prestadorId', service.get('prestadorId'));
    reqObj.set('prestadorNome', prestadorNome);
    reqObj.set('prestadorEmail', prestadorEmail);
    reqObj.set('prestadorTelefone', prestadorTelefone);
    reqObj.set('servicoTitulo', service.get('titulo') || '');
    reqObj.set('servicoCategoria', service.get('categoria') || '');
    reqObj.set('servicoPrestadorNome', service.get('prestadorNome') || '');
    const precoRaw = service.get('preco');
    reqObj.set('servicoPreco', precoRaw !== undefined && precoRaw !== null ? String(precoRaw) : '');
    reqObj.set('servicoDescricao', service.get('descricao') || '');
    if (detalhes) reqObj.set('detalhes', detalhes);

    const cidadeFallback = endereco.cidade || service.get('cidade') || req.user.get('cidade') || null;
    const ufFallback = endereco.uf || service.get('uf') || req.user.get('uf') || null;

    [
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
      if (endereco[field] !== undefined) {
        reqObj.set(field, endereco[field]);
      }
    });
    if (cidadeFallback && !reqObj.get('cidade')) reqObj.set('cidade', cidadeFallback);
    if (ufFallback && !reqObj.get('uf')) reqObj.set('uf', ufFallback);

    const saved = await reqObj.save(null, { sessionToken: req.sessionToken });

    res.status(201).json({
      id: saved.id,
      servicoId,
      clienteId: req.user.id,
      status: saved.get('status')
    });
  })
);

router.get(
  '/mine',
  authenticate,
  asyncHandler(async (req, res) => {
    const Request = Parse.Object.extend('Solicitacao');
    const queryAsCliente = new Parse.Query(Request);
    queryAsCliente.equalTo('clienteId', req.user.id);

    const queryAsPrestador = new Parse.Query(Request);
    queryAsPrestador.equalTo('prestadorId', req.user.id);

    const mainQuery = Parse.Query.or(queryAsCliente, queryAsPrestador);
    const results = await mainQuery.find();

    const serviceIds = [...new Set(results.map((r) => r.get('servicoId')).filter(Boolean))];
    const clientIds = [...new Set(results.map((r) => r.get('clienteId')).filter(Boolean))];
    const prestadorIds = [...new Set(results.map((r) => r.get('prestadorId')).filter(Boolean))];

    const serviceMap = {};
    if (serviceIds.length) {
      const Service = Parse.Object.extend('Servico');
      const qSvc = new Parse.Query(Service);
      qSvc.containedIn('objectId', serviceIds);
      const svcList = await qSvc.find({ useMasterKey: Boolean(Parse.masterKey) });
      svcList.forEach((svc) => {
        serviceMap[svc.id] = {
          titulo: svc.get('titulo'),
          categoria: svc.get('categoria'),
          preco: svc.get('preco'),
          prestadorNome: svc.get('prestadorNome') || '',
          cidade: svc.get('cidade') || '',
          uf: svc.get('uf') || '',
          descricao: svc.get('descricao') || ''
        };
      });
    }

    const userMap = {};
    const userIds = [...new Set([...clientIds, ...prestadorIds])];
    if (userIds.length) {
      try {
        const qUser = new Parse.Query(Parse.User);
        qUser.containedIn('objectId', userIds);
        const users = await qUser.find({ useMasterKey: Boolean(Parse.masterKey) });
        users.forEach((u) => {
          userMap[u.id] = {
            nome: u.get('nome') || u.get('username'),
            email: u.get('email') || '',
            telefone: u.get('telefone') || '',
            cidade: u.get('cidade') || '',
            uf: u.get('uf') || ''
          };
        });
      } catch (err) {
        // ignorar se nao houver masterKey
      }
    }

    res.json(
      results.map((r) => ({
        id: r.id,
        servicoId: r.get('servicoId'),
        servicoTitulo: serviceMap[r.get('servicoId')]?.titulo || r.get('servicoTitulo') || '',
        servicoCategoria: serviceMap[r.get('servicoId')]?.categoria || r.get('servicoCategoria') || '',
        servicoPreco: serviceMap[r.get('servicoId')]?.preco ?? r.get('servicoPreco') ?? null,
        servicoPrestadorNome:
          userMap[r.get('prestadorId')]?.nome ||
          serviceMap[r.get('servicoId')]?.prestadorNome ||
          r.get('prestadorNome') ||
          '',
        servicoDescricao: serviceMap[r.get('servicoId')]?.descricao || r.get('servicoDescricao') || '',

        clienteId: r.get('clienteId'),
        prestadorId: r.get('prestadorId'),
        clienteNome: userMap[r.get('clienteId')]?.nome || r.get('clienteNome') || '',
        clienteEmail: userMap[r.get('clienteId')]?.email || r.get('clienteEmail') || '',
        clienteTelefone: userMap[r.get('clienteId')]?.telefone || r.get('clienteTelefone') || '',
        prestadorNome: userMap[r.get('prestadorId')]?.nome || r.get('prestadorNome') || '',
        prestadorEmail: userMap[r.get('prestadorId')]?.email || r.get('prestadorEmail') || '',
        prestadorTelefone: userMap[r.get('prestadorId')]?.telefone || r.get('prestadorTelefone') || '',
        detalhes: r.get('detalhes') || '',

        status: r.get('status'),
        cidade: r.get('cidade') || serviceMap[r.get('servicoId')]?.cidade || userMap[r.get('clienteId')]?.cidade || '',
        uf: r.get('uf') || serviceMap[r.get('servicoId')]?.uf || userMap[r.get('clienteId')]?.uf || '',
        cep: r.get('cep') || '',
        logradouro: r.get('logradouro') || '',
        numero: r.get('numero') || '',
        bairro: r.get('bairro') || '',
        complemento: r.get('complemento') || '',
        latitude: r.get('latitude') || null,
        longitude: r.get('longitude') || null,
        geocode_precision: r.get('geocode_precision') || '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    );
  })
);

router.patch(
  '/:id/status',
  authenticate,
  asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    const allowed = ['PENDENTE', 'NEGOCIACAO', 'CONFIRMADO', 'RECUSADO', 'CANCELADO'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Status inválido' });
    }

    const Request = Parse.Object.extend('Solicitacao');
    const query = new Parse.Query(Request);
    const reqObj = await query.get(req.params.id);

    const isPrestador = reqObj.get('prestadorId') === req.user.id;
    const isCliente = reqObj.get('clienteId') === req.user.id;

    // Prestador pode confirmar/recusar/negociar/cancelar; cliente só pode cancelar.
    if (!isPrestador && !isCliente) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (isCliente && status !== 'CANCELADO') {
      return res.status(403).json({ message: 'Clientes só podem cancelar.' });
    }

    reqObj.set('status', status);
    const saved = await reqObj.save(null, { sessionToken: req.sessionToken });

    res.json({
      id: saved.id,
      status: saved.get('status')
    });
  })
);

// Atualiza detalhes/endereco de uma solicitacao (cliente ou prestador).
router.patch(
  '/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const { detalhes, endereco = {} } = req.body || {};

    const Request = Parse.Object.extend('Solicitacao');
    const query = new Parse.Query(Request);
    const reqObj = await query.get(req.params.id);

    const isPrestador = reqObj.get('prestadorId') === req.user.id;
    const isCliente = reqObj.get('clienteId') === req.user.id;
    if (!isPrestador && !isCliente) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (detalhes !== undefined) reqObj.set('detalhes', detalhes);
    [
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
      if (endereco[field] !== undefined) {
        reqObj.set(field, endereco[field]);
      }
    });

    const saved = await reqObj.save(null, { sessionToken: req.sessionToken });
    res.json({ id: saved.id });
  })
);

module.exports = router;
