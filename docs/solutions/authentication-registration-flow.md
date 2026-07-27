# Авторизация и регистрация в `cooking-book`

> Снимок поведения проекта на 2026-07-28. Документ составлен по текущему коду и результатам проверок, а не по старому плану рефакторинга.

## Краткий вывод

В проекте реализован server-action flow на базе Auth.js 5:

- форма входа и форма регистрации находятся в одной клиентской модалке в `Header`;
- клиент валидирует данные локально и передаёт их в Server Action;
- Server Action повторно валидирует payload на сервере;
- регистрация создаёт пользователя в Prisma с salted `scrypt`-хэшем пароля и сразу вызывает Credentials sign-in;
- вход использует Credentials provider Auth.js, который ищет пользователя по email и проверяет пароль;
- общая email-схема обрезает пробелы и приводит email к lowercase до lookup/create/sign-in;
- сессия хранится в JWT, а не в таблице `Session`;
- серверный `RootLayout` вызывает `auth()` и передаёт сессию в клиентский `Header`;
- после входа, регистрации или выхода клиент вызывает `router.refresh()`, чтобы заново получить серверное состояние.

При корректно настроенных секретах и доступной базе такой сценарий должен работать end-to-end. Автоматические unit/component-тесты проходят, но текущая проверка подключения к PostgreSQL не завершилась успешно: `prisma migrate status` дошёл до `db.prisma.io:5432`, после чего получил ошибку schema engine.

## Общая схема

```mermaid
flowchart TD
    Browser[Пользователь] --> Header[Header client component]
    Header --> AuthModal[AuthModal]
    AuthModal --> SignInForm[SignInForm]
    AuthModal --> RegistrationForm[RegistrationForm]

    SignInForm --> SignInAction[loginUser Server Action]
    RegistrationForm --> RegisterAction[registerUser Server Action]
    Header --> SignOutAction[signOutUser Server Action]

    SignInAction --> AuthJS[Auth.js signIn]
    RegisterAction --> PrismaUser[Prisma User]
    RegisterAction --> AuthJS
    SignOutAction --> AuthJS

    AuthJS --> Credentials[Credentials provider]
    Credentials --> UserLookup[getUserFromDb]
    UserLookup --> PrismaUser
    Credentials --> Password[verifyPassword / scrypt]
    AuthJS --> JWTCookie[JWT session cookie]

    RootLayout[RootLayout server component] --> Auth[auth()]
    Auth --> JWTCookie
    RootLayout --> Header
    Header --> Refresh[router.refresh()]
    Refresh --> RootLayout
```

## Где начинается auth-flow

### `RootLayout`

Файл: [`src/app/layout.tsx`](../../src/app/layout.tsx)

`RootLayout` — асинхронный Server Component. Это оправдано: ему нужно одновременно получить:

```ts
const [session, locale, messages, t] = await Promise.all([
    auth(),
    getLocale(),
    getMessages(),
    getTranslations("site"),
]);
```

Полученная `session` передаётся в `<Header session={session} />`. Поэтому Header не читает auth-состояние через `useSession`, а получает его из серверного дерева. `RootLayout` становится динамическим server-rendered маршрутом, что ожидаемо для cookie-based session.

`Providers` содержит только клиентские провайдеры темы и локализации. `SessionProvider` не используется — для выбранной схемы JWT + server `auth()` он не нужен.

### `Header` и `HeaderActions`

Файлы:

- [`src/components/UI/Header/Header.tsx`](../../src/components/UI/Header/Header.tsx)
- [`src/components/UI/Header/HeaderActions.tsx`](../../src/components/UI/Header/HeaderActions.tsx)

`Header` хранит только UI-состояние:

- `isMenuOpen` — состояние мобильного меню;
- `authMode` — `null`, `signIn` или `registration`;
- `pathname` — текущий путь для навигации.

При открытии auth-модалки мобильное меню закрывается. Desktop- и mobile-экземпляры `HeaderActions` используют один и тот же `session` и одни и те же callback-и.

