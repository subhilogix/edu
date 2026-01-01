import os

env_path = os.path.join(os.getcwd(), ".env")
print(f"Checking .env at: {env_path}")
if os.path.exists(env_path):
    print("File exists.")
    with open(env_path, "r") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key = line.split("=")[0]
                print(f"Key found: {key}")
else:
    print("File does not exist in current directory.")

print("\nEnvironment Variables (filtered):")
for k, v in os.environ.items():
    if "SMTP" in k or "FIREBASE" in k:
        print(f"{k} is set (length: {len(v)})")
