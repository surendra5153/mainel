from PIL import Image
from torchvision import models, transforms
import torch

# Load a pre-trained model (e.g., ResNet for image classification)
model = models.resnet18(pretrained=True)
model.eval()

# Define preprocessing transformations
preprocess = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def analyze_image(image_path):
    """
    Analyze an uploaded image and return predicted tags/categories.
    """
    image = Image.open(image_path).convert('RGB')
    input_tensor = preprocess(image).unsqueeze(0)

    with torch.no_grad():
        output = model(input_tensor)
        probabilities = torch.nn.functional.softmax(output[0], dim=0)

    # Try to load ImageNet class labels from file, fallback to generic labels
    try:
        with open("imagenet_classes.txt") as f:
            labels = [line.strip() for line in f.readlines()]
    except FileNotFoundError:
        # Fallback: use generic category names
        labels = [f"Category_{i}" for i in range(1000)]

    # Get top 5 predictions
    top5_prob, top5_catid = torch.topk(probabilities, 5)
    results = [(labels[catid] if catid < len(labels) else f"Category_{catid}", prob.item()) for catid, prob in zip(top5_catid, top5_prob)]
    return results

# Example usage
if __name__ == "__main__":
    test_image_path = "example.jpg"  # Replace with the path to an actual image
    try:
        predictions = analyze_image(test_image_path)
        print("Top predictions:")
        for label, prob in predictions:
            print(f"{label}: {prob:.4f}")
    except FileNotFoundError:
        print("Test image not found. Please provide a valid image path.")