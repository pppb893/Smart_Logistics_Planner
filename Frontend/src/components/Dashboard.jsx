import React, { useState } from 'react';
import {
  Truck, Clock, Ruler, ShieldCheck, AlertTriangle,
  ChevronDown, ChevronUp, Route, ArrowRight, Package,
  Droplets, Wind, Thermometer, Fuel, Printer, Calendar
} from 'lucide-react';
import './Dashboard.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// ── Helpers ─────────────────────────────────────────────
const weatherEmoji = (main) => ({ Clear:'☀️',Clouds:'☁️',Rain:'🌧️',Drizzle:'🌦️',Thunderstorm:'⛈️',Snow:'❄️',Mist:'🌫️',Fog:'🌫️',Haze:'🌫️',Smoke:'💨',Dust:'🌪️',Ash:'🌋',Squall:'💨',Tornado:'🌪️' }[main] || '🌡️');
const weatherColor = (main) => ({ Clear:'#f6d365',Clouds:'#adb5bd',Rain:'#4facfe',Drizzle:'#74c0fc',Thunderstorm:'#ff5252',Snow:'#a9d8f0',Mist:'#ced4da',Fog:'#ced4da',Haze:'#ced4da' }[main] || '#adb5bd');

const reverseGeocode = async (lon, lat) => {
  try {
    const r = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?types=locality,district,place&access_token=${MAPBOX_TOKEN}`);
    const d = await r.json();
    return d.features?.[0]?.place_name?.split(',')[0] || null;
  } catch { return null; }
};

// Uses forecast endpoint with ETA timestamp
const fetchForecastAt = async (lat, lon, timestamp) => {
  try {
    const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
    const r = await fetch(`${apiUrl}/api/routes/forecast?lat=${lat}&lon=${lon}&timestamp=${timestamp}`);
    return r.ok ? await r.json() : null;
  } catch { return null; }
};

const sampleCoords = (coords, count) => {
  if (!coords?.length) return [];
  if (coords.length <= count) return coords;
  const step = Math.floor(coords.length / (count - 1));
  const pts = [];
  for (let i = 0; i < count - 1; i++) pts.push(coords[i * step]);
  pts.push(coords[coords.length - 1]);
  return pts;
};

const dynamicCount = (km) => km < 200 ? 5 : km < 500 ? 7 : km < 1500 ? 9 : km < 5000 ? 11 : 14;

// Parse "4h 28m" or "28m" back to seconds
const parseDurationToSeconds = (str) => {
  if (!str) return 0;
  const h = str.match(/(\d+)h/);
  const m = str.match(/(\d+)m/);
  return (h ? parseInt(h[1]) * 3600 : 0) + (m ? parseInt(m[1]) * 60 : 0);
};

// ── Print Manifest ───────────────────────────────────────
const printManifest = (ship, waypoints, fuel) => {
  const now = new Date().toLocaleString('en-GB', { day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' });
  const wpRows = waypoints.map((wp, i) => `
    <tr>
      <td style="padding:8px;border:1px solid #ddd;">${i + 1}</td>
      <td style="padding:8px;border:1px solid #ddd;font-weight:600">${wp.name || '—'}</td>
      <td style="padding:8px;border:1px solid #ddd;">${wp.weather ? weatherEmoji(wp.weather.main) + ' ' + wp.weather.description : 'N/A'}</td>
      <td style="padding:8px;border:1px solid #ddd;">${wp.weather ? wp.weather.temp + '°C' : 'N/A'}</td>
      <td style="padding:8px;border:1px solid #ddd;font-size:12px;color:#666">${wp.weather?.isForecast ? '📅 ' + wp.weather.forecastTime : 'Now'}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Dispatch Manifest – ${ship.truck}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#222;margin:40px;line-height:1.5}
    h1{color:#1a237e;border-bottom:3px solid #1a237e;padding-bottom:8px;display:flex;align-items:center;gap:10px}
    h2{color:#283593;margin-top:24px;margin-bottom:8px}
    table{border-collapse:collapse;width:100%}
    .info-table td{padding:8px 12px;border:1px solid #ddd}
    .info-table td:first-child{font-weight:600;background:#f5f5f5;width:160px}
    .badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:13px}
    .safe{background:#e8f5e9;color:#1b5e20}.danger{background:#ffebee;color:#b71c1c}
    .footer{margin-top:40px;padding-top:12px;border-top:1px solid #ddd;font-size:12px;color:#999}
    @media print{body{margin:20px}}
  </style></head>
  <body>
    <h1>🚛 Dispatch Manifest</h1>
    <p style="color:#666">Generated: ${now}</p>

    <h2>Truck Information</h2>
    <table class="info-table">
      <tr><td>Truck ID</td><td>${ship.truck}</td></tr>
      <tr><td>Route Status</td><td><span class="badge ${ship.isSafe?'safe':'danger'}">${ship.isSafe?'✅ Clear Route':'⚠️ Storm Warning'}</span></td></tr>
      <tr><td>Origin</td><td>${ship.origin}</td></tr>
      <tr><td>Destination</td><td>${ship.destination}</td></tr>
      <tr><td>Distance</td><td>${ship.distance} km</td></tr>
      <tr><td>Est. Duration</td><td>${ship.duration}</td></tr>
    </table>

    <h2>⛽ Fuel Estimate</h2>
    <table class="info-table">
      <tr><td>Cargo Weight</td><td>${fuel.weight} tons</td></tr>
      <tr><td>Fuel Efficiency</td><td>${fuel.efficiency} L/100km</td></tr>
      <tr><td>Total Fuel</td><td>${fuel.totalFuel.toFixed(1)} L</td></tr>
      <tr><td>Estimated Cost</td><td>฿${fuel.totalCost.toFixed(0)}</td></tr>
      <tr><td>CO₂ Emissions</td><td>${fuel.co2.toFixed(1)} kg</td></tr>
    </table>

    <h2>📍 Route Waypoints & Weather Forecast</h2>
    <table>
      <thead><tr style="background:#1a237e;color:#fff">
        <th style="padding:8px;border:1px solid #ddd">#</th>
        <th style="padding:8px;border:1px solid #ddd">Location</th>
        <th style="padding:8px;border:1px solid #ddd">Condition</th>
        <th style="padding:8px;border:1px solid #ddd">Temp</th>
        <th style="padding:8px;border:1px solid #ddd">Forecast Time</th>
      </tr></thead>
      <tbody>${wpRows}</tbody>
    </table>

    <div class="footer">Printed via Smart Logistics Planner • ${now}</div>
  </body></html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
};

// ── Truck Card ──────────────────────────────────────────
const TruckCard = ({ ship }) => {
  const [wpOpen, setWpOpen] = useState(false);
  const [fuelOpen, setFuelOpen] = useState(false);
  const [waypoints, setWaypoints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fuel calc state
  const [weight, setWeight] = useState(10);
  const [efficiency, setEfficiency] = useState(30);
  const [fuelPrice, setFuelPrice] = useState(30);
  const dist = parseFloat(ship.distance || 0);
  const totalFuel = (dist / 100) * efficiency;
  const totalCost = totalFuel * fuelPrice;
  const co2 = totalFuel * 2.68;

  const loadWaypoints = async () => {
    if (waypoints.length > 0) return;
    setLoading(true);
    try {
      const coords = ship.route?.geometry?.coordinates;
      if (!coords?.length) return;
      const count = dynamicCount(dist);
      const sampled = sampleCoords(coords, count);
      const totalSecs = ship.route?.duration || parseDurationToSeconds(ship.duration);
      const nowTs = Math.floor(Date.now() / 1000);

      const results = await Promise.all(
        sampled.map(async ([lon, lat], i) => {
          const fraction = sampled.length > 1 ? i / (sampled.length - 1) : 0;
          const etaTs = nowTs + Math.round(fraction * totalSecs);
          const [name, weather] = await Promise.all([
            reverseGeocode(lon, lat),
            fetchForecastAt(lat, lon, etaTs)
          ]);
          return { name, weather };
        })
      );
      const seen = new Set();
      setWaypoints(results.filter(r => {
        if (!r.name || seen.has(r.name)) return false;
        seen.add(r.name); return true;
      }));
    } finally { setLoading(false); }
  };

  const handleWpToggle = () => {
    const next = !wpOpen; setWpOpen(next);
    if (next) loadWaypoints();
  };

  return (
    <div className={`truck-card-dash ${ship.isSafe ? 'card-safe' : 'card-danger'}`}>
      <div className="truck-color-strip" style={{ background: ship.color }} />
      <div className="card-body">

        {/* Header */}
        <div className="card-header-dash">
          <div className="card-title">
            <Truck size={20} />
            <span className="plate">{ship.truck}</span>
            <span className={`status-pill ${ship.isSafe ? 'safe' : 'danger'}`}>
              {ship.isSafe ? <><ShieldCheck size={12}/> ปลอดภัย</> : <><AlertTriangle size={12}/> พายุเตือน</>}
            </span>
          </div>
          <button className="print-btn" title="พิมพ์ใบส่งสินค้า"
            onClick={() => printManifest(ship, waypoints, { weight, efficiency, fuelPrice, totalFuel, totalCost, co2 })}>
            <Printer size={15}/> พิมพ์
          </button>
        </div>

        {/* Route */}
        <div className="route-summary">
          <div className="endpoint-row"><span className="dot-origin"/><span className="place-name">{ship.origin}</span></div>
          <div className="route-line-visual"><div className="dashed-line"/><ArrowRight size={16} className="arrow-icon"/></div>
          <div className="endpoint-row"><span className="dot-dest"/><span className="place-name">{ship.destination}</span></div>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-chip"><Ruler size={14}/><span>{ship.distance} กม.</span></div>
          <div className="stat-chip"><Clock size={14}/><span>{ship.duration}</span></div>
        </div>

        {/* Action Buttons */}
        <div className="card-actions">
          <button className={`action-tab ${wpOpen ? 'active' : ''}`} onClick={handleWpToggle}>
            <Route size={14}/> เส้นทาง & สภาพอากาศ
          </button>
          <button className={`action-tab ${fuelOpen ? 'active' : ''}`} onClick={() => setFuelOpen(!fuelOpen)}>
            <Fuel size={14}/> ค่าน้ำมัน
          </button>
        </div>

        {/* ── Waypoints & Forecast ── */}
        {wpOpen && (
          <div className="waypoints-section">
            <div className="waypoints-title"><Route size={14}/> จุดผ่านเส้นทาง & สภาพอากาศ</div>
            {loading ? (
              <div className="waypoints-loading">
                <div className="loading-dots"><span/><span/><span/></div>
                <span>กำลังโหลดข้อมูลสภาพอากาศ...</span>
              </div>
            ) : waypoints.length > 0 ? (
              <div className="waypoints-list">
                {waypoints.map((wp, i) => {
                  const isFirst = i === 0, isLast = i === waypoints.length - 1;
                  const w = wp.weather;
                  return (
                    <div key={i} className="waypoint-item">
                      <div className="wp-track">
                        <div className={`wp-dot ${isFirst?'origin':isLast?'dest':'mid'}`}/>
                        {!isLast && <div className="wp-connector"/>}
                      </div>
                      <div className="wp-content">
                        <span className="wp-name">{wp.name || '—'}</span>
                        {w ? (
                          <div className="wp-weather" style={{ color: weatherColor(w.main) }}>
                            <span className="wp-emoji">{weatherEmoji(w.main)}</span>
                            <span className="wp-condition">{w.description}</span>
                            <span className="wp-temp"><Thermometer size={11}/>{w.temp}°C</span>
                            <span className="wp-hum"><Droplets size={11}/>{w.humidity}%</span>
                            {w.windSpeed != null && <span className="wp-wind"><Wind size={11}/>{w.windSpeed}m/s</span>}
                            {w.isForecast && w.forecastTime && (
                              <span className="wp-forecast-badge"><Calendar size={11}/>{w.forecastTime}</span>
                            )}
                          </div>
                        ) : <span className="wp-no-weather">ไม่มีข้อมูลสภาพอากาศ</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="waypoints-empty">ไม่พบจุดผ่าน</p>}
          </div>
        )}

        {/* ── Fuel Calculator ── */}
        {fuelOpen && (
          <div className="fuel-section">
            <div className="fuel-inputs">
              <label>
                <span>น้ำหนักบรรทุก</span>
                <div className="input-row">
                  <input type="range" min={1} max={40} value={weight} onChange={e => setWeight(+e.target.value)}/>
                  <span className="val">{weight} t</span>
                </div>
              </label>
              <label>
                <span>อัตราสิ้นเปลืองน้ำมัน</span>
                <div className="input-row">
                  <input type="range" min={10} max={60} value={efficiency} onChange={e => setEfficiency(+e.target.value)}/>
                  <span className="val">{efficiency} L/100km</span>
                </div>
              </label>
              <label>
                <span>ราคาดีเซล</span>
                <div className="input-row">
                  <input type="range" min={20} max={60} value={fuelPrice} onChange={e => setFuelPrice(+e.target.value)}/>
                  <span className="val">฿{fuelPrice}/L</span>
                </div>
              </label>
            </div>
            <div className="fuel-results">
              <div className="fuel-result-card">
                <div className="fr-value">{totalFuel.toFixed(1)} L</div>
                <div className="fr-label">น้ำมันรวม</div>
              </div>
              <div className="fuel-result-card highlight">
                <div className="fr-value">฿{totalCost.toLocaleString('th-TH', {maximumFractionDigits:0})}</div>
                <div className="fr-label">ค่าใช้จ่ายโดยประมาณ</div>
              </div>
              <div className="fuel-result-card co2">
                <div className="fr-value">{co2.toFixed(1)} kg</div>
                <div className="fr-label">CO₂ ที่ปล่อย</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Dashboard Page ───────────────────────────────────────
const Dashboard = ({ shipments, user }) => {
  const totalDist = shipments.reduce((s, sh) => s + parseFloat(sh.distance || 0), 0).toFixed(1);
  const safeCount = shipments.filter(s => s.isSafe).length;

  return (
    <div className="dashboard-page">
      <div className="dash-header">
        <div className="dash-header-left">
          <Package size={32}/>
          <div>
            <h1>แดชบอร์ดรถขนส่ง</h1>
            <p>ยินดีต้อนรับ, <strong>{user?.username || 'ผู้ใช้'}</strong> — ภาพรวมการขนส่งแบบเรียลไทม์</p>
          </div>
        </div>
      </div>

      <div className="dash-stats-row">
        <div className="dash-stat-card"><div className="stat-value">{shipments.length}</div><div className="stat-label">รถทั้งหมด</div></div>
        <div className="dash-stat-card safe"><div className="stat-value">{safeCount}</div><div className="stat-label">เส้นทางปลอดภัย</div></div>
        <div className="dash-stat-card danger"><div className="stat-value">{shipments.length - safeCount}</div><div className="stat-label">แจ้งเตือนพายุ</div></div>
        <div className="dash-stat-card"><div className="stat-value">{totalDist} km</div><div className="stat-label">ระยะทางรวม</div></div>
      </div>

      <div className="dash-section-title"><Truck size={20}/> รายการขนส่งทั้งหมด</div>

      {shipments.length === 0 ? (
        <div className="dash-empty"><Truck size={64}/><h3>ยังไม่มีรายการขนส่ง</h3><p>ไปที่แต็บการขนส่งเพื่อวางแผนเส้นทาง</p></div>
      ) : (
        <div className="trucks-grid">
          {shipments.map(ship => <TruckCard key={ship.id} ship={ship}/>)}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
