import { Link } from "react-router-dom";
import { Search, User, Menu, X, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Novidades", path: "/#novidades" },
    { name: "Ensaios", path: "/pacotes" },
    { name: "Promoções", path: "/pacotes" },
  ];

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Mobile Menu Button & Search */}
        <div className="flex-1 flex items-center space-x-4 lg:hidden">
          <button
            className="p-1 hover:text-gray-500 transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-5 h-5 stroke-[2]" /> : <Menu className="w-5 h-5 stroke-[2]" />}
          </button>
          <button className="hover:text-gray-500 transition-colors">
            <Search className="w-5 h-5 stroke-[2]" />
          </button>
        </div>

        {/* Left: Desktop Links */}
        <nav className="hidden lg:flex flex-1 items-center space-x-6 text-[12px] font-bold uppercase tracking-widest text-black">
          {links.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="hover:text-gray-500 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Center: Logo */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <Link to="/" className="font-black text-xl tracking-tighter text-black flex items-center uppercase">
            Andrea Fontes
          </Link>
        </div>

        {/* Right: Icons */}
        <div className="flex-1 flex justify-end items-center space-x-6 text-black">
          <div className="hidden lg:flex relative group cursor-pointer items-center text-[12px] font-bold uppercase tracking-widest hover:text-gray-500">
             <Search className="w-4 h-4 stroke-[2.5] mr-2" /> Buscar
          </div>
          <Link to="/login" className="hover:text-gray-500 transition-colors flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest">
            <User className="w-5 h-5 stroke-[2]" /> <span className="hidden lg:block">Entrar</span>
          </Link>
          <Link to="/pacotes" className="hover:text-gray-500 transition-colors flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest">
            <ShoppingBag className="w-5 h-5 stroke-[2]" /> <span className="hidden lg:block">Agendar</span>
          </Link>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-b border-gray-200 overflow-hidden"
          >
            <nav className="flex flex-col p-6 space-y-6 text-sm font-bold uppercase tracking-widest text-black">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="hover:text-gray-500 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-6 border-t border-gray-100 flex flex-col gap-6">
                <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-4 hover:text-gray-500">
                  <User className="w-5 h-5 stroke-[2]" /> Minha Conta
                </Link>
                <Link to="/pacotes" onClick={() => setIsOpen(false)} className="flex items-center gap-4 hover:text-gray-500">
                  <ShoppingBag className="w-5 h-5 stroke-[2]" /> Serviços / Agendar
                </Link>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
