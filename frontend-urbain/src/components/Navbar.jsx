import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import API from '../services/api';
import Logo from './Logo';
import { isLogged, isAdmin, isSuperAdmin, getZone, logout } from '../services/auth';
import {
  Map, Plus, ClipboardList, Sun, Moon, AlertTriangle,
  Bell, Star, Settings, BarChart2, Users, User,
  LogOut, MapPin, ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { dark, toggle } = useTheme();
  const [showAdminMenu,     setShowAdminMenu]     = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile,       setShowProfile]       = useState(false);
  const [notifications,     setNotifications]     = useState([]);
  const [unreadCount,       setUnreadCount]       = useState(0);
  const [needsCin,          setNeedsCin]          = useState(false);

  const zone = getZone();

  useEffect(() => {
    if (!isLogged()) return;
    loadNotifications();
    loadCinStatus();
    const interval = setInterval(() => { loadNotifications(); loadCinStatus(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = () => {
    API.get('/notifications').then(res => {
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.lu).length);
    }).catch(() => {});
  };

  const loadCinStatus = () => {
    if (!isLogged() || isAdmin()) return;
    API.get('/user/profile').then(res => {
      setNeedsCin(!(res.data.cinRecto && res.data.cinVerso));
    }).catch(() => {});
  };

  const markAsRead    = async (id) => { await API.put(`/notifications/${id}/lu`); loadNotifications(); };
  const markAllAsRead = async ()   => { await API.put('/notifications/tout-lire'); loadNotifications(); };
  const closeAll = () => { setShowAdminMenu(false); setShowNotifications(false); setShowProfile(false); };
  const handleLogout = () => { logout(); navigate('/login'); };

  const navBg     = dark ? '#1e293b' : '#ffffff';
  const navBorder = dark ? '#334155' : '#e2e8f0';
  const linkColor = dark ? '#cbd5e1' : '#4b5563';
  const iconColor = dark ? '#e2e8f0' : '#374151';

  // ── NavLink avec underline animé ──
  const NavLink = ({ to, children }) => {
    const active = location.pathname === to;
    return (
      <Link to={to} style={{ textDecoration:'none', position:'relative' }}>
        <motion.div
          whileHover={{ color: '#2563eb' }}
          style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'0.9rem', fontWeight: active ? '600' : '500', color: active ? '#2563eb' : linkColor, padding:'4px 2px', position:'relative' }}>
          {children}
          {/* underline animé */}
          <motion.span
            initial={false}
            animate={{ scaleX: active ? 1 : 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.2 }}
            style={{ position:'absolute', bottom:'-2px', left:0, right:0, height:'2px', background:'#2563eb', borderRadius:'2px', transformOrigin:'left' }}
          />
        </motion.div>
      </Link>
    );
  };

  // ── IconButton avec hover ──
  const IconBtn = ({ onClick, children, style = {} }) => (
    <motion.button
      whileHover={{ scale: 1.08, backgroundColor: dark ? 'rgba(255,255,255,0.12)' : '#e2e8f0' }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{ display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'8px', padding:'7px 9px', cursor:'pointer', border:`1px solid ${navBorder}`, background: dark?'rgba(255,255,255,0.05)':'#f8fafc', color: iconColor, transition:'color .2s', ...style }}>
      {children}
    </motion.button>
  );

  return (
    <nav style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 2rem', height:'64px', position:'sticky', top:0, zIndex:1000, background: navBg, borderBottom:`1px solid ${navBorder}`, boxShadow: dark?'0 2px 8px rgba(0,0,0,0.3)':'0 2px 8px rgba(0,0,0,0.06)' }}>
      <Link to="/" style={{ textDecoration:'none' }}>
        <Logo size="small" />
      </Link>

      <div style={{ display:'flex', alignItems:'center', gap:'1.2rem' }}>
        <NavLink to="/">Accueil</NavLink>
        <NavLink to="/dashboard"><Map size={15} /> Carte</NavLink>

        {isLogged() ? (
          <>
            <NavLink to="/signaler"><Plus size={15} /> Signaler</NavLink>
            <NavLink to="/mes-signalements"><ClipboardList size={15} /> Mes signalements</NavLink>

            {/* Theme toggle */}
            <IconBtn onClick={toggle}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </IconBtn>

            {/* CIN Alert */}
            {needsCin && !isAdmin() && (
              <motion.div whileHover={{ scale:1.04 }} animate={{ opacity:[1,0.7,1] }} transition={{ repeat:Infinity, duration:2 }}>
                <Link to="/profile" onClick={closeAll}
                  style={{ display:'flex', alignItems:'center', gap:'4px', background:'#fef3c7', color:'#78350f', padding:'5px 10px', borderRadius:'6px', textDecoration:'none', fontSize:'0.82rem', fontWeight:'700', border:'1px solid #fbbf24' }}>
                  <AlertTriangle size={13} /> Compléter le profil
                </Link>
              </motion.div>
            )}

            {/* Notifications */}
            <div style={{ position:'relative' }}>
              <IconBtn onClick={() => { setShowNotifications(!showNotifications); setShowAdminMenu(false); setShowProfile(false); }}
                style={{ position:'relative' }}>
                <Bell size={17} />
                {unreadCount > 0 && (
                  <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
                    style={{ position:'absolute', top:'-5px', right:'-5px', background:'#ef4444', color:'#fff', borderRadius:'50%', width:'18px', height:'18px', fontSize:'0.68rem', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold' }}>
                    {unreadCount}
                  </motion.span>
                )}
              </IconBtn>

              {showNotifications && (
                <motion.div initial={{ opacity:0, y:-8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.15 }}
                  style={{ position:'absolute', top:'46px', right:0, background: dark?'#1e293b':'#fff', borderRadius:'14px', boxShadow:'0 8px 30px rgba(0,0,0,0.15)', width:'320px', zIndex:2000, overflow:'hidden', border:`1px solid ${navBorder}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:`1px solid ${navBorder}`, background: dark?'#0f172a':'#f8fafc' }}>
                    <span style={{ display:'flex', alignItems:'center', gap:'6px', fontWeight:'600', color:'#1e40af', fontSize:'0.95rem' }}>
                      <Bell size={14} /> Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} style={{ background:'none', border:'none', color:'#3b82f6', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600' }}>
                        Tout lire
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding:'2rem', textAlign:'center', color:'#6b7280', fontSize:'0.9rem' }}>Aucune notification</div>
                  ) : (
                    <div style={{ maxHeight:'300px', overflowY:'auto' }}>
                      {notifications.map(n => (
                        <motion.div key={n.id} whileHover={{ background: dark?'#334155':'#f1f5f9' }}
                          style={{ padding:'12px 16px', borderBottom:`1px solid ${navBorder}`, cursor:'pointer', position:'relative', background: n.lu ? (dark?'#1e293b':'#fff') : (dark?'#1e3a5f':'#eff6ff') }}
                          onClick={() => markAsRead(n.id)}>
                          <div style={{ fontSize:'0.85rem', color: dark?'#e2e8f0':'#374151', lineHeight:'1.4' }}>{n.message}</div>
                          <div style={{ fontSize:'0.75rem', color:'#9ca3af', marginTop:'4px' }}>{new Date(n.createdAt).toLocaleDateString('fr-FR')}</div>
                          {!n.lu && <span style={{ position:'absolute', top:'14px', right:'14px', width:'8px', height:'8px', borderRadius:'50%', background:'#3b82f6' }}/>}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Admin Menu */}
            {isAdmin() && (
              <div style={{ position:'relative' }}>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                  style={{ display:'flex', alignItems:'center', gap:'6px', background:'#fbbf24', color:'#1e3a8a', border:'none', padding:'7px 14px', borderRadius:'8px', cursor:'pointer', fontSize:'0.88rem', fontWeight:'600' }}
                  onClick={() => { setShowAdminMenu(!showAdminMenu); setShowNotifications(false); setShowProfile(false); }}>
                  {isSuperAdmin() ? <><Star size={14} /> Super Admin</> : <><Settings size={14} /> Admin — {getZone()||''}</>}
                  <motion.span animate={{ rotate: showAdminMenu ? 180 : 0 }} transition={{ duration:0.2 }}>
                    <ChevronDown size={13} />
                  </motion.span>
                </motion.button>

                {showAdminMenu && (
                  <motion.div initial={{ opacity:0, y:-8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.15 }}
                    style={{ position:'absolute', top:'44px', right:0, background: dark?'#1e293b':'#fff', borderRadius:'12px', boxShadow:'0 8px 30px rgba(0,0,0,0.15)', minWidth:'200px', zIndex:2000, overflow:'hidden', border:`1px solid ${navBorder}` }}>
                    {[
                      { to:'/admin',              Icon:BarChart2,   label:'Tableau de bord' },
                      { to:'/admin/signalements', Icon:ClipboardList, label:'Signalements' },
                      ...(isSuperAdmin() ? [{ to:'/admin/users', Icon:Users, label:'Utilisateurs' }] : []),
                    ].map((item, i) => (
                      <motion.div key={i} whileHover={{ background: dark?'#334155':'#f1f5f9', x:3 }}>
                        <Link to={item.to} onClick={closeAll}
                          style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 16px', color: dark?'#e2e8f0':'#374151', textDecoration:'none', fontSize:'0.88rem', borderBottom:`1px solid ${navBorder}` }}>
                          <item.Icon size={15} color="#2563eb" /> {item.label}
                        </Link>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* Profile */}
            <div style={{ position:'relative' }}>
              <motion.button whileHover={{ scale:1.04 }} whileTap={{ scale:0.97 }}
                style={{ display:'flex', alignItems:'center', gap:'6px', borderRadius:'20px', padding:'4px 10px', cursor:'pointer', background: dark?'rgba(255,255,255,0.08)':'#f1f5f9', border:`1px solid ${navBorder}`, color: iconColor, position:'relative' }}
                onClick={() => { setShowProfile(!showProfile); setShowAdminMenu(false); setShowNotifications(false); }}>
                {localStorage.getItem('photoUrl') ? (
                  <img src={`http://localhost:8081${localStorage.getItem('photoUrl')}`} alt="profil"
                    style={{ width:'28px', height:'28px', borderRadius:'50%', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:'28px', height:'28px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'0.85rem', background: dark?'#334155':'#dbeafe', color: dark?'#e2e8f0':'#1e40af' }}>
                    {localStorage.getItem('email')?.charAt(0).toUpperCase()}
                  </div>
                )}
                {needsCin && !isAdmin() && (
                  <span style={{ width:'8px', height:'8px', background:'#ef4444', borderRadius:'50%', position:'absolute', top:'2px', right:'2px' }} />
                )}
                <motion.span animate={{ rotate: showProfile ? 180 : 0 }} transition={{ duration:0.2 }}>
                  <ChevronDown size={13} />
                </motion.span>
              </motion.button>

              {showProfile && (
                <motion.div initial={{ opacity:0, y:-8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.15 }}
                  style={{ position:'absolute', top:'46px', right:0, background: dark?'#1e293b':'#fff', borderRadius:'14px', boxShadow:'0 8px 30px rgba(0,0,0,0.15)', minWidth:'230px', zIndex:2000, overflow:'hidden', border:`1px solid ${navBorder}` }}>
                  <div style={{ padding:'14px 16px', borderBottom:`1px solid ${navBorder}`, background: dark?'#0f172a':'#f8fafc' }}>
                    <div style={{ fontSize:'0.85rem', fontWeight:'600', color: dark?'#e2e8f0':'#374151', marginBottom:'4px' }}>
                      {localStorage.getItem('email')}
                    </div>
                    {zone && (
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', fontSize:'0.75rem', color:'#6b7280' }}>
                        <MapPin size={11} /> Zone : {zone}
                      </div>
                    )}
                    <div style={{ marginTop:'6px' }}>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'10px', fontSize:'0.72rem', fontWeight:'600', background: isSuperAdmin()?'#fef3c7':'#dbeafe', color: isSuperAdmin()?'#92400e':'#1e40af' }}>
                        {isSuperAdmin() ? <><Star size={11}/> Super Admin</> : isAdmin() ? <><Settings size={11}/> Admin Ville</> : <><User size={11}/> Utilisateur</>}
                      </span>
                    </div>
                    {needsCin && !isAdmin() && (
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'8px', padding:'6px 10px', background:'#fef3c7', borderRadius:'6px', fontSize:'0.78rem', color:'#92400e', fontWeight:'600' }}>
                        <AlertTriangle size={12}/> CIN requise —
                        <Link to="/profile" onClick={closeAll} style={{ color:'#92400e' }}>Compléter</Link>
                      </div>
                    )}
                  </div>

                  {[
                    { to:'/profile',          Icon:User,         label:'Mon profil',       alert: needsCin && !isAdmin() },
                    { to:'/mes-signalements', Icon:ClipboardList, label:'Mes signalements', alert: false },
                  ].map((item, i) => (
                    <motion.div key={i} whileHover={{ background: dark?'#334155':'#f1f5f9', x:2 }}>
                      <Link to={item.to} onClick={closeAll}
                        style={{ display:'flex', alignItems:'center', gap:'10px', padding:'11px 16px', color: dark?'#e2e8f0':'#374151', textDecoration:'none', fontSize:'0.88rem', borderBottom:`1px solid ${navBorder}` }}>
                        <item.Icon size={15} /> {item.label}
                        {item.alert && <span style={{ marginLeft:'auto', background:'#ef4444', color:'#fff', borderRadius:'50%', width:'16px', height:'16px', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:'bold' }}>!</span>}
                      </Link>
                    </motion.div>
                  ))}

                  <div style={{ height:'1px', background: navBorder }} />
                  <motion.button whileHover={{ background: dark?'#3f1212':'#fff5f5' }}
                    onClick={handleLogout}
                    style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'11px 16px', color:'#dc2626', background:'none', border:'none', textAlign:'left', cursor:'pointer', fontSize:'0.88rem' }}>
                    <LogOut size={15} /> Déconnexion
                  </motion.button>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          <>
            <IconBtn onClick={toggle}>
              {dark ? <Sun size={16} /> : <Moon size={16} />}
            </IconBtn>
            <Link to="/login" style={{ textDecoration:'none' }}>
              <motion.span whileHover={{ color:'#2563eb' }}
                style={{ fontSize:'0.9rem', fontWeight:'500', color: linkColor }}>
                Connexion
              </motion.span>
            </Link>
            <motion.div whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}>
              <Link to="/register"
                style={{ padding:'7px 18px', borderRadius:'8px', textDecoration:'none', fontWeight:'600', fontSize:'0.9rem', background:'#2563eb', color:'white', boxShadow:'0 2px 8px rgba(37,99,235,0.35)' }}>
                S'inscrire
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </nav>
  );
}