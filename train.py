import torch
from torch.utils.data import DataLoader
from dataset import FashionDataset
from model import RecommenderNet
import os

# Parametry
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.001
MODEL_PATH = "model_save_SGD.pth"

# dostosowywanie danych aby przevchowac w batchu
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
dataset = FashionDataset("training.csv")
dataloader = DataLoader(dataset, batch_size=BATCH_SIZE, shuffle=True, collate_fn=custom_collate_fn)

# Rozmiary embeddingów - kategorie jako liczby modyfikujace sie podczas uczenia
cat_dims = [len(enc.classes_) for enc in dataset.encoders.values()]
emb_dims = [min(50, (dim + 1) // 2) for dim in cat_dims]  # heuristic

# Model
model = RecommenderNet(cat_dims, emb_dims, num_input_dim=5)
optimizer = torch.optim.SGD(model.parameters(), lr=LEARNING_RATE)
#criterion = torch.nn.MSELoss() # funcja straty - regresja, mean squared error
#criterion = torch.nn.L1Loss() # mean absolute error
criterion = torch.nn.HuberLoss() # najbardziej korzystna loss function dla nas

if os.path.exists(MODEL_PATH):
    checkpoint = torch.load(MODEL_PATH, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    start_epoch = checkpoint["epoch"] + 1
    print(f"Loaded checkpoint from epoch {checkpoint['epoch']}")
else:
    start_epoch = 0
    print("Starting training from scratch.")

# Trening
for epoch in range(EPOCHS):
    total_loss = 0
    model.train()
    for cat, num, label, user_ids, weather_params in dataloader:
        optimizer.zero_grad()
        preds = model(cat, num)
        loss = criterion(preds, label)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
    print(f"Epoch {epoch+1}/{EPOCHS}, Loss: {total_loss:.4f}")

    # zapisanie checkpointa
    torch.save({
        "epoch": epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
    }, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")


print("\nPrzykładowe przewidywania:")
model.eval() # tryb ewaluacji
with torch.no_grad():
    for i, (cat, num, label, user_ids, weather_params) in enumerate(dataloader):
        preds = model(cat, num)
        for j in range(5):
            print(
                f"User: {user_ids[j]}, Weather: {weather_params[j]}, Predicted score: {preds[j].item()}, True score: {label[j].item()}")
        break

# predicted score - wynik obliczen sieci - porownanie ze sztywnym wynikiem recommendera