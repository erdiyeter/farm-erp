# Sprint 24 — Withdrawal Lock Dashboard UX Cleanup

## Amaç

Dashboard ekranında withdrawal lock bilgilerinin daha okunabilir hale getirilmesi.

Bu sprintte yeni özellik eklenmedi. Sadece mevcut dashboard görünümü sadeleştirildi.

## Kapsam

- Withdrawal lock KPI kartları ayrı bir dashboard bölümüne taşındı.
- Yeni bölüm adı: `Withdrawal Lock Summary`
- Mevcut dashboard veri alanları korundu:
  - `active_withdrawal_locks`
  - `withdrawal_locks_expiring_today`
  - `overdue_withdrawal_locks`
- `/withdrawal-locks` bağlantısı korundu.
- Backend değişmedi.
- API değişmedi.
- Database değişmedi.

## Değiştirilen Dosyalar

```text
frontend/src/pages/Dashboard.jsx