// REGRA OFICIAL RODHON SYSTEM: Tudo minúsculo, mantém acentos.
export const prepararParaBanco = (dados) => {
  if (typeof dados === 'string') {
    return dados.trim().toLowerCase();
  }

  // Se for um objeto (como um formulário de paciente), limpa todos os campos
  if (typeof dados === 'object' && dados !== null) {
    const objetoLimpo = {};
    Object.keys(dados).forEach(key => {
      const valor = dados[key];
      // Só transforma em minúsculo se for texto
      objetoLimpo[key] = typeof valor === 'string' ? valor.trim().toLowerCase() : valor;
    });
    return objetoLimpo;
  }

  return dados;
};