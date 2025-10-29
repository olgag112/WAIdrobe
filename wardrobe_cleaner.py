import pandas as pd

# === 1. Wczytanie pliku CSV ===
df = pd.read_csv("wardrobe_no_season.csv")

# === 2. Stałe i słowniki tłumaczeń ===

TOP_TYPES = ["T-shirt", "Bluza", "Sweter", "Koszula", "Marynarka", "Kurtka", "Płaszcz"]
BOTTOM_TYPES = ["Spodnie", "Szorty", "Spódnica"]
ALL_TYPES = TOP_TYPES + BOTTOM_TYPES + ["Sukienka"]

COLORS = ["Biały", "Czarny", "Niebieski", "Czerwony", "Zielony", "Szary", "Beżowy"]
MATERIALS = ["Bawełna", "Poliester", "Wełna", "Len", "Skóra", "Jeans"]
SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
STYLES = ["Codzienny", "Formalny", "Sportowy", "Wieczorowy"]
SPECIAL = ["Ocieplane", "Przeciwdeszczowe", "Przeciwwiatrowe", "Szybkoschnące",
           "Niwelujące otarcia", "Oddychające", "Niekrępujące ruchu", "Brak"]

# === 3. Słowniki tłumaczeń ===

translate_type = {
    "T-shirt": "T-shirt",
    "Bluza": "Sweatshirt",
    "Sweter": "Sweater",
    "Koszula": "Shirt",
    "Marynarka": "Blazer",
    "Kurtka": "Jacket",
    "Płaszcz": "Coat",
    "Spodnie": "Trousers",
    "Szorty": "Shorts",
    "Spódnica": "Skirt",
    "Sukienka": "Dress"
}

translate_color = {
    "Biały": "White",
    "Czarny": "Black",
    "Niebieski": "Blue",
    "Czerwony": "Red",
    "Zielony": "Green",
    "Szary": "Gray",
    "Beżowy": "Beige"
}

translate_material = {
    "Bawełna": "Cotton",
    "Poliester": "Polyester",
    "Wełna": "Wool",
    "Len": "Linen",
    "Skóra": "Leather",
    "Jeans": "Denim"
}


translate_style = {
    "Codzienny": "Casual",
    "Formalny": "Formal",
    "Sportowy": "Sporty",
    "Wieczorowy": "Evening"
}

translate_special = {
    "Ocieplane": "Insulated",
    "Przeciwdeszczowe": "Waterproof",
    "Przeciwwiatrowe": "Windproof",
    "Szybkoschnące": "Quick-drying",
    "Niwelujące otarcia": "Anti-chafing",
    "Oddychające": "Breathable",
    "Niekrępujące ruchu": "Non-restrictive",
    "Brak": "None"
}

# === 4. Tłumaczenie kolumn ===
df["type"] = df["type"].map(translate_type)
df["color"] = df["color"].map(translate_color)
df["material"] = df["material"].map(translate_material)
df["style"] = df["style"].map(translate_style)
df["special_property"] = df["special_property"].map(translate_special)

# === 5. Czyszczenie danych wg zasad ===

def clean_special(row):
    prop = row["special_property"]
    item = row["type"]

    if prop in ["Waterproof", "Windproof"] and item != "Jacket":
        return "None"
    if prop == "Insulated" and item not in ["Sweater", "Sweatshirt", "Coat", "Jacket"]:
        return "None"
    return prop

df["special_property"] = df.apply(clean_special, axis=1)

# === 6. Zapis oczyszczonego pliku ===
df.to_csv("wardrobe_no_season_cleaned.csv", index=False)

print("Plik został przetłumaczony i oczyszczony: 'wardrobe_no_season_cleaned.csv'")
