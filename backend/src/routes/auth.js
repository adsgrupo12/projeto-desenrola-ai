const express = require('express');
const Parse = require('parse/node');
const { asyncHandler } = require('../utils/asyncHandler');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

const ALLOWED_ROLES = ['CLIENTE', 'PRESTADOR'];

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const {
      nome,
      email,
      telefone,
      senha,
      role = 'CLIENTE',
      logradouro,
      numero,
      bairro,
      cidade,
      uf,
      cep,
      descricao,
      categorias
    } = req.body;

    if (!nome || !email || !telefone || !senha) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes' });
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: 'Papel inválido' });
    }

    const user = new Parse.User();
    user.set('username', email);
    user.set('password', senha);
    user.set('email', email);
    user.set('nome', nome);
    user.set('telefone', telefone);
    user.set('role', role);

    // Campos adicionais para prestador (salvos sem masterKey, pois o pr��prio usu��rio cria o objeto)
    if (role === 'PRESTADOR') {
      if (logradouro) user.set('logradouro', logradouro);
      if (numero) user.set('numero', numero);
      if (bairro) user.set('bairro', bairro);
      if (cidade) user.set('cidade', cidade);
      if (uf) user.set('uf', uf);
      if (cep) user.set('cep', cep);
      if (descricao) user.set('descricao', descricao);
      if (categorias) {
        const cats = Array.isArray(categorias)
          ? categorias
          : String(categorias)
              .split(',')
              .map((c) => c.trim())
              .filter(Boolean);
        user.set('categorias', cats);
      }
    }

    await user.signUp();
    const sessionToken = user.getSessionToken();

    res.status(201).json({
      id: user.id,
      nome,
      email,
      telefone,
      role,
      sessionToken
    });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
    }

    const user = await Parse.User.logIn(email, senha);
    const sessionToken = user.getSessionToken();

    res.json({
      id: user.id,
      nome: user.get('nome'),
      email: user.get('email'),
      telefone: user.get('telefone'),
      role: user.get('role'),
      sessionToken
    });
  })
);

router.get(
  '/me',
  asyncHandler(async (req, res) => {
    const header = req.headers.authorization || '';
    const sessionHeader = req.headers['x-session-token'];
    let token = null;

    if (header.startsWith('Bearer ')) {
      token = header.replace('Bearer ', '').trim();
    } else if (sessionHeader) {
      token = sessionHeader;
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await Parse.User.become(token);

    res.json({
      id: user.id,
      nome: user.get('nome'),
      email: user.get('email'),
      telefone: user.get('telefone'),
      role: user.get('role'),
      logradouro: user.get('logradouro') || '',
      numero: user.get('numero') || '',
      bairro: user.get('bairro') || '',
      cidade: user.get('cidade') || '',
      uf: user.get('uf') || '',
      cep: user.get('cep') || ''
    });
  })
);

router.patch(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const {
      nome,
      telefone,
      logradouro,
      numero,
      bairro,
      cidade,
      uf,
      cep,
      descricao
    } = req.body || {};

    if (nome !== undefined) user.set('nome', nome);
    if (telefone !== undefined) user.set('telefone', telefone);
    if (logradouro !== undefined) user.set('logradouro', logradouro);
    if (numero !== undefined) user.set('numero', numero);
    if (bairro !== undefined) user.set('bairro', bairro);
    if (cidade !== undefined) user.set('cidade', cidade);
    if (uf !== undefined) user.set('uf', uf);
    if (cep !== undefined) user.set('cep', cep);
    if (descricao !== undefined) user.set('descricao', descricao);

    await user.save(null, { sessionToken: req.sessionToken });

    res.json({
      id: user.id,
      nome: user.get('nome'),
      email: user.get('email'),
      telefone: user.get('telefone'),
      role: user.get('role'),
      logradouro: user.get('logradouro') || '',
      numero: user.get('numero') || '',
      bairro: user.get('bairro') || '',
      cidade: user.get('cidade') || '',
      uf: user.get('uf') || '',
      cep: user.get('cep') || ''
    });
  })
);

module.exports = router;
