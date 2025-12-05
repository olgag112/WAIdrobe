import torch
import pandas as pd
import itertools
from .train.model import RecommenderNet
from .train.dataset import FashionDataset

def load_model(model_path, dataset_path):
    temp_dataset = FashionDataset(dataset_path)  # To get encoders & dims
    cat_dims = [len(enc.classes_) for enc in temp_dataset.encoders.values()]
    emb_dims = [min(50, (dim + 1) // 2) for dim in cat_dims]
    num_input_dim = temp_dataset.numeric.shape[1]

    model = RecommenderNet(cat_dims, emb_dims, num_input_dim)
    checkpoint = torch.load(model_path, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"], strict=False)
    model.eval()
    return model, temp_dataset

def prepare_features(row_top, row_bottom, row_outer, weather, dataset):

    record = {
        **{f"top_{c}": row_top[c] for c in ["type", "color", "material", "size", "style", "special_property"]},
        **{f"bottom_{c}": row_bottom[c] for c in ["type", "color", "material", "size", "style", "special_property"]},
    }

    if row_outer is not None:
        record.update({
            **{f"outer_{c}": row_outer[c] for c in ["type", "color", "material", "size", "style", "special_property"]}
        })
    else:
        for col in ["outer_type", "outer_color", "outer_material", "outer_size", "outer_style", "outer_special_property"]:
            record[col] = "missing"

    has_outer = 1 if row_outer is not None else 0
    outer_fav = row_outer["favorite"] if row_outer is not None else 0.0

    num_data = torch.tensor([[weather["temperature"], weather["rain"], weather["wind"],
                              row_top["favorite"], row_bottom["favorite"], outer_fav, has_outer]], dtype=torch.float32)

    cat_vals = []
    for col in dataset.cat_features:
        le = dataset.encoders[col]
        val = record.get(col, "missing")
        if val not in le.classes_:
            val = "missing"
        cat_vals.append(le.transform([val])[0])

    cat = torch.tensor([cat_vals], dtype=torch.long)
    return cat, num_data

# tutaj trzeba ogarnac to user_id, czy jesli wychodzi request od konkretnego usera
# to czy faktycznie potrzebujemy to user_id, imo nie ale moze ten react jakos tak dziala
def recommend_outfits(model, dataset, wardrobe_df, user_id, weather, top_k=5):

    wardrobe = wardrobe_df[wardrobe_df["user_id"] == user_id]

    if wardrobe.empty:
        print(f"No wardrobe items found for user {user_id}.")
        return []

    tops = wardrobe[wardrobe["type"].str.lower().isin(["sweater", "shirt", "t-shirt", "sweatshirt", "blazer"])]
    bottoms = wardrobe[wardrobe["type"].str.lower().isin(["skirt", "trousers", "shorts"])]
    outers = wardrobe[wardrobe["type"].str.lower().isin(["coat", "jacket"])]

    if tops.empty or bottoms.empty:
        print(f"No suitable tops or bottoms found for user {user_id}.")
        return []

    outfit_candidates = []

    temp = weather["temperature"]

    if temp < 15:
        bottoms = bottoms[~bottoms['type'].isin(['Skirt', 'Shorts'])]

    if temp < 18 and not outers.empty:
        combos = itertools.product(outers.iterrows(), tops.iterrows(), bottoms.iterrows())
        for (_, outer), (_, top), (_, bottom) in combos:
            cat, num = prepare_features(top, bottom, outer, weather, dataset)
            with torch.no_grad():
                score = model(cat, num).item()
            outfit_candidates.append((outer["item_id"], top["item_id"], bottom["item_id"], score))
    else:
        if temp < 18 and outers.empty:
            print(f"Temperature < 18°C but no outerwear available for user {user_id}. Recommending top-bottom only.")
        combos = itertools.product(tops.iterrows(), bottoms.iterrows())
        for (_, top), (_, bottom) in combos:
            cat, num = prepare_features(top, bottom, None, weather, dataset)
            with torch.no_grad():
                score = model(cat, num).item()
            outfit_candidates.append((None, top["item_id"], bottom["item_id"], score))

    if not outfit_candidates:
        print(f"No outfit combinations could be generated for user {user_id}.")
        return []

    recs = sorted(outfit_candidates, key=lambda x: x[-1], reverse=True)[:top_k]

    print(f"\nTop outfit recommendations for user {user_id}:")
    for outer_id, top_id, bottom_id, score in recs:
        if outer_id:
            print(f"Outer {outer_id}, Top {top_id}, Bottom {bottom_id} — Predicted score: {score:.3f}")
        else:
            print(f"Top {top_id}, Bottom {bottom_id} — Predicted score: {score:.3f}")

    return recs


if __name__ == "__main__":

    model, dataset = load_model("final_version.pth", "data/scored_data/out/training_topOuter_clean.csv")
    wardrobe_df = pd.read_csv("data/scored_data/out/test.csv")

    user_id = 99
    weather = {"temperature": 20.0, "rain": 0.0, "wind": 20.0}

    recommend_outfits(
        model=model,
        dataset=dataset,
        wardrobe_df=wardrobe_df,
        user_id=user_id,
        weather=weather,
        top_k=5
    )
