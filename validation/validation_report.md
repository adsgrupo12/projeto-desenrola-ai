# 📝 Relatório de Validação com o Público-Alvo

Descreva contato, feedbacks, ajustes e evidências.

## 1. Detalhes da Sessão

| Detalhe | Prestadora (Germana) |
| :--- | :--- |
| **Data** | 25/11/2025 |
| **Participante** | Germana Sara Babá |
| **Cenários Testados** | Cadastro, Login, Cadastrar Serviço (Babá), Editar Perfil (Endereço), Ver Minhas Solicitações (Recebidas/Enviadas). |
| **Ambiente** | https://desenrola-front-testes-feyzrma06-riomars-projects.vercel.app |

## 2. Principais Achados e Observações

### 2.1. Germana (Prestadora - Babá)

* **Fluxo Testado:** Cadastro e Login -> Cadastrar Novo Serviço ('Babá por hora') -> Editar Endereço no Perfil -> Verificar Solicitações.
* **Resultado:** Sucesso em todos os fluxos. Germana conseguiu se cadastrar como Prestadora e cadastrar seu serviço.
* **Observações/Dificuldades:**
    * **Dificuldade (Descrição do Serviço):** O campo `descricao` é considerado muito curto para um serviço que exige detalhes sobre experiência, idade das crianças que atende e qualificações. A participante sentiu falta de um campo maior para transmitir confiança.
    * **Funcionalidade Faltante (Localização):** Como o foco de Germana é local, ela procurou por uma forma de **definir seu raio de atendimento** ou especificar os bairros que cobre, o que é um item no Backlog (Geolocalização Avançada).
    * **Usabilidade (Navegação):** Levou tempo para encontrar a opção de **cadastro de serviço** (estava no menu do perfil).

## 3. Ajustes e Próximos Passos (Action Items)

| ID | Ajuste Sugerido | Categoria | Status |
| :--- | :--- | :--- | :--- |
| **A-1** | Transformar o campo `descricao` do Serviço em um `textarea` (múltiplas linhas) para permitir descrições profissionais mais detalhadas. | Funcional | Pendente |
| **A-2** | Tornar o botão "Cadastrar Serviço" mais visível no *dashboard* principal do Prestador para melhorar a usabilidade e acesso rápido. | Usabilidade | Pendente |
| **A-3** | **Priorizar** o item no Backlog de **Geolocalização Avançada** (raio de atendimento) para atender à necessidade de Prestadores Locais como Germana. | Backlog | Priorizado |
