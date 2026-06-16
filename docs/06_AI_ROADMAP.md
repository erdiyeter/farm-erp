# 06 · AI Roadmap

## Genel Karar
AI özellikleri MVP'ye dahil değildir.

Sebep basit: AI için önce veri gerekir. Veri olmadan tahmin sistemi kurmak sahte sonuç üretir.

## AI Öncesi Gerekli Veri
AI özelliklerine geçmeden önce sistemde şunlar birikmiş olmalı:

- Hayvan kayıtları
- Sağım geçmişi
- Aşı geçmişi
- Sağlık kayıtları
- Tartım kayıtları
- Finans kayıtları

## Katman 3 AI Özellikleri

### 1. Mastitis Risk Skoru
Girdi:
- Son 7 gün sağım miktarı
- Ani süt düşüşü
- SCC verisi varsa SCC
- Geçmiş mastitis kayıtları

Çıktı:
- 0-100 arası risk skoru

İlk versiyon ML olmak zorunda değildir. Kural tabanlı başlayabilir.

### 2. Süt Tahmini
Girdi:
- Günlük sağım kayıtları
- Laktasyon dönemi
- Mevsimsel bilgiler

Çıktı:
- 7/15 günlük tahmini süt verimi

### 3. Golden List
En iyi hayvanları listeler.

Kriterler:
- Yüksek süt verimi
- Düşük sağlık problemi
- İyi üreme performansı
- Pozitif finansal değer

### 4. Black List
Dikkat edilmesi gereken hayvanları listeler.

Kriterler:
- Düşük verim
- Tekrarlayan sağlık problemi
- Negatif finansal değer
- Gelişim geriliği

### 5. AI Assistant
Kullanıcı şu tarz sorular sorabilir:

```text
Bu hafta hangi hayvanlara öncelik vermeliyim?
Hangi hayvanlarda süt düşüşü var?
Hangi hayvanlar ekonomik olarak zayıf?
```

## AI İçin Kural
AI hiçbir zaman veritabanında olmayan bilgiyi gerçekmiş gibi söylememeli.

AI sadece sistemdeki kayıtlar üzerinden yorum yapmalı.
