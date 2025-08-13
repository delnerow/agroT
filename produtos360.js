import https from 'https';
import { writeFileSync } from 'fs';
import { exec } from 'child_process';
import axios from 'axios';
import * as XLSX from 'xlsx';
// CONFIGURAÇÃO
const PRODUTO = 'SOJA';
const UF = 'SP';
const DATA_CONJ = '2025-07-28';

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


function executeCurlCommand(command) {
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
      `path=/home/Produtos/produtos360.cda`,
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
    if(dataAccessId === "preco"){
      params.push(`paramprodutoPreco=${encodeURIComponent("[Produto].",PRODUTO)}`);
      params.push('dataAccessId=precoProduto');
      params.push(`outputType=json`);
      params.push(`settingsattachmentName=Dados.json`);
      params.push(`wrapItUp=true`);
    }
    return params.join('&');


    
  };


async function fetchConabDataWithCurl(requisicao = "conjuntura") {
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
      --data "${payload(requisicao)}"`;

    const queryResponse = await executeCurlCommand(queryCurlCommand);
    
    console.log('\n🎯 Resposta da consulta:');
    console.log(queryResponse.substring(0, 500)); // Log first 500 characters of the response
    if( requisicao === "preco"){
      
      
      const jsonData = await pegarJson(queryResponse.substring(0, 500));
      

    }
    else if (requisicao === "conjuntura") {
      const jsonData = JSON.parse(queryResponse);
      const resultset = jsonData.resultset;
      console.log('\n📊 Conjuntura:' ,resultset);
    }
  } catch (error) {
    console.log('\n💥 ERRO FATAL:');
    console.log(`❌ ${error}`);
  }
}

async function pegarJson(fileId, jsessionId) {
  const url = `https://pentahoportaldeinformacoes.conab.gov.br/pentaho/plugin/cda/api/unwrapQuery?path=%2Fhome%2FProdutos%2Fprodutos360.cda&uuid=${fileId}`;

  const { data } = await axios.get(url, {
    headers: { Cookie: `JSESSIONID=...` },
    responseType: 'json' // <<< aqui pega como JSON
  });

  return data;
}


// EXECUÇÃO
(async () => {
  await fetchConabDataWithCurl("preco");
})();
