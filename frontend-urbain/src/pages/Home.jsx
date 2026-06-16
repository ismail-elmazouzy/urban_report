import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { isLogged } from '../services/auth';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import API from '../services/api';
import {
  MapPin, Lightbulb, Trash2, Droplets, Wrench,
  Search, Camera, Bell, CheckCircle, Clock, AlertCircle,
  Users, Building2, ChevronRight, X, ThumbsUp,
  Road, Navigation, CalendarDays, User, Tag
} from 'lucide-react';

const STATUT_STYLES = {
  SIGNALE:  { bg:'#fef3c7', color:'#78350f', label:'Signalé',  Icon: AlertCircle },
  EN_COURS: { bg:'#dbeafe', color:'#1e40af', label:'En cours', Icon: Clock },
  RESOLU:   { bg:'#dcfce7', color:'#14532d', label:'Résolu',   Icon: CheckCircle },
};

const CATEGORIE_ICONS = {
  VOIRIE:    MapPin,
  ECLAIRAGE: Lightbulb,
  DECHETS:   Trash2,
  EAU:       Droplets,
  AUTRE:     Wrench,
};

function AnimatedCounter({ target, duration = 1800 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current && target > 0) {
        started.current = true;
        const start = performance.now();
        const tick = (now) => {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          const ease = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(ease * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{count}</span>;
}

// ── Composant Avis ────────────────────────────────────
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
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
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
        <div style={{ fontWeight:'700', color:text, fontSize:'0.95rem' }}>Avis citoyens</div>
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
        <p style={{ color:subtext, fontSize:'0.82rem', textAlign:'center', padding:'1rem 0' }}>Aucun avis pour le moment. Soyez le premier !</p>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
          {avisList.map(a => (
            <div key={a.id} style={{ background:dark?'#0f172a':'#f8fafc', borderRadius:'8px', padding:'10px 12px', border:`1px solid ${border}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontWeight:'600', color:text, fontSize:'0.82rem' }}>
                  <User size={13} color={subtext} /> {a.userNom}
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

export default function Home() {
  const { dark } = useTheme();
  const [allSignalements, setAllSignalements]       = useState([]);
  const [recentSignalements, setRecentSignalements] = useState([]);
  const [nearbySignalements, setNearbySignalements] = useState([]);
  const [stats, setStats]   = useState({ total:0, semaine:0, resolu:0, enCours:0 });
  const [search, setSearch] = useState('');
  const [showNearby, setShowNearby]   = useState(false);
  const [loadingPos, setLoadingPos]   = useState(false);
  const [joined, setJoined]           = useState({});
  const [selected, setSelected]       = useState(null);
  const navigate = useNavigate();

  const text    = dark ? '#e2e8f0' : '#1e293b';
  const subtext = dark ? '#94a3b8' : '#64748b';
  const border  = dark ? '#334155' : '#fde68a';
  const cardBg  = dark ? '#1e293b' : '#fff';

  useEffect(() => {
    API.get('/signalements/public').then(res => {
      const data = res.data;
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
      setStats({
        total:   data.length,
        semaine: data.filter(s => new Date(s.createdAt) > weekAgo).length,
        resolu:  data.filter(s => s.statut === 'RESOLU').length,
        enCours: data.filter(s => s.statut === 'EN_COURS').length,
      });
      setAllSignalements(data);
      setRecentSignalements(data.slice(0, 5));
    }).catch(() => {});
  }, []);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const handleGetPosition = () => {
    setLoadingPos(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setSearch(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        setNearbySignalements(allSignalements.filter(s =>
          s.latitude && s.longitude && getDistance(latitude, longitude, s.latitude, s.longitude) < 2));
        setShowNearby(true); setLoadingPos(false);
      },
      () => { toast.error("Impossible d'obtenir votre position"); setLoadingPos(false); }
    );
  };

  const handleSearch = (e) => { e.preventDefault(); setNearbySignalements(allSignalements.slice(0,5)); setShowNearby(true); };

  const handleRejoindre = async (signalement) => {
    if (!isLogged()) { navigate('/login'); return; }
    try {
      await API.post(`/signalements/${signalement.id}/rejoindre`);
      setJoined(prev => ({ ...prev, [signalement.id]: true }));
      toast.success('Votre signalement a été pris en compte !');
    } catch { toast.error('Erreur'); }
  };

  const StatutBadge = ({ statut }) => {
    const s = STATUT_STYLES[statut];
    if (!s) return null;
    const Icon = s.Icon;
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'3px 10px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700', background:s.bg, color:s.color }}>
        <Icon size={12} /> {s.label}
      </span>
    );
  };

  const CatIcon = ({ categorie, size=16, color='currentColor' }) => {
    const Icon = CATEGORIE_ICONS[categorie] || Wrench;
    return <Icon size={size} color={color} />;
  };

  const RightPanel = () => {
    if (!showNearby) {
      return (
        <div style={{ background:dark?'rgba(30,41,59,0.92)':'rgba(255,255,255,0.92)', border:`1.5px solid ${border}`, borderRadius:'14px', padding:'1.2rem', backdropFilter:'blur(8px)' }}>
          <h3 style={{ color:'#1e3a8a', fontWeight:'700', fontSize:'0.95rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'8px' }}>
            <span style={{ background:'#2563eb', color:'#fff', padding:'2px 7px', borderRadius:'5px', fontSize:'0.7rem', fontWeight:'700' }}>NEW</span>
            Signalements récents
          </h3>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {recentSignalements.length === 0 ? (
              <p style={{ color:subtext, fontSize:'0.9rem' }}>Aucun signalement</p>
            ) : recentSignalements.map(s => (
              <motion.div key={s.id} whileHover={{ scale:1.01 }} onClick={() => setSelected(s)}
                style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:`1px solid ${dark?'#334155':'#f1f5f9'}`, cursor:'pointer' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:'600', color:text, fontSize:'0.88rem', marginBottom:'2px' }}>{s.titre}</div>
                  <div style={{ color:subtext, fontSize:'0.75rem' }}>
                    {new Date(s.createdAt).toLocaleDateString('fr-FR')}{s.adresse && ` • ${s.adresse}`}
                  </div>
                </div>
                {s.photoUrl ? (
                  <img src={`http://localhost:8081${s.photoUrl}`} alt={s.titre}
                    style={{ width:'44px', height:'44px', objectFit:'cover', borderRadius:'6px', marginLeft:'10px' }} />
                ) : (
                  <motion.div whileHover={{ scale:1.15 }}
                    style={{ width:'44px', height:'44px', background:dark?'#0f172a':'#f1f5f9', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', marginLeft:'10px' }}>
                    <CatIcon categorie={s.categorie} size={20} color={subtext} />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        style={{ background:dark?'rgba(30,41,59,0.92)':'rgba(255,255,255,0.92)', border:`1.5px solid ${border}`, borderRadius:'14px', padding:'1.2rem', maxHeight:'420px', overflowY:'auto', backdropFilter:'blur(8px)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ color:'#1e3a8a', fontWeight:'700', fontSize:'0.95rem' }}>
            {nearbySignalements.length} signalement(s) trouvé(s)
          </h3>
          <button onClick={() => setShowNearby(false)} style={{ background:'none', border:'none', color:subtext, cursor:'pointer' }}>
            <X size={16} />
          </button>
        </div>
        {nearbySignalements.length === 0 ? (
          <div style={{ textAlign:'center', padding:'1.5rem' }}>
            <CheckCircle size={40} color="#16a34a" style={{ margin:'0 auto 12px' }} />
            <p style={{ color:text, fontWeight:'600', marginBottom:'0.5rem', fontSize:'0.9rem' }}>Aucun problème ici !</p>
            <button onClick={() => isLogged() ? navigate('/signaler') : navigate('/login')}
              style={{ padding:'8px 20px', background:'#2563eb', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem' }}>
              Créer un signalement
            </button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
            {nearbySignalements.map(s => (
              <motion.div key={s.id} whileHover={{ scale:1.01 }}
                style={{ background:dark?'#0f172a':'#f8fafc', border:`1px solid ${dark?'#334155':'#e2e8f0'}`, borderRadius:'10px', overflow:'hidden' }}>
                <div onClick={() => setSelected(s)} style={{ padding:'0.8rem', cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'8px' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', fontWeight:'700', color:text, fontSize:'0.88rem', marginBottom:'4px' }}>
                        <CatIcon categorie={s.categorie} size={14} color={subtext} />
                        {s.titre}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', color:subtext, fontSize:'0.75rem' }}>
                        <MapPin size={11} /> {s.adresse || 'Zone proche'} — {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <StatutBadge statut={s.statut} />
                  </div>
                </div>
                {s.statut !== 'RESOLU' && (
                  <div style={{ padding:'6px 10px', borderTop:`1px solid ${dark?'#334155':'#e2e8f0'}`, background:dark?'#1e293b':'#f1f5f9' }}>
                    {joined[s.id] ? (
                      <span style={{ display:'flex', alignItems:'center', gap:'4px', color:'#16a34a', fontWeight:'600', fontSize:'0.8rem' }}>
                        <CheckCircle size={13} /> Signalé
                      </span>
                    ) : (
                      <motion.button whileHover={{ scale:1.03 }} onClick={() => handleRejoindre(s)}
                        style={{ display:'flex', alignItems:'center', gap:'6px', padding:'4px 12px', background:'#f0fdf4', color:'#15803d', border:'1px solid #86efac', borderRadius:'6px', cursor:'pointer', fontWeight:'600', fontSize:'0.8rem' }}>
                        <ThumbsUp size={13} /> J'ai le même problème
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
            <motion.button whileHover={{ scale:1.01 }} onClick={() => isLogged() ? navigate('/signaler') : navigate('/login')}
              style={{ padding:'10px', background:'transparent', color:'#2563eb', border:`1.5px dashed ${dark?'#334155':'#bfdbfe'}`, borderRadius:'10px', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem' }}>
              Mon problème n'est pas dans la liste
            </motion.button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div style={{ minHeight:'100vh', background:dark?'#0f172a':'#f8fafc' }}>

      {/* Hero */}
      <div style={{ position:'relative', padding:'3rem 2rem', borderBottom:`1px solid ${border}`, minHeight:'420px', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, overflow:'hidden', zIndex:0 }}>
          <video autoPlay muted loop playsInline
            style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', minWidth:'100%', minHeight:'100%', objectFit:'cover', pointerEvents:'none' }}>
            <source src="/back.mp4" type="video/mp4" />
          </video>
        </div>
        <div style={{ position:'absolute', inset:0, background:dark?'rgba(15,23,42,0.85)':'rgba(10,20,50,0.58)', zIndex:1 }} />
        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ maxWidth:'1100px', margin:'0 auto', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2.5rem', alignItems:'start' }}>
            <div>
              <motion.h1 initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }}
                style={{ fontSize:'2rem', fontWeight:'800', color:'#ffffff', marginBottom:'0.8rem', lineHeight:1.3, textShadow:'0 2px 16px rgba(0,0,0,0.5)' }}>
                Signalez les problèmes de votre quartier
              </motion.h1>
              <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
                style={{ color:'rgba(255,255,255,0.82)', marginBottom:'2rem', fontSize:'0.95rem', lineHeight:1.6 }}>
                Nids de poule, éclairage défectueux, déchets, eau... Localisez et signalez en quelques secondes.
              </motion.p>
              <div style={{ background:dark?'rgba(30,41,59,0.92)':'rgba(255,255,255,0.92)', borderRadius:'12px', padding:'1.2rem', marginBottom:'1rem', border:`1px solid ${border}`, backdropFilter:'blur(10px)' }}>
                <form onSubmit={handleSearch} style={{ display:'flex', marginBottom:'1rem' }}>
                  <input
                    style={{ flex:1, padding:'10px 14px', border:`1.5px solid ${dark?'#334155':'#fbbf24'}`, borderRadius:'8px 0 0 8px', fontSize:'0.9rem', outline:'none', background:dark?'#0f172a':'#fff', color:text }}
                    placeholder="Entrez votre adresse ou quartier..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                  <motion.button type="submit" whileHover={{ scale:1.03 }}
                    style={{ display:'flex', alignItems:'center', gap:'6px', padding:'10px 18px', background:'#2563eb', color:'#fff', border:'none', borderRadius:'0 8px 8px 0', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem' }}>
                    <Search size={15} /> Rechercher
                  </motion.button>
                </form>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'10px 0', color:subtext, fontSize:'0.82rem' }}>
                  <div style={{ flex:1, height:'1px', background:dark?'#334155':'#cbd5e1' }} /> ou <div style={{ flex:1, height:'1px', background:dark?'#334155':'#cbd5e1' }} />
                </div>
                <Link to="/signaler"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'10px', background:dark?'#1e293b':'#fefce8', color:'#1d4ed8', border:`1.5px solid ${dark?'#334155':'#fbbf24'}`, borderRadius:'8px', textDecoration:'none', fontWeight:'700', fontSize:'0.85rem' }}>
                  <Camera size={15} /> Commencer avec une photo
                </Link>
              </div>
              <motion.button whileHover={{ scale:1.02 }} onClick={handleGetPosition} disabled={loadingPos}
                style={{ display:'flex', alignItems:'center', gap:'6px', background:'none', border:'none', color:'rgba(255,255,255,0.9)', cursor:'pointer', fontSize:'0.85rem', textDecoration:'underline', fontWeight:'600', padding:0 }}>
                <Navigation size={14} /> {loadingPos ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
              </motion.button>
            </div>
            <RightPanel />
          </div>
        </div>
      </div>

      {/* Réalisations */}
      <div style={{ background:dark?'#1e293b':'#f8fafc', borderTop:`1px solid ${dark?'#334155':'#e2e8f0'}`, borderBottom:`1px solid ${dark?'#334155':'#e2e8f0'}`, padding:'3rem 2rem' }}>
        <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'#dcfce7', color:'#16a34a', padding:'4px 14px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'12px' }}>
              <CheckCircle size={13} /> Problèmes résolus
            </span>
            <h2 style={{ fontSize:'1.7rem', fontWeight:'800', color:dark?'#e2e8f0':'#0f172a', margin:0 }}>Nos réalisations</h2>
            <p style={{ color:subtext, marginTop:'8px', fontSize:'0.9rem' }}>Découvrez les problèmes signalés et résolus par notre équipe</p>
          </motion.div>

          {allSignalements.filter(s => s.statut==='RESOLU' && (s.photoUrl||s.photoApresUrl)).length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', color:subtext }}>
              <p>Les réalisations apparaîtront ici une fois les signalements résolus.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'1.2rem' }}>
              {allSignalements.filter(s => s.statut==='RESOLU' && (s.photoUrl||s.photoApresUrl)).slice(0,5).map((s, i) => (
                <motion.div key={s.id}
                  initial={{ opacity:0, x:-20 }} whileInView={{ opacity:1, x:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                  whileHover={{ y:-4, boxShadow:'0 16px 40px rgba(0,0,0,0.12)' }}
                  onClick={() => setSelected(s)}
                  style={{ background:dark?'#0f172a':'#fff', borderRadius:'16px', border:`1px solid ${dark?'#334155':'#e2e8f0'}`, overflow:'hidden', cursor:'pointer', display:'grid', gridTemplateColumns:'auto 1fr', transition:'box-shadow .3s' }}>
                  <div style={{ display:'grid', gridTemplateColumns:s.photoUrl&&s.photoApresUrl?'1fr 1fr':'1fr', width:s.photoUrl&&s.photoApresUrl?'320px':'160px', flexShrink:0 }}>
                    {s.photoUrl && (
                      <div style={{ position:'relative' }}>
                        <img src={`http://localhost:8081${s.photoUrl}`} alt="avant" style={{ width:'100%', height:'140px', objectFit:'cover' }} />
                        <div style={{ position:'absolute', bottom:'6px', left:'6px', background:'rgba(0,0,0,0.65)', color:'#fff', padding:'2px 8px', borderRadius:'12px', fontSize:'0.65rem', fontWeight:'700' }}>Avant</div>
                      </div>
                    )}
                    {s.photoApresUrl && (
                      <div style={{ position:'relative' }}>
                        <img src={`http://localhost:8081${s.photoApresUrl}`} alt="après" style={{ width:'100%', height:'140px', objectFit:'cover' }} />
                        <div style={{ position:'absolute', bottom:'6px', right:'6px', background:'rgba(22,163,74,0.85)', color:'#fff', padding:'2px 8px', borderRadius:'12px', fontSize:'0.65rem', fontWeight:'700' }}>Après</div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding:'1rem 1.2rem', display:'flex', flexDirection:'column', justifyContent:'center', gap:'8px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' }}>
                      <span style={{ fontWeight:'700', color:dark?'#e2e8f0':'#0f172a', fontSize:'0.95rem' }}>{s.titre}</span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'20px', fontSize:'0.7rem', fontWeight:'700', background:'#dcfce7', color:'#065f46' }}>
                        <CheckCircle size={11} /> Résolu
                      </span>
                    </div>
                    {s.commentaireResolution && (
                      <div style={{ background:dark?'#0f2a1a':'#f0fdf4', border:'1px solid #86efac', borderRadius:'8px', padding:'6px 10px', fontSize:'0.8rem', color:dark?'#86efac':'#065f46', lineHeight:1.4 }}>
                        {s.commentaireResolution}
                      </div>
                    )}
                    <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
                      {s.adresse && (
                        <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'0.76rem', color:subtext }}>
                          <MapPin size={11} /> {s.adresse}
                        </span>
                      )}
                      <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'0.76rem', color:subtext }}>
                        <CalendarDays size={11} /> {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'0.76rem', color:subtext }}>
                        <User size={11} /> {s.userNom || 'Anonyme'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comment ça marche */}
      <div style={{ padding:'4rem 2rem', background:dark?'#0f172a':'#fff' }}>
        <div style={{ maxWidth:'960px', margin:'0 auto' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'3rem' }}>
            <span style={{ display:'inline-block', background:dark?'#1e3a8a22':'#dbeafe', color:'#2563eb', padding:'4px 14px', borderRadius:'20px', fontSize:'0.75rem', fontWeight:'700', letterSpacing:'1px', textTransform:'uppercase', marginBottom:'12px' }}>Simple &amp; rapide</span>
            <h2 style={{ fontSize:'1.7rem', fontWeight:'800', color:dark?'#e2e8f0':'#0f172a', margin:0 }}>Comment ça marche ?</h2>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'0', position:'relative' }}>
            <div style={{ position:'absolute', top:'36px', left:'12.5%', right:'12.5%', height:'2px', background:dark?'#334155':'#e2e8f0', zIndex:0 }} />
            {[
              { step:'01', Icon:MapPin,     name:'Localisez', desc:'Entrez votre adresse ou utilisez la géolocalisation.', color:'#2563eb', bg:'#dbeafe' },
              { step:'02', Icon:Search,     name:'Vérifiez',  desc:'Consultez les signalements existants dans votre zone.', color:'#d97706', bg:'#fef3c7' },
              { step:'03', Icon:Camera,     name:'Signalez',  desc:'Créez un signalement ou rejoignez un existant.', color:'#16a34a', bg:'#dcfce7' },
              { step:'04', Icon:Bell,       name:'Suivez',    desc:"Recevez des notifications jusqu'à la résolution.", color:'#db2777', bg:'#fce7f3' },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.15 }} whileHover={{ y:-6 }}
                style={{ position:'relative', zIndex:1, textAlign:'center', padding:'0 1rem' }}>
                <motion.div whileHover={{ scale:1.12, rotate:3 }}
                  style={{ width:'72px', height:'72px', borderRadius:'50%', background:s.bg, border:`3px solid ${s.color}`, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 1rem', boxShadow:`0 4px 20px ${s.color}33` }}>
                  <s.Icon size={28} color={s.color} />
                </motion.div>
                <div style={{ fontSize:'0.62rem', fontWeight:'800', letterSpacing:'2px', color:s.color, marginBottom:'6px', textTransform:'uppercase' }}>Etape {s.step}</div>
                <div style={{ color:dark?'#e2e8f0':'#0f172a', fontWeight:'700', fontSize:'0.95rem', marginBottom:'8px' }}>{s.name}</div>
                <div style={{ color:subtext, fontSize:'0.78rem', lineHeight:1.5 }}>{s.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Pour qui */}
      <div style={{ background:dark?'#1e293b':'#f1f5f9', padding:'4rem 2rem' }}>
        <div style={{ maxWidth:'760px', margin:'0 auto' }}>
          <motion.div initial={{ opacity:0, y:20 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <h2 style={{ fontSize:'1.7rem', fontWeight:'800', color:dark?'#e2e8f0':'#0f172a' }}>Une solution pour tous</h2>
            <p style={{ color:subtext, marginTop:'8px', fontSize:'0.9rem' }}>Urban Report connecte citoyens et autorités pour une ville plus propre et sûre.</p>
          </motion.div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'1.5rem' }}>
            {[
              { Icon:Users,    title:'Pour les citoyens',  desc:'Signalez facilement et suivez la résolution en temps réel.', btn:"S'inscrire",    link:'/register', color:'#2563eb', bg:dark?'#1e3a8a22':'#dbeafe', points:['Signalement en 30 secondes','Suivi en temps réel','Notifications automatiques'] },
              { Icon:Building2, title:'Pour les autorités', desc:'Recevez les signalements et gérez les interventions efficacement.', btn:'Se connecter', link:'/login',     color:'#16a34a', bg:dark?'#14532d22':'#dcfce7', points:['Dashboard complet','Gestion par zone','Statistiques détaillées'] },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }}
                whileHover={{ y:-6, boxShadow:'0 20px 40px rgba(0,0,0,0.12)' }}
                style={{ background:dark?'#0f172a':'#fff', borderRadius:'20px', padding:'2rem', border:`1px solid ${dark?'#334155':'#e2e8f0'}`, transition:'box-shadow .3s' }}>
                <motion.div whileHover={{ scale:1.1, rotate:-3 }}
                  style={{ width:'56px', height:'56px', borderRadius:'14px', background:f.bg, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem' }}>
                  <f.Icon size={26} color={f.color} />
                </motion.div>
                <h3 style={{ color:dark?'#e2e8f0':'#0f172a', fontWeight:'700', fontSize:'1rem', marginBottom:'8px' }}>{f.title}</h3>
                <p style={{ color:subtext, fontSize:'0.82rem', lineHeight:1.6, marginBottom:'1rem' }}>{f.desc}</p>
                <ul style={{ listStyle:'none', padding:0, margin:'0 0 1.2rem', display:'flex', flexDirection:'column', gap:'6px' }}>
                  {f.points.map((p, j) => (
                    <li key={j} style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'0.78rem', color:subtext }}>
                      <CheckCircle size={13} color={f.color} /> {p}
                    </li>
                  ))}
                </ul>
                <motion.div whileHover={{ scale:1.03 }} style={{ display:'inline-block' }}>
                  <Link to={f.link} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 20px', background:f.color, color:'white', borderRadius:'8px', fontWeight:'700', fontSize:'0.82rem', textDecoration:'none' }}>
                    {f.btn} <ChevronRight size={15} />
                  </Link>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
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
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.5rem' }}>
                  {[
                    { label:'Catégorie',   value: selected.categorie, Icon: Tag },
                    { label:'Adresse',     value: selected.adresse || '-', Icon: MapPin },
                    { label:'Signalé par', value: selected.userNom || 'Anonyme', Icon: User },
                    { label:'Date',        value: new Date(selected.createdAt).toLocaleDateString('fr-FR'), Icon: CalendarDays },
                  ].map((item, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 0', borderBottom:`1px solid ${dark?'#334155':'#f1f5f9'}` }}>
                      <span style={{ display:'flex', alignItems:'center', gap:'6px', color:subtext, fontWeight:'600', fontSize:'0.88rem' }}>
                        <item.Icon size={13} /> {item.label}
                      </span>
                      <span style={{ color:text, fontSize:'0.88rem' }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                {selected.statut !== 'RESOLU' && (
                  joined[selected.id] ? (
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px', background:'#f0fdf4', borderRadius:'10px', color:'#15803d', fontWeight:'700', marginBottom:'1rem' }}>
                      <CheckCircle size={16} /> Vous avez déjà signalé ce problème
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale:1.02 }} onClick={() => { handleRejoindre(selected); setSelected(null); }}
                      style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', width:'100%', padding:'12px', background:'#16a34a', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontWeight:'700', fontSize:'0.95rem', marginBottom:'1rem' }}>
                      <ThumbsUp size={16} /> J'ai le même problème
                    </motion.button>
                  )
                )}

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