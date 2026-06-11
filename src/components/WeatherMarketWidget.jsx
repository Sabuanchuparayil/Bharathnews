import React from 'react';
import { Cloud, TrendingUp, TrendingDown } from 'lucide-react';

const CITIES = [
  { city: 'Mumbai', temp: '32°C', condition: 'Haze' },
  { city: 'Dubai', temp: '38°C', condition: 'Sunny' },
  { city: 'Delhi', temp: '35°C', condition: 'Clear' },
];

const MARKETS = [
  { name: 'Sensex', value: '73,872', change: '+0.42%', up: true },
  { name: 'Nifty 50', value: '22,456', change: '+0.38%', up: true },
  { name: 'Gold', value: '$2,338', change: '-0.15%', up: false },
];

const WeatherMarketWidget = () => (
  <div className="glass-card-solid rounded-2xl p-5 space-y-5">
    <div>
      <div className="flex items-center space-x-2 mb-3">
        <Cloud className="w-4 h-4 text-accent-sky" />
        <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white">Weather</h3>
      </div>
      <div className="space-y-2">
        {CITIES.map(c => (
          <div key={c.city} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{c.city}</span>
            <div className="text-right">
              <span className="font-medium text-gray-900 dark:text-white">{c.temp}</span>
              <span className="text-xs text-gray-400 ml-2">{c.condition}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
      <div className="flex items-center space-x-2 mb-3">
        <TrendingUp className="w-4 h-4 text-accent-emerald" />
        <h3 className="font-display font-bold text-sm text-gray-900 dark:text-white">Markets</h3>
      </div>
      <div className="space-y-2">
        {MARKETS.map(m => (
          <div key={m.name} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{m.name}</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-white">{m.value}</span>
              <span className={`text-xs flex items-center ${m.up ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {m.up ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default WeatherMarketWidget;
