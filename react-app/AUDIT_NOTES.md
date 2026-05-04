# React Migration Audit Notes

## Глобальний рефакторинг контекстного меню та asset bundling

### Проблема
Користувач повідомив, що контекстне меню (right-click на десктопі, long-press на мобілі) перестало працювати на обох платформах. Тестування показало, що ні `handleContextMenu` на React div, ні нативні `map.on('contextmenu')` в mapCore.js не спрацьовували. Паралельно виявлено **404 помилки** для двох assets: `drone-icon.svg` і `RC_Sticks_Animation.json`.

### Кореневі причини

#### A. Архітектурна: Double-hop pattern (JS → React → JS)
**Файли**: `src/map/mapCore.js`, `src/map/mapMarkers.js`, `src/pages/MapSpotSave.tsx`

Контекстне меню використовувало anti-pattern:
1. Vanilla JS під час ініціалізації реєструє `map.on('contextmenu')` / `map.on('pointerdown')` та marker listeners
2. Ці listeners викликають React callback `onContextMenu(payload)` через стан
3. React оновлює state через `setContextMenu()`
4. Результат: три переходи контексту + stale closure ризик у маркерів, які мали замикання на старий React state

Додатково, якщо **будь-яка з 6 CDN-плагінів** (locate, fullscreen, scale, geocoder, measure, rainviewer) тихо не завантажилась, `addPlugins()` в `mapCore.js:31` кидала exception **перед** реєстрацією `map.on('contextmenu')` на рядку 58 → меню ніколи не реєструвалось.

#### B. Asset bundling: Runtime-relative paths
**Файли**: `src/map/mapMarkers.js`, `src/components/StickAnimation.tsx`

```js
// OLD
iconUrl: './img/drone-icon.svg'          // Шукає від HTML-файлу, не від модуля
animationData: './animations/RC_Sticks_Animation.json' // Те саме
```

При `base: './'` у vite.config.ts і URL на `/MudFPVAssistant/map-spot-save` браузер шукає:
- `/MudFPVAssistant/map-spot-save/img/drone-icon.svg` (relative до поточної сторінки) → 404
- `/MudFPVAssistant/map-spot-save/animations/RC_Sticks_Animation.json` → 404

Правильні шляхи були б:
- `/MudFPVAssistant/img/drone-icon.svg`
- `/MudFPVAssistant/animations/RC_Sticks_Animation.json`

Але це залежало б від структури деплою, що непрактично.

### Рішення

#### 1. Перенесення assets у `src/assets/` і імпорт через Vite
**Зміни**:
- Скопійовано `public/img/drone-icon.svg` → `src/assets/drone-icon.svg`
- Скопійовано `public/animations/RC_Sticks_Animation.json` → `src/assets/RC_Sticks_Animation.json`
- Видалено з `public/` (більше не потрібні)

**Вплив**: Vite при build розраховує хешовані URL з правильним `base` префіксом, незалежно від структури деплою.

#### 2. Переписання контекстного меню як React-first (видалення double-hop)
**Видалено з `src/map/mapCore.js`**:
- `map.on('contextmenu', ...)` listener (рядки ~42-51)
- `container.addEventListener('pointerdown')` / `pointermove` / `pointerup` для long-press (рядки ~56-77)
- `map.on('click', ...)` для закриття меню

**Видалено з `src/map/mapMarkers.js`**:
- `m.on('contextmenu', ...)` listener
- `m.on('pointerdown', ...)` listener
- Зберігання `m.spotId = spot.id` (властивість Leaflet-об'єкта, недосяжна з React)

**Додано в `src/map/mapMarkers.js`**:
```js
// Після m.addTo(map)
if (m._icon && spot.id) m._icon.dataset.spotId = spot.id;
if (m._shadow && spot.id) m._shadow.dataset.spotId = spot.id;
```
DOM data attribute — ідіоматичний способ для React ідентифікувати елемент через `event.target.closest()`.

**Додано в `src/pages/MapSpotSave.tsx`**:

a) Desktop right-click через React `onContextMenu`:
```tsx
const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
  e.preventDefault();
  const map = mapInstanceRef.current;
  if (!map) return;
  const markerEl = (e.target as HTMLElement).closest('.leaflet-marker-icon, .leaflet-marker-shadow');
  const latlng = map.mouseEventToLatLng(e.nativeEvent);
  setContextMenu({
    x: e.clientX,
    y: e.clientY,
    lat: latlng.lat,
    lng: latlng.lng,
    isPoint: markerEl !== null,
    spotId: markerEl?.dataset.spotId ?? null,
  });
};
<div id="fpvMap" onContextMenu={handleContextMenu} ... />
```

