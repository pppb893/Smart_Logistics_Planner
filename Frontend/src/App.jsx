import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Package, Navigation, Search, Menu, User, Bell, ChevronDown, LogOut, Settings, Play, Pause, FastForward } from 'lucide-react';
import RegisterModal from './components/RegisterModal';
import ShipmentsPanel from './components/ShipmentsPanel';
import Dashboard from './components/Dashboard';
import './App.css';

const getCoordinateAlongRoute = (coordinates, progress) => {
  if (!coordinates || coordinates.length === 0) return null;
  if (progress <= 0) return coordinates[0];
  if (progress >= 1) return coordinates[coordinates.length - 1];

  let totalDist = 0;
  const segments = [];
  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i+1];
    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const d = Math.sqrt(dx*dx + dy*dy);
    totalDist += d;
    segments.push({ d, accum: totalDist, p1, p2 });
  }

  const targetDist = totalDist * progress;
  for (let i = 0; i < segments.length; i++) {
    if (targetDist <= segments[i].accum || i === segments.length - 1) {
      const prevAccum = i === 0 ? 0 : segments[i-1].accum;
      const p = segments[i].d > 0 ? (targetDist - prevAccum) / segments[i].d : 0;
      const lon = segments[i].p1[0] + (segments[i].p2[0] - segments[i].p1[0]) * p;
      const lat = segments[i].p1[1] + (segments[i].p2[1] - segments[i].p1[1]) * p;
      return [lon, lat];
    }
  }
  return coordinates[coordinates.length - 1];
};

