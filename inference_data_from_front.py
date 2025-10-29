import torch
import itertools
import pandas as pd
from model import RecommenderNet
from dataset import FashionDataset

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
        # Fill outer with 'missing'
        for col in ["outer_type", "outer_color", "outer_material", "outer_size", "outer_style", "outer_special_property"]:
            record[col] = "missing"

    num_data = torch.tensor([[weather["temperature"], weather["rain"], weather["wind"],
                              row_top["favorite"], row_bottom["favorite"]]], dtype=torch.float32)

    cat_vals = []
    for col in dataset.cat_features:
        le = dataset.encoders[col]
        val = record.get(col, "missing")
        if val not in le.classes_:
            val = "missing"
        cat_vals.append(le.transform([val])[0])

    cat = torch.tensor([cat_vals], dtype=torch.long)
    return cat, num_data


def recommend_outfits(model, dataset, wardrobe_df, weather, top_k=5):
    # tutaj trzeba sie upewnic ze z frontu sciagane sa poprawne nazwy rzeczy
    tops = wardrobe_df[wardrobe_df["type"].str.lower().isin(["Sweater", "Shirt", "T-shirt","Sweatshirt","Blazer"])]
    bottoms = wardrobe_df[wardrobe_df["type"].str.lower().isin(["Skirt", "Trousers", "Shorts"])]
    outers = wardrobe_df[wardrobe_df["type"].str.lower().isin(["Coat","Jacket"])]

    outfit_candidates = []

    temp = weather["temperature"]
    if temp < 18 and not outers.empty:
        combos = itertools.product(outers.iterrows(), tops.iterrows(), bottoms.iterrows())
        for (_, outer), (_, top), (_, bottom) in combos:
            cat, num = prepare_features(top, bottom, outer, weather, dataset)
            with torch.no_grad():
                score = model(cat, num).item()
            outfit_candidates.append({
                "outer_id": outer["item_id"],
                "top_id": top["item_id"],
                "bottom_id": bottom["item_id"],
                "score": score
            })
    else:
        combos = itertools.product(tops.iterrows(), bottoms.iterrows())
        for (_, top), (_, bottom) in combos:
            cat, num = prepare_features(top, bottom, None, weather, dataset)
            with torch.no_grad():
                score = model(cat, num).item()
            outfit_candidates.append({
                "outer_id": None,
                "top_id": top["item_id"],
                "bottom_id": bottom["item_id"],
                "score": score
            })

    recs = sorted(outfit_candidates, key=lambda x: x["score"], reverse=True)[:top_k]

    if not recs:
        print("No suitable outfit recommendations found.")
    else:
        print("\nTop outfit recommendations:")
        for r in recs:
            if r["outer_id"]:
                print(f"Outer {r['outer_id']}, Top {r['top_id']}, Bottom {r['bottom_id']} — Predicted score: {r['score']:.3f}")
            else:
                print(f"Top {r['top_id']}, Bottom {r['bottom_id']} — Predicted score: {r['score']:.3f}")

    return recs