b) Touch long-press через `useEffect` з native listeners:
```tsx
useEffect(() => {
  const div = mapRef.current;
  if (!div || !mapReady) return;

  let timer: number | null = null;
  let startX = 0, startY = 0, startTarget: EventTarget | null = null;

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    startX = e.clientX;
    startY = e.clientY;
    startTarget = e.target;
    timer = window.setTimeout(() => {
      openContextMenuFromEvent(e.clientX, e.clientY, startTarget, e);
    }, 600);
  };

  const onMove = (e: PointerEvent) => {
    if (timer === null) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
      clearTimeout(timer);
      timer = null;
    }
  };

  div.addEventListener('pointerdown', onDown);
  div.addEventListener('pointermove', onMove);
  div.addEventListener('pointerup', () => { if (timer !== null) clearTimeout(timer); });
  div.addEventListener('pointercancel', () => { if (timer !== null) clearTimeout(timer); });

  return () => {
    if (timer !== null) clearTimeout(timer);
    div.removeEventListener('pointerdown', onDown);
    div.removeEventListener('pointermove', onMove);
    // ...등
  };
}, [mapReady]);
```

#### 3. Укріплення `src/map/mapPlugins.js` від мовчазних CDN-помилок
**Додано**:
```js
function safe(name, fn) {
  try {
    fn();
  } catch (err) {
    console.warn(`[map] plugin "${name}" failed to initialize:`, err);
  }
}
```

Кожен `L.control.X(...).addTo(map)` тепер обгорнутий:
```js
safe('locate', () => {
  L.control.locate({ ... }).addTo(map);
});
// ... для всіх 6 плагінів
```

Результат: якщо один CDN тихо не завантажиться, карта продовжує працювати, контекстне меню ініціалізується нормально.

### Архітектурні переваги нового підходу

1. **Single source of truth**: Стан контекстного меню живе в React (`MapSpotSave.tsx`), не розсипаний між JS модулями
2. **No stale closures**: Нові маркери не мають старих замикань на попередній стан
3. **React DevTools debugging**: Медіа меню state видно в React DevTools, можна інспектувати під час роботи
4. **Resilient**: Невдалі плагіни більше не ламають ініціалізацію меню
5. **Idiomatic**: DOM data attributes замість Leaflet-властивостей — звичний паттерн для React

### Файли змінені

| Файл | Тип змін |
|------|----------|
| `src/assets/drone-icon.svg` | Нова локація (скопійовано з `public/img/`) |
| `src/assets/RC_Sticks_Animation.json` | Нова локація (скопійовано з `public/animations/`) |
| `src/map/mapMarkers.js` | Імпорт через Vite, DOM data attribute замість listener |
| `src/map/mapCore.js` | Видалено весь контекстне-меню код |
| `src/map/mapPlugins.js` | Обгорнуто в try/catch `safe()` wrapper |
| `src/pages/MapSpotSave.tsx` | Desktop/mobile контекстне меню обробка в React |
| `src/components/StickAnimation.tsx` | Імпорт JSON через Vite замість fetch |

---

## Виправлені баги (попередні коміти)

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
**Статус**: ✅ ВИРІШЕНО в глобальному рефакторингу  
**Файл**: `src/map/mapPlugins.js`, рядок 57  
**Рішення**: Використовується `link.removeAttribute('href')` — правильний підхід, не потребує подальших змін.

---

### H. FlightInfo.tsx — зайвий alias `selectedDateStr`
**Файл**: `src/pages/FlightInfo.tsx`, рядок 46  
**Проблема**: `const selectedDateStr = selectedDate;` — буквальний alias без трансформації. Викликає легку плутанину.  
**Рекомендація**: Видалити `selectedDateStr` і використовувати `selectedDate` скрізь.

---

### I. mapMarkers.js — іконка drone-icon.svg через відносний шлях
**Статус**: ✅ ВИРІШЕНО в глобальному рефакторингу  
**Файл**: `src/map/mapMarkers.js`  
**Рішення**: 
- Перенесено `drone-icon.svg` з `public/img/` → `src/assets/drone-icon.svg`
- Додано: `import droneIconUrl from '../assets/drone-icon.svg'`
- Результат: Vite генерує правильний хешований URL з префіксом `base` незалежно від структури деплою

---

### J. Bundle size — 1.4 MB chunk
**Файл**: `vite.config.ts`  
**Проблема**: Основний chunk `index-*.js` = 1.4 MB (421 KB gzipped). Recharts + Mantine + Firebase — все в одному chunk.  
**Рекомендація**: Використати code-splitting: lazy load `FlightStats`, `MapSpotSave` (вже lazy через dynamic import mapCore), `Utilities`.
