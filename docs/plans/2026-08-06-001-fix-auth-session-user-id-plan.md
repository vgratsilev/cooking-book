---
title: "Исправить token.id и сделать ID частью Auth-сессии"
type: fix
date: 2026-08-06
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
origin: docs/solutions/authentication-registration-flow.md
---

# Исправить `token.id` и сделать ID частью Auth-сессии

## Summary

Кастомный `token.id` не следует начинать использовать: Auth.js уже формирует стандартный `token.sub` из `user.id`. Нужно удалить дублирующее поле и через `session` callback перенести `token.sub` в `session.user.id`.

Auth.js по умолчанию отдаёт в Session только `name`, `email` и `image`; дополнительные JWT-поля должны быть явно экспортированы через `session` callback. Для согласованной типизации используется module augmentation ([callbacks](https://authjs.dev/reference/core#callbacks), [TypeScript](https://authjs.dev/getting-started/typescript#module-augmentation)).

## Requirements and Scope

- `session.user.id` доступен как обязательная строка для подтверждённой сессии.
- AuthStore использует `user.id` как единственный ключ auth identity.
- Существующие `name`, `email`, `image` и `expires` сохраняются.
- Не добавляются миграции БД, `SessionProvider`, защищённые маршруты, OAuth или Auth.js handlers.
- ID не является разрешением на доступ; серверные операции получают его из `auth()`, а не доверяют client payload.

## Implementation Changes

### U1. Auth.js Session contract

- **Files:** `src/features/auth/auth.ts`, `src/features/auth/model/next-auth.d.ts`.
- Удалить кастомный `jwt` callback, записывающий `token.id`.
- Добавить `session` callback, который переносит стандартный `token.sub` в `session.user.id` и возвращает остальные поля без изменений.
- При отсутствии `token.sub` считать JWT некорректным и завершать чтение сессии ошибкой, без fallback на email.
- Добавить module augmentation `next-auth`: `Session.user` должен содержать `id: string` и сохранять поля `DefaultSession["user"]`.

### U2. AuthStore identity

- **Files:** `src/features/auth/model/auth.store.ts`, `src/features/auth/model/auth.store.test.ts`, `src/features/auth/model/AuthStoreProvider.test.tsx`, `src/components/UI/Header/Header.test.tsx`.
- Удалить fallback `user.id ?? user.email`; использовать `session.user.id` как каноническую идентичность.
- Обновить тестовые Session fixtures обязательным `id`.
- Проверить, что изменение email или metadata при том же ID не меняет identity.
- Проверить, что другой ID при том же email считается сменой пользователя.

### U3. Documentation and regression coverage

- **Files:** `src/features/auth/auth.test.ts`, `docs/solutions/authentication-registration-flow.md`.
- В `auth.test.ts` проверить перенос `token.sub`, сохранение стандартных полей и отказ при отсутствии `sub`.
- В документации описать цепочку `Credentials user.id → JWT sub → session.user.id → AuthStore`.
- Пункт 5 пометить как реализованный и убрать формулировку о неиспользуемом `token.id`.

## Verification Contract

- Targeted и полный Vitest.
- TypeScript, ESLint, format check, production build и `git diff --check`.
- При наличии live runtime выполнить smoke-проверку настоящего входа и `auth()`; если она не выполнялась, документация не должна объявлять JWT-cookie цепочку end-to-end подтверждённой.

## Assumptions and Compatibility

- `prisma.User.id` остаётся строковым UUID.
- Миграция БД и принудительный logout не нужны: существующие JWT уже содержат стандартный `sub`; старый дополнительный `id` будет игнорироваться до обновления или истечения cookie.
- Защита маршрутов и authorization policy остаются отдельной задачей.

## Definition of Done

- В коде больше нет зависимости от кастомного `token.id`.
- `auth()` и AuthStore получают стабильный `session.user.id`.
- Типы, тесты и документация согласованы с новым контрактом.
- Все локальные verification gates проходят.
