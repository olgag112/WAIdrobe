// FOR GLOBAL VARIABLES
import React, { createContext, useState, useContext, ReactNode } from "react";


// structure of the Weather data type
interface Weather {
  temperature: string;
  rain_chance: string;
  wind_speed: string;
  feels_like: string;
  season: string;
}

// structure of the Clothing item data type
interface WardrobeItem {
  type: string;
  color: string;
  material: string;
  size: string;
  season: string;
  style: string;
  favorite: number;
  special_property: string;
  category: string | null;
  image_url: string | null;
  id: string | null;
}

// structure of the User data type
interface User {
  user_id: number | null;
  password: string | null;
  name: string | null;
  surname: string | null;
}

// structure of App Context data type (list of all global variables)
interface AppContextType {
  date: Date;
  setDate: React.Dispatch<React.SetStateAction<Date>>;
  city: string;
  setCity: React.Dispatch<React.SetStateAction<string>>;
  forecastData: any[];
  setForecastData: React.Dispatch<React.SetStateAction<any[]>>;
  weather: Weather;
  setWeather: React.Dispatch<React.SetStateAction<Weather>>;
  wardrobe: WardrobeItem[];
  setWardrobe: React.Dispatch<React.SetStateAction<WardrobeItem[]>>;
  newItem: WardrobeItem;
  setNewItem: React.Dispatch<React.SetStateAction<WardrobeItem>>;
  recommendations: any[];
  setRecommendations: React.Dispatch<React.SetStateAction<any[]>>;
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  image: any | null;
  setImage: React.Dispatch<React.SetStateAction<any | null>>;
}

// creating context
export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {

  // weather-related variables
  const [date, setDate] = useState(new Date());
  const [city, setCity] = useState<string>("");
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [weather, setWeather] = useState<Weather>({
    temperature: '',
    rain_chance: '',
    wind_speed: '',
    feels_like: '',
    season: 'Summer'
  });

  // Wardrobe-related variables
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
  const [image, setImage] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<WardrobeItem>({
    type: 'T-shirt', 
    color: 'White', 
    material: 'Cotton', 
    size: 'M', 
    season: 'Summer', 
    style: 'Casual', 
    favorite: 0, 
    special_property: 'None', 
    category: null,
    image_url: null,
    id: null
  });
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // user-related variables
  const [user, setUser] = useState<User>({
    user_id: null,
    password: null,
    name: null,
    surname: null
  });

  return (
    <AppContext.Provider
      value={{
        date, setDate,
        city, setCity,
        forecastData, setForecastData,
        weather, setWeather,
        wardrobe, setWardrobe,
        newItem, setNewItem,
        recommendations, setRecommendations,
        user, setUser,
        image, setImage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};