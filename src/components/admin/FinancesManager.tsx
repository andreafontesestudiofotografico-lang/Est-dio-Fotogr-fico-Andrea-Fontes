import React, { useMemo, useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, isSameDay, isSameMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, TrendingUp, CreditCard, Users, Search, Calendar as CalendarIcon, Award, Package as PackageIcon } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";

interface Booking {
  id: string;
  clientId: string;
  packageName: string;
  totalPrice: number;
  status: string;
  createdAt: any;
  date: string;
  [key: string]: any;
}

interface Client {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

interface FinancesManagerProps {
  bookings: Booking[];
  clients: Record<string, Client>;
}

export function FinancesManager({ bookings, clients }: FinancesManagerProps) {
  const [timeFilter, setTimeFilter] = useState<"hoje" | "7dias" | "30dias" | "mes" | "ano" | "tudo">("30dias");

  // ONLY Confirmed (Pago) and subsequent statuses
  const paidBookings = useMemo(() => {
    const paidStatuses = [
      "confirmed",
      "session_done",
      "in_selection",
      "in_editing",
      "ready",
      "completed"
    ];
    return bookings.filter(b => paidStatuses.includes(b.status));
  }, [bookings]);

  const metrics = useMemo(() => {
    const now = new Date();
    
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let todayRevenue = 0;

    paidBookings.forEach((b) => {
      const price = Number(b.totalPrice) || 0;
      totalRevenue += price;

      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(b.date));
      
      if (bDate && isSameMonth(bDate, now)) {
        monthlyRevenue += price;
      }
      
      if (bDate && isSameDay(bDate, now)) {
        todayRevenue += price;
      }
    });

    const averageTicket = paidBookings.length > 0 ? totalRevenue / paidBookings.length : 0;
    const conversion = bookings.length > 0 ? (paidBookings.length / bookings.length) * 100 : 0;

    return {
      totalRevenue,
      monthlyRevenue,
      todayRevenue,
      averageTicket,
      totalSales: paidBookings.length,
      conversion
    };
  }, [paidBookings, bookings]);

