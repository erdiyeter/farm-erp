from fastapi import FastAPI

from app.routers.animal import router as animal_router


app = FastAPI()

app.include_router(animal_router, prefix="/api/v1")
