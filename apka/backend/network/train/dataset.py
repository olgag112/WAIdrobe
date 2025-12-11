import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import torch
from torch.utils.data import Dataset

    # PyTorch Dataset for training the outfit scoring model.

    # - Loads a CSV file containing top/bottom/outer outfit combinations.
    # - Encodes categorical features with LabelEncoder.
    # - Prepares numerical features such as temperature, rain, favorites, etc.
    # - Provides tensors for model training.
    
class FashionDataset(Dataset):
    def __init__(self, csv_file):
        self.df = pd.read_csv(csv_file)
        self.original = self.df.copy()

        # Categorical features to be encoded
        # These match the columns produced in the training.csv dataset
        # Removed 'season' and 'top_season'/'bottom_season' for substantive matters
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

        # Encoding each categorical column
        for col in self.cat_features:
            # Replace NaNs with "missing" and ensure string dtype
            self.encoded[col] = self.encoded[col].fillna('missing').astype(str)
            le = LabelEncoder()
            le.fit(self.encoded[col])
            self.encoders[col] = le
            # Replace original values with their integer encoding
            self.encoded[col] = le.transform(self.encoded[col])

        # Numeric features (temperature, rain, wind, favorites, has_outer flag)
        self.numeric = self.df[['temperature', 'rain_chance', 'wind_speed',
                                'top_favorite', 'bottom_favorite', 'outer_favorite', 'has_outer']].values.astype(float)
        self.labels = self.df['score'].values.astype(float)

        # User_id
        self.user_ids = self.df['user_id'].values.astype(int)

        # Weather dictionary 
        self.weather = self.df[['temperature', 'rain_chance', 'wind_speed']].astype(object)

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        # Extract encoded categorical tensor
        cat_vals = self.encoded.loc[idx, self.cat_features].astype(np.int64).values
        cat = torch.tensor(cat_vals, dtype=torch.long)
        # Numeric features tensor
        num = torch.tensor(self.numeric[idx], dtype=torch.float32)
        # Regression label (true score)
        label = torch.tensor(self.labels[idx], dtype=torch.float32)

        user_id = int(self.user_ids[idx])
        weather_vals = self.weather.iloc[idx].to_dict()  # no season

        return cat, num, label, user_id, weather_vals
