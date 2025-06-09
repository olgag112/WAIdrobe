import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';

export default function App() {
  const [wardrobe, setWardrobe] = useState([]);
  const [newItem, setNewItem] = useState({
    type: 'T-shirt', color: 'Biały', material: 'Bawełna', size: 'M', season: 'Lato', style: 'Codzienny', favorite: 0, special_property: 'Brak'
  });
  const [weather, setWeather] = useState({ temperature: '', rain_chance: '', wind_speed: '', season: 'Lato' });
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setWardrobe([...wardrobe, { ...newItem }]);
  };

  const removeItem = (index) => {
    const copy = [...wardrobe];
    copy.splice(index, 1);
    setWardrobe(copy);
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
      setRecommendations(data.recommendations || []);
    } catch (err) {
      console.error(err);
      setError('Błąd podczas pobierania rekomendacji');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Card className="max-w-4xl mx-auto shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl">Twoja Garderoba</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Form do dodawania pozycji */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-4">
              <h3 className="text-lg font-semibold mb-2">Dodaj element garderoby</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <Label>Typ</Label>
                  <Select value={newItem.type} onValueChange={val => setNewItem({ ...newItem, type: val })}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="T-shirt">T-shirt</SelectItem>
                      <SelectItem value="Bluza">Bluza</SelectItem>
                      <SelectItem value="Sweter">Sweter</SelectItem>
                      <SelectItem value="Koszula">Koszula</SelectItem>
                      <SelectItem value="Marynarka">Marynarka</SelectItem>
                      <SelectItem value="Kurtka">Kurtka</SelectItem>
                      <SelectItem value="Płaszcz">Płaszcz</SelectItem>
                      <SelectItem value="Spodnie">Spodnie</SelectItem>
                      <SelectItem value="Szorty">Szorty</SelectItem>
                      <SelectItem value="Spódnica">Spódnica</SelectItem>
                      <SelectItem value="Sukienka">Sukienka</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Kolor</Label>
                  <Select value={newItem.color} onValueChange={val => setNewItem({ ...newItem, color: val })}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Biały">Biały</SelectItem>
                      <SelectItem value="Czarny">Czarny</SelectItem>
                      <SelectItem value="Niebieski">Niebieski</SelectItem>
                      <SelectItem value="Czerwony">Czerwony</SelectItem>
                      <SelectItem value="Zielony">Zielony</SelectItem>
                      <SelectItem value="Szary">Szary</SelectItem>
                      <SelectItem value="Beżowy">Beżowy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Materiał</Label>
                  <Select value={newItem.material} onValueChange={val => setNewItem({ ...newItem, material: val })}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bawełna">Bawełna</SelectItem>
                      <SelectItem value="Poliester">Poliester</SelectItem>
                      <SelectItem value="Wełna">Wełna</SelectItem>
                      <SelectItem value="Len">Len</SelectItem>
                      <SelectItem value="Skóra">Skóra</SelectItem>
                      <SelectItem value="Jeans">Jeans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Rozmiar</Label>
                  <Select value={newItem.size} onValueChange={val => setNewItem({ ...newItem, size: val })}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XS">XS</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                      <SelectItem value="XXL">XXL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sezon</Label>
                  <Select value={newItem.season} onValueChange={val => setNewItem({ ...newItem, season: val })}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Lato">Lato</SelectItem>
                      <SelectItem value="Zima">Zima</SelectItem>
                      <SelectItem value="Całoroczne">Całoroczne</SelectItem>
                      <SelectItem value="Wiosna/Jesień">Wiosna/Jesień</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Styl</Label>
                  <Select value={newItem.style} onValueChange={val => setNewItem({ ...newItem, style: val })}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Codzienny">Codzienny</SelectItem>
                      <SelectItem value="Formalny">Formalny</SelectItem>
                      <SelectItem value="Sportowy">Sportowy</SelectItem>
                      <SelectItem value="Wieczorowy">Wieczorowy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ulubione</Label>
                  <Select value={newItem.favorite.toString()} onValueChange={val => setNewItem({ ...newItem, favorite: parseInt(val) })}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Nie</SelectItem>
                      <SelectItem value="1">Tak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Właściwość specjalna</Label>
                  <Select value={newItem.special_property} onValueChange={val => setNewItem({ ...newItem, special_property: val })}>
                    <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ocieplane">Ocieplane</SelectItem>
                      <SelectItem value="Przeciwdeszczowe">Przeciwdeszczowe</SelectItem>
                      <SelectItem value="Przeciwwiatrowe">Przeciwwiatrowe</SelectItem>
                      <SelectItem value="Szybkoschnące">Szybkoschnące</SelectItem>
                      <SelectItem value="Niwelujące otarcia">Niwelujące otarcia</SelectItem>
                      <SelectItem value="Oddychające">Oddychające</SelectItem>
                      <SelectItem value="Niekrępujące ruchu">Niekrępujące ruchu</SelectItem>
                      <SelectItem value="Brak">Brak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="mt-4" onClick={addItem}>Dodaj do garderoby</Button>
            </div>

            {/* Lista dodanych elementów */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-4">
              <h3 className="text-lg font-semibold mb-2">Twoja aktualna garderoba</h3>
              {wardrobe.length === 0 ? (
                <p>Brak dodanych elementów.</p>
              ) : (
                <div className="space-y-2">
                  {wardrobe.map((item, idx) => (
                    <Card key={idx} className="border flex justify-between items-center p-2">
                      <div>
                        <p><strong>{item.type}</strong>, {item.color}, {item.material}, {item.size}, {item.season}, {item.style}, ulubione: {item.favorite ? 'Tak' : 'Nie'}, {item.special_property}</p>
                      </div>
                      <Button size="sm" onClick={() => removeItem(idx)}>Usuń</Button>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Parametry pogodowe */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-6">
              <h3 className="text-lg font-semibold mb-2">Pogoda</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                </div>
              </div>
            </div>

            {/* Przyciski */}
            <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-6 flex space-x-4">
              <Button variant="secondary" onClick={() => alert('Pobierz pogodę z API do zaimplementowania')}>
                Pobierz pogodę z API
              </Button>
              <Button onClick={fetchRecommendations} disabled={loading}>
                {loading ? 'Ładowanie...' : 'Pobierz rekomendacje'}
              </Button>
            </div>
            {error && <p className="text-red-600 col-span-1 sm:col-span-2 lg:col-span-4">{error}</p>}

            {/* Wyświetlanie rekomendacji */}
            {recommendations.length > 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-6">
                <h3 className="text-lg font-semibold mb-2">Rekomendowane komplety</h3>
                <div className="space-y-4">
                  {recommendations.map((rec, idx) => (
                    <Card key={idx} className="border p-4 flex justify-between items-center">
                      <div>
                        <p><strong>Komplet {idx + 1}:</strong></p>
                        <p>Góra: [ID {rec.topId}] {rec.topType}</p>
                        <p>Dół: [ID {rec.bottomId}] {rec.bottomType}</p>
                      </div>
                      <div>
                        <p>Score: {rec.score.toFixed(2)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}