import React, { useState, useEffect } from 'react';
import {
  Compass,
  Map,
  Crosshair,
  Activity,
  Sparkles,
  TrendingUp,
  Layers,
  Target,
  PenTool,
  CheckCircle2,
  XCircle,
  ArrowRightCircle,
  ArrowLeftCircle
} from 'lucide-react';

// --- CONFIGURAÇÃO DE FONTES E ESTILOS GLOBAIS ---
const fontStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Orbitron:wght@400;500;600;700&display=swap');

  body {
    font-family: 'Inter', sans-serif;
    background-color: #061219;
    color: #F4F7F8;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
  }

  .font-tech {
    font-family: 'Orbitron', sans-serif;
  }

  .grid-bg {
    background-size: 40px 40px;
    background-image:
      linear-gradient(to right, rgba(43, 47, 52, 0.3) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(43, 47, 52, 0.3) 1px, transparent 1px);
  }

  .hud-border {
    position: relative;
  }
  .hud-border::before, .hud-border::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid #90B728;
    transition: all 0.3s ease;
  }
  .hud-border::before { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .hud-border::after { bottom: -1px; right: -1px; border-left: none; border-top: none; }
  .hud-border:hover::before, .hud-border:hover::after {
    width: 12px; height: 12px;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #061219; }
  ::-webkit-scrollbar-thumb { background: #1F3A5F; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #195D83; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
  }

  @keyframes drawLine {
    to { stroke-dashoffset: 0; }
  }
  .anim-draw {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawLine 2s ease-in-out forwards;
  }
  .anim-draw-fast {
    stroke-dasharray: 500;
    stroke-dashoffset: 500;
    animation: drawLine 1s ease-in-out forwards;
  }

  @keyframes pulse-ring {
    0% { transform: scale(0.8); opacity: 0.5; }
    100% { transform: scale(2.5); opacity: 0; }
  }
  .radar-pulse {
    animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }

  /* Estilização da range slider técnica */
  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    background: transparent;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 12px;
    background: #90B728;
    cursor: pointer;
    margin-top: -8px;
    border-radius: 2px;
  }
  input[type=range]::-webkit-slider-runnable-track {
    width: 100%;
    height: 4px;
    cursor: pointer;
    background: #1F3A5F;
    border-radius: 2px;
  }
`;

// --- CORES DA MARCA ---
const COLORS = {
  fundo: '#061219',
  azulAG: '#1F3A5F',
  azulTecnico: '#195D83',
  verdeTecnico: '#90B728',
  brancoGelo: '#F4F7F8',
  cinzaGrafite: '#2B2F34',
  alertaVemelho: '#E53935'
};

// --- LOGÓTIPO AGLAB ---
const LogoAGLab = ({ width = 180 }) => {
  return (
    <svg width={width} viewBox="-20 -10 380 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g fill={COLORS.brancoGelo}>
        <path d="M 45 5 L 75 5 L 110 95 L 80 95 L 70 70 L 30 70 L 20 95 L -10 95 Z M 60 25 L 40 50 L 75 50 Z" fillRule="evenodd" />
        <path d="M 210 50 C 210 85 190 95 160 95 C 130 95 110 75 110 50 C 110 20 130 5 160 5 C 190 5 205 20 210 35 L 180 40 C 175 35 170 35 160 35 C 145 35 140 40 140 50 C 140 60 145 65 160 65 C 170 65 175 60 175 50 L 145 50 L 145 25 L 210 25 Z" />
      </g>
      <text x="218" y="95" fontFamily="Inter" fontWeight="300" fontSize="76" letterSpacing="-3" fill={COLORS.verdeTecnico}>lab</text>
      <g transform="translate(328, 35)" stroke={COLORS.verdeTecnico} fill="none" strokeWidth="2.5">
        <circle cx="0" cy="0" r="10" />
        <circle cx="0" cy="0" r="3" fill={COLORS.verdeTecnico} />
        <path d="M 0 -16 L 0 -5 M 0 5 L 0 16 M -16 0 L -5 M 5 0 L 16 0" strokeLinecap="round" />
      </g>
    </svg>
  );
};

// --- FUNÇÕES AUXILIARES ---
const formatDegree = (dec) => {
  let isNeg = dec < 0;
  dec = Math.abs(dec);
  const d = Math.floor(dec);
  const mDec = (dec - d) * 60;
  const m = Math.floor(mDec);
  const s = Math.round((mDec - m) * 60);
  return `${isNeg ? '-' : ''}${d}° ${m.toString().padStart(2, '0')}' ${s.toString().padStart(2, '0')}"`;
};

const calcularRumo = (azimuteStr) => {
  let az = parseFloat(azimuteStr);
  if (isNaN(az)) az = 0;
  az = az % 360;
  if (az < 0) az += 360;

  if (az === 0) return { rumo: 0, quadrante: 'N', direcao: 'Norte Verdadeiro' };
  if (az === 90) return { rumo: 90, quadrante: 'E', direcao: 'Este' };
  if (az === 180) return { rumo: 0, quadrante: 'S', direcao: 'Sul Verdadeiro' };
  if (az === 270) return { rumo: 90, quadrante: 'W', direcao: 'Oeste' };

  if (az > 0 && az < 90) return { rumo: az, quadrante: 'NE', direcao: 'Nordeste' };
  if (az > 90 && az < 180) return { rumo: 180 - az, quadrante: 'SE', direcao: 'Sudeste' };
  if (az > 180 && az < 270) return { rumo: az - 180, quadrante: 'SW', direcao: 'Sudoeste' };
  if (az > 270 && az < 360) return { rumo: 360 - az, quadrante: 'NW', direcao: 'Noroeste' };

  return { rumo: 0, quadrante: 'N', direcao: 'Norte' };
};

