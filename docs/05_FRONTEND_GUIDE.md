# 05 · Frontend Guide

## Teknoloji
Frontend React + Vite ile geliştirilecek.

## İlk Sayfalar

```text
/src
  /pages
    Dashboard.jsx
    Animals.jsx
    AnimalDetail.jsx
    Vaccinations.jsx
    MilkRecords.jsx
  /components
    Navbar.jsx
    AnimalForm.jsx
    VaccinationForm.jsx
    MilkRecordForm.jsx
    KpiCard.jsx
  /api
    client.js
    animalsApi.js
    vaccinationsApi.js
    milkRecordsApi.js
    dashboardApi.js
```

## Sayfa Açıklamaları

### Dashboard
Ana ekran.

Gösterilecekler:
- Toplam hayvan sayısı
- Bugünkü süt toplamı
- Son 7 gün süt toplamı
- Son kayıtlar

### Animals
Hayvan listesi.

Özellikler:
- Listeleme
- Yeni hayvan ekleme
- Detay sayfasına gitme

### AnimalDetail
Tek hayvan profili.

Gösterilecekler:
- Kimlik bilgisi
- Aşı geçmişi
- Sağım geçmişi

### Vaccinations
Aşı kayıt ekranı.

### MilkRecords
Sağım kayıt ekranı.

## UI Prensibi
İlk aşamada tasarım sade olacak.

Öncelik:
1. Çalışması
2. Anlaşılır olması
3. Sonra güzelleştirilmesi

## API Client
Frontend backend ile tek bir API client üzerinden konuşacak.

Örnek:

```js
const API_BASE_URL = "http://localhost:8000/api/v1";

export async function getAnimals() {
  const response = await fetch(`${API_BASE_URL}/animals`);
  return response.json();
}
```

## Form Prensibi
Her form önce basit yapılacak.

İlk hedef:
- Input al
- Submit et
- API'ye gönder
- Başarılıysa listeyi yenile

Form validation daha sonra güçlendirilecek.
