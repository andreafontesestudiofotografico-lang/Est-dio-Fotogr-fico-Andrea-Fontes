import React, { useState } from 'react';
import { X, Save, FileText, Download, CheckCircle, Copy } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { pdf } from '@react-pdf/renderer';
import { ReceiptPDF } from '../pdf/ReceiptPDF';

interface Props {
  booking: any;
  onClose: () => void;
  onUpdate: () => void;
}

export const ReceiptManagerModal = ({ booking, onClose, onUpdate }: Props) => {
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  
  // Default values or existing ones
  const existingReceipt = booking.receiptData;
  const generateReceiptNumber = () => {
     const date = new Date();
     return `REC-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${booking.id.substring(0, 4).toUpperCase()}`;
  };

  const [formData, setFormData] = useState({
    receiptNumber: existingReceipt?.receiptNumber || generateReceiptNumber(),
    issuedBy: existingReceipt?.issuedBy || 'Andrea Fontes Estudio Fotográfico',
    paymentMethod: existingReceipt?.paymentMethod || 'A definir',
    amount: existingReceipt?.amount || booking.totalPrice,
    clientName: existingReceipt?.clientName || booking.clientName,
    clientCpf: existingReceipt?.clientCpf || booking.cpf || '',
    packageName: existingReceipt?.packageName || booking.packageName,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'bookings', booking.id), {
        receiptData: {
          ...formData,
          amount: Number(formData.amount),
          issuedAt: existingReceipt?.issuedAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      });
      alert('Recibo gerado e salvo com sucesso!');
      onUpdate();
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar recibo.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    if (!existingReceipt) return;
    setDownloading(true);
    try {
      const blob = await pdf(<ReceiptPDF {...existingReceipt} issuedAt={existingReceipt.issuedAt?.toDate ? existingReceipt.issuedAt.toDate().toLocaleDateString('pt-BR') : existingReceipt.issuedAt} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recibo_${existingReceipt.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar PDF do recibo.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
          <h2 className="text-lg font-black tracking-tight uppercase">Gerenciar Recibo</h2>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-black transition-colors disabled:opacity-50">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
            <p className="font-bold uppercase text-xs tracking-widest mb-1">Status do Documento</p>
            {existingReceipt ? (
              <p className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Recibo já emitido e disponível para o cliente baixar.</p>
            ) : (
              <p>Ainda não foi gerado. Preencha os campos abaixo e salve para liberar o recibo para o cliente.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Número do Recibo</label>
              <input type="text" name="receiptNumber" value={formData.receiptNumber} onChange={handleChange} className="w-full border p-2 text-sm focus:border-black outline-none font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Data de Emissão</label>
              <input type="text" disabled value={existingReceipt?.issuedAt?.toDate ? existingReceipt.issuedAt.toDate().toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')} className="w-full border p-2 text-sm bg-gray-50 cursor-not-allowed" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase mb-2">Emitido Por</label>
              <input type="text" name="issuedBy" value={formData.issuedBy} onChange={handleChange} className="w-full border p-2 text-sm focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Nome do Cliente</label>
              <input type="text" name="clientName" value={formData.clientName} onChange={handleChange} className="w-full border p-2 text-sm focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">CPF do Cliente (Opcional)</label>
              <input type="text" name="clientCpf" value={formData.clientCpf} onChange={handleChange} className="w-full border p-2 text-sm focus:border-black outline-none" placeholder="000.000.000-00" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase mb-2">Referente A (Pacote)</label>
              <input type="text" name="packageName" value={formData.packageName} onChange={handleChange} className="w-full border p-2 text-sm focus:border-black outline-none" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Forma de Pagamento</label>
              <input type="text" name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full border p-2 text-sm focus:border-black outline-none" placeholder="Ex: PIX, Cartão (2x)" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-2">Valor R$</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full border p-2 text-sm focus:border-black outline-none" />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex justify-between">
          <button 
             onClick={handleSave} 
             disabled={saving} 
             className="bg-black text-white px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
             <Save className="w-4 h-4" /> {saving ? "Salvando..." : (existingReceipt ? "Atualizar Recibo" : "Gerar Recibo")}
          </button>

          {existingReceipt && (
            <button 
               onClick={handleDownload} 
               disabled={downloading}
               className="border border-gray-300 text-black px-6 py-3 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:border-black transition-colors disabled:opacity-50"
            >
               <Download className="w-4 h-4" /> {downloading ? "Gerando..." : "Baixar PDF"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
