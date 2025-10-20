How to run:

python Recommendation.py --input synthetic_wardrobe.csv --user-id 1 --rule-weight 0.6 --top-k 5 --temperature 15 --rain 30 --wind 10 --season "Wiosna/Jesień"
python DataGenerator.py --users 50 --min-tops 5 --min-bottoms 5 --min-others 0 --seed 42 --output synthetic_wardrobe.csv

#### Odpalanie frontu
cd WAIdrobe/apka/front/wardrobe-frontend/src/  
npm start

#### Odpalanie backend'u
cd WAIdrobe/apka/backend/  
source venv/bin/activate  
python3 main.py
