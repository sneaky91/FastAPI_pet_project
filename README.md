# Gemini Chat

A full-stack AI chat application built with FastAPI, SQLite, SQLAlchemy, the Google GenAI SDK, and a responsive vanilla HTML/CSS/JavaScript frontend.

## Features

- Separate conversations with persistent SQLite storage
- Chat history grouped by client IP
- Conversation deletion from the database and frontend
- Gemini API integration
- Responsive single-file frontend
- CORS support for local development

## Tech stack

- Python 3.14+
- FastAPI
- SQLAlchemy
- SQLite
- Google GenAI SDK
- HTML, CSS, and JavaScript

## Run the API

Install dependencies:

```powershell
uv sync
```

Set your own Gemini API key.

```powershell
$env:GEMINI_API_KEY="your_gemini_api_key"
```

Start the API:

```powershell
uv run uvicorn main:app --reload --port 8000
```

## Run the frontend

In a second terminal, from the project root:

```powershell
python -m http.server 5500
```

Open `http://localhost:5500/index.html`.

## API endpoints

- `GET /requests` returns the request history for the client IP.
- `POST /requests` sends a prompt and `conversation_id`.
- `DELETE /requests/{conversation_id}` permanently deletes a conversation for the client IP.

## Repository safety

The repository ignores API keys, `.env`, the local database, virtual environments, IDE files, and Python cache files. Set `GEMINI_API_KEY` in your local environment before starting the API.
