---
title: AuthStore for server-authoritative session state - Plan
type: feat
date: 2026-08-04
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
---

# AuthStore for server-authoritative session state - Plan

## Goal Capsule

Добавить feature-scoped Zustand store для клиентского состояния auth-сессии и общих auth-переходов. Auth.js JWT cookie и серверный `auth()` остаются источником истины. Store не должен оптимистично создавать сессию или менять существующий Server Action/Auth.js/Prisma flow.

---

## Product Contract

### Summary

Заменить черновой `src/store/auth.store.ts` на store в `src/features/auth/model/auth.store.ts`. App-wide provider создаёт отдельный store для каждого приложения/request, инициализирует его серверной сессией и синхронизирует после `router.refresh()`.

В scope входят sign-in, registration и общий sign-out lock из пункта 7 `docs/solutions/authentication-registration-flow.md`. Не входят `SessionProvider`, persistence, защищённые маршруты и изменение Server Actions/Auth.js/Prisma.

### Requirements

- R1. Auth.js JWT cookie и `auth()` остаются единственным авторитетным источником сессии.
- R2. AuthStore хранит последний подтверждённый snapshot сессии и отдельно координирует выполняемую auth-операцию.
- R3. Sign-in и registration меняют глобальное состояние только после успешного ответа Server Action и подтверждают сессию через `router.refresh()`.
- R4. Desktop- и mobile-экземпляры `HeaderActions` используют один атомарный sign-out lock и общий pending-state.
- R5. Ошибки sign-in, registration и sign-out не создают ложное authenticated/unauthenticated состояние.
- R6. Локальные values, validation errors, stale-response protection и submit pending остаются в `useAuthForm`.
- R7. Текущее описание auth-flow обновляется вместе с реализацией.

### Scope Boundaries

- Не добавлять `SessionProvider`, `useSession()` или Auth.js HTTP handlers.
- Не сохранять Session в `localStorage`, `sessionStorage` или Zustand persist.
- Не добавлять cross-tab sync, polling или timer-driven проверку истечения JWT.
- Не добавлять защищённые маршруты или новую sign-out error UI.
- Не менять Credentials provider, Prisma, password hashing и контракты Server Actions.

---

## Planning Contract

### Key Technical Decisions

- KTD1. Store размещается в `src/features/auth/model/auth.store.ts`, поскольку полностью принадлежит auth-фиче; общий `src/store` не создаётся.
- KTD2. Store создаётся через factory на базе `zustand/vanilla`, а не через module-global `create(...)`. `AuthStoreProvider` создаёт стабильный экземпляр для app tree и получает начальную Session от серверного layout.
- KTD3. State хранит `session`, `status` и `transition`. Инвариант `status === (session ? "authenticated" : "unauthenticated")` поддерживается атомарно; `isAuthenticated` предоставляется селектором и отдельно не хранится.
- KTD4. Session snapshot и выполняемая операция разделены. Последняя подтверждённая сессия остаётся видимой во время sign-in, registration или sign-out reconciliation.
- KTD5. Auth transition моделируется состояниями `idle`, `mutation` и `refreshing` с операциями `signIn`, `registration` и `signOut`.
- KTD6. Захват sign-out lock выполняется атомарным store action, а не проверкой отрендеренного boolean.
- KTD7. `router.refresh()` не считается awaitable. Transition завершается после получения ожидаемого server snapshot либо после окончания реально начатого React transition, если сервер вернул прежний snapshot.

### Store Interfaces

- `AuthStatus`: `authenticated | unauthenticated`.
- `AuthOperation`: `signIn | registration | signOut`.
- `AuthTransition`: `idle`, `mutation + signOut` или `refreshing + AuthOperation`.
- `createAuthStore(initialSession)` создаёт независимый vanilla store.
- `AuthStoreProvider` принимает `initialSession` и оборачивает всё клиентское дерево приложения.
- `useAuthStore(selector)` предоставляет selector-based доступ и выдаёт понятную ошибку вне provider.
- Store actions обеспечивают атомарный захват sign-out lock, переход в refreshing, отмену операции, server reconciliation и fallback-завершение refresh.

---

## Implementation Units

### U1. Feature-scoped store и provider

- **Requirements:** R1, R2, R5.
- **Files:** `src/features/auth/model/auth.store.ts`, `src/features/auth/model/AuthStoreProvider.tsx`, `src/features/auth/model/auth.store.test.ts`, `src/features/auth/model/AuthStoreProvider.test.tsx`, `package.json`, `package-lock.json`.
- **Approach:**
  1. Создать factory-based vanilla store и React Context binding.
  2. Вычислять начальные `session/status` из server Session.
  3. Реализовать guarded state machine и selector для `isAuthenticated`.
  4. Сохранить уже добавленную зависимость Zustand и удалить дублирующий черновик `src/store/auth.store.ts` после переноса.
