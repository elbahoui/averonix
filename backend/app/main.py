"""Averonix FastAPI app entry point."""
from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import agent_routes, assessment_routes, health_routes, organization_routes
from .config import get_allowed_origins

allowed_origins = get_allowed_origins()

app = FastAPI(
    title="Averonix Backend",
    version="0.1.0",
    description="Agent + Manual Assessment engines for ISO/IEC 27001 readiness.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_routes.router, prefix="/api")
app.include_router(agent_routes.router, prefix="/api")
app.include_router(assessment_routes.router, prefix="/api")
app.include_router(organization_routes.router, prefix="/api")


@app.get("/")
async def root():
    return {"service": "averonix-backend", "status": "ok"}
