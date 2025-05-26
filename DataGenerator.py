# data_generator.py
import pandas as pd
import numpy as np
import argparse

# Define categories for tops and bottoms
TOP_TYPES = ["T-shirt", "Bluza", "Sweter", "Koszula", "Marynarka", "Kurtka", "Płaszcz"]
BOTTOM_TYPES = ["Spodnie", "Szorty", "Spódnica"]
ALL_TYPES = TOP_TYPES + BOTTOM_TYPES + ["Sukienka"]

COLORS = ["Biały", "Czarny", "Niebieski", "Czerwony", "Zielony", "Szary", "Beżowy"]
MATERIALS = ["Bawełna", "Poliester", "Wełna", "Len", "Skóra", "Jeans"]
SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
SEASONS = ["Lato", "Zima", "Całoroczne", "Wiosna/Jesień"]
STYLES = ["Codzienny", "Formalny", "Sportowy", "Wieczorowy"]
SPECIAL = ["Ocieplane", "Przeciwdeszczowe", "Przeciwwiatrowe", "Szybkoschnące",
           "Niwelujące otarcia", "Oddychające", "Niekrępujące ruchu", "Brak"]


def generate_synthetic_data(num_users, min_tops, min_bottoms, min_others, seed=42):
    np.random.seed(seed)
    records = []
    item_id = 1
    for user_id in range(1, num_users + 1):
        # Ensure minimum tops and bottoms
        for _ in range(min_tops):
            records.append(_make_item(user_id, item_id, TOP_TYPES)); item_id += 1
        for _ in range(min_bottoms):
            records.append(_make_item(user_id, item_id, BOTTOM_TYPES)); item_id += 1
        # Optional others
        for _ in range(min_others):
            records.append(_make_item(user_id, item_id, ["Sukienka"])); item_id += 1
        # Extra random items
        extra = np.random.randint(0, min_tops + min_bottoms + 1)
        for _ in range(extra):
            records.append(_make_item(user_id, item_id, ALL_TYPES)); item_id += 1
    return pd.DataFrame(records)


def _make_item(user_id, item_id, choices):
    return {
        "user_id": user_id,
        "item_id": item_id,
        "type": np.random.choice(choices),
        "color": np.random.choice(COLORS),
        "material": np.random.choice(MATERIALS),
        "size": np.random.choice(SIZES),
        "season": np.random.choice(SEASONS),
        "style": np.random.choice(STYLES),
        "favorite": int(np.random.choice([0, 1], p=[0.8, 0.2])),
        "special_property": np.random.choice(SPECIAL)
    }



def main():
    parser = argparse.ArgumentParser(description="Generate wardrobe data with enforced category minimums.")
    parser.add_argument("--users", type=int, default=50, help="Number of users to simulate")
    parser.add_argument("--min-tops", type=int, default=5, help="Minimum tops per user")
    parser.add_argument("--min-bottoms", type=int, default=5, help="Minimum bottoms per user")
    parser.add_argument("--min-others", type=int, default=0, help="Minimum other items (e.g., dresses) per user")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility")
    parser.add_argument("--output", type=str, default="synthetic_wardrobe.csv", help="Output CSV file path")
    args = parser.parse_args()

    df = generate_synthetic_data(
        num_users=args.users,
        min_tops=args.min_tops,
        min_bottoms=args.min_bottoms,
        min_others=args.min_others,
        seed=args.seed
    )
    df.to_csv(args.output, index=False)
    print(f"Generated {len(df)} items for {args.users} users (min {args.min_tops} tops, {args.min_bottoms} bottoms). Saved to {args.output}.")

if __name__ == "__main__":
    main()