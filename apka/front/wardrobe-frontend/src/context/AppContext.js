import React, { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
    // pogoda
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [city, setCity] = useState("");
  const [forecastData, setForecastData] = useState([]);
  const [weather, setWeather] = useState({
    temperature: '',
    rain_chance: '',
    wind_speed: '',
    season: 'Lato'
  });

    // garderoba
  const [wardrobe, setWardrobe] = useState([]);
  const [newItem, setNewItem] = useState({
    type: 'T-shirt', 
    color: 'Biały', 
    material: 'Bawełna', 
    size: 'M', 
    season: 'Lato', 
    style: 'Codzienny', 
    favorite: 0, 
    special_property: 'Brak', 
    category: null,
    image_url: null,
    item_id: null
  });


  const [recommendations, setRecommendations] = useState([]);
  const [outfit, setOutfit] = useState([])
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const [user, setUser] = useState({});

  return (
    <AppContext.Provider
      value={{
        date, setDate,
        city, setCity,
        forecastData, setForecastData,
        wardrobe, setWardrobe,
        recommendations, setRecommendations,
        error, setError,
        loading, setLoading,
        weather, setWeather,
        newItem, setNewItem,
        outfit, setOutfit,
        user,setUser,
        file, setFile
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
