# Arquitetura – Desenrola Aí

## 1. Visão
Arquitetura simples e escalável para web responsiva, com backend REST e banco relacional.

## 2. Decisões arquiteturais
- **Backend**: Node.js/Express **ou** Java; priorizamos REST por simplicidade e onipresença em clientes.
- **Banco**: SQLite em desenvolvimento; MySQL em produção.
- **Implantação**: serviços gerenciados com baixo custo (Vercel/Render + Railway/Planetscale, a definir).
- **Docs**: OpenAPI/Swagger; diagramas em Mermaid/Draw.io.

## 3. Diagrama de contexto
```mermaid
flowchart LR
  User[Usuário] --> Web[Frontend Web Responsivo]
  Web --> API[API REST (Node/Express ou Java)]
  API --> DB[(SQLite/MySQL)]
  API --> Ext[Serviço Externo de Notificação (WhatsApp/SMS)]
```

## 4. Diagrama de componentes (alto nível)
```mermaid
flowchart TB
  subgraph Frontend
    FE[SPA Leve (Bootstrap/JS)]
  end
  subgraph Backend
    AUTH[Auth Controller]
    SRV[Serviços Controller]
    SOL[Solicitações Controller]
    NOTIF[Notificações (integração externa)]
  end
  subgraph Data
    DB[(SQLite/MySQL)]
  end

  FE --> AUTH
  FE --> SRV
  FE --> SOL
  AUTH --> DB
  SRV --> DB
  SOL --> DB
  NOTIF --> SOL
```

## 5. Qualidades/atributos
- **Usabilidade** (layout responsivo), **Desempenho** (consultas otimizadas), **Segurança** (hash de senha; validação), **Manutenibilidade** (camadas claras), **Observabilidade** (logs).

## 6. Padrões e práticas
- MVC no backend; DTOs para requisições/respostas; camadas Controller/Service/Repository.
- Tratamento centralizado de erros; validação de entrada.
- Versionamento de API (v1).

## 7. Plano de testes/validação (resumo)
- Testes unitários de controllers/serviços.
- Rotas exercitadas via Postman/Insomnia.
- Testes exploratórios de UX nas principais jornadas.

_Atualizado em 2025-08-31_
