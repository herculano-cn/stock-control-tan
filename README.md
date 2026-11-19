# StockControl

Aplicação de controle de estoque construída com React, TanStack Start, Vite e SQLite (`better-sqlite3`). Este guia descreve como preparar o ambiente, executar a aplicação e rodar os testes a partir da raiz do repositório.

## Pré-requisitos

- Node.js **22 ou superior**. O `better-sqlite3` 13.0.3 registrado no `package-lock.json` declara `node >=22`; Vite 8 requer Node.js 22.12 ou superior na linha 22 (ou 20.19+, incompatível com o requisito do `better-sqlite3`).
- Um gerenciador de pacotes Node.js. O repositório contém `package-lock.json`, mas não contém `pnpm-lock.yaml` nem declara uma versão em `packageManager`.
- Para compilar o `better-sqlite3` nativo, pode ser necessário ter Python, `make` e um compilador C/C++ instalados, caso não exista um binário pré-compilado compatível com o sistema e a versão de Node.js.

## Instalação e observação sobre lockfiles

O lockfile disponível é `package-lock.json`, então a instalação com npm é:

```bash
npm install
```

Há uma divergência no estado atual do repositório: `package.json` declara Vitest e o script de teste depende dele, mas `package-lock.json` não registra o pacote `vitest`. Por isso, `npm install` precisa reconciliar o lockfile com `package.json` e pode alterá-lo. Não use `npm ci` esperando uma instalação reproduzível enquanto essa divergência persistir: `npm ci` exige que o lockfile corresponda ao manifesto.

Também é possível usar pnpm, mas não há `pnpm-lock.yaml` no repositório; `pnpm install` resolverá as dependências sem um lockfile versionado e não produzirá uma instalação travada às versões do lock npm. Não misture gerenciadores na mesma instalação. Para manter a instalação baseada no lockfile presente, use npm.

## Executar em desenvolvimento

Na raiz do projeto, inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra <http://localhost:3001>. A porta 3001 é definida pelo script `dev` em `package.json`.

## Build e execução

Gere a versão de produção com:

```bash
npm run build
```

O script `preview` inicia a prévia do build do Vite:

```bash
npm run preview
```

Por padrão, a prévia do Vite fica em <http://localhost:4173> (a porta pode ser incrementada se já estiver ocupada). Ela é uma prévia do build do Vite; o servidor Express definido em `server.js` é iniciado separadamente pelo comando abaixo.

Para executar o servidor Express de produção, primeiro faça o build e depois rode:

```bash
npm run start
```

O servidor atende em <http://localhost:3001> por padrão. `server.js` serve os arquivos de `dist/client` gerados pelo build e disponibiliza a API em `/api`. A porta pode ser alterada pela variável `PORT` do processo; sem ela, o padrão é 3001. Encerre o servidor com `Ctrl+C`.

## Testes

O script `test` executa toda a suíte uma vez com Vitest (`vitest run`). Com as dependências instaladas, rode:

```bash
pnpm test
```

Escolha um gerenciador e use-o tanto para instalar quanto para testar; não misture instalações npm e pnpm. Para seguir literalmente o comando `pnpm test`, instale primeiro com pnpm (Corepack pode habilitá-lo com `corepack enable pnpm`):

```bash
pnpm install
pnpm test
```

Como não há `pnpm-lock.yaml`, `pnpm install` não usa versões travadas pelo repositório. Se preferir npm, use `npm install` e rode o teste com o mesmo gerenciador:

```bash
npm test
```

A instalação npm também precisa reconciliar a ausência de Vitest no `package-lock.json`, conforme descrito acima. A suíte existente em `src/server/db.test.ts` verifica cinco casos de movimentação de estoque usando SQLite temporário. Não requer serviço externo ou configuração de ambiente adicional. Vitest informa os testes aprovados/falhos e retorna código de saída diferente de zero quando há falha; uma execução concluída sem falhas indica que a suíte passou.

## Scripts disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Servidor Vite de desenvolvimento na porta 3001 |
| `npm run build` | Build de produção do Vite/TanStack Start |
| `npm run preview` | Prévia local do build do Vite |
| `npm run start` | Servidor Express de produção (`server.js`), após o build |
| `npm test` / `pnpm test` | Suíte completa do Vitest, executada uma vez |
