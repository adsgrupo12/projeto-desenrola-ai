# Arquitetura – Desenrola Ai

> Documento alinhado ao **README.md** (stack Vercel + Back4App/Parse + Leaflet + APIs externas) e coerente com **requirements.md** (RF/RNF incluindo ViaCEP, geocoding, proxy, cache) e **database_model.md** (campos de endereco e coordenadas).

---

## 1. Objetivo
Descrever a arquitetura logica e de integracao do **Desenrola Ai**, cobrindo camadas, componentes, fluxos principais e atributos de qualidade. Este documento serve como guia para implementacao, testes e manutencao.

---

## 2. Visao Geral (Contexto)

```mermaid
flowchart TD
  U[Usuario] -->|Web| FE[Frontend Vercel Leaflet]
  FE -->|REST API Parse| BE[Back4App Parse Server]
  BE --> DB[(NoSQL Back4App)]
  BE -->|CEP| VIA[API ViaCEP]
  BE -->|Geocoding| GEO[API Nominatim ou Mapbox]
  FE -->|Map Tiles| TILES[OSM Tiles ou Mapbox Tiles]
```

**Notas de contexto**
- O **Frontend** (Vercel) usa **Leaflet** para mapa e consome **apenas** a API do backend.
- O **Backend** (Parse Server) concentra integracoes externas: **ViaCEP** (CEP→endereco) e **Geocoding** (endereco→lat/lng).
- **Tiles** do mapa (OSM/Mapbox) sao consumidos diretamente no frontend para renderizacao do Leaflet.

---

## 3. Componentes e Responsabilidades

### 3.1 Frontend (Vercel)
- **UI Web** (HTML, CSS, JS, Bootstrap) e **Leaflet** para mapa.
- Formularios de cadastro/login, listagem e detalhamento de servicos e solicitacoes.
- Chama **somente** a API do backend (evita depender de CORS externos).

### 3.2 Backend (Back4App Parse Server)
- **Resources** para usuarios, servicos e solicitacoes (CRUD).
- **Cloud Code** (JS) para regras de negocio, validacao e orquestracao.
- **ExternalCtrl (proxy)**: funcoes/rotas para **ViaCEP** e **Geocoding** (timeout, tratamento de erro, cache).
- **Autenticacao** e controle de acesso por papel (cliente/prestador).

### 3.3 Banco de Dados (NoSQL Back4App)
- Armazena entidades: **USUARIO**, **CATEGORIA**, **SERVICO**, **SOLICITACAO**.
- Campos de **endereco** e **coordenadas** (lat/lng) nas entidades **SERVICO** e **SOLICITACAO**.
- Indices sugeridos: por `email`, `prestador_id`, `categoria_id`, `cidade, uf`, `status`.

### 3.4 APIs Externas
- **ViaCEP**: consulta CEP → endereco normalizado.
- **Geocoding** (Nominatim/Mapbox): endereco → latitude/longitude.
- **Tiles** (OSM/Mapbox): renderizacao de mapa no frontend.

---

## 4. Diagramas de Componentes (alto nivel)

```mermaid
flowchart TB
  subgraph Frontend
    UI[App Web Bootstrap]
    MAP[Leaflet Map]
  end
  subgraph Backend
    AUTH[Auth]
    SRV[Services]
    REQ[Requests]
    EXT[ExternalCtrl Proxy]
    CC[Cloud Code]
  end
  subgraph Data
    DB[(NoSQL Back4App)]
  end
  subgraph ExternalAPIs
    VIACEP[ViaCEP]
    GEOCODE[Nominatim ou Mapbox]
    TILES[OSM ou Mapbox Tiles]
  end

  UI --> AUTH
  UI --> SRV
  UI --> REQ
  UI --> MAP

  AUTH --> DB
  SRV --> DB
  REQ --> DB

  SRV --> EXT
  EXT --> VIACEP
  EXT --> GEOCODE

  MAP --> TILES
```

---

## 5. Fluxos Principais (sequencia)

### 5.1 Buscar endereco por CEP (cliente)
```mermaid
sequenceDiagram
  participant C as Client
  participant FE as Frontend
  participant BE as Backend
  participant VIA as ViaCEP
  C->>FE: Digita CEP
  FE->>BE: GET /external/viacep/:cep
  BE->>VIA: GET viacep.com.br/ws/{cep}/json
  VIA-->>BE: endereco normalizado
  BE-->>FE: endereco (logradouro/bairro/cidade/uf)
```

### 5.2 Geocodificar e exibir no mapa
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant BE as Backend
  participant GEO as Geocoding
  FE->>BE: GET /external/geocode?endereco=...
  BE->>GEO: GET search?q=...
  GEO-->>BE: {lat, lng, precision}
  BE-->>FE: {lat, lng, precision}
  FE->>FE: Render Leaflet (marker/zoom)
```

### 5.3 Criar solicitacao de servico
```mermaid
sequenceDiagram
  participant FE as Frontend
  participant BE as Backend
  participant DB as Database
  FE->>BE: POST /requests { dados + cep/endereco }
  BE->>BE: ViaCEP + Geocoding (se necessario)
  BE->>DB: Persistir { endereco, lat, lng, precision }
  DB-->>BE: ok
  BE-->>FE: 201 Created
```

> Os endpoints sao representativos; a implementacao pode usar **Cloud Functions Parse** ou rotas expostas via **Express** acoplado ao Parse Server.

---

## 6. Padroes e Decisoes
- **REST + JSON** para comunicacao FE↔BE.
- **Proxy no backend** para chamadas externas (evita CORS e concentra politicas).
- **Cache em memoria** para CEP e geocoding (ex.: 15 min) + **timeout** (ex.: 5s).
- **Tratamento uniforme de erros** (400, 401, 403, 404, 429, 502, 504, 500).
- **Postman** para collections e testes de API.

---

## 7. Atributos de Qualidade (alinhamento com RNF)
- **Usabilidade**: UI responsiva e simples.
- **Compatibilidade**: suporte a dispositivos de baixo custo.
- **Seguranca**: criptografia de senhas, controle de acesso por papel, proxy no backend para externas.
- **Desempenho**: respostas ate ~2s em uso comum; cache de CEP/geocoding; indices no banco.
- **Observabilidade**: logs de auditoria (login/CRUD) e de integracoes externas (endpoint, latencia, status).
- **LGPD**: tratar endereco/lat/lng como dado pessoal; mascarar nos logs; acesso restrito.
- **Conformidade**: politica de privacidade (futuro).

---

## 8. Implantacao e Ambientes
- **Frontend**: Vercel (build e deploy automaticos a partir do GitHub).
- **Backend**: Back4App (Parse Server) com **Cloud Code**; funcoes para integracoes externas.
- **Banco**: NoSQL (Back4App).
- **Ferramentas**: Postman (tests/docs), VS Code, GitHub.

---

## 9. Riscos e Mitigacoes
- **Limites de taxa** das APIs externas → cache + backoff + monitorar 429.
- **Precisao de geocoding** variavel → campo `geocode_precision` e ajuste manual de marcador no Leaflet.
- **Disponibilidade de tiles** → fallback para outro provedor (Mapbox/OSM).

---

## 10. Rastreabilidade
- Requisitos funcionais **RF11–RF14** (CEP, geocoding, mapa, revalidacao) mapeados nos fluxos 5.1–5.3.
- Campos de endereco e coordenadas definidos em **SERVICO** e **SOLICITACAO**.
