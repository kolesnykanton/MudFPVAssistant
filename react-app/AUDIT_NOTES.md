# React Migration Audit Notes

## Виправлені баги (цей коміт)

### 1. mapCore.js — подвійний контекстний timer на мобільному (mobile context menu conflict)
**Файл**: `src/map/mapCore.js`  
**Проблема**: Нативний `pointerdown` бабблиться від DOM-елемента маркера до container. Коли користувач робить long-press на маркері, запускалось два таймери одночасно:
- `markerTimer` (з mapMarkers.js) → `isPoint: true`
- `longPressTimer` (container) → `isPoint: false`

Обидва мали однаковий timeout 600ms. `markerTimer` ставився першим (target phase) → виконувався першим → але потім `containerCallback` перезаписував стан з `isPoint: false`. Користувач бачив "Add spot" замість "Edit spot".

**Виправлення**: Перевірка `.target.closest('.leaflet-marker-icon, .leaflet-marker-shadow')` на початку container listener — якщо тач починається на маркері, skip.  
**Додатково**: `map.mouseEventToLatLng(e)` перенесено з тіла timeout назовні (на момент pointerdown позиція актуальна, через 600ms об'єкт події — snapshot, так що значення ті самі, але явно правильніше).

---

### 2. Firebase persistence не працювала (init order bug)
**Файли**: `src/firebase/firebaseConfig.ts`, `src/firebase/init.ts`, `src/main.tsx`  
**Проблема**: `firebaseConfig.ts` імпортується транзитивно через `AuthContext.tsx` та хуки при першому рендері. Під час оцінки модуля викликається `getFirestore(app)` — створює Firestore-інстанс без persistence. Далі `initFirebase()` у `main.tsx` намагається викликати `initializeFirestore(app, { localCache: ... })`, але Firestore вже ініціалізований → throws `failed-precondition` → error мовчки ігнорується → persistence так і не вмикається.

**Виправлення**: Перенесено виклик `initializeFirestore` безпосередньо у `firebaseConfig.ts` (перший модуль що ініціалізує `app`). Тепер послідовність гарантована: `initializeFirestore` завжди викликається до будь-якого `getFirestore`. `init.ts` більше не потрібен — `initFirebase()` прибрано з `main.tsx`.

---

### 3. MapSpotSave.tsx — race condition при async ініціалізації карти (StrictMode)
**Файл**: `src/pages/MapSpotSave.tsx`  
**Проблема**: `useEffect` з пустими deps запускає `import('../map/mapCore.js').then(...)`. У React StrictMode ефекти викликаються двічі (mount → cleanup → mount). При cleanup `mapInstanceRef.current` ще null (dynamic import не завершився). Друга ітерація знову стартує import. Якщо обидва promise вирішуються, обидва `then`-колбеки викликають `mod.createMap('fpvMap', ...)` → Leaflet кидає `Map container is already initialized`.

**Виправлення**: Флаг `cancelled` в замиканні — `cleanup` встановлює `cancelled = true`, `then`-колбек перевіряє його перед `createMap`.

---

## Відкриті проблеми (потребують окремого агента / рішення)

### A. Home.tsx — відсутній AbortController для fetch погоди
**Файл**: `src/pages/Home.tsx`, рядки 43-69  
**Проблема**: `navigator.geolocation.getCurrentPosition` + `fetch` не мають cleanup при unmount. Якщо користувач переходить на іншу сторінку поки fetch виконується, `setWeather`/`setWeatherError` викликаються на демонтованому компоненті (не crash в React 18, але логіка може зламатись якщо компонент переходить у нейтральний стан).  
**Рекомендація**: Обгорнути fetch в `AbortController`, повернути `() => controller.abort()` з useEffect. Геолокацію зупинити не можна, але можна ігнорувати колбек через mounted-флаг.

---

### B. Settings.tsx — onBlur зберігає неповні дані
**Файл**: `src/pages/Settings.tsx`, рядки 16-18, 30, 40  
**Проблема**: Обидва TextInput мають `onBlur={handleSave}`. Якщо користувач вводить OpenWeather ключ і натискає Tab → `handleSave` спрацьовує з порожнім `googleMapsKey`. Сценарій: першу секунду при завантаженні `settings` async, `useEffect` sync → місце де ключ міг би не встигнути підтягнутись. Виправлено в поточній реалізації через `useEffect([settings])`, але double-save при переході між полями зайвий.  
**Рекомендація**: Видалити `onBlur` з TextInput, залишити лише кнопку Save.

---

### C. Home.tsx — завантаження повного списку FlightSpots тільки для лічильника
**Файл**: `src/pages/Home.tsx`, рядок 34  
**Проблема**: `useUserCollection<FlightSpot>('FlightSpots')` підписується на весь список спотів через `onSnapshot` тільки щоб показати `spots.length`. При великій кількості спотів це зайвий трафік і пам'ять.  
**Рекомендація**: Зберігати `count` в окремому Firestore-документі (наприклад `users/{uid}/meta/stats`) що оновлюється cloud function або при кожному add/remove. Або хоча б використовувати `getCountFromServer()` замість onSnapshot.

---

### D. Mobile UX — відсутні safe-area insets
**Файл**: `src/layout/MainLayout.tsx`  
**Проблема**: AppShell не враховує `env(safe-area-inset-*)` для пристроїв з notch (iPhone X+). Контент може перекриватись аппаратними елементами.  
**Рекомендація**: Додати до `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
І в CSS:
```css
.mantine-AppShell-navbar { padding-bottom: env(safe-area-inset-bottom); }
.mantine-AppShell-header { padding-top: env(safe-area-inset-top); }
```

---

### E. vite-plugin-pwa — peer dependency conflict з Vite 8
**Файл**: `package.json`  
**Проблема**: `vite-plugin-pwa@^1.2.0` вимагає `vite@^3-7`, але проект має `vite@^8.0.10`. npm install потребує `--legacy-peer-deps`.  
**Рекомендація**: Оновити `vite-plugin-pwa` до версії що підтримує Vite 8, або додати `--legacy-peer-deps` до CI npm install команди.

---

### F. index.html — CDN Leaflet/Lottie скрипти блокують парсинг
**Файл**: `react-app/index.html`, рядки 18-24  
**Проблема**: 6 CDN `<script>` тегів без `defer`/`async` у `<body>` блокують HTML-парсинг. Якщо CDN повільний (або недоступний), сторінка буде порожньою.  
**Рекомендація**: Додати `defer` до кожного CDN скрипту. `window.lottie` і `window.L` гарантовано будуть доступні до виконання `<script type="module">` (модулі завжди defer).

---

### G. mapPlugins.js — `javascript:void(0)` (deprecated)
**Файл**: `src/map/mapPlugins.js`, рядок 43  
**Проблема**: `link.setAttribute('href', 'javascript:void(0)')` — застарілий антипатерн.  
**Рекомендація**: Замінити на `link.removeAttribute('href')` або `link.setAttribute('href', '#')` + `e.preventDefault()`.

---

### H. FlightInfo.tsx — зайвий alias `selectedDateStr`
**Файл**: `src/pages/FlightInfo.tsx`, рядок 46  
**Проблема**: `const selectedDateStr = selectedDate;` — буквальний alias без трансформації. Викликає легку плутанину.  
**Рекомендація**: Видалити `selectedDateStr` і використовувати `selectedDate` скрізь.

---

### I. mapMarkers.js — іконка drone-icon.svg через відносний шлях
**Файл**: `src/map/mapMarkers.js`, рядок 3  
**Проблема**: `iconUrl: './img/drone-icon.svg'` — відносний шлях від HTML-файлу. При `base: './'` у vite.config.ts це залежить від URL деплою. При `<base href="/subpath/">` шлях зламається.  
**Рекомендація**: Імпортувати svg через Vite: `import droneIconUrl from '../assets/drone-icon.svg?url'` і передавати в `addMarker` як параметр.

---

### J. Bundle size — 1.4 MB chunk
**Файл**: `vite.config.ts`  
**Проблема**: Основний chunk `index-*.js` = 1.4 MB (421 KB gzipped). Recharts + Mantine + Firebase — все в одному chunk.  
**Рекомендація**: Використати code-splitting: lazy load `FlightStats`, `MapSpotSave` (вже lazy через dynamic import mapCore), `Utilities`.
