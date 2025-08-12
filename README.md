# AgroT — Plataforma IoT para Agricultura Familiar

Plataforma web para gestão inteligente de recursos na agricultura familiar (40 ha), integrando dados de clima, solo/sensores, irrigação e mercado (CONAB). Este repositório contém o front-end React (Vite + TypeScript + Tailwind). A integração de clima será feita depois; prioridade atual é o conector de dados da CONAB.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- React Router, TanStack Query, Zustand
- Axios
- Leaflet (CSS) para mapa/grade futura

## Estrutura
- `src/App.tsx`: layout, navegação e rotas (Principal, Irrigação, Mercado)
- `src/pages/Principal.tsx`: clima (mock) e grade de sensores `FarmGrid`
- `src/pages/Irrigacao.tsx`: modo automático/manual, métricas por cultivo (mock)
- `src/pages/Mercado.tsx`: Produtos 360, preço mínimo, oferta/demanda, custo produção, preços estimados e calculadora de frete (mocks)
- `src/components/FarmGrid.tsx`: grade 10x10 com hover e filtro temperatura/umidade
- `src/config.ts`: placeholders de chaves e URLs

## Pré‑requisitos
- Node.js 18.x (testado com v18.18.0)

## Instalação e execução (desenvolvimento)
1. Instale dependências:
   ```bash
   npm install
   ```
2. (Opcional) Crie um arquivo `.env.local` para chaves (placeholders por enquanto):
   ```bash
   VITE_OPENWEATHER_API_KEY=COLOQUE_SUA_CHAVE
   VITE_INMET_API_KEY=COLOQUE_SUA_CHAVE
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse em: http://localhost:5173/

## Scripts úteis
- `npm run dev`: inicia Vite em modo desenvolvimento
- `npm run build`: build de produção (gera artefatos em `dist/`)
- `npm run preview`: serve `dist/` localmente

## Configuração Tailwind
- `tailwind.config.js` e `postcss.config.js` já configurados
- diretivas aplicadas em `src/index.css`

## Integrações e roadmap
- Clima (OpenWeather/INMET): pendente (usando mocks na tela Principal)
- CONAB (prioridade atual): conector para ler arquivos da página de downloads da CONAB e expor dados à tela Mercado
  - Próximos passos:
    - Criar serviço que lista links de download (CSV/XLS/XLSX/ZIP)
    - Fazer download e parse seguro (CSV/XLSX) e retornar séries/indicadores
    - Integrar Produtos 360, preço mínimo, oferta/demanda, custo de produção e cálculo de frete
- Sensores/IoT: usar dados simulados inicialmente; definir mapeamento real de sensores no grid
- Irrigação: persistência de “última/próxima irrigação” e lógica automática com base em umidade e previsão de chuva

## Convenções
- Variáveis de ambiente expostas no front começam com `VITE_`
- Código em TypeScript (`.ts`/`.tsx`)

## Suporte
Problemas e sugestões: abra uma issue descrevendo o cenário e o passo a passo para reproduzir.
