import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPackages } from "../../services/cms";
import { Package } from "../../types";

export const photographyExperiences = [
  {
    id: "gestante",
    title: "Ensaio Gestante",
    image: "https://images.unsplash.com/photo-1519014816548-bf5fe059e98b?q=80&w=2669&auto=format&fit=crop",
    shortDesc: "Eternize amor e expectativa.",
    desc: "Registrar a maternidade é eternizar amor, conexão e expectativa em imagens únicas e emocionantes.",
    options: [
      {
        name: "SEM PRODUÇÃO",
        price: 350,
        includes: ["20 fotos tratadas", "Ensaio em estúdio ou externo", "1 look disponível no estúdio", "Acessórios inclusos", "Direcionamento completo de poses"]
      },
      {
        name: "COM PRODUÇÃO",
        price: 470,
        includes: ["25 fotos tratadas", "Produção completa de cabelo e maquiagem", "2 figurinos", "Acessórios inclusos", "Direcionamento completo"]
      }
    ],
    info: {
      prazo: "15 dias úteis",
      periodo_ideal: "27 a 30 semanas",
      agendamento: "50% antecipado",
      entrega: "Fotos digitais"
    }
  },
  {
    id: "aniversario",
    title: "Aniversário",
    image: "https://images.unsplash.com/photo-1530103862676-de38964afaf1?q=80&w=2670&auto=format&fit=crop",
    shortDesc: "Celebre um novo ciclo.",
    desc: "Um ensaio focado em celebrar você, capturando sua essência festiva e marcando o início de um novo ano.",
    options: [
      {
        name: "PADRÃO",
        price: 300,
        includes: ["20 fotos tratadas", "Até 2 looks", "Direção de poses", "Ensaio personalizado"]
      }
    ],
    info: {
      prazo: "15 dias úteis",
      producao: "Opcional por R$ 120,00",
      agendamento: "15 dias de antecedência",
      entrega: "WhatsApp/documento"
    }
  },
  {
    id: "casal",
    title: "Casal",
    image: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=2668&auto=format&fit=crop",
    shortDesc: "A cumplicidade em formato de arte.",
    desc: "Guarde os olhares e o romance em uma estética editorial que traduz a conexão de vocês.",
    options: [
      {
        name: "PADRÃO",
        price: 350,
        includes: ["20 fotos tratadas", "1 hora de ensaio", "Até 2 trocas de roupa", "Estúdio ou externo", "Direção completa de poses"]
      }
    ],
    info: {
      prazo: "15 dias úteis",
      producao: "Opcional por R$ 120,00",
      agendamento: "50% antecipado",
      contrato: "Envio automático após contratação"
    }
  },
  {
    id: "casamento",
    title: "Casamento",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=2670&auto=format&fit=crop",
    shortDesc: "A elegância do seu grande dia.",
    desc: "Registros poéticos e com qualidade cinematográfica do dia mais especial da sua vida.",
    options: [
      {
        name: "COMPLETO",
        price: 2500,
        includes: ["Cobertura completa", "Making of", "Cerimônia e Festa", "Ensaio Pós-Wedding", "Álbum Fine Art opcional"]
      }
    ],
    info: {
      prazo: "30 dias úteis",
      producao: "Reunião de alinhamento",
      agendamento: "Contrato e reserva de data"
    }
  },
  {
    id: "formatura",
    title: "Formatura",
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2670&auto=format&fit=crop",
    shortDesc: "O marco da sua vitória.",
    desc: "A consagração dos seus anos de estudo com fotos de presença e impacto.",
    options: [
      {
        name: "PADRÃO",
        price: 450,
        includes: ["Fotos individuais", "Com familiares", "Estúdio ou área externa", "Direção de poses"]
      }
    ],
    info: {}
  },
  {
    id: "colacao",
    title: "Colação",
    image: "https://images.unsplash.com/photo-1562240020-ce31ccb0fa7d?q=80&w=2574&auto=format&fit=crop",
    shortDesc: "O momento da sua conquista.",
    desc: "Cobertura fotográfica da sua colação de grau com discrição e qualidade editorial.",
    options: [
      {
        name: "COBERTURA",
        price: 350,
        includes: ["Momento do canudo", "Fotos com convidados", "Protocolo completo"]
      }
    ],
    info: {}
  },
  {
    id: "natal",
    title: "Natal",
    image: "https://images.unsplash.com/photo-1543258103-a62bdc068305?q=80&w=2667&auto=format&fit=crop",
    shortDesc: "A magia da família.",
    desc: "Ensaios sazonais em cenários conceituais para registrar o calor e a essência natalina.",
    options: [
      {
        name: "MINI ENSAIO",
        price: 250,
        includes: ["Cenário exclusivo", "30 minutos de sessão", "15 fotos tratadas", "Estilo lifestyle"]
      }
    ],
    info: {}
  },
  {
    id: "dia-das-maes",
    title: "Dia das Mães",
    image: "https://images.unsplash.com/photo-1544126592-807ade215a0b?q=80&w=2670&auto=format&fit=crop",
    shortDesc: "Herança e raízes.",
    desc: "Celebre o vínculo mais forte através de uma experiência de estúdio sensível e luminosa.",
    options: [
      {
        name: "MINI ENSAIO",
        price: 300,
        includes: ["Cenário acolhedor", "40 minutos de sessão", "20 fotos tratadas", "Fotos em família"]
      }
    ],
    info: {}
  },
  {
    id: "documento",
    title: "Foto para Documento",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2670&auto=format&fit=crop",
    shortDesc: "Seu cartão de visitas.",
    desc: "Retratos coorporativos e para documentos com a qualidade, luz e postura correta.",
    options: [
      {
        name: "RETRATO",
        price: 150,
        includes: ["Fundo neutro", "Iluminação premium", "Tratamento suave", "Entrega expressa"]
      }
    ],
    info: {}
  },
  {
    id: "sensual",
    title: "Sensual",
    image: "https://images.unsplash.com/photo-1516726817505-f5ed825624d8?q=80&w=2574&auto=format&fit=crop",
    shortDesc: "Autoconfiança e poder.",
    desc: "Ensaio Boudoir que resgata e enaltece a sua autoestima, conduzido com respeito e direção artística.",
    options: [
      {
        name: "PADRÃO",
        price: 550,
        includes: ["Direção corporal", "2 horas de ensaio", "Sigilo total garantido", "Looks e figurinos"]
      }
    ],
    info: {}
  },
  {
    id: "publicitario",
    title: "Publicitário",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2670&auto=format&fit=crop",
    shortDesc: "Eleve o visual da sua marca.",
    desc: "Produção fotográfica focada em moda e lifestyle para marcas que buscam alto padrão.",
    options: [
      {
        name: "DIÁRIA",
        price: 1800,
        includes: ["Direção criativa", "Consultoria de imagem", "Equipamento profissional", "Entrega em alta e web"]
      }
    ],
    info: {}
  }
];

