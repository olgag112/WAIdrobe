import pandas as pd
import random
from faker import Faker

fake = Faker('pl_PL')

# Możliwe style ubierania się i styl dopasowany do wydarzenia
styles = ['Casual', 'Sportowy', 'Elegancki', 'Boho', 'Streetwear']
event_styles = {
    'Spotkanie biznesowe': 'Elegancki',
    'Impreza': 'Streetwear',
    'Wesele': 'Elegancki',
    'Spacer': 'Casual',
    'Siłownia': 'Sportowy',
    'Koncert': 'Boho',
    'Randka': 'Casual',
    'Spotkanie z rodziną': 'Casual'
}
tolerances = ['Niska', 'Typowa', 'Wysoka']

# 1. USERS
users = []
for i in range(1, 6):
    user = {
        'user_id': i,
        'email_or_phone': fake.email(),
        'gender': random.choice(['K', 'M']),
        'age': random.randint(18, 60),
        'preferred_style': random.choice(styles),
        'temperature_tolerance': random.choice(tolerances)  # dodac do rule score
    }
    users.append(user)

users_df = pd.DataFrame(users)
users_df.to_csv('/Users/olgagranecka/Documents/users.csv', index=False)

# 2. EVENTS
events = []
for user in users:
    num_events = random.randint(2, 4)
    for _ in range(num_events):
        event_name = random.choice(list(event_styles.keys()))
        event = {
            'user_id': user['user_id'],
            'event_date': fake.date_between(start_date='today', end_date='+30d'),
            'event_name': event_name,
            'suggested_style': event_styles[event_name]     # dodac godzine, potem mozna sprawdzac jaka bedzie temperatura i np tego,
        }                                                   # zasugerowac okrycie wierzchnie
        events.append(event)

events_df = pd.DataFrame(events)
events_df.to_csv('/Users/olgagranecka/Documents/events.csv', index=False)

print("Pliki 'users.csv' i 'events.csv' zostały wygenerowane.")
