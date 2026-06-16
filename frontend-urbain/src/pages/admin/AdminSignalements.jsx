import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { motion } from 'framer-motion';
import API from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import {
  Search, Eye, Trash2, CheckCircle, Clock, AlertCircle,
  Camera, MessageSquare, MapPin, User, CalendarDays,
  Tag, X, Upload
} from 'lucide-react';

const STATUTS    = ['TOUS','SIGNALE','EN_COURS','RESOLU'];
const CATEGORIES = ['TOUTES','VOIRIE','ECLAIRAGE','DECHETS','EAU','AUTRE'];

const STATUT_STYLES = {
  SIGNALE:  { bg:'#fef3c7', color:'#92400e', label:'Signalé',  dot:'#f59e0b' },
  EN_COURS: { bg:'#dbeafe', color:'#1e40af', label:'En cours', dot:'#3b82f6' },
  RESOLU:   { bg:'#d1fae5', color:'#065f46', label:'Résolu',   dot:'#22c55e' },
};

const StatutDot = ({ statut }) => (
  <span style={{ display:'inline-block', width:'8px', height:'8px', borderRadius:'50%', background: STATUT_STYLES[statut]?.dot || '#888', marginRight:'5px' }} />
);

export default function AdminSignalements() {
  const { dark } = useTheme();
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [filtreCateg,  setFiltreCateg]  = useState('TOUTES');
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState(null);

  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [pendingResolution,   setPendingResolution]   = useState(null);
  const [photoApres,          setPhotoApres]          = useState(null);
  const [photoApresPreview,   setPhotoApresPreview]   = useState(null);
  const [commentaireResol,    setCommentaireResol]    = useState('');
  const [resolvingLoading,    setResolvingLoading]    = useState(false);

  const bg      = dark ? '#1e293b' : '#fff';
  const text    = dark ? '#e2e8f0' : '#1e3a8a';
  const subtext = dark ? '#94a3b8' : '#6b7280';
  const border  = dark ? '#334155' : '#e5e7eb';
  const pageBg  = dark ? '#0f172a' : '#f8fafc';
  const inputBg = dark ? '#0f172a' : '#fff';

  const load = () => {
    setLoading(true);
    API.get('/admin/signalements')
      .then(res => setSignalements(res.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStatutChange = (id, newStatut, currentStatut) => {
    if (newStatut === 'RESOLU') {
      setPendingResolution({ id, currentStatut });
      setPhotoApres(null); setPhotoApresPreview(null); setCommentaireResol('');
      setShowResolutionModal(true);
    } else {
      updateStatut(id, newStatut, null, null);
    }
  };

  const updateStatut = async (id, statut, commentaire, photo) => {
    try {
      const formData = new FormData();
      formData.append('statut', statut);
      if (commentaire) formData.append('commentaire', commentaire);
      if (photo) formData.append('photoApres', photo);
      const res = await API.put(`/admin/signalements/${id}/statut`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Statut mis à jour !');
      load();
      if (selected?.id === id) setSelected(res.data);
    } catch {
      toast.error('Erreur de mise à jour');
    }
  };

  const handleConfirmResolution = async () => {
    if (!pendingResolution) return;
    setResolvingLoading(true);
    await updateStatut(pendingResolution.id, 'RESOLU', commentaireResol, photoApres);
    setShowResolutionModal(false);
    setPendingResolution(null);
    setResolvingLoading(false);
  };

  const deleteSignalement = async (id) => {
    if (!window.confirm('Supprimer ce signalement ?')) return;
    try {
      await API.delete(`/admin/signalements/${id}`);
      toast.success('Supprimé !');
      setSelected(null); load();
    } catch { toast.error('Erreur'); }
  };

  const filtered = signalements
    .filter(s => filtreStatut === 'TOUS'   || s.statut    === filtreStatut)
    .filter(s => filtreCateg  === 'TOUTES' || s.categorie === filtreCateg)
    .filter(s => search === '' ||
      s.titre?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.adresse?.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div style={{ background: pageBg, minHeight:'calc(100vh - 64px)', padding:'2rem' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto' }}>

        <h2 style={{ color: text, marginBottom:'1.5rem', fontSize:'1.5rem', fontWeight:'700', display:'flex', alignItems:'center', gap:'10px' }}>
          Gestion des signalements
          <span style={{ fontSize:'0.85rem', fontWeight:'500', color: subtext, background: dark?'#334155':'#e2e8f0', padding:'2px 10px', borderRadius:'20px' }}>
            {filtered.length}
          </span>
        </h2>

        {/* Search + Filtres */}
        <div style={{ background: bg, borderRadius:'12px', padding:'1rem 1.5rem', marginBottom:'1.5rem', border:`1px solid ${border}`, display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', flex:1, minWidth:'200px', background: inputBg, border:`1px solid ${border}`, borderRadius:'8px', padding:'0 12px' }}>
            <Search size={15} color={subtext} style={{ marginRight:'8px', flexShrink:0 }} />
            <input
              style={{ flex:1, padding:'8px 0', border:'none', background:'transparent', fontSize:'0.9rem', color: dark?'#e2e8f0':'#374151', outline:'none' }}
              placeholder="Rechercher par titre, description, adresse..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {search && (
              <button onClick={() => setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color: subtext, display:'flex' }}>
                <X size={14} />
              </button>
            )}
          </div>
          <select style={{ padding:'8px 12px', borderRadius:'8px', border:`1px solid ${border}`, fontSize:'0.9rem', background: inputBg, color: dark?'#e2e8f0':'#374151' }}
            value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
            {STATUTS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select style={{ padding:'8px 12px', borderRadius:'8px', border:`1px solid ${border}`, fontSize:'0.9rem', background: inputBg, color: dark?'#e2e8f0':'#374151' }}
            value={filtreCateg} onChange={e => setFiltreCateg(e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', color: subtext }}>Chargement...</div>
        ) : (
          <div style={{ background: bg, borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.08)', border:`1px solid ${border}` }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background: dark?'#0f172a':'#f8fafc' }}>
                  {['ID','Titre','Catégorie','Statut','Utilisateur','Date','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', color: subtext, fontWeight:'600', fontSize:'0.9rem', borderBottom:`1px solid ${border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr key={s.id}
                    initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom:`1px solid ${border}` }}>
                    <td style={{ padding:'12px 16px', color: subtext, fontSize:'0.85rem' }}>#{s.id}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ fontWeight:'500', color: text, fontSize:'0.9rem' }}>{s.titre}</div>
                      <div style={{ fontSize:'0.78rem', color: subtext }}>{s.adresse}</div>
                    </td>
                    <td style={{ padding:'12px 16px', color: subtext, fontSize:'0.85rem' }}>{s.categorie}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <select value={s.statut}
                        onChange={e => handleStatutChange(s.id, e.target.value, s.statut)}
                        style={{ padding:'4px 8px', borderRadius:'6px', border:'none', cursor:'pointer', fontWeight:'500', fontSize:'0.85rem', background: STATUT_STYLES[s.statut]?.bg, color: STATUT_STYLES[s.statut]?.color }}>
                        <option value="SIGNALE">Signalé</option>
                        <option value="EN_COURS">En cours</option>
                        <option value="RESOLU">Résolu</option>
                      </select>
                    </td>
                    <td style={{ padding:'12px 16px', color: subtext, fontSize:'0.85rem' }}>{s.userNom || s.userEmail}</td>
                    <td style={{ padding:'12px 16px', color: subtext, fontSize:'0.85rem' }}>
                      {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:'6px' }}>
                        <motion.button whileHover={{ scale:1.1 }} onClick={() => setSelected(s)}
                          style={{ padding:'6px 8px', background:'#eff6ff', color:'#1e40af', border:'1px solid #bfdbfe', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                          <Eye size={14} />
                        </motion.button>
                        <motion.button whileHover={{ scale:1.1 }} onClick={() => deleteSignalement(s.id)}
                          style={{ padding:'6px 8px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', display:'flex', alignItems:'center' }}>
                          <Trash2 size={14} />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div style={{ textAlign:'center', padding:'3rem', color: subtext }}>
                <Search size={32} color={subtext} style={{ margin:'0 auto 12px', display:'block' }} />
                <p>Aucun résultat trouvé</p>
              </div>
            )}
          </div>
        )}

        {/* Modal résolution */}
        {showResolutionModal && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
            onClick={() => setShowResolutionModal(false)}>
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              style={{ background:'#fff', borderRadius:'16px', maxWidth:'500px', width:'100%', padding:'2rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'0.5rem' }}>
                <CheckCircle size={20} color="#16a34a" />
                <h3 style={{ color:'#065f46', margin:0 }}>Marquer comme Résolu</h3>
              </div>
              <p style={{ color:'#6b7280', fontSize:'0.88rem', textAlign:'center', marginBottom:'1.5rem', lineHeight:1.5 }}>
                Ajoutez une photo du résultat et un commentaire pour montrer l'état après intervention.
              </p>

              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', marginBottom:'6px', color:'#374151', fontWeight:'600', fontSize:'0.9rem', display:'flex', alignItems:'center', gap:'6px' }}>
                  <Camera size={15} /> Photo après intervention <span style={{ color:'#9ca3af', fontWeight:'400' }}>(optionnel)</span>
                </label>
                <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px', background:'#f0fdf4', border:'1.5px dashed #86efac', borderRadius:'8px', cursor:'pointer', color:'#16a34a', fontSize:'0.9rem', fontWeight:'600' }}>
                  <input type="file" accept="image/*"
                    onChange={e => {
                      const f = e.target.files[0];
                      setPhotoApres(f);
                      setPhotoApresPreview(f ? URL.createObjectURL(f) : null);
                    }}
                    style={{ display:'none' }} />
                  <Upload size={16} />
                  {photoApres ? photoApres.name : 'Choisir une photo'}
                </label>
                {photoApresPreview && (
                  <img src={photoApresPreview} alt="aperçu"
                    style={{ width:'100%', height:'160px', objectFit:'cover', borderRadius:'8px', marginTop:'10px', border:'2px solid #86efac' }} />
                )}
              </div>

              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px', color:'#374151', fontWeight:'600', fontSize:'0.9rem' }}>
                  <MessageSquare size={15} /> Commentaire <span style={{ color:'#9ca3af', fontWeight:'400' }}>(optionnel)</span>
                </label>
                <textarea
                  value={commentaireResol}
                  onChange={e => setCommentaireResol(e.target.value)}
                  placeholder="Ex: La route a été réparée le 15/05/2026..."
                  style={{ width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'0.9rem', resize:'vertical', height:'80px', boxSizing:'border-box', fontFamily:'inherit' }}
                />
              </div>

              <div style={{ display:'flex', gap:'1rem' }}>
                <button onClick={() => setShowResolutionModal(false)}
                  style={{ flex:1, padding:'12px', background:'#f1f5f9', color:'#374151', border:'1px solid #d1d5db', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                  Annuler
                </button>
                <motion.button whileHover={{ scale:1.02 }} onClick={handleConfirmResolution} disabled={resolvingLoading}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px', background:'#16a34a', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'700' }}>
                  <CheckCircle size={15} />
                  {resolvingLoading ? 'Enregistrement...' : 'Confirmer la résolution'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal détails */}
        {selected && (
          <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
              style={{ background: bg, borderRadius:'16px', maxWidth:'620px', width:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelected(null)}
                style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(0,0,0,0.1)', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                <X size={16} />
              </button>

              {/* Before / After */}
              {(selected.photoUrl || selected.photoApresUrl) && (
                <div style={{ display:'grid', gridTemplateColumns: selected.photoApresUrl ? '1fr 1fr' : '1fr', gap:0 }}>
                  {selected.photoUrl && (
                    <div style={{ position:'relative' }}>
                      <img src={`http://localhost:8081${selected.photoUrl}`} alt="avant"
                        style={{ width:'100%', height:'200px', objectFit:'cover', borderRadius: selected.photoApresUrl ? '16px 0 0 0' : '16px 16px 0 0' }} />
                      <div style={{ position:'absolute', bottom:'8px', left:'8px', background:'rgba(0,0,0,0.6)', color:'#fff', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'700' }}>
                        Avant
                      </div>
                    </div>
                  )}
                  {selected.photoApresUrl && (
                    <div style={{ position:'relative' }}>
                      <img src={`http://localhost:8081${selected.photoApresUrl}`} alt="après"
                        style={{ width:'100%', height:'200px', objectFit:'cover', borderRadius: selected.photoUrl ? '0 16px 0 0' : '16px 16px 0 0' }} />
                      <div style={{ position:'absolute', bottom:'8px', right:'8px', background:'rgba(22,163,74,0.85)', color:'#fff', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'700' }}>
                        Après
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding:'1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', marginBottom:'1rem' }}>
                  <h2 style={{ color: text, margin:0, fontSize:'1.2rem' }}>{selected.titre}</h2>
                  <select value={selected.statut}
                    onChange={e => { handleStatutChange(selected.id, e.target.value, selected.statut); setSelected({ ...selected, statut: e.target.value }); }}
                    style={{ padding:'4px 8px', borderRadius:'6px', border:'none', background: STATUT_STYLES[selected.statut]?.bg, color: STATUT_STYLES[selected.statut]?.color, cursor:'pointer', fontWeight:'500' }}>
                    <option value="SIGNALE">Signalé</option>
                    <option value="EN_COURS">En cours</option>
                    <option value="RESOLU">Résolu</option>
                  </select>
                </div>

                <p style={{ color: subtext, lineHeight:'1.6', marginBottom:'1rem' }}>{selected.description}</p>

                {selected.commentaireResolution && (
                  <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.75rem', fontWeight:'700', color:'#16a34a', marginBottom:'4px' }}>
                      <MessageSquare size={12} /> Note d'intervention
                    </div>
                    <div style={{ fontSize:'0.85rem', color:'#065f46' }}>{selected.commentaireResolution}</div>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {[
                    { label:'Catégorie',   value: selected.categorie,   Icon: Tag },
                    { label:'Utilisateur', value: `${selected.userNom} (${selected.userEmail})`, Icon: User },
                    { label:'Adresse',     value: selected.adresse || '-', Icon: MapPin },
                    { label:'Date',        value: new Date(selected.createdAt).toLocaleDateString('fr-FR'), Icon: CalendarDays },
                  ].map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:`1px solid ${border}` }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'6px', color: subtext, fontWeight:'500', fontSize:'0.88rem' }}>
                        <item.Icon size={13} /> {item.label}
                      </span>
                      <span style={{ color: text, fontSize:'0.88rem' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {selected.latitude && selected.longitude && (
                  <div style={{ marginTop:'1rem' }}>
                    <p style={{ display:'flex', alignItems:'center', gap:'5px', color: subtext, marginBottom:'8px', fontWeight:'500', fontSize:'0.88rem' }}>
                      <MapPin size={13} /> Localisation
                    </p>
                    <MapContainer center={[selected.latitude, selected.longitude]} zoom={15}
                      style={{ height:'200px', borderRadius:'8px' }} key={selected.id}>
                      <TileLayer url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" attribution='&copy; Google Maps' />
                      <Marker position={[selected.latitude, selected.longitude]} />
                    </MapContainer>
                  </div>
                )}

                <motion.button whileHover={{ scale:1.01 }} onClick={() => deleteSignalement(selected.id)}
                  style={{ marginTop:'1rem', width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                  <Trash2 size={15} /> Supprimer ce signalement
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}