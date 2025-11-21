const path = require('path');
const request = require('supertest');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = require('../src/app');

const emailSuffix = Date.now();
const provider = {
  nome: 'Prestador Teste',
  email: `prestador.${emailSuffix}@desenrola.ai`,
  telefone: '85999990001',
  senha: 'Teste@123',
  role: 'PRESTADOR'
};

const client = {
  nome: 'Cliente Teste',
  email: `cliente.${emailSuffix}@desenrola.ai`,
  telefone: '85999990002',
  senha: 'Teste@123',
  role: 'CLIENTE'
};

const servicePayload = {
  titulo: 'Aulas de Matemática',
  descricao: 'Refôrço escolar',
  categoria: 'Educação',
  preco: 60.0,
  cidade: 'Fortaleza',
  uf: 'CE'
};

let providerToken;
let clientToken;
let serviceId;
let requestId;

describe('Fluxos principais (auth, serviços, solicitações)', () => {
  jest.setTimeout(30000);

  it('registra e faz login do prestador', async () => {
    const reg = await request(app).post('/auth/register').send(provider);
    expect(reg.status).toBe(201);
    expect(reg.body).toHaveProperty('sessionToken');

    const login = await request(app).post('/auth/login').send({
      email: provider.email,
      senha: provider.senha
    });
    expect(login.status).toBe(200);
    providerToken = login.body.sessionToken;
    expect(providerToken).toBeTruthy();
  });

  it('registra e faz login do cliente', async () => {
    const reg = await request(app).post('/auth/register').send(client);
    expect(reg.status).toBe(201);

    const login = await request(app).post('/auth/login').send({
      email: client.email,
      senha: client.senha
    });
    expect(login.status).toBe(200);
    clientToken = login.body.sessionToken;
    expect(clientToken).toBeTruthy();
  });

  it('cria serviço (prestador)', async () => {
    const res = await request(app)
      .post('/services')
      .set('Authorization', `Bearer ${providerToken}`)
      .send(servicePayload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    serviceId = res.body.id;
  });

  it('lista serviços com filtro', async () => {
    const res = await request(app).get('/services').query({ q: 'Aulas' });
    expect(res.status).toBe(200);
    const found = res.body.find((s) => s.id === serviceId);
    expect(found).toBeTruthy();
  });

  it('cria solicitação (cliente)', async () => {
    const res = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        servicoId: serviceId,
        endereco: { cidade: 'Fortaleza', uf: 'CE' }
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    requestId = res.body.id;
  });

  it('prestador vê suas solicitações e atualiza status', async () => {
    const resList = await request(app)
      .get('/requests/mine')
      .set('Authorization', `Bearer ${providerToken}`);

    expect(resList.status).toBe(200);
    const reqItem = resList.body.find((r) => r.id === requestId);
    expect(reqItem).toBeTruthy();

    const resStatus = await request(app)
      .patch(`/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'CONFIRMADO' });

    expect(resStatus.status).toBe(200);
    expect(resStatus.body.status).toBe('CONFIRMADO');
  });
});
