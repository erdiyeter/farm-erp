# Sprint 22 — Withdrawal Lock List Filters

## Amaç

Withdrawal Lock listesinin kullanılabilirliğini artırmak.

## Kapsam

- Frontend filtreleme eklendi.
- Backend değiştirilmedi.
- Veritabanı değiştirilmedi.
- Yeni endpoint eklenmedi.

## Yapılanlar

- All filtresi eklendi.
- Active filtresi eklendi.
- Expired filtresi eklendi.
- Released filtresi eklendi.
- Filtreleme istemci tarafında gerçekleştirildi.
- Filtre sonucunda kayıt bulunamazsa boş durum mesajı eklendi.

## Değiştirilen Dosyalar

- frontend/src/pages/WithdrawalLocks.jsx

## Testler

- Sayfa açılışı doğrulandı.
- All filtresi doğrulandı.
- Active filtresi doğrulandı.
- Expired filtresi doğrulandı.
- Released filtresi doğrulandı.
- View navigasyonu doğrulandı.
- npm run lint başarılı.
- npm run build başarılı.

## Sonuç

Withdrawal Lock listesi için temel filtreleme desteği tamamlandı.