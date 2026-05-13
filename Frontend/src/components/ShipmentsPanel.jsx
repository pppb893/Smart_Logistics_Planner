import React, { useState } from 'react';
import { Truck, Navigation, AlertTriangle, ShieldCheck, Plus, Eye, EyeOff, Trash2, ArrowLeft, Play, Pause, FastForward, RotateCcw } from 'lucide-react';
import LocationInput from './LocationInput';
import './ShipmentsPanel.css';

const ShipmentsPanel = ({ 
  shipments = [], 
  onAddShipment, 
  onToggleShipment, 
  onDeleteShipment,
  truckSimStates = {},
  onToggleSimulation,
  onChangeSimSpeed,
  onResetSimulation,
  onClose 
}) => {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [truckPlate, setTruckPlate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stormWarning, setStormWarning] = useState(null); // holds the route data when unsafe

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

      const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
      const res = await fetch(`${apiUrl}/api/routes/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: startStr, end: endStr })
      });

      const data = await res.json();
      if (res.ok && data.recommendedRoute) {
        const route = data.recommendedRoute;
        if (!route.isSafe) {
          // Don't add yet — show storm confirmation screen
          setStormWarning({ route, details: { origin: origin.name, destination: destination.name, truck: truckPlate } });
        } else {
          onAddShipment(route, {
            origin: origin.name,
            destination: destination.name,
            truck: truckPlate
          });
          // Reset form and go back to list
          setOrigin(null);
          setDestination(null);
          setTruckPlate('');
          setView('list');
        }
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
    <div className="shipments-panel glassmorphism wide-panel">
      
      {/* Storm Confirmation Screen */}
      {stormWarning && (
        <>
          <div className="panel-header">
            <h2 style={{ color: '#ff5252' }}><AlertTriangle size={24} /> แจ้งเตือนพายุ</h2>
          </div>
          <div className="panel-content">
            <div className="storm-alert-box">
              <div className="storm-icon">⛈️</div>
              <h3>ไม่พบเส้นทางที่ปลอดภัย</h3>
              <p>เส้นทางทั้งหมดจาก <strong>{stormWarning.details.origin.split(',')[0]}</strong> ไปยัง <strong>{stormWarning.details.destination.split(',')[0]}</strong> ผ่านพื้นที่ที่มีพายุเคลื่อนไหว</p>
              <p className="storm-sub">เส้นทางที่แสดงเป็นตัวเลือกที่เร็วที่สุด แต่ตรวจพบสภาพอากาศเลวร้ายตลอดเส้นทาง ผู้ขับควรระมัดระวังอย่างยิ่ง</p>
            </div>
            <div className="storm-actions">
              <button 
                className="danger-btn"
                onClick={() => {
                  onAddShipment(stormWarning.route, stormWarning.details);
                  setStormWarning(null);
                  setOrigin(null);
                  setDestination(null);
                  setTruckPlate('');
                  setView('list');
                }}
              >
                <AlertTriangle size={16} /> ดำเนินการต่อ
              </button>
              <button 
                className="cancel-btn"
                onClick={() => setStormWarning(null)}
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </>
      )}

      {!stormWarning && view === 'list' && (
        <>
          <div className="panel-header flex-between">
            <h2><Truck size={24} /> รายการขนส่ง</h2>
            <button className="icon-btn action" onClick={() => setView('form')}>
              <Plus size={20} />
            </button>
          </div>

          <div className="panel-content shipments-list">
            {shipments.length === 0 ? (
              <div className="empty-state">
                <Truck size={48} className="empty-icon" />
                <p>ยังไม่มีรายการขนส่ง</p>
                <button className="primary-btn mt-1" onClick={() => setView('form')}>
                  เพิ่มรถประกันคันแรก
                </button>
              </div>
            ) : (
              shipments.map(ship => (
                <div key={ship.id} className="shipment-card glassmorphism">
                  <div className="ship-card-header">
                    <span className="truck-plate">
                      <span className="truck-color-swatch" style={{ background: ship.color }}></span>
                      {ship.truck}
                    </span>
                    <div className="ship-actions">
                      <button 
                        className="icon-btn small" 
                        title={ship.visible ? "ซ่อนบนแผนที่" : "แสดงบนแผนที่"}
                        onClick={() => onToggleShipment(ship.id)}
                      >
                        {ship.visible ? <Eye size={16} /> : <EyeOff size={16} className="dim" />}
                      </button>
                      <button 
                        className="icon-btn small danger" 
                        title="ลบรายการขนส่ง"
                        onClick={() => onDeleteShipment(ship.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="ship-route-info">
                    <div className="route-endpoints">
                      <div className="endpoint"><span className="dot origin"></span> {ship.origin.split(',')[0]}</div>
                      <div className="endpoint"><span className="dot dest"></span> {ship.destination.split(',')[0]}</div>
                    </div>
                    <div className="route-stats">
                      <span>{ship.distance} km</span>
                      <span>•</span>
                      <span>{ship.duration}</span>
                    </div>
                  </div>
                  <div className={`route-safety-badge ${ship.isSafe ? 'safe' : 'danger'}`}>
                    {ship.isSafe ? (
                      <><ShieldCheck size={14} /> สภาพอากาศดี</>
                    ) : (
                      <div className="danger-badge-content">
                        <div className="danger-badge-title"><AlertTriangle size={14} /> ไม่มีเส้นทางที่ปลอดภัย</div>
                        <div className="danger-badge-sub">ทุกเส้นทางผ่านพายุ — ขับด้วยความระมัดระวัง</div>
                      </div>
                    )}
                  </div>
                  <div className="sim-card-controls">
                    <button 
                      className={`icon-btn small sim-play-icon ${truckSimStates[ship.id]?.isPlaying ? 'active' : ''}`}
                      onClick={() => onToggleSimulation(ship.id)}
                      title={truckSimStates[ship.id]?.isPlaying ? "หยุดจำลอง" : "เริ่มจำลอง"}
                    >
                      {truckSimStates[ship.id]?.isPlaying ? <Pause size={16} color="#ff5252"/> : <Play size={16} color="#00e676"/>}
                    </button>
                    <button 
                      className="icon-btn small"
                      onClick={() => onResetSimulation(ship.id)}
                      title="รีเซ็ต"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <div className="sim-speed-select">
                      <FastForward size={14} />
                      <select 
                        value={truckSimStates[ship.id]?.speed || 600} 
                        onChange={(e) => onChangeSimSpeed(ship.id, Number(e.target.value))}
                      >
                        <option value={1}>1x</option>
                        <option value={60}>60x</option>
                        <option value={600}>600x</option>
                        <option value={3600}>3600x</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {!stormWarning && view === 'form' && (
        <>
          <div className="panel-header flex-start">
            <button className="icon-btn mr-2" onClick={() => setView('list')}>
              <ArrowLeft size={20} />
            </button>
            <h2>เส้นทางใหม่</h2>
          </div>

          <div className="panel-content">
            <div className="form-section">
              <label>ทะเบียนรถ</label>
              <input 
                type="text" 
                placeholder="e.g. 1AB-2345" 
                className="glass-input"
                value={truckPlate}
                onChange={(e) => setTruckPlate(e.target.value)}
              />
            </div>

            <div className="form-section">
              <label>ต้นทาง</label>
              <LocationInput 
                placeholder="ค้นหาสถานที่ต้นทาง..." 
                dotClass="origin"
                onLocationSelect={setOrigin}
              />
            </div>

            <div className="form-section">
              <label>ปลายทาง</label>
              <LocationInput 
                placeholder="ค้นหาปลายทาง..." 
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
              {loading ? 'กำลังคำนวณ...' : <><Navigation size={18} /> วางแผนเส้นทางที่ปลอดภัย</>}
            </button>
          </div>
        </>
      )}

    </div>
  );
};

export default ShipmentsPanel;
