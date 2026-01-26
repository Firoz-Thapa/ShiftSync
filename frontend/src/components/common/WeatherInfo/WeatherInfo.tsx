import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
const DEFAULT_LAT = 60.1699; // Helsinki fallback
const DEFAULT_LON = 24.9384;

export const WeatherInfo: React.FC = () => {
  const [weather, setWeather] = useState<{ temperature: number; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDefaultLocation, setIsDefaultLocation] = useState(false);

  const fetchWeatherData = async (lat: number, lon: number) => {
    if (!API_KEY) {
      throw new Error('Weather API key not configured');
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    const { temp } = response.data.main;
    const { description } = response.data.weather[0];
    return { temperature: temp, description };
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        if (!API_KEY) {
          throw new Error('Weather API key not configured');
        }

        try {
          // Try to get user's location
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });

          const { latitude, longitude } = position.coords;
          const weatherData = await fetchWeatherData(latitude, longitude);
          setWeather(weatherData);
          setIsDefaultLocation(false);
        } catch (locationError) {
          // If location fails, use default location
          console.warn('Could not get user location, using default:', locationError);
          const weatherData = await fetchWeatherData(DEFAULT_LAT, DEFAULT_LON);
          setWeather(weatherData);
          setIsDefaultLocation(true);
          setError(null); // Clear error since we have a fallback
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Unable to fetch weather data.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  if (loading) {
    return <div className="weather-info loading">Loading weather...</div>;
  }

  if (error) {
    return <div className="weather-info error">{error}</div>;
  }

  return (
    <div className="weather-info">
      <span role="img" aria-label="Temperature">🌡️</span>
      <span className="temperature">{weather?.temperature.toFixed(1)}°C</span>
      <span className="description">{weather?.description}</span>
      {isDefaultLocation && <span className="location-note" title="Using default location">📍</span>}
    </div>
  );
};