# 03 · Database Design

## Veritabanı Prensibi
MVP veritabanı küçük ve anlaşılır başlayacak. Gereksiz tablo erken eklenmeyecek.

İlk hedef veri modelini öğrenmek ve çalışan API üretmektir.

---

# Katman 1 MVP Tabloları

## 1. animals
Hayvan ana kaydı.

```sql
CREATE TABLE animals (
    id SERIAL PRIMARY KEY,
    ear_tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    species VARCHAR(50) DEFAULT 'cattle',
    breed VARCHAR(100),
    sex VARCHAR(10),
    birth_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

## 2. vaccinations
Aşı kayıtları.

```sql
CREATE TABLE vaccinations (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER NOT NULL REFERENCES animals(id),
    vaccine_name VARCHAR(150) NOT NULL,
    dose VARCHAR(50),
    application_date DATE NOT NULL,
    next_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## 3. milk_records
Sağım kayıtları.

```sql
CREATE TABLE milk_records (
    id SERIAL PRIMARY KEY,
    animal_id INTEGER NOT NULL REFERENCES animals(id),
    record_date DATE NOT NULL,
    milk_liters NUMERIC(8,2) NOT NULL,
    session VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## 4. users
İlk aşamada basit kullanıcı tablosu.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

# Katman 2'de Eklenecek Tablolar

## inventory_items
Stok takibi.

## financial_records
Gelir/gider kayıtları.

## withdrawal_locks
İlaç arınma süresi kilitleri.

## alarms
Uyarılar.

---

# Katman 3'te Eklenecek Tablolar

## ai_predictions
AI tahmin sonuçları.

## hardware_tags
RFID/NFC/QR eşleşmeleri.

## sync_queue
Offline sync için yerel kayıt kuyruğu.

---

# Not
Eski dosyalardaki UUID, event_guid, trigger/outcome yapısı ileride değerlidir. Ancak MVP'de bunları erken eklemek öğrenme sürecini gereksiz zorlaştırır.

---

# Implemented Layer 2 Tables

## financial_records
Finance income and expense records.

```sql
CREATE TABLE financial_records (
    id SERIAL PRIMARY KEY,
    record_type VARCHAR(20) NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    record_date DATE NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT ck_financial_records_record_type
        CHECK (record_type IN ('income', 'expense')),
    CONSTRAINT ck_financial_records_amount_positive
        CHECK (amount > 0)
);
```
