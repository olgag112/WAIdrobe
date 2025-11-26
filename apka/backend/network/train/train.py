import torch
from torch.utils.data import DataLoader, random_split
from WAIdrobe.apka.backend.siec.train.dataset import FashionDataset
from WAIdrobe.apka.backend.siec.train.model import RecommenderNet
import os

# Parameters
BATCH_SIZE = 32
EPOCHS = 30
LEARNING_RATE = 0.0005   #for fine tuning, make it 0.0005
MODEL_PATH = "../final30.pth"
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
dataset = FashionDataset("../data/scored_data/out/training_topOuter_clean.csv")
train_size = int((1 - VAL_SPLIT) * len(dataset))
val_size = len(dataset) - train_size
train_dataset, val_dataset = random_split(dataset, [train_size, val_size])

train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, collate_fn=custom_collate_fn)
val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, collate_fn=custom_collate_fn)

# Model and optimizer
cat_dims = [len(enc.classes_) for enc in dataset.encoders.values()]
emb_dims = [min(50, (dim + 1) // 2) for dim in cat_dims]
num_input_dim = 7

model = RecommenderNet(cat_dims, emb_dims, num_input_dim)
optimizer = torch.optim.Adam(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)
criterion = torch.nn.HuberLoss()

# --- Load checkpoint if exists ---
if os.path.exists(MODEL_PATH):
    checkpoint = torch.load(MODEL_PATH, map_location="cpu")
    model.load_state_dict(checkpoint["model_state_dict"], strict=False) #letting the model take in a new dimension
    optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
    start_epoch = checkpoint["epoch"] + 1
    print(f"Loaded checkpoint from epoch {checkpoint['epoch']}")
else:
    start_epoch = 0
    print("Starting training from scratch.")

for param in model.embeddings.parameters():     # saving embeddings
    param.requires_grad = False

for name, param in model.embeddings[0].named_parameters():
    param.requires_grad = True
    
train_losses = []
val_losses = []

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

    train_losses.append(train_loss)
    val_losses.append(val_loss)
    
    print(f"Epoch {epoch + 1}/{EPOCHS}- Train Loss: {train_loss:.4f} Validation Loss: {val_loss:.4f}")

    # Save updated checkpoint
    torch.save({
        "epoch": start_epoch + epoch,
        "model_state_dict": model.state_dict(),
        "optimizer_state_dict": optimizer.state_dict(),
    }, MODEL_PATH)

# --- Plot 1: Training vs validation loss ---
plt.figure(figsize=(8,5))
plt.plot(train_losses, label="Training loss")
plt.plot(val_losses, label="Validation loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.title("Training vs validation loss")
plt.legend()
plt.grid()
plt.show()

# --- Plot 2: Predictions vs true values  ---
all_preds = []
all_true = []

model.eval()
with torch.no_grad():
    for cat, num, label, _, _ in val_loader:
        preds = model(cat, num)
        all_preds.extend(preds.numpy())
        all_true.extend(label.numpy())

plt.figure(figsize=(6,6))
plt.scatter(all_true, all_preds, alpha=0.4)
plt.xlabel("True values")
plt.ylabel("Predicted values")
plt.title("Predicted vs true values")
plt.plot([min(all_true), max(all_true)], [min(all_true), max(all_true)], color="red")  # diagonal line
plt.grid()
plt.show()

# --- Plot 3: Histogram of residuals ---
residuals = [p - t for p, t in zip(all_preds, all_true)]

plt.figure(figsize=(8,5))
plt.hist(residuals, bins=40, edgecolor='black')
plt.title("Distribution of prediction errors")
plt.xlabel("Prediction error")
plt.ylabel("Count")
plt.grid()
plt.show()

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
