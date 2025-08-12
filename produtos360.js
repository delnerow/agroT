import https from 'https';
import { writeFileSync } from 'fs';
import { exec } from 'child_process';

// CONFIGURAÇÃO
const PRODUTO = 'SOJA';
const UF = 'SP';
const DATA_CONJ = '2025-07-28';

console.log('🚀 CONAB FETCHER - VERSÃO COM COOKIE');
console.log('='.repeat(50));
console.log(`📊 Produto: ${PRODUTO} | UF: ${UF}`);

// Desabilitar verificação SSL (não recomendado para produção)
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const BASE_URL = 'https://pentahoportaldeinformacoes.conab.gov.br';
const IFRAME_URL = `${BASE_URL}/pentaho/api/repos/%3Ahome%3AProdutos%3Aprodutos360.wcdf/generatedContent?userid=pentaho&password=password`;
const CDA_ENDPOINT = `${BASE_URL}/pentaho/plugin/cda/api/doQuery`;
function extractCookies(setCookieHeaders) {
  if (!setCookieHeaders) return '';
  // setCookieHeaders é array, cada item tipo: 'JSESSIONID=abc123; Path=/; HttpOnly; Secure'
  // Vamos pegar só a parte 'nome=valor' de cada cookie e juntar com '; '
  const cookies = setCookieHeaders.map(cookieStr => cookieStr.split(';')[0]);
  return cookies.join('; ');
}
function logErrorDetails(response) {
  console.log('\n💥 ERRO DETALHADO:');
  console.log(`❌ Status Code: ${response.status}`);
  console.log('❌ Headers:', response.headers);
  console.log('❌ Body:', response.data.substring(0, 500)); // Log first 500 characters of the body
}

