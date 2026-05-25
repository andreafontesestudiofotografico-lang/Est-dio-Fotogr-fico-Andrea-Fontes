import { useState, useEffect, lazy, Suspense } from "react";
import { Download, Clock, Image as ImageIcon, Heart, FileText, ArrowDownToLine, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { useAuth } from "../../services/AuthContext";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DocumentDownloader } from "../../components/client/DocumentDownloader";
import { FEATURES } from "../../config/features";
import { ErrorBoundary } from "../../components/common/ErrorBoundary";

const ClientGallery = lazy(() => import("../../components/client/ClientGallery").then(m => ({ default: m.ClientGallery })));

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingGallery, setViewingGallery] = useState<any>(null);

  useEffect(() => {
    if (!user) return;
    
    const bookingsRef = collection(db, "bookings");
    const qBookings = query(bookingsRef, where("clientId", "==", user.uid));
    // Note: ordered by createdAt desc is omitted to not require a composite index immediately, or you can just sort client-side. We'll sort client side.
    
    const unsubscribe = onSnapshot(qBookings, (bookingSnapshot) => {
      const bookingsData = bookingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      bookingsData.sort((a: any, b: any) => b.createdAt.toMillis() - a.createdAt.toMillis());
      
      setBookings(bookingsData);
      setLoading(false);
    }, (error) => {
       console.error("Erro ao buscar bookings:", error);
       setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Erro ao sair", error);
    }
  };

  const getTimelineSteps = (status: string) => {
    const statuses = ['pending_payment', 'confirmed', 'session_done', 'in_selection', 'in_editing', 'ready', 'completed'];
    const currentIndex = statuses.indexOf(status);
    
    return [
      { id: 'pending_payment', title: currentIndex >= 1 ? "Pagamento Confirmado" : "Aguardando Pagamento", desc: "Pagamento do pacote fotográfico e contrato.", done: currentIndex >= 1, current: currentIndex === 0 },
      { id: 'confirmed', title: "Ensaio Agendado", desc: "Sua data está reservada.", done: currentIndex >= 1, current: false },
      { id: 'session_done', title: "Ensaio Realizado", desc: "As fotos já foram feitas!", done: currentIndex >= 2, current: currentIndex === 1 },
      { id: 'in_selection', title: "Em Seleção", desc: "Fotógrafa realizando a seleção inicial.", done: currentIndex >= 3, current: currentIndex === 2 },
      { id: 'in_editing', title: "Em Edição", desc: "Aplicação da cor e estilo Andrea Fontes.", done: currentIndex >= 4, current: currentIndex === 3 },
      { id: 'ready', title: "Galeria Liberada", desc: "Fotos prontas para visualização.", done: currentIndex >= 5, current: currentIndex === 4 },
      { id: 'completed', title: "Download Disponível", desc: "Baixe todas as suas fotos em alta resolução.", done: currentIndex >= 6, current: currentIndex === 5 },
    ];
  };

  return (
    <div className="pt-28 pb-20 px-6 max-w-7xl mx-auto w-full min-h-screen bg-white text-black font-sans animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-gray-200 pb-12">
        <div>
          <h1 className="font-black tracking-tighter uppercase text-4xl mb-4">Área do Cliente</h1>
          <p className="text-gray-500 font-medium">Acompanhe o andamento das suas fotos e acesse suas galerias.</p>
        </div>
        <div className="flex gap-4 mt-8 md:mt-0">
          <button className="border border-black bg-white text-black hover:bg-black hover:text-white px-8 py-3 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
            Editar Perfil
          </button>
          <button onClick={handleLogout} className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-8 py-3 text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </div>

      {viewingGallery ? (
         <ErrorBoundary componentName="ClientGallery" fallback={
           <div className="p-12 text-center bg-gray-50 border border-gray-200">
             <h2 className="text-xl font-bold text-red-600 mb-4">Galeria indisponível no momento</h2>
             <p className="mb-6 text-gray-600">Estamos realizando atualizações ou ocorreu um erro na galeria. Seu material continua seguro.</p>
             <button onClick={() => setViewingGallery(null)} className="px-6 py-3 bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-colors">Voltar aos Agendamentos</button>
           </div>
         }>
            <Suspense fallback={<div className="p-12 text-center text-gray-500 font-medium">Carregando Galeria...</div>}>
               {FEATURES.isGalleryV2Enabled(viewingGallery) ? (
                 <ClientGallery booking={viewingGallery} onBack={() => setViewingGallery(null)} />
               ) : (
                 <div className="p-12 text-center bg-gray-50 border border-gray-200">
                   <h2 className="text-xl font-bold mb-4">Galeria Indisponível</h2>
                   <p className="mb-6 text-gray-600">A nova experiência de galeria não está ativada para este ensaio.</p>
                   <button onClick={() => setViewingGallery(null)} className="px-6 py-3 bg-black text-white font-black uppercase text-xs tracking-widest hover:bg-gray-800 transition-colors">Voltar</button>
                 </div>
               )}
            </Suspense>
         </ErrorBoundary>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Status Card */}
        <div className="lg:col-span-8 space-y-12">
          {loading ? (
             <div className="bg-gray-50 border border-gray-200 p-8 md:p-12 text-center text-gray-500 font-medium">
               Carregando suas informações...
             </div>
          ) : bookings.length === 0 ? (
             <div className="bg-gray-50 border border-gray-200 p-8 md:p-12 text-center">
               <h3 className="font-black text-xl tracking-tight uppercase mb-4">Nenhum ensaio agendado</h3>
               <p className="text-gray-500 font-medium mb-8">Você ainda não possui pacotes ativos. Que tal agendar seu ensaio?</p>
               <Link to="/pacotes" className="bg-black text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 inline-block transition-colors">Ver Pacotes</Link>
             </div>
          ) : (
            bookings.filter(b => b.status !== 'cancelled').map((booking) => {
               const dateObj = new Date(booking.date);
               const steps = getTimelineSteps(booking.status);
               
               return (
                  <div key={booking.id} className="bg-gray-50 border border-gray-200 p-8 md:p-12">
                     <h2 className="font-black tracking-tight text-2xl uppercase mb-12 flex items-center gap-4">
                        <Clock className="w-6 h-6" />
                        {booking.packageName} ({format(dateObj, "dd/MM")})
                     </h2>
                     
                     {/* Gallery access */}
                     {['in_selection', 'in_editing', 'ready', 'completed'].includes(booking.status) && (
                        <div className="mb-12 bg-white border border-gray-200 p-8 group">
                           <div className="flex flex-col sm:flex-row gap-8 items-center justify-between">
                              <div>
                                 <h3 className="font-black text-xl tracking-tight uppercase mb-2">
                                    {booking.status === 'in_selection' ? 'Selecione suas fotos' : 
                                     booking.status === 'in_editing' ? 'Fotos em Edição' : 'Suas Fotos Estão Prontas!'}
                                 </h3>
                                 <p className="text-gray-500 font-medium max-w-xl">
                                    {booking.status === 'in_selection' ? 'As fotos raw já estão disponíveis. Acesse a galeria, curta suas favoritas para eu poder editar com a melhor qualidade!' : 
                                     booking.status === 'in_editing' ? 'Você já enviou a pré-seleção. Agora eu estou realizando o tratamento das fotos. Em breve elas estarão disponíveis para download nesta mesma tela.' : 
                                     'Você já pode visualizar sua galeria final e fazer o download de todas as imagens em alta resolução. O link ficará disponível por 30 dias.'}
                                 </p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
                                 {booking.status !== 'in_editing' && FEATURES.isGalleryV2Enabled(booking) && (
                                    <button onClick={() => setViewingGallery(booking)} className="bg-white border border-black text-black px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                       <ImageIcon className="w-4 h-4" /> {booking.status === 'in_selection' ? 'Começar Seleção' : 'Ver Galeria'}
                                    </button>
                                 )}
                                 {['ready', 'completed'].includes(booking.status) && (
                                    <button className="bg-black text-white px-8 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                                       <Download className="w-4 h-4" /> Download ZIP
                                    </button>
                                 )}
                              </div>
                           </div>
                        </div>
                     )}
                     
                     {/* Timeline */}
                     <div className="relative">
                        <div className="absolute left-[38px] top-4 bottom-4 w-px bg-gray-300 z-0" />
                        {steps.map((step, i) => (
                           <div key={i} className="relative z-10 flex gap-8 mb-12 last:mb-0">
                           <div className={`w-20 shrink-0 flex justify-end items-center`}>
                              {step.done ? (
                                 <div className="w-8 h-8 bg-emerald-800 flex items-center justify-center text-white">
                                 <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                 </svg>
                                 </div>
                              ) : step.current ? (
                                 <div className="w-8 h-8 bg-white border-4 border-emerald-800" />
                              ) : (
                                 <div className="w-8 h-8 bg-white border-2 border-gray-300" />
                              )}
                           </div>
                           <div>
                              <h3 className={`font-black uppercase tracking-widest text-sm mb-2 ${step.done || step.current ? 'text-black' : 'text-gray-400'}`}>{step.title}</h3>
                              <p className="text-sm text-gray-500 font-medium max-w-md">{step.desc}</p>
                           </div>
                           </div>
                        ))}
                     </div>
                     
                     <DocumentDownloader booking={booking} />
                  </div>
               );
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-gray-50 border border-gray-200 p-8">
            <h2 className="font-black uppercase tracking-widest text-sm mb-6 border-b border-gray-200 pb-4">Seus Guias</h2>
            <ul className="space-y-4">
              <li>
                <a href="#" className="flex items-center gap-3 text-sm font-medium hover:text-gray-500 transition-colors">
                  <ArrowDownToLine className="w-4 h-4 shrink-0" />
                  Guia de Cuidados e Looks (PDF)
                </a>
              </li>
            </ul>
          </div>

          <div className="space-y-6">
            <h2 className="font-black tracking-tight uppercase text-xl">Download de Arquivos</h2>
            <p className="text-xs font-bold uppercase text-red-600 bg-red-50 p-4 border border-red-100">Atenção: As fotos ficarão disponíveis por apenas 15 dias.</p>
            
            <div className="bg-gray-50 border border-gray-200 group overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 relative overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=600&auto=format&fit=crop" 
                  alt="Ensaio Casal" 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <button className="bg-white text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center gap-2 mb-3">
                    <Download className="w-4 h-4" /> Download ZIP
                  </button>
                  <button className="border border-white/80 text-white px-6 py-3 text-xs font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                    Ver Galeria
                  </button>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-black uppercase tracking-tight mb-2">Ensaio Casal Editorial</h3>
                <div className="flex justify-between items-center text-xs text-gray-500 font-bold uppercase tracking-widest">
                  <span>30 fotos</span>
                  <span>Expira em 5 dias</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
