import React, { useState, useContext } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AppContext } from "../context/AppContext";
import SingleFileUploader from '../components/ui/SingleFileUploader';


function Wardrobe() {
  const { wardrobe, setWardrobe, newItem, setNewItem } = useContext(AppContext);
//   const [wardrobe, setWardrobe] = useState([]);
//   const [newItem, setNewItem] = useState({
//     type: 'T-shirt', color: 'Biały', material: 'Bawełna', size: 'M', season: 'Lato', style: 'Codzienny', favorite: 0, special_property: 'Brak'
//   });

  const addItem = () => {
    setWardrobe([...wardrobe, { ...newItem }]);
  };

  const removeItem = (index) => {
    const copy = [...wardrobe];
    copy.splice(index, 1);
    setWardrobe(copy);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
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
            <SingleFileUploader />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Wardrobe;