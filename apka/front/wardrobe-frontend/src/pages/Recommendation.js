import React, { useContext, useState} from 'react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { CalendarInput } from '../components/ui/calendar';
import { AppContext } from "../context/AppContext";

function Recommendation() {
  // globalne
  const { 
    date, setDate, 
    city, setCity, 
    forecastData, setForecastData, 
    weather, setWeather, 
    wardrobe,
    recommendations, setRecommendations,
    outfit, setOutfit
 } = useContext(AppContext);

  // lokalne
  const [error, setError] = useState('');
  const [errorCity, setErrorCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({});

  const handleScoreChange = (idx, value) => {
    const updated = recommendations.map((rec, i) =>
      i === idx ? { ...rec, userScore: value } : rec
    );
    setRecommendations(updated);
  };

  const dummy = () => {};


const fetchWeather = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/weather", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, long_term: true }),
      });
      if (!res.ok) throw new Error("Weather API error");

      const data = await res.json();
      setForecastData(data.forecast);
      setErrorCity("");
      // If date is already selected, immediately update weather
      if (date) updateWeatherForDate(date, data.forecast);
    } catch (err) {
      console.error(err);
      setErrorCity("Takie miasto nie istnieje!");
    }
  };

  const updateWeatherForDate = (selectedDate = date, forecast = forecastData) => {
    const todayWeather = forecast.find((f) => f.time === selectedDate);
    if (!todayWeather) {
      setWeather({
        temperature: "",
        feels_like: "",
        wind_speed: "",
        rain_chance: "",
        season: "Lato",
      });
      return;
    }
    setWeather({
      temperature: todayWeather.temperature,
      wind_speed: todayWeather.wind_speed,
      rain_chance: todayWeather.rain_chance,
      season: "Lato",
    });
  };



  const fetchRecommendations = async () => {
    if (wardrobe.length === 0) {
      setError('Dodaj przynajmniej jeden element garderoby.');
      return;
    }
    if (wardrobe.filter(i => ['T-shirt','Bluza','Sweter','Koszula','Marynarka','Kurtka','Płaszcz'].includes(i.type)).length < 5 ||
        wardrobe.filter(i => ['Spodnie','Szorty','Spódnica'].includes(i.type)).length < 5) {
      setError('Potrzebne co najmniej 5 topów i 5 bottomów.');
      return;
    }
    if (!weather.temperature || !weather.rain_chance || !weather.wind_speed) {
      setError('Uzupełnij parametry pogodowe.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const body = {
        items: wardrobe,
        weather: {
          temperature: parseFloat(weather.temperature),
          rain_chance: parseFloat(weather.rain_chance),
          wind_speed: parseFloat(weather.wind_speed),
          season: weather.season
        },
        rule_weight: 0.5,
        top_k: 5
      };
      const response = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      const withScores = (data.recommendations || []).map(rec => ({
        ...rec,
        userScore: null
    }));

    setRecommendations(withScores);
    } catch (err) {
      console.error(err);
      setError('Błąd podczas pobierania rekomendacji');
    }
    setLoading(false);
  };

  return (
    <div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-6">
            <div>
                <h3 className="text-lg font-semibold mb-2">Miasto</h3>
                <Input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-2"
                />
                <Button onClick={() => fetchWeather(city)}>
                    Akceptuj
                </Button>
                {errorCity && <p className="text-red-600 col-span-1 sm:col-span-2 lg:col-span-4">{errorCity}</p>}
            <div>
                <h3 className="text-lg font-semibold mb-2">Na jaki dzien</h3>
                <CalendarInput value={date} onChange={setDate} />
                <Button onClick={() => updateWeatherForDate()}>
                    Pobierz pogodę z API
                </Button>

            </div>
        </div>
        </div>
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-6">
        <h3 className="text-lg font-semibold mb-2">Pogoda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
            <Label>Temperatura (°C)</Label>
            <Input
                type="number"
                value={weather.temperature}
                onChange={e => setWeather({ ...weather, temperature: e.target.value })}
                className="mt-1"
            />
            </div>
            <div>
            <Label>Szansa na deszcz (%)</Label>
            <Input
                type="number"
                value={weather.rain_chance}
                onChange={e => setWeather({ ...weather, rain_chance: e.target.value })}
                className="mt-1"
            />
            </div>
            <div>
            <Label>Prędkość wiatru (km/h)</Label>
            <Input
                type="number"
                value={weather.wind_speed}
                onChange={e => setWeather({ ...weather, wind_speed: e.target.value })}
                className="mt-1"
            />
            </div>
            <div>
            <Label>Sezon</Label>
            <Select value={weather.season} onValueChange={val => setWeather({ ...weather, season: val })}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Zima">Zima</SelectItem>
                <SelectItem value="Całoroczne">Całoroczne</SelectItem>
                <SelectItem value="Wiosna/Jesień">Wiosna/Jesień</SelectItem>
                </SelectContent>
            </Select>
            <Label>Typ wyjscia: </Label>
            <Select value={weather.season} onValueChange={val => setWeather({ ...weather, season: val })}>
                <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                <SelectItem value="Formalny">Formalny</SelectItem>
                <SelectItem value="Casualowy">Casualowy</SelectItem>
                <SelectItem value="Sportowy">Sportowy</SelectItem>
                <SelectItem value="Wieczorowy">Wieczorowy</SelectItem>
                </SelectContent>
            </Select>
            </div>
        </div>

        {/* Buttons */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-6 flex space-x-4">
            <Button onClick={fetchRecommendations} disabled={loading}>
            {loading ? 'Ładowanie...' : 'Pobierz rekomendacje'}
            </Button>
        </div>

        {error && <p className="text-red-600 col-span-1 sm:col-span-2 lg:col-span-4">{error}</p>}

        {/* Display Recommendations */}
        {recommendations.length > 0 && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-6">
            <h3 className="text-lg font-semibold mb-2">Rekomendowane komplety</h3>
            <div className="space-y-4">
                {recommendations.map((rec, idx) => {
                  const topItem = wardrobe.find(item => item.id === rec.topId + 10);
                  const bottomItem = wardrobe.find(item => item.id === rec.bottomId + 10);
                return (
                <Card key={idx} className="border p-4 flex justify-between items-center">
                    <div>
                    <p><strong>Komplet {idx + 1}:</strong></p>
                    <p>Góra: [ID {rec.topId}] {rec.topType}</p>
                    <p>Dół: [ID {rec.bottomId}] {rec.bottomType}</p>
                    {topItem && topItem.image_url && (
                          <img
                            src={topItem.image_url}
                            alt={topItem.type}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          />
                    )}
                    {bottomItem && bottomItem.image_url && (
                          <img
                            src={bottomItem.image_url}
                            alt={bottomItem.type}
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          />
                    )}
                    </div>
                    <div>
                    <p>Score: {rec.score.toFixed(2)}</p>
                    <p>user Score: {rec.userScore}</p>
                    <div className="flex flex-col">
                        <Label>Score this outfit (0-10)</Label>
                        <Input
                            type="number"
                            min="0"
                            max="10"
                            value={score[idx] ?? ''}
                            onChange={(e) =>
                                setScore({ ...score, [idx]: e.target.value })
                            }
                            className="mt-1 w-24"
                            />
                        <Button onClick={() => handleScoreChange(idx, score[idx])} style={{ fontSize: '0.8rem', padding: '0px', margin: '1px' }}>
                            Submit Score
                        </Button>
                        <Button onClick={() => dummy()} style={{ fontSize: '0.8rem', padding: '0px', margin: '1px'}}>
                            Save the outfit
                        </Button>
                    </div>
                    </div>
                </Card>
                )})}
            </div>
            </div>
        )}
        </div>
    </div>
  );
}

export default Recommendation;
