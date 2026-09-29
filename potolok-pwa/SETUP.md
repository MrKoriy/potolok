# Руководство по запуску и развертыванию: Potolok PWA

White-label PWA сервис онлайн-расчета сметы и записи на замер натяжных потолков.

---

## 1. Быстрый локальный запуск (Без внешних зависимостей)

Приложение полностью автономно и работает в режиме оффлайн/превью без необходимости поднимать внешнюю базу данных.

```bash
# 1. Клонирование и установка зависимостей
pnpm install

# 2. Запуск локального сервера разработки
pnpm run dev
```

Откройте в браузере:
- **STATUS Потолки (Москва)**: `http://localhost:5173/s/status-potolok/`
- **Кабинет замерщика STATUS**: `http://localhost:5173/s/status-potolok/owner/`
- **Арт-Потолок (Санкт-Петербург)**: `http://localhost:5173/s/art-potolok/`
- **Кабинет замерщика Арт-Потолок**: `http://localhost:5173/s/art-potolok/owner/`

---

## 2. Скрипты конвейера тенантов (Pipeline)

В `package.json` настроены 4 ключевых скрипта для работы с компаниями:

| Команда | Описание |
|---|---|
| `pnpm run tenant:validate` | Проверяет все конфигурации `tenants/*/business.json` на соответствие Zod-схеме и логике рабочих часов |
| `pnpm run tenant:new` | Создает скелет нового клиента за 3 секунды с параметрами (название, город, телефон, цвет) |
| `pnpm run tenant:publish` | Генерирует SQL-seed для Supabase Postgres со всеми активными компаниями |
| `pnpm run tenant:verify` | Запускает полный комплекс тестов (изоляция тенантов, криптография токенов, конфликт слотов, PWA сборка) |

### Пример создания новой компании:
```bash
pnpm run tenant:new -- --slug=imperia-potolok --name="Империя Потолков" --city="Казань" --phone="+79170001122" --accent="#0284c7"
```

---

## 3. Подключение Supabase (PostgreSQL, Auth, RLS)

Для перевода продукта в продакшн-режим с сохранением данных на сервере:

1. Скопируйте `.env.example` в `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Укажите ваши `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY`.
3. Примените миграции:
   - Откройте Supabase SQL Editor.
   - Выполните содержимое `supabase/migrations/20260929_init_potolok_pwa.sql`.
   - Запустите `pnpm run tenant:publish` и выполните сгенерированный `supabase/seed.sql`.

---

## 4. Сборка для Cloudflare Pages / Vercel

```bash
pnpm run build
```

Результат сборки находится в директории `dist/`:
- `dist/index.html`
- `dist/sw.js` (PWA Service Worker с кэшированием статики)
- `dist/manifest.webmanifest` (PWA манифест для установки на домашний экран)
