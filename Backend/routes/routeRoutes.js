import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { getRecommendedRoute } from '../controllers/routeController.js';
import { getWeather } from '../services/weatherService.js';

dotenv.config();
const WEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const router = express.Router();

router.post('/recommend', getRecommendedRoute);

// Current weather proxy
router.get('/weather', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
  const data = await getWeather(parseFloat(lat), parseFloat(lon));
  if (!data) return res.status(503).json({ error: 'Weather unavailable' });
  res.json({
    name: data.name, main: data.weather[0].main,
    description: data.weather[0].description, icon: data.weather[0].icon,
    temp: Math.round(data.main.temp), humidity: data.main.humidity,
    windSpeed: data.wind?.speed, isForecast: false
  });
});

// Forecast weather proxy — picks closest 3-hr slot to the given unix timestamp
router.get('/forecast', async (req, res) => {
  const { lat, lon, timestamp } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
  const targetTs = timestamp ? parseInt(timestamp) : Math.floor(Date.now() / 1000);
  const nowTs   = Math.floor(Date.now() / 1000);
  const maxTs   = nowTs + 5 * 24 * 3600;

  // Outside forecast window → fall back to current weather
  if (targetTs <= nowTs + 1800 || targetTs > maxTs) {
    const data = await getWeather(parseFloat(lat), parseFloat(lon));
    if (!data) return res.status(503).json({ error: 'Weather unavailable' });
    return res.json({
      name: data.name, main: data.weather[0].main,
      description: data.weather[0].description,
      temp: Math.round(data.main.temp), humidity: data.main.humidity,
      windSpeed: data.wind?.speed, isForecast: false, forecastTime: null
    });
  }

  try {
    const r = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: { lat: parseFloat(lat), lon: parseFloat(lon), appid: WEATHER_KEY, units: 'metric' }
    });
    const closest = r.data.list.reduce((a, b) =>
      Math.abs(b.dt - targetTs) < Math.abs(a.dt - targetTs) ? b : a
    );
    res.json({
      name: r.data.city.name, main: closest.weather[0].main,
      description: closest.weather[0].description,
      temp: Math.round(closest.main.temp), humidity: closest.main.humidity,
      windSpeed: closest.wind?.speed, isForecast: true,
      forecastTime: new Date(closest.dt * 1000).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
      })
    });
  } catch { res.status(503).json({ error: 'Forecast unavailable' }); }
});

export default router;
