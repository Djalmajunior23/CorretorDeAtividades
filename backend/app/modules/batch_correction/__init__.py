# Module for Teacher Batch Correction Engine
from .routes import router

def init_app(app):
    app.include_router(router)
