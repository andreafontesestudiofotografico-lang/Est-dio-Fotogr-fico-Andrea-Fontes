import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { photographyExperiences } from "./Packages";
import { ArrowLeft, CreditCard } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "../../services/AuthContext";
import { db } from "../../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function Cart() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const pacoteId = searchParams.get("pacote");
  const opcaoIndexStr = searchParams.get("opcao");
  
  const [formData, setFormData] = useState({
    nome: user?.displayName || "",
    email: user?.email || "",
    telefone: "",
    cpf: "",
  });
  
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const saved = sessionStorage.getItem("cartData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed, nome: user?.displayName || parsed.nome, email: user?.email || parsed.email }));
      } catch (e) {
        console.error("Failed to parse cartData", e);
      }
      sessionStorage.removeItem("cartData");
    }
  }, [user]);

  const pkg = photographyExperiences.find(p => p.id === pacoteId);
  const opcaoIndex = opcaoIndexStr ? parseInt(opcaoIndexStr) : 0;
  const opcao = pkg?.options[opcaoIndex];

  if (!pkg || !opcao) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black uppercase mb-4">Seu carrinho está vazio</h1>
        <Link to="/pacotes" className="text-sm font-bold uppercase underline">Explorar Experiências</Link>
      </div>
    );
  }

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      sessionStorage.setItem("cartData", JSON.stringify(formData));
      navigate('/login', { state: { from: location } });
      return;
    }
    
    setLoading(true);
    // Persist to session storage so Schedule can read it
    sessionStorage.setItem("cartData", JSON.stringify(formData));
    navigate(`/agendamento?pacote=${pkg.id}&opcao=${opcaoIndex}&nome=${encodeURIComponent(formData.nome)}&email=${encodeURIComponent(formData.email)}`);
  };

  return (
    <div className="bg-white min-h-screen pt-24 pb-24 px-4 sm:px-8 font-sans text-black animate-in fade-in duration-500">
      <div className="max-w-[1200px] mx-auto">
        <Link to={`/pacote/${pkg.id}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Link>

        <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-2">Finalizar Pedido</h1>
        <p className="text-gray-500 font-medium mb-12">Preencha seus dados para prosseguir com a contratação da sua experiência.</p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          
          {/* Formulário do Cliente */}
          <div className="lg:col-span-7">
            <h2 className="text-lg font-black uppercase tracking-widest mb-6 border-b border-gray-100 pb-4">Seus Dados</h2>
            <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Nome Completo</label>
                  <input 
                    type="text" 
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full border border-gray-300 p-4 font-medium focus:border-black focus:ring-0 outline-none transition-colors bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">E-mail</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-300 p-4 font-medium focus:border-black focus:ring-0 outline-none transition-colors bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Telefone / WhatsApp</label>
                  <input 
                    type="tel" 
                    required
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                    className="w-full border border-gray-300 p-4 font-medium focus:border-black focus:ring-0 outline-none transition-colors bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">CPF</label>
                  <input 
                    type="text" 
                    required
                    value={formData.cpf}
                    onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                    className="w-full border border-gray-300 p-4 font-medium focus:border-black focus:ring-0 outline-none transition-colors bg-gray-50"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-5">
            <div className="bg-gray-50 p-8 border border-gray-200">
              <h2 className="text-lg font-black uppercase tracking-widest mb-6 border-b border-gray-200 pb-4">Resumo do Pedido</h2>
              
              <div className="flex gap-4 mb-6">
                <div className="w-24 h-32 bg-gray-200 shrink-0 overflow-hidden">
                  <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col justify-center">
                  <h3 className="font-black text-lg uppercase tracking-tight">{pkg.title}</h3>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500">{opcao.name}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 text-sm font-medium">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>R$ {opcao.price.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taxas</span>
                  <span>Grátis</span>
                </div>
              </div>

              <div className="flex justify-between mb-8 items-end">
                <span className="font-black uppercase tracking-widest text-sm">Total</span>
                <span className="font-black text-3xl tracking-tighter">R$ {opcao.price.toFixed(2).replace('.', ',')}</span>
              </div>

              <button 
                type="submit"
                form="checkout-form"
                disabled={loading}
                className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CreditCard className="w-4 h-4" />
                {loading ? "Processando..." : "Prosseguir para Agendamento"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
