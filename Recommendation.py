import pandas as pd
import numpy as np
import argparse
from sklearn.metrics.pairwise import cosine_similarity

class EnhancedOutfitRecommender:
    """
    Recommendation engine combining rule-based and content-based filtering.
    """
    def __init__(self, wardrobe_df, rule_weight=0.5):
        self.df = wardrobe_df.copy()
        self.rule_weight = rule_weight
        self.feature_cols = pd.get_dummies(
            self.df[['type', 'color', 'material', 'season', 'style', 'special_property']]#cechy ubran
        ).columns
        self.df = pd.concat([
            self.df,
            pd.get_dummies(
                self.df[['type', 'color', 'material', 'season', 'style', 'special_property']]
            )
        ], axis=1)

    def rule_score(self, row, weather):
        """
        Compute rule-based score given an item row and weather dict.
        Keys in weather: 'temperature', 'rain_chance', 'wind_speed', 'season'.
        """
        score = 0
        temp = weather.get('temperature', 20)
        rain = weather.get('rain_chance', 0)
        wind = weather.get('wind_speed', 0)

        # Temperature rules
        if temp < 5 and row['season'] in ['Zima', 'Wiosna/Jesień']:
            score += 2
        elif temp < 10 and row['season'] in ['Zima', 'Wiosna/Jesień']:
            score += 1
        if temp > 25 and row['season'] == 'Lato':
            score += 2
        elif temp > 20 and row['season'] in ['Lato', 'Całoroczne']:
            score += 1

        # Rain rules
        if rain > 50 and row['type'] in ['Kurtka', 'Płaszcz']:
            score += 2
        if rain > 20 and row['material'] in ['Poliester', 'Skóra']:
            score += 1

        # Wind rules
        if wind > 20 and row['type'] in ['Kurtka', 'Bluza']:
            score += 1

        # Special property rules
        prop = row.get('special_property', '')
        if temp < 5 and prop == 'Ocieplane':
            score += 1.5
        if rain > 50 and prop == 'Przeciwdeszczowe':
            score += 1.5
        if wind > 20 and prop == 'Przeciwwiatrowe':
            score += 1.0
        if rain > 30 and prop == 'Szybkoschnące':
            score += 1.0
        if prop == 'Niwelujące otarcia':
            score += 0.5
        if temp > 20 and prop == 'Oddychające':
            score += 1.0
        if prop == 'Niekrępujące ruchu':
            score += 0.5

        # Favorite boost
        if row.get('favorite', 0) == 1:
            score += 0.5

        return score

    def recommend(self, user_id, weather, top_k=5):
        """
        Recommend top_k items for given user_id and weather profile.
        Returns DataFrame sorted by combined score.
        """
        user_items = self.df[self.df['user_id'] == user_id].copy()
        if user_items.empty:
            raise ValueError(f"No items found for user_id={user_id}")

        # Compute rule-based scores
        user_items['rule_score'] = user_items.apply(
            lambda r: self.rule_score(r, weather), axis=1
        )

        # Build weather feature vector for content-based
        weather_features = {}
        for col in self.feature_cols:
            weather_features[col] = 0
        weather_features[f'season_{weather.get("season")}',] = 1

        weather_vec = np.array([weather_features.get(col, 0) for col in self.feature_cols])
        item_vecs = user_items[self.feature_cols].values
        content_sims = cosine_similarity(item_vecs, [weather_vec]).flatten()
        user_items['content_score'] = content_sims

        # Combined score
        user_items['score'] = (
            self.rule_weight * user_items['rule_score'] +
            (1 - self.rule_weight) * user_items['content_score']
        )

        return user_items.sort_values('score', ascending=False).head(top_k)


def main():
    parser = argparse.ArgumentParser(
        description="Generate outfit recommendations based on weather and wardrobe CSV."
    )
    parser.add_argument("--input", type=str, default="synthetic_wardrobe.csv",
                        help="Path to wardrobe CSV file")
    parser.add_argument("--user-id", type=int, required=True,
                        help="User ID to generate recommendations for")
    parser.add_argument("--rule-weight", type=float, default=0.5,
                        help="Weight for rule-based scoring (0.0-1.0)")
    parser.add_argument("--top-k", type=int, default=5,
                        help="Number of top recommendations to output")
    parser.add_argument("--temperature", type=float, required=True,
                        help="Current temperature in °C")
    parser.add_argument("--rain", type=float, default=0,
                        help="Chance of rain in %")
    parser.add_argument("--wind", type=float, default=0,
                        help="Wind speed in km/h")
    parser.add_argument("--season", type=str, required=True,
                        choices=["Lato", "Zima", "Całoroczne", "Wiosna/Jesień"],
                        help="Current season for encoding")
    args = parser.parse_args()

    df = pd.read_csv(args.input)
    recommender = EnhancedOutfitRecommender(df, rule_weight=args.rule_weight)

    weather = {
        'temperature': args.temperature,
        'rain_chance': args.rain,
        'wind_speed': args.wind,
        'season': args.season
    }

    recommendations = recommender.recommend(
        user_id=args.user_id,
        weather=weather,
        top_k=args.top_k
    )

    print("Top recommendations:")
    print(recommendations[['item_id', 'type', 'special_property', 'rule_score', 'content_score', 'score']])

if __name__ == "__main__":
    main()
