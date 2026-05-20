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
    await savePackage(editingPkg);
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
              
              <div className="border-t border-gray-200 py-4 my-2">
                <label className="block text-xs font-bold uppercase mb-1">Valor do Pacote Padrão</label>
                <input type="number" className="w-full border border-gray-300 p-2 text-sm" 
                       value={editingPkg.options[0]?.price || 0} 
                       onChange={e => {
                         const newOpts = [...editingPkg.options];
                         if (newOpts.length === 0) newOpts.push({ name: "Padrão", price: 0, includes: [] });
                         newOpts[0].price = Number(e.target.value);
                         setEditingPkg({...editingPkg, options: newOpts});
                       }} />
              </div>

              <div className="border border-gray-200 p-4 bg-gray-50 flex items-start gap-4">
                <input type="checkbox" className="mt-1" checked={editingPkg.hasProduction} 
                       onChange={e => setEditingPkg({...editingPkg, hasProduction: e.target.checked})} />
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase mb-2">Habilitar Produção Opcional</label>
                  {editingPkg.hasProduction && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Valor da Produção</label>
                        <input type="number" className="w-full border border-gray-300 p-2 text-sm" 
                               value={editingPkg.productionPrice || 0} onChange={e => setEditingPkg({...editingPkg, productionPrice: Number(e.target.value)})} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Descrição da Produção</label>
                        <input type="text" className="w-full border border-gray-300 p-2 text-sm" placeholder="Ex: Cabelo e maquiagem"
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

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    await saveSiteSettings(settings);
    setSaving(false);
    alert("Configurações salvas.");
  };

  if (!settings) return <div>Carregando...</div>;

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-black uppercase mb-6">Textos da Home</h2>
      
      <div className="space-y-8">
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

        <button onClick={save} disabled={saving} className="bg-black text-white px-8 py-4 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800 disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </div>
  );
}

function CouponsManager() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  useEffect(() => {
    getCoupons().then(setCoupons);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black uppercase">Gerenciar Cupons</h2>
        <button className="bg-black text-white px-4 py-2 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-gray-800">
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
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(c => (
              <tr key={c.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                <td className="p-4 font-bold">{c.code}</td>
                <td className="p-4">{c.type === 'percentage' ? `${c.value}%` : `R$ ${c.value}`}</td>
                <td className="p-4">{c.currentUses} / {c.usageLimit || '∞'}</td>
                <td className="p-4">{c.active ? 'Ativo' : 'Inativo'}</td>
                <td className="p-4">
                   <button className="text-red-500 font-bold uppercase text-xs" onClick={() => deleteCoupon(c.id).then(()=>getCoupons().then(setCoupons))}>Excluir</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum cupom cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
