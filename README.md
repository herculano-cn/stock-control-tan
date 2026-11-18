# StockControl

Aplicação web para controle de estoque: permite manter um catálogo de produtos, acompanhar níveis e valores de estoque e registrar operações auditáveis de entrada, saída e ajuste.

## Funcionalidades

- Cadastro, edição e exclusão de produtos, com descrição, categoria, preço, quantidade e estoque mínimo.
- Busca por produto, descrição ou categoria e filtros por categoria e situação do estoque.
- Painel com totais de produtos e unidades, valoração por preço unitário e alertas de estoque baixo ou esgotado.
- Registro de entradas, saídas e ajustes de saldo. Saídas superiores ao saldo disponível são rejeitadas.
- Balanço físico e histórico de movimentações com horário, saldo anterior e novo e justificativa.
- Persistência em SQLite no backend e dados de exemplo iniciais; a interface também possui fallback local quando a API não está disponível.

## Stack

- TanStack Start e TanStack Router, com rotas baseadas em arquivos.
- React 19 e TypeScript.
- Vite e Tailwind CSS 4.
- Express e SQLite via `better-sqlite3`.
- Vitest para testes.

## Pré-requisitos

- Node.js 22.12.0 ou superior (ou 23.5.0 ou superior): o `better-sqlite3` registrado no lockfile requer Node.js `>=22`, e o Vite registrado requer `^20.19.0 || >=22.12.0`. Considerando ambas as dependências, Node.js 22 precisa ser ao menos 22.12.0.
- Um ambiente compatível com o módulo nativo do `better-sqlite3`. Se não houver um binário compatível disponível para a plataforma, a instalação pode depender de ferramentas de compilação nativa; os requisitos específicos variam por sistema e não estão fixados neste repositório.
- npm para usar o comando de instalação mostrado abaixo. O clone contém `package-lock.json` (lockfile v3), mas não contém `pnpm-lock.yaml`. Além disso, o lockfile npm não lista Vitest, embora `package.json` o declare. Portanto, o lockfile está dessincronizado e a instalação reproduzível ainda está pendente; `npm ci` pode falhar. Embora `package.json` configure `pnpm.onlyBuiltDependencies`, isso não fixa versões pelo pnpm nem constitui lockfile. Os comandos `pnpm` abaixo pressupõem que pnpm esteja instalado.

## Instalação

Na raiz do repositório, instale as dependências:

```bash
npm install --package-lock=false
```

Essa opção evita gravar alterações em `package-lock.json`, mas como o clone não tem lockfile sincronizado com todas as dependências declaradas, a instalação resolve versões sem a reprodução garantida pelo lockfile. Um fluxo de instalação reproduzível por npm ou pnpm permanece pendente.

Não há configuração de ambiente obrigatória documentada no repositório para iniciar a aplicação localmente. O armazenamento SQLite é criado em `data/stock.db` relativo ao diretório atual quando a API é usada; o diretório e o banco são criados automaticamente e estão ignorados pelo Git.

## Execução local

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O script inicia `vite dev --port 3001`. A API interna do plugin Vite fica disponível no modo de desenvolvimento. O plugin implementa os endpoints `/api/products`, `/api/movements`, `/api/summary` e `/api/reset-seed` também no servidor de preview.

Rotas da aplicação:

- `/` — painel geral.
- `/inventory` — balanço, operações de estoque e histórico.
- `/products` — catálogo, busca e filtros.
- `/products/new` — cadastro.
- `/products/$id/edit` — edição do produto identificado por `id`.
- `/about` — sobre o sistema.

## Build e execução

Gere a build de produção:

```bash
npm run build
```

Para inspecionar a build com o servidor de preview do Vite:

```bash
npm run preview
```

`preview` executa `vite preview`; o plugin interno também registra a API nesse servidor. Esse comando serve para pré-visualizar a build e não inicia o servidor Express independente descrito abaixo.

Para iniciar a aplicação pelo servidor Express:

```bash
npm start
```

Esse script executa `node server.js`, que serve os arquivos de `dist/client` e monta a API Express. Execute `npm run build` antes de `npm start`, pois o servidor Express espera a saída em `dist/client`. O servidor usa a variável opcional `PORT` quando definida e, caso contrário, a porta `3001`. A confirmação do processo de build seguido pelo servidor em um ambiente de produção real não foi feita neste documento; deployment e configuração de infraestrutura permanecem pendentes.

## Testes

O script de testes é `vitest run`. Para executar o comando solicitado pelo projeto:

```bash
pnpm test
```

Esse comando usa pnpm para chamar o script `test` declarado no `package.json` e executa Vitest em modo não interativo. O teste existente em `src/server/db.test.ts` cobre transações de movimentação: saída que reduz o saldo, rejeição de saída acima do saldo sem alteração do estoque, saída que zera o saldo, entrada e ajuste para a quantidade contada. Os testes usam SQLite e um diretório temporário. A instalação precisa conseguir carregar `better-sqlite3` para que os testes que importam o banco executem.

O clone não inclui `pnpm-lock.yaml`; assim, `pnpm test` é documentado por ser o comando requerido e pelo script disponível, mas as versões de dependências não são reproduzidas por um lockfile pnpm. Se as dependências (incluindo Vitest) foram instaladas por npm, o comando equivalente pelo script é:

```bash
npm test
```

Sucesso significa que o Vitest terminou sem testes falhando; falhas mostram os casos e erros a investigar. Os testes não foram executados durante a preparação desta documentação.

## Scripts disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia Vite em modo de desenvolvimento na porta `3001`. |
| `npm run generate-routes` | Executa `tsr generate` para gerar a árvore de rotas. |
| `npm run build` | Gera a build com Vite. |
| `npm run preview` | Inicia o preview da build com Vite. |
| `npm start` | Executa `server.js` para servir `dist/client` e a API Express. |
| `pnpm test` | Chama o script `test` (`vitest run`) com pnpm. Também disponível como `npm test`. |
