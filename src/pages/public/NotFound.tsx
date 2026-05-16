import { Link } from "react-router-dom";
import { Camera } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black font-sans px-6 animate-in fade-in duration-500">
      <Camera className="w-16 h-16 mb-8 text-gray-300" />
      <h1 className="font-black tracking-tighter uppercase text-6xl md:text-8xl mb-4">404</h1>
      <h2 className="font-bold tracking-widest uppercase text-xl md:text-2xl mb-8 text-gray-500">Página Não Encontrada</h2>
      <p className="text-center max-w-md text-gray-500 font-medium mb-12">
        A foto que você procura não está nesta galeria. É possível que o link esteja incorreto ou a página tenha sido movida.
      </p>
      <Link 
        to="/" 
        className="bg-black text-white px-8 py-4 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
      >
        Voltar para a Home
      </Link>
    </div>
  );
}
