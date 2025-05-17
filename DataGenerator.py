# data_generator.py
import pandas as pd
import numpy as np
import argparse

def generate_synthetic_data(num_users, min_items, max_items, seed=42):
    """
    Generates synthetic wardrobe data for a given number of users.
    Returns a DataFrame with columns:
      user_id, item_id, type, color, material, size, season, style,
      favorite, special_property
    """
    np.random.seed(seed)
    types = ["T-shirt", "Bluza", "Sweter", "Koszula", "Marynarka",
             "Sukienka", "Spódnica", "Spodnie", "Szorty", "Kurtka", "Płaszcz"]
    colors = ["Biały", "Czarny", "Niebieski", "Czerwony", "Zielony", "Szary", "Beżowy"]
    materials = ["Bawełna", "Poliester", "Wełna", "Len", "Skóra", "Jeans"]
    sizes = ["XS", "S", "M", "L", "XL", "XXL"]
    seasons = ["Lato", "Zima", "Całoroczne", "Wiosna/Jesień"]
    styles = ["Codzienny", "Formalny", "Sportowy", "Wieczorowy"]
    special = ["Ocieplane", "Przeciwdeszczowe", "Przeciwwiatrowe", "Szybkoschnące",
               "Niwelujące otarcia", "Oddychające", "Niekrępujące ruchu", "Brak"]

    records = []
    item_id = 1
    for user_id in range(1, num_users + 1):
        num_items = np.random.randint(min_items, max_items + 1)
        for _ in range(num_items):
            records.append({
                "user_id": user_id,
                "item_id": item_id,
                "type": np.random.choice(types),
                "color": np.random.choice(colors),
                "material": np.random.choice(materials),
                "size": np.random.choice(sizes),
                "season": np.random.choice(seasons),
                "style": np.random.choice(styles),
                "favorite": np.random.choice([0, 1], p=[0.8, 0.2]),
                "special_property": np.random.choice(special)
            })
            item_id += 1

    df = pd.DataFrame(records)
    return df


def main():
    parser = argparse.ArgumentParser(
        description="Generate synthetic wardrobe data and save to CSV."
    )
    parser.add_argument("--users", type=int, default=50,
                        help="Number of users to simulate")
    parser.add_argument("--min-items", type=int, default=3,
                        help="Minimum items per user")
    parser.add_argument("--max-items", type=int, default=10,
                        help="Maximum items per user")
    parser.add_argument("--seed", type=int, default=42,
                        help="Random seed for reproducibility")
    parser.add_argument("--output", type=str, default="synthetic_wardrobe.csv",
                        help="Output CSV file path")
    args = parser.parse_args()

    df = generate_synthetic_data(
        num_users=args.users,
        min_items=args.min_items,
        max_items=args.max_items,
        seed=args.seed
    )
    df.to_csv(args.output, index=False)
    print(f"Generated {len(df)} items for {args.users} users. Saved to {args.output}.")

if __name__ == "__main__":
    main()