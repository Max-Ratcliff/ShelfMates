# ShelfMates Backend

FastAPI backend for ShelfMates - Shared Food Inventory Tracker

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

4. Run the development server:
```bash
uvicorn src.main:app --reload --port 8000
```

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── models/          # Data models (Pydantic)
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   └── main.py          # Application entry point
├── tests/               # Test files
└── requirements.txt     # Python dependencies
```
