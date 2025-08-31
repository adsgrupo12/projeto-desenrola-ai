# Desenrola Aí – Uma plataforma que conecta profissionais e clientes

Plataforma multiplataforma que conecta prestadores de pequenos serviços (jardinagem, aulas, consertos etc.) a clientes, com foco em impacto social local.

## Problema abordado e justificativa
Com base em observações diretas e conversas com trabalhadores informais e prestadores de serviços na região de Fortaleza, verificou-se que uma parcela significativa da população recorre ao trabalho informal e enfrenta desafios para a divulgação do seu trabalho. Muitos moradores possuem habilidades em pequenos serviços (jardinagem, consertos, aulas particulares etc.), mas, apesar de utilizarem redes sociais como o Instagram para divulgação, não contam com um sistema que ofereça maior segurança e avaliação por parte de outros usuários. Isso se traduz em incertezas tanto para os prestadores de serviços — que buscam um canal confiável para ofertar seus serviços — quanto para os potenciais clientes, que necessitam de uma plataforma ágil e segura para encontrar, avaliar e contratar prestadores confiáveis.

Diante disso, pensou-se em construir uma plataforma que conecte prestadores de pequenos serviços e clientes, facilitando a busca, solicitação e contratação de serviços locais.


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
flowchart LR
  U[Usuario] --> W[Frontend Web]
  W --> API[API REST]
  API --> DB[(Database)]
  API --> EXT[Servico Externo de Notificacao]


## Tecnologias propostas
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Protótipos Mobile**: Figma
- **Backend**: Node.js/Express
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
- **Francisco Riomar Barros Filho** – Product Owner, UX/UI, Responsável pela documentação
- **Francisco Augusto de Oliveira Filho** – QA (Qualidade e Testes)
- **Lucas Pires Albuquerque** – Dev Frontend
- **Cezarnildo Moreira da Silva** – Dev Front-end
- **José Claudecir Silva de Lima** – Dev Back-end
- **Francisco Rodrigues de Oliveira Lima** – Dev Back-end

> Documento alinhado à disciplina **N705 – Projeto Aplicado Multiplataforma Etapa 1** e integrado com a **N703 – Técnicas de Integração de Sistemas**.
