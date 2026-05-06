import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Package, Navigation, Search, Menu, User, Bell, ChevronDown, LogOut, Settings } from 'lucide-react';
import RegisterModal from './components/RegisterModal';
import ShipmentsPanel from './components/ShipmentsPanel';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(100.5018);
  const [lat, setLat] = useState(13.7563);
  const [zoom, setZoom] = useState(5);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('live_map');
  
  // User Authentication State — restore from localStorage on refresh
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      // Decode the JWT payload (middle part) without verifying — backend will verify on real calls
      const payload = JSON.parse(atob(token.split('.')[1]));
      // If token is expired, clear it
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        return null;
      }
      // We only have id/email in the token; fetch username from storage if saved
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : { id: payload.id, email: payload.email };
    } catch {
      return null;
    }
  });
  const [showDropdown, setShowDropdown] = useState(false);

  // Weather Radar State
  const [showRadar, setShowRadar] = useState(false);
  // Traffic Layer State
  const [showTraffic, setShowTraffic] = useState(false);

  // Shipments State
  const [shipments, setShipments] = useState([]);
  const addedLayersRef = useRef([]);
  const colorIndexRef = useRef(0);

  // Load shipments from DB when user logs in
  useEffect(() => {
    if (!user) {
      setShipments([]);
      colorIndexRef.current = 0;
      return;
    }
    const token = localStorage.getItem('token');
    fetch('http://localhost:5000/api/shipments', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setShipments(data);
          colorIndexRef.current = data.length;
        }
      })
      .catch(err => console.error('Failed to load shipments:', err));
  }, [user]);

  // Distinct route colors — visible on both light and dark map
  const TRUCK_COLORS = [
    '#4facfe', // sky blue
    '#f6d365', // golden yellow
    '#a18cd1', // soft purple
    '#fd7043', // deep orange
    '#26c6da', // cyan
    '#ef5350', // bright red
    '#66bb6a', // green
    '#ff8a65', // salmon
    '#ba68c8', // lavender
    '#ffca28', // amber
  ];

  // Effect to manage Mapbox route layers when shipments change
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    // 1. Clean up all previously added layers
    addedLayersRef.current.forEach(id => {
      if (map.current.getLayer(`route-storm-${id}`)) map.current.removeLayer(`route-storm-${id}`);
      if (map.current.getLayer(`route-line-${id}`)) map.current.removeLayer(`route-line-${id}`);
      if (map.current.getSource(`route-${id}`)) map.current.removeSource(`route-${id}`);
    });
    addedLayersRef.current = [];

    // 2. Draw all currently visible shipments
    const newAddedLayers = [];
    const allCoordinates = [];

    shipments.forEach(ship => {
      if (!ship.visible) return;

      const sourceId = `route-${ship.id}`;
      const layerId = `route-line-${ship.id}`;
      newAddedLayers.push(ship.id);

      map.current.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: ship.route.geometry }
      });

      // Main route line in the truck's unique color
      map.current.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ship.color,
          'line-width': 6,
          'line-opacity': 0.9
        }
      });

      // Dashed red storm-warning overlay
      if (!ship.isSafe) {
        map.current.addLayer({
          id: `route-storm-${ship.id}`,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#ff5252',
            'line-width': 3,
            'line-opacity': 0.8,
            'line-dasharray': [2, 3]
          }
        });
      }

      // Collect coordinates for bounds fitting
      allCoordinates.push(...ship.route.geometry.coordinates);
    });

    addedLayersRef.current = newAddedLayers;

    // 3. Fit map bounds if there are visible routes
    if (allCoordinates.length > 0) {
      const bounds = new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]);
      for (const coord of allCoordinates) {
        bounds.extend(coord);
      }
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }
  }, [shipments]);

  const handleAddShipment = async (route, details) => {
    const distanceKm = (route.distance / 1000).toFixed(1);
    const durationHrs = Math.floor(route.duration / 3600);
    const durationMins = Math.floor((route.duration % 3600) / 60);

    // Assign next unique color from palette
    const color = TRUCK_COLORS[colorIndexRef.current % TRUCK_COLORS.length];
    colorIndexRef.current += 1;

    const newShipment = {
      id: Date.now().toString(),
      ...details,
      route: route,
      color: color,
      distance: distanceKm,
      duration: `${durationHrs > 0 ? durationHrs + 'h ' : ''}${durationMins}m`,
      isSafe: route.isSafe,
      visible: true
    };

    // Persist to DB
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5000/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newShipment)
      });
    } catch (err) {
      console.error('Failed to save shipment:', err);
    }

    setShipments(prev => [...prev, newShipment]);
  };

  const handleToggleShipment = (id) => {
    setShipments(prev => prev.map(ship => 
      ship.id === id ? { ...ship, visible: !ship.visible } : ship
    ));
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/shipments/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error('Failed to toggle shipment:', err));
  };

  const handleDeleteShipment = (id) => {
    setShipments(prev => prev.filter(ship => ship.id !== id));
    const token = localStorage.getItem('token');
    fetch(`http://localhost:5000/api/shipments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error('Failed to delete shipment:', err));
  };

  useEffect(() => {
    if (map.current) return; // initialize map only once

    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11', // Changed to dark mode!
      center: [lng, lat],
      zoom: zoom
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    map.current.on('move', () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lng, lat, zoom]);

  // Toggle Weather Radar Layer (OpenWeatherMap Static)
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const weatherKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

    if (showRadar) {
      if (!weatherKey) {
        alert('Please add VITE_OPENWEATHER_API_KEY to your Frontend/.env file to see the radar!');
        setShowRadar(false);
        return;
      }
      
      if (!map.current.getSource('weather-radar')) {
        map.current.addSource('weather-radar', {
          type: 'raster',
          tiles: [
            `https://tile.openweathermap.org/map/precipitation_cls/{z}/{x}/{y}.png?appid=${weatherKey}`
          ],
          tileSize: 256
        });
        map.current.addLayer({
          id: 'weather-radar-layer',
          type: 'raster',
          source: 'weather-radar',
          paint: {
            'raster-opacity': 0.85 // Keeps colors bright on the dark map
          }
        });
      }
    } else {
      if (map.current.getLayer('weather-radar-layer')) {
        map.current.removeLayer('weather-radar-layer');
      }
      if (map.current.getSource('weather-radar')) {
        map.current.removeSource('weather-radar');
      }
    }
  }, [showRadar]);

  // Toggle Mapbox Traffic Layer
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    if (showTraffic) {
      if (!map.current.getSource('traffic-source')) {
        map.current.addSource('traffic-source', {
          type: 'vector',
          url: 'mapbox://mapbox.mapbox-traffic-v1'
        });
        map.current.addLayer({
          id: 'traffic-layer',
          type: 'line',
          source: 'traffic-source',
          'source-layer': 'traffic',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-width': 3,
            'line-opacity': 0.85,
            'line-color': [
              'match', ['get', 'congestion'],
              'low',      '#00e676',
              'moderate', '#ffb300',
              'heavy',    '#ff5252',
              'severe',   '#b71c1c',
              '#adb5bd'
            ]
          }
        });
      } else {
        map.current.setLayoutProperty('traffic-layer', 'visibility', 'visible');
      }
    } else {
      if (map.current.getLayer('traffic-layer')) {
        map.current.setLayoutProperty('traffic-layer', 'visibility', 'none');
      }
    }
  }, [showTraffic]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
  };

  return (
    <div className="app-container">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <Package className="icon" size={28} />
          <h1>Smart Logistics</h1>
        </div>
        <div className="top-bar-nav">
          <a 
            href="#" 
            className={activeTab === 'live_map' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setActiveTab('live_map'); }}
          >
            แผนที่สด
          </a>
          <a 
            href="#" 
            className={activeTab === 'shipments' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setActiveTab('shipments'); }}
          >
            การขนส่ง
          </a>
          <a 
            href="#" 
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}
          >
            แดชบอร์ด
          </a>
          <a 
            href="#" 
            className={showRadar ? 'active' : ''} 
            onClick={(e) => { e.preventDefault(); setShowRadar(!showRadar); }}
          >
            {showRadar ? 'ซ่อนเรดาร์' : 'แจ้งเตือนสภาพอากาศ'}
          </a>
          <a 
            href="#" 
            className={showTraffic ? 'active' : ''} 
            onClick={(e) => { e.preventDefault(); setShowTraffic(!showTraffic); }}
          >
            {showTraffic ? 'ซ่อนจราจร' : 'จราจรสด'}
          </a>
        </div>
        <div className="top-bar-right">
          <Bell className="icon-btn" size={20} />
          
          {user ? (
            <div className="user-profile-section">
              <div 
                className="user-info" 
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="username">{user.username}</span>
                <ChevronDown size={16} className={`chevron ${showDropdown ? 'open' : ''}`} />
              </div>
              
              {showDropdown && (
                <div className="profile-dropdown glassmorphism">
                  <div className="dropdown-item">
                    <Settings size={16} />
                    <span>โปรไฟล์ของฉัน</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>ออกจากระบบ</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <User className="icon-btn" size={20} onClick={() => setIsRegisterOpen(true)} />
          )}
        </div>
      </div>

      <div className="main-content">
        {/* Main Map */}
        <div ref={mapContainer} className="map-container" />

        {/* Shipments Panel */}
        {activeTab === 'shipments' && (
          user ? (
            <ShipmentsPanel 
              shipments={shipments}
              onRouteFound={handleAddShipment}
              onToggleShipment={handleToggleShipment}
              onDeleteShipment={handleDeleteShipment}
              onClose={() => setActiveTab('live_map')}
            />
          ) : (
            <div className="shipments-panel glassmorphism login-required-panel">
              <div className="empty-state">
                <User size={48} className="empty-icon" />
                <h3>ต้องเข้าสู่ระบบ</h3>
                <p>กรุณาเข้าสู่ระบบเพื่อจัดการการขนส่งและดูข้อมูลรถทั้งหมด</p>
                <button 
                  className="primary-btn mt-1"
                  onClick={() => setIsRegisterOpen(true)}
                >
                  เข้าสู่ระบบ / สมัครสมาชิก
                </button>
              </div>
            </div>
          )
        )}

        {/* Dashboard Full Page */}
        {activeTab === 'dashboard' && (
          <Dashboard shipments={shipments} user={user} />
        )}

        {/* Weather Legend */}
        {showRadar && (
          <div className="weather-legend">
            <h4>ความเข้มของฝน</h4>
            <div className="legend-gradient">
              <div className="color-segment" title="Light Rain (< 2 mm/h)" data-tooltip="Light Rain (< 2 mm/h)"></div>
              <div className="color-segment" title="Moderate Rain (2-10 mm/h)" data-tooltip="Moderate Rain (2-10 mm/h)"></div>
              <div className="color-segment" title="Heavy Rain (10-50 mm/h)" data-tooltip="Heavy Rain (10-50 mm/h)"></div>
              <div className="color-segment" title="Severe Storm (50-100 mm/h)" data-tooltip="Severe Storm (50-100 mm/h)"></div>
              <div className="color-segment" title="Extreme (> 100 mm/h)" data-tooltip="Extreme (> 100 mm/h)"></div>
            </div>
            <div className="legend-labels">
              <span>เบา</span>
              <span>ปานกลาง</span>
              <span>หนัก</span>
              <span>รุนแรง</span>
            </div>
          </div>
        )}

        {/* Traffic Legend */}
        {showTraffic && (
          <div className="traffic-legend">
            <h4>🚗 ความหนาแน่นของจราจร</h4>
            <div className="traffic-legend-items">
              <span><span className="tl-dot" style={{background:'#00e676'}}/> น้อย</span>
              <span><span className="tl-dot" style={{background:'#ffb300'}}/> ปานกลาง</span>
              <span><span className="tl-dot" style={{background:'#ff5252'}}/> หนาแน่น</span>
              <span><span className="tl-dot" style={{background:'#b71c1c'}}/> หนาแน่นมาก</span>
            </div>
          </div>
        )}
      </div>

      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onLoginSuccess={(userData) => {
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData);
        }}
      />
    </div>
  );
}

export default App;
