import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from data_generator import TOP_TYPES, BOTTOM_TYPES

class OutfitPairRecommender:
    def __init__(self, df, rule_weight=0.5):
        self.df = df.copy()
        self.rule_weight = rule_weight
        feats = pd.get_dummies(self.df[['type','color','material','season','style','special_property']])
        self.feature_cols = feats.columns
        self.df = pd.concat([self.df, feats], axis=1)

    def color_compat(self, c1, c2):
        if c1 == c2:
            return 1.0
        pairs = {('Czarny','Biały'),('Biały','Czarny'),('Niebieski','Szary'),('Szary','Niebieski')}
        return 0.75 if (c1,c2) in pairs else 0.3

    def rule_score(self, row, weather):
        score = 0
        t = weather['temperature']
        r = weather['rain_chance']
        w = weather['wind_speed']
        # temperature rules
        if t < 5 and row['season'] in ['Zima','Wiosna/Jesień']:
            score += 2
        elif t < 10 and row['season'] in ['Zima','Wiosna/Jesień']:
            score += 1
        if t > 25 and row['season'] == 'Lato':
            score += 2
        elif t > 20 and row['season'] in ['Lato','Całoroczne']:
            score += 1
        # rain rules
        if r > 50 and row['type'] in ['Kurtka','Płaszcz']:
            score += 2
        if r > 20 and row['material'] in ['Poliester','Skóra']:
            score += 1
        # wind rules
        if w > 20 and row['type'] in ['Kurtka','Bluza']:
            score += 1
        # special properties
        prop = row['special_property']
        if t < 5 and prop == 'Ocieplane': score += 1.5
        if r > 50 and prop == 'Przeciwdeszczowe': score += 1.5
        if w > 20 and prop == 'Przeciwwiatrowe': score += 1.0
        if r > 30 and prop == 'Szybkoschnące': score += 1.0
        if prop == 'Oddychające': score += 1.0
        if prop == 'Niekrępujące ruchu': score += 0.5
        if row['favorite'] == 1:
            score += 0.5
        return score

    def recommend_pairs(self, user_id, weather, top_k=5):
        user = self.df[self.df['user_id'] == user_id]
        tops = user[user['type'].isin(TOP_TYPES)]
        bottoms = user[user['type'].isin(BOTTOM_TYPES)]
        if tops.empty or bottoms.empty:
            return []
        # Create weather feature vector for content-based
        weather_vec = [1 if col == f'season_{weather["season"]}' else 0 for col in self.feature_cols]
        # Precompute scores
        for df_ in (tops, bottoms):
            df_['rule'] = df_.apply(lambda r: self.rule_score(r, weather), axis=1)
            df_['content'] = cosine_similarity(df_[self.feature_cols], [weather_vec]).flatten()
        pairs = []
        for _, t in tops.iterrows():
            for _, b in bottoms.iterrows():
                cs = self.color_compat(t['color'], b['color'])
                rule_sum = t['rule'] + b['rule'] + cs
                content_avg = (t['content'] + b['content']) / 2
                total = self.rule_weight * rule_sum + (1 - self.rule_weight) * content_avg
                pairs.append((t['item_id'], t['type'], b['item_id'], b['type'], total))
        # Sort by score descending
        pairs_sorted = sorted(pairs, key=lambda x: x[4], reverse=True)
        return pairs_sorted[:top_k]