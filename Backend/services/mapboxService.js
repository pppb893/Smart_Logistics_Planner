import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const BASE_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

/**
 * Fetches directions between two points with alternative routes.
 * @param {string} start - "lng,lat"
 * @param {string} end - "lng,lat"
 */
export const getDirections = async (start, end) => {
  try {
    const url = `${BASE_URL}/${start};${end}?alternatives=true&geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const response = await axios.get(url);
    return response.data.routes;
  } catch (error) {
    console.error('Mapbox API Error:', error.response?.data || error.message);
    throw new Error('Failed to fetch directions from Mapbox');
  }
};
