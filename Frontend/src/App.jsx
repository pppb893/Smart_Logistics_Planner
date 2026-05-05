import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Package, Navigation, Search, Menu, User, Bell, ChevronDown, LogOut, Settings } from 'lucide-react';
import RegisterModal from './components/RegisterModal';
import ShipmentsPanel from './components/ShipmentsPanel';
import './App.css';

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [lng, setLng] = useState(100.5018);
  const [lat, setLat] = useState(13.7563);
  const [zoom, setZoom] = useState(5);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('live_map');
  
  // User Authentication State
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  // Weather Radar State
  const [showRadar, setShowRadar] = useState(false);

  const handleRouteFound = (route, details) => {
    if (!map.current) return;

    // Remove existing route if any
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }

    // Add route line
    map.current.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: route.geometry
      }
    });

    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': route.isSafe ? '#00e676' : '#ff5252',
        'line-width': 6,
        'line-opacity': 0.8
      }
    });

    // Fit map to route bounds
    const coordinates = route.geometry.coordinates;
    const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
    for (const coord of coordinates) {
      bounds.extend(coord);
    }
    map.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    
    // Switch back to live map view automatically
    setActiveTab('live_map');
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



  const handleLogout = () => {
    localStorage.removeItem('token');
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
            Live Map
          </a>
          <a 
            href="#" 
            className={activeTab === 'shipments' ? 'active' : ''}
            onClick={(e) => { e.preventDefault(); setActiveTab('shipments'); }}
          >
            Shipments
          </a>
          <a 
            href="#" 
            className={showRadar ? 'active' : ''} 
            onClick={(e) => { e.preventDefault(); setShowRadar(!showRadar); }}
          >
            {showRadar ? 'Hide Radar' : 'Weather Alerts'}
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
                    <span>My Profile</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout-btn" onClick={handleLogout}>
                    <LogOut size={16} />
                    <span>Logout</span>
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
          <ShipmentsPanel 
            onClose={() => setActiveTab('live_map')}
            onRouteFound={handleRouteFound}
          />
        )}

        {/* Weather Legend */}
        {showRadar && (
          <div className="weather-legend">
            <h4>Precipitation Intensity</h4>
            <div className="legend-gradient">
              <div className="color-segment" title="Light Rain (< 2 mm/h)" data-tooltip="Light Rain (< 2 mm/h)"></div>
              <div className="color-segment" title="Moderate Rain (2-10 mm/h)" data-tooltip="Moderate Rain (2-10 mm/h)"></div>
              <div className="color-segment" title="Heavy Rain (10-50 mm/h)" data-tooltip="Heavy Rain (10-50 mm/h)"></div>
              <div className="color-segment" title="Severe Storm (50-100 mm/h)" data-tooltip="Severe Storm (50-100 mm/h)"></div>
              <div className="color-segment" title="Extreme (> 100 mm/h)" data-tooltip="Extreme (> 100 mm/h)"></div>
            </div>
            <div className="legend-labels">
              <span>Light</span>
              <span>Moderate</span>
              <span>Heavy</span>
              <span>Extreme</span>
            </div>
          </div>
        )}
      </div>

      <RegisterModal 
        isOpen={isRegisterOpen} 
        onClose={() => setIsRegisterOpen(false)} 
        onLoginSuccess={(userData) => setUser(userData)}
      />
    </div>
  );
}

export default App;
