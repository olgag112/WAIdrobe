import torch
import torch.nn as nn

    # Neural network for outfit score prediction.
    # Combines:
    #   - Categorical features encoded via embeddings
    #   - Numerical weather + favorite features
    
class RecommenderNet(nn.Module):
    def __init__(self, cat_dims, emb_dims, num_input_dim):
        super().__init__()

        # Embedding layers — one embedding per categorical feature
        # Embeddings are trainable and learned during training
        self.embeddings = nn.ModuleList([
            nn.Embedding(cat_dim, emb_dim) for cat_dim, emb_dim in zip(cat_dims, emb_dims)
        ])

         # Total input size to the MLP:
        #   sum(embedding dims) + numerical feature count
        input_dim = sum(emb_dims) + num_input_dim
        
        self.model = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.ReLU(),  
            nn.Linear(128, 64),  
            nn.ReLU(),
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1)
        )

    def forward(self, cat_data, num_data):
        emb = [emb_layer(cat_data[:, i]) for i, emb_layer in enumerate(self.embeddings)]
        # Concatenate all embeddings, numeric features
        x = torch.cat(emb + [num_data], dim=1)
        return self.model(x).squeeze(1)
