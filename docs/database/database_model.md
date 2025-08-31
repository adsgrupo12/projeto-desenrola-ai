# Modelo de Dados – Desenrola Aí

## 1. Entidades principais
- **Usuario**(id, nome, email, telefone, senha_hash, papel: CLIENTE|PRESTADOR, criado_em)
- **Servico**(id, prestador_id, titulo, descricao, categoria, preco, criado_em, atualizado_em)
- **Solicitacao**(id, servico_id, cliente_id, status: PENDENTE|NEGOCIACAO|CONFIRMADO|RECUSADO, criado_em, atualizado_em)
- **Categoria**(id, nome)

## 2. Diagrama ER (Mermaid)
```mermaid
erDiagram
  USUARIO ||--o{ SERVICO : "oferece"
  USUARIO ||--o{ SOLICITACAO : "solicita"
  SERVICO ||--o{ SOLICITACAO : "pertence a"
  CATEGORIA ||--o{ SERVICO : "classifica"

  USUARIO {
    int id PK
    string nome
    string email
    string telefone
    string senha_hash
    string papel
    datetime criado_em
  }

  CATEGORIA {
    int id PK
    string nome
  }

  SERVICO {
    int id PK
    int prestador_id FK
    int categoria_id FK
    string titulo
    string descricao
    decimal preco
    datetime criado_em
    datetime atualizado_em
  }

  SOLICITACAO {
    int id PK
    int servico_id FK
    int cliente_id FK
    string status
    datetime criado_em
    datetime atualizado_em
  }
```

## 3. Dicionário de Dados (amostra)
- **USUARIO.email**: único, formato válido.
- **SERVICO.preco**: decimal(10,2), pode ser nulo quando “a combinar”.
- **SOLICITACAO.status**: enum('PENDENTE','NEGOCIACAO','CONFIRMADO','RECUSADO').

_Atualizado em 2025-08-31_
