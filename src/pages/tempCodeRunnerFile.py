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
"Cookie": "session-flushed=true; JSESSIONID=22C4799287B60187C9423ACD2E074DB9; _ga=GA1.1.781539510.1754953048; _ga_7EYQQ94NR0=GS2.1.s1755026961$o4$g1$t1755026962$j59$l0$h0; _ga_JFBLZYVEW5=GS2.1.s1755026961$o4$g1$t1755026962$j59$l0$h0; session-expiry=1755035125644; server-time=1755027925644",
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

    r = requests.post(url, data=payload, headers=headers)
    r.raise_for_status()

    return r.json()
print(get_360_("SOJA"))