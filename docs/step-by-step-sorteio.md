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

