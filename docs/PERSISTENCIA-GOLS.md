# Persistência dos gols (artilharia)

Na **Vercel** o sistema de arquivos é efêmero, então não é possível salvar em `data/gols.json`. O app usa **SQLite na nuvem (Turso)** quando as variáveis de ambiente estão configuradas.

## Comportamento

- **Com Turso configurado** (`TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN`): leitura e gravação dos gols no Turso (SQLite).
- **Sem Turso** (desenvolvimento local): leitura e gravação em `data/gols.json`.

## Configurar na Vercel

1. Crie uma conta e um banco em [Turso](https://turso.tech).
2. No dashboard do Turso, pegue a **URL** do banco e um **Auth Token**.
3. No projeto na Vercel: **Settings → Environment Variables**.
4. Adicione:
   - `TURSO_DATABASE_URL` = URL do banco (ex.: `libsql://seu-db-seu-user.turso.io`)
   - `TURSO_AUTH_TOKEN` = token de autenticação

Após o próximo deploy, a artilharia passará a ser salva no Turso e o erro de salvar no arquivo deixa de ocorrer.

## Desenvolvimento local

Para rodar sem Turso, não defina essas variáveis. O app usará o arquivo `data/gols.json` (crie a pasta `data` se precisar).
