import React, { useState } from 'react';
import { useProntuarioDigital } from '../../hooks/useProntuarioDigital'; 
import GaugeChart from 'react-gauge-chart'; 
import { 
  Search, User, FileText, Activity, Phone, ShieldAlert, 
  Loader2, HeartPulse, Info, X, ClipboardCheck, Stethoscope, 
  Ear, Eye, Moon, Utensils, Syringe, History, Calendar, Clock 
} from 'lucide-react';

const DICIONARIO_CID = {
  "F84.0": "Autismo Infantil: Transtorno invasivo do desenvolvimento definido pela presença de desenvolvimento anormal antes dos 3 anos.",
  "F84.5": "Síndrome de Asperger: Transtorno caracterizado por dificuldades na interação social e padrões restritos de interesse.",
  "F90.0": "TDAH: Distúrbio da atividade e da atenção, caracterizado por inquietude e dificuldade de concentração.",
  "E66": "Obesidade: Acúmulo excessivo de gordura corporal com possíveis prejuízos à saúde.",
  "F84.1": "Autismo Atípico: Transtorno invasivo que se diferencia do autismo clássico pela idade de início ou sintomatologia.",
};

const ProntuarioDigital = () => {
  const { prontuario, questionario, historico, loading, buscarPorNome, limparProntuario } = useProntuarioDigital();
  const [busca, setBusca] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('resumo');
  const [cidInfo, setCidInfo] = useState(null);

  const handlePesquisar = (e) => {
    e.preventDefault();
    buscarPorNome(busca);
  };

  const calcularIMC = () => {
    if (prontuario?.imc && prontuario.imc !== "") return parseFloat(prontuario.imc);
    
    if (prontuario?.peso && prontuario?.altura) {
      const p = parseFloat(prontuario.peso);
      const a = parseFloat(prontuario.altura);
      if (a > 0) return parseFloat((p / (a * a)).toFixed(2));
    }
    return 0;
  };

  const imcAtual = calcularIMC();
  const imcNormalizado = Math.min(Math.max((imcAtual - 10) / (50 - 10), 0), 1);
  const coresGauge = ["#0ea5e9", "#22c55e", "#eab308", "#f97316", "#ef4444"];

  const getStatusIMC = (imc) => {
    if (imc === 0) return { label: "Dados Insuficientes", color: "text-slate-400" };
    if (imc < 18.5) return { label: "Abaixo do Peso", color: "text-sky-500" };
    if (imc <= 24.9) return { label: "Normal", color: "text-green-500" };
    if (imc <= 29.9) return { label: "Sobrepeso", color: "text-yellow-500" };
    if (imc <= 39.9) return { label: "Obesidade", color: "text-orange-500" };
    return { label: "Obesidade Severa", color: "text-red-500" };
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto mb-8">
        <form onSubmit={handlePesquisar} className="relative">
          <input 
            type="text"
            placeholder="Buscar nome do aluno ou funcionário..."
            className="w-full p-4 pl-12 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all text-slate-700"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <Search className="absolute left-4 top-4 text-slate-400" />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-3 top-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 flex items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'PESQUISAR'}
          </button>
        </form>
      </div>

      {prontuario ? (
        <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <div className="bg-white rounded-t-2xl p-6 shadow-sm border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                <User size={32} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 uppercase">{prontuario.alunoNome}</h1>
                <p className="text-slate-500 text-sm font-medium">
                  Matrícula: {prontuario.matriculaInteligente} | Unidade: <span className="uppercase">{prontuario.unidadeid}</span>
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 justify-end max-w-xs">
              {prontuario.saude?.cids?.map((cid, i) => (
                <button 
                  key={i} 
                  onClick={() => setCidInfo({ codigo: cid, descricao: DICIONARIO_CID[cid.toUpperCase()] || "Descrição não cadastrada." })}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm flex items-center gap-1 transition-all"
                >
                  CID: {cid} <Info size={12} />
                </button>
              ))}
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                {prontuario.turma || "FUNC"} - {prontuario.turno}
              </span>
            </div>
          </div>

          <div className="bg-white flex border-b border-slate-100 overflow-x-auto">
            {['resumo', 'contatos', 'acessibilidade', 'triagem', 'historico'].map((aba) => (
              <button 
                key={aba}
                onClick={() => setAbaAtiva(aba)} 
                className={`px-6 py-4 text-[10px] font-black transition-all uppercase tracking-widest whitespace-nowrap ${
                  abaAtiva === aba 
                    ? 'border-b-4 border-blue-600 text-blue-600 bg-blue-50/30' 
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {aba === 'resumo' ? 'Resumo Clínico' : 
                 aba === 'triagem' ? 'Triagem Completa' : 
                 aba === 'historico' ? 'Histórico de Atendimentos' : aba}
              </button>
            ))}
          </div>

          <div className="bg-white p-8 rounded-b-2xl shadow-sm min-h-[450px]">
            
            {abaAtiva === 'resumo' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center space-y-2">
                  <h3 className="flex items-center gap-2 text-slate-700 font-black border-b w-full pb-2 mb-4 uppercase text-xs tracking-tighter">
                    <Activity size={16} className="text-blue-600"/> Índice de Massa Corporal
                  </h3>
                  <div className="relative w-full max-w-[250px]">
                    <GaugeChart 
                      id="gauge-chart-imc" 
                      nrOfLevels={5} 
                      colors={coresGauge} 
                      arcWidth={0.3} 
                      percent={imcNormalizado} 
                      hideText={true}
                      needleColor="#475569"
                    />
                    <div className="text-center -mt-6">
                      <p className="text-4xl font-black text-slate-800">{imcAtual || "---"}</p>
                      <p className={`text-sm font-bold uppercase tracking-widest ${getStatusIMC(imcAtual).color}`}>
                        {getStatusIMC(imcAtual).label}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-red-600 font-bold border-b pb-2 uppercase text-xs tracking-tighter">
                    <ShieldAlert size={18}/> Alertas de Saúde
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-[10px] font-black text-red-700 uppercase mb-1">Alergias</p>
                      <p className="text-sm text-red-900 font-medium">{prontuario.alergias?.detalhes || 'Nenhuma informada'}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-green-600 font-bold border-b pb-2 uppercase text-xs tracking-tighter">
                    <FileText size={18}/> Medicação Contínua
                  </h3>
                  <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                    <p className="text-sm text-green-800 italic font-medium">
                      {prontuario.medicacaoContinua?.detalhes || 'Nenhuma medicação relatada.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {abaAtiva === 'historico' && (
              <div className="animate-in fade-in duration-500">
                <h3 className="flex items-center gap-2 text-slate-800 font-bold border-b pb-3 uppercase text-xs tracking-tighter mb-6">
                  <History size={18} className="text-blue-600"/> Registros de Atendimentos na Enfermaria
                </h3>

                {historico && historico.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {historico.map((atend, index) => (
                      <div key={index} className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                        <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex justify-between items-center">
                          <div className="flex gap-4">
                            <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <Calendar size={14} className="text-blue-500"/> {atend.data}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                              <Clock size={14} className="text-blue-500"/> {atend.horario}
                            </span>
                          </div>
                          <span className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold uppercase">
                            Profissional: {atend.atendenteNome} | {atend.atendenteRegistro}
                          </span>
                        </div>

                        <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="md:col-span-1">
                            <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Motivo</p>
                            <p className="text-sm font-bold text-red-600 uppercase leading-tight">{atend.motivoAtendimento}</p>
                          </div>
                          <div className="md:col-span-2">
                            <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Procedimento Realizado</p>
                            <p className="text-sm text-slate-700 font-medium">{atend.procedimentos}</p>
                          </div>
                          <div className="md:col-span-1">
                            <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Destino</p>
                            <p className="text-xs font-black text-slate-600 uppercase bg-slate-100 px-2 py-1 rounded inline-block italic">
                              {atend.destinoHospital}
                            </p>
                          </div>

                          <div className="md:col-span-3 border-t border-slate-50 pt-3">
                            <p className="text-[9px] text-slate-400 uppercase font-black mb-1">Observações</p>
                            <p className="text-xs text-slate-500 italic leading-relaxed">
                              {atend.observacoes || "Nenhuma observação registrada."}
                            </p>
                          </div>

                          <div className="md:col-span-1 border-t border-slate-50 pt-3 flex flex-wrap gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 flex-1 min-w-[60px] text-center">
                              <p className="text-[8px] text-blue-400 font-black uppercase">Temp.</p>
                              <p className="text-xs font-bold text-blue-700">{atend.temperatura}°C</p>
                            </div>
                            <div className="bg-green-50 p-2 rounded-lg border border-green-100 flex-1 min-w-[60px] text-center">
                              <p className="text-[8px] text-green-400 font-black uppercase">Peso</p>
                              <p className="text-xs font-bold text-green-700">{atend.peso}kg</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <History size={40} className="mx-auto mb-3 text-slate-200" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                      Nenhum histórico de atendimento encontrado para este aluno.
                    </p>
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'triagem' && (
              <div className="animate-in fade-in duration-500">
                {questionario ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Alertas de Saúde */}
                    <div className="space-y-4 bg-red-50/30 p-5 rounded-2xl border border-red-100">
                      <h4 className="flex items-center gap-2 text-red-600 font-black uppercase text-[10px] tracking-widest"><Stethoscope size={16}/> Alertas de Saúde</h4>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Alergias Detalhadas</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.alergias?.possui === 'sim' ? questionario.alergias.detalhes : 'Não possui'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Asma / Bronquite</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.asma?.possui === 'sim' ? questionario.asma.detalhes : 'Não possui'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Diabetes</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.diabetes?.possui === 'sim' ? questionario.diabetes.detalhes : 'Não possui'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sensorial e Visão */}
                    <div className="space-y-4 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
                      <h4 className="flex items-center gap-2 text-blue-600 font-black uppercase text-[10px] tracking-widest"><Ear size={16}/> Sensorial e Visão</h4>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Aparelho Auditivo</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.aparelhoAuditivo?.possui === 'sim' ? questionario.aparelhoAuditivo.detalhes : 'Não utiliza'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Problema de Visão</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.problemaVisao?.possui === 'sim' ? questionario.problemaVisao.detalhes : 'Não possui'}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Seletividade Alimentar</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.seletividadeAlimentar?.detalhes || 'Não relatada'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Nutrição e Metabolismo */}
                    <div className="space-y-4 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100">
                      <h4 className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] tracking-widest"><Utensils size={16}/> Nutrição e Metabolismo</h4>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Encaminhamento Nutricionista</p>
                          <div className="mt-1">
                            {(imcAtual > 30 || questionario.encaminhamentoNutricionista === 'sim') ? (
                              <span className="flex items-center gap-1 text-[10px] font-black text-red-600 uppercase animate-pulse">
                                <ShieldAlert size={14}/> Recomendado / Prioritário
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-emerald-600 uppercase">Não prioritário</span>
                            )}
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Observações Nutricionais</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.observacaoNutricionista || 'Sem observações registradas.'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Sono e Rotina */}
                    <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <h4 className="flex items-center gap-2 text-slate-600 font-black uppercase text-[10px] tracking-widest"><Moon size={16}/> Sono e Rotina</h4>
                      <div className="space-y-3">
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Horas de Sono / Despertares</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.horasSono}h - Desperta {questionario.despertaNoite?.detalhes}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Autonomia de Higiene</p>
                          <p className="text-sm font-bold text-slate-700 uppercase">{questionario.autonomiaHigiene}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                          <p className="text-[9px] text-slate-400 uppercase font-black">Humor / Comportamento</p>
                          <p className="text-sm font-bold text-slate-700">{questionario.mudancaHumor?.detalhes || 'Sem alterações'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-full bg-slate-900 text-white p-6 rounded-3xl flex flex-wrap justify-between items-center gap-6 mt-4">
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white/10 rounded-full"><ClipboardCheck size={24}/></div>
                          <div>
                            <p className="text-[9px] text-white/50 uppercase font-black">Cartão SUS</p>
                            <p className="text-lg font-mono font-bold">{questionario.cartaoSus}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-green-500/20 rounded-full text-green-400"><Syringe size={24}/></div>
                          <div>
                            <p className="text-[9px] text-white/50 uppercase font-black">Status Vacinal</p>
                            <p className="text-lg font-bold text-green-400 uppercase">{questionario.vacinaStatus}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-3 bg-white/10 rounded-full"><Activity size={24}/></div>
                          <div>
                            <p className="text-[9px] text-white/50 uppercase font-black">Atestado Físico</p>
                            <p className="text-lg font-bold uppercase">{questionario.atestadoAtividadeFisica}</p>
                          </div>
                        </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aguardando dados da triagem completa...</p>
                  </div>
                )}
              </div>
            )}

            {abaAtiva === 'contatos' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prontuario.contatos?.map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-5 border border-slate-100 rounded-2xl bg-slate-50/50">
                    <div className="p-4 bg-white rounded-full text-blue-600"><Phone size={24}/></div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase">{c.parentesco || 'Responsável'}</p>
                      <p className="font-bold text-slate-800 text-lg uppercase">{c.nome}</p>
                      <p className="text-blue-600 font-mono text-xl font-bold">{c.telefone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {abaAtiva === 'acessibilidade' && (
              <div className="space-y-6">
                <h3 className="flex items-center gap-2 text-slate-800 font-bold border-b pb-2 uppercase text-xs tracking-tighter">
                   <HeartPulse size={18} className="text-blue-600"/> Necessidades de Acessibilidade
                </h3>
                <div className="flex flex-wrap gap-3">
                  {prontuario.saude?.acessibilidades?.length > 0 ? (
                    prontuario.saude.acessibilidades.map((item, i) => (
                      <span key={i} className="bg-white text-slate-700 px-5 py-3 rounded-2xl text-sm font-bold border border-slate-200 uppercase shadow-sm">
                        {item}
                      </span>
                    ))
                  ) : (
                    <p className="text-slate-400 italic text-sm">Nenhuma registrada.</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button onClick={limparProntuario} className="mt-6 text-slate-400 hover:text-red-500 text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2 mx-auto">
            × Fechar Prontuário Digital
          </button>
        </div>
      ) : (
        <div className="text-center py-32 bg-white rounded-3xl shadow-inner border-4 border-dashed border-slate-100 max-w-4xl mx-auto">
          <FileText size={80} className="mx-auto mb-6 text-slate-100" />
          <h2 className="text-xl font-black text-slate-300 uppercase tracking-widest">
            {loading ? 'Buscando...' : 'Prontuário Digital'}
          </h2>
        </div>
      )}

      {/* MODAL CID */}
      {cidInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-500 p-6 text-white flex justify-between items-center">
              <h2 className="text-xl font-black uppercase">Diagnóstico CID {cidInfo.codigo}</h2>
              <button onClick={() => setCidInfo(null)} className="hover:rotate-90 transition-all"><X size={24}/></button>
            </div>
            <div className="p-8">
              <p className="text-slate-600 font-medium text-lg leading-relaxed italic">"{cidInfo.descricao}"</p>
              <button onClick={() => setCidInfo(null)} className="w-full mt-8 bg-slate-100 text-slate-700 font-bold py-4 rounded-2xl uppercase text-xs tracking-widest">
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProntuarioDigital;