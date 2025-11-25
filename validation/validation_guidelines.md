# Validacao com Publico-Alvo – Guia para a equipe

## Objetivo
Executar validacao com usuarios finais seguindo os requisitos de entrega (feedback, evidencias, ajustes e registro em repositório).

## O que precisa ser produzido no repositório
- `validation/validation_report.md`: relato detalhado das sessoes de validacao.
- `validation/target_audience.md`: definicao do publico-alvo (perfil, contexto, localizacao).
- `validation/evidence/`: fotos ou videos com autorizacao (ou referencias para arquivos pesados).
- `validation/feedback/`: registros estruturados de feedback (planilha ou MD).
- `README.md`: breve resumo da validacao realizada, com links para os arquivos acima.

## Preparacao antes dos testes
1. Confirmar ambiente de testes:
   - Frontend: https://desenrola-front-testes-feyzrma06-riomars-projects.vercel.app
   - Backend: https://desenrola-ai-teste.onrender.com
2. Definir publico-alvo e registrar em `validation/target_audience.md`:
   - Nome ou alias, localizacao, contexto (cliente/prestador), justificativa.
3. Preparar roteiro simples (tarefa a tarefa) para o participante:
   - Cadastro (cliente e/ou prestador), login, cadastrar servico (prestador), solicitar contratacao (cliente), aprovar/recusar/cancelar (prestador), ver minhas solicitacoes, editar perfil.

## Durante as sessoes
1. Apresentar rapidamente o objetivo e pedir autorizacao para coletar evidencias (foto/video ou prints).
2. Pedir que o participante execute os fluxos definidos, pensando em voz alta.
3. Registrar:
   - Passo a passo feito.
   - Resultado obtido (sucesso/erro).
   - Observacoes de usabilidade/dificuldade.
   - Evidencias (foto/video/print), se autorizado.

## Depos das sessoes
1. Preencher `validation/validation_report.md` com:
   - Data, participantes, cenarios testados, resultados, principais achados.
2. Salvar evidencias em `validation/evidence/` (ou link externo, com referencia no repo).
3. Salvar feedbacks brutos em `validation/feedback/` (ex.: `feedback-participante-01.md` ou planilha).
4. Se ajustes forem feitos com base no feedback, anotar no final do `validation_report.md`.
5. Adicionar no `README.md` um resumo: publico-alvo, data, principais achados e link para o `validation_report.md`.

## Checklist rapido
- [ ] Publico-alvo documentado (`validation/target_audience.md`).
- [ ] Roteiro de testes preparado.
- [ ] Evidencias coletadas (com autorizacao) e guardadas em `validation/evidence/`.
- [ ] Feedback detalhado em `validation/feedback/`.
- [ ] Relatorio consolidado em `validation/validation_report.md`.
- [ ] Resumo da validacao no `README.md`.
