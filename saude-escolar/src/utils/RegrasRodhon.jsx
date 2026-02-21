// ✅ RODHON SYSTEM - ARQUIVO DE REGRAS GLOBAIS
import { serverTimestamp } from "firebase/firestore";

/**
 * 1. REGRA DE OURO: TUDO MINÚSCULO, MANTÉM ACENTOS.
 */
export const prepararParaBanco = (dados) => {
  if (typeof dados === 'string') {
    return dados.trim().toLowerCase();
  }
  if (typeof dados === 'object' && dados !== null) {
    const objetoLimpo = {};
    Object.keys(dados).forEach(key => {
      const valor = dados[key];
      objetoLimpo[key] = typeof valor === 'string' ? valor.trim().toLowerCase() : valor;
    });
    return objetoLimpo;
  }
  return dados;
};

/**
 * 2. REGRA DE EXIBIÇÃO (NOME PRÓPRIO)
 * EX: "rodrigo da silva honório" -> "Rodrigo Da Silva Honório"
 */
export const formatarParaTela = (valor) => {
  if (!valor || typeof valor !== 'string') return valor;
  return valor
    .toLowerCase()
    .split(' ')
    .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(' ');
};

/**
 * 3. MÁSCARAS (TELEFONE, CPF, CEP, DATA)
 */
export const mascaraTelefone = (valor) => {
  if (!valor) return "";
  valor = valor.replace(/\D/g, ""); 
  valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2"); 
  if (valor.length <= 13) {
    valor = valor.replace(/(\d{4})(\d)/, "$1-$2"); 
  } else {
    valor = valor.replace(/(\d{5})(\d)/, "$1-$2"); 
  }
  return valor.slice(0, 15);
};

export const mascaraCPF = (valor) => {
  if (!valor) return "";
  return valor
    .replace(/\D/g, "") 
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

export const mascaraCEP = (valor) => {
  if (!valor) return "";
  valor = valor.replace(/\D/g, "");
  valor = valor.replace(/(\d{5})(\d)/, "$1-$2");
  return valor.slice(0, 9);
};

export const mascaraData = (valor) => {
  if (!valor) return "";
  return valor
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{2})(\d)/, "$1/$2")
    .replace(/(\d{4})\d+?$/, "$1");
};

/**
 * 4. CÁLCULO DE IDADE
 */
export const calcularIdade = (data) => {
  if (!data || data.length !== 10) return "";
  const [dia, mes, ano] = data.split("/");
  const dataNasc = new Date(ano, mes - 1, dia);
  const hoje = new Date();
  let idade = hoje.getFullYear() - dataNasc.getFullYear();
  const m = hoje.getMonth() - dataNasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < dataNasc.getDate())) idade--;
  return idade < 0 ? "Data Inválida" : idade + " anos";
};

/**
 * 5. VALIDAÇÃO REAL DE CPF (MATEMÁTICA)
 */
export const validarCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;
  let soma = 0, resto;
  for (let i = 1; i <= 9; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.substring(9, 10))) return false;
  soma = 0;
  for (let i = 1; i <= 10; i++) soma = soma + parseInt(cpf.substring(i - 1, i)) * (12 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(cpf.substring(10, 11));
};

/**
 * 6. BUSCA DE ENDEREÇO VIA CEP (INTELIGENTE)
 */
export const buscarEnderecoPeloCEP = async (cep) => {
  const cepLimpo = cep.replace(/\D/g, "");
  if (cepLimpo.length !== 8) return null;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    const dados = await resposta.json();
    if (dados.erro) return null;
    // RETORNA TUDO MINÚSCULO CONFORME REGRA RODHON
    return {
      rua: dados.logradouro.toLowerCase(),
      bairro: dados.bairro.toLowerCase(),
      cidade: dados.localidade.toLowerCase(),
      uf: dados.uf.toLowerCase()
    };
  } catch (e) { return null; }
};

/**
 * 7. REGRAS DE TEMPO (SERVIDOR/INTERNET)
 */
export const gerarCarimboServidor = () => serverTimestamp();

export const formatarHoraDoServidor = (timestamp) => {
  if (!timestamp) return "--/--/---- --:--";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp); 
  return data.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
};