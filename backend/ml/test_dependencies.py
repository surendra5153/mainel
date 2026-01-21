import sys

print("Testing Python ML dependencies...")
print("Python version:", sys.version)
print()

dependencies = {
    'pandas': 'Data manipulation',
    'sklearn': 'Machine Learning (scikit-learn)',
    'nltk': 'Natural Language Processing',
    'torch': 'PyTorch',
    'torchvision': 'Torchvision',
    'PIL': 'Pillow (Image processing)',
    'flask': 'Flask (Python web framework)'
}

missing = []
loaded = []

for module, description in dependencies.items():
    try:
        __import__(module)
        loaded.append(f"[OK] {module:12} - {description}")
    except ImportError:
        missing.append(f"[NO] {module:12} - {description}")

print("Loaded dependencies:")
for item in loaded:
    print(item)

if missing:
    print("\nMissing dependencies:")
    for item in missing:
        print(item)
    print("\nTo install missing dependencies, run:")
    print("pip install pandas scikit-learn nltk torch torchvision pillow flask")
else:
    print("\n[OK] All Python dependencies are installed!")
