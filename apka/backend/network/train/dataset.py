import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import torch
from torch.utils.data import Dataset

class FashionDataset(Dataset):
    def __init__(self, csv_file):
        self.df = pd.read_csv(csv_file)
        self.original = self.df.copy()

        # Removed 'season' and 'top_season'/'bottom_season'
        self.cat_features = [
            'top_type', 'top_color', 'top_material', 'top_size',
            'top_style', 'top_special_property',
            'outer_type', 'outer_color', 'outer_material', 'outer_size', 'outer_style',
            'outer_special_property',
            'bottom_type', 'bottom_color', 'bottom_material', 'bottom_size',
            'bottom_style', 'bottom_special_property'
        ]

        self.encoders = {}
        self.encoded = self.df.copy()

        for col in self.cat_features:
            self.encoded[col] = self.encoded[col].fillna('missing').astype(str)
            le = LabelEncoder()
            le.fit(self.encoded[col])
            self.encoders[col] = le
            self.encoded[col] = le.transform(self.encoded[col])

        # numeric features (keep temperature, rain, wind, favorites)
        self.numeric = self.df[['temperature', 'rain_chance', 'wind_speed',
                                'top_favorite', 'bottom_favorite', 'outer_favorite', 'has_outer']].values.astype(float)
        self.labels = self.df['score'].values.astype(float)

        # user_id
        self.user_ids = self.df['user_id'].values.astype(int)

        # weather dictionary without season
        self.weather = self.df[['temperature', 'rain_chance', 'wind_speed']].astype(object)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        cat_vals = self.encoded.loc[idx, self.cat_features].astype(np.int64).values
        cat = torch.tensor(cat_vals, dtype=torch.long)
        num = torch.tensor(self.numeric[idx], dtype=torch.float32)
        label = torch.tensor(self.labels[idx], dtype=torch.float32)

        user_id = int(self.user_ids[idx])
        weather_vals = self.weather.iloc[idx].to_dict()  # no season

        return cat, num, label, user_id, weather_vals