Если сессии нет, отображаются кнопки «Войти» и «Зарегистрироваться». Если сессия есть, отображаются:

```ts
session?.user?.name ?? session?.user?.email
```

и кнопка выхода.

После успешного входа или регистрации `Header` закрывает модалку и вызывает `router.refresh()`. После выхода `HeaderActions` также вызывает `router.refresh()`. Refresh повторно выполняет серверный `RootLayout`, который читает уже изменившуюся cookie и передаёт актуальную сессию.

## Клиентская часть форм

### Единая модалка

Файлы:

- [`src/features/auth/ui/AuthModal.tsx`](../../src/features/auth/ui/AuthModal.tsx)
- [`src/components/common/CustomModal.tsx`](../../src/components/common/CustomModal.tsx)

`AuthModal` — controlled component. Открытость определяется выражением `mode !== null`. Внутри одновременно монтируется только одна форма:

- `mode === "signIn"` → `SignInForm`;
- `mode === "registration"` → `RegistrationForm`.

У форм разные React `key`, поэтому переход между режимами размонтирует старую форму и сбрасывает её значения, ошибки и pending-состояние. Overlay при этом остаётся открытым.

`CustomModal` отвечает только за HeroUI presentation: backdrop, container, dialog, close trigger и responsive full-screen режим на мобильном. Он не знает о Prisma, Auth.js и правилах валидации.

### Общий hook `useAuthForm`

Файл: [`src/features/auth/ui/useAuthForm.ts`](../../src/features/auth/ui/useAuthForm.ts)

Hook является auth-specific orchestration layer для двух небольших форм. Он хранит:

- текущие `values`;
- touched-поля;
- ошибки полей;
- общий `formError`;
- `isPending`;
- идентификатор submit для игнорирования устаревшего ответа после размонтирования или переключения режима.

Поведение:

1. При `blur` валидируется соответствующее поле.
2. При изменении уже touched-поля его ошибка пересчитывается.
3. Изменение `password` также пересчитывает ошибку `confirmPassword`, если это поле уже было затронуто.
4. При submit валидируется вся форма.
5. Если есть ошибки, все поля помечаются touched, а фокус переносится на первое невалидное поле.
6. При успешном ответе вызывается `onSuccess`.
7. При ошибочном ответе Server Action ошибки поля добавляются в форму, а `formError` показывается отдельным alert.
8. Пока запрос pending, повторный submit блокируется, а поля и submit-кнопка disabled/pending.

### Правила входа

Файл: [`src/features/auth/ui/SignInForm.tsx`](../../src/features/auth/ui/SignInForm.tsx)

Поля:

- `email`, `type="email"`, `autoComplete="email"`;
- `password`, `type="password"`, `autoComplete="current-password"`.

Вход требует валидный email и непустой пароль. Правила сложности регистрационного пароля на вход не распространяются: уже существующий пароль может быть коротким с точки зрения текущей registration policy.

### Правила регистрации

Файл: [`src/features/auth/ui/RegistrationForm.tsx`](../../src/features/auth/ui/RegistrationForm.tsx)

Поля:

- `email`;
- `password` с `autoComplete="new-password"`;
- `confirmPassword` с `autoComplete="new-password"`.

Пароль регистрации должен:

- содержать минимум 8 символов;
- содержать максимум 32 символа;
- содержать хотя бы одну заглавную латинскую букву;
- содержать хотя бы одну цифру;
- совпадать с `confirmPassword`.

## Общие схемы и сообщения

Файлы:

- [`src/features/auth/model/auth.schemas.ts`](../../src/features/auth/model/auth.schemas.ts)
- [`src/features/auth/model/auth.types.ts`](../../src/features/auth/model/auth.types.ts)
- [`src/i18n/messages/en.json`](../../src/i18n/messages/en.json)
- [`src/i18n/messages/ru.json`](../../src/i18n/messages/ru.json)

