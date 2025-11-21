# Documentação da API (Implementação – Etapa 2)

> Histórico de mudança: criado/atualizado para refletir a API implementada em Node.js + Express + Parse (Back4App), derivada de `api_specification.md` da etapa 1. Registra endpoints concretos e parâmetros atuais.

## Convenções
- Base local: `http://localhost:3001`
- Auth: Bearer Token (`Authorization: Bearer <sessionToken>`) ou header `x-session-token`.
- Formato: JSON

## Endpoints
### Health
- `GET /health` → `{ status: "ok", parseServer: true }`

### Auth
- `POST /auth/register`  
  - Body: `{ nome, email, telefone, senha, role: "CLIENTE"|"PRESTADOR" }`  
  - 201: usuário criado + `sessionToken`
- `POST /auth/login`  
  - Body: `{ email, senha }`  
  - 200: usuário + `sessionToken`
- `GET /auth/me`  
  - Header: `Authorization: Bearer <token>`  
  - 200: dados do usuário autenticado

### Serviços
- `GET /services?q=<texto>&category=<categoria>`  
  Lista serviços (filtro opcional por título e categoria)
- `POST /services` (autenticado, prestador)  
  - Body mínimo: `{ titulo, descricao, categoria }`  
  - Extras de endereço/geo: `preco, cep, logradouro, numero, bairro, cidade, uf, complemento, latitude, longitude, geocode_precision`
- `PUT /services/:id` (dono)  
  Atualiza campos; respeita ownership do prestador
- `DELETE /services/:id` (dono)

### Solicitações
- `POST /requests` (cliente)  
  - Body: `{ servicoId, endereco?: { cep, logradouro, numero, bairro, cidade, uf, complemento, latitude, longitude, geocode_precision } }`
- `GET /requests/mine` (cliente ou prestador)  
  - Retorna solicitações em que o usuário é cliente ou prestador
- `PATCH /requests/:id/status` (prestador do serviço)  
  - Body: `{ status: "PENDENTE"|"NEGOCIACAO"|"CONFIRMADO"|"RECUSADO" }`

### Integrações externas (proxy backend)
- `GET /external/viacep/:cep`  
  - CEP normalizado → endereço (cache 15 min)
- `GET /external/geocode?endereco=...`  
  - Usa Nominatim (OpenStreetMap) para `{ latitude, longitude, geocode_precision }` (cache 15 min)

## Erros
- 400: validação/parâmetro inválido
- 401: não autenticado
- 403: não autorizado (ownership/role)
- 404: recurso não encontrado
- 500: erro interno

## Observações
- Classes Parse: `User` (campo `role`), `Servico`, `Solicitacao`.
- Chaves e URLs ficam em `.env` (não versionar).  
- Para produção, ajustar CORS e considerar trocar geocoding para Mapbox se houver limite no Nominatim.
