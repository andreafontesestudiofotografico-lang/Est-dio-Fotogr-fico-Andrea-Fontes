import { Link } from "react-router-dom";
import { Instagram, Facebook, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black pt-20 pb-10 px-4 sm:px-8 text-white">
      <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
        <div className="md:col-span-2 pr-10">
          <h2 className="font-black tracking-tighter text-3xl mb-6 uppercase">Andrea Fontes</h2>
          <p className="text-gray-400 text-sm max-w-sm font-medium leading-relaxed">
            Transformando momentos reais em experiências visuais sofisticadas e memórias eternas.
          </p>
        </div>
        <div>
          <h3 className="font-black uppercase tracking-widest mb-6 text-[12px] text-gray-500">Shop / Coleções</h3>
          <ul className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest">
            <li><Link to="/pacotes" className="hover:text-gray-400 transition-colors">Ver Pacotes</Link></li>
            <li><Link to="/#portfolio" className="hover:text-gray-400 transition-colors">Portfólio</Link></li>
            <li><Link to="/login" className="hover:text-gray-400 transition-colors">Área do Cliente</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-black uppercase tracking-widest mb-6 text-[12px] text-gray-500">Suporte</h3>
          <ul className="flex flex-col gap-4 text-xs font-bold uppercase tracking-widest text-gray-300">
            <li><span className="hover:text-white transition-colors cursor-pointer">contato@andreafontes.com</span></li>
            <li><a href="https://wa.me/5591981638703" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors cursor-pointer">+55 91 98163-8703</a></li>
            <li className="flex gap-6 mt-4">
              <a href="https://www.instagram.com/andrea_fontes_fotografia?utm_source=qr&igsh=NnU1Nnk3NGczemdu" target="_blank" rel="noopener noreferrer" className="hover:text-gray-400 text-white transition-colors"><Instagram className="w-5 h-5 stroke-[2]" /></a>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto pt-8 border-t border-white/20 flex flex-col md:flex-row items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest">
        <span>© {new Date().getFullYear()} ANDREA FONTES. TODOS OS DIREITOS RESERVADOS.</span>
        <div className="flex gap-6 mt-4 md:mt-0">
          <span className="hover:text-white transition-colors cursor-pointer">Termos</span>
          <span className="hover:text-white transition-colors cursor-pointer">Privacidade</span>
        </div>
      </div>
    </footer>
  );
}
