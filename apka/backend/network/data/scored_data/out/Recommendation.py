import os
import sys
import pandas as pd
import numpy as np
import argparse
from sklearn.metrics.pairwise import cosine_similarity
import csv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from data.raw_data.DataGenerator import TOP_TYPES, BOTTOM_TYPES, TOP_OUTER_TYPES

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
        return 0.75 if (c1, c2) in pairs or (c2, c1) in pairs else 0.3

    def rule_score(self, row, weather):
        """Rule-based score given weather conditions."""
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

        # --- Extra bonus for wool outerwear if cold ---
        if temp < 10 and row['type'] in ['Jacket', 'Coat'] and row['material'] == 'Wool':
            score += 2

        return round(score, 2)

    def recommend_pairs(self, user_id, weather, top_k=5):
        user = self.df[self.df['user_id'] == user_id].copy()
        tops = user[user['type'].isin(TOP_TYPES)].copy()
        bottoms = user[user['type'].isin(BOTTOM_TYPES)].copy()
        outers = user[user['type'].isin(TOP_OUTER_TYPES)].copy()

        # Precompute rule + content scores
        for df_ in (tops, bottoms, outers):
            df_['rule'] = df_.apply(lambda r: self.rule_score(r, weather), axis=1)
            if df_.shape[0] > 1 and len(self.feature_cols) > 0:
                sim = cosine_similarity(df_[self.feature_cols])
                df_['content'] = sim.mean(axis=1)
            else:
                df_['content'] = 0.5

        temp = weather.get('temperature', 20)
        outfits = []

        if temp < 15:
            bottoms = bottoms[~bottoms['type'].isin(['Skirt', 'Shorts'])]

        # --- If temperature < 18°C → use 3-part outfit ---
        if temp < 18 and len(outers) > 0:
            for _, outer in outers.iterrows():
                for _, top in tops.iterrows():
                    for _, bottom in bottoms.iterrows():
                        cs = (
                            self.color_compat(outer['color'], top['color'])
                            + self.color_compat(top['color'], bottom['color'])
                        ) / 2
                        rule_score_total = outer['rule'] + top['rule'] + bottom['rule'] + cs
                        content_score_total = (outer['content'] + top['content'] + bottom['content']) / 3
                        total = self.rule_weight * rule_score_total + (1 - self.rule_weight) * content_score_total
                        outfits.append((outer['item_id'], outer['type'],
                                        top['item_id'], top['type'],
                                        bottom['item_id'], bottom['type'],
                                        total))
        else:
            # --- Warm weather → classic top + bottom ---
            for _, top in tops.iterrows():
                for _, bottom in bottoms.iterrows():
                    cs = self.color_compat(top['color'], bottom['color'])
                    rule_score_total = top['rule'] + bottom['rule'] + cs
                    content_score_total = (top['content'] + bottom['content']) / 2
                    total = self.rule_weight * rule_score_total + (1 - self.rule_weight) * content_score_total
                    outfits.append((None, None, top['item_id'], top['type'],
                                    bottom['item_id'], bottom['type'],
                                    total))

        outfits = sorted(outfits, key=lambda x: x[-1], reverse=True)[:top_k]
        return outfits


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

    outfits = rec.recommend_pairs(args.user_id, weather, top_k=args.top_k)

    if not outfits:
        print("No sufficient clothing items to create an outfit.")
    else:
        for i, outfit in enumerate(outfits, 1):
            outer_id, outer_type, top_id, top_type, bottom_id, bottom_type, score = outfit
            if outer_id:
                print(f"Outfit {i}: Outer -> [ID {outer_id}: {outer_type}], "
                      f"Top -> [ID {top_id}: {top_type}], Bottom -> [ID {bottom_id}: {bottom_type}] "
                      f"(score: {score:.2f})")
            else:
                print(f"Outfit {i}: Top -> [ID {top_id}: {top_type}], "
                      f"Bottom -> [ID {bottom_id}: {bottom_type}] "
                      f"(score: {score:.2f})")

        # Save to CSV
        output_filename = 'recs_topOuter.csv'
        file_exists = os.path.exists(output_filename)
        with open(output_filename, mode='a', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(['user_id', 'temperature', 'rain_chance', 'wind_speed',
                                 'outer_id', 'outer_type', 'top_id', 'top_type',
                                 'bottom_id', 'bottom_type', 'score'])
            for row in outfits:
                writer.writerow([args.user_id, args.temperature, args.rain, args.wind] + list(row))

        print(f"\nRecommendations saved to: {output_filename}")


if __name__ == '__main__':
    main()
