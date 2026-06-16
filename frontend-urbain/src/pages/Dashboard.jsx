import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import API from '../services/api';
import { isAdmin, isAdminVille, isSuperAdmin, getZone, isLogged } from '../services/auth';
import { useTheme } from '../context/ThemeContext';
import {
  Map, Globe, User, Users, MapPin, MessageSquare,
  Eye, Star, Tag, CalendarDays, X, ChevronRight
} from 'lucide-react';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl:       require('leaflet/dist/images/marker-icon.png'),
  shadowUrl:     require('leaflet/dist/images/marker-shadow.png'),
});

const STATUT_COLORS = { SIGNALE:'#ef4444', EN_COURS:'#3b82f6', RESOLU:'#22c55e' };
const STATUT_STYLES = {
  SIGNALE:  { bg:'#fef3c7', color:'#92400e', label:'Signalé'  },
  EN_COURS: { bg:'#dbeafe', color:'#1e40af', label:'En cours' },
  RESOLU:   { bg:'#d1fae5', color:'#065f46', label:'Résolu'   },
};

const getIcon = (statut) => L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;border-radius:50%;background:${STATUT_COLORS[statut]||'#888'};border:3px solid #fff;box-shadow:0 0 6px rgba(0,0,0,0.4);"></div>`,
  iconSize: [16, 16],
});

const StatutBadge = ({ statut }) => {
  const s = STATUT_STYLES[statut];
  if (!s) return null;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:'5px', padding:'2px 9px', borderRadius:'12px', fontSize:'0.78rem', fontWeight:'600', background:s.bg, color:s.color }}>
      <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:STATUT_COLORS[statut], display:'inline-block' }} />
      {s.label}
    </span>
  );
};

