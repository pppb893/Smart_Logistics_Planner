import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const WEATHER_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fetches weather for a specific coordinate.
 * @param {number} lat 
 * @param {number} lon 
 */
export const getWeather = async (lat, lon) => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        lat,
        lon,
        appid: WEATHER_KEY,
        units: 'metric',
      },
    });
    console.log(`[Weather Fetch Success] Lat: ${lat}, Lon: ${lon} -> ${response.data.name}`);
    return response.data;
  } catch (error) {
    console.error(`[Weather API Error] Lat: ${lat}, Lon: ${lon} - `, error.response?.data || error.message);
    return null; // Return null if weather fails for a point
  }
};

/**
 * Checks if weather conditions are considered "bad" for driving.
 * @param {object} weatherData 
 */
export const isWeatherBad = (weatherData) => {
  if (!weatherData) return false;

  const main = weatherData.weather[0].main.toLowerCase();
  const description = weatherData.weather[0].description.toLowerCase();
  
  console.log(`[Weather Check] ${weatherData.name}: ${main} (${description})`);

  // Only flag genuinely severe conditions that endanger truck drivers
  const severeConditions = ['thunderstorm', 'tornado', 'squall', 'ash'];
  const extremeRain = description.includes('heavy') || description.includes('extreme');

  return severeConditions.includes(main) || extremeRain;
};
