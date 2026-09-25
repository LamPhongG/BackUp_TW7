"""Mounts every route module under the API prefix. Add new routers here."""
from fastapi import APIRouter

from app.api.routes import audit, auth, catalog, documents, health, paths

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(catalog.router)
api_router.include_router(documents.router)
api_router.include_router(paths.router)
api_router.include_router(audit.router)
