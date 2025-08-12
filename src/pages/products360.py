import requests

url = "https://pentahoportaldeinformacoes.conab.gov.br/pentaho/api/repos/:home:Produtos:produtos360.wcdf/generatedContent?userid=pentaho&password=password"

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:66.0) Gecko/20100101 Firefox/66.0",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    "Connection": "keep-alive",
}

try:
    r = requests.get(url, headers=headers, timeout=10,verify=False)
    print(r.status_code)
    print(r.text[:500])
except requests.exceptions.RequestException as e:
    print("Erro na requisição:", e)

import requests
import ssl
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager

# Adaptação para TLS mais flexível
class TLSAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context()
        ctx.set_ciphers("DEFAULT@SECLEVEL=1")
        kwargs["ssl_context"] = ctx
        return super().init_poolmanager(*args, **kwargs)

def fetch_360_data(produto: str, uf: str, data_conj: str = "2025-07-28"):
    base = "https://pentahoportaldeinformacoes.conab.gov.br"
    iframe_url = (
        base +
        "/pentaho/api/repos/:home:Produtos:produtos360.wcdf/generatedContent"
        "?userid=pentaho&password=password"
    )
    cda_endpoint = base + "/pentaho/plugin/cda/api/doQuery"

    session = requests.Session()
    session.mount("https://", TLSAdapter())

    # 1. Acessar para obter sessão
    session.get(iframe_url, timeout=30)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Referer": iframe_url,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
    }

    datasets = {}
    def post_query(dataAccessId, extra_params=None):
        params = {
            "paramproduto": produto,
            "path": "/home/Produtos/produtos360.cda",
            "dataAccessId": dataAccessId,
            "outputIndexId": "1",
            "pageSize": "0",
            "pageStart": "0",
            "sortBy": "",
            "paramsearchBox": ""
        }
        if dataAccessId == "conjuntura":
            params["paramdata_conjuntura"] = data_conj
        if extra_params:
            params.update(extra_params)
        r = session.post(cda_endpoint, data=params, headers=headers, timeout=30)
        r.raise_for_status()
        try:
            return r.json()
        except ValueError:
            return r.text

    # 2. Requisições de diferentes conjuntos
    datasets["conjuntura"] = post_query("conjuntura")
    datasets["exportacao"] = post_query("exportacao_new")
    datasets["importacao"] = post_query("importacao")
    datasets["custo_producao"] = post_query("anoMesCustoProducao")
    datasets["custo_preco"] = post_query("custoProducaoPreco")
    datasets["estoque_demanda"] = post_query("estoqueOfertaDemandaSafra")

    return datasets

if __name__ == "__main__":
    result = fetch_360_data(produto="SOJA", uf="SP")
    # Exemplo de visualização de um dos conjuntos
    import pprint
    pprint.pprint(result["conjuntura"])



import requests

url = "https://pentahoportaldeinformacoes.conab.gov.br/pentaho/plugin/cda/api/doQuery"
def get_360_(produto):
    payload = {
        "paramdata_conjuntura": "2025-07-28",
        "paramproduto": produto,
        "path": "/home/Produtos/produtos360.cda",
        "dataAccessId": "conjuntura",
        "outputIndexId": "1",
        "pageSize": "0",
        "pageStart": "0",
        "sortBy": "",
        "paramsearchBox": ""
    }

    headers = {
    "Accept": "*/*",
"Accept-Encoding": "gzip, deflate, br, zstd",
"Accept-Language": "en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7,pt-BR;q=0.6,pt;q=0.5",
"Connection": "keep-alive",
"Content-Length": "178",
"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    "Referer": "https://portaldeinformacoes.conab.gov.br/",
    "Origin": "https://portaldeinformacoes.conab.gov.br",
    "Host": "pentahoportaldeinformacoes.conab.gov.br",
    "Origin": "https://pentahoportaldeinformacoes.conab.gov.br",
    "Referer": "https://pentahoportaldeinformacoes.conab.gov.br/pentaho/api/repos/%3Ahome%3AProdutos%3Aprodutos360.wcdf/generatedContent?userid=pentaho&password=password",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36"
    }
  # Replace with actual session ID if needed}
    r = requests.post(url, data=payload, headers=headers, cookies= {"JSESSIONID": "22C4799287B60187C9423ACD2E074DB9"})
    r.raise_for_status()

    return r.json()
print(get_360_("SOJA"))