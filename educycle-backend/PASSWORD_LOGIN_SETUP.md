# Password Login Setup Instructions

## Issue
The password-based login requires a valid Firebase Web API Key to authenticate users.

## Solution

### Step 1: Get your Firebase Web API Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click on the gear icon (⚙️) → Project Settings
4. Under "General" tab, scroll down to "Your apps"
5. Copy the **Web API Key** value

### Step 2: Update Backend Configuration

Create or update the `.env` file in the `educycle-backend` directory:

```env
FIREBASE_API_KEY=your_actual_firebase_web_api_key_here
```

**Important:** Replace `your_actual_firebase_web_api_key_here` with the actual API key you copied from Firebase Console.

### Step 3: Restart the Backend Server

After updating the `.env` file, restart the backend server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
uvicorn app.main:app --reload --port 8000
```

## Current Status

The backend is currently using a placeholder API key. The error message "Please pass a valid API key" indicates that the Firebase API key needs to be configured.

## Testing

After configuration, you can test the login with:

```bash
python test_login.py
```

This will attempt to log in and show you the response from the server.