export default function Packages() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const pkgs = await getPackages();
        if (pkgs.length > 0) {
          setPackages(pkgs.filter(p => p.active && p.showInPackages));
        } else {
          // Fallback if db is completely empty
          setPackages(photographyExperiences as any[]);
        }
      } catch (err) {
        console.error("Failed to fetch packages", err);
        setPackages(photographyExperiences as any[]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
       </div>
    );
  }

  return (
    <div className="pb-32 pt-16 px-4 sm:px-8 max-w-[1600px] mx-auto w-full bg-white text-black animate-in fade-in duration-500">
      <div className="text-center mb-20 max-w-2xl mx-auto">
        <h1 className="font-black text-4xl md:text-5xl lg:text-6xl mb-6 tracking-tighter uppercase">Experiências Fotográficas</h1>
        <p className="text-gray-500 text-sm md:text-base font-medium tracking-wide">
          Escolha a experiência ideal para transformar seus momentos em memórias inesquecíveis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
        {packages.map((pkg) => (
          <Link 
            to={`/pacote/${pkg.id}`}
            key={pkg.id} 
            className="group relative flex flex-col cursor-pointer overflow-hidden"
          >
            <div className="relative w-full aspect-[4/5] bg-gray-100 overflow-hidden mb-6">
               <img 
                 src={pkg.image} 
                 alt={pkg.title} 
                 className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
               />
               <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors duration-500" />
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                 <span className="bg-white text-black px-8 py-3 text-xs font-black uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                   Saiba Mais
                 </span>
               </div>
            </div>
            
            <div className="flex flex-col text-center">
              <h3 className="font-black text-2xl mb-2 tracking-tight uppercase">{pkg.title}</h3>
              <p className="text-sm text-gray-500 font-medium">{pkg.shortDesc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
