# 01 · Development Roadmap

## Genel Strateji
Proje üç ana katmanda geliştirilecek. Her katman bitmeden sonraki katmana geçilmeyecek.

Amaç hızlı bitirmek değil; sistemi anlayarak, temiz ve sürdürülebilir şekilde geliştirmektir.

---

# Katman 1 — Gerçek MVP

## Hedef
Basit ama çalışan bir çiftlik yönetim uygulaması oluşturmak.

## Teknolojiler
- Backend: FastAPI
- Database: PostgreSQL
- Frontend: React + Vite
- API Test: Postman
- Kod Editörü: VS Code
- Versiyon Kontrol: Git

## Özellikler

### Hayvan Yönetimi
- Hayvan ekleme
- Hayvan listeleme
- Hayvan detay görüntüleme
- Hayvan bilgisi güncelleme

### Aşı Kayıtları
- Hayvana aşı kaydı ekleme
- Aşı geçmişini görüntüleme

### Sağım Kayıtları
- Günlük sağım kaydı ekleme
- Hayvan bazlı sağım geçmişi görüntüleme

### Dashboard
İlk sürümde 4 temel gösterge yeterlidir:
- Toplam hayvan sayısı
- Bugünkü sağım toplamı
- Son 7 gün sağım toplamı
- Son eklenen kayıtlar

## Katman 1 Bitiş Kriteri
Aşağıdaki akış hatasız çalışmalı:

```text
Hayvan ekle → hayvanı listede gör → detay sayfasına gir → aşı kaydı gir → sağım kaydı gir → dashboard'da veriyi gör
```

---

# Katman 2 — Operasyonel Sistem

## Hedef
Uygulamayı gerçek işletme kullanımına yaklaştırmak.

## Eklenecek Özellikler
- Stok yönetimi
- Aşı/ilaç kaydı sonrası stok düşümü
- Finans kayıtları
- İlaç arınma süresi kilidi
- Alarm sistemi
- Kullanıcı rolleri
- Daha detaylı hayvan profili

## Teknik Genişleme
- Daha güçlü veri doğrulama
- Daha düzenli hata yönetimi
- Test altyapısı
- Daha iyi frontend form yapısı

---

# Katman 3 — Akıllı Sistem

## Hedef
Yeterli veri toplandıktan sonra sistemi karar destek uygulamasına dönüştürmek.

## Eklenecek Özellikler
- AI analizleri
- Mastitis risk skoru
- Süt verimi tahmini
- Golden List / Black List
- RFID/NFC/QR entegrasyonu
- Offline-first yapı
- Mobil uygulama

## Not
AI bu projenin erken aşama özelliği değildir. AI için önce gerçek veri gerekir.

---

# Geliştirme Sırası

## Sprint 1
- Proje klasör yapısı
- Git kurulumu
- Backend iskeleti
- PostgreSQL bağlantısı
- İlk tablo: animals

## Sprint 2
- Animals API
- React frontend başlangıcı
- Hayvan listeleme ve ekleme ekranı

## Sprint 3
- Vaccinations tablosu
- Vaccination API
- Aşı kayıt ekranı

## Sprint 4
- Milk records tablosu
- Milk records API
- Sağım kayıt ekranı

## Sprint 5
- Dashboard API
- Dashboard frontend
- MVP temizliği

## Sprint 6
- Hata düzeltme
- Kod düzenleme
- Basit testler
- Katman 1 kapanışı
