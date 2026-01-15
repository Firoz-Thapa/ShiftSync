import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

export const WeatherInfo: React.FC = () => {
  const [weather, setWeather] = useState<{ temperature: number; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        const { latitude, longitude } = position.coords;
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
        );

        const { temp } = response.data.main;
        const { description } = response.data.weather[0];
        setWeather({ temperature: temp, description });
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Failed to fetch weather data. Please try again later.');
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
    </div>
  );
};