// ── Composant Avis ──────────────────────────────────────
function AvisSection({ signalementId, dark }) {
  const [avisList,    setAvisList]    = useState([]);
  const [moyenne,     setMoyenne]     = useState(0);
  const [total,       setTotal]       = useState(0);
  const [dejaAvis,    setDejaAvis]    = useState(false);
  const [note,        setNote]        = useState(0);
  const [hoverNote,   setHoverNote]   = useState(0);
  const [commentaire, setCommentaire] = useState('');
  const [loading,     setLoading]     = useState(false);
  const logged = isLogged();

  const text    = dark ? '#e2e8f0' : '#1e293b';
  const subtext = dark ? '#94a3b8' : '#64748b';
  const border  = dark ? '#334155' : '#f1f5f9';

  useEffect(() => { loadAvis(); if (logged) checkMonAvis(); }, [signalementId]);

  const loadAvis = () => {
    API.get(`/signalements/${signalementId}/avis`)
      .then(res => { setAvisList(res.data.avis||[]); setMoyenne(res.data.moyenne||0); setTotal(res.data.total||0); })
      .catch(() => {});
  };
  const checkMonAvis = () => {
    API.get(`/signalements/${signalementId}/avis/moi`)
      .then(res => setDejaAvis(res.data.dejaAvis)).catch(() => {});
  };
  const handleSubmit = async () => {
    if (!logged) { toast.info('Connectez-vous pour laisser un avis'); return; }
    if (note === 0) { toast.error('Veuillez sélectionner une note'); return; }
    setLoading(true);
    try {
      await API.post(`/signalements/${signalementId}/avis`, { note, commentaire });
      toast.success('Avis enregistré !');
      setDejaAvis(true); setNote(0); setCommentaire(''); loadAvis();
    } catch (err) { toast.error(err.response?.data?.message || 'Erreur');
    } finally { setLoading(false); }
  };

  const Stars = ({ value, interactive=false, size='1.4rem' }) => (
    <div style={{ display:'flex', gap:'2px' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          style={{ fontSize:size, cursor:interactive?'pointer':'default', color:i<=(interactive?(hoverNote||note):value)?'#f59e0b':'#d1d5db', transition:'color .15s' }}
          onClick={() => interactive && setNote(i)}
          onMouseEnter={() => interactive && setHoverNote(i)}
          onMouseLeave={() => interactive && setHoverNote(0)}>★</span>
      ))}
    </div>
  );

  return (
    <div style={{ marginTop:'1.5rem', borderTop:`1px solid ${border}`, paddingTop:'1.2rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontWeight:'700', color:text, fontSize:'0.95rem' }}>
          <Star size={15} color="#f59e0b" /> Avis citoyens
        </div>
        {total > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <Stars value={Math.round(moyenne)} size="1rem" />
            <span style={{ fontSize:'0.82rem', color:subtext }}>{moyenne}/5 ({total} avis)</span>
          </div>
        )}
      </div>

      {logged && !dejaAvis && (
        <div style={{ background:dark?'#0f172a':'#f8fafc', borderRadius:'10px', padding:'1rem', marginBottom:'1rem', border:`1px solid ${border}` }}>
          <div style={{ fontSize:'0.82rem', color:subtext, marginBottom:'8px', fontWeight:'600' }}>Votre évaluation :</div>
          <Stars value={note} interactive={true} size="1.8rem" />
          <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
            placeholder="Partagez votre avis sur la résolution... (optionnel)"
            style={{ width:'100%', marginTop:'10px', padding:'8px 12px', borderRadius:'8px', border:`1px solid ${border}`, fontSize:'0.82rem', resize:'vertical', height:'70px', boxSizing:'border-box', fontFamily:'inherit', background:dark?'#1e293b':'#fff', color:text, outline:'none' }} />
          <button onClick={handleSubmit} disabled={loading||note===0}
            style={{ marginTop:'8px', padding:'8px 20px', background:note===0?'#9ca3af':'#f59e0b', color:'#fff', border:'none', borderRadius:'8px', cursor:note===0?'not-allowed':'pointer', fontWeight:'700', fontSize:'0.85rem' }}>
            {loading ? 'Envoi...' : 'Envoyer mon avis'}
          </button>
        </div>
      )}

      {!logged && (
        <div style={{ background:dark?'#0f172a':'#f8fafc', borderRadius:'10px', padding:'0.8rem 1rem', marginBottom:'1rem', fontSize:'0.82rem', color:subtext, textAlign:'center' }}>
          <Link to="/login" style={{ color:'#2563eb', fontWeight:'600' }}>Connectez-vous</Link> pour laisser un avis
        </div>
      )}

      {dejaAvis && (
        <div style={{ background:'#fef3c7', borderRadius:'8px', padding:'8px 12px', marginBottom:'1rem', fontSize:'0.82rem', color:'#92400e', fontWeight:'600' }}>
          Vous avez déjà laissé un avis sur ce signalement
        </div>
      )}

      {avisList.length === 0 ? (
        <p style={{ color:subtext, fontSize:'0.82rem', textAlign:'center', padding:'1rem 0' }}>Aucun avis pour le moment.</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {avisList.map(a => (
            <div key={a.id} style={{ background:dark?'#0f172a':'#f8fafc', borderRadius:'8px', padding:'10px 12px', border:`1px solid ${border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', fontWeight:'600', color:text, fontSize:'0.82rem' }}>
                  <User size={12} /> {a.userNom}
                </div>
                <Stars value={a.note} size="0.95rem" />
              </div>
              {a.commentaire && <p style={{ color:subtext, fontSize:'0.78rem', margin:0, lineHeight:1.5 }}>{a.commentaire}</p>}
              <div style={{ color:subtext, fontSize:'0.7rem', marginTop:'4px' }}>{new Date(a.createdAt).toLocaleDateString('fr-FR')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { dark } = useTheme();
  const [allSignalements, setAllSignalements]   = useState([]);
  const [mineSignalements, setMineSignalements] = useState([]);
  const [vue, setVue]                 = useState('tous');
  const [filtreStatut, setFiltreStatut] = useState('TOUS');
  const [filtreZone, setFiltreZone]     = useState('TOUS');
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);

  const admin      = isAdmin();
  const adminVille = isAdminVille();
  const superAdmin = isSuperAdmin();
  const myZone     = getZone();

  const cardBg  = dark ? '#1e293b' : '#fff';
  const text    = dark ? '#e2e8f0' : '#1e293b';
  const subtext = dark ? '#94a3b8' : '#64748b';
  const border  = dark ? '#334155' : '#f1f5f9';

  useEffect(() => {
    const p1 = API.get('/signalements/public').then(res => setAllSignalements(res.data));
    const p2 = API.get('/signalements/mes-signalements').then(res => setMineSignalements(res.data));
    Promise.all([p1, p2]).catch(() => toast.error('Erreur de chargement')).finally(() => setLoading(false));
  }, []);

  const source = vue === 'moi' ? mineSignalements : allSignalements;
  const filtered = source
    .filter(s => filtreStatut === 'TOUS' || s.statut === filtreStatut)
    .filter(s => {
      if (filtreZone === 'TOUS') return true;
      if (!s.adresse) return false;
      return s.adresse.toLowerCase().includes(filtreZone.toLowerCase());
    });

  return (
    <div style={{ height:'calc(100vh - 64px)', display:'flex', flexDirection:'column' }}>

      {/* Barre de contrôle */}
      <div style={styles.bar}>
        <span style={{ ...styles.barTitle, display:'flex', alignItems:'center', gap:'6px' }}>
          <Map size={16} />
          {filtered.length} signalement(s)
          {filtreZone !== 'TOUS' && (
            <span style={{ marginLeft:'4px', fontSize:'0.8rem', background:'#dbeafe', color:'#1e40af', padding:'2px 8px', borderRadius:'10px', display:'flex', alignItems:'center', gap:'3px' }}>
              <MapPin size={11} /> {filtreZone}
            </span>
          )}
        </span>
        <div style={styles.controls}>
          {admin && (
            <div style={styles.zoneFilter}>
              <span style={{ fontSize:'0.85rem', color:'#6b7280', display:'flex', alignItems:'center', gap:'3px' }}>
                <MapPin size={13} /> Zone :
              </span>
              <button onClick={() => setFiltreZone('TOUS')} style={{ ...styles.zoneBtn, background:filtreZone==='TOUS'?'#1e40af':'#fff', color:filtreZone==='TOUS'?'#fff':'#374151' }}>
                <Globe size={12} style={{ marginRight:'3px' }} /> Toutes
              </button>
              {adminVille && myZone && (
                <button onClick={() => setFiltreZone(myZone)} style={{ ...styles.zoneBtn, background:filtreZone===myZone?'#1e40af':'#fff', color:filtreZone===myZone?'#fff':'#374151' }}>
                  <MapPin size={12} style={{ marginRight:'3px' }} /> {myZone}
                </button>
              )}
              {superAdmin && ['Casablanca','Mohammedia','Rabat','Salé','Marrakech','Fès','Tanger','Agadir','Oujda','Kenitra','Tétouan','Meknès'].map(z => (
                <button key={z} onClick={() => setFiltreZone(z)} style={{ ...styles.zoneBtn, background:filtreZone===z?'#1e40af':'#fff', color:filtreZone===z?'#fff':'#374151' }}>{z}</button>
              ))}
            </div>
          )}
          {!admin && (
            <div style={styles.toggle}>
              <button onClick={() => setVue('tous')} style={{ ...styles.toggleBtn, background:vue==='tous'?'#1e40af':'#fff', color:vue==='tous'?'#fff':'#374151', display:'flex', alignItems:'center', gap:'5px' }}>
                <Globe size={13} /> Tous
              </button>
              <button onClick={() => setVue('moi')} style={{ ...styles.toggleBtn, background:vue==='moi'?'#1e40af':'#fff', color:vue==='moi'?'#fff':'#374151', display:'flex', alignItems:'center', gap:'5px' }}>
                <User size={13} /> Les miens
              </button>
            </div>
          )}
          <div style={styles.filters}>
            {[
              { key:'TOUS',     label:'Tous' },
              { key:'SIGNALE',  label:'Signalé' },
              { key:'EN_COURS', label:'En cours' },
              { key:'RESOLU',   label:'Résolu' },
            ].map(f => (
              <button key={f.key} onClick={() => setFiltreStatut(f.key)}
                style={{ ...styles.filterBtn, display:'flex', alignItems:'center', gap:'5px', background:filtreStatut===f.key?'#1e40af':'#fff', color:filtreStatut===f.key?'#fff':'#374151' }}>
                {f.key !== 'TOUS' && <span style={{ width:'8px', height:'8px', borderRadius:'50%', background: STATUT_COLORS[f.key], display:'inline-block' }} />}
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Légende */}
      <div style={styles.legend}>
        {Object.entries(STATUT_STYLES).map(([key, val]) => (
          <span key={key} style={styles.legendItem}>
            <span style={{ display:'inline-block', width:'10px', height:'10px', borderRadius:'50%', background:STATUT_COLORS[key], marginRight:'4px' }}/>
            {val.label}
          </span>
        ))}
      </div>

      {/* Carte */}
      {loading ? (
        <div style={styles.center}>Chargement de la carte...</div>
      ) : (
        <MapContainer center={[33.5731, -7.5898]} zoom={12} style={{ flex:1 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
          {filtered.map(s => s.latitude && s.longitude && (
            <Marker key={s.id} position={[s.latitude, s.longitude]} icon={getIcon(s.statut)}>
              <Popup>
                <div style={{ minWidth:'220px' }}>
                  {(s.photoUrl || s.photoApresUrl) && (
                    <div style={{ display:'grid', gridTemplateColumns:s.photoUrl&&s.photoApresUrl?'1fr 1fr':'1fr', gap:'4px', marginBottom:'8px' }}>
                      {s.photoUrl && (
                        <div style={{ position:'relative' }}>
                          <img src={`http://localhost:8081${s.photoUrl}`} alt="avant" style={{ width:'100%', height:'90px', objectFit:'cover', borderRadius:'6px' }} />
                          <div style={{ position:'absolute', bottom:'4px', left:'4px', background:'rgba(0,0,0,0.6)', color:'#fff', padding:'1px 6px', borderRadius:'10px', fontSize:'0.65rem', fontWeight:'700' }}>Avant</div>
                        </div>
                      )}
                      {s.photoApresUrl && (
                        <div style={{ position:'relative' }}>
                          <img src={`http://localhost:8081${s.photoApresUrl}`} alt="après" style={{ width:'100%', height:'90px', objectFit:'cover', borderRadius:'6px' }} />
                          <div style={{ position:'absolute', bottom:'4px', right:'4px', background:'rgba(22,163,74,0.85)', color:'#fff', padding:'1px 6px', borderRadius:'10px', fontSize:'0.65rem', fontWeight:'700' }}>Après</div>
                        </div>
                      )}
                    </div>
                  )}

                  <strong style={{ color:'#1e40af', fontSize:'1rem' }}>{s.titre}</strong>
                  <p style={{ margin:'6px 0', fontSize:'0.85rem', color:'#374151' }}>{s.description}</p>

                  {s.commentaireResolution && (
                    <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'6px', padding:'5px 8px', margin:'6px 0', fontSize:'0.78rem', color:'#065f46', display:'flex', gap:'4px' }}>
                      <MessageSquare size={12} style={{ flexShrink:0, marginTop:'2px' }} /> {s.commentaireResolution}
                    </div>
                  )}

                  <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'8px' }}>
                    <StatutBadge statut={s.statut} />
                    <span style={{ display:'flex', alignItems:'center', gap:'3px', fontSize:'0.8rem', color:'#6b7280' }}>
                      <Tag size={11} /> {s.categorie}
                    </span>
                  </div>
                  {s.adresse && (
                    <p style={{ display:'flex', alignItems:'center', gap:'3px', margin:'6px 0 0', fontSize:'0.8rem', color:'#6b7280' }}>
                      <MapPin size={11} /> {s.adresse}
                    </p>
                  )}
                  <p style={{ display:'flex', alignItems:'center', gap:'3px', margin:'4px 0 8px', fontSize:'0.8rem', color:'#9ca3af' }}>
                    <User size={11} /> {s.userNom}
                  </p>

                  <button onClick={() => setSelected(s)}
                    style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'7px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'7px', cursor:'pointer', fontWeight:'600', fontSize:'0.82rem' }}>
                    {s.statut === 'RESOLU' ? <><Star size={13}/> Voir détails & avis</> : <><Eye size={13}/> Voir détails</>}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Modal détails + avis */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}
            onClick={() => setSelected(null)}>
            <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
              style={{ background:cardBg, borderRadius:'16px', maxWidth:'560px', width:'100%', maxHeight:'90vh', overflowY:'auto', position:'relative' }}
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelected(null)}
                style={{ position:'absolute', top:'12px', right:'12px', background:'rgba(0,0,0,0.1)', border:'none', borderRadius:'50%', width:'32px', height:'32px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
                <X size={16} />
              </button>

              {(selected.photoUrl || selected.photoApresUrl) && (
                <div style={{ display:'grid', gridTemplateColumns:selected.photoUrl&&selected.photoApresUrl?'1fr 1fr':'1fr', gap:0 }}>
                  {selected.photoUrl && (
                    <div style={{ position:'relative' }}>
                      <img src={`http://localhost:8081${selected.photoUrl}`} alt="avant"
                        style={{ width:'100%', height:'200px', objectFit:'cover', borderRadius:selected.photoApresUrl?'16px 0 0 0':'16px 16px 0 0' }} />
                      <div style={{ position:'absolute', bottom:'8px', left:'8px', background:'rgba(0,0,0,0.6)', color:'#fff', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'700' }}>Avant</div>
                    </div>
                  )}
                  {selected.photoApresUrl && (
                    <div style={{ position:'relative' }}>
                      <img src={`http://localhost:8081${selected.photoApresUrl}`} alt="après"
                        style={{ width:'100%', height:'200px', objectFit:'cover', borderRadius:selected.photoUrl?'0 16px 0 0':'16px 16px 0 0' }} />
                      <div style={{ position:'absolute', bottom:'8px', right:'8px', background:'rgba(22,163,74,0.85)', color:'#fff', padding:'3px 10px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'700' }}>Après</div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ padding:'1.5rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'1rem', marginBottom:'1rem' }}>
                  <h2 style={{ color:text, margin:0, fontSize:'1.2rem' }}>{selected.titre}</h2>
                  <StatutBadge statut={selected.statut} />
                </div>
                <p style={{ color:subtext, lineHeight:'1.6', marginBottom:'1rem' }}>{selected.description}</p>

                {selected.commentaireResolution && (
                  <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', padding:'10px 14px', marginBottom:'1rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.75rem', fontWeight:'700', color:'#16a34a', marginBottom:'4px' }}>
                      <MessageSquare size={12} /> Note d'intervention
                    </div>
                    <div style={{ fontSize:'0.85rem', color:'#065f46' }}>{selected.commentaireResolution}</div>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1rem' }}>
                  {[
                    { label:'Catégorie',   value: selected.categorie,          Icon: Tag },
                    { label:'Adresse',     value: selected.adresse || '-',     Icon: MapPin },
                    { label:'Signalé par', value: selected.userNom||'Anonyme', Icon: User },
                    { label:'Date',        value: new Date(selected.createdAt).toLocaleDateString('fr-FR'), Icon: CalendarDays },
                  ].map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:`1px solid ${border}` }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'6px', color:subtext, fontWeight:'600', fontSize:'0.88rem' }}>
                        <item.Icon size={13} /> {item.label}
                      </span>
                      <span style={{ color:text, fontSize:'0.88rem' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {selected.statut === 'RESOLU' && (
                  <AvisSection signalementId={selected.id} dark={dark} />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const styles = {
  bar:       { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.8rem 1.5rem', background:'#fff', borderBottom:'1px solid #e5e7eb', flexWrap:'wrap', gap:'0.5rem' },
  barTitle:  { color:'#1e40af', fontWeight:'600' },
  controls:  { display:'flex', gap:'1rem', alignItems:'center', flexWrap:'wrap' },
  toggle:    { display:'flex', borderRadius:'8px', overflow:'hidden', border:'1px solid #d1d5db' },
  toggleBtn: { padding:'6px 14px', border:'none', cursor:'pointer', fontSize:'0.85rem', fontWeight:'500' },
  filters:   { display:'flex', gap:'0.4rem', flexWrap:'wrap' },
  filterBtn: { padding:'6px 12px', borderRadius:'20px', border:'1px solid #d1d5db', cursor:'pointer', fontSize:'0.8rem', fontWeight:'500' },
  zoneFilter:{ display:'flex', gap:'0.4rem', alignItems:'center', flexWrap:'wrap', background:'#f8fafc', padding:'6px 10px', borderRadius:'8px', border:'1px solid #e5e7eb' },
  zoneBtn:   { padding:'4px 10px', borderRadius:'16px', border:'1px solid #d1d5db', cursor:'pointer', fontSize:'0.8rem', fontWeight:'500', display:'flex', alignItems:'center' },
  legend:    { display:'flex', gap:'1rem', padding:'0.4rem 1.5rem', background:'#f8fafc', borderBottom:'1px solid #e5e7eb', flexWrap:'wrap' },
  legendItem:{ fontSize:'0.8rem', color:'#6b7280', display:'flex', alignItems:'center' },
  center:    { flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#6b7280' },
};