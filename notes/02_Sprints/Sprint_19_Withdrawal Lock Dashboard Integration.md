# Sprint 19 — Withdrawal Lock Dashboard Integration

## Amaç

Withdrawal Lock verilerinin Dashboard üzerinde görünür hale getirilmesi.

## Tamamlanan İşler

### Backend

Dashboard API genişletildi.

Yeni alanlar:

- active_withdrawal_locks
- withdrawal_locks_expiring_today
- overdue_withdrawal_locks

Dashboard repository katmanına yeni sayım fonksiyonları eklendi:

- count_active_withdrawal_locks()
- count_withdrawal_locks_expiring_today()
- count_overdue_withdrawal_locks()

Kurallar:

- Active = is_active = true ve end_date >= today
- Expiring Today = is_active = true ve end_date = today
- Overdue = is_active = true ve end_date < today

Dashboard service katmanı güncellendi.

### Frontend

Dashboard ekranına üç yeni KPI kartı eklendi:

- Active Withdrawal Locks
- Expiring Today
- Overdue Locks

Mevcut Dashboard görünümü korunarak entegrasyon yapıldı.

## Testler

### Backend

Başarılı:

- app.init_db
- dashboard schema import
- dashboard service import
- dashboard router import
- withdrawal dashboard count imports

### Frontend

Başarılı:

- npm run lint
- npm run build

### Manuel Testler

Başarılı:

- Dashboard açıldı
- Mevcut KPI kartları görüntülendi
- Yeni Withdrawal Lock KPI kartları görüntülendi
- Gelecek tarihli lock kayıtları Active olarak sayıldı
- Bugün bitecek kayıtlar Expiring Today olarak sayıldı
- Süresi geçmiş kayıtlar Overdue olarak sayıldı
- İnaktif kayıtlar sayımlara dahil edilmedi

## Commit

feat: add withdrawal lock dashboard integration

## Sonuç

Withdrawal Lock modülü Dashboard ile entegre edildi.

Sprint 19 tamamlandı.