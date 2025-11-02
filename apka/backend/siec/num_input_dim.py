import pandas as pd

# Load dataset
df = pd.read_csv("training_topOuter2.csv")

# List of numeric columns to use
numeric_cols = ['temperature', 'rain_chance', 'wind_speed',
                'top_favorite', 'bottom_favorite', 'outer_favorite']  # add outer_favorite if present

# Ensure all columns exist
numeric_cols = [c for c in numeric_cols if c in df.columns]

# Determine number of numeric inputs
num_input_dim = len(numeric_cols)
print(f"Number of numeric inputs: {num_input_dim}")
