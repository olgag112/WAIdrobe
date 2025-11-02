import { Image } from 'expo-image';
import { Platform, StyleSheet, Alert, Button, Text, TextInput, View, TouchableOpacity } from 'react-native';
import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { useAppContext } from "../appContext";
import React, { useState } from 'react';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {BACKEND_API, IP} from '../../constants/ip';

export default function RecommendationPage() {
    const { 
      // date, setDate, 
      city, setCity, 
      forecastData, setForecastData, 
      weather, setWeather, 
      wardrobe,
      recommendations, setRecommendations,
      outfit, setOutfit,
      user
    } = useAppContext();

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);
  const [date, setDate] = useState(today);
  const [show, setShow] = useState(true);
  const [error, setError] = useState('');
  const [errorCity, setErrorCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState({});

  const handleScoreChange = (idx: number, value: any) => {
    const updated = recommendations.map((rec, i) =>
      i === idx ? { ...rec, userScore: value } : rec
    );
    setRecommendations(updated);
  };

  const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch(`${BACKEND_API}/api/weather`, {
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
      setErrorCity("This city doesn't exist!");
    }
  };

  const updateWeatherForDate = (selectedDate = date, forecast = forecastData) => {
    const todayWeather = forecast.find((f) => f.time === selectedDate.toISOString().split("T")[0]);
    if (!todayWeather) {
      fetchWeather()
    }
    setWeather({
      temperature: todayWeather.temperature,
      wind_speed: todayWeather.wind_speed,
      rain_chance: todayWeather.rain_chance,
      feels_like: todayWeather.feels_like,
      season: "Summer",
    });
  };

  const fetchRecommendations = async () => {
    if (wardrobe.length === 0) {
      setError('You need to add your clothes first');
      return;
    }
    if (wardrobe.filter(i => i.category === "top").length < 5 ||
        wardrobe.filter(i => i.category === "bottom").length < 5) {
      setError('You need min 5 tops and 5 bottoms');
      return;
    }
    if (!weather.temperature || !weather.rain_chance || !weather.wind_speed) {
      setError('You need to add your city first');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const body = {
        wardrobe: wardrobe,
        weather: {
          temperature: parseFloat(weather.temperature),
          rain_chance: parseFloat(weather.rain_chance),
          wind_speed: parseFloat(weather.wind_speed),
          season: weather.season
        },
        user_id: user.user_id
      };
      const response = await fetch(`${BACKEND_API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      const withScores = (data.recommendations || []).map((rec: any) => ({
        values: rec,
        userScore: null
      }));

setRecommendations(withScores);


    setRecommendations(withScores);
    } catch (err) {
      console.error(err);
      setError('Błąd podczas pobierania rekomendacji');
    }
    setLoading(false);
  };
  
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <Image
          source={require('../../assets/images/w.png')}
          style={{ width: '100%', height: 250, resizeMode: 'cover' }}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Weather
        </ThemedText>
      </ThemedView>
      <View>
        <Text style={styles.label}>Your city:</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your city"
          value={city}
          onChangeText={setCity}
          autoCapitalize="none"
          keyboardType="default"
        />
      </View>
      <View>
        {/* For mobile (iOS/Android) */}
        {Platform.OS !== "web" && show && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            minimumDate={today}
            maximumDate={maxDate}
            onChange={onChange}
          />
        )}

        {/* For web */}
        {Platform.OS === "web" && (
          <input
            type="date"
            value={date.toISOString().split("T")[0]}
            min={today.toISOString().split("T")[0]}
            max={maxDate.toISOString().split("T")[0]}
            onChange={(e) => setDate(new Date(e.target.value))}
            style={{
              padding: 10,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#ccc",
            }}
          />
        )}
      </View>
      <View style={styles.buttonContainer}>
          <Button
            onPress={fetchWeather}
            title="Submit"
            color="#ffffffff"
            accessibilityLabel="Learn more about this purple button"
          />
        </View>
      {weather ? (
        <>
        <Text>Date: {date.toISOString().split("T")[0]}</Text>
        <Text>
          Temperature: {weather.temperature}{"\n"}
          Feels like: {weather.feels_like}{"\n"}
          Rain Chance: {weather.rain_chance}{"%\n"}
          Wind Speed: {weather.wind_speed}{"\n"}
        </Text>
        </>
      ):null}
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Reccomendations
        </ThemedText>
      </ThemedView>
      <View style={styles.buttonContainer}>
          <Button
            onPress={fetchRecommendations}
            title="Get Recommendations"
            color="#fbfbfbff"
            accessibilityLabel="Learn more about this purple button"
          />
        </View>
      {error?(error):null}
      {recommendations.length > 0 && (
        <View>
          <Text>Rekomendowane komplety</Text>
          <View>
            {recommendations.map((rec, idx) => {
              const [outerId, topId, bottomId, score] = rec.values;

              const outerItem = wardrobe.find(item => item.id === outerId) || null;
              const topItem = wardrobe.find(item => item.id === topId) || null;
              const bottomItem = wardrobe.find(item => item.id === bottomId) || null;

              return (
                <View
                  key={idx}
                  style={{
                    borderWidth: 1,
                    borderColor: '#ccc',
                    padding: 16,
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold' }}>Komplet {idx + 1}:</Text>
                    <Text>Góra: {topItem ? `[ID ${topItem.id}] ${topItem.type}` : 'Brak'}</Text>
                    <Text>Dół: {bottomItem ? `[ID ${bottomItem.id}] ${bottomItem.type}` : 'Brak'}</Text>
                    {outerItem && (
                      <Text>Outer: [ID {outerItem.id}] {outerItem.type}</Text>
                    )}
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {topItem?.image_url && (
                      <Image
                        source={{ uri: topItem.image_url.replace("localhost", IP) }}
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                      />
                    )}
                    {bottomItem?.image_url && (
                      <Image
                        source={{ uri: bottomItem.image_url.replace("localhost", IP) }}
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                      />
                    )}
                    {outerItem?.image_url && (
                      <Image
                        source={{ uri: outerItem.image_url.replace("localhost", IP) }}
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                      />
                    )}
                  </View>

                  <Text style={{ marginTop: 8 }}>Score: {score.toFixed(2)}</Text>
                  <View style={styles.container}>
                    <Text style={styles.text}>User Score: {rec.userScore ?? "No score yet"}</Text>

                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Score this outfit (0–10)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="0–10"
                        maxLength={2}
                        value={score[idx] ?? ""}
                        onChangeText={(text) => setScore({ ...score, [idx]: text })}
                      />
                      <Button title="Submit Score" onPress={() => handleScoreChange(idx, score[idx])} />
                      <Button title="Save the Outfit" onPress={() => console.log("Saving...")} />
                    </View>
                  </View>

                </View>
              );
            })}
          </View>
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
    borderTopColor: "#000000ff",
    borderBottomWidth: 1
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 5,
  },
  input: {
    width: '90%',
    height: 45,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    width: '90%',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 15,
    backgroundColor: "#575445ff",
    color: "#fff"
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 8,
  },
  confirmButton: {
    backgroundColor: '#22c55e', // green for confirm
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#334155',
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "column",
    gap: 6,
  },
});
