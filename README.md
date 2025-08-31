# Desenrola Aí – Uma plataforma que conecta profissionais e clientes

Plataforma multiplataforma que conecta prestadores de pequenos serviços (jardinagem, aulas, consertos etc.) a clientes, com foco em impacto social local.

## Problema abordado e justificativa
Em centros urbanos como Fortaleza, trabalhadores informais têm dificuldade de alcançar clientes com segurança, transparência e escala. O Desenrola Aí cria um canal confiável de busca, avaliação e contratação de serviços.

### Relação com os ODS
- **ODS 11 – Cidades e Comunidades Sustentáveis (ênfase principal)**: fortalece economias de bairro, reduz deslocamentos desnecessários e facilita acesso a serviços urbanos.
- **ODS 8 – Trabalho Decente e Crescimento Econômico**: incentiva geração de renda e inclusão produtiva.
- **ODS 10 – Redução das Desigualdades**: amplia acesso a oportunidades e informações.

## Objetivos do sistema
- Cadastro/autenticação de usuários (clientes e prestadores)
- Cadastro/edição/exclusão de serviços
- Busca com filtros por categoria
- Solicitação de contratação com registro de status
- Protótipos multiplataforma (web + mobile via Figma)
- APIs documentadas para integrações

## Escopo do MVP
**Incluído**: cadastro, login, CRUD de serviços, busca/filtros, solicitações, controle de acesso, geolocalização.  
**Fora do escopo (backlog)**: pagamentos online, avaliações/comentários, push notifications, relatórios.

## Visão geral da arquitetura
```mermaid
flowchart TD
    A[Usuário (Cliente/Prestador)] -->|Web/Mobile| B[Frontend - Web Responsivo (HTML/CSS/JS/Bootstrap)]
    A -->|App Prototype| C[Protótipo Mobile - Figma]
    B -->|REST API| D[Backend - Node.js/Express ou Java]
    D --> E[(Banco de Dados - SQLite/MySQL)]
    D --> F[Integração Externa - Notificação (SMS/WhatsApp)]
```

## Tecnologias propostas
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Protótipos Mobile**: Figma
- **Backend**: Node.js/Express **ou** Java
- **Banco de Dados**: SQLite (dev) / MySQL (prod)
- **APIs**: REST/HTTP
- **Ferramentas**: Git/GitHub, Swagger/OpenAPI, Postman/Insomnia, Draw.io

## Cronograma para Etapa 2 (N708)
| Fase | Atividades | Data prevista |
|------|------------|---------------|
| 1. Iniciação | Revisão do planejamento, alinhamento com orientador | 2025-10-06 |
| 2. Planejamento detalhado | Refinamento de requisitos, modelagem final de dados e APIs | 2025-10-13 |
| 3. Execução – Parte 1 | CRUD de usuários e serviços | 2025-10-27 |
| 4. Execução – Parte 2 | Busca/filtros e fluxo de solicitações | 2025-11-10 |
| 5. Integrações | Integração externa (notificação, geolocalização) | 2025-11-17 |
| 6. Testes | Testes unitários de endpoints + validação de usabilidade | 2025-12-01 |
| 7. Encerramento | Validação final, ajustes, entrega | 2025-12-15 |

## Integrantes da equipe e papéis
- **Francisco Riomar Barros Filho** – Product Owner, UX/UI
- **Francisco Augusto de Oliveira Filho** – Dev Frontend
- **Lucas Pires Albuquerque** – Dev Frontend
- **Cezarnildo Moreira da Silva** – Dev Backend
- **José Claudecir Silva de Lima** – QA (Qualidade e Testes)
- **Francisco Rodrigues de Oliveira Lima** – Responsável pela Documentação

> Documento alinhado à disciplina **N705 – Projeto Aplicado Multiplataforma Etapa 1** e integrado com a **N703 – Técnicas de Integração de Sistemas**.
