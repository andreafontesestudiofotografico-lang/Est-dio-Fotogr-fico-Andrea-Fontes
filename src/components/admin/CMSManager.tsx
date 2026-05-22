import { useState, useEffect } from "react";
import { Package, SiteSettings, Coupon } from "../../types";
import { getPackages, savePackage, deletePackage, getSiteSettings, saveSiteSettings, getCoupons, saveCoupon, deleteCoupon } from "../../services/cms";
import { initCMS } from "../../services/initCms";
import { Plus, Edit2, Trash2, Save, X } from "lucide-react";

export function CMSManager() {
  const [activeTab, setActiveTab] = useState<'packages' | 'settings' | 'coupons'>('packages');
  
  useEffect(() => {
    initCMS();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex gap-4 border-b border-gray-200 pb-4">
        {['packages', 'settings', 'coupons'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`text-xs font-black uppercase tracking-widest px-4 py-2 transition-colors ${activeTab === tab ? 'bg-black text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            {tab === 'packages' ? 'Pacotes' : tab === 'settings' ? 'Site Home' : 'Cupons'}
          </button>
        ))}
      </div>

      {activeTab === 'packages' && <PackagesManager />}
      {activeTab === 'settings' && <SiteSettingsManager />}
      {activeTab === 'coupons' && <CouponsManager />}
    </div>
  );
}

function PackagesManager() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPkgs = async () => {
    setLoading(true);
    const pkgs = await getPackages();
    setPackages(pkgs);
    setLoading(false);
  };

  useEffect(() => { fetchPkgs(); }, []);

  const handleEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setEditingPkg({
      id: "novo-" + Date.now(),
      title: "",
      image: "",
      shortDesc: "",
      desc: "",
      active: true,
      showInHome: true,
      showInPackages: true,
      order: 0,
      hasProduction: false,
      productionPrice: 0,
      productionDesc: "",
      options: [{ name: "Padrão", price: 0, includes: [] }],
      info: {}
    });
    setIsModalOpen(true);
  };

  const handleSavePkg = async () => {
    if (!editingPkg) return;

    const pkgToSave = { ...editingPkg };

    if (pkgToSave.additionalInfo) {
       pkgToSave.additionalInfo = pkgToSave.additionalInfo.map(i => ({ label: i.label.trim(), value: i.value.trim() })).filter(info => info.label !== "" && info.value !== "");
    }
    
    if (pkgToSave.options && pkgToSave.options.length > 0) {
       if (pkgToSave.options[0].includes) {
           pkgToSave.options[0].includes = pkgToSave.options[0].includes.map(s => s.trim()).filter(Boolean);
       }
       if (!pkgToSave.options[0].name) {
           pkgToSave.options[0].name = "Padrão";
       }
    }

    if (pkgToSave.productions) {
       const ids = new Set();
       const validProds = [];
       for (const p of pkgToSave.productions) {
         if (!p.id || !p.name) continue; // Skip incomplete items invisibly, or you could alert.
         if (ids.has(p.id)) {
           alert("Erro: existem duas produções com o mesmo ID (" + p.id + "). Corriga para salvar.");
           return;
         }
         ids.add(p.id);
         validProds.push(p);
       }
       pkgToSave.productions = validProds;
    }

    await savePackage(pkgToSave);
    setIsModalOpen(false);
    fetchPkgs();
  };

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase">Gerenciar Pacotes</h2>
        <button onClick={handleNew} className="bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800">
          <Plus className="w-4 h-4" /> Novo Pacote
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map(pkg => (
          <div key={pkg.id} className="border border-gray-200 p-4 bg-white flex flex-col">
            <img src={pkg.image} alt={pkg.title} className="w-full h-40 object-cover mb-4 bg-gray-100" />
            <h3 className="font-bold text-lg mb-1">{pkg.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{pkg.shortDesc}</p>
            <div className="mt-auto flex gap-2">
              <button onClick={() => handleEdit(pkg)} className="flex-1 bg-gray-100 px-3 py-2 text-xs font-black uppercase hover:bg-gray-200 flex items-center justify-center gap-2">
                <Edit2 className="w-3 h-3" /> Editar
              </button>
              <button className="bg-red-50 text-red-600 px-3 py-2 hover:bg-red-100 flex items-center justify-center" onClick={async () => {
                if(confirm('Excluir pacote?')) {
                  await deletePackage(pkg.id);
                  fetchPkgs();
                }
              }}>
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && editingPkg && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative animate-in fade-in zoom-in-95">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black">
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-xl font-black uppercase mb-6">
              {editingPkg.id.startsWith("novo-") ? "Novo Pacote" : "Editar Pacote"}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">ID (Slug - ex: ensaio-casal)</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" 
                       value={editingPkg.id} onChange={e => setEditingPkg({...editingPkg, id: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Título</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" 
                       value={editingPkg.title} onChange={e => setEditingPkg({...editingPkg, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">URL da Imagem</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" 
                       value={editingPkg.image} onChange={e => setEditingPkg({...editingPkg, image: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Texto Secundário</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm" 
                       value={editingPkg.shortDesc} onChange={e => setEditingPkg({...editingPkg, shortDesc: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Descrição Longa</label>
                <textarea className="w-full border border-gray-300 p-2 text-sm h-20" 
                       value={editingPkg.desc} onChange={e => setEditingPkg({...editingPkg, desc: e.target.value})} />
              </div>
              
              <div className="border border-gray-200 p-4 mb-4">
                <h3 className="font-bold text-xs uppercase mb-4 border-b border-gray-200 pb-2">Opção do Pacote (Checkouts)</h3>
                
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase mb-1">Nome da Opção (ex: Padrão, Premium)</label>
                  <input type="text" className="w-full border border-gray-300 p-2 text-sm" 
                         value={editingPkg.options[0]?.name || "Padrão"} 
                         onChange={e => {
                           const newOpts = [...editingPkg.options];
                           if (newOpts.length === 0) newOpts.push({ name: "Padrão", price: 0, includes: [] });
                           newOpts[0].name = e.target.value;
                           setEditingPkg({...editingPkg, options: newOpts});
                         }} />
                </div>
                
                <div className="mb-4">
                  <label className="block text-xs font-bold uppercase mb-1">Valor Final</label>
                  <input type="number" className="w-full border border-gray-300 p-2 text-sm" 
                         value={editingPkg.options[0]?.price || 0} 
                         onChange={e => {
                           const newOpts = [...editingPkg.options];
                           if (newOpts.length === 0) newOpts.push({ name: "Padrão", price: 0, includes: [] });
                           newOpts[0].price = Number(e.target.value);
                           setEditingPkg({...editingPkg, options: newOpts});
                         }} />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold uppercase">Benefícios do Pacote (Max: 4)</label>
                    <button className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              const newOpts = [...editingPkg.options];
                              if (newOpts.length === 0) newOpts.push({ name: "Padrão", price: 0, includes: [] });
                              if (!newOpts[0].includes) newOpts[0].includes = [];
                              if (newOpts[0].includes.length < 4) {
                                newOpts[0].includes.push("");
                                setEditingPkg({...editingPkg, options: newOpts});
                              }
                            }}>+ Adicionar</button>
                  </div>
                  {editingPkg.options[0]?.includes?.map((inc, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" className="w-full border border-gray-300 p-2 text-sm" 
                             value={inc} 
                             onChange={e => {
                               const newOpts = [...editingPkg.options];
                               newOpts[0].includes[idx] = e.target.value;
                               setEditingPkg({...editingPkg, options: newOpts});
                             }} />
                      <button className="text-red-500 hover:bg-red-50 px-3 border border-red-100" onClick={() => {
                        const newOpts = [...editingPkg.options];
                        newOpts[0].includes.splice(idx, 1);
                        setEditingPkg({...editingPkg, options: newOpts});
                      }}><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <p className="text-xs text-gray-400">São exibidos com ícone de check na página do pacote.</p>
                </div>
              </div>


              <div className="border border-gray-200 p-4 mb-4">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                  <h3 className="font-bold text-xs uppercase">Informações Adicionais</h3>
                  <button className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            const newInfo = [...(editingPkg.additionalInfo || [])];
                            newInfo.push({ label: "", value: "" });
                            setEditingPkg({...editingPkg, additionalInfo: newInfo});
                          }}>+ Adicionar</button>
                </div>
                {editingPkg.additionalInfo?.map((info, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" className="w-1/3 border border-gray-300 p-2 text-sm" placeholder="Título (ex: Prazo)"
                           value={info.label} onChange={e => {
                             const newInfo = [...(editingPkg.additionalInfo || [])];
                             newInfo[idx].label = e.target.value;
                             setEditingPkg({...editingPkg, additionalInfo: newInfo});
                           }} />
                    <input type="text" className="flex-1 border border-gray-300 p-2 text-sm" placeholder="Descrição (ex: 15 dias)"
                           value={info.value} onChange={e => {
                             const newInfo = [...(editingPkg.additionalInfo || [])];
                             newInfo[idx].value = e.target.value;
                             setEditingPkg({...editingPkg, additionalInfo: newInfo});
                           }} />
                    <button className="text-red-500 hover:bg-red-50 px-3 border border-red-100" onClick={() => {
                        const newInfo = [...(editingPkg.additionalInfo || [])];
                        newInfo.splice(idx, 1);
                        setEditingPkg({...editingPkg, additionalInfo: newInfo});
                    }}><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>


              <div className="border border-gray-200 p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-4 border-b border-gray-200 pb-2">
                  <h3 className="font-bold text-xs uppercase">Produções Opcionais</h3>
                  <button className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            const newProds = [...(editingPkg.productions || [])];
                            const tempId = "prod-" + Date.now();
                            newProds.push({ id: tempId, name: "", price: 0, description: "", enabled: true });
                            setEditingPkg({...editingPkg, productions: newProds});
                          }}>+ Adicionar</button>
                </div>
                {editingPkg.productions?.map((prod, idx) => (
                  <div key={idx} className="border border-gray-200 p-4 mb-4 bg-white relative">
                    <button className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-2 border border-red-100" onClick={() => {
                        const newProds = [...(editingPkg.productions || [])];
                        newProds.splice(idx, 1);
                        setEditingPkg({...editingPkg, productions: newProds});
                    }}><Trash2 className="w-4 h-4" /></button>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <input type="checkbox" checked={prod.enabled} 
                             onChange={e => {
                               const newProds = [...(editingPkg.productions || [])];
                               newProds[idx].enabled = e.target.checked;
                               setEditingPkg({...editingPkg, productions: newProds});
                             }} />
                      <label className="text-sm font-bold uppercase">Ativo</label>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-2">
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1">Nome</label>
                        <input type="text" className="w-full border border-gray-300 p-2 text-sm" 
                               value={prod.name} onChange={e => {
                                 const newProds = [...(editingPkg.productions || [])];
                                 newProds[idx].name = e.target.value;
                                 if (!newProds[idx].id || newProds[idx].id.startsWith('prod-')) {
                                   newProds[idx].id = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                                 }
                                 setEditingPkg({...editingPkg, productions: newProds});
                               }} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1">ID (Gerado automaticamente)</label>
                        <input type="text" className="w-full border border-gray-300 p-2 text-sm bg-gray-50 font-mono" 
                               value={prod.id} onChange={e => {
                                 const newProds = [...(editingPkg.productions || [])];
                                 newProds[idx].id = e.target.value;
                                 setEditingPkg({...editingPkg, productions: newProds});
                               }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1">Valor (R$)</label>
                        <input type="number" className="w-full border border-gray-300 p-2 text-sm" 
                               value={prod.price} onChange={e => {
                                 const newProds = [...(editingPkg.productions || [])];
                                 newProds[idx].price = Number(e.target.value);
                                 setEditingPkg({...editingPkg, productions: newProds});
                               }} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase mb-1">Descrição</label>
                        <input type="text" className="w-full border border-gray-300 p-2 text-sm" 
                               value={prod.description} onChange={e => {
                                 const newProds = [...(editingPkg.productions || [])];
                                 newProds[idx].description = e.target.value;
                                 setEditingPkg({...editingPkg, productions: newProds});
                               }} />
                      </div>
                    </div>

                  </div>
                ))}
              </div>


              {/* LEGACY PRODUCTION FOR BACKWARD COMPATIBILITY */}
              <div className="border border-gray-200 p-4 bg-gray-50 flex items-start gap-4">
                <input type="checkbox" className="mt-1" checked={editingPkg.hasProduction} 
                       onChange={e => setEditingPkg({...editingPkg, hasProduction: e.target.checked})} />
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase mb-2">Habilitar Produção Opcional (Legado)</label>
                  <p className="text-xs text-gray-500 mb-2">Use a seção "Produções Opcionais Novas" acima para criar múltiplas produções. Esta seção é apenas para compatibilidade.</p>
                  {editingPkg.hasProduction && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Valor da Produção</label>
                        <input type="number" className="w-full border border-gray-300 p-2 text-sm text-gray-500" 
                               value={editingPkg.productionPrice || 0} onChange={e => setEditingPkg({...editingPkg, productionPrice: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Descrição</label>
                        <input type="text" className="w-full border border-gray-300 p-2 text-sm text-gray-500"
                               value={editingPkg.productionDesc || ""} onChange={e => setEditingPkg({...editingPkg, productionDesc: e.target.value})} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSavePkg} className="px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800">
                Salvar Pacote
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SiteSettingsManager() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState<'texts' | 'contract'>('texts');

  useEffect(() => {
    getSiteSettings().then(s => {
      if (s) setSettings(s);
    });
  }, []);

  const handleChange = (block: 'block1' | 'block2', field: 'title' | 'description', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      home: {
        ...settings.home,
        [block]: {
          ...settings.home[block],
          [field]: value
        }
      }
    });
  };

  const handleContractChange = (value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      contractTemplate: {
        content: value,
        version: settings.contractTemplate?.version || 1,
        updatedAt: new Date().toISOString()
      }
    });
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    
    const sToSave = { ...settings };
    if (subTab === 'contract' && sToSave.contractTemplate) {
      sToSave.contractTemplate.version = (sToSave.contractTemplate.version || 0) + 1;
      sToSave.contractTemplate.updatedAt = new Date().toISOString();
    }
    
    await saveSiteSettings(sToSave);
    if (sToSave) setSettings(sToSave);
    setSaving(false);
    alert("Configurações salvas.");
  };

  if (!settings) return <div>Carregando...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setSubTab('texts')}
          className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-colors ${subTab === 'texts' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
        >
          Textos do Site
        </button>
        <button 
          onClick={() => setSubTab('contract')}
          className={`text-xs font-black uppercase tracking-widest pb-2 border-b-2 transition-colors ${subTab === 'contract' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
        >
          Template do Contrato
        </button>
      </div>

      {subTab === 'texts' ? (
        <div className="space-y-8 max-w-2xl">
          <div className="border border-gray-200 p-6 bg-white">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Bloco 1 (Destaques)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Título</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm focus:border-black outline-none" 
                       value={settings.home.block1.title} onChange={e => handleChange('block1', 'title', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Descrição</label>
                <textarea className="w-full border border-gray-300 p-2 text-sm focus:border-black outline-none h-20" 
                          value={settings.home.block1.description} onChange={e => handleChange('block1', 'description', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 p-6 bg-white">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-4">Bloco 2 (Editoriais)</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Título</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm focus:border-black outline-none" 
                       value={settings.home.block2.title} onChange={e => handleChange('block2', 'title', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase mb-2">Descrição</label>
                <textarea className="w-full border border-gray-300 p-2 text-sm focus:border-black outline-none h-20" 
                          value={settings.home.block2.description} onChange={e => handleChange('block2', 'description', e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 text-blue-800 p-4 border border-blue-200 text-sm font-medium">
            <p className="mb-2 font-bold uppercase text-xs tracking-widest">Variáveis Disponíveis:</p>
            <p>Você pode usar as seguintes variáveis no texto (elas serão substituídas no PDF gerado):</p>
            <ul className="list-disc pl-5 mt-2 font-mono text-xs">
              <li>{'{CLIENT_NAME}'} - Nome do cliente</li>
              <li>{'{CLIENT_CPF}'} - CPF do cliente</li>
              <li>{'{PACKAGE_NAME}'} - Nome do pacote</li>
              <li>{'{PACKAGE_OPTION}'} - Opção do pacote</li>
              <li>{'{DATE}'} - Data do ensaio</li>
              <li>{'{TOTAL_PRICE}'} - Valor total R$</li>
              <li>{'{PAYMENT_METHOD}'} - Forma de pagamento</li>
            </ul>
          </div>
          
          <div>
            <label className="block text-xs font-black uppercase tracking-widest mb-2">Conteúdo do Contrato (Markdown / Texto)</label>
            <textarea 
              className="w-full border border-gray-300 p-4 text-sm font-medium focus:border-black outline-none font-mono min-h-[500px]"
              value={settings.contractTemplate?.content || ''}
              onChange={e => handleContractChange(e.target.value)}
              placeholder="Digite os termos do contrato de prestação de serviços..."
            />
            <p className="text-xs text-gray-400 mt-2 font-medium">Versão atual: {settings.contractTemplate?.version || 0}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <button onClick={save} disabled={saving} className="bg-black text-white px-8 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}

function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = () => getCoupons().then(setCoupons);

  const handleSave = async () => {
    if (!editingCoupon || !editingCoupon.code || !editingCoupon.value) return;
    setIsLoading(true);
    try {
      const couponToSave: Coupon = {
        id: editingCoupon.id || Date.now().toString(),
        code: editingCoupon.code.trim().toUpperCase(),
        type: editingCoupon.type || 'percentage',
        value: Number(editingCoupon.value),
        active: editingCoupon.active !== false,
        currentUses: editingCoupon.currentUses || 0,
        usageLimit: editingCoupon.usageLimit ? Number(editingCoupon.usageLimit) : undefined,
      };
      
      await saveCoupon(couponToSave);
      setIsModalOpen(false);
      await fetchCoupons();
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
    } else {
      setEditingCoupon({
        code: "",
        type: "percentage",
        value: 0,
        active: true,
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase">Gerenciar Cupons</h2>
        <button onClick={() => openModal()} className="bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800">
          <Plus className="w-4 h-4" /> Novo Cupom
        </button>
      </div>
      <div className="bg-white border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-widest text-gray-500">
            <tr>
              <th className="p-4">Código</th>
              <th className="p-4">Desconto</th>
              <th className="p-4">Usos</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="p-4 font-bold">{c.code}</td>
                <td className="p-4">{c.type === 'percentage' ? `${c.value}%` : `R$ ${c.value}`}</td>
                <td className="p-4">{c.currentUses} / {c.usageLimit || '∞'}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest ${c.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {c.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-4">
                   <button className="text-blue-500 font-bold uppercase text-xs hover:underline" onClick={() => openModal(c)}>Editar</button>
                   <button className="text-red-500 font-bold uppercase text-xs hover:underline" onClick={() => deleteCoupon(c.id).then(fetchCoupons)}>Excluir</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum cupom cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && editingCoupon && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoading) setIsModalOpen(false);
          }}
        >
          <div className="bg-white max-w-md w-full p-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black uppercase mb-6">{editingCoupon.id ? 'Editar Cupom' : 'Novo Cupom'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase mb-1">Código</label>
                <input type="text" className="w-full border border-gray-300 p-2 text-sm uppercase" 
                       value={editingCoupon.code} onChange={e => setEditingCoupon({...editingCoupon, code: e.target.value})} 
                       placeholder="Ex: VERAO20" disabled={isLoading} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Tipo de Desconto</label>
                  <select className="w-full border border-gray-300 p-2 text-sm"
                          value={editingCoupon.type} onChange={e => setEditingCoupon({...editingCoupon, type: e.target.value as any})} disabled={isLoading}>
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase mb-1">Valor</label>
                  <input type="number" className="w-full border border-gray-300 p-2 text-sm" 
                         value={editingCoupon.value} onChange={e => setEditingCoupon({...editingCoupon, value: Number(e.target.value)})} disabled={isLoading} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase mb-1">Limite de Usos (Opcional)</label>
                <input type="number" className="w-full border border-gray-300 p-2 text-sm" placeholder="Deixe em branco para ilimitado"
                       value={editingCoupon.usageLimit || ''} onChange={e => setEditingCoupon({...editingCoupon, usageLimit: e.target.value ? Number(e.target.value) : undefined})} disabled={isLoading} />
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <input type="checkbox" checked={editingCoupon.active} 
                       onChange={e => setEditingCoupon({...editingCoupon, active: e.target.checked})} disabled={isLoading} />
                <label className="text-sm font-bold uppercase">Cupom Ativo</label>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button className="px-4 py-2 text-xs font-black uppercase text-gray-400 hover:text-black"
                      onClick={() => setIsModalOpen(false)} disabled={isLoading}>Cancelar</button>
              <button className="bg-black text-white px-6 py-2 text-xs font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-50"
                      onClick={handleSave} disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar Cupom'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
