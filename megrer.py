import pandas as pd

# Wczytaj dane
rec_df = pd.read_csv("recs.csv")  # np. z kolumnami user_id, temperature, ..., top_id, top_name, bottom_id, bottom_name, score
wardrobe_df = pd.read_csv("wardrobe_no_season_cleaned.csv")    # szczegóły ubrań

# Przygotuj dane ubrań jako osobne DataFrame
top_df = wardrobe_df.rename(columns=lambda x: "top_" + x if x not in ["user_id", "item_id"] else x)
top_df = top_df.rename(columns={"item_id": "top_id"})

bottom_df = wardrobe_df.rename(columns=lambda x: "bottom_" + x if x not in ["user_id", "item_id"] else x)
bottom_df = bottom_df.rename(columns={"item_id": "bottom_id"})

# Połącz dane rekomendacji z cechami ubrań
merged = rec_df.merge(top_df, on=["user_id", "top_id"], how="left")
merged = merged.merge(bottom_df, on=["user_id", "bottom_id"], how="left")

# Sprawdź przykładowy rekord
print(merged.head())

# Zapisz gotowy dataset
merged.to_csv("training.csv", index=False)
print("Zapisano gotowy dataset do 'training_dataset.csv'")