Zod-схемы создаются функциями `createSignInSchema()` и `createRegistrationSchema()`. Типы `SignInValues` и `RegistrationValues` выводятся из этих схем, поэтому типы client submit и server actions не дублируют структуру payload.

Email сначала trim-ится и приводится к lowercase. Ошибки Zod используют ключи вроде `invalidEmailError`, а `zodIssuesToFieldErrors` преобразует их в локализованный текст через `next-intl`. Ошибки поля объединяются через перевод строки, что позволяет показать несколько нарушений password policy в одном `FieldError`.

Пользовательские тексты находятся в message catalogs в namespace-ах `auth`, `validation` и `serverErrors`. В production auth-коде нет захардкоженных английских или русских сообщений. Строки в тестах — это ожидаемые значения UI, а не источник runtime-copy.

## Регистрация: пошаговый поток

### 1. Открытие формы

Пользователь нажимает «Зарегистрироваться» в desktop- или mobile-header. `Header` устанавливает `authMode = "registration"`, а `AuthModal` показывает `RegistrationForm`.

### 2. Клиентская валидация

`RegistrationForm` передаёт в `useAuthForm` `createRegistrationSchema()` и Server Action `registerUser`. При корректном submit в action передаются только parsed values:

```ts
{
    email,
    password,
    confirmPassword,
}
```

`email` в parsed values уже очищен от внешних пробелов и приведён к lowercase общей email-схемой.

### 3. Серверная валидация

Файл: [`src/features/auth/api/register.action.ts`](../../src/features/auth/api/register.action.ts)

Server Action имеет top-level `"use server"`. Он заново получает локализованные переводчики `validation` и `serverErrors`, создаёт тот же registration schema и выполняет `safeParse(values)`. Во время parsing email trim-ится и приводится к lowercase, поэтому сервер не доверяет регистру или пробелам из client payload.

Если payload невалиден, action сразу возвращает:

```ts
{
    status: "error",
    fieldErrors: {...}
}
```

Браузерная проверка не является границей безопасности: серверная проверка выполняется независимо от UI.

### 4. Проверка email и создание пользователя

После server parsing используется нормализованный `validationResult.data.email`:

```ts
prisma.user.findUnique({ where: { email } })
```

Если пользователь найден, возвращается ошибка поля `email`, а создание и sign-in не выполняются.

Если пользователя нет, пароль перед записью обрабатывается `hashPassword`.

Файл: [`src/features/auth/lib/password.ts`](../../src/features/auth/lib/password.ts)

Алгоритм:

1. генерируется случайная соль длиной 16 байт;
2. соль преобразуется в 32-символьную hex-строку;
3. `scrypt(password, salt, 64)` создаёт derived key;
4. в БД сохраняется строка формата `salt:derivedKey`, то есть 32 hex-символа, двоеточие и 128 hex-символов.

Открытый пароль в БД не сохраняется. `verifyPassword` проверяет формат строки, повторно вычисляет ключ и сравнивает байты через `timingSafeEqual`.

После хеширования выполняется:

```ts
prisma.user.create({
    data: { email, password: hashedPassword },
})
```

### 5. Защита от дубликата

Есть два уровня:

- предварительный `findUnique` для обычного случая;
- обработка Prisma-кода `P2002` для гонки, когда два запроса одновременно создают один email.

В обоих случаях клиент получает `fieldErrors.email` с локализованным сообщением.

### 6. Автоматический вход

После успешного `user.create` action вызывает:

```ts
await signIn("credentials", {
    email,
    password,
    redirect: false,
});
```

Здесь используется исходный открытый пароль только для передачи в Auth.js после записи хэша; в Prisma он не передаётся. Auth.js снова проходит через Credentials provider, проверяет сохранённый хэш и формирует JWT-сессию.

После успешного action клиент закрывает модалку и делает `router.refresh()`. Серверный layout видит новую сессию, а Header начинает показывать email пользователя.

### Ошибка после создания пользователя

