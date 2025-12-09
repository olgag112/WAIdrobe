# While testing the first versions of the model, it was noticable that the flag 'season' brought more problems than solutions,
# when recommending an outfit (eg. shorts had flag winter). It could be resolved in wardrobe_cleaner.py script, but
# we decided that it would be more realistic if the model took only the weather conditions into consideration - seasons, esspecially 
# in Poland, are becoming less predictable each year, so categorizing clothes into for season classes appeared not that accurate anymore.

import csv

input_file = 'training_dataset.csv'     # older versions of files that were used to create training_topOuter_clean.csv
output_file = 'training_no_season.csv'  

with open(input_file, mode='r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)

    fields = [f for f in reader.fieldnames if f != 'season']

    with open(output_file, mode='w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fields)
        writer.writeheader()
        for row in reader:
            row.pop('season', None)
            writer.writerow(row)

print(f"'season' column removed. Saved to {output_file}")