// Update makeHttpRequest to log details on error
function makeHttpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    console.log(`📡 ${options.method || 'GET'} ${url.substring(0, 80)}...`);
    
    const req = https.request(url, {
      method: options.method || 'GET',
      headers: {
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate, br, zstd',
            'Accept-Language': 'en-US,en;q=0.9,de-DE;q=0.8,de;q=0.7,pt-BR;q=0.6,pt;q=0.5',
            'Connection': 'keep-alive',
            'Host': 'pentahoportaldeinformacoes.conab.gov.br',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
            'X-KL-Ajax-Request': 'Ajax_Request',
            'sec-ch-ua': '"Not;A=Brand";v="99", "Google Chrome";v="139", "Chromium";v="139"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            ...options.headers // permite sobrescrever ou adicionar mais headers
            },
      timeout: 30000,
      rejectUnauthorized: false
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data, headers: res.headers });
        } else {
          const errorResponse = { status: res.statusCode, data, headers: res.headers };
          logErrorDetails(errorResponse);
          reject(new Error(`HTTP ${res.statusCode}: ${data.substring(0, 100)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (options.body) req.write(options.body);
    req.end();
  });
}

async function fetchConabData() {
  try {
    console.log('\n🔄 PASSO 1: Inicializando sessão e capturando cookies...');
    const initResponse = await new Promise((resolve, reject) => {
      https.get(IFRAME_URL, { rejectUnauthorized: false }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          // Log the full response for debugging
          console.log('\n🔍 Resposta completa da inicialização:');
          console.log('Status Code:', res.statusCode);
          console.log('Headers:', res.headers);
          console.log('Body:', data.substring(0, 500)); // Log first 500 characters of the body

          // Extrair cookies da resposta GET
          const rawCookies = res.headers['set-cookie'];
          const cookieHeader = extractCookies(rawCookies);
          console.log('✅ Cookies capturados:', cookieHeader);
          resolve({ data, cookieHeader });
        });
      }).on('error', reject);
    });
    

    // Espera 2s para garantir sessão
    console.log('⏳ Aguardando 2 segundos...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n📊 PASSO 2: Enviando consulta com cookies...');
    const formData = [
      `paramdata_conjuntura=${encodeURIComponent(DATA_CONJ)}`,
      `paramproduto=${encodeURIComponent(PRODUTO)}`,
      'path=/home/Produtos/produtos360.cda',
      'dataAccessId=conjuntura',
      'outputIndexId=1',
      'pageSize=0',
      'pageStart=0',
      'sortBy=',
      'paramsearchBox=',
    ].join('&');

    const queryResponse = await makeHttpRequest(CDA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Referer': IFRAME_URL,
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': BASE_URL,
        'Cookie': initResponse.cookieHeader
      },
      body: formData
    });

    console.log('\n🎯 PASSO 3: Processando resposta...');
    let data;
    try {
      data = JSON.parse(queryResponse.data);
      console.log('✅ JSON válido recebido!');
      console.log(`📊 Tipo: ${Array.isArray(data) ? 'Array' : 'Object'}`);
      console.log(`📏 Tamanho: ${Array.isArray(data) ? data.length : Object.keys(data).length} itens`);
    } catch (e) {
      console.log('⚠️  Resposta não é JSON, salvando como texto');
      data = queryResponse.data;
    }

    // Salvar arquivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `conab_${PRODUTO}_${UF}_${timestamp}.json`;
    writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`💾 Dados salvos em: ${filename}`);

    // Preview
    console.log('\n📋 PREVIEW DOS DADOS:');
    console.log('='.repeat(30));
    if (Array.isArray(data)) {
      console.log(`Array com ${data.length} elementos`);
      if (data.length > 0) {
        console.log('Primeiro elemento:', JSON.stringify(data[0], null, 2).substring(0, 200) + '...');
      }
    } else if (typeof data === 'object' && data !== null) {
      console.log(`Objeto com propriedades: ${Object.keys(data).join(', ')}`);
      console.log('Dados:', JSON.stringify(data, null, 2).substring(0, 300) + '...');
    } else {
      console.log(`Tipo: ${typeof data}`);
      console.log('Conteúdo:', String(data).substring(0, 300) + '...');
    }

    console.log('\n🎉 SUCESSO TOTAL!');
    return data;

  } catch (error) {
    console.log('\n💥 ERRO FATAL:');
    console.log(`❌ ${error.message}`);
    console.log('\n🔧 POSSÍVEIS SOLUÇÕES:');
    console.log('1. Verificar conexão com internet');
    console.log('2. Tentar com VPN ou rede diferente');
    console.log('3. Executar como administrador');
    console.log('4. Verificar firewall/antivírus');
    return null;
  }
}

function executeCurlCommand(command) {
  console.log(`\n🔧 Executando comando curl: ${command}`);
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Erro ao executar curl: ${stderr}`);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Função para fazer post com dados form-urlencoded
  const payload = (dataAccessId) => {
    const params = [
      `path=${encodeURIComponent("/home/Produtos/produtos360.cda")}`,
      'outputIndexId=1',
      'pageSize=0',
      'pageStart=0',
      'sortBy=',
      'paramsearchBox=',
    ]
    

    // Adicionar paramdata_conjuntura se dataAccessId == "conjuntura"
    if (dataAccessId === "conjuntura") {
      params.push(`paramdata_conjuntura=${encodeURIComponent(DATA_CONJ)}`);
      params.push(`paramproduto=${encodeURIComponent(PRODUTO)}`);
      params.push('dataAccessId=conjuntura');
    }
    if(dataAccessId === "ultimaSemanaPrecoProduto_new"){
      params.push(`paramprodutoPreco=[Produto].${encodeURIComponent(PRODUTO)}`);
      params.push('dataAccessId=ultimaSemanaPrecoProduto_new');
    }
    return params.join('&');
  };


async function fetchConabDataWithCurl() {
  try {
    console.log('\n🔄 PASSO 1: Inicializando sessão e capturando cookies...');
    const initCurlCommand = `curl -k -i -X GET "${IFRAME_URL}"`;
    const initResponse = await executeCurlCommand(initCurlCommand);

    console.log('\n🔍 Resposta completa da inicialização:');
    console.log(initResponse.substring(0, 500)); // Log first 500 characters of the response

    // Extrair cookies da resposta
    const cookieMatch = initResponse.match(/Set-Cookie: (.+?);/g);
    const cookies = cookieMatch ? cookieMatch.map(cookie => cookie.replace('Set-Cookie: ', '').replace(';', '')).join('; ') : '';
    console.log('✅ Cookies capturados:', cookies);

    console.log('\n📊 PASSO 2: Enviando consulta com cookies...');

    const queryCurlCommand = `curl -k -X POST "${CDA_ENDPOINT}" \
      -H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" \
      -H "Referer: ${IFRAME_URL}" \
      -H "X-Requested-With: XMLHttpRequest" \
      -H "Origin: ${BASE_URL}" \
      -H "Cookie: ${cookies}" \
      --data "${payload("conjuntura")}"`;

    const queryResponse = await executeCurlCommand(queryCurlCommand);
    const jsonData = JSON.parse(queryResponse);
    //console.log('\n🎯 Resposta da consulta:');
    //console.log(queryResponse.substring(0, 500)); // Log first 500 characters of the response
    const resultset = jsonData.resultset;
    console.log('\n📊 Conjuntura:' ,resultset);
  } catch (error) {
    console.log('\n💥 ERRO FATAL:');
    console.log(`❌ ${error}`);
  }
}

// EXECUÇÃO
(async () => {
  await fetchConabDataWithCurl();
})();
