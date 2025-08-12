import axios from "axios";
import { wrapper } from "axios-cookiejar-support";
import tough from "tough-cookie";
import https from "https";
import constants from 'constants';
async function fetch360Data(produto = "SOJA", uf = "SP", dataConj = "2025-07-28") {
  const base = "https://pentahoportaldeinformacoes.conab.gov.br";
  const iframeUrl = `${base}/pentaho/api/repos/:home:Produtos:produtos360.wcdf/generatedContent?userid=pentaho&password=password`;
  const cdaEndpoint = `${base}/pentaho/plugin/cda/api/doQuery`;

  // Criar cookie jar para guardar cookies da sessão
  const cookieJar = new tough.CookieJar();

  // Wrapper do axios para suportar cookies
  const client = wrapper(axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: false, // caso tenha problema com certificado (ajusta conforme necessário)
      secureOptions: constants.SSL_OP_LEGACY_SERVER_CONNECT,
    }),
    jar: cookieJar,
    withCredentials: true,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      "Referer": iframeUrl
    },
    timeout: 30000
  }));

  // 1. Acessar iframe para obter cookies e sessão
  await client.get(iframeUrl);

  // Função para fazer post com dados form-urlencoded
  const postQuery = async (dataAccessId, extraParams = {}) => {
    const params = new URLSearchParams({
      paramproduto: produto,
      path: "/home/Produtos/produtos360.cda",
      dataAccessId,
      outputIndexId: "1",
      pageSize: "0",
      pageStart: "0",
      sortBy: "",
      paramsearchBox: "",
      ...extraParams
    });

    // Adicionar paramdata_conjuntura se dataAccessId == "conjuntura"
    if (dataAccessId === "conjuntura") {
      params.set("paramdata_conjuntura", dataConj);
    }

    const response = await client.post(cdaEndpoint, params.toString());
    return response.data;
  };

  // 2. Fazer as requisições necessárias
  const datasets = {};
  datasets.conjuntura = await postQuery("conjuntura");
  datasets.exportacao = await postQuery("exportacao_new");
  datasets.importacao = await postQuery("importacao");
  datasets.custo_producao = await postQuery("anoMesCustoProducao");
  datasets.custo_preco = await postQuery("custoProducaoPreco");
  datasets.estoque_demanda = await postQuery("estoqueOfertaDemandaSafra");

  return datasets;
}

// Executar e mostrar resultado
(async () => {
  try {
    const result = await fetch360Data("SOJA", "SP");
    console.dir(result.conjuntura, { depth: null });
  } catch (err) {
    console.error("Erro ao buscar dados:", err.message);
  }
})();
