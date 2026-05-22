import { useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { ContractPDF } from '../pdf/ContractPDF';
import { ReceiptPDF } from '../pdf/ReceiptPDF';
import { maskCpfPartially } from '../../utils/mask';

export const DocumentDownloader = ({ booking }: { booking: any }) => {
  const [downloadingContract, setDownloadingContract] = useState(false);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  const handleDownloadContract = async () => {
    if (!booking.contractSnapshot || downloadingContract) return;
    setDownloadingContract(true);
    try {
      let contentToPdf = booking.contractSnapshot.content;
      if (booking.cpf) {
         // Replace the raw CPF with masked CPF dynamically for the PDF
         contentToPdf = contentToPdf.replace(booking.cpf, maskCpfPartially(booking.cpf));
      }

      const blob = await pdf(<ContractPDF content={contentToPdf} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Contrato_${booking.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error(e);
      alert("Erro ao baixar o contrato.");
    } finally {
      setDownloadingContract(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!booking.receiptData || downloadingReceipt) return;
    setDownloadingReceipt(true);
    try {
      const blob = await pdf(<ReceiptPDF {...booking.receiptData} issuedAt={booking.receiptData.issuedAt?.toDate ? booking.receiptData.issuedAt.toDate().toLocaleDateString('pt-BR') : booking.receiptData.issuedAt} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Recibo_${booking.receiptData.receiptNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (e) {
      console.error(e);
      alert("Erro ao baixar o recibo.");
    } finally {
      setDownloadingReceipt(false);
    }
  };

  const showReceiptPlaceholder = !booking.receiptData && ['confirmed', 'session_done', 'in_selection', 'in_editing', 'ready', 'completed'].includes(booking.status);

  if (!booking.contractSnapshot && !booking.receiptData && !showReceiptPlaceholder) return null;

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
      <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">Documentos do Ensaio</h4>
      <div className="flex flex-col gap-3">
        {booking.contractSnapshot && (
          <button 
            onClick={handleDownloadContract}
            disabled={downloadingContract}
            className="flex items-center gap-3 text-sm font-bold hover:text-gray-600 transition-colors bg-white border border-gray-200 p-4 text-left group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
            <span className="flex-1">Contrato de Prestação de Serviços</span>
            {downloadingContract ? (
              <span className="text-xs text-gray-400">Gerando PDF...</span>
            ) : (
              <Download className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
            )}
          </button>
        )}
        
        {booking.receiptData ? (
          <button 
            onClick={handleDownloadReceipt}
            disabled={downloadingReceipt}
            className="flex items-center gap-3 text-sm font-bold hover:text-gray-600 transition-colors bg-white border border-gray-200 p-4 text-left group"
          >
            <FileText className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
            <span className="flex-1">Comprovante de Pagamento</span>
            {downloadingReceipt ? (
              <span className="text-xs text-gray-400">Gerando PDF...</span>
            ) : (
              <Download className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
            )}
          </button>
        ) : (
           booking.status === 'confirmed' || booking.status === 'session_done' || booking.status === 'in_selection' || booking.status === 'in_editing' || booking.status === 'ready' || booking.status === 'completed' ? (
              <div className="flex items-center gap-3 text-sm font-bold text-gray-400 bg-gray-50 border border-gray-200 p-4 text-left">
                <FileText className="w-5 h-5 opacity-50" />
                <span className="flex-1">Comprovante de Pagamento</span>
                <span className="text-xs">Aguardando emissão</span>
              </div>
           ) : null
        )}
      </div>
    </div>
  );
};