Важно: создание пользователя и автоматический sign-in не объединены в транзакцию. Если `user.create` успешно завершился, а последующий `signIn` упал, пользователь уже существует, но action вернёт общий `registrationFailedError`. Повторная попытка регистрации может после этого показать ошибку дубликата email. Это реальный edge case текущей реализации.

## Вход: пошаговый поток

### 1. Server Action `loginUser`

Файл: [`src/features/auth/api/signin.action.ts`](../../src/features/auth/api/signin.action.ts)

Action:

1. получает `values` из формы;
2. на сервере проверяет `createSignInSchema()`;
3. при невалидном payload возвращает `fieldErrors`;
4. при валидном payload вызывает `signIn("credentials", { redirect: false })`; email передаётся уже в нормализованном lowercase-виде;
5. преобразует ожидаемые `AuthError` типов `CredentialsSignin` и `CallbackRouteError` в локализованный `formError`;
6. неожиданные ошибки пробрасывает выше, чтобы UI показал общий fallback `genericFormError`.

### 2. Credentials provider в `auth.ts`

Файл: [`src/features/auth/auth.ts`](../../src/features/auth/auth.ts)

Auth.js получает конфигурацию через async factory. Это позволяет получить локализованные label-ы полей Credentials provider через `getTranslations("auth")`.

`authorize` выполняет следующий алгоритм:

1. проверяет credentials через `createSignInSchema()`; schema trim-ит и приводит email к lowercase;
2. при ошибке возвращает `null`;
3. вызывает `getUserFromDb({ email })`;
4. получает из БД пользователя вместе с password hash;
5. проверяет введённый пароль через `verifyPassword`;
6. при отсутствии пользователя или неправильном пароле возвращает `null`;
7. при успехе возвращает только безопасное представление пользователя: `id`, `email`, `name`, `image`.

Файл [user lookup helper](../../src/utils/user.ts) явно ограничивает `select` и не возвращает лишние поля из Prisma query наружу. Сам hash нужен только внутри server-side проверки.

### 3. JWT session

В конфигурации указано:

```ts
session: {
    strategy: "jwt",
    maxAge: 3600,
}
```

Это означает, что текущая session state кодируется в подписанный JWT-cookie Auth.js и имеет срок жизни один час. Таблица `Session` не используется как хранилище сессий при этой strategy.

JWT callback добавляет `token.id = user.id` при первичном входе. Сейчас это поле не преобразуется отдельным `session` callback и не используется в UI. Для текущего Header достаточно стандартных `session.user.email` и `session.user.name`.

## Выход

Файлы:

- [`src/features/auth/api/signOut.action.ts`](../../src/features/auth/api/signOut.action.ts)
- [`src/components/UI/Header/HeaderActions.tsx`](../../src/components/UI/Header/HeaderActions.tsx)

`signOutUser` — Server Action, который вызывает:

```ts
await signOut({ redirect: false });
```

`HeaderActions`:

1. не запускает повторный выход, если `isSigningOut === true`;
2. включает pending/disabled состояние;
3. вызывает Server Action;
4. после завершения вызывает `onAuthChange` → `router.refresh()`;
5. после обновления получает guest-state из `auth()` в `RootLayout`.

На desktop и mobile рендерятся два экземпляра `HeaderActions`, поэтому у каждого свой локальный `isSigningOut`. Это не даёт повторно нажать одну и ту же кнопку, но теоретически не является глобальным lock между двумя одновременно видимыми экземплярами.

## Разбор `auth.ts`

### Провайдер

Используется только `Credentials` provider. OAuth-провайдеров нет, поэтому регистрация создаёт пользователя сама через `registerUser`, а вход не делегирует создание пользователя Auth.js.

### PrismaAdapter

Конфигурация передаёт `PrismaAdapter(prisma)`, но одновременно выбирает `session.strategy = "jwt"`. Это допустимая, но гибридная схема:

- Prisma используется для пользователя и поиска credentials;
- JWT используется для session;
- database session из таблицы `Session` не создаётся для текущего credentials-flow;
- модели Auth.js в Prisma подготовлены для будущих adapter-based сценариев.

