import torch
from torch.utils.data import DataLoader, random_split
from dataset import FashionDataset
from model import RecommenderNet
import os

# Parameters
BATCH_SIZE = 32
EPOCHS = 10
LEARNING_RATE = 0.001
MODEL_PATH = "model_Adam_128Relu_val_Huber_WD.pth"
VAL_SPLIT = 0.2
WEIGHT_DECAY = 0.0001

# Collate function
def custom_collate_fn(batch):
    cats, nums, labels, user_ids, weathers = zip(*batch)
    return (
        torch.stack(cats),
        torch.stack(nums),
        torch.stack(labels),
        list(user_ids),
        list(weathers)
    )

# Dataset split
dataset = FashionDataset("training.csv")
train_size = int((1 - VAL_SPLIT) * len(dataset))
val_size = len(dataset) - train_size
train_dataset, val_dataset = random_split(dataset, [train_size, val_size])

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, collate_fn=custom_collate_fn)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, collate_fn=custom_collate_fn)

# Model and optimizer
cat_dims = [len(enc.classes_) for enc in dataset.encoders.values()]
emb_dims = [min(50, (dim + 1) // 2) for dim in cat_dims]

model = RecommenderNet(cat_dims, emb_dims, num_input_dim=5)
optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
#criterion = torch.nn.MSELoss()
criterion = torch.nn.HuberLoss()

# --- Load checkpoint if exists ---
if os.path.exists(MODEL_PATH):
    checkpoint = torch.load(MODEL_PATH, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"])
    optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    start_epoch = checkpoint["epoch"] + 1
    print(f"Loaded checkpoint from epoch {checkpoint['epoch']}")
else:
    start_epoch = 0
    print("Starting training from scratch.")

for epoch in range(EPOCHS):  # run only for the new session
    model.train()
    train_loss = 0
    for cat, num, label, _, _ in train_loader:
        optimizer.zero_grad()
        preds = model(cat, num)
        loss = criterion(preds, label)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()
    train_loss /= len(train_loader)

    # Validation
    model.eval()
    val_loss = 0
    with torch.no_grad():
        for cat, num, label, _, _ in val_loader:
            preds = model(cat, num)
            val_loss += criterion(preds, label).item()
    val_loss /= len(val_loader)

    print(f"Epoch {epoch + 1}/{EPOCHS}- Train Loss: {train_loss:.4f} Validation Loss: {val_loss:.4f}")

    # Save updated checkpoint
    torch.save({
        "epoch": start_epoch + epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
    }, MODEL_PATH)

# --- Example predictions ---
print("\nExample predictions:")
model.eval()
with torch.no_grad():
    for i, (cat, num, label, user_ids, weather_params) in enumerate(val_loader):
        preds = model(cat, num)
        for j in range(min(5, len(label))):
            print(
                f"User: {user_ids[j]}, Weather: {weather_params[j]}, "
                f"Predicted: {preds[j].item():.3f}, True: {label[j].item():.3f}"
            )
        break
