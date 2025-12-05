import { Image } from 'expo-image';
import { Platform, StyleSheet, Button, Text, TextInput, View } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Fonts } from '@/constants/theme';
import { useAppContext } from "../appContext";
import React, { useState } from 'react';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {BACKEND_API, IP} from '../../constants/ip';

// == PAGE THAT SCRAPES THE WEATHER AND GIVES RECOMMENDATIONS TO THE USER ==
// Functions:
// - get a weather (temperature, rain_change, wind_speed) based on the city
// - get recommendations based on user's clothes
// - option to rate suggested outfits
export default function RecommendationPage() {

  // global variables
  const { 
    date, setDate, 
    city, setCity, 
    forecastData, setForecastData, 
    weather, setWeather, 
    wardrobe,
    recommendations, setRecommendations,
    user
  } = useAppContext();

  // local variables
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 7);

  const [show, setShow] = useState(true);
  const [tempScore, setTempScore] = useState([]);

  // set userScore for recommendation
  const handleScoreChange = (idx: number, value: any) => {
    const updated = recommendations.map((rec, i) =>
      i === idx ? { ...rec, userScore: value } : rec
    );
    setRecommendations(updated);
    setTempScore({ ...value, [idx]: null });
  };

  // choose specific date in calendar
  const onChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  // get the weather using Weather API (for specific city for the next 7 days)
  const fetchWeather = async () => {
    try {
      if (!user.user_id) {
        return alert("You can't use this functionality, unless you're logged in");
      }
      const res = await fetch(`${BACKEND_API}/api/weather`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, long_term: true }),
      });
      if (!res.ok) throw new Error("Weather API error");

      const data = await res.json();
      setForecastData(data.forecast);
      // If date is already selected, immediately update weather
      if (date) updateWeatherForDate(date, data.forecast);
    } catch (err) {
      console.error(err);
      alert("This city doesn't exist!");
    }
  };

  // set the weather for the selected day (in the calendar)
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

  // get recommendations from our model using requests to the backend
  const fetchRecommendations = async () => {
    // stop if user isn't logged in
    if (!user.user_id) {
        return alert("You can't use this functionality, unless you're logged in");
      }
    // stop if user doesn't have any clothes
    if (wardrobe.length === 0) {
      return alert('You need to add your clothes first');
    }
    // stop if user doesn't have at least 5 bottom and 5 top items
    if (wardrobe.filter(i => i.category === "top").length < 5 ||
        wardrobe.filter(i => i.category === "bottom").length < 5) {
      return alert('You need min 5 tops and 5 bottoms');
    }
    // stop if user didn't get the weather first
    if (weather.temperature === '' ||
        weather.rain_chance === '' ||
        weather.wind_speed === ''
    ) {
      return alert('You need to add your city first');
    }
    try {
      // format what will be send to the backend
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
      // send request to get recommendations from our model
      const response = await fetch(`${BACKEND_API}/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // for each recommendation add 'userScore' field (set it to null at first)
      if (!response.ok) throw new Error('Server error');
      const data = await response.json();
      const withScores = (data.recommendations || []).map((rec: any) => ({
        values: rec,
        userScore: null
      }));
    setRecommendations(withScores);
    
    } catch (err) {
      console.error(err);
      alert('Błąd podczas pobierania rekomendacji');
    }
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

      {/* Interface for getting and displaying weather data */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{ fontFamily: Fonts.rounded,}}>
          Weather
        </ThemedText>
      </ThemedView>
      {/* Input to type city name */}
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
      {/* Input to pick the date (next 7 days only) */}
      <View>
        {/* For phones */}
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
        {/* For websites */}
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
      {/* button to fetch the weather from backend server */}
      <View style={styles.buttonContainer}>
          <Button
            onPress={fetchWeather}
            title="Submit"
            color="#ffffffff"
            accessibilityLabel="Learn more about this purple button"
          />
        </View>
      {/* Display weather details for selected day */}
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
      ) : null}

      {/* Interface to get and display recommendations */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Reccomendations
        </ThemedText>
      </ThemedView>
      {/* Button to get the recommendation from backend server */}
      <View style={styles.buttonContainer}>
        <Button
          onPress={fetchRecommendations}
          title="Get Recommendations"
          color="#fbfbfbff"
          accessibilityLabel="Learn more about this purple button"
        />
      </View>
      {/* Display recommendations */}
      {recommendations.length > 0 && (
        <View>
          <View>
            {recommendations.map((rec, idx) => {
              const [outerId, topId, bottomId, score] = rec.values;

              const outerItem = wardrobe.find(item => item.id === outerId) || null;
              const topItem = wardrobe.find(item => item.id === topId) || null;
              const bottomItem = wardrobe.find(item => item.id === bottomId) || null;

              return (
                <View
                  key={idx}
                  style={styles.container}
                >
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ fontWeight: 'bold' }}>Outfit {idx + 1}:</Text>
                    <Text>Top: {topItem ? `[ID ${topItem.id}] ${topItem.type}` : 'None'}</Text>
                    <Text>Bottom: {bottomItem ? `[ID ${bottomItem.id}] ${bottomItem.type}` : 'None'}</Text>
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
                  {/* Display score estimated by model and user score */}
                  <Text style={{ marginTop: 8 }}> Score: {score.toFixed(2)} </Text>
                  <View style={styles.score_container}>
                    <Text style={styles.text}> User Score: {rec.userScore ?? "No score yet"} </Text>
                    {/* Allow user to score the outfit */}
                    <View style={styles.inputContainer}>
                      <Text style={styles.label}>Score this outfit (0–10)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="0–10"
                        maxLength={2}
                        value={tempScore[idx] ?? ""}
                        onChangeText={(text) => setTempScore({ ...score, [idx]: text })}
                      />
                      <Button 
                        title="Submit Score" 
                        color="#605139ff"
                        onPress={() => handleScoreChange(idx, tempScore[idx])} 
                      />
                      {/* Allow user to save the outfit */}
                      {/* Not developed yet */}
                      <Button 
                        title="Save the Outfit" 
                        onPress={() => console.log("Saving...")} 
                        color="#605139ff"
                      />
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
  score_container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffffff',
  },
  container: {
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f8f7f4ff',
    borderRadius: 10,   
    backgroundColor: '#ffffffff', 

    // ios shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    // android shadow
    elevation: 5,
  },
  button: {
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "column",
    alignItems: 'center',
    gap: 6,
  },
});
