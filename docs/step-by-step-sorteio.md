## Passo a passo - Sorteio da Pelada

### 1. Configuração do projeto

- Criado `package.json` com Next.js 14 (App Router), React, TypeScript, Tailwind CSS e `lucide-react`.
- Adicionados arquivos de configuração: `next.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `tailwind.config.ts` e `postcss.config.mjs`.
- Criado `src/app/layout.tsx` e `src/app/globals.css` para estrutura base e tema visual do app.

### 2. Organização de pastas

- `src/types/sorteio.ts`: definição dos tipos principais (`Jogador`, `Posicao`, `JogadorEscalado`, `Time`, `Formacao`, `ResultadoSorteio`).
- `src/data/jogadoresBase.ts`: lista fixa de jogadores utilizada como mock inicial.
- `src/lib/formacoes.ts`: definição das formações prioritárias e utilitário para escolher a melhor formação com base na contagem de posições.
- `src/lib/storage.ts`: utilitários para persistência em `localStorage` (seleção de jogadores e último resultado).
- `src/lib/sorteioAlgoritmo.ts`: algoritmo de sorteio balanceado e geração de texto para compartilhamento (núcleo da lógica de negócios).
- `src/components/sorteio/*`: componentes de UI específicos da funcionalidade de sorteio.
- `src/app/sorteio/page.tsx`: página principal da funcionalidade, com orquestração de estado e composição dos componentes.

### 3. Lógica do algoritmo de sorteio

- Função principal: `sortearTimesEquilibrados` em `src/lib/sorteioAlgoritmo.ts`.
- Estratégia:
  - Garante que haja pelo menos 10 jogadores selecionados e que a quantidade seja múltipla de 5.
  - Calcula automaticamente a quantidade de times (grupos de 5).
  - Executa múltiplas tentativas de distribuição (220 simulações) com os jogadores embaralhados.
  - Para cada tentativa:
    - Cria estados parciais de times (`TimeParcial`) com contagem de posições e força total.
    - Para cada jogador, avalia para qual time e posição (ZAG, MEI, ATA) sua entrada gera o melhor equilíbrio:
      - Usa `escolherPosicaoParaJogador` para decidir a melhor posição no contexto daquele time, favorecendo:
        - melhor nota do jogador na posição;
        - aproximação da formação ideal `2 ZAG / 1 MEI / 2 ATA`;
        - times ainda incompletos.
      - Simula o impacto dessa escolha em todos os times e calcula um score global.
    - Utiliza `avaliarDistribuicao` para calcular:
      - diferença de força entre o time mais forte e o mais fraco;
      - penalidade de formação (distância entre contagem real de posições e a melhor formação para cada time).
  - Após todas as tentativas, escolhe a distribuição com menor `scoreTotal`, combinando:
    - equilíbrio de força entre os times;
    - aderência às formações prioritárias.
  - Constrói o `ResultadoSorteio` com:
    - times finais (`Time`), com jogadores escalados e posição efetiva usada;
    - formação usada por time (via `melhorFormacaoParaContagem`);
    - diferença de força global.

- Função `gerarTextoCompartilhamento`:
  - Monta o texto em formato amigável para cópia/compartilhamento com a lista de times, jogadores, posição e nota utilizada, além da diferença de força final.

### 4. Interface e UX

- `src/app/sorteio/page.tsx`:
  - Mobile first, com layout que se comporta como app mobile em telas pequenas e dashboard em telas médias/grandes.
  - Usa `localStorage` para:
    - persistir seleção de jogadores;
    - persistir o último sorteio.
  - Gera estado de:
    - jogadores selecionados;
    - resultado atual do sorteio;
    - loading simulado ao processar o sorteio.
  - Calcula:
    - se já é possível sortear (múltiplos de 5, mínimo de 10);
    - mensagem amigável quando não for possível.

- Componentes de UI:
  - `JogadorCard`:
    - Card tocável com nome e badges de ZAG/MEI/ATA.
    - Switch/checkbox estilizado para selecionar participação.
    - Visual confortável para uso no celular.
  - `ResumoPainel`:
    - Mostra visão geral (total, selecionados, times).
    - Exibe formação prioritária e status “pronto ou não para sortear”.
    - Mostra diferença de força do sorteio atual quando existir.
  - `TimesResultado`:
    - Exibe os times sorteados em cards responsivos.
    - Destaca time mais forte e mais fraco.
    - Mostra formação utilizada, força total e posição escolhida de cada jogador.
  - `AcoesSorteio`:
    - Botões “Sortear times”, “Sortear novamente”, “Limpar resultado”, “Resetar tudo”.
    - Loading curto e feedback de desabilitado quando não pode sortear.
    - Botão de copiar/compartilhar com texto formatado.
  - `ComoFunciona`:
    - Bloco explicando, em português, de forma simples como o algoritmo prioriza equilíbrio e formação.

### 5. Responsividade e visual

- Mobile:
  - Layout vertical, com container central arredondado simulando app mobile.
  - Cards com cantos arredondados e sombras suaves.
  - Botões grandes com áreas de toque confortáveis.
  - Cabeçalho fixo/semi-fixo com título e subtítulo.
- Tablet/Desktop:
  - Grid em duas colunas: resumo + lista de jogadores de um lado, ações e resultado de outro.
  - Cards de times mostrados em grid (2 colunas no md, 3 no xl).
  - Aparência de dashboard esportivo limpo.

### 6. Onde está a lógica do algoritmo

- O núcleo do algoritmo de sorteio está em:
  - `src/lib/sorteioAlgoritmo.ts`
    - `sortearTimesEquilibrados` (múltiplas tentativas, score de equilíbrio, penalização por formação).
    - `gerarTextoCompartilhamento` (formatação do texto final para copiar/compartilhar).
  - `src/lib/formacoes.ts`
    - Definição das formações prioritárias.
    - Função `melhorFormacaoParaContagem` para identificar a melhor formação para cada time com base na contagem real de posições.

### 7. Diagnóstico Turso na Vercel (2026-03-26)

- Problema observado:
  - Em produção (Vercel), falhas de conexão/configuração do Turso estavam sendo mascaradas por respostas vazias (`{}` e `[]`) em algumas rotas.
  - Isso dificultava identificar rapidamente se a causa era variável de ambiente ausente ou erro de autenticação/conexão.

- Decisão arquitetural:
  - Manter o Turso como fonte única de persistência para gols e jogadores.
  - Melhorar apenas a camada de adaptação HTTP (`app/api`) para expor erro operacional de forma segura e explícita.
  - Não alterar domínio/regras de negócio.

- Arquivos modificados:
  - `src/app/api/gols/route.ts`
    - GET e POST agora retornam `500` com payload `{ erro, detalhe }` em caso de falha.
    - Adicionado log estruturado para facilitar leitura no Runtime Logs da Vercel.
  - `src/app/api/gols/adicionar/route.ts`
    - POST agora retorna `500` com `{ erro, detalhe }` e log do erro.
  - `src/app/api/gols/remover/route.ts`
    - POST agora retorna `500` com `{ erro, detalhe }` e log do erro.
  - `src/app/api/jogadores/route.ts`
    - GET agora retorna `500` com `{ erro, detalhe }` em vez de lista vazia quando há falha no Turso.

- Resultado esperado:
  - Quando o Turso não estiver configurado corretamente na Vercel, a API exibirá erro explícito, acelerando o diagnóstico.
  - O frontend deixa de receber “falso sucesso” com dados vazios em cenários de erro de infraestrutura.

### 8. Ordenação de Artilharia só após dados do banco (2026-03-26)

- Problema:
  - Ao clicar `+`/`-` para ajustar gols, a lista de `Artilharia` mudava de ordenação antes do Turso confirmar (ordenação baseada em alterações locais).

- Decisão:
  - Separar “gols exibidos (otimistas)” de “gols persistidos (referência para ordenação)”.
  - A ordenação do ranking continua usando apenas `golsPersistidos` até o `Salvar` (API `/api/gols`) retornar os dados do servidor.

- Arquivos modificados:
  - `src/app/gols/page.tsx`:
    - adicionada state `golsPersistidos`;
    - atualizações locais em `gols` não afetam `golsPersistidos`;
    - após `POST /api/gols`, ambos são sincronizados com o retorno do banco.
  - `src/components/gols/Artilharia.tsx`:
    - adicionado prop `golsParaOrdenacao` para usar os gols persistidos na ordenação;
    - ordenação baseada em gols de referência, enquanto a exibição usa gols locais.

### 9. Peladas (quartas-feiras), gols por pelada e destaques (2026-03-26)

- Requisito:
  - Gols passam a ser por **pelada** (cada quarta-feira); uma tabela guarda **data** e **destaques** (Craque, Pereba, Artilheiro, Garçom, Xerifão, Paredão, Bola Murcha).
  - O ranking **geral** exibido em `GET /api/gols` sem query soma gols de **todas** as peladas.

- Modelo no Turso:
  - `peladas`: `data_pelada` (única), colunas opcionais `*_nome` para cada destaque.
  - `gols_pelada`: `pelada_id`, `jogador_id`, `quantidade` (único por par pelada+jogador).
  - Migração: se existir histórico na tabela legada `gols` e não houver peladas, cria-se uma pelada com a data atual e copiam-se os gols para `gols_pelada`.

- Arquivos principais:
  - `src/lib/turso-client.ts`: cliente Turso reutilizável.
  - `src/lib/peladas-db.ts`: schema `peladas` / `gols_pelada`, migração, CRUD de peladas e leitura/gravação de gols por pelada.
  - `src/lib/gols-db.ts`: `ensureSchema` inclui peladas; `lerGolsDb` agrega todas as peladas; novos exports `lerGolsPorPeladaDb`, `salvarGolsPorPeladaDb`, `listarPeladasDb`, etc.
  - `src/types/pelada.ts`: tipos `Pelada`, `DestaquesPelada`.
  - `src/lib/datas-pelada.ts`: fuso `America/Sao_Paulo`, `hojeEmFusoPelada`, `isQuartaEmFusoPelada`; `proximaQuartaFeiraDesde` (migração legada).
  - `src/app/api/peladas/route.ts`, `src/app/api/peladas/[id]/route.ts`: listar peladas (com auto-criação na quarta); GET/PATCH destaques; POST manual desabilitado.
  - `src/app/api/gols/route.ts`: `GET ?peladaId=` por pelada; `POST` com `{ peladaId, gols }`; sem query mantém agregado geral.
  - `src/app/api/gols/adicionar` e `remover`: corpo `{ nome, peladaId }`.
  - `src/app/gols/page.tsx`: visitantes veem pelada de **hoje** (ou a mais recente) em somente leitura; **admin** (login na própria página) escolhe qualquer pelada no select, edita gols e destaques e salva.
  - `src/components/gols/DestaquesPeladaForm.tsx`: edição dos sete destaques com `PATCH /api/peladas/[id]` (requer sessão admin).

### 10. Calendário de quartas 2026 e regra “só quarta” (2026-03-26)

- Regra: pelada só em **quarta-feira** no fuso **`America/Sao_Paulo`** (`isQuartaEmFusoPelada` / `hojeEmFusoPelada`).
- Dados: `src/data/quartas-pelada-2026.ts` — **41 datas** de 25/03/2026 a 30/12/2026.
- `POST /api/peladas/seed`: insere em massa essas datas (`INSERT OR IGNORE`).
- Migração legada de `gols` → primeira pelada usa `proximaQuartaFeiraDesde` em vez de “hoje” UTC.
- UI `/gols`: sem select de pelada nem import na tela; calendário em massa continua disponível via `POST /api/peladas/seed` se necessário.

### 11. Pelada do dia automática (2026-03-26)

- `ensurePeladaHojeSeQuartaComDb`: se **hoje** (em `America/Sao_Paulo`) for quarta, faz `INSERT OR IGNORE` da data em `peladas`.
- Executado em `listarPeladasDb()` antes do `SELECT`; **`GET /api/peladas`** materializa a pelada do dia quando aplicável.
- `POST /api/peladas` retorna **403** (criação manual desabilitada).
- A UI prioriza a pelada cuja `dataPelada` coincide com `hojeEmFusoPelada()`.

### 12. Página Artilharia (`/artilharia`) (2026-03-26)

- Objetivo: ver **ranking geral** (soma de todas as peladas), e por cada data **destaques** + **gols daquela noite**.
- API `GET /api/peladas/resumo`: sem query, lista completa `PeladaComRanking[]` (legado); com `?data=YYYY-MM-DD`, retorna uma pelada com destaques + ranking (uso na UI por data).
- `listarPeladasComRankingComDb` em `peladas-db.ts` agrega `gols_pelada` em uma consulta.
- Navegação: links **Artilharia** na `Sidebar` e no menu mobile.
- `src/app/artilharia/page.tsx`: consumo do resumo + `GET /api/gols` para o bloco “artilharia geral”.

### 13. Admin e login para edição de gols/destaques (2026-04-08)

- Objetivo: só um **administrador** altera gols (por pelada) e destaques; visitantes apenas leem na `/gols`.
- Credenciais: variáveis `ADMIN_USER` (opcional, padrão `admin`), `ADMIN_PASSWORD` (obrigatório em produção), `ADMIN_SESSION_SECRET` (obrigatório em produção para assinar o cookie). Em **desenvolvimento**, se `ADMIN_PASSWORD` estiver vazio, usa-se senha `admin` (e segredo de dev fixo — não usar em produção).
- Sessão: cookie httpOnly `pelada_admin_sess` com payload `{ exp }` assinado em HMAC-SHA256 (`src/lib/admin-session.ts`). Rotas: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`.
- Rotas de escrita protegidas com `requireAdminOr401` (`src/lib/require-admin-api.ts`): `POST /api/gols`, `POST /api/gols/adicionar`, `POST /api/gols/remover`, `POST /api/gols/geral` (artilharia geral via tabela `gols_geral_ajuste`), `PATCH /api/peladas/[id]`, `POST /api/peladas/seed`.
- UI: `src/app/gols/page.tsx` — formulário de login para não admins; após login, select de pelada e botões de edição; `Artilharia` com `somenteLeitura`; `DestaquesPeladaForm` com `podeEditar` e tratamento de 401.
- UI: `src/app/artilharia/page.tsx` — mesma sessão admin; bloco artilharia geral com `Artilharia` editável e `POST /api/gols/geral` (ajuste não altera `gols_pelada`).
- Documentação de env: `.env.example`.

