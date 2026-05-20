import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getPackage } from "../../services/cms";
import { Package } from "../../types";
import { Check, ArrowLeft, MessageCircle } from "lucide-react";
import { photographyExperiences } from "./Packages";

export default function PackageDetails() {
  const { id } = useParams<{ id: string }>();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const data = await getPackage(id);
        if (data) {
          setPkg(data);
        } else {
          // Verify if it exists in local data
          const local = photographyExperiences.find(p => p.id === id);
          if (local) setPkg(local as any);
        }
      } catch (err) {
        console.error("Failed to fetch package", err);
        const local = photographyExperiences.find(p => p.id === id);
        if (local) setPkg(local as any);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
       </div>
    );
  }

  if (!pkg) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black uppercase mb-4">Pacote não encontrado</h1>
        <Link to="/pacotes" className="text-sm font-bold uppercase underline">Voltar para pacotes</Link>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(`Olá Andrea Fontes! Tenho interesse no pacote '${pkg.title}' e gostaria de receber mais informações sobre disponibilidade, valores e detalhes do ensaio.`);
  const whatsappUrl = `https://wa.me/5591981638703?text=${whatsappMessage}`;

  return (
    <div className="bg-white min-h-screen text-black animate-in fade-in duration-500">
      {/*...rest remains exactly the same...*/}
      {/* Banner */}
      <div className="relative w-full h-[50vh] md:h-[70vh] bg-black">
        <img 
          src={pkg.image} 
          alt={pkg.title} 
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
          <Link to="/pacotes" className="absolute top-8 left-6 md:left-12 flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:text-gray-300 transition-colors z-20">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase mb-4 text-center">{pkg.title}</h1>
          <p className="text-lg md:text-xl font-medium tracking-widest uppercase text-white/90 text-center max-w-2xl">
            {pkg.shortDesc}
          </p>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
        {/* Left Column: Description & Extras */}
        <div className="lg:col-span-7">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Sobre a Experiência</h2>
          <p className="text-xl md:text-3xl font-medium leading-relaxed tracking-tight mb-16">
            {pkg.desc}
          </p>

          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Informações Adicionais</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-16 border-t border-gray-100 pt-8">
            {Object.entries(pkg.info || {}).map(([key, value]) => (
              <div key={key}>
                <h4 className="text-xs font-black uppercase tracking-widest mb-1 text-black">{key.replace('_', ' ')}</h4>
                <p className="text-sm font-medium text-gray-500">{value as string}</p>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-8">Como funciona</h2>
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="w-8 h-8 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black">1</div>
              <div>
                <h4 className="font-bold uppercase text-sm mb-1">Agendamento</h4>
                <p className="text-sm text-gray-500">Selecione o pacote e pague a reserva de 50% ou o valor total. Os 50% restantes são pagos no dia do ensaio.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-8 h-8 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black">2</div>
              <div>
                <h4 className="font-bold uppercase text-sm mb-1">O Ensaio</h4>
                <p className="text-sm text-gray-500">Realização do ensaio com direção completa, respeitando o seu estilo e a estética premium.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-8 h-8 shrink-0 rounded-full bg-gray-100 flex items-center justify-center text-xs font-black">3</div>
              <div>
                <h4 className="font-bold uppercase text-sm mb-1">Entrega</h4>
                <p className="text-sm text-gray-500">Você receberá acesso à nossa plataforma exclusiva para baixar as fotos em alta resolução ou solicitar álbuns.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Options */}
        <div className="lg:col-span-5">
          <div className="sticky top-32 space-y-8">
            {pkg.options.map((opt, i) => (
              <div key={i} className="border border-gray-200 p-8 flex flex-col bg-gray-50/50">
                <div className="mb-6">
                  <h3 className="font-black text-xl uppercase tracking-tighter mb-2">{opt.name}</h3>
                  <div className="text-4xl font-black tracking-tighter">
                    R$ {Number(opt.price || 0).toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {opt.includes.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm font-medium">
                      <Check className="w-4 h-4 mt-0.5 shrink-0 text-black" strokeWidth={3} />
                      <span className="text-gray-600">{item}</span>
                    </li>
                  ))}
                </ul>

                <Link 
                  to={`/carrinho?pacote=${pkg.id}&opcao=${i}`}
                  className="w-full py-4 bg-black text-white text-xs font-black uppercase tracking-widest text-center hover:bg-gray-800 transition-colors mb-3"
                >
                  Contratar Pacote
                </Link>
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 border border-black bg-transparent text-black text-xs font-black uppercase tracking-widest text-center hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Falar no WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