Поэтому сам факт наличия `PrismaAdapter` не означает, что текущая сессия записывается в `Session`.

### Экспортируемые значения

`NextAuth(...)` экспортирует:

- `auth` — используется в `RootLayout`;
- `signIn` — используется в `loginUser` и `registerUser`;
- `signOut` — используется в `signOutUser`;
- `handlers` — в текущем коде не импортируется и не подключён к Route Handler.

В `src/app` нет `api/auth/[...nextauth]/route.ts`. Для выбранного server-action сценария это намеренно: UI вызывает server-only `signIn`/`signOut` напрямую. Если позже появятся browser callback-и OAuth, внешний API Auth.js или стандартные HTTP auth endpoints, `handlers` потребуется подключить отдельно.

### Secret

Используется `AUTH_SECRET` с fallback на `NEXTAUTH_SECRET`. Сам секрет не хранится в документе и не выводится. Для production необходимо гарантировать наличие стабильного секрета; текущий код не содержит отдельной явной проверки инициализации.

## Prisma и база данных

### Runtime-клиент

Файл: [Prisma runtime client](../../src/utils/prisma.ts)

Runtime-клиент создаётся через Prisma 7 generated client и `withAccelerate()`:

- приложение читает `ACCELERATE_DATABASE_URL`;
- URL должен быть Prisma Accelerate URL вида `prisma+postgres://...`;
- один экземпляр сохраняется в `globalThis` вне production для защиты от лишних клиентов при hot reload.

`DATABASE_URL` из `prisma.config.ts` предназначен для Prisma CLI и миграций. README отдельно предупреждает не использовать Accelerate URL для миграций.

### Модели

`prisma/schema.prisma` содержит:

- `User`: `id`, `email`, обязательный `password`, optional `name`, `emailVerified`, `image`;
- `Account`, `Session`, `VerificationToken`, `Authenticator` — модели Prisma Adapter/Auth.js.

Основной credentials-flow фактически использует `User`, особенно `email` и `password`. Остальные модели подготавливают схему к расширению Auth.js.

### Миграции

Порядок миграций:

1. `0_init` создаёт `users` с уникальным email;
2. `20260721232014_add_user_password` добавляет обязательный `password`;
3. `20260724070000_add_authjs_models` добавляет `name`, `emailVerified`, `image` и Auth.js-таблицы.

`prisma validate` проходит. Но в текущей сессии `prisma migrate status` завершился ошибкой schema engine при обращении к `db.prisma.io:5432`, поэтому факт применения миграций к удалённой БД этим анализом не подтверждён.

## Границы ответственности

Распределение слоёв сейчас выглядит последовательно:

| Слой | Ответственность |
| --- | --- |
| `Header` / `AuthModal` | открытие, закрытие и переключение форм |
| `SignInForm` / `RegistrationForm` | поля, accessibility, отображение ошибок |
| `useAuthForm` | client validation, pending, focus, submit contract |
| `auth.schemas.ts` | единые правила payload и типы ошибок |
| `register.action.ts` / `signin.action.ts` | server validation и orchestration mutation/auth |
| `auth.ts` | Auth.js config, Credentials authorize, JWT session |
| `src/utils/user.ts` | минимальный Prisma user lookup |
| `password.ts` | hash/verify password |
| `src/utils/prisma.ts` | Prisma client и Accelerate connection |
| `RootLayout` | чтение текущей сессии и передача её в Header |

Prisma и Node crypto не импортируются в client components. Client components знают только submit contract Server Actions. Это соответствует server-only границе.

## Что уже хорошо покрыто

Тесты проверяют:

- обе Zod-схемы и преобразование ошибок;
- `scrypt` hash/verify и отказ на malformed hash;
- Credentials `authorize`, поиск по email и проверку пароля;
- регистрацию с server validation, hash, duplicate precheck, `P2002` и автоматическим sign-in;
- вход с valid payload, client/server validation и обработкой Auth.js error;
- переключение auth-режимов и сброс старой формы;
- focus первого невалидного поля;
- pending и блокировку повторного submit;
- Header для guest/authenticated state;
- email fallback вместо отсутствующего user name;
- refresh после выхода;
- блокировку повторного sign-out;
- desktop/mobile открытие модалки и переключение локали.

