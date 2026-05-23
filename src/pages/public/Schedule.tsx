import { Link, useSearchParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import { auth, db } from "../../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { getPackage, getCouponByCode, getSiteSettings } from "../../services/cms";
import { calculatePricing } from "../../services/pricing";
import { Package, Coupon, SiteSettings } from "../../types";
import { photographyExperiences } from "./Packages";

export default function Schedule() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const pacoteId = searchParams.get("pacote");
  const opcaoIndexStr = searchParams.get("opcao");
  const prodParam = searchParams.get("prod");
  const cupomParam = searchParams.get("cupom");

  const [pkg, setPkg] = useState<Package | null>(null);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [loadingPkg, setLoadingPkg] = useState(true);

  const opcaoIndex = opcaoIndexStr ? parseInt(opcaoIndexStr) : 0;
  
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedButtonTime, setSelectedButtonTime] = useState<string | null>(null);
  const [customTimeInput, setCustomTimeInput] = useState("");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      if (!pacoteId) return;
      try {
        const data = await getPackage(pacoteId);
        if (data) {
          setPkg(data);
        } else {
          const local = photographyExperiences.find(p => p.id === pacoteId);
          if (local) setPkg(local as any);
        }
        if (cupomParam) {
          const cupomData = await getCouponByCode(cupomParam);
          setCoupon(cupomData);
        }
        const settings = await getSiteSettings();
        setSiteSettings(settings);
      } catch (err) {
        console.error("Erro fetch", err);
        const local = photographyExperiences.find(p => p.id === pacoteId);
        if (local) setPkg(local as any);
      } finally {
        setLoadingPkg(false);
      }
    }
    init();
  }, [pacoteId, cupomParam]);

  const availableHours = ["09:00", "10:30", "14:00", "15:30", "17:00"];

  const isCustomTimeValid = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(customTimeInput);

  let time: string | null = null;
  if (selectedButtonTime) {
    time = selectedButtonTime;
  } else if (isCustomTimeValid) {
    time = customTimeInput;
    if (time.length === 4) {
      time = "0" + time;
    }
  }

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedButtonTime(null);
    let inputVal = e.target.value;
    
    if (customTimeInput.length > inputVal.length && 
        customTimeInput.replace(/\D/g, "") === inputVal.replace(/\D/g, "")) {
      inputVal = inputVal.slice(0, -1);
    }

    const digitsOnly = inputVal.replace(/\D/g, "");
    
    let formatted = digitsOnly;
    if (digitsOnly.length >= 3) {
      formatted = digitsOnly.substring(0, 2) + ":" + digitsOnly.substring(2, 4);
    }
    
    setCustomTimeInput(formatted);
  };

  const selectHour = (hour: string) => {
    setSelectedButtonTime(hour);
    setCustomTimeInput("");
  };
  
  if (loadingPkg) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
       </div>
    );
  }

  if (!pkg) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black uppercase mb-4">Erro no Agendamento</h1>
        <Link to="/pacotes" className="text-sm font-bold uppercase underline">Voltar para pacotes</Link>
      </div>
    );
  }
  
  // Calcular totais
  const opcao = pkg.options[opcaoIndex];
  
  const pricingParam = prodParam || "";
  const pricing = calculatePricing(pkg, opcaoIndex, pricingParam, coupon);

  const finalTotal = pricing.total;

  const cartDataRaw = sessionStorage.getItem("cartData");
  const cartData = cartDataRaw ? JSON.parse(cartDataRaw) : {};
  const clientName = cartData.nome || user?.displayName || "[Seu Nome]";
  const clientCpf = cartData.cpf || "[Seu CPF]";

  const handleConfirm = async () => {
    if (date && time && user) {
      setLoading(true);
      try {
        const dateStr = format(date, "yyyy-MM-dd");
        
        const cartDataRaw = sessionStorage.getItem("cartData");
        const cartData = cartDataRaw ? JSON.parse(cartDataRaw) : {};

        let contractSnapshotData = undefined;
        if (siteSettings?.contractTemplate) {
          const clientName = cartData.nome || user.displayName || "Cliente";
          const clientCpf = cartData.cpf || "";
          const content = siteSettings.contractTemplate.content
            .replace(/\{CLIENT_NAME\}/g, clientName)
            .replace(/\{CLIENT_CPF\}/g, clientCpf)
            .replace(/\{PACKAGE_NAME\}/g, pkg.title)
            .replace(/\{PACKAGE_OPTION\}/g, opcao.name)
            .replace(/\{DATE\}/g, `${dateStr} ${time}`)
            .replace(/\{TOTAL_PRICE\}/g, pricing.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
            .replace(/\{PAYMENT_METHOD\}/g, 'A definir no Checkout');

          contractSnapshotData = {
            content,
            version: siteSettings.contractTemplate.version,
            acceptedAt: serverTimestamp(),
            ipAddress: '127.0.0.1', // Placeholder if no backend lookup
            userAgent: navigator.userAgent,
            packageId: pkg.id,
            packageName: pkg.title,
            totalPrice: pricing.total,
            acceptedTerms: true
          };
        }

        const bookingRef = await addDoc(collection(db, "bookings"), {
          clientId: user.uid,
          clientName: cartData.nome || user.displayName || "Cliente",
          clientEmail: cartData.email || user.email || "",
          clientPhone: cartData.telefone || "",
          cpf: cartData.cpf || "",
          packageId: pkg.id,
          packageName: pkg.title,
          optionName: opcao.name,
          date: `${dateStr}T${time}:00`,
          status: "pending_payment",
          totalPrice: pricing.total,
          productionSelected: pricing.selectedProductions.length > 0,
          productionPrice: pricing.productionsTotal,
          selectedProductions: pricing.selectedProductions,
          couponApplied: pricing.appliedCouponCode,
          discountAmount: pricing.discountAmount,
          subtotal: pricing.subtotal,
          chargedItems: pricing.chargedItems,
          contractAccepted: true,
          contractAcceptedAt: serverTimestamp(),
          ...(contractSnapshotData ? { contractSnapshot: contractSnapshotData } : {}),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        sessionStorage.removeItem("cartData");
        
        navigate(`/pagamento?pacote=${pkg.id}&opcao=${opcaoIndex}&nome=${encodeURIComponent(cartData.nome || user.displayName || '')}&booking=${bookingRef.id}&total=${finalTotal}`);
      } catch (error) {
        console.error("Erro ao salvar agendamento:", error);
        alert("Ocorreu um erro ao processar o agendamento. Tente novamente.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white min-h-screen pt-24 pb-24 px-4 sm:px-8 font-sans text-black animate-in fade-in duration-500">
      <div className="max-w-[1000px] mx-auto">
        
        <Link to={`/carrinho?pacote=${pkg.id}&opcao=${opcaoIndex}`} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-12">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Carrinho
        </Link>
        
        <div className="mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">Agendar Ensaio</h1>
          <p className="text-gray-500 font-medium">Selecione a melhor data e horário para a sua sessão fotográfica.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          <div className="md:col-span-7 bg-gray-50 border border-gray-200 p-8 flex flex-col items-center">
            <h2 className="w-full text-sm font-black uppercase tracking-widest border-b border-gray-200 pb-4 mb-6">Selecione uma Data</h2>
            <style>{`
              .rdp { --rdp-cell-size: 40px; margin: 0; }
              .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover { background-color: black; color: white; border-radius: 0; }
              .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: #f3f4f6; border-radius: 0; }
              .rdp-day { border-radius: 0; }
            `}</style>
            <DayPicker
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              disabled={[{ before: addDays(new Date(), 2) }, { dayOfWeek: [0] }]}
            />
          </div>

          <div className="md:col-span-5 flex flex-col gap-8">
            <div className="bg-gray-50 border border-gray-200 p-8">
              <h2 className="text-sm font-black uppercase tracking-widest border-b border-gray-200 pb-4 mb-6">Horários Disponíveis</h2>
              {date ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {availableHours.map((hour) => (
                      <button
                        key={hour}
                        onClick={() => selectHour(hour)}
                        className={`py-3 text-sm font-bold tracking-widest uppercase transition-colors ${
                          selectedButtonTime === hour ? "bg-black text-white" : "border border-gray-300 bg-white text-black hover:border-black"
                        }`}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 pt-6">
                    <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3 text-center">Ou informe outro horário (HH:MM)</label>
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="Ex: 14:30"
                      value={customTimeInput}
                      onChange={handleCustomTimeChange}
                      className={`w-full bg-white text-black border p-3 text-sm font-bold text-center tracking-widest uppercase focus:outline-none transition-colors placeholder:text-gray-400 ${
                        !selectedButtonTime && isCustomTimeValid ? "border-black ring-1 ring-black" : "border-gray-300 hover:border-black focus:border-black"
                      }`}
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-gray-400 font-medium text-sm flex flex-col items-center gap-3">
                  <CalendarIcon className="w-6 h-6" />
                  Selecione uma data primeiro
                </div>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 p-8">
               <h2 className="text-sm font-black uppercase tracking-widest border-b border-gray-200 pb-4 mb-6">Contrato de Serviço</h2>
               
               <div className="h-40 overflow-y-auto bg-white border border-gray-200 p-4 mb-6 text-sm text-gray-600 space-y-4 whitespace-pre-wrap font-mono">
                 {siteSettings?.contractTemplate ? (
                    siteSettings.contractTemplate.content
                      .replace(/\{CLIENT_NAME\}/g, clientName)
                      .replace(/\{CLIENT_CPF\}/g, clientCpf)
                      .replace(/\{PACKAGE_NAME\}/g, pkg.title)
                      .replace(/\{PACKAGE_OPTION\}/g, opcao.name)
                      .replace(/\{DATE\}/g, `${date ? format(date, "dd/MM/yyyy") : '[Data]'} ${time || '[Horário]'}`)
                      .replace(/\{TOTAL_PRICE\}/g, pricing.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }))
                      .replace(/\{PAYMENT_METHOD\}/g, '[A definir]')
                 ) : (
                    "O contrato será gerado no momento do pagamento."
                 )}
               </div>

               <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      className="peer sr-only"
                      checked={contractAccepted}
                      onChange={(e) => setContractAccepted(e.target.checked)}
                    />
                    <div className="w-5 h-5 border-2 border-gray-300 bg-white peer-checked:bg-black peer-checked:border-black transition-colors flex items-center justify-center" />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-black group-hover:text-gray-700 transition-colors leading-relaxed">
                    Li e estou de acordo com o contrato de prestação de serviços
                  </span>
               </label>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-8">
               <h2 className="text-sm font-black uppercase tracking-widest border-b border-gray-200 pb-4 mb-6">Resumo da Reserva</h2>
               <div className="space-y-4 mb-8 text-sm font-medium">
                 <div className="flex items-center gap-3">
                   <CalendarIcon className="w-4 h-4 text-gray-500" /> 
                   {date ? format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : <span className="text-gray-400">Data não selecionada</span>}
                 </div>
                 <div className="flex items-center gap-3">
                   <Clock className="w-4 h-4 text-gray-500" />
                   {time ? `${time}h` : <span className="text-gray-400">Horário não selecionado</span>}
                 </div>
               </div>

               <button 
                  onClick={handleConfirm}
                  disabled={!date || !time || !contractAccepted || loading}
                  className="w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
                >
                  {loading ? "Processando..." : "Prosseguir para Pagamento"}
                </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
