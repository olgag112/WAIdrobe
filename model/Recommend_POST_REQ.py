async function getRecommendations(wardrobe, weather) {
  const response = await fetch("http://localhost:8000/recommend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      wardrobe: wardrobe,
      temperature: weather.temperature,
      rain: weather.rain,
      wind: weather.wind,
      top_k: 5
    }),
  });
  const data = await response.json();
  return data.recommendations;
}

// Usage
const wardrobe = [...]; // your state
const weather = { temperature: 12, rain: 20, wind: 5 };

getRecommendations(wardrobe, weather).then(recs => {
  console.log("Top recommendations:", recs);
});