// --- DADOS DE EXERCÍCIOS ---
const EXERCISES = [
  {
    q: "Se um alinhamento possui Azimute de 135° 00' 00\", qual o seu Rumo?",
    options: ["S 45° 00' 00\" E", "N 45° 00' 00\" E", "S 135° 00' 00\" W", "N 45° 00' 00\" W"],
    correct: 0,
    explanation: "O azimute 135° está no quadrante Sudeste (SE). O Rumo é calculado por 180° - 135° = 45°."
  },
  {
    q: "Qual método de levantamento consiste numa série de linhas consecutivas, onde medimos a distância e a direção de cada uma para formar a base do projeto?",
    options: ["Irradiação", "Caminhamento (Poligonal)", "Interseção", "Nivelamento Geométrico"],
    correct: 1,
    explanation: "O Caminhamento, ou criação de Poligonais, estabelece uma malha de controle ligando estações de forma sucessiva."
  },
  {
    q: "Para um Azimute à Ré de 45°, mediu-se um ângulo interno de 90° à direita. Qual o Azimute à Vante?",
    options: ["315°", "225°", "135°", "325°"],
    correct: 0,
    explanation: "Azimute Seguinte = Azimute Anterior (45°) + 180° + Ângulo Lido (90°) = 315°."
  },
  {
    q: "Um alinhamento tem o rumo N 30° 00' 00\" W. Qual é o seu Azimute correspondente?",
    options: ["330° 00' 00\"", "30° 00' 00\"", "210° 00' 00\"", "150° 00' 00\""],
    correct: 0,
    explanation: "No quadrante Noroeste (NW), o azimute é 360° - Rumo. Logo, 360° - 30° = 330°."
  },
  {
    q: "Na propagação de azimutes, se o azimute anterior é 200° e o ângulo lido à direita é 100°, qual será o novo azimute?",
    options: ["120°", "300°", "480°", "40°"],
    correct: 0,
    explanation: "Azimute Vante = 200° + 180° + 100° = 480°. Como este valor ultrapassa um ciclo completo, subtraímos 360°, resultando em 120°."
  },
  {
    q: "Qual a principal característica geométrica e de campo do método de Irradiação?",
    options: ["A estação ocupa de forma sucessiva todos os pontos do perímetro a levantar", "A estação central visa vários pontos à sua volta, medindo ângulos e distâncias para definir detalhes", "Não é necessário medir distâncias, apenas o cruzamento de ângulos", "O equipamento não requer calagem e nivelamento prévios"],
    correct: 1,
    explanation: "Na irradiação, a partir de uma única estação de base, medem-se ângulos e distâncias para os diversos pontos ao redor, de forma análoga aos raios de uma circunferência."
  },
  {
    q: "O Azimute Topográfico define-se como o ângulo horizontal medido convencionalmente a partir de qual referência?",
    options: ["Direção Norte, sempre no sentido dos ponteiros do relógio (horário)", "Linha do Equador Terrestre", "Direção Sul, no sentido anti-horário", "Alinhamento com a estrela polar em qualquer circunstância"],
    correct: 0,
    explanation: "O Azimute é medido convencionalmente a partir da direção Norte (seja Norte Verdadeiro, Magnético ou Assumido/Arbitrário), no sentido horário, oscilando entre 0° e 360°."
  },
  {
    q: "Se um ponto P2 está a Este (Leste) exato do ponto P1 de onde estacionou, qual será o azimute do alinhamento P1-P2?",
    options: ["0°", "90°", "180°", "270°"],
    correct: 1,
    explanation: "Num plano topográfico standard, a direção Norte é 0° e o sentido dos ponteiros do relógio leva a direção Leste (Este) aos exatos 90°."
  },
  {
    q: "A operação de visar um ponto anterior (de coordenadas conhecidas) para orientar ou zerar o círculo angular do equipamento designa-se:",
    options: ["Irradiação Plena", "Nivelamento Trigonométrico", "Visada a Ré (Orientação da Estação)", "Transporte de Cotas Altimétricas"],
    correct: 2,
    explanation: "A Visada a Ré é o procedimento de referenciar a Estação Total ou Teodolito a uma linha base conhecida para que as futuras medições (Vantes) partam de um azimute ou zero validado."
  },
  {
    q: "Qual é o valor máximo que um Rumo pode atingir em termos absolutos?",
    options: ["90°", "180°", "270°", "360°"],
    correct: 0,
    explanation: "O Rumo restringe-se ao valor de 0° a 90°, sendo sempre referido e medido a partir da extremidade Norte ou da extremidade Sul, convergindo para Este ou Oeste."
  },
  {
    q: "Para determinar a posição de uma antena de telecomunicações inacessível no alto de um edifício, qual o método ideal?",
    options: ["Caminhamento Aberto", "Irradiação Padrão", "Interseção a partir de bases conhecidas", "Rastreio Estático Rápido"],
    correct: 2,
    explanation: "Na Interseção Angular, medem-se apenas os ângulos (α e β) para o ponto alvo a partir de duas ou mais estações de coordenadas conhecidas, calculando o vértice sem medição direta de distância."
  },
  {
    q: "Se o Rumo calculado de um alinhamento vante é S 60° W, o seu Rumo a ré (Contra-Rumo) será:",
    options: ["N 60° E", "S 60° E", "N 30° E", "N 60° W"],
    correct: 0,
    explanation: "O Contra-Rumo possui exatamente o mesmo valor numérico angular, alterando-se apenas as componentes dos quadrantes em oposição: Sul (S) para Norte (N) e Oeste (W) para Este (E)."
  },
  {
    q: "Num levantamento, precisa converter um Rumo do 3º Quadrante (Sudoeste / SW) em Azimute. A operação matemática adequada será:",
    options: ["Azimute = Rumo", "Azimute = 180° - Rumo", "Azimute = 180° + Rumo", "Azimute = 360° - Rumo"],
    correct: 2,
    explanation: "No 3º quadrante, que se situa entre o Sul (180°) e o Oeste (270°), os azimutes são formados adicionando-se o valor absoluto do rumo aos 180° de base."
  },
  {
    q: "Ao analisar a consistência geométrica de uma Poligonal Fechada com 5 vértices, qual deverá ser a soma teórica dos seus ângulos internos?",
    options: ["360°", "540°", "720°", "900°"],
    correct: 1,
    explanation: "A soma teórica dos ângulos internos de um polígono fechado segue a equação matemática (n-2) x 180°. Para 5 vértices: (5-2) x 180° = 3 x 180° = 540°."
  },
  {
    q: "Qual o procedimento correto para tratar o Erro de Fecho Planimétrico (fecho linear) após a computação de uma poligonal fechada?",
    options: ["Ajustar logo os ângulos, pois são os causadores das falhas", "Pode ser ignorado desde que as cotas estejam corretas", "Compará-lo com a tolerância legal/técnica; se for inferior a esta tolerância, deve ser compensado nos cálculos", "Zerar artificialmente as discrepâncias de N e E nas coordenadas finais"],
    correct: 2,
    explanation: "Qualquer poligonal real possuirá erros inerentes. O rigor técnico exige calcular o erro linear (hipotenusa das diferenças das projeções) e, se estiver dentro do limite normativo do projeto, proceder à sua compensação."
  }
];

