import csv

input_file = 'training_dataset.csv'
output_file = 'training_no_season.csv'  # or overwrite input_file if you prefer

with open(input_file, mode='r', encoding='utf-8') as infile:
    reader = csv.DictReader(infile)

    # Create a new field list without 'season'
    fields = [f for f in reader.fieldnames if f != 'season']

    with open(output_file, mode='w', newline='', encoding='utf-8') as outfile:
        writer = csv.DictWriter(outfile, fieldnames=fields)
        writer.writeheader()
        for row in reader:
            row.pop('season', None)
            writer.writerow(row)

print(f"'season' column removed. Saved to {output_file}")
