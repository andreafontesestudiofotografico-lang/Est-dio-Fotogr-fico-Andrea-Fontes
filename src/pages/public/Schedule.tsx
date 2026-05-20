import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { ArrowLeft, Calendar as CalendarIcon, Clock } from "lucide-react";
import { photographyExperiences } from "./Packages";
import { auth, db } from "../../services/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../../services/AuthContext";

export default function Schedule() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const pacoteId = searchParams.get("pacote");
  const opcaoIndexStr = searchParams.get("opcao");

  const pkg = photographyExperiences.find((p) => p.id === pacoteId);
  const opcaoIndex = opcaoIndexStr ? parseInt(opcaoIndexStr) : 0;
  
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [customTimeInput, setCustomTimeInput] = useState("");
  const [contractAccepted, setContractAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableHours = ["09:00", "10:30", "14:00", "15:30", "17:00"];

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 2) {
      val = val.substring(0, 2) + ":" + val.substring(2, 4);
    }
    setCustomTimeInput(val);
    
    const isValid = /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(val);
    if (isValid) {
      setTime(val);
    } else if (time && !availableHours.includes(time)) {
      setTime(null);
    }
  };

  const selectHour = (hour: string) => {
    setTime(hour);
    setCustomTimeInput("");
  };

  if (!pkg) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black uppercase mb-4">Erro no Agendamento</h1>
        <Link to="/pacotes" className="text-sm font-bold uppercase underline">Voltar para pacotes</Link>
      </div>
    );
  }

  const handleConfirm = async () => {
    if (date && time && user) {
      setLoading(true);
      try {
        const opcao = pkg.options[opcaoIndex];
        const dateStr = format(date, "yyyy-MM-dd");
        
        const cartDataRaw = sessionStorage.getItem("cartData");
        const cartData = cartDataRaw ? JSON.parse(cartDataRaw) : {};

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
          totalPrice: opcao.price,
          contractAccepted: true,
          contractAcceptedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        sessionStorage.removeItem("cartData");
        
        navigate(`/pagamento?pacote=${pkg.id}&opcao=${opcaoIndex}&nome=${encodeURIComponent(cartData.nome || user.displayName || '')}&booking=${bookingRef.id}`);
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
                          time === hour && availableHours.includes(hour) ? "bg-black text-white" : "border border-gray-300 bg-white text-black hover:border-black"
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
                      placeholder="Ex: 14:30"
                      value={customTimeInput}
                      onChange={handleCustomTimeChange}
                      className={`w-full bg-white border p-3 text-sm font-bold text-center tracking-widest uppercase focus:outline-none transition-colors ${
                        time === customTimeInput && time !== null ? "border-black bg-black text-white" : "border-gray-300 hover:border-black focus:border-black"
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
               
               <div className="h-40 overflow-y-auto bg-white border border-gray-200 p-4 mb-6 text-sm text-gray-600 space-y-4">
                 <p className="font-bold text-black uppercase text-xs">Cláusula 1 - Do Objeto</p>
                 <p>O presente contrato tem como objeto a prestação de serviços fotográficos (Ensaio Fotográfico) pela CONTRATADA ao CONTRATANTE, de acordo com o pacote escolhido e condições pré-estabelecidas.</p>
                 <p className="font-bold text-black uppercase text-xs">Cláusula 2 - Dos Direitos e Deveres</p>
                 <p>O CONTRATANTE compromete-se a comparecer ao local e horário agendados. A CONTRATADA compromete-se a produzir e entregar o material digital no prazo estipulado após a seleção das fotos.</p>
                 <p className="font-bold text-black uppercase text-xs">Cláusula 3 - Do Cancelamento e Remarcação</p>
                 <p>Em caso de cancelamento com menos de 48h de antecedência, incidirá multa de 30% do valor do pacote. O valor do agendamento garante a reserva exclusiva da data.</p>
                 <p className="font-bold text-black uppercase text-xs">Cláusula 4 - Do Uso de Imagem</p>
                 <p>O CONTRATANTE autoriza o uso das imagens para o portfólio da CONTRATADA, salvo restrição expressa formalizada por escrito.</p>
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
