import React, { useState } from 'react';
import { Truck, Navigation, AlertTriangle, ShieldCheck } from 'lucide-react';
import LocationInput from './LocationInput';
import './ShipmentsPanel.css';

const ShipmentsPanel = ({ onClose, onRouteFound }) => {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [truckPlate, setTruckPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePlanRoute = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination.');
      return;
    }
    if (!truckPlate.trim()) {
      setError('Please enter a truck license plate.');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const startStr = `${origin.coordinates[0]},${origin.coordinates[1]}`;
      const endStr = `${destination.coordinates[0]},${destination.coordinates[1]}`;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/routes/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startStr, end: endStr })
      });

      const data = await res.json();
      if (res.ok && data.recommendedRoute) {
        onRouteFound(data.recommendedRoute, {
          origin: origin.name,
          destination: destination.name,
          truck: truckPlate
        });
      } else {
        setError(data.error || 'Failed to calculate route.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error connecting to routing service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shipments-panel glassmorphism">
      <div className="panel-header">
        <h2><Truck size={24} /> New Shipment</h2>
      </div>

      <div className="panel-content">
        <div className="form-section">
          <label>Truck Details</label>
          <input 
            type="text" 
            placeholder="e.g. 1AB-2345" 
            className="glass-input"
            value={truckPlate}
            onChange={(e) => setTruckPlate(e.target.value)}
          />
        </div>

        <div className="form-section">
          <label>Origin</label>
          <LocationInput 
            placeholder="Search starting location..." 
            dotClass="origin"
            onLocationSelect={setOrigin}
          />
        </div>

        <div className="form-section">
          <label>Destination</label>
          <LocationInput 
            placeholder="Search destination..." 
            dotClass="dest"
            onLocationSelect={setDestination}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button 
          className={`primary-btn ${loading ? 'loading' : ''}`}
          onClick={handlePlanRoute}
          disabled={loading}
        >
          {loading ? 'Calculating...' : <><Navigation size={18} /> Plan Safe Route</>}
        </button>
      </div>
    </div>
  );
};

export default ShipmentsPanel;
