# 02 · System Architecture

## Katman 1 Mimari
MVP aşamasında mimari bilinçli olarak sade tutulacaktır.

```text
React Frontend
      ↓ HTTP/JSON
FastAPI Backend
      ↓ SQL
PostgreSQL Database
```

## Neden Basit Mimari?
Projenin ilk amacı karmaşık mimari kurmak değil, çalışan tam döngüyü öğrenmektir.

İlk aşamada kullanılmayacaklar:
- Redis
- Celery
- Event dispatch engine
- Microservice mimarisi
- Offline sync
- AI servisleri

Bunlar ileride eklenecek.

## Backend
Backend FastAPI ile yazılacak.

Görevleri:
- API endpointlerini sağlamak
- Veritabanı işlemlerini yapmak
- Request doğrulamak
- Response dönmek
- İş kurallarını uygulamak

## Frontend
Frontend React + Vite ile yazılacak.

Görevleri:
- Kullanıcı ekranlarını göstermek
- Formlardan veri almak
- Backend API'ye istek atmak
- Gelen verileri listelemek/göstermek

## Database
Veritabanı PostgreSQL olacak.

MVP'de veritabanı sade kalacak.

İlk tablolar:
- animals
- vaccinations
- milk_records
- users

İhtiyaç olursa:
- herds
- groups

## Veri Akışı Örneği

### Hayvan Ekleme
```text
React form → POST /api/v1/animals → FastAPI → PostgreSQL INSERT → response → React liste güncellenir
```

### Sağım Kaydı
```text
React form → POST /api/v1/milk-records → FastAPI → PostgreSQL INSERT → dashboard verisi değişir
```

## Katman 2'de Mimari Genişleme
Katman 2'de şu parçalar eklenebilir:
- inventory
- financial_records
- withdrawal_locks
- alarms
- authentication

## Katman 3'te Mimari Genişleme
Katman 3'te şu parçalar eklenebilir:
- Redis
- Celery
- AI worker
- offline local database
- RFID/NFC/QR integration