- **Test scenarios:** guest/authenticated initialization; согласованность `session/status`; независимость store instances; атомарный lock; допустимые transitions; cancel и reconciliation.
- **Verification:** store не содержит module-global пользовательского состояния и не допускает противоречивых комбинаций `session/status`.

### U2. Server-to-client hydration

- **Requirements:** R1, R2.
- **Dependencies:** U1.
- **Files:** `src/app/layout.tsx`, `src/app/providers.tsx`, `src/features/auth/model/AuthStoreProvider.test.tsx`.
- **Approach:**
  1. Сохранить `auth()` в `RootLayout`.
  2. Передавать Session в `Providers` и далее в `AuthStoreProvider`.
  3. Обернуть Header, страницы и остальные client descendants одним provider.
  4. Синхронизировать последующие server snapshots без remount всего приложения.
- **Test scenarios:** начальная hydration с `null` и Session; `null → Session`; `Session → null`; тот же snapshot после refresh; отсутствие state leakage между providers; ошибка hook вне provider.
- **Verification:** начальный server render и первая client hydration используют одинаковую сессию.

### U3. Sign-in и registration reconciliation

- **Requirements:** R1, R3, R5, R6.
- **Dependencies:** U1, U2.
- **Files:** `src/components/UI/Header/Header.tsx`, `src/features/auth/ui/AuthModal.tsx`, `src/features/auth/ui/AuthModal.test.tsx`, `src/components/UI/Header/Header.test.tsx`.
- **Approach:**
  1. Изменить success-контракт `AuthModal`, чтобы callback сообщал завершившийся режим.
  2. При ошибочном результате оставить store и модалку без изменений.
  3. При успехе закрыть модалку, начать соответствующий refreshing transition и вызвать `router.refresh()` внутри React transition.
  4. Применять Session только через provider; не создавать её из email или результата action.
  5. Пока идёт reconciliation, оставить guest snapshot видимым и заблокировать повторные auth-действия.
- **Test scenarios:** sign-in и registration success закрывают модалку и запускают refresh; ошибки сохраняют модалку и не запускают transition; ошибка автоматического входа после создания аккаунта остаётся form error; stale success продолжает игнорироваться.
- **Verification:** authenticated UI появляется только после server Session.

### U4. Глобальный sign-out lock

- **Requirements:** R4, R5.
- **Dependencies:** U1, U2.
- **Files:** `src/components/UI/Header/HeaderActions.tsx`, `src/components/UI/Header/Header.tsx`, `src/components/UI/Header/Header.test.tsx`.
- **Approach:**
  1. Удалить `session` prop и локальный `isSigningOut` из `HeaderActions`.
  2. Читать Session и transition через store selectors.
  3. До Server Action атомарно захватывать `signOut` mutation lock.
  4. При успехе перейти в refreshing и вызвать общий refresh coordinator.
  5. При ошибке освободить lock, сохранить текущую Session, не вызывать refresh и разрешить повтор.
- **Test scenarios:** два desktop/mobile контрола вызывают Server Action один раз; обе кнопки используют общий pending; sign-out failure освобождает lock; successful refresh переводит UI в guest state; locale refresh не изменяет auth transition.
- **Verification:** пункт 7 документа решён одним shared lock, а не двумя локальными boolean.

### U5. Документация auth-flow

- **Requirements:** R7.
- **Dependencies:** U1–U4.
- **Files:** `docs/solutions/authentication-registration-flow.md`.
- **Approach:** обновить схему `RootLayout → Providers → AuthStore`, sign-in/registration reconciliation, sign-out flow, зоны ответственности, перечень тестов и пункт 7 как реализованное улучшение.
- **Test expectation:** none — документ отражает уже проверенное поведение реализации.
- **Verification:** описание не утверждает, что Zustand заменяет JWT cookie, `auth()` или `router.refresh()`.

---

## Verification Contract

- Запустить targeted Vitest для store, provider, AuthModal и Header.
- Запустить полный `npm test -- --run`.
- Проверить TypeScript через `npx tsc --noEmit`.
- Запустить ESLint и format check.
- Выполнить production build и `git diff --check`.
- Реальную JWT-cookie цепочку считать подтверждённой только после отдельной browser/staging E2E-проверки.

---

## Definition of Done

- AuthStore находится внутри auth-фичи и создаётся через provider без request leakage.
- `session/status` всегда согласованы; `isAuthenticated` не дублируется в state.
- Sign-in и registration обновляют UI только после server-authoritative reconciliation.
- Desktop/mobile sign-out используют один атомарный lock.
- Ошибки auth-операций освобождают transition и не создают ложную Session.
- Локальное состояние форм и существующий Server Action/Auth.js/Prisma flow сохранены.
- Документация обновлена, все verification gates проходят, экспериментальный и дублирующий код удалён.
