import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../services/auth';
import { toast } from 'react-toastify';
import API from '../services/api';

export default function Register() {
  const [step, setStep]       = useState(1); // 1 = infos, 2 = CIN
  const [form, setForm]       = useState({ nom:'', prenom:'', email:'', password:'' });
  const [cinRecto, setCinRecto] = useState(null);
  const [cinVerso, setCinVerso] = useState(null);
  const [loading, setLoading] = useState(false);

  const upd = (k) => (e) => setForm({...form, [k]: e.target.value});

  // Step 1 — validation du formulaire
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email || !form.password)
      return toast.error('Veuillez remplir tous les champs');
    if (form.password.length < 6)
      return toast.error('Le mot de passe doit contenir au moins 6 caractères');
    setStep(2);
  };

  // Step 2 — inscription + upload CIN
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!cinRecto || !cinVerso)
      return toast.error('Veuillez fournir les 2 faces de votre CIN');

    setLoading(true);
    try {
      // 1. Inscription
      const res = await register(form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role',  res.data.role);
      localStorage.setItem('email', res.data.email);

      // 2. Upload CIN
      const data = new FormData();
      data.append('recto', cinRecto);
      data.append('verso', cinVerso);
      await API.post('/user/cin', data);

      toast.success('Compte créé ! Votre CIN est en attente de validation.');
      window.location.href = '/dashboard';
    } catch (err) {
      if (err.response?.status === 400 || err.response?.data?.includes?.('Email')) {
        toast.error('Email déjà utilisé');
        setStep(1);
      } else {
        toast.error("Erreur lors de l'inscription");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>

        {/* Progress bar */}
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1.8rem' }}>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
              <span style={{ fontSize:'.75rem', fontWeight:'700', color: step >= 1 ? '#1e40af' : '#9ca3af' }}>
                1. Informations
              </span>
              <span style={{ fontSize:'.75rem', fontWeight:'700', color: step >= 2 ? '#1e40af' : '#9ca3af' }}>
                2. Vérification CIN
              </span>
            </div>
            <div style={{ height:'4px', background:'#e5e7eb', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ height:'100%', width: step === 1 ? '50%' : '100%', background:'#1e40af', borderRadius:'2px', transition:'width .3s' }} />
            </div>
          </div>
        </div>

        {/* ── STEP 1 : Informations ── */}
        {step === 1 && (
          <>
            <h2 style={styles.title}>👤 Créer un compte</h2>
            <form onSubmit={handleNextStep}>
              <div style={{ display:'flex', gap:'1rem' }}>
                <div style={{ flex:1, marginBottom:'1.2rem' }}>
                  <label style={styles.label}>Nom</label>
                  <input style={styles.input} required
                    value={form.nom} onChange={upd('nom')} />
                </div>
                <div style={{ flex:1, marginBottom:'1.2rem' }}>
                  <label style={styles.label}>Prénom</label>
                  <input style={styles.input} required
                    value={form.prenom} onChange={upd('prenom')} />
                </div>
              </div>
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={styles.label}>Email</label>
                <input style={styles.input} type="email" required
                  value={form.email} onChange={upd('email')}
                  placeholder="votre@email.com" />
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={styles.label}>Mot de passe</label>
                <input style={styles.input} type="password" required
                  value={form.password} onChange={upd('password')}
                  placeholder="••••••••" />
              </div>
              <button style={styles.btn} type="submit">
                Suivant →
              </button>
            </form>
          </>
        )}

        {/* ── STEP 2 : CIN ── */}
        {step === 2 && (
          <>
            <h2 style={styles.title}>🪪 Vérification d'identité</h2>
            <p style={{ color:'#6b7280', fontSize:'.88rem', textAlign:'center', marginBottom:'1.5rem', lineHeight:1.6 }}>
              Pour accéder aux fonctionnalités de signalement, veuillez fournir votre{' '}
              <strong>Carte Nationale d'Identité</strong> (recto + verso).<br/>
              Un admin validera votre identité avant de vous autoriser à signaler.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Recto */}
              <div style={{ marginBottom:'1rem' }}>
                <label style={styles.label}>📄 CIN — Face avant (Recto)</label>
                <label style={styles.uploadLabel}>
                  <input type="file" accept="image/*"
                    onChange={e => setCinRecto(e.target.files[0])}
                    style={{ display:'none' }} />
                  {cinRecto ? `✅ ${cinRecto.name}` : '📷 Choisir la face avant'}
                </label>
                {cinRecto && (
                  <img src={URL.createObjectURL(cinRecto)} alt="recto"
                    style={{ width:'100%', height:'130px', objectFit:'cover', borderRadius:'8px', marginTop:'8px', border:'2px solid #bfdbfe' }} />
                )}
              </div>

              {/* Verso */}
              <div style={{ marginBottom:'1.2rem' }}>
                <label style={styles.label}>📄 CIN — Face arrière (Verso)</label>
                <label style={styles.uploadLabel}>
                  <input type="file" accept="image/*"
                    onChange={e => setCinVerso(e.target.files[0])}
                    style={{ display:'none' }} />
                  {cinVerso ? `✅ ${cinVerso.name}` : '📷 Choisir la face arrière'}
                </label>
                {cinVerso && (
                  <img src={URL.createObjectURL(cinVerso)} alt="verso"
                    style={{ width:'100%', height:'130px', objectFit:'cover', borderRadius:'8px', marginTop:'8px', border:'2px solid #bfdbfe' }} />
                )}
              </div>

              {/* Note sécurité */}
              <div style={{ background:'#fef3c7', borderRadius:'8px', padding:'10px 14px', marginBottom:'1.5rem', fontSize:'.8rem', color:'#92400e' }}>
                🔒 Vos données sont sécurisées et utilisées uniquement pour la vérification d'identité.
              </div>

              <div style={{ display:'flex', gap:'1rem' }}>
                <button type="button" onClick={() => setStep(1)}
                  style={{ flex:1, padding:'12px', background:'#f1f5f9', color:'#374151', border:'1px solid #d1d5db', borderRadius:'8px', cursor:'pointer', fontSize:'1rem' }}>
                  ← Retour
                </button>
                <button style={{ ...styles.btn, flex:1 }} type="submit" disabled={loading}>
                  {loading ? 'Création...' : '✅ Créer mon compte'}
                </button>
              </div>
            </form>
          </>
        )}

        <p style={styles.footer}>
          Déjà un compte ? <Link to="/login">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight:'calc(100vh - 64px)',
    display:'flex', alignItems:'center', justifyContent:'center',
    background:'#f1f5f9',
  },
  card: {
    background:'#fff', padding:'2.5rem', borderRadius:'12px',
    boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
    width:'100%', maxWidth:'480px',
  },
  title: { textAlign:'center', marginBottom:'1.2rem', color:'#1e40af' },
  label: { display:'block', marginBottom:'6px', color:'#374151', fontWeight:'500' },
  input: {
    width:'100%', padding:'10px 14px', borderRadius:'8px',
    border:'1px solid #d1d5db', fontSize:'1rem', boxSizing:'border-box',
  },
  uploadLabel: {
    display:'block', padding:'12px', background:'#eff6ff',
    border:'1.5px dashed #bfdbfe', borderRadius:'8px',
    cursor:'pointer', textAlign:'center', color:'#1e40af', fontSize:'.9rem', fontWeight:'600',
  },
  btn: {
    width:'100%', padding:'12px', background:'#1e40af', color:'#fff',
    border:'none', borderRadius:'8px', fontSize:'1rem', cursor:'pointer',
  },
  footer: { textAlign:'center', marginTop:'1.5rem', color:'#6b7280' },
};