Проверка в текущем checkout:

- `npm test -- --run`: 10 test files, 37 tests passed;
- `npx tsc --noEmit`: passed;
- `npm run lint`: passed;
- `npx prisma validate`: passed;
- `npm run build`: passed после запуска вне sandbox; первая попытка внутри sandbox упала на ограничении Turbopack `Operation not permitted`.

## Что тесты не доказывают

Unit/component mocks не подтверждают:

- доступность Prisma Accelerate из runtime;
- реальное создание пользователя в PostgreSQL;
- фактическое создание и чтение Auth.js cookie в браузере;
- применение всех миграций к конкретной удалённой БД;
- работу с истёкшим JWT;
- поведение case-insensitive duplicate prevention в реальной БД;
- end-to-end переход от настоящего клика до обновлённого server-rendered Header.

Для полной проверки нужен staging/e2e сценарий с тестовой БД, секретом `AUTH_SECRET` и реальным HTTP/browser runtime.

## Важные замечания и потенциальные улучшения

1. **Нормализация email (реализовано).** Общая email-схема в [`src/features/auth/model/auth.schemas.ts`](../../src/features/auth/model/auth.schemas.ts) делает `trim` и `toLowerCase`. Поскольку эту схему используют client/server registration, login action и Credentials `authorize`, один и тот же нормализованный email применяется перед lookup, create и sign-in. Тесты проверяют mixed-case email в обеих схемах, регистрации, входе и `authorize`. Старых mixed-case записей в удалённой БД нет, поэтому отдельный backfill для этого изменения не требуется.

2. **Ошибка между create и sign-in.** Как описано выше, пользователь может быть создан, а автоматический вход — не завершиться. Нужен осознанный UX/операционный сценарий: либо отдельная обработка ошибки sign-in, либо повторный обычный вход, либо компенсационная логика.

3. **Обязательный `User.password` и будущие OAuth-провайдеры.** При подключении OAuth Prisma Adapter сможет пытаться создать пользователя без credentials password, а текущая схема требует `password`. До добавления OAuth нужно изменить модель/поток, например сделать password nullable или разделить credentials-данные и базового пользователя.

4. **Избыточность Adapter при JWT.** Для текущего Credentials + JWT flow PrismaAdapter не нужен для хранения сессии, но он оправдан как подготовка к Auth.js-моделям и будущим провайдерам. Если проект останется только credentials-only, конфигурацию можно упростить после отдельного решения о судьбе Auth.js tables.

5. **`token.id` пока не используется.** JWT callback добавляет id, но `session` callback не переносит его в `session.user`. Если серверным функциям понадобится user id через session, потребуется типовая module augmentation и явный `session` callback.

6. **Защищённых маршрутов пока нет.** `auth()` используется для отображения Header, но страницы `/`, `/ingredients` и `/about` не проверяют наличие сессии. Сейчас авторизация меняет UI, но не ограничивает доступ к отдельным server operations или страницам.

7. **Дублированные mobile/desktop actions.** Блокировка выхода локальна для конкретного `HeaderActions`. При необходимости единого глобального pending-state его следует поднять в `Header`.

## Итоговая оценка

Архитектура текущего credentials-flow в целом собрана корректно: client/server validation разделены, пароль не хранится открытым текстом, регистрация защищена от обычного duplicate и гонки `P2002`, Auth.js проверяет пароль через отдельный server-only слой, а session state проходит через server `RootLayout` без `SessionProvider`.

Главное ограничение подтверждения — не кодовая ошибка, а отсутствие успешной проверки удалённой schema engine в текущей среде. Главные технические follow-up риски — неатомарность `create → signIn`, обязательный password для будущего OAuth и то, что `handlers` экспортированы, но пока намеренно не используются.
