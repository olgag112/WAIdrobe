// app/app_context.tsx
import React, { createContext, useState, useContext, ReactNode } from "react";

// ---- Types ----

interface Weather {
  temperature: string;
  rain_chance: string;
  wind_speed: string;
  feels_like: string;
  season: string;
}

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

interface User {
  user_id: number | null;
  password: string | null;
  name: string | null;
  surname: string | null;
}

interface AppContextType {
  date: string;
  setDate: React.Dispatch<React.SetStateAction<string>>;
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
  outfit: WardrobeItem[];
  setOutfit: React.Dispatch<React.SetStateAction<WardrobeItem[]>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  file: any;
  setFile: React.Dispatch<React.SetStateAction<any>>;
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  image: any | null;
  setImage: React.Dispatch<React.SetStateAction<any | null>>;
}

// ---- Context ----
export const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // pogoda
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [image, setImage] = useState<string | null>(null);
  const [city, setCity] = useState<string>("");
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [weather, setWeather] = useState<Weather>({
    temperature: '',
    rain_chance: '',
    wind_speed: '',
    feels_like: '',
    season: 'Lato'
  });

  // garderoba
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>([]);
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
  const [outfit, setOutfit] = useState<WardrobeItem[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [file, setFile] = useState<any>(null);
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
        outfit, setOutfit,
        error, setError,
        loading, setLoading,
        file, setFile,
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