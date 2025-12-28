# Frontend-Backend Integration Notes

## Overview
This document outlines the changes made to connect the React frontend with the FastAPI backend.

## Changes Made

### Backend Changes

#### 1. Added Missing API Endpoints
- **GET /requests/** - List user's requests
- **GET /requests/{request_id}** - Get specific request
- **GET /books/{book_id}** - Get specific book
- **GET /chats/{chat_id}** - Get chat details
- **GET /chats/{chat_id}/messages** - Get chat messages
- **GET /ngo/bulk-request** - List NGO bulk requests

#### 2. Updated Services
- Added `list_user_requests()` in `request_service.py`
- Added `get_book()` in `book_service.py`
- Added `get_chat()` and `get_chat_messages()` in `chat_service.py`
- Added `list_ngo_requests()` in `ngo_service.py`

#### 3. CORS Configuration
- Updated CORS to allow frontend origins (localhost:8080, localhost:5173)

### Frontend Changes

#### 1. Created API Service Layer
- **frontend/src/lib/api.ts** - Centralized API utilities with authentication
- Includes functions for: books, requests, chats, notes, NGO, feedback, impact, auth

#### 2. Firebase Authentication Integration
- **frontend/src/lib/firebase.ts** - Firebase config and auth functions
- **frontend/src/contexts/AuthContext.tsx** - Auth context provider
- Integrated into main.tsx

#### 3. Type Definitions
- **frontend/src/types/api.ts** - TypeScript types matching backend schemas

#### 4. Updated Pages (Replaced Mock Data with API Calls)

**SearchBooks.tsx**
- Uses `booksApi.search()` to fetch books
- Added loading states
- Added error handling

**BookDetails.tsx**
- Uses `booksApi.getById()` to fetch book details
- Added loading states
- Updated to use API Book type

**RequestBook.tsx**
- Uses `booksApi.getById()` to fetch book
- Uses `requestsApi.create()` to submit request
- Added authentication check
- Added loading/submitting states

**BookCard.tsx**
- Updated to use API Book type
- Handles image_urls array instead of single coverImage

#### 5. Pages Still Need Updates
The following pages still need to be updated (work in progress):
- RequestStatus.tsx - Use `requestsApi.list()` and `requestsApi.getById()`
- Chat.tsx - Use `chatsApi.getMessages()` and `chatsApi.sendMessage()`
- DonateBook.tsx - Use `booksApi.donate()` with file uploads
- Notes.tsx - Use `notesApi.list()` and `notesApi.upload()`
- StudentImpact.tsx - Use `impactApi.getUserImpact()`
- NGO pages - Use respective NGO APIs

## Environment Variables Needed

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Backend (.env)
```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_SERVICE_ACCOUNT=serviceAccountKey.json
```

## Dependencies Added

### Frontend
- firebase (for authentication)

## Next Steps

1. Complete remaining page updates (RequestStatus, Chat, DonateBook, Notes, Impact, NGO pages)
2. Add Firebase authentication UI (login/logout)
3. Update Index.tsx and NGOLogin.tsx to use Firebase auth
4. Add error boundaries
5. Test end-to-end flows
6. Add loading skeletons for better UX
7. Handle offline states

## API Endpoints Reference

### Books
- GET /books/search?class_level=X&board=Y&subject=Z
- GET /books/{book_id}
- POST /books/donate (multipart/form-data)

### Requests
- GET /requests/
- GET /requests/{request_id}
- POST /requests/ {book_id, donor_uid}
- POST /requests/{request_id}/approve
- POST /requests/{request_id}/complete

### Chats
- GET /chats/{chat_id}
- GET /chats/{chat_id}/messages
- POST /chats/{chat_id}/message {message}

### Notes
- GET /notes/?subject=X&class_level=Y
- POST /notes/ (multipart/form-data)

### NGO
- GET /ngo/bulk-request
- POST /ngo/bulk-request {payload}

### Impact
- GET /impact/

### Auth
- POST /auth/bootstrap {role}

### Feedback
- POST /feedback/ {to_uid, ...feedbackData}

