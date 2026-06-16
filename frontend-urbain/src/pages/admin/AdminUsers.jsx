import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import API from '../../services/api';
import { isSuperAdmin } from '../../services/auth';
import { useTheme } from '../../context/ThemeContext';

const SUPER_ADMIN_EMAIL = 'admin@urbanreport.ma';

const ZONES = [
  'Casablanca', 'Mohammedia', 'Rabat', 'Salé',
  'Marrakech', 'Fès', 'Tanger', 'Agadir',
  'Oujda', 'Kenitra', 'Tétouan', 'Meknès',
];

export default function AdminUsers() {
  const { dark } = useTheme();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);
  const [search,  setSearch]  = useState('');
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [showEditAdmin,   setShowEditAdmin]   = useState(false);
  const [showCinModal,    setShowCinModal]    = useState(false);
  const [selectedUserCin, setSelectedUserCin] = useState(null);
  const [editAdmin, setEditAdmin] = useState(null);
  const [newAdmin, setNewAdmin]   = useState({ nom:'', prenom:'', email:'', password:'', zone:'' });
  const superAdmin = isSuperAdmin();

  const bg      = dark ? '#1e293b' : '#fff';
  const text    = dark ? '#e2e8f0' : '#374151';
  const subtext = dark ? '#94a3b8' : '#6b7280';
  const border  = dark ? '#334155' : '#e5e7eb';
  const pageBg  = dark ? '#0f172a' : '#f8fafc';

  const load = () => {
    setLoading(true);
    API.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleConfirm = async () => {
    if (!confirm) return;
    await confirm.action();
    setConfirm(null);
  };

  const handleEditAdmin = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/admin/users/${editAdmin.id}/role?role=${editAdmin.role}`);
      await API.put(`/admin/users/${editAdmin.id}/zone?zone=${editAdmin.zone}`);
      toast.success('Admin mis à jour !');
      setShowEditAdmin(false);
      setEditAdmin(null);
      load();
    } catch (err) {
      toast.error(err.response?.data || 'Erreur');
    }
  };

  const deleteUser = (id, userEmail, userName, userRole) => {
    if (userEmail === SUPER_ADMIN_EMAIL) { toast.error('Impossible !'); return; }
    if (!superAdmin && userRole === 'ADMIN_VILLE') {
      toast.error('Seul le Super Admin peut supprimer un Admin !');
      return;
    }
    setConfirm({
      title:"Supprimer l'utilisateur",
      message:`Supprimer "${userName}" ? Cette action est irréversible.`,
      icon:'🗑️', btnColor:'#dc2626', btnLabel:'Supprimer',
      action: async () => {
        try {
          await API.delete(`/admin/users/${id}`);
          toast.success('Supprimé !');
          load();
        } catch (err) {
          toast.error(err.response?.data || 'Erreur');
        }
      }
    });
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await API.post('/admin/users/admin', newAdmin);
      toast.success(`Admin créé pour la zone ${newAdmin.zone} !`);
      setShowCreateAdmin(false);
      setNewAdmin({ nom:'', prenom:'', email:'', password:'', zone:'' });
      load();
    } catch (err) {
      toast.error(err.response?.data || 'Erreur');
    }
  };

  // ✅ FIX — endpoints corrects pour valider/rejeter CIN
  const handleVerifierCin = async (userId, verifie) => {
    try {
      if (verifie) {
        await API.put(`/admin/users/${userId}/cin/valider`);
        toast.success('CIN validée ✅');
      } else {
        await API.put(`/admin/users/${userId}/cin/rejeter`);
        toast.success('CIN rejetée ❌');
      }
      setShowCinModal(false);
      setSelectedUserCin(null);
      load();
    } catch {
      toast.error('Erreur lors de la vérification');
    }
  };

  const admins      = users.filter(u => u.role === 'ADMIN_VILLE' || u.role === 'SUPER_ADMIN');
  const normalUsers = users.filter(u => u.role === 'USER').filter(u =>
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.nom?.toLowerCase().includes(search.toLowerCase()) ||
    u.prenom?.toLowerCase().includes(search.toLowerCase())
  );

  const cinPending = normalUsers.filter(u => u.cinRecto && !u.cinVerifie).length;

  const inputStyle = {
    width:'100%', padding:'8px 12px', borderRadius:'8px',
    border:`1px solid ${border}`, fontSize:'0.9rem',
    background: dark ? '#0f172a' : '#fff', color: text, boxSizing:'border-box'
  };

  return (
    <div style={{ background: pageBg, minHeight:'calc(100vh - 64px)', padding:'2rem' }}>
      <div style={{ maxWidth:'1100px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'2rem' }}>
          <h2 style={{ color: dark ? '#e2e8f0' : '#1e40af', margin:0 }}>
            👥 Gestion des utilisateurs
          </h2>
          {superAdmin && (
            <button onClick={() => setShowCreateAdmin(true)}
              style={{ padding:'10px 20px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600', fontSize:'0.9rem' }}>
              ➕ Créer un Admin de zone
            </button>
          )}
        </div>

        {/* CIN en attente */}
        {superAdmin && cinPending > 0 && (
          <div style={{ background:'#fef3c7', border:'1px solid #fbbf24', borderRadius:'10px', padding:'12px 16px', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'10px' }}>
            <span style={{ fontSize:'1.5rem' }}>⚠️</span>
            <div>
              <div style={{ fontWeight:'700', color:'#92400e' }}>
                {cinPending} CIN en attente de vérification
              </div>
              <div style={{ color:'#a16207', fontSize:'0.82rem' }}>
                Des utilisateurs ont soumis leur CIN et attendent votre validation.
              </div>
            </div>
          </div>
        )}

        {/* Admins Section */}
        {superAdmin && (
          <div style={{ marginBottom:'2rem' }}>
            <h3 style={{ color: dark ? '#e2e8f0' : '#1e3a8a', marginBottom:'1rem', fontSize:'1rem' }}>
              ⚙️ Administrateurs ({admins.length})
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(280px, 1fr))', gap:'1rem' }}>
              {admins.map(u => {
                const isSuper = u.email === SUPER_ADMIN_EMAIL;
                return (
                  <div key={u.id} style={{ background: bg, borderRadius:'12px', padding:'1.2rem', border:`1px solid ${border}`, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'1rem' }}>
                      <div style={{ width:'44px', height:'44px', borderRadius:'50%', background: isSuper ? '#fef3c7' : '#dbeafe', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'1rem', color: isSuper ? '#92400e' : '#1e40af' }}>
                        {u.nom?.charAt(0)}{u.prenom?.charAt(0)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:'600', color: text, fontSize:'0.9rem' }}>{u.nom} {u.prenom}</div>
                        <div style={{ fontSize:'0.78rem', color: subtext }}>{u.email}</div>
                      </div>
                      <span style={{ fontSize:'0.72rem', fontWeight:'600', padding:'2px 8px', borderRadius:'10px', background: isSuper ? '#fef3c7' : '#dbeafe', color: isSuper ? '#92400e' : '#1e40af' }}>
                        {isSuper ? '⭐ Super Admin' : '⚙️ Admin Ville'}
                      </span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'1rem' }}>
                      <span style={{ fontSize:'0.8rem', color: subtext }}>Zone :</span>
                      {isSuper ? (
                        <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#92400e', background:'#fef3c7', padding:'2px 8px', borderRadius:'6px' }}>🌍 Toutes les zones</span>
                      ) : (
                        <span style={{ fontSize:'0.85rem', fontWeight:'600', color:'#1e40af', background:'#dbeafe', padding:'2px 10px', borderRadius:'6px' }}>📍 {u.zone || 'Non définie'}</span>
                      )}
                    </div>
                    {!isSuper && (
                      <div style={{ display:'flex', gap:'8px' }}>
                        <button onClick={() => { setEditAdmin({...u}); setShowEditAdmin(true); }}
                          style={{ flex:1, padding:'6px 14px', background:'#eff6ff', color:'#1e40af', border:'1px solid #bfdbfe', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600' }}>
                          ✏️ Modifier
                        </button>
                        <button onClick={() => deleteUser(u.id, u.email, `${u.nom} ${u.prenom}`, u.role)}
                          style={{ flex:1, padding:'6px 14px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem', fontWeight:'600' }}>
                          🗑️ Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Users Table */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <h3 style={{ color: dark ? '#e2e8f0' : '#1e3a8a', margin:0, fontSize:'1rem' }}>
            👤 Utilisateurs ({normalUsers.length})
          </h3>
          <div style={{ position:'relative', width:'300px' }}>
            <span style={{ position:'absolute', left:'10px', top:'50%', transform:'translateY(-50%)', fontSize:'1rem' }}>🔍</span>
            <input type="text" placeholder="Rechercher par nom ou email..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ width:'100%', padding:'8px 12px 8px 34px', borderRadius:'8px', border:`1px solid ${border}`, fontSize:'0.85rem', background: bg, color: text, boxSizing:'border-box', outline:'none' }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position:'absolute', right:'8px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color: subtext, fontSize:'1rem' }}>✕</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'3rem', color: subtext }}>Chargement...</div>
        ) : (
          <div style={{ background: bg, borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.08)', border:`1px solid ${border}` }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background: dark ? '#0f172a' : '#f8fafc' }}>
                  {['ID','Nom','Email','CIN','Date','Actions'].map(h => (
                    <th key={h} style={{ padding:'12px 16px', textAlign:'left', color: subtext, fontWeight:'600', fontSize:'0.9rem', borderBottom:`1px solid ${border}` }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {normalUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom:`1px solid ${border}` }}>
                    <td style={{ padding:'12px 16px', color: subtext, fontSize:'0.85rem' }}>#{u.id}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                        <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: dark ? '#334155' : '#f3f4f6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'600', fontSize:'0.85rem', color: text }}>
                          {u.nom?.charAt(0)}{u.prenom?.charAt(0)}
                        </div>
                        <span style={{ fontWeight:'500', color: text }}>{u.nom} {u.prenom}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', color: subtext, fontSize:'0.85rem' }}>{u.email}</td>
                    <td style={{ padding:'12px 16px' }}>
                      {!u.cinRecto ? (
                        <span style={{ fontSize:'0.8rem', color:'#9ca3af' }}>— Non soumise</span>
                      ) : u.cinVerifie ? (
                        <span style={{ padding:'3px 10px', borderRadius:'20px', background:'#d1fae5', color:'#065f46', fontSize:'0.8rem', fontWeight:'600' }}>✅ Vérifiée</span>
                      ) : (
                        <button onClick={() => { setSelectedUserCin(u); setShowCinModal(true); }}
                          style={{ padding:'3px 10px', borderRadius:'20px', background:'#fef3c7', color:'#92400e', border:'1px solid #fbbf24', fontSize:'0.8rem', fontWeight:'600', cursor:'pointer' }}>
                          ⏳ En attente
                        </button>
                      )}
                    </td>
                    <td style={{ padding:'12px 16px', color: subtext, fontSize:'0.85rem' }}>
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <button onClick={() => deleteUser(u.id, u.email, `${u.nom} ${u.prenom}`, u.role)}
                        style={{ padding:'4px 12px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:'6px', cursor:'pointer', fontSize:'0.85rem' }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {normalUsers.length === 0 && (
              <div style={{ textAlign:'center', padding:'3rem', color: subtext }}>
                {search ? `Aucun résultat pour "${search}"` : 'Aucun utilisateur'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal CIN Vérification */}
      {showCinModal && selectedUserCin && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background: bg, borderRadius:'16px', padding:'2rem', maxWidth:'600px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.3)', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ color: dark ? '#e2e8f0' : '#1e3a8a', marginBottom:'0.5rem', textAlign:'center' }}>
              🪪 Vérification CIN
            </h3>
            <p style={{ color: subtext, fontSize:'0.9rem', textAlign:'center', marginBottom:'1.5rem' }}>
              {selectedUserCin.nom} {selectedUserCin.prenom} — {selectedUserCin.email}
            </p>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1.5rem' }}>
              <div>
                <div style={{ fontSize:'0.85rem', fontWeight:'600', color: text, marginBottom:'8px' }}>📄 Recto</div>
                <img src={`http://localhost:8081${selectedUserCin.cinRecto}`} alt="CIN Recto"
                  style={{ width:'100%', borderRadius:'8px', border:`1px solid ${border}` }} />
              </div>
              <div>
                <div style={{ fontSize:'0.85rem', fontWeight:'600', color: text, marginBottom:'8px' }}>📄 Verso</div>
                <img src={`http://localhost:8081${selectedUserCin.cinVerso}`} alt="CIN Verso"
                  style={{ width:'100%', borderRadius:'8px', border:`1px solid ${border}` }} />
              </div>
            </div>

            <div style={{ display:'flex', gap:'1rem' }}>
              <button onClick={() => { setShowCinModal(false); setSelectedUserCin(null); }}
                style={{ flex:1, padding:'10px', background: dark ? '#334155' : '#f1f5f9', color: text, border:`1px solid ${border}`, borderRadius:'8px', cursor:'pointer' }}>
                Fermer
              </button>
              <button onClick={() => handleVerifierCin(selectedUserCin.id, false)}
                style={{ flex:1, padding:'10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                ❌ Rejeter
              </button>
              <button onClick={() => handleVerifierCin(selectedUserCin.id, true)}
                style={{ flex:1, padding:'10px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                ✅ Valider
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifier Admin */}
      {showEditAdmin && editAdmin && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background: bg, borderRadius:'16px', padding:'2rem', maxWidth:'480px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: dark ? '#e2e8f0' : '#1e3a8a', marginBottom:'1.5rem', textAlign:'center' }}>✏️ Modifier l'Admin</h3>
            <form onSubmit={handleEditAdmin}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                <div>
                  <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Nom</label>
                  <input style={inputStyle} value={editAdmin.nom} onChange={e => setEditAdmin({...editAdmin, nom: e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Prénom</label>
                  <input style={inputStyle} value={editAdmin.prenom} onChange={e => setEditAdmin({...editAdmin, prenom: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Email</label>
                <input style={inputStyle} type="email" value={editAdmin.email} onChange={e => setEditAdmin({...editAdmin, email: e.target.value})} />
              </div>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Zone</label>
                <select style={inputStyle} value={editAdmin.zone || ''} onChange={e => setEditAdmin({...editAdmin, zone: e.target.value})}>
                  <option value="">Choisir une zone...</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Rôle</label>
                <select style={inputStyle} value={editAdmin.role} onChange={e => setEditAdmin({...editAdmin, role: e.target.value})}>
                  <option value="ADMIN_VILLE">⚙️ Admin Ville</option>
                  <option value="USER">👤 User</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:'1rem' }}>
                <button type="button" onClick={() => { setShowEditAdmin(false); setEditAdmin(null); }}
                  style={{ flex:1, padding:'10px', background: dark ? '#334155' : '#f1f5f9', color: text, border:`1px solid ${border}`, borderRadius:'8px', cursor:'pointer' }}>
                  Annuler
                </button>
                <button type="submit"
                  style={{ flex:1, padding:'10px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                  ✅ Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Créer Admin */}
      {showCreateAdmin && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background: bg, borderRadius:'16px', padding:'2rem', maxWidth:'480px', width:'100%', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: dark ? '#e2e8f0' : '#1e3a8a', marginBottom:'1.5rem', textAlign:'center' }}>➕ Créer un Admin de zone</h3>
            <form onSubmit={handleCreateAdmin}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                <div>
                  <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Nom</label>
                  <input required style={inputStyle} value={newAdmin.nom} onChange={e => setNewAdmin({...newAdmin, nom: e.target.value})} />
                </div>
                <div>
                  <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Prénom</label>
                  <input required style={inputStyle} value={newAdmin.prenom} onChange={e => setNewAdmin({...newAdmin, prenom: e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Email</label>
                <input required type="email" style={inputStyle} value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} />
              </div>
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Mot de passe</label>
                <input required type="password" style={inputStyle} value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} />
              </div>
              <div style={{ marginBottom:'1.5rem' }}>
                <label style={{ display:'block', marginBottom:'4px', fontSize:'0.85rem', color: subtext }}>Zone (ville)</label>
                <select required style={inputStyle} value={newAdmin.zone} onChange={e => setNewAdmin({...newAdmin, zone: e.target.value})}>
                  <option value="">Choisir une zone...</option>
                  {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', gap:'1rem' }}>
                <button type="button" onClick={() => setShowCreateAdmin(false)}
                  style={{ flex:1, padding:'10px', background: dark ? '#334155' : '#f1f5f9', color: text, border:`1px solid ${border}`, borderRadius:'8px', cursor:'pointer' }}>
                  Annuler
                </button>
                <button type="submit"
                  style={{ flex:1, padding:'10px', background:'#1e40af', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}>
                  ✅ Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmation */}
      {confirm && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:3000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background: bg, borderRadius:'16px', padding:'2rem', maxWidth:'420px', width:'100%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>{confirm.icon}</div>
            <h3 style={{ color: dark ? '#e2e8f0' : '#1e3a8a', fontSize:'1.2rem', fontWeight:'700', marginBottom:'0.8rem' }}>{confirm.title}</h3>
            <p style={{ color: subtext, fontSize:'0.95rem', lineHeight:'1.5', marginBottom:'1.5rem' }}>{confirm.message}</p>
            <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
              <button style={{ flex:1, padding:'10px', background: dark ? '#334155' : '#f1f5f9', color: text, border:`1px solid ${border}`, borderRadius:'8px', cursor:'pointer', fontWeight:'500' }}
                onClick={() => setConfirm(null)}>
                Annuler
              </button>
              <button style={{ flex:1, padding:'10px', background: confirm.btnColor, color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600' }}
                onClick={handleConfirm}>
                {confirm.btnLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}