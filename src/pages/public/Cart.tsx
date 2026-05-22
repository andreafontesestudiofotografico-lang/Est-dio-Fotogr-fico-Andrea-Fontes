import { Link, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, CreditCard, Check } from "lucide-react";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../services/AuthContext";
import { getPackage, getCouponByCode } from "../../services/cms";
import { calculatePricing } from "../../services/pricing";
import { Package, Coupon } from "../../types";
import { photographyExperiences } from "./Packages";

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
  
  const [loading, setLoading] = useState(true);
  const [pkg, setPkg] = useState<Package | null>(null);
  
  const [selectedProductionIds, setSelectedProductionIds] = useState<string[]>([]);

  // Cupom
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!pacoteId) {
        setLoading(false);
        return;
      }
      try {
        const data = await getPackage(pacoteId);
        if (data) {
          setPkg(data);
        } else {
          const local = photographyExperiences.find(p => p.id === pacoteId);
          if (local) setPkg(local as any);
        }
      } catch (err) {
        console.error("Erro ao carregar pacote:", err);
        const local = photographyExperiences.find(p => p.id === pacoteId);
        if (local) setPkg(local as any);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    
    const saved = sessionStorage.getItem("cartData");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed, nome: user?.displayName || parsed.nome, email: user?.email || parsed.email }));
        if (parsed.selectedProductionIds) {
          setSelectedProductionIds(parsed.selectedProductionIds);
        } else if (parsed.wantProduction) {
          setSelectedProductionIds(['legacy']);
        }
        if (parsed.appliedCoupon) setAppliedCoupon(parsed.appliedCoupon);
      } catch (e) {
        console.error("Failed to parse cartData", e);
      }
      sessionStorage.removeItem("cartData");
    }
  }, [user, pacoteId]);

  const opcaoIndex = opcaoIndexStr ? parseInt(opcaoIndexStr) : 0;
  const opcao = pkg?.options[opcaoIndex];
  
  const pricingParam = selectedProductionIds.join(",");
  const pricing = calculatePricing(pkg, opcaoIndex, pricingParam, appliedCoupon);

  const handleApplyCoupon = async () => {
    setCouponError("");
    if (!couponCode.trim()) return;
    
    try {
      const coupon = await getCouponByCode(couponCode.trim());
      if (coupon) {
        setAppliedCoupon(coupon);
        setCouponCode("");
      } else {
        setCouponError("Cupom inválido ou expirado.");
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError("Erro ao validar cupom.");
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg || !opcao) return;
    
    sessionStorage.setItem("cartData", JSON.stringify({ ...formData, selectedProductionIds, appliedCoupon }));

    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    
    let prodParamStr = pricing.selectedProductions.join(',');
    if (!prodParamStr) prodParamStr = '0'; // For empty
    
    const couponParam = pricing.appliedCouponCode ? encodeURIComponent(pricing.appliedCouponCode) : '';
    
    navigate(`/agendamento?pacote=${pkg.id}&opcao=${opcaoIndex}&nome=${encodeURIComponent(formData.nome)}&email=${encodeURIComponent(formData.email)}&prod=${prodParamStr}&cupom=${couponParam}`);
  };

  if (loading) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
       </div>
    );
  }

  if (!pkg || !opcao) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black uppercase mb-4">Seu carrinho está vazio</h1>
        <Link to="/pacotes" className="text-sm font-bold uppercase underline">Explorar Experiências</Link>
      </div>
    );
  }

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

              {pkg.productions?.filter(p => p.enabled).map(prod => (
                <div key={prod.id} className="mt-4 border border-gray-200 p-6 bg-gray-50 flex items-start gap-4 cursor-pointer" onClick={() => {
                  if (selectedProductionIds.includes(prod.id)) {
                     setSelectedProductionIds(selectedProductionIds.filter(id => id !== prod.id));
                  } else {
                     setSelectedProductionIds([...selectedProductionIds, prod.id]);
                  }
                }}>
                  <div className={`w-6 h-6 border ${selectedProductionIds.includes(prod.id) ? 'bg-black border-black' : 'bg-white border-gray-300'} flex items-center justify-center`}>
                    {selectedProductionIds.includes(prod.id) && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <h3 className="uppercase font-black text-sm mb-1 tracking-widest">{prod.name}</h3>
                    <p className="text-gray-500 text-sm font-medium">{prod.description}</p>
                    <p className="mt-2 text-xs font-black uppercase tracking-widest text-black">+ R$ {Number(prod.price).toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              ))}

              {(!pkg.productions || pkg.productions.length === 0) && pkg.hasProduction && pkg.productionPrice && (
                <div className="mt-8 border border-gray-200 p-6 bg-gray-50 flex items-start gap-4 cursor-pointer" onClick={() => {
                  if (selectedProductionIds.includes('legacy')) {
                     setSelectedProductionIds(selectedProductionIds.filter(id => id !== 'legacy'));
                  } else {
                     setSelectedProductionIds([...selectedProductionIds, 'legacy']);
                  }
                }}>
                  <div className={`w-6 h-6 border ${selectedProductionIds.includes('legacy') ? 'bg-black border-black' : 'bg-white border-gray-300'} flex items-center justify-center`}>
                    {selectedProductionIds.includes('legacy') && <Check className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <h3 className="uppercase font-black text-sm mb-1 tracking-widest">Desejo Produção Profissional</h3>
                    <p className="text-gray-500 text-sm font-medium">{pkg.productionDesc || "Adicionar equipe de beleza para o ensaio."}</p>
                    <p className="mt-2 text-xs font-black uppercase tracking-widest text-black">+ R$ {pkg.productionPrice?.toFixed(2).replace('.', ',')}</p>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-5">
            <div className="bg-gray-50 p-8 border border-gray-200 sticky top-32">
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
                {pricing.chargedItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span className="text-gray-500">{item.name}</span>
                    <span className={idx > 0 ? "text-black" : ""}>{item.price === 0 ? "R$ 0,00" : (idx > 0 ? "+ " : "") + `R$ ${item.price.toFixed(2).replace('.', ',')}`}</span>
                  </div>
                ))}
                
                {pricing.appliedCouponCode && (
                  <div className="flex justify-between text-green-600 border-t border-gray-100 pt-4 mt-2">
                    <span className="font-bold flex items-center gap-2">
                      Cupom: {pricing.appliedCouponCode}
                      <button onClick={removeCoupon} className="text-xs text-red-500 uppercase tracking-widest hover:underline ml-2">Remover</button>
                    </span>
                    <span>- R$ {pricing.discountAmount.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
              </div>

              {/* Cupom Form */}
              {!pricing.appliedCouponCode && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Cupom de Desconto</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="CÓDIGO"
                      className="w-full border border-gray-300 p-3 text-sm font-medium focus:border-black outline-none tracking-widest uppercase"
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="bg-black text-white px-4 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-2 font-bold">{couponError}</p>}
                </div>
              )}

              <div className="flex justify-between mb-8 items-end">
                <span className="font-black uppercase tracking-widest text-sm">Total</span>
                <span className="font-black text-3xl tracking-tighter">R$ {pricing.total.toFixed(2).replace('.', ',')}</span>
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
