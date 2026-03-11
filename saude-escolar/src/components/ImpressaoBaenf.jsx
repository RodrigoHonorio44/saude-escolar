import React from 'react';

const ImpressaoBaenf = ({ dados }) => {
  if (!dados) return null;

  const dataFormatada = dados.data ? dados.data.split('-').reverse().join('/') : '';

  return (
    <>
      <div id="secao-impressao-real" className="hidden print:block bg-white text-black font-serif">
        
        {/* CONTEÚDO DO DOCUMENTO */}
        <div className="w-full">
          {/* CABEÇALHO */}
          <div className="text-center border-b-2 border-black pb-4 mb-6">
           
              <h3 className="text-xl font-black uppercase italic">
                Boletim de Atendimento de Enfermagem (BAENF)
              </h3>
            </div>
            <p className="text-[10px] mt-2 font-mono">Protocolo: {dados.baenf}</p>
          </div>

          {/* 1. IDENTIFICAÇÃO */}
          <div className="mb-6">
            <div className="bg-gray-100 p-1 border border-black border-b-0">
              <span className="text-xs font-bold uppercase px-2">1. Identificação do Paciente</span>
            </div>
            <table className="w-full border-collapse border border-black text-xs">
              <tbody>
                <tr>
                  <td className="border border-black p-3 w-2/3">
                    <p className="font-bold uppercase text-[9px] text-gray-600">Nome Completo:</p>
                    <p className="text-base font-bold uppercase">{dados.nomePaciente}</p>
                  </td>
                  <td className="border border-black p-3 w-1/3">
                    <p className="font-bold uppercase text-[9px] text-gray-600">Data Nascimento:</p>
                    <p className="text-base font-semibold">{dados.dataNascimento?.split('-').reverse().join('/')}</p>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-3">
                    <p className="font-bold uppercase text-[9px] text-gray-600">Unidade Escolar:</p>
                    <p className="text-sm font-semibold uppercase">{dados.unidadeid?.replace(/-/g, ' ')}</p>
                  </td>
                  <td className="border border-black p-3">
                    <p className="font-bold uppercase text-[9px] text-gray-600">Turma:</p>
                    <p className="text-sm font-semibold uppercase">{dados.turma}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 2. SINAIS VITAIS */}
          <div className="mb-6">
            <div className="bg-gray-100 p-1 border border-black border-b-0">
              <span className="text-xs font-bold uppercase px-2">2. Avaliação Clínica e Sinais Vitais</span>
            </div>
            <table className="w-full border-collapse border border-black text-xs text-center">
              <tbody>
                <tr className="bg-gray-50 uppercase font-bold text-[9px]">
                  <td className="border border-black p-2">Peso</td>
                  <td className="border border-black p-2">Altura</td>
                  <td className="border border-black p-2">IMC</td>
                  <td className="border border-black p-2">Temperatura</td>
                </tr>
                <tr className="text-base font-bold">
                  <td className="border border-black p-3">{dados.peso} kg</td>
                  <td className="border border-black p-3">{dados.altura} m</td>
                  <td className="border border-black p-3">{dados.imc || '---'}</td>
                  <td className="border border-black p-3">{dados.temperatura}°C</td>
                </tr>
                <tr>
                  <td className="border border-black p-3 text-left" colSpan="2">
                    <p className="font-bold text-[9px] text-gray-600 uppercase font-serif">Alergias:</p>
                    <p className="text-sm font-bold uppercase text-red-700">{dados.alunoPossuiAlergia === "sim" ? dados.qualAlergia : "Nenhuma"}</p>
                  </td>
                  <td className="border border-black p-3 text-left" colSpan="2">
                    <p className="font-bold text-[9px] text-gray-600 uppercase font-serif">CIDs:</p>
                    <p className="text-sm font-bold uppercase italic">{dados.saude?.cids?.join(', ') || 'Não Informado'}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 3. DESCRIÇÃO */}
          <div className="mb-10">
            <div className="bg-gray-100 p-1 border border-black border-b-0">
              <span className="text-xs font-bold uppercase px-2">3. Descrição do Atendimento</span>
            </div>
            <div className="border border-black p-8 min-h-[400px] text-sm leading-relaxed">
              <div className="mb-6">
                <p className="font-bold text-[10px] uppercase text-gray-500 border-b border-gray-300 mb-2 font-serif">Motivo:</p>
                <p className="text-lg uppercase">{dados.motivoAtendimento}</p>
              </div>
              <div className="mb-6">
                <p className="font-bold text-[10px] uppercase text-gray-500 border-b border-gray-300 mb-2 font-serif">Conduta / Procedimentos:</p>
                <p className="text-lg uppercase">{dados.procedimentos}</p>
              </div>
              <div className="mt-12 pt-4 border-t-2 border-black inline-block">
                <p className="text-sm"><strong>Encaminhamento/Destino:</strong> <span className="uppercase font-black">{dados.destinoHospital}</span></p>
              </div>
            </div>
          </div>

          {/* ASSINATURAS */}
          <div className="mt-auto grid grid-cols-2 gap-20 px-10">
            <div className="text-center">
              <div className="border-t border-black w-full mb-2"></div>
              <p className="text-sm font-bold uppercase">{dados.atendenteNome}</p>
              <p className="text-[10px] uppercase italic text-gray-700">
                {dados.atendenteRole} — COREN: {dados.atendenteRegistro}
              </p>
            </div>
            
          </div>
        </div>

        {/* CSS DE RESET PARA A4 */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            /* Esconde tudo, inclusive o fundo do modal */
            body * { visibility: hidden; background: transparent !important; }
            
            /* Mostra apenas a seção de impressão */
            #secao-impressao-real, #secao-impressao-real * { visibility: visible; }
            
            #secao-impressao-real {
              display: block !important;
              position: fixed; /* Fixa no topo absoluto da página */
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important; /* Largura exata do A4 */
              height: 297mm !important; /* Altura exata do A4 */
              margin: 0 !important;
              padding: 20mm !important; /* Margem interna da folha */
              background: white !important;
              z-index: 9999999;
            }

            table { width: 100% !important; border-collapse: collapse !important; }
            
            @page { 
              size: A4 portrait; 
              margin: 0; /* Remove margens do navegador */
            }
          }
        `}} />
      
    </>
  );
};

export default ImpressaoBaenf;