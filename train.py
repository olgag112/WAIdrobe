import torch
from torch.utils.data import DataLoader
from dataset import FashionDataset
from model import RecommenderNet

# Parametry
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.001

def custom_collate_fn(batch):
    cats, nums, labels, user_ids, weathers = zip(*batch)

    return (
        torch.stack(cats),
        torch.stack(nums),
        torch.stack(labels),
        list(user_ids),
        list(weathers)
    )


# Dataset
dataset = FashionDataset("training_dataset.csv")
dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, collate_fn=custom_collate_fn)

# Rozmiary embeddingów
cat_dims = [len(enc.classes_) for enc in dataset.encoders.values()]
emb_dims = [min(50, (dim + 1) // 2) for dim in cat_dims]  # heuristic

# Model
model = RecommenderNet(cat_dims, emb_dims, num_input_dim=5)
optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE)
criterion = torch.nn.MSELoss()

# Trening
for epoch in range(EPOCHS):
    total_loss = 0
    for cat, num, label, user_ids, weather_params in dataloader:
        optimizer.zero_grad()
        preds = model(cat, num)
        loss = criterion(preds, label)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {total_loss:.4f}")


print("\nPrzykładowe przewidywania:")
model.eval()
with torch.no_grad():
    for i, (cat, num, label, user_ids, weather_params) in enumerate(dataloader):
        preds = model(cat, num)
        for j in range(5):
            print(
                f"User: {user_ids[j]}, Weather: {weather_params[j]}, Predicted score: {preds[j].item()}, True score: {label[j].item()}")
        break
