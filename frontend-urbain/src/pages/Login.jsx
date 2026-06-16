import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { login } from '../services/auth';
import { toast } from 'react-toastify';

export default function Login() {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login(form);
      localStorage.setItem('token',   res.data.token);
      localStorage.setItem('role',    res.data.role);
      localStorage.setItem('email',   res.data.email);
      if (res.data.photoUrl) localStorage.setItem('photoUrl', res.data.photoUrl);
      if (res.data.zone)     localStorage.setItem('zone',     res.data.zone);

      toast.success('Connexion réussie !');

      if (res.data.role === 'CHEF_ADMIN' || res.data.role === 'ADMIN') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error(err);
      toast.error('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Connexion</h2>
        <form onSubmit={handleSubmit}>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="votre@email.com"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.passWrapper}>
              <input
                style={styles.passInput}
                type={showPass ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                placeholder="••••••••"
              />
              <button type="button" style={styles.eyeBtn}
                onMouseDown={e => e.preventDefault()}
                onClick={() => setShowPass(!showPass)}>
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

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
        <p style={styles.footer}>
          Pas de compte ? <Link to="/register">S'inscrire</Link>
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
    width:'100%', maxWidth:'420px',
  },
  title:  { textAlign:'center', marginBottom:'1.5rem', color:'#1e40af' },
  field:  { marginBottom:'1.2rem' },
  label:  { display:'block', marginBottom:'6px', color:'#374151', fontWeight:'500' },
  input:  {
    width:'100%', padding:'10px 14px', borderRadius:'8px',
    border:'1px solid #d1d5db', fontSize:'1rem', boxSizing:'border-box',
    outline:'none',
  },
  passWrapper: {
    display:'flex', alignItems:'center',
    border:'1px solid #d1d5db', borderRadius:'8px', overflow:'hidden',
  },
  passInput: {
    flex:1, padding:'10px 14px', border:'none',
    fontSize:'1rem', outline:'none',
    WebkitAppearance:'none', MozAppearance:'none',
  },
  eyeBtn: {
    background:'none', border:'none', padding:'0 12px',
    cursor:'pointer', display:'flex', alignItems:'center',
  },
  btn: {
    width:'100%', padding:'12px', background:'#1e40af',
    color:'#fff', border:'none', borderRadius:'8px',
    fontSize:'1rem', cursor:'pointer', marginTop:'0.5rem',
  },
  footer: { textAlign:'center', marginTop:'1.5rem', color:'#6b7280' },
};