import React from 'react';

const STATUT_STYLES = {
  SIGNALE:  { bg:'#fef3c7', color:'#92400e', label:'🔴 Signalé' },
  EN_COURS: { bg:'#dbeafe', color:'#1e40af', label:'🔵 En cours' },
  RESOLU:   { bg:'#d1fae5', color:'#065f46', label:'🟢 Résolu' },
};

const CATEGORIE_ICONS = {
  VOIRIE:    '🛣️',
  ECLAIRAGE: '💡',
  DECHETS:   '🗑️',
  EAU:       '💧',
  AUTRE:     '🔧',
};

export default function SignalementCard({ signalement, onDelete, showActions }) {
  const s = signalement;
  const statut = STATUT_STYLES[s.statut] || STATUT_STYLES.SIGNALE;

  return (
    <div style={styles.card}>

      {/* Photo */}
      {s.photoUrl && (
        <img
          src={`http://localhost:8081${s.photoUrl}`}
          alt={s.titre}
          style={styles.photo}
        />
      )}

      <div style={styles.body}>

        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.titre}>{s.titre}</h3>
          <span style={{
            ...styles.badge,
            background: statut.bg,
            color:      statut.color,
          }}>
            {statut.label}
          </span>
        </div>

        {/* Description */}
        <p style={styles.description}>{s.description}</p>

        {/* Infos */}
        <div style={styles.infos}>
          <span style={styles.categorie}>
            {CATEGORIE_ICONS[s.categorie]} {s.categorie}
          </span>
          {s.adresse && (
            <span style={styles.adresse}>📍 {s.adresse}</span>
          )}
          <span style={styles.date}>
            🗓️ {new Date(s.createdAt).toLocaleDateString('fr-FR')}
          </span>
        </div>

        {/* User info */}
        {s.userNom && (
          <p style={styles.user}>👤 {s.userNom}</p>
        )}

        {/* Actions */}
        {showActions && (
          <div style={styles.actions}>
            {onDelete && (
              <button
                onClick={() => onDelete(s.id)}
                style={styles.btnDelete}>
                🗑️ Supprimer
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    transition: 'transform 0.2s',
  },
  photo: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
  },
  body: {
    padding: '1.2rem',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.8rem',
    gap: '1rem',
  },
  titre: {
    color: '#1e3a8a',
    margin: 0,
    fontSize: '1.05rem',
    flex: 1,
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  description: {
    color: '#6b7280',
    fontSize: '0.9rem',
    margin: '0 0 0.8rem 0',
    lineHeight: '1.5',
  },
  infos: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.8rem',
    marginBottom: '0.5rem',
  },
  categorie: {
    color: '#1e40af',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  adresse: {
    color: '#6b7280',
    fontSize: '0.85rem',
  },
  date: {
    color: '#9ca3af',
    fontSize: '0.85rem',
  },
  user: {
    color: '#6b7280',
    fontSize: '0.85rem',
    margin: '0.5rem 0 0 0',
  },
  actions: {
    display: 'flex',
    gap: '0.8rem',
    marginTop: '1rem',
    paddingTop: '0.8rem',
    borderTop: '1px solid #f3f4f6',
  },
  btnDelete: {
    padding: '6px 14px',
    background: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },
};