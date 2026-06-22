# Sprint 20 — Automatic Withdrawal Lock Alarms

## Amaç

Withdrawal Lock modülü ile Alarm modülü arasında temel MVP entegrasyonunu sağlamak.

Aktif withdrawal lock kayıtlarının alarm sistemi içerisinde görünmesi ve aynı withdrawal lock için tekrar eden alarm kayıtlarının oluşmasının engellenmesi hedeflenmiştir.

Bu sprintte yeni mimari, zamanlayıcı (scheduler) veya arka plan çalışanı eklenmemiştir.

---

## Kapsam

- Withdrawal lock kayıtlarını kontrol etme
- İlgili alarm kayıtlarını otomatik oluşturma
- Alarm tekrarlarını engelleme
- Mevcut alarm modülü ile entegrasyon
- Alarm CRUD yapısını koruma

---

## Yapılan Değişiklikler

### Backend

#### Alarm Repository

Yeni yardımcı sorgu eklendi:

```python
get_alarm_by_title_and_type()