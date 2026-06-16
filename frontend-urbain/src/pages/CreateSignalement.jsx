import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import API from '../services/api';
import { isAdmin } from '../services/auth';

function LocationPicker({ onSelect, position }) {
  useMapEvents({
    click(e) { onSelect(e.latlng.lat, e.latlng.lng); },
  });
  return position ? <Marker position={position} /> : null;
}

export default function CreateSignalement() {
  const navigate = useNavigate();
  const [loading, setLoading]           = useState(false);
  const [photos, setPhotos]             = useState([]);
  const [previews, setPreviews]         = useState([]);
  const [position, setPosition]         = useState(null);

  // ── état CIN ──────────────────────────────────────────────
  const [cinVerifie, setCinVerifie]     = useState(() => isAdmin());
  const [cinSoumise, setCinSoumise]     = useState(false);
  const [cinRejete, setCinRejete]       = useState(false);
  const [pageReady, setPageReady]       = useState(() => isAdmin());
  // ──────────────────────────────────────────────────────────

  const [showCinModal, setShowCinModal] = useState(false);
  const [cinRecto, setCinRecto]         = useState(null);
  const [cinVerso, setCinVerso]         = useState(null);
  const [cinLoading, setCinLoading]     = useState(false);

  const [form, setForm] = useState({
    titre: '', description: '', categorie: 'VOIRIE',
    latitude: '', longitude: '', adresse: '',
  });

  useEffect(() => {
    if (isAdmin()) { setCinVerifie(true); return; }
    API.get('/user/profile').then(res => {
      const d = res.data;
      setCinVerifie(!!d.cinVerifie);
      setCinSoumise(!!(d.cinRecto && d.cinVerso));
      setCinRejete(!!d.cinRejete);
      setPageReady(true);
    }).catch(() => setPageReady(true));
  }, []);

  const upd = (k) => (e) => setForm({...form, [k]: e.target.value});

  const getLocation = () => {
    if (!navigator.geolocation) return toast.error('Géolocalisation non supportée');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setPosition([lat, lng]);
        setForm(f => ({ ...f, latitude: lat.toString(), longitude: lng.toString() }));
        toast.success('Position détectée !');
      },
      () => toast.error('Impossible de détecter la position')
    );
  };

  const handleMapClick = (lat, lng) => {
    setPosition([lat, lng]);
    setForm(f => ({ ...f, latitude: lat.toString(), longitude: lng.toString() }));
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setPhotos(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadCin = async (e) => {
    e.preventDefault();
    if (!cinRecto || !cinVerso) return toast.error('Veuillez fournir les 2 faces de la CIN');
    setCinLoading(true);
    try {
      const data = new FormData();
      data.append('recto', cinRecto);
      data.append('verso', cinVerso);
      await API.post('/user/cin', data);
      toast.success('CIN soumise avec succès ! En attente de validation.');
      setCinSoumise(true);
      setCinRejete(false);
      setShowCinModal(false);
    } catch {
      toast.error("Erreur lors de l'upload de la CIN");
    } finally {
      setCinLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── check côté frontend aussi ─────────────────────────
    if (!cinVerifie) {
      if (!cinSoumise) {
        setShowCinModal(true);
      } else if (cinRejete) {
        setShowCinModal(true);
      } else {
        toast.warning('Votre CIN est en cours de vérification. Veuillez patienter.');
      }
      return;
    }
    // ──────────────────────────────────────────────────────

    if (!form.latitude || !form.longitude)
      return toast.error('Veuillez sélectionner une localisation sur la carte');

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (photos.length > 0) data.append('photo', photos[0]);

      const res = await API.post('/signalements', data);
      const signalementId = res.data.id;

      if (photos.length > 1) {
        const extraData = new FormData();
        photos.slice(1).forEach(p => extraData.append('photos', p));
        await API.post(`/signalements/${signalementId}/photos`, extraData);
      }

      toast.success('Signalement créé avec succès !');
      navigate('/mes-signalements');
    } catch (err) {
      // إذا Backend رجع 403 مع requireCin
      const data = err.response?.data;
      if (err.response?.status === 403 && data?.requireCin) {
        setShowCinModal(true);
      } else if (err.response?.status === 403 && data?.cinRejete) {
        setShowCinModal(true);
        toast.error(data.message);
      } else if (err.response?.status === 403 && data?.enAttente) {
        toast.warning(data.message);
      } else {
        toast.error(data?.message || `Erreur ${err.response?.status}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!pageReady) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
      <p style={{ color:'#6b7280' }}>Chargement...</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>📍 Nouveau signalement</h2>









        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Titre *</label>
            <input style={styles.input} required
              value={form.titre} onChange={upd('titre')}
              placeholder="Ex: Nid de poule dangereux" />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description *</label>
            <textarea style={{...styles.input, height:'100px', resize:'vertical'}}
              required value={form.description} onChange={upd('description')}
              placeholder="Décrivez le problème..." />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Catégorie *</label>
            <select style={styles.input} value={form.categorie} onChange={upd('categorie')}>
              <option value="VOIRIE">🛣️ Voirie</option>
              <option value="ECLAIRAGE">💡 Éclairage</option>
              <option value="DECHETS">🗑️ Déchets</option>
              <option value="EAU">💧 Eau</option>
              <option value="AUTRE">🔧 Autre</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Localisation * (cliquez sur la carte)</label>
            <button type="button" onClick={getLocation} style={styles.btnGeo}>
              📍 Détecter ma position automatiquement
            </button>
            <div style={{ marginTop:'8px', borderRadius:'8px', overflow:'hidden' }}>
              <MapContainer center={position || [33.5731, -7.5898]} zoom={12} style={{ height:'250px' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                <LocationPicker onSelect={handleMapClick} position={position} />
              </MapContainer>
            </div>
            {form.latitude && (
              <p style={{ fontSize:'0.85rem', color:'#059669', marginTop:'6px' }}>
                ✅ Position sélectionnée : {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
              </p>
            )}
            <input style={{...styles.input, marginTop:'8px'}}
              placeholder="Adresse (optionnel)"
              value={form.adresse} onChange={upd('adresse')} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>
              Photos (optionnel — max 5)
              <span style={{ fontSize:'0.8rem', color:'#6b7280', marginLeft:'8px' }}>
                {photos.length}/5 photo(s)
              </span>
            </label>
            <label style={styles.uploadLabel}>
              <input type="file" accept="image/*" multiple
                onChange={handlePhotosChange} style={{ display:'none' }} />
              📷 Choisir des photos
            </label>
            {previews.length > 0 && (
              <div style={{ display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'12px' }}>
                {previews.map((url, i) => (
                  <div key={i} style={{ position:'relative' }}>
                    <img src={url} alt={`photo-${i}`}
                      style={{ width:'90px', height:'90px', objectFit:'cover', borderRadius:'8px', border:'2px solid #bfdbfe' }} />
                    <button type="button" onClick={() => removePhoto(i)}
                      style={{ position:'absolute', top:'-8px', right:'-8px', background:'#ef4444', color:'#fff', border:'none', borderRadius:'50%', width:'22px', height:'22px', cursor:'pointer', fontSize:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' }}>
                      ✕
                    </button>
                    {i === 0 && (
                      <span style={{ position:'absolute', bottom:'4px', left:'4px', background:'#1e40af', color:'#fff', fontSize:'0.65rem', padding:'1px 5px', borderRadius:'4px' }}>
                        Principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:'1rem', marginTop:'1rem' }}>
            <button type="button" onClick={() => navigate(-1)} style={styles.btnCancel}>
              Annuler
            </button>
            <button type="submit" style={{
              ...styles.btnSubmit,
              background: cinVerifie ? '#1e40af' : '#9ca3af',
              cursor: cinVerifie ? 'pointer' : 'not-allowed',
            }} disabled={loading}>
              {loading ? 'Envoi...' : '✅ Envoyer le signalement'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal CIN */}
      {showCinModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'2rem', maxWidth:'500px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <h3 style={{ color:'#1e3a8a', marginBottom:'0.5rem', textAlign:'center' }}>🪪 Vérification d'identité</h3>
            <p style={{ color:'#6b7280', fontSize:'0.9rem', textAlign:'center', marginBottom:'1.5rem', lineHeight:'1.5' }}>
              {cinRejete
                ? <>Votre CIN a été rejetée. Veuillez soumettre une <strong>nouvelle CIN valide</strong>.</>
                : <>Pour signaler un problème, vous devez vérifier votre identité.<br/>Veuillez fournir votre <strong>Carte Nationale d'Identité</strong> (recto + verso).</>
              }
            </p>

            <form onSubmit={handleUploadCin}>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', marginBottom:'6px', color:'#374151', fontWeight:'600', fontSize:'0.9rem' }}>
                  📄 CIN — Face avant (Recto)
                </label>
                <label style={{ display:'block', padding:'12px', background:'#eff6ff', border:'1.5px dashed #bfdbfe', borderRadius:'8px', cursor:'pointer', textAlign:'center', color:'#1e40af', fontSize:'0.9rem' }}>
                  <input type="file" accept="image/*"
                    onChange={e => setCinRecto(e.target.files[0])}
                    style={{ display:'none' }} />
                  {cinRecto ? `✅ ${cinRecto.name}` : '📷 Choisir la face avant'}
                </label>
                {cinRecto && (
                  <img src={URL.createObjectURL(cinRecto)} alt="recto"
                    style={{ width:'100%', height:'120px', objectFit:'cover', borderRadius:'8px', marginTop:'8px' }} />
                )}
              </div>

              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', marginBottom:'6px', color:'#374151', fontWeight:'600', fontSize:'0.9rem' }}>
                  📄 CIN — Face arrière (Verso)
                </label>
                <label style={{ display:'block', padding:'12px', background:'#eff6ff', border:'1.5px dashed #bfdbfe', borderRadius:'8px', cursor:'pointer', textAlign:'center', color:'#1e40af', fontSize:'0.9rem' }}>
                  <input type="file" accept="image/*"
                    onChange={e => setCinVerso(e.target.files[0])}
                    style={{ display:'none' }} />
                  {cinVerso ? `✅ ${cinVerso.name}` : '📷 Choisir la face arrière'}
                </label>
                {cinVerso && (
                  <img src={URL.createObjectURL(cinVerso)} alt="verso"
                    style={{ width:'100%', height:'120px', objectFit:'cover', borderRadius:'8px', marginTop:'8px' }} />
                )}
              </div>

              <div style={{ background:'#fef3c7', borderRadius:'8px', padding:'10px 14px', marginBottom:'1.5rem', fontSize:'0.82rem', color:'#92400e' }}>
                🔒 Vos données sont sécurisées et utilisées uniquement pour la vérification d'identité.
              </div>

              <div style={{ display:'flex', gap:'1rem' }}>
                <button type="button"
                  onClick={() => setShowCinModal(false)}
                  style={{ flex:1, padding:'10px', background:'#f1f5f9', color:'#374151', border:'1px solid #d1d5db', borderRadius:'8px', cursor:'pointer' }}>
                  Fermer
                </button>
                <button type="submit" disabled={cinLoading}
                  style={{ flex:1, padding:'10px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                  {cinLoading ? 'Envoi...' : '✅ Envoyer ma CIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight:'calc(100vh - 64px)', background:'#f1f5f9',
    padding:'2rem', display:'flex', justifyContent:'center',
  },
  card: {
    background:'#fff', padding:'2.5rem', borderRadius:'12px',
    boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
    width:'100%', maxWidth:'600px', height:'fit-content',
  },
  title:  { color:'#1e40af', marginBottom:'1.5rem', textAlign:'center' },
  field:  { marginBottom:'1.2rem' },
  label:  { display:'block', marginBottom:'6px', color:'#374151', fontWeight:'500' },
  input:  {
    width:'100%', padding:'10px 14px', borderRadius:'8px',
    border:'1px solid #d1d5db', fontSize:'1rem',
    boxSizing:'border-box', fontFamily:'inherit',
  },
  uploadLabel: {
    display:'inline-block', padding:'10px 20px',
    background:'#eff6ff', color:'#1e40af',
    border:'1.5px dashed #bfdbfe', borderRadius:'8px',
    cursor:'pointer', fontSize:'0.95rem', fontWeight:'600',
  },
  btnGeo: {
    width:'100%', padding:'10px', background:'#eff6ff',
    color:'#1e40af', border:'1px solid #bfdbfe',
    borderRadius:'8px', cursor:'pointer', fontSize:'0.95rem',
  },
  btnSubmit: {
    flex:1, padding:'12px', background:'#1e40af', color:'#fff',
    border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer',
  },
  btnCancel: {
    flex:1, padding:'12px', background:'#f1f5f9', color:'#374151',
    border:'1px solid #d1d5db', borderRadius:'8px',
    fontSize:'1rem', cursor:'pointer',
  },
};