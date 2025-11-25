import torch
import torch.nn as nn

class RecommenderNet(nn.Module):
    def __init__(self, cat_dims, emb_dims, num_input_dim):
        super().__init__()

        # Embedding warstwy, dla kazdej kategorii opsowej tworzy sie maciez ktorej elementy modyfikuja sie podczas uczenia -- na koniec lepsza postac maciezy
        self.embeddings = nn.ModuleList([
            nn.Embedding(cat_dim, emb_dim) for cat_dim, emb_dim in zip(cat_dims, emb_dims)
        ])

        # Wyjściowy wymiar wektora cech - liczba embedingow + liczba kategorii numerycznych
        input_dim = sum(emb_dims) + num_input_dim
        # Prosty MLP
        self.model = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),  # funckcja aktywacji, wprowadza nieliniowosc
            nn.Linear(128, 64),  # new hidden layer
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, cat_data, num_data):
        # tensory embedingowe
        emb = [emb_layer(cat_data[:, i]) for i, emb_layer in enumerate(self.embeddings)]
        # jeden tensor wejsciowy ze wszytskimi embedingami i danymi numerycznymi
        x = torch.cat(emb + [num_data], dim=1)
        return self.model(x).squeeze(1)
