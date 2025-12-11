import os
import random
import subprocess

#Parameters
INPUT_FILE = "../../raw_data/wardrobe_topOuter.csv"   # wardrobe file
RULE_WEIGHT = 0.6                       
TOP_K = 5                               # Number of recommended outfits per user
USERS_COUNT = 50                      
SCRIPT = "../out/Recommendation.py"     # Main recommendation script

#  Weather ranges
TEMP_RANGE = (-5, 30)  
RAIN_RANGE = (0, 100)  
WIND_RANGE = (0, 30)    

# For each user, we randomly sample weather conditions, build
# a command-line call to the Recommendation.py script, print
# the command, and then execute it using subprocess.
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

    #  Print the command for visibility/debugging 
    print(f"\n=== Generating recommendations for user {user_id} ===")
    print(" ".join(cmd))

    subprocess.run(cmd)
