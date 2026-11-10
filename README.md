# PDF

Transforma fotos e imagens em PDF direto no telefone. Sem anúncios, sem conta, sem nuvem: nada sai do aparelho e funciona offline.

É um PWA feito com Svelte 5 + TypeScript, publicado no GitHub Pages:
**https://douglopesdev.github.io/pdf/**

## Status

| Fase                            | O que entrega                                | Situação     |
| ------------------------------- | -------------------------------------------- | ------------ |
| 0 · Fundação                    | Projeto, lint, testes, CI e deploy           | Em andamento |
| 1 · Núcleo de conversão         | Gerador de PDF, EXIF, worker de imagem       | —            |
| 2 · Interface                   | As 6 telas, temas, pt-BR e en                | —            |
| 3 · PWA                         | Offline, instalação, Compartilhar da galeria | —            |
| 4 · Testes nos aparelhos e v1.0 | Testes nos telefones, release                | —            |

## Desenvolvimento

Requer Node 22+ e pnpm 10 (`corepack enable` instala o pnpm na versão certa).

```bash
pnpm install
pnpm dev          # servidor local em http://localhost:5173/pdf/
pnpm verify       # tudo que o CI roda: tipos, lint, formatação, testes, build, tamanho
```

| Comando        | O que faz                                  |
| -------------- | ------------------------------------------ |
| `pnpm dev`     | Servidor de desenvolvimento                |
| `pnpm build`   | Build de produção em `dist/`               |
| `pnpm preview` | Serve o build localmente                   |
| `pnpm check`   | Checagem de tipos (svelte-check)           |
| `pnpm lint`    | ESLint                                     |
| `pnpm format`  | Formata o código com Prettier              |
| `pnpm test`    | Testes de unidade (Vitest)                 |
| `pnpm size`    | Falha se o JS inicial passar de 60 KB gzip |

Para testar no celular na mesma rede: `pnpm dev --host` e abrir o endereço mostrado no terminal.

## Como o código está organizado

```text
src/
├─ app.css            tokens de tema (claro e escuro) e estilos base
├─ App.svelte         raiz: idioma, tema e troca de telas
├─ screens/           uma tela por arquivo
└─ lib/
   ├─ i18n/           pt-BR (padrão) e en; o TypeScript exige as mesmas chaves
   └─ state/          preferências (tema e idioma), o único dado salvo
tests/unit/           Vitest
```

## Princípios

- **Nada sai do aparelho.** Não existe backend. Uma Content Security Policy com `default-src 'self'` faz o navegador bloquear qualquer requisição externa.
- **Nada fica guardado.** Só tema e idioma vão para o `localStorage`. Imagens e PDFs nunca são gravados.
- **Sem dependências de terceiros em tempo de execução.** Fontes servidas pelo próprio app, sem CDN, sem analytics.

## Deploy

Todo push na `main` passa pelo CI e, se estiver verde, é publicado pelo workflow `deploy.yml`. Na primeira vez é preciso ativar em **Settings › Pages › Source: GitHub Actions**.
