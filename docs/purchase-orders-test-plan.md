# Ordens de Compra e Reposição Automática - Plano de Testes

Comando: `npm test` (vitest; banco SQLite temporário criado em `os.tmpdir()`). Build: `npx vite build`; tipos: `npx tsc --noEmit`.

## 1. Testes automatizados (implementados em `src/server/db.test.ts`)

| ID | Critério de aceite | Cenário | Nível |
|---|---|---|---|
| T1 | Numeração sequencial, fornecedor, itens, total calculado | Cria 2 pedidos; números consecutivos, `OC-000N`, total = Σ qtd×preço, preço padrão do produto | unitário |
| T2 | Validação | Fornecedor vazio, sem itens, qtd 0/fracionária, produto inexistente → `success=false` | unitário |
| T3 | Recebimento gera ENTRADA e atualiza saldo e valor total | Receber pedido com 2 itens: saldo +qtd, 2 movimentos ENTRADA com previous/new corretos, `totalItems`/`totalValue` do resumo atualizados | unitário |
| T4 | Sem recebimento duplicado | Receber 2×, receber cancelado, cancelar recebido → rejeitado e saldo inalterado | unitário |
| T5 | Estados | RASCUNHO→CONFIRMADA→RECEBIDA; volta a RASCUNHO, status inválido rejeitados; id inexistente → notFound | unitário |
| T6 | Transação única/atômica | Produto do 2º item removido; recebimento falha e o 1º produto, status e movimentos permanecem intactos | unitário |
| T7 | Sugestão > 0 para nível crítico | Produto crítico e esgotado sugeridos com qtd > 0 e custo; produto confortável ausente | unitário |
| T8 | Endpoints / dashboard imediato | Via HTTP real (Express): suggestions, POST 400/201, GET lista/detalhe/404, PUT RECEBIDA 200, `/products/:id` e `/summary` refletem o novo saldo, 2º recebimento 400, status inválido 400, id inexistente 404 | integração |

## 2. Testes manuais (UI)

| ID | Passos | Esperado |
|---|---|---|
| M1 | Abrir `Compras`; ver tabela de sugestões | Mouse, Monitor e Headset (seed) listados com sugerido > 0 |
| M2 | "Usar sugestão no novo pedido", informar fornecedor, Criar | Pedido `OC-0001` em RASCUNHO com total correto |
| M3 | Confirmar, depois Receber | Status RECEBIDA; botões somem; Header "Valor Total" e "Disponível" sobem sem recarregar |
| M4 | Abrir Dashboard e Inventário & Auditoria | Saldos novos e movimentos ENTRADA "Recebimento OC-0001" |
| M5 | Cancelar um rascunho | Status CANCELADA sem botões de ação |
| M6 | Restaurar dados de exemplo (reset) | Pedidos removidos, estoque do seed |

## 3. Casos de borda / regressão

- Dois cliques rápidos em Receber (UI desabilita o botão; o backend também bloqueia via guarda de status).
- Regressão: testes existentes de `recordMovementTransaction` (SAIDA/ENTRADA/AJUSTE) continuam passando.
- Correção associada: IDs de movimento de `insertProduct` agora têm sufixo aleatório (colisão `UNIQUE` quando dois produtos eram criados no mesmo milissegundo).

## 4. Fora do escopo / não coberto

- Testes E2E de navegador (sem Playwright configurado no repositório).
- Concorrência multi-processo real (SQLite serializa escritas; coberto pela guarda de status).

## 5. Resultado da execução

`npm test`: 13 testes passando (5 pré-existentes + 8 novos); `npx tsc --noEmit` limpo; `npx vite build` OK.
