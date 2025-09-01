# Requisitos – Desenrola Aí

## 1. Visão geral
Plataforma que conecta prestadores de serviços locais e clientes, com ênfase no **ODS 11** e correlações com **ODS 8** e **ODS 10**.

## 2. Perfis de usuários
- **Visitante**: navega por serviços públicos.
- **Cliente**: busca/filtra, solicita contratação.
- **Prestador**: cadastra e gerencia serviços, responde solicitações.
- **Admin** (futuro): modera conteúdo e usuários.

## 3. Requisitos Funcionais (RF)
- **RF01**: Registrar usuário (cliente ou prestador) com nome, e-mail, telefone e senha.
- **RF02**: Autenticar usuário (login/logout) e gerenciar sessão.
- **RF03**: Cadastrar serviço com título, descrição, categoria e preço/condições.
- **RF04**: Listar serviços com informações mínimas (título, categoria, valor, ofertante).
- **RF05**: Filtrar serviços por categoria e/ou palavra-chave.
- **RF06**: Editar e excluir serviços (somente o ofertante).
- **RF07**: Solicitar contratação a partir da visualização de um serviço.
- **RF08**: Ofertante aprova/recusa solicitações.
- **RF09**: Registrar status de contratação (ex.: Em negociação, Confirmado).
- **RF10 (Opcional)**: Mensagens entre cliente e ofertante dentro da plataforma.
- **RF11**: Buscar endereço por CEP (ViaCEP): ao digitar CEP, sistema preenche logradouro/bairro/cidade/UF.
- **RF12**: Geocodificar endereço: backend converte endereço em lat/lng via API externa e salva.
- **RF13**: Exibir no mapa (Leaflet): mostrar marcador no local do serviço; permitir ajustar posição manualmente (drag).
- **RF14**: Revalidação: ao alterar CEP/endereço, refazer consulta ViaCEP + geocoding.

## 4. Requisitos Não Funcionais (RNF)
- **RNF01 – Usabilidade**: interface simples e responsiva.
- **RNF02 – Compatibilidade**: suportar celulares de baixo custo.
- **RNF03 – Segurança**: criptografia de senhas; controle de acesso por papel; proteção básica a injeção e XSS.
- **RNF04 – Desempenho**: resposta de até 2s em conexões normais.
- **RNF05 – Observabilidade**: logs mínimos de auditoria (login, criação/edição de serviços).
- **RNF06 – Conformidade**: LGPD – consentimento e política de privacidade (futuro).
- **RNF07**: Proxy e segurança: consumir ViaCEP e Geocoding via backend com timeout, tratamento de erro e logs.
- **RNF08**: Rate limit/cache: cache em memória (ex.: 15 min) para CEP e geocoding; respeitar limites das APIs.
- **RNF09**: LGPD: tratar endereço/lat/lng como dado pessoal; restringir acesso por papéis; mascarar nos logs.
- **RNF10** – Observabilidade: log de latência/status das chamadas externas.

## 5. Regras de Negócio (RN)
- **RN01**: Um serviço pertence a um único prestador.
- **RN02**: Apenas o prestador pode editar/excluir seus serviços.
- **RN03**: Uma solicitação sempre possui um status válido (Pendente, Em negociação, Confirmado, Recusado).
- **RN04**: Telefones/e-mails devem ser válidos e únicos por usuário.
- **RN05**: Histórico de mudanças de status deve ser registrado (auditoria).

## 6. Histórias de usuário (exemplos)
- **US01 (Cliente)**: Como cliente, quero filtrar serviços por categoria para encontrar rapidamente quem me atenda.
- **US02 (Prestador)**: Como prestador, quero cadastrar meus serviços para ser encontrado por novos clientes.
- **US03 (Prestador)**: Como prestador, quero aprovar/recusar solicitações para organizar meus atendimentos.
- **US04 (Cliente)**: Como cliente, quero solicitar a contratação dentro da plataforma para registrar o acordo.
- **US05 (CLiente)**: “Como cliente, ao digitar meu CEP, quero ver o endereço preenchido automaticamente.”
- **US06 (Prestador)**: Como prestador, quero ver o mapa com o ponto onde realizarei o serviço.

## 7. Critérios de aceitação (amostras)
- **CA01**: Dado um prestador autenticado, quando cadastrar um serviço válido, então o serviço fica visível na listagem.
- **CA02**: Dado um cliente autenticado, quando solicitar contratação, então o ofertante vê a solicitação na caixa de pendências.
- **CA03**: Dado um ofertante, quando aprovar/recusar, então o status da solicitação é atualizado.

## 8. Rastreabilidade ODS
- **ODS 11**: promove economias locais, reduz deslocamentos e melhora acesso a serviços urbanos.
- **ODS 8/10**: geração de renda e inclusão produtiva; redução de desigualdades de acesso.

_Atualizado em 2025-08-31_
