export const Dimensões = {
  // Container principal: Garante que o conteúdo nunca cole na borda em telas pequenas
  view: "flex-1 min-h-screen bg-[#f8fafc] p-[clamp(0.75rem,3vw,2.5rem)] overflow-y-auto",
  
  // Wrapper de conteúdo: Centraliza no 27" e ocupa 100% no notebook/tablet
  content: "w-full max-w-[1650px] mx-auto space-y-[clamp(1rem,2vw,2rem)]",
  
  // Grid Inteligente: 
  // - No Tablet/Mobile: Empilha os elementos (1 coluna)
  // - No Notebook (1024px+): Ativa o grid de 3 colunas que você definiu
  grid: "grid grid-cols-1 lg:grid-cols-[1.5fr_1.2fr_1fr] items-center gap-4 lg:gap-6",
  
  // Cards: Arredondamento suavizado para telas menores (20px) e robusto em telas grandes (32px)
  card: "bg-white rounded-[20px] lg:rounded-[32px] shadow-sm border border-slate-100",

  // Auxiliares de texto responsivo
  textName: "text-[clamp(0.85rem,1.2vw,1rem)] font-black uppercase italic tracking-tight",
  textSub: "text-[clamp(0.65rem,1vw,0.75rem)] font-bold uppercase tracking-widest"
};