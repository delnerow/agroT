export const CONFIG = {
  OPENWEATHER_API_KEY: import.meta.env.VITE_OPENWEATHER_API_KEY ?? 'YOUR_OPENWEATHER_API_KEY',
  INMET_API_KEY: import.meta.env.VITE_INMET_API_KEY ?? 'YOUR_INMET_API_KEY',
  CONAB_BASE_URL: 'https://portaldeinformacoes.conab.gov.br/',
}

// Exemplo de uso:
// const key = CONFIG.OPENWEATHER_API_KEY
