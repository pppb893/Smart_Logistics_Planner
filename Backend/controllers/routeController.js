import * as mapboxService from '../services/mapboxService.js';
import * as weatherService from '../services/weatherService.js';

export const getRecommendedRoute = async (req, res) => {
  try {
    const { start, end } = req.body; // Expected format: "lng,lat"

    if (!start || !end) {
      return res.status(400).json({ error: 'Start and end coordinates are required' });
    }

    // 1. Get routes from Mapbox
    const routes = await mapboxService.getDirections(start, end);

    // 2. Evaluate each route
    const evaluatedRoutes = await Promise.all(routes.map(async (route, index) => {
      const coordinates = route.geometry.coordinates;
      
      // Sample 3 points: Start, Middle, End
      const midIndex = Math.floor(coordinates.length / 2);
      const samplePoints = [
        coordinates[0],
        coordinates[midIndex],
        coordinates[coordinates.length - 1]
      ];

      let weatherIssues = [];
      let isSafe = true;

      for (const [lon, lat] of samplePoints) {
        const weather = await weatherService.getWeather(lat, lon);
        if (weatherService.isWeatherBad(weather)) {
          isSafe = false;
          weatherIssues.push({
            location: weather.name,
            condition: weather.weather[0].description
          });
        }
      }

      return {
        id: index,
        duration: route.duration, // in seconds
        distance: route.distance, // in meters
        geometry: route.geometry,
        isSafe: isSafe,
        weatherIssues: weatherIssues,
        summary: `Route via ${route.legs[0].summary || 'Main Road'}`
      };
    }));

    // 3. Sort by Safety first, then by Duration
    const recommended = evaluatedRoutes.sort((a, b) => {
      if (a.isSafe && !b.isSafe) return -1;
      if (!a.isSafe && b.isSafe) return 1;
      return a.duration - b.duration;
    });

    res.json({
      recommendedRoute: recommended[0],
      allOptions: recommended
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
