# recommender.py
import os
import pandas as pd
import numpy as np
import argparse
from sklearn.metrics.pairwise import cosine_similarity
from DataGenerator import TOP_TYPES, BOTTOM_TYPES
import csv

class OutfitPairRecommender:
    def __init__(self, df, rule_weight=0.5):
        self.df = df.copy()
        self.rule_weight = rule_weight
        feats = pd.get_dummies(self.df[['type', 'color', 'material', 'style', 'special_property']])
        self.feature_cols = feats.columns
        self.df = pd.concat([self.df, feats], axis=1)

    def color_compat(self, c1, c2):
        if c1 == c2:
            return 1.0
        pairs = {('Black', 'White'), ('White', 'Black'), ('Blue', 'Gray'), ('Gray', 'Blue')}
        return 0.75 if (c1,c2) in pairs else 0.3

    def rule_score(self, row, weather):
        """
        Compute rule-based score given an item row and weather dict.
        Keys in weather: 'temperature', 'rain_chance', 'wind_speed'.
        """
        score = 0.0
        temp = weather.get('temperature', 20)
        rain = weather.get('rain_chance', 0)
        wind = weather.get('wind_speed', 0)

        # --- Temperature rules ---
        if temp < 5:
            score += 2
            if row['material'] in ['Wool', 'Fleece']:
                score += 1
            if row['special_property'] == 'Insulated':
                score += 1.5
        elif temp < 15:
            score += 1
        elif temp > 25:
            if row['material'] in ['Cotton', 'Linen', 'Polyester']:
                score += 1
            if row['special_property'] in ['Breathable', 'Quick-drying']:
                score += 1

        # --- Rain rules ---
        if rain > 70:
            if row['special_property'] == 'Waterproof':
                score += 2
            elif row['material'] in ['Polyester', 'Leather']:
                score += 1
        elif rain > 30:
            if row['special_property'] in ['Quick-drying', 'Waterproof']:
                score += 1

        # --- Wind rules ---
        if wind > 25:
            if row['type'] in ['Jacket', 'Sweatshirt', 'Coat']:
                score += 1
            if row['special_property'] == 'Windproof':
                score += 1.5

        # --- Universal comfort / favorite ---
        if row.get('special_property') == 'Non-restrictive':
            score += 0.5
        if row.get('favorite', 0) == 1:
            score += 0.5

        return round(score, 2)

    def recommend_pairs(self, user_id, weather, top_k=5):
        # Filtrowanie ubrań użytkownika i natychmiastowe tworzenie kopii
        user = self.df[self.df['user_id'] == user_id].copy()
        tops = user[user['type'].isin(TOP_TYPES)].copy()
        bottoms = user[user['type'].isin(BOTTOM_TYPES)].copy()

        # Stworzenie wektora pogodowego dla content-based
       # weather_vec = np.array([1 if c == f'season_{weather["season"]}' else 0 for c in self.feature_cols])

        # Precompute rule i content scores
        for df_ in (tops, bottoms):
            df_['rule'] = df_.apply(lambda r: self.rule_score(r, weather), axis=1)
            if df_.shape[0] > 1 and len(self.feature_cols) > 0:
                sim = cosine_similarity(df_[self.feature_cols])
                df_['content'] = sim.mean(axis=1)
            else:
                df_['content'] = 0.5

        # Tworzenie par
        pairs = []
        for _, t in tops.iterrows():
            for _, b in bottoms.iterrows():
                cs = self.color_compat(t['color'], b['color'])
                rule_score_total = t['rule'] + b['rule'] + cs
                content_score_total = (t['content'] + b['content']) / 2
                total_score = self.rule_weight * rule_score_total + (1 - self.rule_weight) * content_score_total
                pairs.append((t['item_id'], t['type'], b['item_id'], b['type'], total_score))

        # Sortowanie i zwrócenie top_k
        pairs = sorted(pairs, key=lambda x: x[4], reverse=True)[:top_k]
        return pairs


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    parser.add_argument('--user-id', type=int, required=True)
    parser.add_argument('--rule-weight', type=float, default=0.5)
    parser.add_argument('--top-k', type=int, default=5)
    parser.add_argument('--temperature', type=float, required=True)
    parser.add_argument('--rain', type=float, default=0)
    parser.add_argument('--wind', type=float, default=0)
    args = parser.parse_args()

    df = pd.read_csv(args.input)
    rec = OutfitPairRecommender(df, rule_weight=args.rule_weight)
    weather = {
        'temperature': args.temperature,
        'rain_chance': args.rain,
        'wind_speed': args.wind
    }

    pairs = rec.recommend_pairs(args.user_id, weather, top_k=args.top_k)

    if not pairs:
        print("No sufficient clothing items to create an outfit.")
    else:
        threshold = 0.5
        if all(score < threshold for _, _, _, _, score in pairs):
            print("No well-matched outfits found.\n"
                  "Consider adding more items to your wardrobe.\n"
                  "If you already have enough, maybe it’s time to go shopping :)")
        else:
            for i, (tid, tname, bid, bname, sc) in enumerate(pairs, 1):
                print(f"Outfit {i}: Top -> [ID {tid}: {tname}], Bottom -> [ID {bid}: {bname}] (score: {sc:.2f})")

        # Save recommendations to CSV
        output_filename = 'recs.csv'
        file_exists = os.path.exists(output_filename)
        with open(output_filename, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(['user_id', 'temperature', 'rain_chance', 'wind_speed',
                                 'top_id', 'top_name', 'bottom_id', 'bottom_name', 'score'])
            for tid, tname, bid, bname, score in pairs:
                writer.writerow([args.user_id, args.temperature, args.rain, args.wind,
                                 tid, tname, bid, bname, round(score, 2)])

        print(f"\nRecommendations saved to: {output_filename}")


if __name__ == '__main__':
    main()
