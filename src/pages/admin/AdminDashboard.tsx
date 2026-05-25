import { useState, useEffect, lazy, Suspense } from "react";
import { Users, Calendar, DollarSign, Image as ImageIcon, Settings, LogOut, Search, Plus, Filter, MessageCircle, FileText, Check, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../services/firebase";
import { signOut } from "firebase/auth";
import { collection, query, onSnapshot, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { ErrorBoundary } from "../../components/common/ErrorBoundary";
import { FEATURES } from "../../config/features";
import { CMSManager } from "../../components/admin/CMSManager";
import { ReceiptManagerModal } from "../../components/admin/ReceiptManagerModal";

const GalleryManager = lazy(() => import("../../components/admin/GalleryManager").then(m => ({ default: m.GalleryManager })));

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedGallery, setSelectedGallery] = useState<string | null>(null);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [clients, setClients] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [receiptModalBooking, setReceiptModalBooking] = useState<any | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Erro ao sair", error);
    }
  };

  useEffect(() => {
    const clientsRef = collection(db, "users");
    const qClients = query(clientsRef);
    
    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      const clientsData: any = {};
      snapshot.docs.forEach(doc => {
        clientsData[doc.id] = { id: doc.id, ...doc.data() };
      });
      setClients(clientsData);
      
      const bookingsRef = collection(db, "bookings");
      const qBookings = query(bookingsRef, orderBy("createdAt", "desc"));
      
      const unsubscribeBookings = onSnapshot(qBookings, (bookingSnapshot) => {
        const bookingsData = bookingSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setBookings(bookingsData);
        setLoading(false);
      }, (error) => {
         console.error("Erro ao buscar bookings:", error);
         setLoading(false);
      });

      return () => unsubscribeBookings();
    }, (error) => {
      console.error("Erro ao buscar clients:", error);
      setLoading(false);
    });

    return () => unsubscribeClients();
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
       console.error("Error updating status:", error);
       alert("Erro ao atualizar status.");
    }
  };

  const stats = [
    { label: "Agendamentos Gerais", value: bookings.length.toString(), icon: Calendar },
    { label: "Receita Prevista", value: `R$ ${bookings.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0).toLocaleString('pt-BR')}`, icon: DollarSign },
    { label: "Ensaios Para Entregar", value: bookings.filter(b => b.status === 'completed').length.toString(), icon: ImageIcon },
    { label: "Novos Leads", value: Object.keys(clients).length.toString(), icon: Users },
  ];

  const menuItems = [
    { id: "overview", label: "Dashboard", icon: Calendar },
    { id: "crm", label: "Clientes & CRM", icon: Users },
    ...(FEATURES.enableGalleryV2 ? [{ id: "galleries", label: "Galerias", icon: ImageIcon }] : []),
    { id: "finances", label: "Financeiro", icon: DollarSign },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return "text-green-600 bg-green-50 border border-green-200";
      case 'pending_payment': return "text-yellow-600 bg-yellow-50 border border-yellow-200";
      case 'session_done': return "text-blue-600 bg-blue-50 border border-blue-200";
      case 'in_selection': return "text-purple-600 bg-purple-50 border border-purple-200";
      case 'in_editing': return "text-indigo-600 bg-indigo-50 border border-indigo-200";
      case 'ready': return "text-teal-600 bg-teal-50 border border-teal-200";
      case 'completed': return "text-emerald-600 bg-emerald-50 border border-emerald-200";
      case 'cancelled': return "text-red-600 bg-red-50 border border-red-200";
      default: return "text-gray-600 bg-gray-50 border border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed': return "Confirmado";
      case 'pending_payment': return "Aguardando Pgto";
      case 'session_done': return "Ensaio Realizado";
      case 'in_selection': return "Em Seleção";
      case 'in_editing': return "Em Edição";
      case 'ready': return "Galeria Liberada";
      case 'completed': return "Download Disponível";
      case 'cancelled': return "Cancelado";
      default: return status;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 pt-20 font-sans text-black animate-in fade-in duration-500">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
        <div className="p-8">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-8">Admin Andrea</p>
          <nav className="space-y-4">
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 text-xs font-black uppercase tracking-widest transition-colors ${activeTab === item.id ? 'text-black' : 'text-gray-400 hover:text-black'}`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-gray-100">
          <button onClick={handleLogout} className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-red-500 transition-colors w-full text-left">
            <LogOut className="w-4 h-4" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 md:p-12 overflow-auto">
        
        {activeTab === "overview" && (
          <>
            <h1 className="font-black text-3xl tracking-tighter uppercase mb-8">Visão Geral</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {stats.map((stat, i) => (
                <div key={i} className="bg-white border border-gray-200 p-8 flex items-start justify-between group hover:border-black transition-colors cursor-default">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">{stat.label}</h3>
                    <p className="text-4xl font-black tracking-tighter">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white border border-gray-200 p-8">
              <div className="flex justify-between items-end mb-8">
                <h2 className="font-black tracking-tight uppercase text-xl">Próximos Ensaios</h2>
                <button className="text-xs font-black uppercase tracking-widest hover:underline">Ver Todos</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-widest">
                      <th className="font-black pb-4">Cliente</th>
                      <th className="font-black pb-4">Data</th>
                      <th className="font-black pb-4">Pacote</th>
                      <th className="font-black pb-4">Status</th>
                      <th className="font-black pb-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Carregando agendamentos...</td>
                      </tr>
                    ) : bookings.slice(0, 5).map((row, i) => {
                      const client = clients[row.clientId];
                      const dateObj = new Date(row.date);
                      return (
                      <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-5 font-bold uppercase">{client?.name || 'Carregando...'}</td>
                        <td className="py-5 text-gray-500 font-medium">{format(dateObj, "dd MMM, HH:mm", { locale: ptBR })}</td>
                        <td className="py-5 text-gray-500 font-medium">{row.packageName}</td>
                        <td className="py-5">
                          <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${getStatusColor(row.status)}`}>
                            {getStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="py-5 text-right">
                          <button onClick={() => setActiveTab('crm')} className="text-xs font-black uppercase tracking-widest hover:underline">Gerenciar</button>
                        </td>
                      </tr>
                    )})}
                    {!loading && bookings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Nenhum agendamento encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "crm" && (
          <>
            <div className="flex justify-between items-center mb-8">
              <h1 className="font-black text-3xl tracking-tighter uppercase">CRM & Contatos</h1>
              <button className="bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-colors">
                <Plus className="w-4 h-4" /> Novo Lead
              </button>
            </div>

            <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
              <div className="relative max-w-md w-full">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Buscar clientes por nome, email ou telefone..." 
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 text-sm font-medium outline-none focus:border-black transition-colors"
                />
              </div>
              <button className="bg-white border border-gray-200 px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-50 transition-colors">
                <Filter className="w-4 h-4" /> Filtros
              </button>
            </div>

            <div className="bg-white border border-gray-200">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs text-gray-400 uppercase tracking-widest">
                      <th className="font-black p-6">Nome / Contato</th>
                      <th className="font-black p-6">Ensaios / Compra</th>
                      <th className="font-black p-6">Fase Pipeline</th>
                      <th className="font-black p-6">Última Ação</th>
                      <th className="font-black p-6 text-right">Mudar Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Carregando CRM...</td>
                      </tr>
                    ) : bookings.map((row) => {
                      const client = clients[row.clientId];
                      const dateObj = row.updatedAt?.toDate ? row.updatedAt.toDate() : new Date(row.date);
                      return (
                      <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
                        <td className="p-6">
                          <div className="font-bold uppercase mb-1">{client?.name || '...'}</div>
                          <div className="text-xs text-gray-500 font-medium">{client?.email || '...'}</div>
                        </td>
                        <td className="p-6">
                          <div className="font-bold text-gray-600 mb-1">{row.packageName}</div>
                           <div className="text-xs text-gray-400 font-medium">{format(new Date(row.date), "dd/MM/yyyy HH:mm")}</div>
                        </td>
                        <td className="p-6">
                          <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${getStatusColor(row.status)}`}>
                            {getStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="p-6 text-gray-500 font-medium text-xs">{format(dateObj, "dd MMM, HH:mm", { locale: ptBR })}</td>
                        <td className="p-6">
                          <div className="flex justify-end gap-3 opacity-100 transition-opacity items-center">
                             {['confirmed', 'session_done', 'in_selection', 'in_editing', 'ready', 'completed'].includes(row.status) && (
                                <button
                                   onClick={() => setReceiptModalBooking(row)}
                                   className="text-xs font-bold uppercase tracking-widest text-black underline hover:text-gray-600 transition-colors mr-2"
                                >
                                   Recibo
                                </button>
                             )}
                             <select
                                value={row.status}
                                onChange={(e) => handleUpdateStatus(row.id, e.target.value)}
                                className="text-xs font-bold uppercase tracking-widest border border-gray-200 bg-white px-2 py-2 outline-none focus:border-black cursor-pointer"
                              >
                                <option value="pending_payment">Aguardando Pagamento</option>
                                <option value="confirmed">Confirmado (Pago)</option>
                                <option value="session_done">Ensaio Realizado</option>
                                <option value="in_selection">Fotos em Seleção</option>
                                <option value="in_editing">Fotos em Edição</option>
                                <option value="ready">Galeria Liberada</option>
                                <option value="completed">Download Disponível</option>
                                <option value="cancelled">Cancelado</option>
                              </select>
                          </div>
                        </td>
                      </tr>
                    )})}
                    {!loading && bookings.length === 0 && (
                       <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Nenhum registro encontrado.</td>
                        </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        
        {activeTab === "galleries" && FEATURES.enableGalleryV2 && (
          <>
            {selectedGallery ? (
               <ErrorBoundary componentName="GalleryManager" fallback={
                 <div className="p-8">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Erro na Galeria V2</h2>
                    <p className="mb-4">Houve uma falha ao renderizar a galeria. A equipe já foi notificada. Seu sistema e CRM continuam funcionando normalmente.</p>
                    <button onClick={() => setSelectedGallery(null)} className="px-4 py-2 bg-black text-white hover:bg-gray-800 transition-colors">Voltar</button>
                 </div>
               }>
                 <Suspense fallback={<div className="p-8">Carregando Galeria V2...</div>}>
                   <GalleryManager 
                      booking={bookings.find(b => b.id === selectedGallery)} 
                      client={clients[bookings.find(b => b.id === selectedGallery)?.clientId]} 
                      onBack={() => setSelectedGallery(null)} 
                   />
                 </Suspense>
               </ErrorBoundary>
            ) : (
               <>
                  <div className="flex justify-between items-center mb-8">
                  <h1 className="font-black text-3xl tracking-tighter uppercase">Gestão de Galerias</h1>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                     {bookings.filter(b => ['session_done', 'in_selection', 'in_editing', 'ready', 'completed'].includes(b.status)).map((booking) => {
                        const client = clients[booking.clientId];
                        return (
                           <div key={booking.id} className="bg-white border border-gray-200 p-8 hover:border-black transition-colors flex flex-col h-full group">
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                    <h3 className="font-black uppercase tracking-tight text-xl mb-1">{client?.name || '...'}</h3>
                                    <p className="text-gray-500 font-medium text-sm">{booking.packageName}</p>
                                 </div>
                                 <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest ${getStatusColor(booking.status)}`}>
                                    {getStatusLabel(booking.status)}
                                 </span>
                              </div>
                              
                              <div className="flex-1"></div>
                              
                              <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
                                 <button onClick={() => setSelectedGallery(booking.id)} className="flex-1 bg-black text-white py-3 text-xs font-black uppercase tracking-widest hover:bg-gray-800 transition-colors">
                                    Gerenciar Galeria
                                 </button>
                              </div>
                           </div>
                        );
                     })}
                     {!loading && bookings.filter(b => ['session_done', 'in_selection', 'in_editing', 'ready', 'completed'].includes(b.status)).length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-500 font-medium">
                           Nenhum ensaio realizado ainda. Mude o status de um agendamento para "Ensaio Realizado" ou superior.
                        </div>
                     )}
                  </div>
               </>
            )}
          </>
        )}

        {/* Placeholder for other tabs */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in">
            <h1 className="font-black text-3xl tracking-tighter uppercase mb-8">CMS & Configurações</h1>
            <CMSManager />
          </div>
        )}

        {activeTab === "finances" && (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <h2 className="text-2xl font-black uppercase tracking-widest mb-4">Módulo em Desenvolvimento</h2>
            <p className="text-sm font-medium">Esta funcionalidade será ativada na próxima fase.</p>
          </div>
        )}

      </main>

      {receiptModalBooking && (
         <ReceiptManagerModal 
            booking={receiptModalBooking}
            onClose={() => setReceiptModalBooking(null)}
            onUpdate={() => {
               // The listener will automatically update the bookings list
               setReceiptModalBooking(null);
            }}
         />
      )}
    </div>
  );
}
