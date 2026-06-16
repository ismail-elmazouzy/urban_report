import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../services/api';

const STATUT_COLORS = {
  SIGNALE:  { bg:'#fef3c7', color:'#92400e', label:'🔴 Signalé' },
  EN_COURS: { bg:'#dbeafe', color:'#1e40af', label:'🔵 En cours' },
  RESOLU:   { bg:'#d1fae5', color:'#065f46', label:'🟢 Résolu' },
};

export default function MesSignalements() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    API.get('/signalements/mes-signalements')
      .then(res => setSignalements(res.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={styles.center}>Chargement...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📋 Mes signalements</h2>
        <Link to="/signaler" style={styles.btnNew}>➕ Nouveau</Link>
      </div>

      {signalements.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ fontSize:'3rem' }}>📭</p>
          <p>Vous n'avez pas encore de signalements</p>
          <Link to="/signaler" style={styles.btnNew}>Créer mon premier signalement</Link>
        </div>
      ) : (
        <div style={styles.grid}>
          {signalements.map(s => (
            <div key={s.id} style={styles.card}>
              {s.photoUrl && (
                <img
                  src={`http://localhost:8081${s.photoUrl}`}
                  alt={s.titre}
                  style={styles.photo}
                />
              )}
              <div style={styles.cardBody}>
                <div style={styles.cardTop}>
                  <h3 style={styles.cardTitle}>{s.titre}</h3>
                  <span style={{
                    ...styles.badge,
                    background: STATUT_COLORS[s.statut]?.bg,
                    color:      STATUT_COLORS[s.statut]?.color,
                  }}>
                    {STATUT_COLORS[s.statut]?.label}
                  </span>
                </div>
                <p style={styles.desc}>{s.description}</p>
                <div style={styles.cardFooter}>
                  <span style={styles.cat}>📁 {s.categorie}</span>
                  <span style={styles.date}>
                    {new Date(s.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {s.adresse && (
                  <p style={styles.adresse}>📍 {s.adresse}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding:'2rem', maxWidth:'900px', margin:'0 auto' },
  header:    { display:'flex', justifyContent:'space-between',
               alignItems:'center', marginBottom:'2rem' },
  title:     { color:'#1e40af', margin:0 },
  btnNew:    {
    background:'#1e40af', color:'#fff', padding:'10px 20px',
    borderRadius:'8px', textDecoration:'none', fontWeight:'500',
  },
  empty: {
    textAlign:'center', padding:'4rem', color:'#6b7280',
    display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem',
  },
  grid:  { display:'flex', flexDirection:'column', gap:'1rem' },
  card:  {
    background:'#fff', borderRadius:'12px',
    boxShadow:'0 2px 12px rgba(0,0,0,0.08)', overflow:'hidden',
  },
  photo: { width:'100%', height:'200px', objectFit:'cover' },
  cardBody:   { padding:'1.2rem' },
  cardTop:    { display:'flex', justifyContent:'space-between',
                alignItems:'flex-start', marginBottom:'0.5rem' },
  cardTitle:  { color:'#1e3a8a', margin:0, fontSize:'1.1rem' },
  badge:      { padding:'4px 12px', borderRadius:'20px',
                fontSize:'0.8rem', fontWeight:'500', whiteSpace:'nowrap' },
  desc:       { color:'#6b7280', fontSize:'0.9rem', margin:'0.5rem 0' },
  cardFooter: { display:'flex', justifyContent:'space-between',
                marginTop:'0.8rem' },
  cat:        { color:'#1e40af', fontSize:'0.85rem', fontWeight:'500' },
  date:       { color:'#9ca3af', fontSize:'0.85rem' },
  adresse:    { color:'#6b7280', fontSize:'0.85rem', marginTop:'0.5rem' },
  center:     { textAlign:'center', padding:'4rem', color:'#6b7280' },
};