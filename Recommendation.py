# recommender.py
import pandas as pd
import numpy as np
import argparse
from sklearn.metrics.pairwise import cosine_similarity
from DataGenerator import TOP_TYPES, BOTTOM_TYPES

class OutfitPairRecommender:
    def __init__(self, df, rule_weight=0.5):
        self.df = df.copy()
        self.rule_weight = rule_weight
        feats = pd.get_dummies(self.df[['type','color','material','season','style','special_property']])
        self.feature_cols = feats.columns
        self.df = pd.concat([self.df, feats], axis=1)

    def color_compat(self, c1, c2):
        if c1 == c2: return 1.0
        pairs = {('Czarny','Biały'),('Biały','Czarny'),('Niebieski','Szary'),('Szary','Niebieski')}
        return 0.75 if (c1,c2) in pairs else 0.3

    def rule_score(self, row, weather):
        score = 0
        t, r, w = weather['temperature'], weather['rain_chance'], weather['wind_speed']
        # temperature
        if t<5 and row['season'] in ['Zima','Wiosna/Jesień']: score+=2
        elif t<10 and row['season'] in ['Zima','Wiosna/Jesień']: score+=1
        if t>25 and row['season']=='Lato': score+=2
        elif t>20 and row['season'] in ['Lato','Całoroczne']: score+=1
        # rain
        if r>50 and row['type'] in ['Kurtka','Płaszcz']: score+=2
        if r>20 and row['material'] in ['Poliester','Skóra']: score+=1
        # wind
        if w>20 and row['type'] in ['Kurtka','Bluza']: score+=1
        # special props
        prop=row['special_property']
        if t<5 and prop=='Ocieplane': score+=1.5
        if r>50 and prop=='Przeciwdeszczowe': score+=1.5
        if w>20 and prop=='Przeciwwiatrowe': score+=1.0
        if r>30 and prop=='Szybkoschnące': score+=1.0
        if prop=='Oddychające': score+=1.0
        if prop=='Niekrępujące ruchu': score+=0.5
        if row['favorite']==1: score+=0.5
        return score

    def recommend_pairs(self, user_id, weather, top_k=5):
        user = self.df[self.df['user_id']==user_id]
        tops = user[user['type'].isin(TOP_TYPES)]
        bottoms = user[user['type'].isin(BOTTOM_TYPES)]
        # weather vector
        vec=[1 if c==f'season_{weather["season"]}' else 0 for c in self.feature_cols]
        # precompute
        for df_ in (tops,bottoms):
            df_['rule']=df_.apply(lambda r:self.rule_score(r,weather),axis=1)
            df_['content']=cosine_similarity(df_[self.feature_cols],[vec]).flatten()
        # combine
        pairs=[]
        for _,t in tops.iterrows():
            for _,b in bottoms.iterrows():
                cs=self.color_compat(t['color'],b['color'])
                rule=t['rule']+b['rule']+cs
                cont=(t['content']+b['content'])/2
                total=self.rule_weight*rule+(1-self.rule_weight)*cont
                pairs.append((t['item_id'],t['type'],b['item_id'],b['type'],total))
        # sort and return
        pairs=sorted(pairs,key=lambda x:x[4],reverse=True)[:top_k]
        return pairs


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

    def color_match_score(self, color):
        """
        Evaluate color compatibility. Returns a score between 0 and 1.
        Can be expanded to use color wheels, palettes, etc.
        """
        compatible_colors = {
            'Czarny': ['Biały', 'Szary', 'Czerwony', 'Złoty'],
            'Biały': ['Czarny', 'Niebieski', 'Czerwony', 'Beżowy'],
            'Niebieski': ['Biały', 'Szary', 'Beżowy'],
            'Czerwony': ['Czarny', 'Biały'],
            'Zielony': ['Beżowy', 'Brązowy', 'Biały'],
            'Szary': ['Czarny', 'Biały', 'Niebieski'],
        }
        base_colors = self.df['color'].unique()
        counts = self.df['color'].value_counts()

        main_color = counts.idxmax()

        if color == main_color:
            return 1.0, ""
        elif color in compatible_colors.get(main_color, []):
            return 0.75, ""
        else:
            feedback = (
                f"Kolor '{color}' może słabo pasować do koloru '{main_color}'"
            )
            return 0.3, feedback


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

        color_score, color_feedback = self.color_match_score(row['color'])
        score += color_score
        row['color_feedback'] = color_feedback

        return score, color_feedback

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

        scores_feedbacks = user_items.apply(lambda r: self.rule_score(r, weather), axis=1)
        user_items['rule_score'] = scores_feedbacks.apply(lambda x: x[0])
        user_items['color_feedback'] = scores_feedbacks.apply(lambda x: x[1])

        # Combined score
        user_items['score'] = (
            self.rule_weight * user_items['rule_score'] +
            (1 - self.rule_weight) * user_items['content_score']
        )

        return user_items.sort_values('score', ascending=False).head(top_k)


def main():
    p=argparse.ArgumentParser()
    p.add_argument('--input',required=True)
    p.add_argument('--user-id',type=int,required=True)
    p.add_argument('--rule-weight',type=float,default=0.5)
    p.add_argument('--top-k',type=int,default=5)
    p.add_argument('--temperature',type=float,required=True)
    p.add_argument('--rain',type=float,default=0)
    p.add_argument('--wind',type=float,default=0)
    p.add_argument('--season',choices=['Lato','Zima','Całoroczne','Wiosna/Jesień'],required=True)
    args=p.parse_args()
    df=pd.read_csv(args.input)
    rec=OutfitPairRecommender(df,rule_weight=args.rule_weight)
    weather={'temperature':args.temperature,'rain_chance':args.rain,'wind_speed':args.wind,'season':args.season}
    pairs=rec.recommend_pairs(args.user_id,weather,top_k=args.top_k)
    # Pretty print
    if not pairs:
        print("Brak wystarczających ubrań, by stworzyć komplet.")
    else:
        # minimum score to show users recommendations
        threshold = 1.5
        # if all the suggested outfits are below threshold (1.5), it won't show any recommendations
        if all(score < threshold for _, _, _, _, score in pairs):
            print("Nie znaleziono dobrze dopasowanych kompletów.\n" \
            "Rozważ dodanie więcej ubrań do swojej garderoby.\n" \
            "Jesli nie masz juz nic do dodania, zalecane jest pojscie na zakupy :)")

        else:
            for i,(tid,tname,bid,bname,sc) in enumerate(pairs,1):
                print(f"Komplet {i}: Góra -> [ID {tid}: {tname}], Dół -> [ID {bid}: {bname}] (score: {sc:.2f})")

if __name__=='__main__':
    main()
