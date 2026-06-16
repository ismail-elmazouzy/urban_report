import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { motion } from 'framer-motion';
import API from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6'];
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

export default function AdminDashboard() {
  const { dark } = useTheme();
  const [stats,        setStats]        = useState({ total:0, signale:0, enCours:0, resolu:0, totalUsers:0 });
  const [signalements, setSignalements] = useState([]);
  const [zones,        setZones]        = useState([]);
  const [loading,      setLoading]      = useState(true);

  const bg      = dark ? '#1e293b' : '#fff';
  const text    = dark ? '#e2e8f0' : '#1e3a8a';
  const subtext = dark ? '#94a3b8' : '#6b7280';
  const border  = dark ? '#334155' : '#e5e7eb';
  const pageBg  = dark ? '#0f172a' : '#f8fafc';

  useEffect(() => {
    API.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
    API.get('/admin/signalements').then(res => {
      const data = res.data;
      setSignalements(data);
      const grouped = {};
      data.forEach(s => {
        if (!s.latitude || !s.longitude) return;
        const key = `${Math.round(s.latitude*100)/100}_${Math.round(s.longitude*100)/100}`;
        if (!grouped[key]) grouped[key] = { lat:s.latitude, lng:s.longitude, count:0, signalements:[], adresse:s.adresse||'Zone' };
        grouped[key].count++;
        grouped[key].signalements.push(s);
      });
      setZones(Object.values(grouped).sort((a,b) => b.count - a.count));
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const categorieData = ['VOIRIE','ECLAIRAGE','DECHETS','EAU','AUTRE'].map(cat => ({
    name: cat,
    value: signalements.filter(s => s.categorie === cat).length,
  })).filter(d => d.value > 0);

  const statutData = [
    { name:'Signalé',  value: stats.signale, fill:'#ef4444' },
    { name:'En cours', value: stats.enCours, fill:'#3b82f6' },
    { name:'Résolu',   value: stats.resolu,  fill:'#22c55e' },
  ];

  const monthlyData = MONTHS.map((month, i) => ({
    month,
    count: signalements.filter(s => new Date(s.createdAt).getMonth() === i).length,
  }));

  const hotZones = zones.filter(z => z.count >= 2);

  const statCards = [
    { label:'Total',        value: stats.total,      color:'#3b82f6', bg:'#eff6ff', icon:'📋' },
    { label:'Signalés',     value: stats.signale,    color:'#ef4444', bg:'#fef2f2', icon:'🔴' },
    { label:'En cours',     value: stats.enCours,    color:'#3b82f6', bg:'#dbeafe', icon:'🔵' },
    { label:'Résolus',      value: stats.resolu,     color:'#22c55e', bg:'#d1fae5', icon:'🟢' },
    { label:'Utilisateurs', value: stats.totalUsers, color:'#8b5cf6', bg:'#f3e8ff', icon:'👥' },
  ];

  return (
    <div style={{ background: pageBg, minHeight:'calc(100vh - 64px)', padding:'2rem' }}>
      <div style={{ maxWidth:'1200px', margin:'0 auto' }}>

        <h2 style={{ color: text, marginBottom:'2rem', fontSize:'1.5rem', fontWeight:'700' }}>
          ⚙️ Tableau de bord Admin
        </h2>

        {/* Stat Cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {statCards.map((c, i) => (
            <motion.div key={i}
              initial={{ opacity:0, y:20 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale:1.04 }}
              style={{
                background: dark ? '#1e293b' : c.bg,
                borderRadius:'12px', padding:'1.5rem', textAlign:'center',
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                border:`1px solid ${border}`,
              }}>
              <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>{c.icon}</div>
              <div style={{ fontSize:'2.2rem', fontWeight:'800', color: c.color }}>{c.value}</div>
              <div style={{ color: subtext, fontSize:'0.85rem', marginTop:'4px' }}>{c.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'2rem' }}>

          {/* Pie Chart */}
          <div style={{ background: bg, borderRadius:'12px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${border}` }}>
            <h3 style={{ color: text, marginBottom:'1rem', fontSize:'1rem' }}>📊 Répartition par statut</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statutData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}>
                  {statutData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div style={{ background: bg, borderRadius:'12px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${border}` }}>
            <h3 style={{ color: text, marginBottom:'1rem', fontSize:'1rem' }}>📁 Par catégorie</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categorieData}>
                <CartesianGrid strokeDasharray="3 3" stroke={border} />
                <XAxis dataKey="name" tick={{ fill: subtext, fontSize:11 }} />
                <YAxis tick={{ fill: subtext, fontSize:11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[6,6,0,0]}>
                  {categorieData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Line Chart */}
        <div style={{ background: bg, borderRadius:'12px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${border}`, marginBottom:'2rem' }}>
          <h3 style={{ color: text, marginBottom:'1rem', fontSize:'1rem' }}>📈 Évolution mensuelle</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} />
              <XAxis dataKey="month" tick={{ fill: subtext, fontSize:11 }} />
              <YAxis tick={{ fill: subtext, fontSize:11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3}
                dot={{ fill:'#3b82f6', r:4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Zones critiques */}
        {hotZones.length > 0 && (
          <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:'12px', padding:'1.5rem', marginBottom:'2rem' }}>
            <h3 style={{ color:'#c2410c', marginBottom:'1rem', fontSize:'1rem' }}>
              ⚠️ Zones critiques — {hotZones.length} zone(s)
            </h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.8rem' }}>
              {hotZones.slice(0, 5).map((z, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#fff', padding:'0.8rem 1rem', borderRadius:'8px', border:'1px solid #fed7aa' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ background:'#dc2626', color:'#fff', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', minWidth:'32px' }}>
                      {z.count}
                    </div>
                    <div>
                      <div style={{ fontWeight:'500', color:'#374151' }}>{z.adresse}</div>
                      <div style={{ fontSize:'0.8rem', color:'#6b7280' }}>
                        {parseFloat(z.lat).toFixed(4)}, {parseFloat(z.lng).toFixed(4)}
                      </div>
                    </div>
                  </div>
                  <Link to="/admin/signalements" style={{ background:'#1e40af', color:'#fff', padding:'4px 12px', borderRadius:'6px', textDecoration:'none', fontSize:'0.85rem' }}>
                    Voir →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Carte */}
        {!loading && zones.length > 0 && (
          <div style={{ background: bg, borderRadius:'12px', padding:'1.5rem', boxShadow:'0 2px 12px rgba(0,0,0,0.06)', border:`1px solid ${border}`, marginBottom:'2rem' }}>
            <h3 style={{ color: text, marginBottom:'1rem', fontSize:'1rem' }}>🗺️ Carte des signalements</h3>
            <MapContainer center={[33.5731, -7.5898]} zoom={11} style={{ height:'400px', borderRadius:'12px' }}>
<TileLayer
  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
  attribution='&copy; Esri'
/>              {zones.map((z, i) => (
                <Circle key={i} center={[z.lat, z.lng]} radius={z.count * 200}
                  pathOptions={{
                    color:       z.count >= 5 ? '#dc2626' : z.count >= 3 ? '#f59e0b' : '#3b82f6',
                    fillColor:   z.count >= 5 ? '#fecaca' : z.count >= 3 ? '#fef3c7' : '#dbeafe',
                    fillOpacity: 0.5,
                  }}>
                  <Popup>
                    <strong>{z.adresse}</strong>
                    <p>{z.count} signalement(s)</p>
                  </Popup>
                </Circle>
              ))}
            </MapContainer>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'1rem' }}>
          {[
            { to:'/admin/signalements', icon:'📋', title:'Gérer les signalements', desc:'Voir, filtrer et modifier le statut' },
            { to:'/admin/users',        icon:'👥', title:'Gérer les utilisateurs', desc:'Voir et gérer les comptes' },
            { to:'/dashboard',          icon:'🗺️', title:'Voir la carte',          desc:'Visualiser tous les signalements' },
          ].map((f, i) => (
            <motion.div key={i} whileHover={{ scale:1.02 }}>
              <Link to={f.to} style={{
                background: bg, padding:'1.5rem', borderRadius:'12px',
                boxShadow:'0 2px 12px rgba(0,0,0,0.06)', textDecoration:'none',
                display:'block', border:`1px solid ${border}`,
              }}>
                <div style={{ fontSize:'2rem' }}>{f.icon}</div>
                <h3 style={{ color: text, margin:'0.8rem 0 0.4rem', fontSize:'1rem' }}>{f.title}</h3>
                <p style={{ color: subtext, fontSize:'0.85rem', margin:0 }}>{f.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}