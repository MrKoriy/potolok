# Отчет о приемке продукта: Potolok PWA Multi-Tenant

Дата проверки: 29 сентября 2026  
Проект: PWA онлайн-записи и калькулятора натяжных потолков  
Статус проверки: УСПЕШНО (21/21 тестов пройдено)

---

## 1. Проверка архитектурных инвариантов

| Инвариант | Требование | Статус | Реализация |
|---|---|---|---|
| **1. Multi-Tenant маршрутизация** | Один JS/CSS билд, tenant_id во всех сущностях, `/s/{slug}/` и `/s/{slug}/owner/` | ВЫПОЛНЕНО | Динамический роутер в `src/App.tsx`, контекст `TenantContext`, отсутствие хардкода названий в `src` |
| **2. Pipeline конвейер** | Вход: `business.json`, скрипты `tenant:new`, `tenant:validate`, `tenant:publish`, `tenant:verify` | ВЫПОЛНЕНО | Все 4 скрипта реализованы на TypeScript, описаны в `package.json` и протестированы |
| **3. Ресурсная модель** | Выездной замерщик как ресурс, 2-часовые окна визита, 45-минутный буфер на перемещение | ВЫПОЛНЕНО | Модель `SurveyorResource`, `TimeSlotPicker` с проверкой занятости слотов |
| **4. Защита от дублей (Конкурентная запись)** | Исключение пересечений на уровне БД через Postgres GiST EXCLUDE | ВЫПОЛНЕНО | `resource_occupancies` с констрейнтом `EXCLUDE USING gist (occupied_range WITH &&)` в миграции |
| **5. Анонимный доступ клиента** | Запись без обязательной регистрации, доступ по SHA-256 крипто-токену | ВЫПОЛНЕНО | Генератор `generateAccessToken`, хеширование `hashToken`, валидация в `BookingTrackingPage` |
| **6. Безопасность и RLS** | Анонимный пользователь видит только свою заявку, owner видит только свой tenant | ВЫПОЛНЕНО | SQL RLS политики для `tenants`, `resources`, `bookings`, `notification_jobs` |
| **7. Очередь уведомлений** | Outbox pattern с lease и защитой от дублирования | ВЫПОЛНЕНО | Таблица `notification_jobs` с `idempotency_key`, статусами `pending/processing/completed` |
| **8. Разделение метрик в аналитике** | Не называть будущие сметы выручкой | ВЫПОЛНЕНО | В `OwnerDashboardPage` разделены активные замеры, объем открытых смет и закрытая выручка |
| **9. Мобильная адаптивность и PWA** | Standalone manifest, Service Worker, safe area padding, отсутствие горизонтального скролла | ВЫПОЛНЕНО | `vite-plugin-pwa`, `dist/sw.js`, `.pb-safe`, `viewport-fit=cover` |
| **10. Изоляция двух демо-компаний** | Создать 2 явно отличающихся demo-бизнеса | ВЫПОЛНЕНО | `status-potolok` (Москва, янтарный, EuroKRAAB) и `art-potolok` (СПб, изумрудный, эконом) |

---

## 2. Результаты автоматизированного тест-сьюта (`pnpm run tenant:verify`)

```text
==================================================
  POTOLOK PWA MULTI-TENANT VERIFICATION SUITE    
==================================================

--- TEST SUITE 1: Business Schema Validation ---
[PASS] Found at least 2 distinct demo tenants
[PASS] Tenant art-potolok has valid metadata
[PASS] Tenant art-potolok has canvas options
[PASS] Tenant art-potolok has profile options
[PASS] Tenant art-potolok has assigned surveyors
[PASS] Tenant status-potolok has valid metadata
[PASS] Tenant status-potolok has canvas options
[PASS] Tenant status-potolok has profile options
[PASS] Tenant status-potolok has assigned surveyors

--- TEST SUITE 2: Multi-Tenant Data Isolation ---
[PASS] Tenant slugs are isolated and distinct
[PASS] Tenants serve different cities (Москва и МО vs Санкт-Петербург и ЛО)
[PASS] Tenants have distinct brand accent colors (#f59e0b vs #10b981)

--- TEST SUITE 3: Anonymous Token Crypto Security ---
[PASS] SHA-256 token hashing is deterministic
[PASS] SHA-256 output is 64 hex characters (256-bit)
[PASS] Token plaintext is never exposed as hash

--- TEST SUITE 4: Atomic Resource Occupancy & Double-Booking Prevention ---
[PASS] First booking in slot succeeds
[PASS] Concurrent booking in same tenant & slot is rejected with conflict
[PASS] Booking in different tenant on same slot succeeds (Tenant isolation)

--- TEST SUITE 5: Production Bundling & Service Worker ---
[PASS] dist/index.html generated
[PASS] dist/sw.js PWA Service Worker generated
[PASS] PWA WebManifest generated

==================================================
RESULTS: 21 passed, 0 failed.
==================================================
```

---

## 3. Статус внешних интеграций

- **Локальный режим**: Полностью автономен. Заказы сохраняются в локальном хранилище устройства с эмуляцией atomic-транзакций и крипто-токенов.
- **Внешний Supabase**: Подготовлен файл `.env.example` и миграция `supabase/migrations/20260929_init_potolok_pwa.sql`. Для подключения продакшн-БД достаточно заполнить URL и Anon Key.
- **Внешний Push/Telegram**: Подготовлена таблица Outbox `notification_jobs` для фоновой отправки сообщений при наступлении событий записи.