// --- COMPONENTE PRINCIPAL ---
export default function TopographyModulesApp() {
  const [activeTab, setActiveTab] = useState('azimutes');

  // Estados de Simulação
  const [azimute, setAzimute] = useState(45.5);
  const [anguloLido, setAnguloLido] = useState(90.0);
  const [metodoAtivo, setMetodoAtivo] = useState('caminhamento');

  // Estados IA
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");

  // Estados Exercícios (ATUALIZADOS PARA NAVEGAÇÃO LIVRE)
  const [currentEx, setCurrentEx] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // Guarda: { [exIndex]: { selected: index, isCorrect: boolean } }

  // Pontuação derivada dinamicamente das respostas corretas
  const score = Object.values(userAnswers).filter(ans => ans.isCorrect).length * 10;

  const delay = (ms) => new Promise(res => setTimeout(res, ms));

  useEffect(() => {
    setAiAnalysis("");
    // Removido o reset automático dos exercícios ao trocar de aba.
    // Assim, o utilizador não perde o progresso se for consultar a teoria numa outra aba!
  }, [activeTab, metodoAtivo]);

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis("");
    const apiKey = "";

    let promptContext = "";
    if(activeTab === 'azimutes') promptContext = `Simulador de Azimutes. Azimute atual: ${formatDegree(azimute)}. Rumo: ${formatDegree(calcularRumo(azimute).rumo)}. Explique uma aplicação prática disto no terreno.`;
    if(activeTab === 'metodos') promptContext = `Visualizando o método de ${metodoAtivo}. Dê um insight curto sobre a melhor situação prática para usar este método num levantamento topográfico real.`;
    if(activeTab === 'propagacao') promptContext = `Propagação de Azimutes. Az_vante = Az_ré + 180 + Angulo. Explique como um erro de leitura angular se propaga ao longo de uma poligonal.`;

    const prompt = `Como um instrutor sênior de topografia do laboratório AGlab (em português brasileiro claro e técnico), dê uma breve explicação (máximo de 3 frases) baseada neste contexto: ${promptContext}. Seja direto e inspirador.`;

    let text = "Módulo de Inteligência Artificial indisponível. Analise as ilustrações interativas e as métricas na tela.";

    if(apiKey) {
        for (let i = 0; i < 3; i++) {
          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            if(data.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = data.candidates[0].content.parts[0].text;
            }
            break;
          } catch (err) {
            await delay(1000 * (i + 1));
          }
        }
    } else {
        await delay(1200);
        text = "Análise Simulada do AGlab: A validação constante dos azimutes em cada estação garante que a rede de levantamento mantenha os seus parâmetros de tolerância exigidos pelos métodos abordados.";
    }

    setAiAnalysis(text);
    setIsAnalyzing(false);
  };

  // --- 1. MÓDULO AZIMUTES E RUMOS ---
  const renderMdlAzimutes = () => {
    const { rumo, quadrante, direcao } = calcularRumo(azimute);
    const size = 300, center = size / 2, radius = size / 2 - 40;
    const radians = (azimute - 90) * (Math.PI / 180);
    const x = center + radius * Math.cos(radians);
    const y = center + radius * Math.sin(radians);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in flex-1">
        <div className="lg:col-span-7 bg-[#081824] rounded-xl border border-[#1F3A5F] flex flex-col hud-border shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 grid-bg opacity-30"></div>
          <div className="px-5 py-4 border-b border-[#1F3A5F] bg-[#061219] z-10 flex justify-between">
            <h3 className="text-[#8aa2b5] text-xs font-bold uppercase tracking-widest flex items-center">
              <Crosshair size={14} className="mr-2" /> Representação Cartesiana (Target Radar)
            </h3>
          </div>
          <div className="flex-1 flex items-center justify-center p-8 z-10 relative">

            {/* Efeito de Sonar Subtil */}
            <div className="absolute w-[220px] h-[220px] rounded-full border border-[#195D83] radar-pulse pointer-events-none"></div>

            <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} className="overflow-visible drop-shadow-2xl">
              <circle cx={center} cy={center} r={radius} fill="#040d12" stroke={COLORS.azulAG} strokeWidth="2" strokeDasharray="4 4" />
              <circle cx={center} cy={center} r={radius * 0.66} fill="none" stroke={COLORS.azulAG} strokeWidth="1" strokeDasharray="2 4" />
              <line x1={center} y1={20} x2={center} y2={size - 20} stroke={COLORS.cinzaGrafite} strokeWidth="1" />
              <line x1={20} y1={center} x2={size - 20} y2={center} stroke={COLORS.cinzaGrafite} strokeWidth="1" />
              <text x={center} y={15} fill={COLORS.brancoGelo} fontFamily="Orbitron" fontSize="14" textAnchor="middle" fontWeight="bold">N</text>
              <text x={size - 5} y={center + 5} fill={COLORS.brancoGelo} fontFamily="Orbitron" fontSize="14" textAnchor="end" fontWeight="bold">E</text>

              {/* Arco Animado */}
              <path d={`M ${center} ${center - radius * 0.2} A ${radius * 0.2} ${radius * 0.2} 0 ${azimute > 180 ? 1 : 0} 1 ${center + (radius * 0.2) * Math.cos(radians)} ${center + (radius * 0.2) * Math.sin(radians)}`} fill="none" stroke={COLORS.azulTecnico} strokeWidth="4" />

              <line x1={center} y1={center} x2={x} y2={y} stroke={COLORS.verdeTecnico} strokeWidth="3" strokeLinecap="round" />
              <circle cx={x} cy={y} r="6" fill="#061219" stroke={COLORS.verdeTecnico} strokeWidth="2" />
              <circle cx={center} cy={center} r="4" fill={COLORS.brancoGelo} />

              <text x={x + (x > center ? 15 : -15)} y={y + (y > center ? 15 : -15)} fill={COLORS.verdeTecnico} fontFamily="Orbitron" fontSize="12" textAnchor={x > center ? "start" : "end"}>
                {formatDegree(azimute)}
              </text>
            </svg>
          </div>
          <div className="p-6 border-t border-[#1F3A5F] bg-[#061219]/80 backdrop-blur z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#8aa2b5] uppercase">Varredura de Azimute (Hz)</span>
              <span className="font-tech text-sm text-[#F4F7F8]">{formatDegree(azimute)}</span>
            </div>
            <input type="range" min="0" max="359.99" step="0.1" value={azimute} onChange={(e) => setAzimute(parseFloat(e.target.value))} />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-[#0f1f33] border border-[#195D83] rounded-lg p-5">
            <h4 className="text-xs text-[#8aa2b5] uppercase tracking-wider font-semibold mb-2">Azimute Relativo ao Norte</h4>
            <span className="font-tech text-4xl text-[#F4F7F8]">{formatDegree(azimute)}</span>
          </div>
          <div className="bg-[#081824] border border-[#2B2F34] rounded-lg p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5"><Compass size={100} /></div>
            <h4 className="text-xs text-[#8aa2b5] uppercase tracking-wider font-semibold mb-4">Conversão Cartográfica (Rumo)</h4>
            <div className="flex items-center mb-4">
              <span className="font-tech text-4xl text-[#90B728] mr-3">{quadrante.charAt(0)}</span>
              <span className="font-tech text-3xl text-[#F4F7F8]">{formatDegree(rumo)}</span>
              <span className="font-tech text-4xl text-[#90B728] ml-3">{quadrante.length > 1 ? quadrante.charAt(1) : ''}</span>
            </div>
            <div className="border-t border-[#2B2F34] pt-4 mt-2 text-sm">
              <span className="block text-[10px] text-[#8aa2b5] uppercase">Quadrante Espacial</span>
              <strong className="text-white">{direcao} ({quadrante})</strong>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- 2. MÓDULO MÉTODOS DE LEVANTAMENTO (ILUSTRADOS E ANIMADOS) ---
  const renderMdlMetodos = () => {
    return (
      <div className="animate-fade-in flex-1 flex flex-col">
        {/* Subnav Metodos */}
        <div className="flex space-x-2 mb-6 border-b border-[#1F3A5F] pb-4 overflow-x-auto">
           {['caminhamento', 'irradiacao', 'intersecao'].map(met => (
             <button
                key={met}
                onClick={() => setMetodoAtivo(met)}
                className={`px-4 py-2 rounded text-sm uppercase tracking-wider font-tech transition-colors whitespace-nowrap ${metodoAtivo === met ? 'bg-[#90B728] text-black' : 'bg-[#0f1f33] text-[#8aa2b5] border border-[#1F3A5F] hover:text-white'}`}
             >
               {met === 'caminhamento' ? 'Caminhamento (Poligonal)' : met === 'irradiacao' ? 'Irradiação' : 'Interseção'}
             </button>
           ))}
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VISUALIZAÇÃO INTERATIVA SVG */}
          <div className="bg-[#081824] rounded-xl border border-[#1F3A5F] p-6 flex items-center justify-center relative overflow-hidden hud-border shadow-inner min-h-[300px]">
             <div className="absolute inset-0 grid-bg opacity-30"></div>

             {metodoAtivo === 'caminhamento' && (
               <svg key="cam" width="100%" height="100%" viewBox="0 0 400 300" className="z-10 relative">
                 {/* Estações/Pontos */}
                 <path d="M 50 250 L 150 100 L 280 140 L 350 220" fill="none" stroke={COLORS.azulTecnico} strokeWidth="2" strokeDasharray="4 4" />
                 <path d="M 50 250 L 150 100 L 280 140 L 350 220" fill="none" stroke={COLORS.verdeTecnico} strokeWidth="3" className="anim-draw" />

                 <circle cx="50" cy="250" r="8" fill={COLORS.azulAG} stroke={COLORS.brancoGelo} strokeWidth="2" />
                 <text x="35" y="245" fill={COLORS.brancoGelo} fontSize="12" fontFamily="Orbitron">E1</text>

                 <circle cx="150" cy="100" r="8" fill={COLORS.azulAG} stroke={COLORS.brancoGelo} strokeWidth="2" />
                 <text x="135" y="90" fill={COLORS.brancoGelo} fontSize="12" fontFamily="Orbitron">E2</text>

                 <circle cx="280" cy="140" r="8" fill={COLORS.azulAG} stroke={COLORS.brancoGelo} strokeWidth="2" />
                 <text x="270" y="125" fill={COLORS.brancoGelo} fontSize="12" fontFamily="Orbitron">E3</text>

                 <circle cx="350" cy="220" r="8" fill={COLORS.azulAG} stroke={COLORS.brancoGelo} strokeWidth="2" />
                 <text x="360" y="235" fill={COLORS.brancoGelo} fontSize="12" fontFamily="Orbitron">E4</text>
               </svg>
             )}

             {metodoAtivo === 'irradiacao' && (
               <svg key="irr" width="100%" height="100%" viewBox="0 0 400 300" className="z-10 relative">
                 {/* Estação Central */}
                 <circle cx="200" cy="150" r="10" fill={COLORS.verdeTecnico} className="radar-pulse" />
                 <circle cx="200" cy="150" r="8" fill={COLORS.azulAG} stroke={COLORS.verdeTecnico} strokeWidth="2" />
                 <text x="185" y="135" fill={COLORS.brancoGelo} fontSize="12" fontFamily="Orbitron">Base</text>

                 {/* Raios Animados */}
                 <path d="M 200 150 L 80 80" fill="none" stroke={COLORS.azulTecnico} strokeWidth="2" className="anim-draw-fast" style={{animationDelay: '0.1s'}} />
                 <path d="M 200 150 L 320 60" fill="none" stroke={COLORS.azulTecnico} strokeWidth="2" className="anim-draw-fast" style={{animationDelay: '0.3s'}} />
                 <path d="M 200 150 L 350 200" fill="none" stroke={COLORS.azulTecnico} strokeWidth="2" className="anim-draw-fast" style={{animationDelay: '0.5s'}} />
                 <path d="M 200 150 L 120 260" fill="none" stroke={COLORS.azulTecnico} strokeWidth="2" className="anim-draw-fast" style={{animationDelay: '0.7s'}} />
                 <path d="M 200 150 L 50 180" fill="none" stroke={COLORS.azulTecnico} strokeWidth="2" className="anim-draw-fast" style={{animationDelay: '0.9s'}} />

                 {/* Pontos Irradiados */}
                 <circle cx="80" cy="80" r="4" fill={COLORS.brancoGelo} /><text x="60" y="75" fill="#8aa2b5" fontSize="10">P1</text>
                 <circle cx="320" cy="60" r="4" fill={COLORS.brancoGelo} /><text x="330" y="55" fill="#8aa2b5" fontSize="10">P2</text>
                 <circle cx="350" cy="200" r="4" fill={COLORS.brancoGelo} /><text x="360" y="195" fill="#8aa2b5" fontSize="10">P3</text>
                 <circle cx="120" cy="260" r="4" fill={COLORS.brancoGelo} /><text x="100" y="275" fill="#8aa2b5" fontSize="10">P4</text>
                 <circle cx="50" cy="180" r="4" fill={COLORS.brancoGelo} /><text x="30" y="175" fill="#8aa2b5" fontSize="10">P5</text>
               </svg>
             )}

             {metodoAtivo === 'intersecao' && (
               <svg key="int" width="100%" height="100%" viewBox="0 0 400 300" className="z-10 relative">
                 {/* Estações Conhecidas */}
                 <circle cx="100" cy="220" r="8" fill={COLORS.azulAG} stroke={COLORS.brancoGelo} strokeWidth="2" />
                 <text x="80" y="240" fill={COLORS.brancoGelo} fontSize="12" fontFamily="Orbitron">E1 (Base)</text>
                 <circle cx="300" cy="220" r="8" fill={COLORS.azulAG} stroke={COLORS.brancoGelo} strokeWidth="2" />
                 <text x="280" y="240" fill={COLORS.brancoGelo} fontSize="12" fontFamily="Orbitron">E2 (Base)</text>

                 <path d="M 100 220 L 300 220" fill="none" stroke={COLORS.cinzaGrafite} strokeWidth="2" strokeDasharray="4 4" />

                 {/* Interseção Animada */}
                 <path d="M 100 220 L 200 80" fill="none" stroke={COLORS.verdeTecnico} strokeWidth="2" className="anim-draw-fast" />
                 <path d="M 300 220 L 200 80" fill="none" stroke={COLORS.verdeTecnico} strokeWidth="2" className="anim-draw-fast" style={{animationDelay: '0.5s'}} />

                 {/* Ponto Calculado */}
                 <circle cx="200" cy="80" r="6" fill={COLORS.alertaVemelho} className="anim-draw-fast" style={{opacity: 0, animation: 'fadeIn 0.5s forwards 1.2s'}} />
                 <text x="215" y="75" fill={COLORS.alertaVemelho} fontSize="12" fontFamily="Orbitron" style={{opacity: 0, animation: 'fadeIn 0.5s forwards 1.2s'}}>Ponto Alvo</text>

                 {/* Arcos de Angulo */}
                 <path d="M 130 220 A 30 30 0 0 0 115 195" fill="none" stroke={COLORS.azulTecnico} strokeWidth="2" />
                 <text x="135" y="200" fill={COLORS.azulTecnico} fontSize="10">α</text>
                 <path d="M 270 220 A 30 30 0 0 1 285 195" fill="none" stroke={COLORS.azulTecnico} strokeWidth="2" />
                 <text x="255" y="200" fill={COLORS.azulTecnico} fontSize="10">β</text>
               </svg>
             )}
          </div>

          {/* TEORIA E EXPLICAÇÃO */}
          <div className="bg-[#0f1f33] rounded-xl border border-[#2B2F34] p-6 flex flex-col justify-center">
             <div className="mb-4">
                <span className="bg-[#195D83] text-[#F4F7F8] text-[10px] px-2 py-1 rounded font-tech mb-3 inline-block">MANUAL TÉCNICO</span>
                <h2 className="text-2xl font-tech text-white mb-2">
                  {metodoAtivo === 'caminhamento' ? 'Caminhamento (Poligonal)' : metodoAtivo === 'irradiacao' ? 'Irradiação' : 'Interseção'}
                </h2>
             </div>

             {metodoAtivo === 'caminhamento' && (
                <p className="text-[#8aa2b5] leading-relaxed text-sm">
                  O <strong>Caminhamento</strong> consiste numa série de linhas consecutivas, cujos comprimentos e direções (azimutes ou deflexões) são medidos em campo. Este método é a base para a criação da <em>espinha dorsal</em> de controlo de um levantamento. Ideal para levantamentos viários, rios ou limites de grandes propriedades. Pode ser uma poligonal fechada (onde o ponto de partida e chegada são o mesmo, permitindo verificar erros) ou aberta.
                </p>
             )}
             {metodoAtivo === 'irradiacao' && (
                <p className="text-[#8aa2b5] leading-relaxed text-sm">
                  Na <strong>Irradiação</strong>, a estação total é instalada num único ponto de coordenadas conhecidas (Base). A partir daí, visam-se diversos pontos de detalhe, medindo para cada um o ângulo horizontal e a distância. É o método mais produtivo para levantamento cadastral, planimétrico de terrenos e preenchimento de detalhes ao redor da poligonal principal. Assemelha-se aos raios de uma roda de bicicleta a partir do eixo central.
                </p>
             )}
             {metodoAtivo === 'intersecao' && (
                <p className="text-[#8aa2b5] leading-relaxed text-sm">
                  A <strong>Interseção</strong> é utilizada para determinar a posição de um ponto inacessível ou difícil de alcançar com o prisma (ex: pico de uma montanha, torre de uma igreja). Consiste em instalar o equipamento em duas estações de base conhecidas e medir apenas os ângulos horizontais (α e β) para o ponto alvo. O cálculo analítico das coordenadas do ponto alvo é feito através de trigonometria e cruzamento das visadas, sem necessidade de medir a distância.
                </p>
             )}
          </div>
        </div>
      </div>
    );
  };

  // --- 3. MÓDULO PROPAGAÇÃO DE AZIMUTES ---
  const renderMdlPropagacao = () => {
    let azRe = azimute;
    let anguloInterno = anguloLido;
    let azVante = azRe + 180 + anguloInterno;
    if (azVante >= 540) azVante -= 540;
    else if (azVante >= 360) azVante -= 360;

    return (
      <div className="flex flex-col h-full animate-fade-in flex-1">
        <div className="bg-[#081824] rounded-xl border border-[#1F3A5F] p-6 mb-6 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><TrendingUp size={120} /></div>
           <h3 className="text-[#8aa2b5] text-xs font-bold uppercase tracking-widest mb-4 flex items-center">
             <Layers size={16} className="mr-2"/> Algoritmo de Cálculo Analítico da Poligonal
           </h3>
           <div className="bg-[#061219] border border-[#2B2F34] rounded-lg p-6 flex flex-col md:flex-row items-center justify-between font-tech text-lg gap-4">
             <div className="text-center w-full md:w-auto">
                <span className="text-[10px] text-[#8aa2b5] block mb-2">AZIMUTE ANTERIOR</span>
                <span className="text-white text-2xl">{formatDegree(azRe)}</span>
             </div>
             <span className="text-[#195D83] text-xl font-bold">+ 180° +</span>
             <div className="text-center w-full md:w-auto">
                <span className="text-[10px] text-[#8aa2b5] block mb-2">ÂNGULO MEDIDO</span>
                <span className="text-[#90B728] text-2xl">{formatDegree(anguloInterno)}</span>
             </div>
             <span className="text-[#195D83] text-xl font-bold">=</span>
             <div className="text-center bg-[#1F3A5F] px-6 py-4 rounded border border-[#90B728] w-full md:w-auto shadow-lg shadow-[#90b728]/10">
                <span className="text-[10px] text-[#90B728] block mb-1">AZIMUTE SEGUINTE (VANTE)</span>
                <span className="text-white text-3xl font-bold">{formatDegree(azVante)}</span>
             </div>
           </div>
           <p className="text-xs text-[#8aa2b5] mt-4 text-center">A fórmula subtrai automaticamente 360° ou 540° se o valor exceder o ciclo completo do círculo azimutal.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[#0f1f33] p-6 rounded-xl border border-[#2B2F34] hud-border">
             <label className="text-xs text-[#8aa2b5] uppercase mb-4 block border-b border-[#2B2F34] pb-2">1. Definir Azimute Inicial (Ré)</label>
             <div className="flex items-center justify-between mb-4">
               <Map className="text-[#195D83]" size={24} />
               <span className="font-tech text-2xl text-white">{formatDegree(azRe)}</span>
             </div>
             <input type="range" min="0" max="359.99" step="0.1" value={azRe} onChange={(e) => setAzimute(parseFloat(e.target.value))} className="w-full mb-2" />
           </div>
           <div className="bg-[#0f1f33] p-6 rounded-xl border border-[#2B2F34] hud-border">
             <label className="text-xs text-[#8aa2b5] uppercase mb-4 block border-b border-[#2B2F34] pb-2">2. Definir Ângulo Lido na Estação</label>
             <div className="flex items-center justify-between mb-4">
               <Target className="text-[#90B728]" size={24} />
               <span className="font-tech text-2xl text-[#90B728]">{formatDegree(anguloInterno)}</span>
             </div>
             <input type="range" min="0" max="359.99" step="0.1" value={anguloInterno} onChange={(e) => setAnguloLido(parseFloat(e.target.value))} className="w-full mb-2" />
           </div>
        </div>
      </div>
    );
  };

  // --- 4. MÓDULO DE EXERCÍCIOS GAMIFICADOS ---
  const renderMdlExercicios = () => {
    const ex = EXERCISES[currentEx];
    const currentAnswer = userAnswers[currentEx];

    const handleAnswer = (idx) => {
      if(currentAnswer) return; // Impede alterar a resposta após clicar
      const isCorrect = idx === ex.correct;
      setUserAnswers(prev => ({
        ...prev,
        [currentEx]: { selected: idx, isCorrect }
      }));
    };

    if(currentEx === 999) {
      return (
        <div className="flex-1 bg-[#081824] rounded-xl border border-[#195D83] flex flex-col items-center justify-center animate-fade-in p-8 text-center">
          <CheckCircle2 size={64} className="text-[#90B728] mb-4" />
          <h2 className="font-tech text-3xl text-white mb-2">Simulação Concluída!</h2>
          <p className="text-[#8aa2b5] mb-6">Testou os seus conhecimentos no laboratório AGlab.</p>
          <div className="bg-[#0f1f33] border border-[#2B2F34] px-12 py-6 rounded-lg mb-8">
            <span className="text-xs text-[#8aa2b5] uppercase block mb-2 font-bold tracking-widest">Pontuação Técnica Final</span>
            <span className="font-tech text-6xl text-[#90B728]">{score}</span> <span className="text-white text-xl">/ {EXERCISES.length * 10} XP</span>
          </div>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button onClick={() => setCurrentEx(0)} className="bg-transparent border border-[#1F3A5F] hover:bg-[#0f1f33] text-[#F4F7F8] px-6 py-3 rounded font-medium transition-colors text-sm font-tech">
              REVISAR RESPOSTAS
            </button>
            <button onClick={() => { setCurrentEx(0); setUserAnswers({}); }} className="bg-[#1F3A5F] hover:bg-[#195D83] border border-[#195D83] text-white px-6 py-3 rounded font-medium transition-colors text-sm font-tech">
              REINICIAR TESTE OPERACIONAL
            </button>
          </div>
        </div>
      )
    }

    return (
      <div className="animate-fade-in flex-1 flex flex-col">
        {/* Barra de Navegação Direta (Os números no topo) */}
        <div className="bg-[#0f1f33] rounded-xl border border-[#1F3A5F] p-4 mb-6 shadow-md">
          <div className="flex justify-between items-center mb-3">
             <span className="text-[#8aa2b5] text-[10px] uppercase font-bold tracking-widest">Painel de Navegação do Teste</span>
             <span className="text-[#90B728] font-tech text-sm bg-[#90B728]/10 px-3 py-1 rounded">Score: {score} XP</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXERCISES.map((_, idx) => {
              const ans = userAnswers[idx];
              let btnClass = "w-8 h-8 md:w-10 md:h-10 rounded flex items-center justify-center font-tech text-xs md:text-sm transition-colors cursor-pointer ";

              if (currentEx === idx) {
                btnClass += "ring-2 ring-white ring-offset-2 ring-offset-[#0f1f33] ";
              }

              if (ans) {
                btnClass += ans.isCorrect ? "bg-[#90B728] text-black font-bold " : "bg-[#E53935] text-white font-bold ";
              } else {
                btnClass += "bg-[#061219] border border-[#2B2F34] text-[#8aa2b5] hover:border-[#195D83] hover:text-white ";
              }

              return (
                <button key={idx} onClick={() => setCurrentEx(idx)} className={btnClass} title={`Questão ${idx + 1}`}>
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Área do Exercício Atual */}
        <div className="bg-[#0f1f33] rounded-xl border border-[#2B2F34] p-6 md:p-8 flex-1 flex flex-col relative overflow-hidden hud-border">
          <div className="flex items-start justify-between mb-8 z-10 border-b border-[#1F3A5F] pb-6">
             <h3 className="text-xl md:text-2xl font-medium text-white leading-relaxed">
               <span className="text-[#195D83] mr-3 font-tech">{currentEx + 1}.</span>{ex.q}
             </h3>
          </div>

          <div className="space-y-3 z-10 flex-1">
            {ex.options.map((opt, idx) => {
              let btnClass = "w-full text-left p-4 rounded border transition-all duration-300 font-tech text-sm md:text-base ";

              if (!currentAnswer) {
                // Não respondido ainda
                btnClass += "bg-[#061219] border-[#1F3A5F] hover:border-[#195D83] text-[#8aa2b5] hover:text-white hover:bg-[#081824]";
              } else if (idx === ex.correct) {
                // É a resposta correta (verde, independentemente se o utilizador a escolheu ou não)
                btnClass += "bg-[#90B728]/20 border-[#90B728] text-[#90B728] font-bold";
              } else if (currentAnswer && !currentAnswer.isCorrect && idx === currentAnswer.selected) {
                // O utilizador escolheu esta, e está errada (vermelho)
                btnClass += "bg-[#E53935]/20 border-[#E53935] text-[#E53935] line-through opacity-80";
              } else {
                // Outras respostas erradas que não foram escolhidas
                btnClass += "opacity-30 bg-[#061219] border-[#2B2F34] text-[#8aa2b5]";
              }

              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={!!currentAnswer} className={btnClass}>
                  <span className="inline-block w-8 font-bold opacity-70 text-[#195D83]">{String.fromCharCode(65 + idx)}.</span> {opt}
                </button>
              );
            })}
          </div>

          {currentAnswer && (
            <div className={`mt-8 p-5 rounded border animate-fade-in z-10 shadow-lg ${currentAnswer.isCorrect ? 'bg-[#90B728]/10 border-[#90B728]' : 'bg-[#E53935]/10 border-[#E53935]'}`}>
              <div className="flex items-center mb-3">
                {currentAnswer.isCorrect ? <CheckCircle2 size={24} className="text-[#90B728] mr-2" /> : <XCircle size={24} className="text-[#E53935] mr-2" />}
                <span className={`font-bold uppercase tracking-widest text-sm ${currentAnswer.isCorrect ? 'text-[#90B728]' : 'text-[#E53935]'}`}>
                  {currentAnswer.isCorrect ? 'CÁLCULO VALIDADO' : 'ERRO DE PROCEDIMENTO'}
                </span>
              </div>
              <p className="text-sm md:text-base text-[#F4F7F8] leading-relaxed">{ex.explanation}</p>
            </div>
          )}

          {/* Controles de Navegação (Anterior / Próximo) */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#2B2F34] z-10">
            <button
              onClick={() => setCurrentEx(Math.max(0, currentEx - 1))}
              disabled={currentEx === 0}
              className="flex items-center text-[#8aa2b5] hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors text-xs md:text-sm font-tech font-bold"
            >
              <ArrowLeftCircle size={20} className="mr-2" /> ANTERIOR
            </button>

            {currentEx < EXERCISES.length - 1 ? (
              <button
                onClick={() => setCurrentEx(currentEx + 1)}
                className="flex items-center bg-[#1F3A5F] hover:bg-[#195D83] border border-[#195D83] text-white px-4 md:px-6 py-2 md:py-3 rounded text-xs md:text-sm transition-colors font-tech font-bold"
              >
                PRÓXIMO <ArrowRightCircle size={18} className="ml-2" />
              </button>
            ) : (
              <button
                onClick={() => setCurrentEx(999)}
                className="flex items-center bg-[#90B728] hover:bg-[#7a9e1e] border border-[#90B728] text-black px-4 md:px-6 py-2 md:py-3 rounded text-xs md:text-sm transition-colors font-tech font-bold"
              >
                FINALIZAR TESTE <CheckCircle2 size={18} className="ml-2" />
              </button>
            )}
          </div>

          {/* Fundo Decorativo do Exercício */}
          <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none text-[250px] text-[#195D83] font-tech font-bold select-none leading-none">
             {currentEx + 1}
          </div>
        </div>
      </div>
    );
  };

  // --- NAVEGAÇÃO DA BARRA LATERAL ---
  const navItems = [
    { id: 'azimutes', label: 'Azimutes e Rumos', icon: Compass },
    { id: 'metodos', label: 'Métodos Ilustrados', icon: PenTool },
    { id: 'propagacao', label: 'Propagação Analítica', icon: TrendingUp },
    { id: 'exercicios', label: 'Exercícios (Teste)', icon: Activity }
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: fontStyles }} />
      <div className="min-h-screen flex flex-col md:flex-row bg-[#061219]">

        {/* SIDEBAR EDUCATIVA */}
        <aside className="w-full md:w-64 bg-[#040d12] border-r border-[#1F3A5F] flex flex-col flex-shrink-0 z-20 shadow-xl">
          <div className="p-6 border-b border-[#1F3A5F] flex flex-col items-start">
            <LogoAGLab width={130} />
            <span className="text-[#8aa2b5] text-[10px] mt-5 font-tech uppercase tracking-widest border border-[#1F3A5F] px-2 py-1 rounded bg-[#0f1f33] w-full text-center">
              Laboratório Virtual
            </span>
          </div>

          <nav className="p-4 space-y-2 flex-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center p-3 rounded text-left transition-all ${
                  activeTab === item.id
                  ? 'bg-[#1F3A5F] text-white border-l-2 border-[#90B728]'
                  : 'text-[#8aa2b5] hover:bg-[#0f1f33] hover:text-white'
                }`}
              >
                <item.icon size={18} className="mr-3 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ÁREA PRINCIPAL DINÂMICA */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto relative flex flex-col min-h-[600px]">
          {/* Fundo Decorativo */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#195D83] opacity-5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-6xl mx-auto w-full flex flex-col flex-1 z-10">

            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-[#1F3A5F] pb-4 shrink-0">
              <div>
                <h1 className="font-tech text-3xl text-[#F4F7F8] mb-2 flex items-center">
                  <Layers className="mr-3 text-[#195D83]" size={32} />
                  {activeTab === 'exercicios' ? 'Avaliação Operacional' : 'Processamento Geométrico'}
                </h1>
                <p className="text-[#8aa2b5] text-sm max-w-xl">
                   {activeTab === 'exercicios' ? 'Valide os conhecimentos adquiridos nos módulos de simulação analítica.' : 'Explore conceitos topográficos dinamicamente através do simulador AGlab.'}
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center px-3 py-2 bg-[#0f1f33] rounded border border-[#1F3A5F] text-xs font-tech cursor-pointer hover:border-[#90B728] transition-colors shadow-lg" onClick={handleAiAnalysis}>
                {isAnalyzing ? (
                  <div className="w-3 h-3 border-2 border-[#90B728] border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Sparkles size={14} className="text-[#90B728] mr-2" />
                )}
                <span className="hidden sm:inline">GERAR INSIGHT IA (MÓDULO)</span>
                <span className="sm:hidden">IA</span>
              </div>
            </header>

            {/* Painel Global de IA */}
            {aiAnalysis && (
              <div className="bg-[#0f1f33] border-l-4 border-[#90B728] p-4 rounded mb-6 text-sm text-[#F4F7F8] animate-fade-in shadow-lg relative">
                <strong className="text-[#90B728] font-tech text-xs flex items-center mb-2">
                  <Sparkles size={12} className="mr-2"/> INSIGHT AGlab (IA):
                </strong>
                {aiAnalysis}
                <button onClick={() => setAiAnalysis("")} className="absolute top-2 right-2 text-[#8aa2b5] hover:text-white">✕</button>
              </div>
            )}

            {/* Renderização do Módulo Ativo */}
            {activeTab === 'azimutes' && renderMdlAzimutes()}
            {activeTab === 'metodos' && renderMdlMetodos()}
            {activeTab === 'propagacao' && renderMdlPropagacao()}
            {activeTab === 'exercicios' && renderMdlExercicios()}

          </div>
        </main>
      </div>
    </>
  );
}
