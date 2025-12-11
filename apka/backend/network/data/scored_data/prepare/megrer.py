import pandas as pd

# Load data
rec_df = pd.read_csv("../out/recs_topOuter.csv")
wardrobe_df = pd.read_csv("../../raw_data/wardrobe_topOuter.csv")

# Create separate dataframes for top, bottom, outer
top_df = wardrobe_df.rename(columns=lambda x: "top_" + x if x not in ["user_id", "item_id"] else x)
top_df = top_df.rename(columns={"item_id": "top_id"})

bottom_df = wardrobe_df.rename(columns=lambda x: "bottom_" + x if x not in ["user_id", "item_id"] else x)
bottom_df = bottom_df.rename(columns={"item_id": "bottom_id"})

outer_df = wardrobe_df.rename(columns=lambda x: "outer_" + x if x not in ["user_id", "item_id"] else x)
outer_df = outer_df.rename(columns={"item_id": "outer_id"})

# Merge the recommendation dataframe with all item dataframes
# Left join is used to keep all recommendations, adding item details where available
merged = (
    rec_df
    .merge(top_df, on=["user_id", "top_id"], how="left")
    .merge(bottom_df, on=["user_id", "bottom_id"], how="left")
    .merge(outer_df, on=["user_id", "outer_id"], how="left")
)

merged.to_csv("../out/training_topOuter3.csv", index=False)
print("Saved training_topOuter.csv with outer_* columns added.")
