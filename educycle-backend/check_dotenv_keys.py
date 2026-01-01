from dotenv import dotenv_values
import os
import sys

env_path = sys.argv[1] if len(sys.argv) > 1 else ".env"
if os.path.exists(env_path):
    config = dotenv_values(env_path)
    print(f"Keys found in {env_path}:")
    for k in config.keys():
        print(f"'{k}'")
else:
    print(f"{env_path} not found")
