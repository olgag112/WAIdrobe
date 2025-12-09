# The dataset was synthetically generated, based on some rules and results from a survey. 
# It was decided that it would be beneficial to perform a cleaning process of the dataset.

import pandas as pd

df = pd.read_csv("wardrobe_no_season.csv")

TOP_TYPES = ["T-shirt", "Bluza", "Sweter", "Koszula", "Marynarka", "Kurtka", "Płaszcz"]
BOTTOM_TYPES = ["Spodnie", "Szorty", "Spódnica"]
ALL_TYPES = TOP_TYPES + BOTTOM_TYPES + ["Sukienka"]

COLORS = ["Biały", "Czarny", "Niebieski", "Czerwony", "Zielony", "Szary", "Beżowy"]
MATERIALS = ["Bawełna", "Poliester", "Wełna", "Len", "Skóra", "Jeans"]
SIZES = ["XS", "S", "M", "L", "XL", "XXL"]
STYLES = ["Codzienny", "Formalny", "Sportowy", "Wieczorowy"]
SPECIAL = ["Ocieplane", "Przeciwdeszczowe", "Przeciwwiatrowe", "Szybkoschnące",
           "Niwelujące otarcia", "Oddychające", "Niekrępujące ruchu", "Brak"]

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

# Column translation
df["type"] = df["type"].map(translate_type)
df["color"] = df["color"].map(translate_color)
df["material"] = df["material"].map(translate_material)
df["style"] = df["style"].map(translate_style)
df["special_property"] = df["special_property"].map(translate_special)

# Making sure that data reflects real-life features of clothes
def clean_special(row):
    prop = row["special_property"]
    item = row["type"]

    if prop in ["Waterproof", "Windproof"] and item != "Jacket":
        return "None"
    if prop == "Insulated" and item not in ["Sweater", "Sweatshirt", "Coat", "Jacket"]:
        return "None"
    return prop

df["special_property"] = df.apply(clean_special, axis=1)

df.to_csv("wardrobe_no_season_cleaned.csv", index=False)

print("The file was translated and cleaned: 'wardrobe_no_season_cleaned.csv'")
