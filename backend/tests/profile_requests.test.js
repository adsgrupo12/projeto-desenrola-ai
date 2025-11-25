const path = require('path');
const request = require('supertest');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = require('../src/app');

const suffix = Date.now();

const provider = {
  nome: 'Prestador Fluxo',
  email: `prov.${suffix}@desenrola.ai`,
  telefone: '85988880001',
  senha: 'Teste@123',
  role: 'PRESTADOR'
};

const client = {
  nome: 'Cliente Fluxo',
  email: `cli.${suffix}@desenrola.ai`,
  telefone: '85988880002',
  senha: 'Teste@123',
  role: 'CLIENTE'
};

let providerToken;
let clientToken;
let serviceId;
let requestId;

describe('Perfil e regras de solicitações', () => {
  jest.setTimeout(30000);

  it('registra e loga prestador e cliente', async () => {
    const regProv = await request(app).post('/auth/register').send(provider);
    expect(regProv.status).toBe(201);

    const regCli = await request(app).post('/auth/register').send(client);
    expect(regCli.status).toBe(201);

    const loginProv = await request(app).post('/auth/login').send({
      email: provider.email,
      senha: provider.senha
    });
    expect(loginProv.status).toBe(200);
    providerToken = loginProv.body.sessionToken;

    const loginCli = await request(app).post('/auth/login').send({
      email: client.email,
      senha: client.senha
    });
    expect(loginCli.status).toBe(200);
    clientToken = loginCli.body.sessionToken;
  });

  it('atualiza perfil do cliente e valida leitura', async () => {
    const patch = await request(app)
      .patch('/auth/me')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ telefone: '85977770000', cidade: 'Fortaleza', uf: 'CE' });
    expect(patch.status).toBe(200);
    expect(patch.body.telefone).toBe('85977770000');

    const me = await request(app)
      .get('/auth/me')
      .set('Authorization', `Bearer ${clientToken}`);
    expect(me.status).toBe(200);
    expect(me.body.telefone).toBe('85977770000');
    expect(me.body.cidade).toBe('Fortaleza');
  });

  it('prestador cria serviço', async () => {
    const res = await request(app)
      .post('/services')
      .set('Authorization', `Bearer ${providerToken}`)
      .send({
        titulo: 'Serviço Teste',
        descricao: 'Descricao teste',
        categoria: 'Educação',
        preco: 50,
        cidade: 'Fortaleza',
        uf: 'CE'
      });
    expect(res.status).toBe(201);
    serviceId = res.body.id;
  });

  it('cliente cria solicitação e pode cancelar, mas não confirmar', async () => {
    const createReq = await request(app)
      .post('/requests')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({
        servicoId: serviceId,
        endereco: { cidade: 'Fortaleza', uf: 'CE' }
      });
    expect(createReq.status).toBe(201);
    requestId = createReq.body.id;

    const failConfirm = await request(app)
      .patch(`/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'CONFIRMADO' });
    expect(failConfirm.status).toBe(403);

    const cancel = await request(app)
      .patch(`/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${clientToken}`)
      .send({ status: 'CANCELADO' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe('CANCELADO');
  });

  it('prestador muda status para NEGOCIACAO e CONFIRMADO', async () => {
    const nego = await request(app)
      .patch(`/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'NEGOCIACAO' });
    expect(nego.status).toBe(200);

    const conf = await request(app)
      .patch(`/requests/${requestId}/status`)
      .set('Authorization', `Bearer ${providerToken}`)
      .send({ status: 'CONFIRMADO' });
    expect(conf.status).toBe(200);
    expect(conf.body.status).toBe('CONFIRMADO');
  });
});
