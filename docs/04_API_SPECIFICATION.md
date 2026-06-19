# 04 · API Specification

## Genel API Standardı
Base path:

```text
/api/v1
```

Response formatı sade tutulacaktır.

---

# Animals API

## GET /animals
Tüm aktif hayvanları listeler.

Response:
```json
[
  {
    "id": 1,
    "ear_tag": "TR-0001",
    "name": "Boncuk",
    "breed": "Holstein",
    "sex": "F"
  }
]
```

## POST /animals
Yeni hayvan ekler.

Request:
```json
{
  "ear_tag": "TR-0001",
  "name": "Boncuk",
  "breed": "Holstein",
  "sex": "F",
  "birth_date": "2023-04-12"
}
```

## GET /animals/{id}
Tek hayvan detayını getirir.

## PUT /animals/{id}
Hayvan bilgisini günceller.

---

# Vaccinations API

## GET /vaccinations
Aşı kayıtlarını listeler.

## POST /vaccinations
Yeni aşı kaydı ekler.

Request:
```json
{
  "animal_id": 1,
  "vaccine_name": "Şap Aşısı",
  "dose": "2 ml",
  "application_date": "2026-06-15",
  "next_due_date": "2026-12-15",
  "notes": "Sorun yok"
}
```

## GET /animals/{id}/vaccinations
Bir hayvanın aşı geçmişini getirir.

---

# Milk Records API

## GET /milk-records
Sağım kayıtlarını listeler.

## POST /milk-records
Yeni sağım kaydı ekler.

Request:
```json
{
  "animal_id": 1,
  "record_date": "2026-06-15",
  "milk_liters": 18.5,
  "session": "morning",
  "notes": "Normal"
}
```

## GET /animals/{id}/milk-records
Bir hayvanın sağım geçmişini getirir.

---

# Dashboard API

## GET /dashboard
Dashboard özetini getirir.

Response:
```json
{
  "total_animals": 12,
  "today_milk_liters": 124.5,
  "last_7_days_milk_liters": 820.0,
  "recent_records": []
}
```

---

# Hata Formatı

```json
{
  "detail": "Animal not found"
}
```

---

# Finance API

## GET /finance
Lists active finance records newest-first.

## POST /finance
Creates an income or expense record.

Request:
```json
{
  "record_type": "income",
  "category": "Milk sales",
  "amount": 1250.50,
  "record_date": "2026-06-19",
  "description": "Daily milk income"
}
```

## GET /finance/{id}
Returns one active finance record.

## PATCH /finance/{id}
Partially updates one active finance record.

## DELETE /finance/{id}
Soft deletes one finance record by setting it inactive.

Validation:
- `record_type`: `income` or `expense`
- `amount`: greater than 0
- `category`: not empty
- `record_date`: required
