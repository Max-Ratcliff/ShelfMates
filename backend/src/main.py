"""
ShelfMates Backend API
FastAPI application for managing shared household food inventory
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from .config.settings import settings
from .config.firebase import initialize_firebase
from .routes import auth, households, items


# Initialize FastAPI app
app = FastAPI(
    title="ShelfMates API",
    description="Backend API for ShelfMates - Shared Food Inventory Tracker",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(households.router, prefix="/api")
app.include_router(items.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # TODO: Implement startup initialization
    # initialize_firebase()
    pass


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    # TODO: Implement cleanup
    pass


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "ShelfMates API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.environment
    }


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    # TODO: Implement proper error handling and logging
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": str(exc) if settings.environment == "development" else "An error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=settings.port,
        reload=settings.environment == "development"
    )
