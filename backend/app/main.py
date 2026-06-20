from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers.alarm import router as alarm_router
from app.routers.animal import router as animal_router
from app.routers.dashboard import router as dashboard_router
from app.routers.finance import router as finance_router
from app.routers.health_record import router as health_record_router
from app.routers.inventory import router as inventory_router
from app.routers.milk_record import router as milk_record_router
from app.routers.vaccination import router as vaccination_router
from app.routers.withdrawal_lock import router as withdrawal_lock_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(alarm_router, prefix="/api/v1")
app.include_router(animal_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(finance_router, prefix="/api/v1/finance")
app.include_router(health_record_router, prefix="/api/v1")
app.include_router(inventory_router, prefix="/api/v1")
app.include_router(milk_record_router, prefix="/api/v1")
app.include_router(vaccination_router, prefix="/api/v1")
app.include_router(withdrawal_lock_router, prefix="/api/v1")
