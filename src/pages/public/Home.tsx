import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Pagination } from "swiper/modules";
import { photographyExperiences } from "./Packages";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";

export default function Home() {
  const heroSlides = [
    {
      image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=2670&auto=format&fit=crop",
      title: "ESSÊNCIA & MOVIMENTO",
      subtitle: "Fotografia cinematográfica para momentos inesquecíveis."
    },
    {
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=2670&auto=format&fit=crop",
      title: "MEMÓRIAS QUE RESPIRAM",
      subtitle: "Ensaios com estética editorial e emoção real."
    },
    {
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=2670&auto=format&fit=crop",
      title: "A SUA HISTÓRIA EM ARTE",
      subtitle: "Transformando momentos em experiências visuais únicas."
    }
  ];

  const destaques = photographyExperiences.filter((p) => ["casamento", "gestante", "casal", "sensual"].includes(p.id));
  const editoriais = photographyExperiences.filter((p) => ["publicitario", "formatura", "aniversario", "dia-das-maes"].includes(p.id));

  return (
    <div className="w-full bg-white font-sans text-black animate-in fade-in duration-500">
      {/* Hero Section */}
      <section className="relative w-full h-[80vh] md:h-screen bg-black">
        <Swiper
          modules={[Autoplay, EffectFade, Pagination]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          speed={1200}
          loop={true}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          className="w-full h-full hero-swiper"
        >
          {heroSlides.map((slide, index) => (
            <SwiperSlide key={index}>
              <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="absolute inset-0 w-full h-full object-cover scale-105 animate-image-pan"
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />
                
                <div className="relative z-20 text-center text-white px-6 w-full max-w-[1000px] flex flex-col items-center">
                  <h1 className="font-black text-5xl md:text-7xl lg:text-8xl tracking-tight mb-6 drop-shadow-md uppercase leading-[1.1]">
                    {slide.title}
                  </h1>
                  <p className="text-sm md:text-lg font-medium tracking-widest uppercase mb-10 drop-shadow-sm text-white/90 max-w-2xl">
                    {slide.subtitle}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center mt-2">
                    <Link to="/pacotes" className="inline-block bg-white text-black px-12 py-4 text-xs font-black tracking-widest hover:bg-gray-200 transition-colors uppercase">
                      Agendar Ensaio
                    </Link>
                    <Link to="/pacotes" className="inline-block border-2 border-white/80 text-white bg-transparent px-12 py-4 text-xs font-black tracking-widest hover:bg-white hover:text-black transition-colors uppercase backdrop-blur-sm">
                      Explorar Pacotes
                    </Link>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </section>

      {/* Experiências Mais Procuradas */}
      <section className="py-24 max-w-[1600px] mx-auto px-4 sm:px-8">
        <div className="text-center mb-20 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-black mb-4 uppercase">Experiências Mais Procuradas</h2>
          <p className="text-sm md:text-base text-gray-500 font-medium tracking-wide">
            Essência, autenticidade e conexão. Descubra os ensaios mais desejados do estúdio.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {destaques.map((pkg) => (
            <Link 
              key={pkg.id} 
              to={`/pacote/${pkg.id}`} 
              className="group flex flex-col items-center cursor-pointer overflow-hidden"
            >
              <div className="relative w-full aspect-[4/5] bg-gray-100 mb-6 overflow-hidden">
                <img 
                  src={pkg.image} 
                  alt={pkg.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                  <span className="bg-white text-black px-8 py-3 text-xs font-black uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    Saiba Mais
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-center px-4">
                <h3 className="font-black text-xl mb-2 tracking-tight uppercase">{pkg.title}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {pkg.shortDesc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Banner Cinematográfico */}
      <section className="py-12 max-w-[1600px] mx-auto px-4 sm:px-8">
        <div className="relative w-full aspect-[21/9] min-h-[500px] bg-black overflow-hidden flex items-center justify-center">
          <img 
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2670&auto=format&fit=crop" 
            alt="Fotografia Cinematográfica" 
            className="absolute inset-0 w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative z-10 text-center text-white p-6 max-w-3xl flex flex-col items-center mt-20">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-6 uppercase drop-shadow-md">
              Fotografia Cinematográfica
            </h2>
            <p className="text-sm md:text-lg font-medium tracking-widest uppercase mb-10 text-white/90">
              Estética editorial. Iluminação premium. Momentos inesquecíveis.
            </p>
            <Link to="/pacotes" className="inline-block bg-white text-black px-12 py-4 text-xs font-black tracking-widest hover:bg-gray-200 transition-colors uppercase">
              Descubra Nossa Arte
            </Link>
          </div>
        </div>
      </section>

      {/* Ensaios Editoriais */}
      <section className="py-24 max-w-[1600px] mx-auto px-4 sm:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-16 gap-6">
          <div className="text-center md:text-left">
             <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-black uppercase mb-4">Ensaios Editoriais</h2>
             <p className="text-sm md:text-base text-gray-500 font-medium tracking-wide">
               Produções exclusivas de alto padrão visual.
             </p>
          </div>
          <Link to="/pacotes" className="text-xs font-black uppercase tracking-widest text-black hover:text-gray-500 border-b-2 border-black pb-1 transition-colors">
            Ver Todos os Pacotes
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
           {editoriais.map((pkg, idx) => (
            <Link key={idx} to={`/pacote/${pkg.id}`} className="group flex flex-col items-center md:items-start cursor-pointer overflow-hidden">
              <div className="relative w-full aspect-[4/5] bg-gray-100 mb-6 overflow-hidden">
                <img 
                  src={pkg.image} 
                  alt={pkg.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                  <span className="bg-white text-black px-8 py-3 text-xs font-black uppercase tracking-widest translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                    Saiba Mais
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-center md:text-left w-full">
                <h3 className="font-black text-xl mb-2 tracking-tight uppercase">{pkg.title}</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">
                  {pkg.shortDesc}
                </p>
              </div>
            </Link>
           ))}
        </div>
      </section>
    </div>
  );
}
