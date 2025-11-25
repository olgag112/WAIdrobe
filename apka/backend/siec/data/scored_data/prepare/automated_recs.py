import os
import random
import subprocess

# === Parametry stałe ===
INPUT_FILE = "../../raw_data/wardrobe_topOuter.csv"   # plik z garderobą
RULE_WEIGHT = 0.6                       # stała waga reguł
TOP_K = 5                               # liczba wyników
USERS_COUNT = 50                        # liczba użytkowników
SCRIPT = "../Recommendation.py"            # Twój główny skrypt rekomendacji

# === Zakresy losowych wartości ===
TEMP_RANGE = (-5, 30)   # temperatura od -5 do 30
RAIN_RANGE = (0, 100)   # deszcz od 0 do 100%
WIND_RANGE = (0, 30)    # wiatr od 0 do 30 km/h

# === Generowanie i wykonywanie komend ===
for user_id in range(1, USERS_COUNT + 1):
    temperature = round(random.uniform(*TEMP_RANGE), 1)
    rain = round(random.uniform(*RAIN_RANGE), 1)
    wind = round(random.uniform(*WIND_RANGE), 1)

    cmd = [
        "python3",
        SCRIPT,
        "--input", INPUT_FILE,
        "--user-id", str(user_id),
        "--rule-weight", str(RULE_WEIGHT),
        "--top-k", str(TOP_K),
        "--temperature", str(temperature),
        "--rain", str(rain),
        "--wind", str(wind)
    ]

    # Wydrukuj komendę dla podglądu
    print(f"\n=== Generating recommendations for user {user_id} ===")
    print(" ".join(cmd))

    # Uruchom skrypt rekomendacji
    subprocess.run(cmd)
