import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import API from '../services/api';
import { isAdmin } from '../services/auth';
import {
  Camera, User, Lock, CreditCard, Edit2, Save,
  Upload, CheckCircle, Clock, AlertTriangle,
  Star, Settings, Shield
} from 'lucide-react';

export default function Profile() {
  const [user, setUser]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [editMode, setEditMode]   = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [form, setForm]           = useState({ nom:'', prenom:'', email:'' });
  const [passForm, setPassForm]   = useState({ ancien:'', nouveau:'', confirm:'' });
  const [activeTab, setActiveTab] = useState('info');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showCinModal, setShowCinModal]     = useState(false);
  const [cinRecto, setCinRecto]   = useState(null);
  const [cinVerso, setCinVerso]   = useState(null);
  const [cinLoading, setCinLoading] = useState(false);
  const fileRef = useRef();

  const loadProfile = () => {
    API.get('/user/profile')
      .then(res => {
        setUser(res.data);
        setForm({ nom: res.data.nom, prenom: res.data.prenom, email: res.data.email });
        if (res.data.photoUrl) localStorage.setItem('photoUrl', res.data.photoUrl);
      })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProfile(); }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await API.post('/user/profile/photo', formData);
      setUser({ ...user, photoUrl: res.data.photoUrl });
      localStorage.setItem('photoUrl', res.data.photoUrl);
      toast.success('Photo mise à jour !');
    } catch { toast.error('Erreur upload photo');
    } finally { setUploadingPhoto(false); }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    try {
      await API.put('/user/profile', form);
      toast.success('Profil mis à jour !');
      setEditMode(false);
      setUser({ ...user, ...form });
    } catch { toast.error('Erreur de mise à jour'); }
  };

  const handleSavePass = async (e) => {
    e.preventDefault();
    if (passForm.nouveau !== passForm.confirm) { toast.error('Les mots de passe ne correspondent pas !'); return; }
    try {
      await API.put('/user/password', { ancienPassword: passForm.ancien, nouveauPassword: passForm.nouveau });
      toast.success('Mot de passe modifié !');
      setPassForm({ ancien:'', nouveau:'', confirm:'' });
    } catch { toast.error('Ancien mot de passe incorrect'); }
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
      toast.success('CIN envoyée avec succès ! En attente de vérification.');
      setShowCinModal(false);
      loadProfile();
    } catch { toast.error('Erreur lors de l\'upload de la CIN');
    } finally { setCinLoading(false); }
  };

  if (loading) return <div style={styles.center}>Chargement...</div>;

  const admin      = isAdmin();
  const initials   = user ? `${user.nom?.charAt(0)}${user.prenom?.charAt(0)}` : '??';
  const hasCin     = !!(user?.cinRecto && user?.cinVerso);
  const cinVerifie = user?.cinVerifie;
  const signalCount = user?.signalementCount || 0;
  const needsCin   = !admin && signalCount >= 1 && !hasCin;

  const RoleBadge = () => {
    if (user?.role === 'SUPER_ADMIN') return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600', background:'rgba(255,255,255,0.2)', color:'#fff' }}>
        <Star size={12} /> Super Admin
      </span>
    );
    if (user?.role === 'ADMIN_VILLE') return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600', background:'rgba(255,255,255,0.2)', color:'#fff' }}>
        <Settings size={12} /> Admin Ville
      </span>
    );
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600', background:'rgba(255,255,255,0.2)', color:'#fff' }}>
        <User size={12} /> Utilisateur
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.avatarWrapper}>
            {user?.photoUrl ? (
              <img src={`http://localhost:8081${user.photoUrl}`} alt="profil" style={styles.avatarImg} />
            ) : (
              <div style={styles.avatarBig}>{initials}</div>
            )}
            <button style={styles.changePhotoBtn} onClick={() => fileRef.current.click()} disabled={uploadingPhoto}>
              {uploadingPhoto ? <Clock size={14} /> : <Camera size={14} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoChange} />
          </div>
          <div>
            <h2 style={styles.profileName}>{user?.nom} {user?.prenom}</h2>
            <p style={styles.profileEmail}>{user?.email}</p>
            <div style={{ display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
              <RoleBadge />
              {needsCin && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600', background:'#fbbf24', color:'#78350f', cursor:'pointer' }}
                  onClick={() => setShowCinModal(true)}>
                  <AlertTriangle size={12} /> CIN requise
                </span>
              )}
              {!admin && hasCin && !cinVerifie && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600', background:'rgba(255,255,255,0.2)', color:'#fef3c7' }}>
                  <Clock size={12} /> CIN en vérification
                </span>
              )}
              {!admin && hasCin && cinVerifie && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'4px 12px', borderRadius:'20px', fontSize:'0.8rem', fontWeight:'600', background:'#d1fae5', color:'#065f46' }}>
                  <CheckCircle size={12} /> Identité vérifiée
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bandeau CIN */}
        {needsCin && (
          <div style={{ background:'#fef3c7', borderLeft:'4px solid #f59e0b', padding:'12px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px', fontWeight:'700', color:'#92400e', fontSize:'0.9rem' }}>
                <AlertTriangle size={15} /> Complétez votre profil
              </div>
              <div style={{ color:'#a16207', fontSize:'0.82rem', marginTop:'2px' }}>
                Pour créer plus d'un signalement, vous devez soumettre votre CIN (recto + verso).
              </div>
            </div>
            <button onClick={() => setShowCinModal(true)}
              style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'#f59e0b', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.85rem', whiteSpace:'nowrap' }}>
              <Upload size={14} /> Ajouter ma CIN
            </button>
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(activeTab==='info'?styles.tabActive:{}) }} onClick={() => setActiveTab('info')}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}><User size={15} /> Informations</span>
          </button>
          <button style={{ ...styles.tab, ...(activeTab==='password'?styles.tabActive:{}) }} onClick={() => setActiveTab('password')}>
            <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}><Lock size={15} /> Mot de passe</span>
          </button>
          {!admin && (
            <button style={{ ...styles.tab, ...(activeTab==='cin'?styles.tabActive:{}), position:'relative' }} onClick={() => setActiveTab('cin')}>
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'5px' }}><CreditCard size={15} /> Identité</span>
              {needsCin && <span style={{ position:'absolute', top:'8px', right:'8px', width:'8px', height:'8px', background:'#ef4444', borderRadius:'50%' }} />}
            </button>
          )}
        </div>

        {/* Tab Info */}
        {activeTab === 'info' && (
          <div style={styles.tabContent}>
            {!editMode ? (
              <div>
                <div style={styles.infoGrid}>
                  {[
                    { label:'Nom',          value: user?.nom },
                    { label:'Prénom',        value: user?.prenom },
                    { label:'Email',         value: user?.email },
                    { label:'Signalements',  value: `${signalCount} signalement(s)` },
                    { label:'Membre depuis', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : '-' },
                  ].map((item, i) => (
                    <div key={i} style={styles.infoItem}>
                      <span style={styles.infoLabel}>{item.label}</span>
                      <span style={styles.infoValue}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <button style={{ ...styles.btnEdit, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }} onClick={() => setEditMode(true)}>
                  <Edit2 size={15} /> Modifier mes informations
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveInfo}>
                <div style={styles.formRow}>
                  <div style={{ flex:1, marginBottom:'1.2rem' }}>
                    <label style={styles.label}>Nom</label>
                    <input style={styles.input} required value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} />
                  </div>
                  <div style={{ flex:1, marginBottom:'1.2rem' }}>
                    <label style={styles.label}>Prénom</label>
                    <input style={styles.input} required value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} />
                  </div>
                </div>
                <div style={{ marginBottom:'1.2rem' }}>
                  <label style={styles.label}>Email</label>
                  <input style={styles.input} type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                <div style={styles.formActions}>
                  <button type="button" style={styles.btnCancel} onClick={() => setEditMode(false)}>Annuler</button>
                  <button type="submit" style={{ ...styles.btnSave, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                    <Save size={15} /> Enregistrer
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab Password */}
        {activeTab === 'password' && (
          <div style={styles.tabContent}>
            <form onSubmit={handleSavePass}>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={styles.label}>Ancien mot de passe</label>
                <div style={styles.passWrapper}>
                  <input style={styles.passInput} type={showPass?'text':'password'} required
                    autoComplete="current-password" value={passForm.ancien}
                    onChange={e => setPassForm({...passForm, ancien: e.target.value})} placeholder="••••••••" />
                  <button type="button" style={styles.eyeBtn} onMouseDown={e => e.preventDefault()} onClick={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={styles.label}>Nouveau mot de passe</label>
                <input style={styles.input} type="password" required autoComplete="new-password"
                  value={passForm.nouveau} onChange={e => setPassForm({...passForm, nouveau: e.target.value})} placeholder="••••••••" />
              </div>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={styles.label}>Confirmer le mot de passe</label>
                <input style={styles.input} type="password" required autoComplete="new-password"
                  value={passForm.confirm} onChange={e => setPassForm({...passForm, confirm: e.target.value})} placeholder="••••••••" />
              </div>
              <button type="submit" style={{ ...styles.btnSave, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
                <Lock size={15} /> Changer le mot de passe
              </button>
            </form>
          </div>
        )}

        {/* Tab CIN */}
        {activeTab === 'cin' && !admin && (
          <div style={styles.tabContent}>
            {!hasCin ? (
              <div>
                <div style={{ textAlign:'center', padding:'1rem 0 1.5rem' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.8rem' }}>
                    <CreditCard size={48} color="#1e40af" />
                  </div>
                  <h3 style={{ color:'#1e3a8a', marginBottom:'0.5rem' }}>Vérification d'identité</h3>
                  <p style={{ color:'#6b7280', fontSize:'0.9rem', lineHeight:'1.6' }}>
                    Pour créer plus d'un signalement, vous devez soumettre votre Carte Nationale d'Identité (recto + verso).
                  </p>
                </div>
                <button onClick={() => setShowCinModal(true)}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'12px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'1rem' }}>
                  <Upload size={16} /> Soumettre ma CIN
                </button>
              </div>
            ) : cinVerifie ? (
              <div style={{ textAlign:'center', padding:'2rem 0' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.8rem' }}>
                  <CheckCircle size={48} color="#16a34a" />
                </div>
                <h3 style={{ color:'#065f46', marginBottom:'0.5rem' }}>Identité vérifiée</h3>
                <p style={{ color:'#6b7280', fontSize:'0.9rem' }}>Votre CIN a été vérifiée avec succès.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginTop:'1.5rem' }}>
                  <div><div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>Recto</div>
                    <img src={`http://localhost:8081${user.cinRecto}`} alt="CIN Recto" style={{ width:'100%', borderRadius:'8px', border:'1px solid #e5e7eb' }} /></div>
                  <div><div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>Verso</div>
                    <img src={`http://localhost:8081${user.cinVerso}`} alt="CIN Verso" style={{ width:'100%', borderRadius:'8px', border:'1px solid #e5e7eb' }} /></div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', padding:'2rem 0' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:'0.8rem' }}>
                  <Clock size={48} color="#d97706" />
                </div>
                <h3 style={{ color:'#92400e', marginBottom:'0.5rem' }}>En attente de vérification</h3>
                <p style={{ color:'#6b7280', fontSize:'0.9rem', marginBottom:'1.5rem' }}>Votre CIN a été soumise et est en cours de vérification par notre équipe.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                  <div><div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>Recto</div>
                    <img src={`http://localhost:8081${user.cinRecto}`} alt="CIN Recto" style={{ width:'100%', borderRadius:'8px', border:'1px solid #e5e7eb' }} /></div>
                  <div><div style={{ fontSize:'0.85rem', fontWeight:'600', color:'#374151', marginBottom:'6px' }}>Verso</div>
                    <img src={`http://localhost:8081${user.cinVerso}`} alt="CIN Verso" style={{ width:'100%', borderRadius:'8px', border:'1px solid #e5e7eb' }} /></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal CIN Upload */}
      {showCinModal && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'#fff', borderRadius:'16px', padding:'2rem', maxWidth:'500px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'0.5rem' }}>
              <CreditCard size={22} color="#1e3a8a" />
              <h3 style={{ color:'#1e3a8a', margin:0 }}>Vérification d'identité</h3>
            </div>
            <p style={{ color:'#6b7280', fontSize:'0.9rem', textAlign:'center', marginBottom:'1.5rem', lineHeight:'1.5' }}>
              Veuillez fournir une photo de votre <strong>Carte Nationale d'Identité</strong> (recto + verso).
            </p>
            <form onSubmit={handleUploadCin}>
              {[
                { label:'Face avant (Recto)', state: cinRecto, setter: setCinRecto },
                { label:'Face arrière (Verso)', state: cinVerso, setter: setCinVerso },
              ].map((face, i) => (
                <div key={i} style={{ marginBottom:'1rem' }}>
                  <label style={{ display:'block', marginBottom:'6px', color:'#374151', fontWeight:'600', fontSize:'0.9rem' }}>
                    {face.label}
                  </label>
                  <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', padding:'12px', background:'#eff6ff', border:'1.5px dashed #bfdbfe', borderRadius:'8px', cursor:'pointer', color:'#1e40af', fontSize:'0.9rem' }}>
                    <input type="file" accept="image/*" onChange={e => face.setter(e.target.files[0])} style={{ display:'none' }} />
                    <Upload size={16} />
                    {face.state ? face.state.name : `Choisir ${face.label.toLowerCase()}`}
                  </label>
                  {face.state && (
                    <img src={URL.createObjectURL(face.state)} alt={face.label}
                      style={{ width:'100%', height:'120px', objectFit:'cover', borderRadius:'8px', marginTop:'8px' }} />
                  )}
                </div>
              ))}
              <div style={{ display:'flex', alignItems:'center', gap:'6px', background:'#fef3c7', borderRadius:'8px', padding:'10px 14px', marginBottom:'1.5rem', fontSize:'0.82rem', color:'#92400e' }}>
                <Shield size={14} /> Vos données sont sécurisées et utilisées uniquement pour la vérification d'identité.
              </div>
              <div style={{ display:'flex', gap:'1rem' }}>
                <button type="button" onClick={() => setShowCinModal(false)}
                  style={{ flex:1, padding:'10px', background:'#f1f5f9', color:'#374151', border:'1px solid #d1d5db', borderRadius:'8px', cursor:'pointer' }}>
                  Annuler
                </button>
                <button type="submit" disabled={cinLoading}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'10px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                  <CheckCircle size={15} /> {cinLoading ? 'Envoi...' : 'Envoyer ma CIN'}
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
  container:     { minHeight:'calc(100vh - 64px)', background:'#f1f5f9', padding:'2rem', display:'flex', justifyContent:'center' },
  card:          { background:'#fff', borderRadius:'16px', boxShadow:'0 4px 20px rgba(0,0,0,0.08)', width:'100%', maxWidth:'600px', height:'fit-content', overflow:'hidden' },
  profileHeader: { background:'linear-gradient(135deg, #1e40af, #3b82f6)', padding:'2rem', display:'flex', alignItems:'center', gap:'1.5rem' },
  avatarWrapper: { position:'relative', minWidth:'90px' },
  avatarImg:     { width:'90px', height:'90px', borderRadius:'50%', objectFit:'cover', border:'3px solid rgba(255,255,255,0.5)' },
  avatarBig:     { width:'90px', height:'90px', borderRadius:'50%', background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', fontWeight:'700', color:'#fff', border:'3px solid rgba(255,255,255,0.5)' },
  changePhotoBtn:{ position:'absolute', bottom:0, right:0, background:'#fff', border:'none', borderRadius:'50%', width:'28px', height:'28px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.2)' },
  profileName:   { color:'#fff', margin:'0 0 4px', fontSize:'1.3rem', fontWeight:'700' },
  profileEmail:  { color:'#bfdbfe', margin:'0 0 8px', fontSize:'0.9rem' },
  tabs:          { display:'flex', borderBottom:'1px solid #e5e7eb' },
  tab:           { flex:1, padding:'1rem', background:'none', border:'none', cursor:'pointer', fontSize:'0.9rem', color:'#6b7280', fontWeight:'500' },
  tabActive:     { color:'#1e40af', borderBottom:'2px solid #1e40af', background:'#f8fafc' },
  tabContent:    { padding:'1.5rem' },
  infoGrid:      { display:'flex', flexDirection:'column', gap:'0.5rem', marginBottom:'1.5rem' },
  infoItem:      { display:'flex', justifyContent:'space-between', padding:'0.8rem 0', borderBottom:'1px solid #f3f4f6' },
  infoLabel:     { color:'#6b7280', fontWeight:'500' },
  infoValue:     { color:'#1e3a8a', fontWeight:'600' },
  formRow:       { display:'flex', gap:'1rem' },
  label:         { display:'block', marginBottom:'6px', color:'#374151', fontWeight:'500', fontSize:'0.9rem' },
  input:         { width:'100%', padding:'10px 14px', borderRadius:'8px', border:'1px solid #d1d5db', fontSize:'0.95rem', boxSizing:'border-box' },
  passWrapper:   { display:'flex', border:'1px solid #d1d5db', borderRadius:'8px', overflow:'hidden' },
  passInput:     { flex:1, padding:'10px 14px', border:'none', fontSize:'0.95rem', outline:'none', WebkitAppearance:'none' },
  eyeBtn:        { background:'none', border:'none', padding:'0 12px', cursor:'pointer', display:'flex', alignItems:'center' },
  formActions:   { display:'flex', gap:'1rem', marginTop:'0.5rem' },
  btnEdit:       { width:'100%', padding:'12px', background:'#eff6ff', color:'#1e40af', border:'1px solid #bfdbfe', borderRadius:'8px', cursor:'pointer', fontWeight:'600' },
  btnSave:       { flex:1, padding:'12px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' },
  btnCancel:     { flex:1, padding:'12px', background:'#f1f5f9', color:'#374151', border:'1px solid #d1d5db', borderRadius:'8px', cursor:'pointer' },
  center:        { textAlign:'center', padding:'4rem', color:'#6b7280' },
};