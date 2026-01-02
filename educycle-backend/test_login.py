"""
Test script to verify password login endpoint
"""
import requests
import json

# Test with a non-existent user (should fail gracefully)
url = "http://localhost:8000/auth/login"
payload = {
    "email": "test@example.com",
    "password": "testpassword123"
}

print("Testing password login endpoint...")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print("\nSending request...")

try:
    response = requests.post(url, json=payload, timeout=10)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"\nError: {str(e)}")
