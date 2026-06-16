# 07 · Deployment Guide

## Geliştirme Bilgisayarı
Bu proje aşağıdaki geliştirme ortamına göre planlanmıştır:

```text
OS: Windows 10 Home x64
CPU: Intel Core i7-7700HQ
Architecture: x64
Editor: VS Code x64
Terminal: PowerShell
Database: PostgreSQL
Backend: Python + FastAPI
Frontend: React + Vite
```

ARM referansları bu yeni doküman setinde geçerli değildir.

## Lokal Geliştirme Ortamı
İlk aşamada deployment hedefi production değil, lokal geliştirme ortamıdır.

Gerekli araçlar:
- Git
- Python 3.12+
- Node.js LTS
- PostgreSQL 16
- VS Code
- Postman

## Backend Çalıştırma

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend adresi:

```text
http://localhost:8000
```

## Frontend Çalıştırma

```bash
cd frontend
npm install
npm run dev
```

Frontend adresi:

```text
http://localhost:5173
```

## Veritabanı
İlk aşamada PostgreSQL lokal kurulabilir.

Database adı:

```text
ciftlik_db
```

## Docker Kararı
Docker başlangıçta şart değildir.

Önce manuel kurulumla sistemin nasıl çalıştığı öğrenilecek. Docker daha sonra eklenecek.

## Production Deployment
Production konusu Katman 1 tamamlandıktan sonra ele alınacak.

O zamana kadar hedef:
- Lokal çalışan backend
- Lokal çalışan frontend
- Lokal PostgreSQL