  const filteredBookings = useMemo(() => {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    
    return paidBookings.filter(b => {
      if (timeFilter === "tudo") return true;
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(b.date));
      if (!bDate) return false;

      if (timeFilter === "hoje") return isSameDay(bDate, now);
      if (timeFilter === "7dias") return bDate >= subDays(now, 7);
      if (timeFilter === "30dias") return bDate >= subDays(now, 30);
      if (timeFilter === "mes") return bDate >= startOfCurrentMonth && bDate <= endOfCurrentMonth;
      if (timeFilter === "ano") return bDate.getFullYear() === now.getFullYear();
      
      return true;
    }).sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : (typeof a.createdAt === 'string' ? parseISO(a.createdAt) : new Date(a.date));
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(b.date));
      return dateB.getTime() - dateA.getTime();
    });
  }, [paidBookings, timeFilter]);

  const chartData = useMemo(() => {
    // 1. Receita por Mês
    const monthlyMap: Record<string, number> = {};
    // 2. Vendas por Pacote
    const packageSalesMap: Record<string, number> = {};
    // 3. Faturamento por Pacote
    const packageRevenueMap: Record<string, number> = {};
    // 4. Últimos 30 dias
    const dailyMap: Record<string, number> = {};

    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      dailyMap[format(subDays(now, i), "dd/MMM", { locale: ptBR })] = 0;
    }

    paidBookings.forEach(b => {
      const price = Number(b.totalPrice) || 0;
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(b.date));
      
      if (bDate) {
        const monthKey = format(bDate, "MMM/yy", { locale: ptBR });
        monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + price;

        const dayKey = format(bDate, "dd/MMM", { locale: ptBR });
        if (dailyMap[dayKey] !== undefined) {
          dailyMap[dayKey] += price;
        }
      }

      const pkgName = b.packageName || "Outro";
      packageSalesMap[pkgName] = (packageSalesMap[pkgName] || 0) + 1;
      packageRevenueMap[pkgName] = (packageRevenueMap[pkgName] || 0) + price;
    });

    const monthlyData = Object.keys(monthlyMap).map(k => ({ name: k, Receita: monthlyMap[k] }));
    const packageSalesData = Object.keys(packageSalesMap).map(k => ({ name: k, Vendas: packageSalesMap[k] })).sort((a, b) => b.Vendas - a.Vendas);
    const packageRevenueData = Object.keys(packageRevenueMap).map(k => ({ name: k, Receita: packageRevenueMap[k] })).sort((a, b) => b.Receita - a.Receita);
    const dailyData = Object.keys(dailyMap).map(k => ({ name: k, Receita: dailyMap[k] }));

    return {
      monthlyData,
      packageSalesData,
      packageRevenueData,
      dailyData
    };
  }, [paidBookings]);

  const extraIndicators = useMemo(() => {
    const clientsMap: Record<string, number> = {};
    const packageSalesMap: Record<string, number> = {};

    paidBookings.forEach(b => {
      const price = Number(b.totalPrice) || 0;
      const clientId = b.clientId;
      if (clientId) {
        clientsMap[clientId] = (clientsMap[clientId] || 0) + price;
      }
      
      const pkgName = b.packageName || "Outros";
      packageSalesMap[pkgName] = (packageSalesMap[pkgName] || 0) + 1;
    });

    let bestPackage = { name: "Nenhum", count: 0 };
    Object.keys(packageSalesMap).forEach(k => {
      if (packageSalesMap[k] > bestPackage.count) bestPackage = { name: k, count: packageSalesMap[k] };
    });

    let bestClient = { name: "Nenhum", revenue: 0 };
    Object.keys(clientsMap).forEach((clientId) => {
      if (clientsMap[clientId] > bestClient.revenue) {
        bestClient = { 
          name: clients[clientId]?.name || "Cliente Desconhecido", 
          revenue: clientsMap[clientId] 
        };
      }
    });

    const payingClientsCount = Object.keys(clientsMap).length;
    const avgRevenuePerClient = payingClientsCount > 0 ? metrics.totalRevenue / payingClientsCount : 0;

    return {
      bestPackage: bestPackage.name,
      bestClient,
      avgRevenuePerClient
    };
  }, [paidBookings, clients, metrics.totalRevenue]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-black text-3xl tracking-tighter uppercase relative group inline-block">
          Módulo Financeiro
          <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-black group-hover:w-full transition-all duration-300" />
        </h1>
        <div className="flex gap-2">
           <select 
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="border border-gray-200 px-4 py-3 text-xs font-black uppercase tracking-widest bg-white outline-none cursor-pointer hover:border-black transition-colors"
           >
             <option value="hoje">Hoje</option>
             <option value="7dias">7 Dias</option>
             <option value="30dias">30 Dias</option>
             <option value="mes">Neste Mês</option>
             <option value="ano">Neste Ano</option>
             <option value="tudo">Tudo</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
         <div className="bg-white border border-gray-200 p-6 flex flex-col justify-center">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><DollarSign className="w-3 h-3 text-black" /> Receita Total</h3>
            <p className="text-2xl font-black text-black tracking-tight">{formatCurrency(metrics.totalRevenue)}</p>
         </div>
         <div className="bg-white border border-gray-200 p-6 flex flex-col justify-center">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-black" /> Receita Mês</h3>
            <p className="text-2xl font-black text-black tracking-tight">{formatCurrency(metrics.monthlyRevenue)}</p>
         </div>
         <div className="bg-white border border-gray-200 p-6 flex flex-col justify-center">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><CalendarIcon className="w-3 h-3 text-black" /> Receita Hoje</h3>
            <p className="text-2xl font-black text-black tracking-tight">{formatCurrency(metrics.todayRevenue)}</p>
         </div>
         <div className="bg-white border border-gray-200 p-6 flex flex-col justify-center border-l-4 border-l-black">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><CreditCard className="w-3 h-3 text-black" /> Ticket Médio</h3>
            <p className="text-2xl font-black text-black tracking-tight">{formatCurrency(metrics.averageTicket)}</p>
         </div>
         <div className="bg-white border border-gray-200 p-6 flex flex-col justify-center">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><PackageIcon className="w-3 h-3 text-black" /> Vendas (Pagas)</h3>
            <p className="text-2xl font-black text-black tracking-tight">{metrics.totalSales}</p>
         </div>
         <div className="bg-white border border-gray-200 p-6 flex flex-col justify-center">
            <h3 className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-2"><Users className="w-3 h-3 text-black" /> Conversão</h3>
            <p className="text-2xl font-black text-black tracking-tight">{metrics.conversion.toFixed(1)}%</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-white border border-gray-200 p-6">
            <h3 className="font-black text-lg tracking-tight uppercase mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Evolução Financeira (30d)</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData.dailyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(value) => `R$ ${value}`} />
                   <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: 0, color: '#fff', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                   <Line type="monotone" dataKey="Receita" stroke="#000" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#000' }} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
         
         <div className="bg-white border border-gray-200 p-6">
            <h3 className="font-black text-lg tracking-tight uppercase mb-6 flex items-center gap-2"><CalendarIcon className="w-5 h-5" /> Receita por Mês</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={chartData.monthlyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(value) => `R$ ${value}`} />
                   <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: 0, color: '#fff', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                   <Line type="monotone" dataKey="Receita" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000' }} activeDot={{ r: 6, fill: '#000' }} />
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
         
         <div className="bg-white border border-gray-200 p-6">
            <h3 className="font-black text-lg tracking-tight uppercase mb-6 flex items-center gap-2"><PackageIcon className="w-5 h-5" /> Vendas por Pacote (Qtd)</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.packageSalesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                     <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4B5563', fontWeight: 'bold' }} width={120} />
                     <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: 0, color: '#fff', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                     <Bar dataKey="Vendas" fill="#000" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-white border border-gray-200 p-6">
            <h3 className="font-black text-lg tracking-tight uppercase mb-6 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Faturamento por Pacote</h3>
            <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.packageRevenueData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                     <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(value) => `R$ ${value}`} />
                     <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#4B5563', fontWeight: 'bold' }} width={120} />
                     <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: 0, color: '#fff', fontSize: '12px', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => formatCurrency(value)} />
                     <Bar dataKey="Receita" fill="#9CA3AF" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-gray-50 border border-gray-200 p-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Pacote Mais Vendido</h4>
            <p className="text-lg font-black">{extraIndicators.bestPackage}</p>
         </div>
         <div className="bg-gray-50 border border-gray-200 p-6 flex items-center justify-between">
            <div>
               <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 flex items-center gap-2"><Award className="w-3 h-3" /> Melhor Cliente</h4>
               <p className="text-lg font-black">{extraIndicators.bestClient.name}</p>
            </div>
            <div className="text-right">
               <p className="text-sm font-bold text-gray-400">{formatCurrency(extraIndicators.bestClient.revenue)}</p>
            </div>
         </div>
         <div className="bg-gray-50 border border-gray-200 p-6">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Receita Média / Cliente</h4>
            <p className="text-lg font-black">{formatCurrency(extraIndicators.avgRevenuePerClient)}</p>
         </div>
      </div>

      <div className="bg-white border border-gray-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-black text-xl tracking-tight uppercase">Extrato Financeiro</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
               <tr>
                 <th className="p-6 font-bold uppercase tracking-widest text-[10px]">Cliente</th>
                 <th className="p-6 font-bold uppercase tracking-widest text-[10px]">Pacote</th>
                 <th className="p-6 font-bold uppercase tracking-widest text-[10px]">Data Compra</th>
                 <th className="p-6 font-bold uppercase tracking-widest text-[10px]">Data Ensaio</th>
                 <th className="p-6 font-bold uppercase tracking-widest text-[10px]">Pagamento</th>
                 <th className="p-6 font-bold uppercase tracking-widest text-[10px]">Valor</th>
                 <th className="p-6 font-bold uppercase tracking-widest text-[10px] text-right">Status</th>
               </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => {
                 const client = clients[b.clientId];
                 const createdAtObj = b.createdAt?.toDate ? b.createdAt.toDate() : (typeof b.createdAt === 'string' ? parseISO(b.createdAt) : new Date(b.date));
                 const dateObj = new Date(b.date);
                 
                 return (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="p-6">
                       <p className="font-bold uppercase text-xs">{client?.name || "Desconhecido"}</p>
                       <p className="text-[10px] text-gray-400 font-medium">{client?.email || "Sem email"}</p>
                    </td>
                    <td className="p-6 font-bold text-gray-600 text-xs">{b.packageName}</td>
                    <td className="p-6 text-gray-500 font-medium text-xs">
                       {createdAtObj ? format(createdAtObj, "dd MMM yyyy, HH:mm", { locale: ptBR }) : "--"}
                    </td>
                    <td className="p-6 text-gray-500 font-medium text-xs">
                       {format(dateObj, "dd MMM yyyy, HH:mm", { locale: ptBR })}
                    </td>
                    <td className="p-6 text-gray-500 font-bold text-xs uppercase tracking-widest">
                       {b.paymentMethod || "Stripe"}
                    </td>
                    <td className="p-6 font-black text-sm">
                       {formatCurrency(Number(b.totalPrice) || 0)}
                    </td>
                    <td className="p-6 text-right">
                       <span className="bg-green-100 text-green-800 px-3 py-1 font-black uppercase tracking-widest text-[10px]">
                          PAGO
                       </span>
                    </td>
                  </tr>
                 );
              })}
              {filteredBookings.length === 0 && (
                 <tr>
                    <td colSpan={7} className="p-12 text-center text-gray-400 font-medium text-sm">Nenhum recebimento encontrado para o período selecionado.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
