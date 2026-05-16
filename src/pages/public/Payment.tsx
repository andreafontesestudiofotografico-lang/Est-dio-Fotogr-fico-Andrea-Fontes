import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { photographyExperiences } from "./Packages";
import { Copy, Camera, CheckCircle2 } from "lucide-react";
import React, { useState } from "react";

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const pacoteId = searchParams.get("pacote");
  const opcaoIndexStr = searchParams.get("opcao");
  const nome = searchParams.get("nome");
  const bookingId = searchParams.get("booking");
  
  const [copied, setCopied] = useState(false);

  const pkg = photographyExperiences.find(p => p.id === pacoteId);
  const opcaoIndex = opcaoIndexStr ? parseInt(opcaoIndexStr) : 0;
  const opcao = pkg?.options[opcaoIndex];

  if (!pkg || !opcao) {
    return (
      <div className="pt-32 pb-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-black uppercase mb-4">Erro no Pagamento</h1>
        <Link to="/pacotes" className="text-sm font-bold uppercase underline">Voltar para pacotes</Link>
      </div>
    );
  }

  const pixKey = "andreafontes494@gmail.com";

  const handleCopy = () => {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const whatsappMessage = encodeURIComponent(`Olá Andrea Fontes! Realizei o pagamento do pacote '${pkg.title}' e estou enviando meu comprovante para confirmação.`);
  const whatsappUrl = `https://wa.me/5591981638703?text=${whatsappMessage}`;

  return (
    <div className="bg-white min-h-screen pt-24 pb-24 px-4 sm:px-8 font-sans text-black animate-in fade-in duration-500">
      <div className="max-w-[800px] mx-auto">
        <div className="flex items-center justify-center mb-12">
          <div className="bg-black text-white p-4 rounded-full mb-4 inline-flex">
            <Camera className="w-8 h-8" />
          </div>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase mb-4">Pagamento PIX</h1>
          <p className="text-gray-500 font-medium">Finalize seu pedido enviando o pagamento via PIX copia e cola ou QR Code.</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            
            {/* QR Code */}
            <div className="shrink-0 flex flex-col items-center">
              <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 p-2 mb-4 flex items-center justify-center relative">
                <img src="https://i.postimg.cc/85B3mpnL/Whats-App-Image-2026-05-16-at-10-29-53.jpg" alt="QR Code PIX Estático" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs font-black uppercase tracking-widest text-gray-500 text-center">Escaneie o QR Code</p>
            </div>

            {/* Instruções */}
            <div className="flex-1 w-full text-center md:text-left">
              <h2 className="text-lg font-black uppercase tracking-tight mb-2">Detalhes da Transação</h2>
              <div className="text-3xl font-black tracking-tighter mb-6">
                R$ {opcao.price.toFixed(2).replace('.', ',')}
              </div>
              
              <div className="mb-8 text-sm font-medium text-gray-600">
                <p>Referente ao pacote: <strong className="text-black uppercase">{pkg.title} - {opcao.name}</strong></p>
                {nome && <p>Cliente: <strong className="text-black">{nome}</strong></p>}
                {bookingId && <p>Reserva: <strong className="text-black">{bookingId}</strong></p>}
              </div>

              <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Chave PIX E-mail</p>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    readOnly 
                    value={pixKey}
                    className="flex-1 border border-gray-300 bg-white p-4 text-xs font-medium outline-none truncate"
                  />
                  <button 
                    onClick={handleCopy}
                    className="border border-l-0 border-gray-300 bg-gray-100 p-4 hover:bg-gray-200 transition-colors flex items-center justify-center min-w-[60px]"
                    title="Copiar Chave"
                  >
                    {copied ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Após o pagamento:</p>
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-5 border-2 border-[#25D366] text-[#25D366] text-xs font-black uppercase tracking-widest text-center hover:bg-[#25D366] hover:text-white transition-colors"
                >
                  Enviar Comprovante (WhatsApp)
                </a>
                <button 
                  onClick={() => navigate('/cliente')}
                  className="block w-full py-5 bg-black text-white text-xs font-black uppercase tracking-widest text-center hover:bg-gray-800 transition-colors"
                >
                  Ir para o Painel (Aguardar Confirmação)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
