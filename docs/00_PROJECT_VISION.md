# 00 · Project Vision

## Proje Adı
Karar Veren Çiftlik Sistemi

## Amaç
Bu proje, küçük ve orta ölçekli hayvancılık işletmeleri için geliştirilecek bir çiftlik yönetim sistemidir. Amaç; hayvan kayıtlarını, sağlık işlemlerini, sağım verilerini ve temel işletme göstergelerini tek yerde takip edebilen, zamanla daha akıllı hale getirilebilecek bir uygulama oluşturmaktır.

Bu proje sadece ürün geliştirme projesi değildir. Aynı zamanda full-stack geliştirme öğrenme projesidir.

## Temel Yaklaşım
Önce çalışan basit sistem kurulacak. Sonra sistem katman katman büyütülecek.

İlk hedef karmaşık mimari değil, gerçek çalışan üründür.

## Hedef Kullanıcı
- Çiftlik sahibi
- Saha çalışanı
- Veteriner veya teknik sorumlu
- Hayvan kayıtlarını düzenli tutmak isteyen küçük/orta işletmeler

## Katmanlı Geliştirme Modeli

### Katman 1 — Gerçek MVP
Çalışan ilk ürün.

Kapsam:
- Hayvan ekleme/listeleme/detay görme
- Aşı kaydı girme
- Sağım kaydı girme
- Basit dashboard
- PostgreSQL veritabanı
- FastAPI backend
- React frontend

Kapsam dışı:
- AI
- RFID/NFC
- Offline sync
- Redis
- Celery
- Gelişmiş trigger motoru
- Mobil uygulama

### Katman 2 — Operasyonel Sistem
MVP çalıştıktan sonra eklenecek işletme özellikleri.

Kapsam:
- Stok yönetimi
- Finans kayıtları
- Withdrawal lock / ilaç arınma süresi kilidi
- Alarm sistemi
- Kullanıcı rolleri
- Daha gelişmiş dashboard

### Katman 3 — Akıllı Sistem
Yeterli gerçek veri biriktikten sonra eklenecek ileri özellikler.

Kapsam:
- AI destekli analizler
- Mastitis riski
- Süt tahmini
- Golden List / Black List
- RFID/NFC/QR entegrasyonu
- Offline-first çalışma
- Mobil uygulama

## Ana Prensipler
- Önce çalışan ürün, sonra gelişmiş mimari.
- Önce veri topla, sonra tahmin yap.
- Önce basit kod, sonra optimizasyon.
- Önce öğrenme, sonra profesyonelleştirme.
- Gereksiz teknolojiler erken eklenmeyecek.

## Başarı Tanımı
Katman 1 sonunda kullanıcı şunları yapabiliyorsa MVP başarılıdır:

1. Hayvan ekleyebiliyor.
2. Hayvan listesini görebiliyor.
3. Bir hayvanın detay sayfasına girebiliyor.
4. Aşı kaydı girebiliyor.
5. Sağım kaydı girebiliyor.
6. Dashboard üzerinden temel sayıları görebiliyor.

Bu tamamlanmadan Katman 2'ye geçilmeyecek.
