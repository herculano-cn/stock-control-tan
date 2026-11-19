# StockControl

Sistema web para controle de estoque. Cadastre produtos, acompanhe saldos e alertas, registre movimentações e consulte o histórico de inventário.

## Requisitos

- Node.js **22.12.0 ou superior**. No `package-lock.json`, `better-sqlite3` 13.0.3 declara Node.js `>=22`, o Vite aceita `^20.19.0 || >=22.12.0`, e os pacotes TanStack Start requerem `>=22.12.0`; o mínimo comum é 22.12.0.
- npm para instalar as dependências conforme o lockfile disponível.
- Um ambiente compatível com o módulo nativo `better-sqlite3`. Se não houver binário compatível com a plataforma, poderá ser necessário compilar o módulo nativo.

## Instalar dependências

Na raiz do projeto:

```bash
npm install --package-lock=false
```

O repositório contém `package-lock.json`, mas ele não inclui Vitest, declarado em `package.json`, e não há `pnpm-lock.yaml`. Por isso, a instalação reproduzível ainda está pendente: `npm ci` pode falhar e o comando acima evita modificar o lockfile, mas resolve as dependências sem reproduzi-las integralmente. O projeto configura `pnpm.onlyBuiltDependencies`, porém essa configuração não equivale a um lockfile. Para usar os comandos `pnpm` abaixo, pnpm deve estar instalado e as dependências necessárias presentes.

Não há variáveis de ambiente obrigatórias documentadas para desenvolvimento. O servidor SQLite cria automaticamente `data/stock.db` no diretório atual quando a API é usada.

## Rodar a aplicação

### Desenvolvimento

```bash
npm run dev
```

Esse script executa `vite dev --port 3001`. Abra `http://localhost:3001` no navegador. O plugin `stockApiPlugin()` registrado em `vite.config.ts` fornece a API de estoque no servidor de desenvolvimento.

### Build e preview

Gere a build:

```bash
npm run build
```

Para servir a build usando o preview do Vite:

```bash
npm run preview
```

O preview usa `vite preview` e também registra a API interna pelo plugin. É uma forma de pré-visualizar a build, distinta do servidor Express iniciado pelo script `start`.

### Início pelo servidor Express

Depois de gerar a build com `npm run build`, execute:

```bash
npm start
```

O script chama `node server.js`, que serve `dist/client` e monta as rotas Express da API. O servidor usa `PORT` se essa variável estiver definida; caso contrário, escuta na porta `3001`. A disponibilidade de uma configuração de implantação além desse servidor não está documentada neste repositório.

## Rodar os testes

O script `test` do `package.json` executa `vitest run`. O comando solicitado para rodar a suíte é:

```bash
pnpm test
```

O repositório não inclui `pnpm-lock.yaml`; portanto, esse comando executa o script configurado, mas não fixa por lockfile a resolução das dependências. Como alternativa, se Vitest foi instalado no projeto usando npm:

```bash
npm test
```

O teste `src/server/db.test.ts` verifica transações de estoque: entrada, saída, rejeição de saída acima do saldo sem alterar o estoque, saída que zera o saldo e ajuste para a quantidade contada. Os testes usam SQLite em diretório temporário e precisam carregar o módulo nativo `better-sqlite3`.

Quando Vitest termina com sucesso, o processo retorna código de saída zero e não reporta testes falhos. Em caso de falha, verifique as asserções e o erro apresentado no terminal; erro ao carregar `better-sqlite3` indica que o módulo nativo não está disponível ou compatível com o ambiente. Os testes não foram executados ao preparar este README.

## Scripts disponíveis

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor Vite de desenvolvimento na porta `3001`. |
| `npm run build` | Gera a build com Vite. |
| `npm run preview` | Serve a build usando Vite Preview. |
| `npm start` | Executa `node server.js` para servir a build e a API Express. |
| `pnpm test` | Executa `vitest run` por meio do script `test`. |