const getRealisticETA = (drivingSecsRemaining, borderCrossingsCount, additionalWaitSecs = 0) => {
  const drivingHrs = drivingSecsRemaining / 3600;
  const restHrs = Math.floor(drivingHrs / 9) * 15;
  const borderHrs = borderCrossingsCount * 18;
  const waitHrs = additionalWaitSecs / 3600;
  const totalHrs = drivingHrs + restHrs + borderHrs + waitHrs;
  
  const d = Math.floor(totalHrs / 24);
  const h = Math.floor(totalHrs % 24);
  
  if (d > 0) return `${d} วัน ${h} ชม.`;
  const m = Math.floor((totalHrs % 1) * 60);
  return `${h > 0 ? h + ' ชม. ' : ''}${m} นาที`;
};

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

  // Simulation State
  const [truckSimStates, setTruckSimStates] = useState({});
  const truckMarkersRef = useRef({});
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);
  const simProgressRef = useRef({});
  const simWaitRef = useRef({});

  // Load shipments from DB when user logs in
  useEffect(() => {
    if (!user) {
      setShipments([]);
      colorIndexRef.current = 0;
      return;
    }
    const token = localStorage.getItem('token');
    const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
    fetch(`${apiUrl}/api/shipments`, {
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
    const distanceKmNum = route.distance / 1000;
    const distanceKm = distanceKmNum.toFixed(1);
    
    // 1. Raw Driving Time from Mapbox
    const baseDurationHrs = route.duration / 3600;
    
    // 2. HOS (Hours of Service): Max 9 hours driving, requires 15 hours rest per day
    const restDays = Math.floor(baseDurationHrs / 9);
    const restTimeHrs = restDays * 15;
    
    // 3. Border / Customs Delays: Use actual border crossings from backend
    const borderCrossings = route.borderCrossings || 0;
    const borderDelayHrs = borderCrossings * 18;

    const totalRealDurationHrs = baseDurationHrs + restTimeHrs + borderDelayHrs;
    
    const realDays = Math.floor(totalRealDurationHrs / 24);
    const realHrs = Math.floor(totalRealDurationHrs % 24);
    
    let durationString = '';
    if (realDays > 0) {
      durationString = `${realDays} วัน ${realHrs} ชม.`;
    } else {
      const durationMins = Math.floor((totalRealDurationHrs % 1) * 60);
      durationString = `${realHrs > 0 ? realHrs + ' ชม. ' : ''}${durationMins} นาที`;
    }

    // Assign next unique color from palette
    const color = TRUCK_COLORS[colorIndexRef.current % TRUCK_COLORS.length];
    colorIndexRef.current += 1;

    const newShipment = {
      id: Date.now().toString(),
      ...details,
      route: route,
      color: color,
      distance: distanceKm,
      duration: durationString,
      borderCrossings: borderCrossings,
      borderProgresses: route.borderProgresses || [],
      isSafe: route.isSafe,
      visible: true
    };

    // Persist to DB
    try {
      const token = localStorage.getItem('token');
      const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
      await fetch(`${apiUrl}/api/shipments`, {
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
    const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
    fetch(`${apiUrl}/api/shipments/${id}/toggle`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error('Failed to toggle shipment:', err));
  };

  const handleDeleteShipment = (id) => {
    setShipments(prev => prev.filter(ship => ship.id !== id));
    
    // Clean up simulation marker if exists
    if (truckMarkersRef.current[id]) {
      truckMarkersRef.current[id].remove();
      delete truckMarkersRef.current[id];
    }
    delete simProgressRef.current[id];

    const token = localStorage.getItem('token');
    const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
    fetch(`${apiUrl}/api/shipments/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    }).catch(err => console.error('Failed to delete shipment:', err));
  };

  const handleToggleSimulation = (id) => {
    setTruckSimStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isPlaying: !prev[id]?.isPlaying,
        speed: prev[id]?.speed || 600
      }
    }));
  };

  const handleChangeSimSpeed = (id, speed) => {
    setTruckSimStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        speed
      }
    }));
  };

  const handleResetSimulation = (id) => {
    setTruckSimStates(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        isPlaying: false
      }
    }));
    simProgressRef.current[id] = 0;
    if (simWaitRef.current) delete simWaitRef.current[id];
    
    if (truckMarkersRef.current[id]) {
      const ship = shipments.find(s => s.id === id);
      if (ship) {
        const coords = ship.route.geometry.coordinates;
        truckMarkersRef.current[id].setLngLat(coords[0]);
        const markerEl = truckMarkersRef.current[id].getElement();
        const etaEl = markerEl.querySelector('.sim-eta');
        const boxEl = markerEl.querySelector('.sim-eta-box');
        if(etaEl && boxEl) {
          etaEl.innerText = 'รอการปล่อยรถ...';
          etaEl.style.color = '#fff';
          boxEl.style.borderColor = 'rgba(255,255,255,0.2)';
        }
      }
    }
  };

  // Real-time Simulation Loop
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const anySimulating = Object.values(truckSimStates).some(s => s.isPlaying);

    if (!anySimulating) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      lastTimeRef.current = null;
      return;
    }

    const animate = (time) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000; // real seconds
      lastTimeRef.current = time;

      shipments.forEach(ship => {
        if (!ship.visible) {
          if (truckMarkersRef.current[ship.id]) {
            truckMarkersRef.current[ship.id].remove();
            delete truckMarkersRef.current[ship.id];
          }
          return;
        }

        const simState = truckSimStates[ship.id] || {};
        if (!simState.isPlaying && simProgressRef.current[ship.id] === undefined) {
           return; // Not playing and hasn't started yet
        }

        if (simProgressRef.current[ship.id] === undefined) {
          simProgressRef.current[ship.id] = 0;
        }

        if (!simWaitRef.current) simWaitRef.current = {};
        if (!simWaitRef.current[ship.id]) {
          simWaitRef.current[ship.id] = { isWaiting: false, waitTimeLeft: 0, clearedBorders: [] };
        }

        let waitState = simWaitRef.current[ship.id];
        let progress = simProgressRef.current[ship.id];
        
        if (simState.isPlaying && progress < 1) {
          const simDt = dt * (simState.speed || 600);
          
          if (waitState.isWaiting) {
             waitState.waitTimeLeft -= simDt;
             if (waitState.waitTimeLeft <= 0) {
                waitState.isWaiting = false;
                waitState.waitTimeLeft = 0;
             }
          } else {
             const prevProgress = progress;
             progress += simDt / ship.route.duration;
             if (progress > 1) progress = 1;

             if (ship.borderCrossings === undefined) {
               const distKm = parseFloat(ship.distance) || (ship.route && ship.route.distance / 1000) || 0;
               ship.borderCrossings = distKm > 500 ? Math.floor(distKm / 800) : 0;
             }

             let activeBorderProgresses = ship.borderProgresses || [];
             if (activeBorderProgresses.length === 0 && ship.borderCrossings > 0) {
               for (let i = 1; i <= ship.borderCrossings; i++) {
                 activeBorderProgresses.push(i / (ship.borderCrossings + 1));
               }
               // Cache it so we don't recalculate every frame
               ship.borderProgresses = activeBorderProgresses;
             }

             if (activeBorderProgresses.length > 0) {
               for (let bp of activeBorderProgresses) {
                 if (prevProgress < bp && progress >= bp && !waitState.clearedBorders.includes(bp)) {
                   progress = bp;
                   waitState.isWaiting = true;
                   waitState.waitTimeLeft = 18 * 3600; // 18 hours in simulated seconds
                   waitState.clearedBorders.push(bp);
                   break;
                 }
               }
             }
             simProgressRef.current[ship.id] = progress;
          }
        }

        const coords = ship.route.geometry.coordinates;
        const currentCoord = getCoordinateAlongRoute(coords, progress);

        if (!truckMarkersRef.current[ship.id]) {
          const el = document.createElement('div');
          el.className = 'sim-truck-marker';
          el.innerHTML = `
            <div class="sim-truck-icon" style="background:${ship.color}">🚚</div>
            <div class="sim-eta-box">
              <span class="sim-plate">${ship.truck}</span>
              <span class="sim-eta">กำลังคำนวณ...</span>
            </div>
          `;
          truckMarkersRef.current[ship.id] = new mapboxgl.Marker({ element: el })
            .setLngLat(currentCoord)
            .addTo(map.current);
        } else {
          truckMarkersRef.current[ship.id].setLngLat(currentCoord);
        }

        if (simState.isPlaying) {
          const markerEl = truckMarkersRef.current[ship.id].getElement();
          const etaEl = markerEl.querySelector('.sim-eta');
          const boxEl = markerEl.querySelector('.sim-eta-box');

          if (progress === 1) {
            etaEl.innerText = '✅ ถึงที่หมายแล้ว';
            etaEl.style.color = '#00e676';
            boxEl.style.borderColor = '#00e676';
          } else {
            const waitState = simWaitRef.current[ship.id] || { isWaiting: false, waitTimeLeft: 0, clearedBorders: [] };
            const drivingSecsRemaining = ship.route.duration * (1 - progress);
            const additionalWaitSecs = waitState.isWaiting ? waitState.waitTimeLeft : 0;
            const remainingBorders = Math.max(0, (ship.borderCrossings || 0) - waitState.clearedBorders.length);
            
            if (waitState.isWaiting) {
              const waitHrs = Math.floor(waitState.waitTimeLeft / 3600);
              const waitMins = Math.floor((waitState.waitTimeLeft % 3600) / 60);
              etaEl.innerHTML = `🛑 รอข้ามด่านชายแดน (${waitHrs} ชม. ${waitMins} นาที)<br/>ETA: ${getRealisticETA(drivingSecsRemaining, remainingBorders, additionalWaitSecs)}`;
              etaEl.style.color = '#ffca28';
              boxEl.style.borderColor = '#ffca28';
            } else if (Math.random() < 0.002 && progress > 0.05 && progress < 0.95) {
              const delayMin = Math.floor(Math.random() * 120) + 60; // 1-2 hours traffic delay
              etaEl.innerHTML = `⚠️ จราจรติดขัด +${delayMin} นาที<br/>ETA: ${getRealisticETA(drivingSecsRemaining, remainingBorders, delayMin * 60)}`;
              etaEl.style.color = '#ff5252';
              boxEl.style.borderColor = '#ff5252';
              
              setTimeout(() => {
                if (etaEl && boxEl) {
                  etaEl.style.color = '#fff';
                  boxEl.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }, 4000);
            } else if (etaEl.style.color !== 'rgb(255, 82, 82)') {
              etaEl.innerText = `ETA: ${getRealisticETA(drivingSecsRemaining, remainingBorders)}`;
            }
          }
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [truckSimStates, shipments]);

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
          <h1>Smart Logistics System</h1>
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
            onAddShipment={handleAddShipment}
            onToggleShipment={handleToggleShipment}
            onDeleteShipment={handleDeleteShipment}
            truckSimStates={truckSimStates}
            onToggleSimulation={handleToggleSimulation}
            onChangeSimSpeed={handleChangeSimSpeed}
            onResetSimulation={handleResetSimulation}
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
