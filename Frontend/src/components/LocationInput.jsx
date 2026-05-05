import React, { useState, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import './LocationInput.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const LocationInput = ({ placeholder, dotClass, onLocationSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [wrapperRef]);

  // Fetch predictions when typing
  useEffect(() => {
    const fetchPlaces = async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }
      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
        );
        const data = await response.json();
        setResults(data.features || []);
      } catch (error) {
        console.error('Error fetching Mapbox places:', error);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(() => {
      fetchPlaces();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (feature) => {
    setQuery(feature.place_name);
    setShowDropdown(false);
    onLocationSelect({
      name: feature.place_name,
      coordinates: feature.center // [lng, lat]
    });
  };

  return (
    <div className="location-input-wrapper" ref={wrapperRef}>
      <div className="input-group">
        <span className={`dot ${dotClass}`}></span>
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
            // If user clears input, notify parent
            if (e.target.value === '') {
              onLocationSelect(null);
            }
          }}
          onFocus={() => {
            if (results.length > 0) setShowDropdown(true);
          }}
        />
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="autocomplete-dropdown glassmorphism">
          {results.map((feature) => (
            <li key={feature.id} onClick={() => handleSelect(feature)}>
              <MapPin size={16} className="pin-icon" />
              <span className="place-name">{feature.place_name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationInput;
