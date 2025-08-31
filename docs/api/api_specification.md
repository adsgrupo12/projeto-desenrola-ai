# Especificação de API – Desenrola Aí

## 1. Convenções
- Base URL: `/api/v1`
- Autenticação: Bearer Token (JWT) – a definir
- Formato: JSON
- Erros: objeto com `code`, `message`, `details`

## 2. Endpoints (MVP)
### Auth
- `POST /auth/register` – cria usuário
- `POST /auth/login` – autentica e retorna token

### Usuários
- `GET /users/me` – dados do usuário autenticado

### Serviços
- `GET /services` – lista com filtros (?q, ?category)
- `POST /services` – cria serviço (prestador)
- `PUT /services/:id` – atualiza serviço (dono)
- `DELETE /services/:id` – remove serviço (dono)

### Solicitações
- `POST /requests` – cria solicitação { servico_id }
- `GET /requests/mine` – solicitações do usuário (como cliente ou prestador)
- `PATCH /requests/:id/status` – muda status (prestador)

### Notificações (Integração Externa)
- `POST /notifications/send` – dispara notificação (stub para WhatsApp/SMS)

## 3. Exemplos
### Criar serviço
Request:
```json
{
  "titulo": "Aulas de Matemática",
  "descricao": "Refôrço escolar para ensino médio",
  "categoria": "Educação",
  "preco": 60.0
}
```
Response 201:
```json
{
  "id": 123,
  "prestador_id": 45,
  "titulo": "Aulas de Matemática",
  "categoria": "Educação",
  "preco": 60.0
}
```

## 4. Tratamento de erros (padrão)
- 400 – validação
- 401 – não autenticado
- 403 – não autorizado
- 404 – não encontrado
- 500 – erro interno

## 5. OpenAPI
Arquivo `openapi.yml` (a completar na Etapa 2 – N708).

_Atualizado em 2025-08-31_
