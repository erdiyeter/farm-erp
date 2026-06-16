# 08 · Developer Rules

## Ana Kural
Önce çalışan sade sistem. Sonra profesyonel sistem.

## Geliştirme Kuralları

### 1. Aynı anda çok şey ekleme
Bir özellik bitmeden diğerine geçilmez.

Yanlış:
```text
Hayvan ekranı yarım, aşı yarım, dashboard yarım, AI yarım.
```

Doğru:
```text
Hayvan ekleme tamamen biter. Sonra aşı kaydına geçilir.
```

### 2. AI en sona bırakılır
AI için önce veri gerekir.

### 3. Karmaşık mimari erken kurulmaz
Redis, Celery, event dispatch, offline sync gibi parçalar ilk MVP'ye eklenmez.

### 4. Kod anlaşılır olacak
Yeni başlayan biri 1 ay sonra kendi kodunu okuyabilmeli.

### 5. Her endpoint Postman ile test edilir
Frontend'e geçmeden önce backend endpoint çalışmalı.

### 6. Her tablo gerçekten ihtiyaç olunca eklenir
Eski dokümanlarda geçen tüm tablolar erken eklenmeyecek.

### 7. Git düzenli kullanılacak
Her tamamlanan küçük iş commitlenecek.

Örnek commit mesajları:

```text
feat: add animals table
feat: create animals api
feat: add animal list page
fix: validate milk record amount
```

### 8. Hata normaldir
Hedef hatasız ilerlemek değil, hatayı anlayarak çözmektir.

### 9. Proje öğrenme projesidir
Kurumsal teslim baskısı yok. Temel amaç öğrenerek gerçek ürün çıkarmaktır.

### 10. Eski dokümanlar referanstır
Eski dosyalar nihai tasarım değildir. Bu yeni doküman seti ana kaynak kabul edilir.
