import React from 'react';

export default function Logo({ size = 'normal' }) {
  const scale = size === 'small' ? 0.5 : size === 'large' ? 1 : 0.65;
  const w = Math.round(72 * scale);
  const h = Math.round(72 * scale);

  return (
    <div style={{ display:'flex', alignItems:'center', gap: Math.round(18 * scale) }}>

      {/* Icon Box */}
      <div style={{
        width: w, height: h,
        borderRadius: Math.round(18 * scale),
        background:'linear-gradient(135deg, #1A6FD4, #0C3F7A)',
        position:'relative', overflow:'hidden', flexShrink:0,
      }}>
        {/* Buildings */}
        {[
          { left:9*scale,  width:10*scale, height:24*scale, delay:'0.3s' },
          { left:21*scale, width:13*scale, height:30*scale, delay:'0.45s' },
          { left:36*scale, width:9*scale,  height:20*scale, delay:'0.35s' },
          { left:47*scale, width:14*scale, height:26*scale, delay:'0.5s' },
        ].map((b, i) => (
          <div key={i} style={{
            position:'absolute', bottom: 14*scale,
            left: b.left, width: b.width, height: b.height,
            background:'white', borderRadius:2, transformOrigin:'bottom center',
            animation: `riseUp 0.5s ease-out ${b.delay} both`,
          }} />
        ))}

        {/* Road */}
        <div style={{
          position:'absolute', bottom: 10*scale,
          left: 8*scale, right: 8*scale, height: 2*scale,
          background:'rgba(255,255,255,0.25)', borderRadius:1,
        }} />

        {/* Pin */}
        <div style={{
          position:'absolute', top: 7*scale, right: 9*scale,
          animation:'pinDrop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.8s both',
        }}>
          <div style={{
            width: 16*scale, height: 16*scale,
            borderRadius:'50% 50% 50% 0',
            background:'white', transform:'rotate(-45deg)',
            position:'relative',
          }}>
            <div style={{
              position:'absolute', width: 7*scale, height: 7*scale,
              borderRadius:'50%', background:'#1A6FD4',
              top:'50%', left:'50%', transform:'translate(-50%,-50%)',
            }} />
          </div>
          <div style={{ width: 2*scale, height: 5*scale, background:'rgba(255,255,255,0.6)', margin:'0 auto' }} />
        </div>
      </div>

      {/* Wordmark — CSS variables حسب data-theme */}
      <div style={{ display:'flex', flexDirection:'column', lineHeight:1 }}>
        <span style={{
          fontFamily:'system-ui, -apple-system, sans-serif',
          fontSize: Math.round(36 * scale),
          fontWeight:700,
          color:'var(--logo-urban)',
          letterSpacing:'-0.5px',
          animation:'slideIn 0.5s ease-out 0.5s both',
        }}>
          Urban
        </span>
        <span style={{
          fontFamily:'system-ui, -apple-system, sans-serif',
          fontSize: Math.round(36 * scale),
          fontWeight:300,
          color:'var(--logo-report)',
          letterSpacing:'-0.5px',
          animation:'slideIn 0.5s ease-out 0.65s both',
        }}>
          Report
        </span>
        {size !== 'small' && (
          <span style={{
            fontFamily:'system-ui, sans-serif',
            fontSize: Math.round(11 * scale),
            fontWeight:400, letterSpacing:'2.5px',
            color:'#4A7BAF', marginTop: 6*scale,
            animation:'fadeIn 0.6s ease 0.9s both',
          }}>
            SMART CITY PLATFORM
          </span>
        )}
      </div>

      <style>{`
        /* Light mode */
        body[data-theme="light"] {
          --logo-urban: #1e293b;
          --logo-report: #2563eb;
        }
        /* Dark mode */
        body[data-theme="dark"] {
          --logo-urban: white;
          --logo-report: #5BAEF0;
        }
        /* Default (dark) — قبل ما يتحمل الـ theme */
        :root {
          --logo-urban: white;
          --logo-report: #5BAEF0;
        }
        @keyframes riseUp {
          from { transform: scaleY(0); }
          to   { transform: scaleY(1); }
        }
        @keyframes pinDrop {
          from { opacity:0; transform: translateY(-12px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity:0; transform: translateX(-16px); }
          to   { opacity:1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>
    </div>
  );
}