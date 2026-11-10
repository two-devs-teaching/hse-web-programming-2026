# Практика №4. React

На третьей практике мы научили **Todo Today** сохранять задачи в `localStorage`, показывать длинный список порциями и распознавать речь. За интерфейс отвечал `Store`: он находил DOM-элементы, подписывал их на события и вручную пересоздавал список после изменения данных.

Теперь перенесём приложение на React. Пользовательские сценарии останутся знакомыми, но способ построения интерфейса изменится: мы будем описывать его через компоненты и состояние, а обновление DOM поручим React.

На этой практике:

- создадим проект на Vite и разберём файлы его шаблона;
- перенесём разметку в JSX, подключим иконку, шрифт и CSS Modules;
- соберём управляемую форму и компоненты задач;
- вынесем работу с браузерными API в пользовательские хуки;
- разберём `useState`, `useRef`, `useEffect` и назначение `useCallback`;
- проверим сохранение, диктовку, подгрузку и очистку подписок.

## Что понадобится

- Результат [третьей практики](../../hw-3-web-api/notes/NOTES.md) и её [код](../../hw-3-web-api/code).
- Редактор, Node.js, npm и браузер с DevTools.
- Доступ к микрофону для проверки диктовки.
- [Готовая React-реализация](../code) как ориентир и источник больших фрагментов.

Полезные материалы:

- [Vite — официальный сайт](https://vite.dev/).
- [Создание первого проекта Vite](https://vite.dev/guide/#scaffolding-your-first-vite-project).
- [React: быстрый старт](https://react.dev/learn).
- [CSS Modules в Vite](https://vite.dev/guide/features#css-modules).

### Как соотносятся план занятия и готовый код

Разбираем фактическую реализацию в `hw/hw-4-react/code`. [REPORT.md](../code/REPORT.md) полезен как история переноса, но некоторые его ранние описания уже изменились: компоненты перенесены в директории, `StrictMode` убран, а чтение хранилища проверяет только то, что результат — массив, без проверки полей каждой задачи.

| Пункт плана | Что есть в готовой реализации |
| --- | --- |
| Иконка через `public` | Покажем этот способ, затем перейдём к итоговому `src/assets/favicon.png`; папки `public` в демке нет |
| `components/Header` | Шапка находится в `App.jsx`, её стили — в `App.module.css`; выделение `Header` оставим дополнительным упражнением |
| Форма и `Button` | Есть `TodoForm` и обычные `<button>`; отдельного `Button` нет |
| `useForm` | Состояние поля и submit остаются внутри `TodoForm` |
| `useRecognition` | Итоговое имя — `useSpeechRecognition` |
| `useStorage` + `local-storage` | Итоговый файл — `useLocalStorageTodos.js`; внутри находятся и React-состояние, и чтение/запись |
| `useEffect (?)` | Обязательная часть разбора: эффекты подключают и отключают внешние API |

## 1. Создадим проект на Vite

### 1.1. Что делает Vite

React описывает интерфейс, а Vite организует разработку и сборку: запускает dev-сервер, обрабатывает JSX, CSS и импорты ресурсов, обновляет страницу при изменении исходников и создаёт production-сборку. На предыдущей практике эту роль выполнял Parcel. Обзор возможностей — на [сайте Vite](https://vite.dev/).

Для новой реализации создадим отдельную папку. Команды ниже выполняются из корня учебного репозитория; `todo-react-practice` — новая рабочая копия для лайвкодинга, не готовая демка:

```bash
node --version
npm --version
npm create vite@latest todo-react-practice -- --template react --eslint
cd todo-react-practice
npm install
npm run dev
```

Выбираем JavaScript + React. Флаг `--eslint` явно выбирает ESLint: он поддерживается проверенной для занятия версией `create-vite` 9.3.4; без него этот генератор использует Oxlint. Версия `@latest` со временем меняется, поэтому список опций можно проверить через `npm create vite@latest -- --help`.

Не запускайте генератор поверх заполненной папки `hw/hw-4-react/code`. Если хотите только открыть готовое приложение, из корня репозитория выполните:

```bash
cd hw/hw-4-react/code
npm install
npm run dev
```

Далее команды npm выполняем в выбранной папке приложения, рядом с `package.json`. Открываем именно адрес из терминала: если порт занят, он может измениться. Требования к Node.js сверяем с [руководством запуска Vite](https://vite.dev/guide/#scaffolding-your-first-vite-project), а не со старой инструкцией к Parcel.

**Проверка:** стартовая страница открывается, счётчик реагирует на клик, изменение текста в `App.jsx` появляется в браузере.

### 1.2. Разберём все файлы бойлерплейта

Бойлерплейт — минимальный готовый проект, в котором уже связаны точка входа, React, сборщик и инструменты проверки. Ниже состав JavaScript-шаблона, проверенного для занятия, с выбором ESLint. Это не универсальный список для любого шаблона Vite: TypeScript-вариант и другие версии генератора могут отличаться.

```text
todo-react-practice/
├── .gitignore
├── README.md
├── package.json
├── index.html
├── vite.config.js
├── eslint.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── App.css
    ├── index.css
    └── assets/
        ├── react.svg
        ├── vite.svg
        └── hero.png
```

| Файл | Для чего нужен и что с ним делаем |
| --- | --- |
| `.gitignore` | Исключает зависимости, сборку, логи и локальные файлы из Git. Сохраняем |
| `README.md` | Инструкция к шаблону и его инструментам. Для своего проекта заменяем описанием запуска; в демке эту информацию содержит `REPORT.md` |
| `package.json` | Имя проекта, npm-команды, зависимости. `react` описывает компоненты, `react-dom` связывает их с DOM; Vite и линтер нужны при разработке. `type: "module"` включает ESM для JS-файлов пакета |
| `index.html` | HTML-документ в корне проекта: метаданные, favicon, `#root` и подключение `src/main.jsx`. Это вход Vite, а не файл в `public` |
| `vite.config.js` | Конфигурация Vite с `@vitejs/plugin-react`. Сохраняем; папка `app` не требует отдельной настройки |
| `eslint.config.js` | Конфигурация анализа JS/JSX, правил React Hooks и Fast Refresh. Не отвечает за оформление страницы |
| `public/favicon.svg` | Иконка вкладки демонстрационного сайта. Заменяем своей и обновляем `index.html` |
| `public/icons.svg` | SVG-спрайт стартовой страницы: отдельные символы подключаются через `<use href="/icons.svg#…">`. После удаления демо не нужен |
| `src/main.jsx` | Запускает React через `createRoot`, импортирует `App` и начальные стили. В шаблоне оборачивает приложение в `StrictMode` |
| `src/App.jsx` | Демонстрационный компонент со счётчиком, иллюстрацией и ссылками. Заменяем на Todo Today и переносим в `src/app/App.jsx` |
| `src/App.css` | Стили демонстрационного компонента. Удаляем после замены демо; новые стили размещаем рядом с компонентами |
| `src/index.css` | Общие стили демонстрационной страницы. Заменяем reset, переменными и базовыми стилями нашего приложения |
| `src/assets/react.svg` | Логотип React, импортируемый демокомпонентом. Убираем вместе с ним |
| `src/assets/vite.svg` | Логотип Vite. Это иллюстрация страницы, не обязательная часть сборщика |
| `src/assets/hero.png` | Подложка демонстрационной иллюстрации. После замены `App` не нужна |

Без `--eslint` в проверенном генераторе вместо `eslint.config.js` появится `.oxlintrc.json`: это настройки Oxlint, а `lint` в `package.json` будет запускать `oxlint`. Наличие такого файла не означает ошибку создания проекта. Для совпадения с демкой используем вариант с ESLint. Состав шаблонов можно сверять с [исходниками create-vite](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react).

Ещё несколько файлов и папок появляются **после команд**, а не являются исходной разметкой шаблона:

| Путь | Когда появляется и зачем нужен |
| --- | --- |
| `package-lock.json` | После npm-установки фиксирует разрешённые версии зависимостей; сохраняем в Git |
| `node_modules/` | После установки содержит пакеты; не редактируем и не добавляем в Git |
| `node_modules/.vite/` | Рабочий кеш Vite; не является исходным кодом |
| `dist/` | После `npm run build` содержит готовую сборку; напрямую не редактируем |

Проверяем четыре команды в `package.json`: `dev` запускает разработку, `lint` проверяет код, `build` собирает приложение, `preview` позволяет локально просмотреть уже созданный `dist`.

### 1.3. Проследим путь от HTML до компонента

В `index.html` остаётся контейнер и модульная точка входа:

```html
<div id="root"></div>
<script type="module" src="/src/main.jsx"></script>
```

Итоговый `src/main.jsx`:

```jsx
import App from './app/App';

import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')).render(<App />);
```

`createRoot` связывает React с контейнером. Внутри него разметкой управляют компоненты. Отдельные `DOMContentLoaded`, `new Store()` и ручной вызов `ui()` больше не нужны.

Обращение к `document` в точке монтирования и передача DOM-узла наблюдателю через `ref` — интеграция с браузером. Ручное создание карточек через `createElement()` и замена их содержимого приложению больше не требуются.

В исходном шаблоне есть `StrictMode`; в итоговой демке его нет. Это инструмент проверки разработки: в частности, он помогает обнаружить отсутствующую очистку эффекта дополнительным циклом setup → cleanup → setup. Удаление обёртки не заменяет правильный cleanup. См. [описание эффектов в React](https://react.dev/reference/react/useEffect).

## 2. Подключим иконку и шрифт

### 2.1. Сравним `public` и `src/assets`

Сначала попробуем вариант из плана занятия: скопируем старую `favicon.png` в `public` новой рабочей копии и зададим в `index.html`:

```html
<link rel="icon" type="image/png" href="/favicon.png" />
```

В URL нет слова `public`: Vite раздаёт содержимое этой папки от корня и копирует его в сборку без изменения имён. Это удобно для ресурсов с фиксированным адресом. Другой способ — импортировать ресурс из `src/assets` и получить его URL от сборщика. Подробнее — [Static Asset Handling](https://vite.dev/guide/assets).

Для совпадения с готовым приложением перенесём иконку в `src/assets/favicon.png`, уберём временную копию из `public` и изменим ссылку:

```html
<link rel="icon" type="image/png" href="/src/assets/favicon.png" />
<title>Todo Today</title>
```

Это адрес исходного ресурса в HTML, обрабатываемом Vite. В JSX импортируем ту же картинку относительно файла компонента:

```jsx
import favicon from '../assets/favicon.png';
```

Оставшиеся демонстрационные favicon и спрайт удаляем после удаления использующей их разметки. Если `public` опустела, она тоже больше не нужна. **Проверка:** во вкладке появилась наша иконка, а Network не показывает 404 для неё.

### 2.2. Подключим Inter

Перенесём из прежнего HTML ссылки на шрифт в `<head>` нового `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
    href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
    rel="stylesheet"
/>
```

Подключение таблицы шрифта ещё не применяет его к странице. В общих стилях сохраняем `--typography-font: 'Inter', 'Courier New', Courier, monospace` и `font-family: var(--typography-font)` у `body`. В готовом коде также есть `button, input { font: inherit; }`, чтобы элементы формы наследовали шрифт.

При недоступности внешнего сервиса сработают запасные шрифты. **Проверка:** в Computed Styles у заголовка и формы выбран Inter, если ресурс загрузился.

## 3. Перенесём страницу в `app` и подключим модульные стили

### 3.1. Начнём со статического компонента

Создадим `src/app/App.jsx`, перенесём reset и общие настройки в `src/app/global.module.css`, а стили контейнера и шапки — в `src/app/App.module.css`. Начальное содержимое `App.jsx`:

```jsx
import favicon from '../assets/favicon.png';

import styles from './App.module.css';
import './global.module.css';

export default function App() {
    return (
        <main className={styles.page}>
            <div className={styles.todoList}>
                <header className={styles.header}>
                    <img src={favicon} alt="" />
                    <h1>Todo Today</h1>
                </header>
            </div>
        </main>
    );
}
```

Компонент — функция с именем с большой буквы, возвращающая описание интерфейса. JSX похож на HTML, но находится внутри JavaScript: вместо `class` пишем `className`, значения выражений помещаем в `{}`, одиночные теги закрываем. В `return` нужен один общий корень; если обёртка в DOM не нужна, можно использовать фрагмент `<>…</>`.

Обновим импорт `App` в `main.jsx` и удалим импорт демонстрационного `index.css`. После этого можно убрать старые `src/App.jsx`, `src/App.css`, `src/index.css` и три иллюстрации шаблона. Не удаляйте файл, пока на него остался импорт.

**Проверка:** на светлом фоне видна шапка Todo Today, а стартового счётчика больше нет.

### 3.2. Как работают CSS Modules

Файл `*.module.css` импортируется как объект соответствий. Например, `.header` доступен как `styles.header`; Vite преобразует локальное имя класса, чтобы оно не конфликтовало с `.header` другого модуля. Поддержка уже встроена в Vite — отдельный пакет для CSS Modules здесь не нужен. См. [документацию](https://vite.dev/guide/features#css-modules).

Основные правила `App.module.css`:

```css
.page {
    display: flex;
    justify-content: center;
}

.todoList {
    position: relative;
    width: 540px;
    min-width: 0;
    margin: 24px;
    display: flex;
    flex-direction: column;
    gap: 32px;
}

.header {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header > img {
    width: 32px;
    height: 32px;
}

.header > h1 {
    font-size: 36px;
    font-weight: var(--typography-weight-bold);
}

@media (max-width: 720px) {
    .todoList {
        margin: 16px;
        padding-bottom: 120px;
    }
}
```

`min-width: 0` помогает flex-элементу сжиматься. Нижние 120 px понадобятся, когда форма закрепится у края мобильного экрана. У `.page` не задаём фиксированную высоту: список должен увеличивать документ.

В [global.module.css](../code/src/app/global.module.css) копируем прежний reset, цветовые и типографические переменные, оформление `html`, `body` и `box-sizing`. Несмотря на расширение `.module.css`, селекторы тегов, `*` и `:root` остаются глобальными: CSS Modules не создаёт Shadow DOM. Поэтому общие правила подключаем один раз, а классы компонентов держим рядом с компонентами.

### 3.3. Где проходит граница компонента

В готовом коде шапка остаётся частью `App`. Для упражнения можно выделить `src/components/Header/index.jsx` и соседний `index.module.css`: перенести туда `<header>`, три правила `.header…` и импорт иконки, исправив его на `../../assets/favicon.png`, затем заменить разметку в `App` на `<Header />`.

Это **дополнительный рефакторинг**, которого нет в демке. Он показывает принцип: компонент объединяет разметку и связанные стили. В основном маршруте оставляем шапку в `App`, а следующим самостоятельным блоком делаем форму.

Итоговые компоненты хранятся в `src/components/<Имя>/index.jsx`; стили лежат рядом в `index.module.css`. Vite разрешает импорт `../components/TodoForm` в файл `index.jsx`. Расширения `.css` и `.png` в импортах сохраняем. Алиас `@/` в конфигурации Vite не настроен, поэтому используем относительные пути.

## 4. Соберём управляемую форму

### 4.1. Перенесём поле и submit в `TodoForm`

В старом `Store` мы читали текст через `event.target.elements.todo.value` и очищали DOM-поле присваиванием. Теперь текст будет храниться в состоянии React.

Создадим `src/components/TodoForm/index.jsx`. Начнём без микрофона:

```jsx
import styles from './index.module.css';

import { useState } from 'react';

export default function TodoForm({ onAdd }) {
    const [title, setTitle] = useState('');

    function handleSubmit(event) {
        event.preventDefault();

        if (onAdd(title)) {
            setTitle('');
        }
    }

    return (
        <div className={styles.field}>
            <form className={styles.form} onSubmit={handleSubmit}>
                <input
                    name="todo"
                    aria-label="New task"
                    value={title}
                    onChange={event => setTitle(event.target.value)}
                />

                <button type="submit">Add</button>
            </form>
        </div>
    );
}
```

`useState('')` возвращает текущее значение и функцию обновления. После `setTitle()` React планирует новый рендер; обычная локальная переменная такой связи с интерфейсом не имеет. Значение в текущем обработчике остаётся снимком его рендера. Подробнее — [useState](https://react.dev/reference/react/useState).

Поле **управляемое**: `value` берётся из состояния, а `onChange` обновляет это состояние после ввода. Если оставить только `value`, поле будет фактически доступно лишь для чтения. Передаём обработчик `onSubmit={handleSubmit}`, а не вызываем `handleSubmit()` во время рендера.

`onAdd` — prop, то есть входной параметр компонента. Форме не нужно знать, где лежат задачи. Она передаёт текст родителю и очищает поле только при результате `true`. `event.preventDefault()` отменяет обычную отправку HTML-формы с перезагрузкой страницы.

Пока списка нет, подключим в `App` временный обработчик:

```jsx
import TodoForm from '../components/TodoForm';
```

Внутри `App`, перед `return`:

```js
function handleAdd(title) {
    if (!title.trim()) {
        return false;
    }

    console.log(title.trim());
    return true;
}
```

После шапки добавим `<TodoForm onAdd={handleAdd} />`. Это временная проверка контракта, позже заменим её настоящим добавлением. **Проверка:** Enter и Add выводят текст в Console и очищают поле; пробелы не проходят, страница не перезагружается.

### 4.2. Перенесём стили формы и кнопок

Создадим [TodoForm/index.module.css](../code/src/components/TodoForm/index.module.css), перенесём туда оформление старого `.todo-list__text-field`, заменив его на `.form`. Ключевые правила:

```css
.form {
    height: 56px;
    max-height: 56px;
    display: flex;
    gap: 4px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.recording {
    opacity: 0.6;
}

.error {
    color: #9d2525;
    line-height: 1.4;
}
```

Полный файл стилей берём из демки: сохраняем фон и скругление поля, тёмные кнопки, состояния `:hover`, `:active`, `:focus-visible`. У поля есть `width: 100%` и `min-width: 0`, чтобы оно сжималось рядом с кнопками. Подготовленные `::placeholder`-стили не добавляют подсказку сами: атрибута `placeholder` в итоговом JSX нет.

На экране до 720 px фиксируется обёртка `.field`, включающая и форму, и сообщение об ошибке:

```css
@media (max-width: 720px) {
    .field {
        position: fixed;
        z-index: 1;
        right: 0;
        bottom: 0;
        left: 0;
        padding: 22px 26px;
        background: var(--color-bg-primary);
        box-shadow: 0 -24px 32px 16px var(--color-bg-primary);
    }

    .form {
        max-height: none;
    }

    .form > input,
    .form > button {
        height: 56px;
    }
}
```

Поэтому нижний отступ списка теперь задан в `App.module.css`; прежний условный отступ через `:has(> .loading-indicator)` больше не используется. **Проверка:** форма закрепляется снизу на узком экране, кнопки не сжимаются по высоте, фокус виден при навигации Tab.

### 4.3. Нужен ли отдельный `Button`

В демке кнопки остаются обычными HTML-элементами, стилизованными через `.form > button`. Если выделять общий `Button` как дополнительное упражнение, его props должны передаваться внутреннему `<button>`: `type`, `onClick`, `disabled`, `className`, `aria-*`, а содержимое — через `children`.

Особенно важно сохранить `type="submit"` у Add и `type="button"` у микрофона. Компонент не должен добавлять лишнюю DOM-обёртку: иначе селектор `.form > button` перестанет совпадать. Для полноценного переиспользования стили кнопки тоже следует перенести в её CSS-модуль. Основной разбор продолжим с фактическими `<button>`.

## 5. Подключим `classnames` и пользовательский хук диктовки

### 5.1. Установим `classnames`

Из папки приложения выполним:

```bash
npm install classnames
```

Это небольшая функция, которая собирает строку CSS-классов, в том числе по условиям. Импортируем её в `TodoForm`:

```js
import classNames from 'classnames';
```

Выражение для будущей кнопки микрофона:

```jsx
className={classNames({ [styles.recording]: isRecording })}
```

Квадратные скобки вычисляют ключ объекта: им станет строка класса из CSS-модуля. Если `isRecording` равно `false`, класс не попадёт в результат. У карточки позже будет постоянный класс и условный. Примеры API — в [документации classnames](https://github.com/JedWatson/classnames).

### 5.2. Что такое пользовательский хук

Пользовательский хук — функция с именем `use…`, которая объединяет React-хуки и возвращает полезный интерфейс. Хуки вызываются на верхнем уровне компонента или другого хука, не внутри условий, циклов и обработчиков событий. Вызов пользовательского хука не создаёт автоматически общее хранилище: разные вызовы имеют собственное состояние.

В плане есть `useForm`, но в текущем `TodoForm` всего одно поле, и его `useState` с `handleSubmit` остаются рядом с JSX. Выделение `useForm` можно сделать позже, когда появится переиспользуемая логика нескольких форм. Здесь вынесем действительно отдельную ответственность — жизненный цикл распознавания речи — в `src/hooks/useSpeechRecognition.js`.

Контракт хука:

```js
const { isRecording, error, startRecording } = useSpeechRecognition(setTitle);
```

На вход передаётся callback для распознанного текста, на выходе — состояние записи, ошибка и действие запуска. Хук не получает DOM-поле и не меняет его `value` напрямую.

### 5.3. Разберём `useRef` и `useEffect` на реальном API

В начале хука:

```js
import { useEffect, useRef, useState } from 'react';

export function useSpeechRecognition(onResult) {
    const recognitionRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [error, setError] = useState('');
}
```

Этот начальный каркас дополняем ниже; пока не подключаем его к форме. Экземпляр `SpeechRecognition` нужен между рендерами, но сам по себе не отображается. Поэтому сохраняем его в `recognitionRef.current`. Изменение `ref.current` не вызывает рендер; для видимых `isRecording` и `error` используем state. См. [useRef](https://react.dev/reference/react/useRef).

Эффект связывает компонент с внешней системой. Setup выполняется после применения обновления к DOM; cleanup вызывается перед следующим setup при изменившихся зависимостях и при размонтировании. Массив зависимостей описывает реактивные значения, которые использует эффект. `[]` подходит эффекту без таких зависимостей; `[onResult]` учитывает callback текущего рендера. См. [useEffect](https://react.dev/reference/react/useEffect).

Внутрь хука добавим эффект:

```js
useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = 'ru-RU';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = event => onResult(event.results[0][0].transcript);

    recognition.onerror = event => {
        setError(`Ошибка голосового ввода: ${event.error}`);
        setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;

    return () => {
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.abort();
        recognitionRef.current = null;
    };
}, [onResult]);
```

Настройки знакомы по прошлой практике: русская речь, одна сессия без непрерывного режима, только финальные результаты. При `result` вызывается переданный `onResult`, в нашем случае `setTitle`. После результата запись снимается событием `end`; обработчик `result` сам не отправляет форму и не сбрасывает `isRecording`.

В cleanup сначала снимаем обработчики, затем прерываем распознавание и освобождаем ссылку. Если компонент исчезнет, старая сессия не должна продолжать обновлять его состояние. В форму передаём именно `setTitle`: его ссылка стабильна, поэтому ввод каждого символа не пересоздаёт распознавание. Произвольная стрелочная обёртка, созданная заново при рендере, изменила бы зависимость `onResult`.

### 5.4. Добавим запуск и интерфейс микрофона

После эффекта, внутри хука, добавим:

```js
function startRecording() {
    setError('');

    if (!recognitionRef.current) {
        setError('Ваш браузер не поддерживает голосовой ввод');
        return;
    }

    try {
        recognitionRef.current.start();
        setIsRecording(true);
    } catch {
        setError('Не удалось запустить голосовой ввод');
        setIsRecording(false);
    }
}

return { isRecording, error, startRecording };
```

Запуск происходит по пользовательскому действию, не внутри эффекта. `try/catch` обрабатывает синхронный отказ `start()`, а `onerror` — асинхронную ошибку распознавания. Полный файл для сверки: [useSpeechRecognition.js](../code/src/hooks/useSpeechRecognition.js).

Перенесём SVG из старого HTML в [MicrophoneIcon/index.jsx](../code/src/components/MicrophoneIcon/index.jsx). Сам контур `path` копируем: это геометрия значка, а не новая логика. В итоговом SVG стоит `fill="currentColor"`, поэтому цвет наследуется от кнопки; `aria-hidden="true"` скрывает декоративную иконку от скринридера. Собственного CSS-файла у неё нет.

В `TodoForm` добавим импорты:

```js
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import MicrophoneIcon from '../MicrophoneIcon';
```

После `useState` вызовем хук, как в §5.2. Между input и Add вставим кнопку:

```jsx
<button
    type="button"
    aria-label="Voice input"
    aria-pressed={isRecording}
    className={classNames({ [styles.recording]: isRecording })}
    disabled={isRecording}
    onClick={startRecording}
>
    <MicrophoneIcon />
</button>
```

После `</form>`, внутри `.field`, выведем ошибку:

```jsx
{error && <p className={styles.error} role="alert">{error}</p>}
```

`disabled` блокирует повторное нажатие во время записи, `.recording` уменьшает непрозрачность, `aria-label` даёт кнопке имя. `role="alert"` позволяет сообщить об ошибке вспомогательным технологиям. Ошибка теперь находится рядом с формой, а не в `alert()`.

`SpeechRecognition` поддерживается не везде; наличие конструктора проверяем в коде, совместимость — в [таблице MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#browser_compatibility). Нужен доступ к микрофону. Некоторые реализации отправляют аудио сервису распознавания и требуют сеть; локальное офлайн-распознавание в этой демке не настраивается. Проверяем через dev-сервер на localhost, при размещении используем HTTPS. Наличие API ещё не гарантирует успешной диктовки.

**Проверка:** произнесённый текст появляется в поле и доступен для правки; Add нажимаем отдельно. При отказе в доступе появляется ошибка, кнопка снова доступна. При отсутствии API обычный ввод продолжает работать.

## 6. Выведем карточки задач

### 6.1. Создадим `TodoItem`

Вместо `renderTodoCard()` с `createElement()` компонент возвращает JSX. Создадим `src/components/TodoItem/index.jsx`:

```jsx
import styles from './index.module.css';

import classNames from 'classnames';

export default function TodoItem({ todo, onToggle }) {
    return (
        <li>
            <label className={classNames(styles.todo, { [styles.completed]: todo.completed })}>
                <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => onToggle(todo.id)}
                />

                <span>{todo.title}</span>
            </label>
        </li>
    );
}
```

`todo` — данные, `onToggle` — callback. Компонент не меняет входной объект. Checkbox управляется через `checked`, а событие сообщает родителю ID задачи. Стрелка откладывает вызов до события: `onChange={onToggle(todo.id)}` вызвал бы функцию прямо при рендере.

`{todo.title}` выводит строку как текст; HTML из названия не исполняется. Здесь не нужен `innerHTML`. `label` связывает текст и checkbox: нажать можно на всю карточку.

### 6.2. Перенесём стили карточки

Скопируем прежний `todo.css` в [TodoItem/index.module.css](../code/src/components/TodoItem/index.module.css) и сверим с демкой. Основной `.todo`, оформление checkbox, `:checked::after` с галочкой и состояния фокуса сохраняются. Новые акценты:

```css
.completed {
    opacity: 0.8;
    background-color: transparent;
    outline: 2px solid #d0d0d0;
}
```

Теперь этот класс выбирает React по `todo.completed`; прежний `.todo:has(> input[type="checkbox"]:checked)` больше не нужен. У checkbox добавлен `flex-shrink: 0`, у текста — `overflow-wrap: anywhere` и `min-width: 0`: длинное название переносится и не сдавливает квадрат. В текущем дизайне выполненная задача имеет прозрачный фон и рамку, но не зачёркнутый текст.

### 6.3. Соберём список и объясним `key`

В `src/components/TodoList/index.jsx`:

```jsx
import TodoItem from '../TodoItem';

import styles from './index.module.css';

export default function TodoList({ todos, onToggle }) {
    return (
        <section aria-labelledby="todos-heading">
            <h2 id="todos-heading" className={styles.visuallyHidden}>Tasks</h2>

            <ul className={styles.list}>
                {todos.map(todo => (
                    <TodoItem key={todo.id} todo={todo} onToggle={onToggle} />
                ))}
            </ul>
        </section>
    );
}
```

`map()` преобразует массив данных в массив React-элементов. `key` помогает сопоставлять элементы между рендерами. Используем устойчивый `todo.id`, а не индекс массива: новые задачи добавляются в начало и сдвигают индексы. `key` — служебное значение React, оно не передаётся компоненту как обычный prop; объект `todo` передаём отдельно.

В [TodoList/index.module.css](../code/src/components/TodoList/index.module.css) `.list` задаёт колонку с `gap: 16px`. `.visuallyHidden` переносит прежнюю технику скрытого заголовка: размеры 1×1 px, обрезка, абсолютное позиционирование и `overflow: hidden`. Заголовок остаётся доступным скринридеру; `display: none` здесь не подходит.

Группировки Active/Completed нет, как и в финале третьей практики: отображаем единый список в порядке хранения.

### 6.4. Проверим компоненты на состоянии в памяти

Пока не подключено сохранение, добавим в `App` импорт `useState` из `react` и импорт `TodoList`. Внутри компонента создадим временный массив и **заменим** прежний `handleAdd`:

```js
const [todos, setTodos] = useState([]);

function handleAdd(title) {
    const trimmed = title.trim();

    if (!trimmed) {
        return false;
    }

    const newTodo = {
        id: crypto.randomUUID(),
        title: trimmed,
        completed: false
    };

    setTodos(previous => [newTodo, ...previous]);

    return true;
}

function handleToggle(id) {
    setTodos(previous => previous.map(todo => (
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )));
}
```

После формы добавим `<TodoList todos={todos} onToggle={handleToggle} />`. Здесь функциональное обновление получает предыдущий массив; мы создаём новый массив и новый объект изменяемой задачи. `push()` и присваивание `todo.completed = …` мутировали бы существующее состояние.

`crypto.randomUUID()` создаёт строковый ID. API требует безопасного контекста; для разработки подходит localhost, для размещения — HTTPS. Проверить поддержку можно на [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Crypto/randomUUID#browser_compatibility), особенности localhost описаны в [Secure contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Secure_Contexts#potentially_trustworthy_origins). В итоговом коде запасного генератора нет.

**Проверка:** новая задача появляется первой, checkbox меняет оформление, длинный текст переносится. После полной перезагрузки список пока пуст: состояние в памяти — временный этап, который сейчас заменим сохранением.

## 7. Подключим `useLocalStorageTodos`

### 7.1. Отделим состояние задач от разметки

На предыдущей практике за данные отвечали `Store` и `web-api/local-storage.js`. Теперь весь React-интерфейс получает задачи из хука `useLocalStorageTodos()`. Он хранит рабочий массив в state, читает постоянную копию из браузера и предоставляет действия `addTodo` и `toggleTodo`.

По плану этот блок можно скопировать из [useLocalStorageTodos.js](../code/src/hooks/useLocalStorageTodos.js) целиком, затем разобрать по частям. Отдельного `useStorage.js` или `local-storage.js` в текущей структуре нет. Не подключаем одновременно старый `Store` и новый хук.

### 7.2. Чтение, ошибка и первоначальная загрузка

В файле хука используются `useCallback`, `useEffect`, `useState` из `react` и ключ `STORAGE_KEY = 'todos'`. Функция чтения находится вне хука:

```js
function readTodos() {
    try {
        const rawValue = localStorage.getItem(STORAGE_KEY) ?? '[]';
        const todos = JSON.parse(rawValue);

        if (!Array.isArray(todos)) {
            throw new Error('Invalid todos');
        }

        return { todos, error: '' };
    } catch {
        return {
            todos: [],
            error: 'Не удалось прочитать сохранённые задачи'
        };
    }
}
```

Если ключ отсутствует, читаем пустой массив без предварительной записи. Повреждённый JSON, недоступное хранилище и значение другого типа дают пустой результат и сообщение об ошибке. Проверяется только массив: например, `[null]` или задачи без `title` этим кодом не отсекаются. Валидация каждого объекта — возможное дальнейшее улучшение, а не существующая возможность.

Внутри хука `todos` начинается с `[]`, `error` — с пустой строки. Эффект после монтирования вызывает `readTodos()`, устанавливает оба значения и подписывается на `storage`. Поэтому первый рендер может быть пустым, а следующий уже содержит сохранённые задачи.

`localStorage` привязан к origin: протоколу, хосту и порту. Если Parcel работал на одном порту, а Vite на другом, это два хранилища. Совпадения ключа `todos` недостаточно для переноса данных. Можно скопировать JSON через Application между origin или заново создать демонстрационные задачи. См. [localStorage на MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

### 7.3. Сначала сохраним, затем обновим интерфейс

Основной метод хука:

```js
const save = useCallback((updatedTodos) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTodos));

        setTodos(updatedTodos);
        setError('');

        return true;
    } catch {
        setError('Не удалось сохранить задачи.');
        return false;
    }
}, []);
```

Порядок существенен: сначала запись, затем обновление state. При ошибке записи новый массив не принимается, а `false` позволяет форме сохранить введённый текст. Это объясняет контракт `if (onAdd(title)) { setTitle(''); }`.

Добавление и переключение используют ту же функцию:

```js
const addTodo = useCallback((title) => {
    const trimmed = title.trim();

    if (!trimmed) {
        return false;
    }

    const newTodo = {
        id: crypto.randomUUID(),
        title: trimmed,
        completed: false
    };

    return save([newTodo, ...todos]);
}, [todos, save]);

const toggleTodo = useCallback((id) => {
    const updatedTodos = todos.map(todo => (
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));

    save(updatedTodos);
}, [todos, save]);
```

Новая задача находится в начале. Пробелы по краям удаляются, пустое название отклоняется. Старые числовые ID продолжают сравниваться как числа, а новые создаются строковыми UUID; не преобразуем все ID через `Number()`.

`useCallback` сохраняет ссылку на функцию, пока зависимости не изменились. `save` не читает массив текущего рендера, поэтому его зависимости пусты; `addTodo` и `toggleTodo` читают `todos`, поэтому перечисляют его. Это не автоматическое ускорение всего приложения и не защита от гонок; подробнее — [useCallback](https://react.dev/reference/react/useCallback).

В отличие от временного примера, итоговые действия строят массив из `todos` своего рендера. Несколько программных вызовов до следующего рендера могут использовать один снимок. Обычные отдельные действия пользователя — основной сценарий этой реализации; массовые обновления потребовали бы отдельного проектирования.

### 7.4. Синхронизируем вкладки

Эффект внутри хука:

```js
useEffect(() => {
    function init() {
        const saved = readTodos();
        setTodos(saved.todos);
        setError(saved.error);
    }

    function sync(event) {
        if (event.storageArea === localStorage && (event.key === STORAGE_KEY || event.key === null)) {
            const saved = readTodos();
            setTodos(saved.todos);
            setError(saved.error);
        }
    }

    init();
    window.addEventListener('storage', sync);

    return () => {
        window.removeEventListener('storage', sync);
    };
}, []);
```

Событие `storage` приходит в другие документы того же origin, а не во вкладку, выполнившую запись. Поэтому текущую вкладку обновляет `setTodos` в `save`, соседнюю — обработчик `sync`. `event.key === null` учитывает очистку хранилища через `clear()`. См. [описание события storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event).

Cleanup удаляет тот же `sync`, который был передан в подписку. Этот механизм синхронизирует снимки массива, но не разрешает конфликт одновременных записей из двух вкладок.

### 7.5. Заменим временное состояние в `App`

Удалим временные `useState`, `handleAdd`, `handleToggle` и их импорт из `App`. Вместо них импортируем хук и вызываем:

```js
const { todos, error, addTodo, toggleTodo } = useLocalStorageTodos();
```

Подключение внутри контейнера:

```jsx
<TodoForm onAdd={addTodo} />
{error && <p role="alert">{error}</p>}
<TodoList todos={todos} onToggle={toggleTodo} />
```

Ошибка хранилища отображается в `App`, ошибка распознавания — внутри `TodoForm`. Хук хранения вызываем один раз в `App`, оттуда передаём данные и функции вниз. Иначе отдельные вызовы в форме и списке создали бы независимое состояние.

**Проверка:** добавление и checkbox переживают перезагрузку; во второй вкладке того же адреса изменения видны без обновления страницы. В Application под ключом `todos` находится JSON-массив.

## 8. Вернём бесконечную прокрутку

### 8.1. Отделим весь массив от видимой части

В готовом React-приложении `useLocalStorageTodos` читает **весь** массив. `useInfiniteScroll(todos)` ограничивает только отображаемую часть. Это не запросы к серверу и не виртуализация: все уже показанные карточки остаются в DOM.

Скопируем [useInfiniteScroll.js](../code/src/hooks/useInfiniteScroll.js). Его начальная логика:

```js
const [page, setPage] = useState({ limit: pageSize, firstId: todos[0]?.id });
const [isLoading, setIsLoading] = useState(false);
const sentinelRef = useRef(null);

const firstIndex = todos.findIndex(todo => todo.id === page.firstId);
const visibleCount = page.limit + Math.max(0, firstIndex);
const hasMore = visibleCount < todos.length;
```

Параметр `pageSize` по умолчанию равен `10`. `limit` задаёт размер видимой части относительно сохранённой первой задачи, а `firstId` помогает учесть добавления перед ней. Например, после загрузки 20 задач добавление новой в начало сдвигает прежнюю первую на индекс 1: получаем `20 + 1`, ранее открытая последняя карточка остаётся видна.

Есть граница этого поведения: при первом рендере хранилище ещё пусто, поэтому `firstId` обычно `undefined`. До первой подгрузки опорного ID нет; добавление в начало не обязательно увеличит видимый лимит. Считать сохранение всех ранее видимых карточек безусловной гарантией нельзя.

Возвращаемый `todos` — `todos.slice(0, visibleCount)`. `slice()` не меняет исходный массив. Если данных нет или они все уже видны, `hasMore` равно `false`.

### 8.2. Подключим наблюдатель через эффект

Внутри хука используется эффект:

```js
useEffect(() => {
    const sentinel = sentinelRef.current;

    if (!hasMore || !sentinel || !('IntersectionObserver' in window)) {
        return;
    }

    let timeout;
    let pending = false;

    const observer = new IntersectionObserver((entries) => {
        if (!entries.some(entry => entry.isIntersecting) || pending) {
            return;
        }

        pending = true;
        setIsLoading(true);

        timeout = window.setTimeout(() => {
            setPage({ limit: visibleCount + pageSize, firstId: todos[0]?.id });
            setIsLoading(false);
        }, 1500);
    }, { rootMargin: '50px', threshold: 0.1 });

    observer.observe(sentinel);

    return () => {
        observer.disconnect();
        window.clearTimeout(timeout);
    };
}, [hasMore, visibleCount, pageSize, todos]);
```

React помещает DOM-узел в `sentinelRef.current`; больше не ищем `#sentinel` по документу. `root` не указан, поэтому используется viewport. `rootMargin: '50px'` расширяет его границы, `threshold: 0.1` задаёт порог пересечения в 10% площади цели. Callback проверяет `isIntersecting`; `pending` не даёт одному экземпляру наблюдателя запустить несколько таймеров. Настройки и совместимость — в [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API#browser_compatibility).

Задержка 1500 мс показывает loader, а не измеряет длительность чтения `localStorage`. После изменения лимита эффект пересоздаётся с новыми значениями; cleanup отключает старый observer и отменяет его таймер. Если изменяется `todos`, в том числе при переключении checkbox, ожидающая подгрузка также отменяется и наблюдение создаётся заново.

Для отсутствующего API хук возвращает `loadMore`: она сразу увеличивает лимит на `pageSize` и снимает состояние загрузки. Здесь нет искусственной задержки.

### 8.3. Покажем loader и sentinel

Создадим [InfiniteScroll/index.jsx](../code/src/components/InfiniteScroll/index.jsx) и соседний [index.module.css](../code/src/components/InfiniteScroll/index.module.css). Компонент получает результат хука:

```jsx
import styles from './index.module.css';

export default function InfiniteScroll({ sentinelRef, hasMore, isLoading, loadMore }) {
    if (!hasMore) {
        return null;
    }

    return (
        <>
            {isLoading && (
                <div className={styles.loading} role="status" aria-label="Loading tasks">
                    <div className={styles.spinner} />
                </div>
            )}

            <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />

            {!('IntersectionObserver' in window) && (
                <button type="button" onClick={loadMore}>Load more</button>
            )}
        </>
    );
}
```

`return null` убирает интерфейс подгрузки после конца списка. Условный JSX заменяет ручные `appendChild()` и `removeChild()`. `role="status"` и доступное имя сообщают о загрузке; технический sentinel скрыт от скринридера.

В CSS `.loading` центрирует содержимое с отступами `40px 20px`. Круглый `.spinner` имеет размер 40×40 px, рамку 3 px и более тёмную верхнюю сторону; `animation: spin 1s linear infinite` вращает его через `@keyframes spin`. `.sentinel` сохраняет высоту 1 px и `visibility: hidden`: он невидим, но участвует в геометрии страницы. `display: none` для наблюдаемой точки не подходит. Правило `.loading p` сохранено на случай текста, но `<p>` в текущем loader нет.

### 8.4. Соберём окончательный `App`

Добавим импорты:

```js
import InfiniteScroll from '../components/InfiniteScroll';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
```

После `useLocalStorageTodos()` вызовем `const pagination = useInfiniteScroll(todos)`. Заменим вывод полного списка на:

```jsx
<TodoList todos={pagination.todos} onToggle={toggleTodo} />
<InfiniteScroll {...pagination} />
```

`{...pagination}` передаёт свойства объекта как props. `InfiniteScroll` выбирает из них только необходимые. Полный [App.jsx](../code/src/app/App.jsx) связывает шапку, форму, ошибку хранилища, видимый список и подгрузку.

**Проверка:** после чтения хранилища сначала видны до 10 задач. Если sentinel уже попал в область наблюдения, следующая порция может загрузиться автоматически, даже без движения колеса. При дальнейшем приближении к концу видны loader и следующие задачи, после последней страницы sentinel исчезает.

## 9. Закрепим роль эффектов и структуру проекта

### 9.1. Что выполняется при рендере, в событии и в эффекте

| Место | Что делает в нашем приложении |
| --- | --- |
| Рендер компонента | Вычисляет JSX, классы, `visibleCount` и `hasMore` из текущих данных |
| Обработчик события | Принимает текст, добавляет/переключает задачу, запускает диктовку |
| Эффект | Читает внешнее хранилище при старте, подключает подписки, распознавание и наблюдатель |
| Cleanup эффекта | Удаляет `storage`-обработчик, прерывает распознавание, отключает observer и таймер |

Для вычисления `todos.slice(...)` эффект не нужен: это производное значение текущего рендера. Для сохранения по клику в этой реализации тоже используется действие `save`, а не эффект на каждое изменение `todos`.

Итоговый поток:

```text
index.html → main.jsx → App
                       ├── useLocalStorageTodos → todos, error, addTodo, toggleTodo
                       ├── useInfiniteScroll(todos) → видимая часть и sentinelRef
                       ├── TodoForm → useSpeechRecognition → setTitle
                       ├── TodoList → TodoItem
                       └── InfiniteScroll → loader, sentinel, Load more

событие → действие → сохранение/state → новый рендер → обновление DOM
```

### 9.2. Настройки проекта и старые файлы

В [vite.config.js](../code/vite.config.js) остаётся `plugins: [react()]`. В [eslint.config.js](../code/eslint.config.js) кроме базовых правил и React Hooks добавлены четыре пробела, обязательные точки с запятой и сортировка импортов через `eslint-plugin-simple-import-sort`. Это настройки демки поверх шаблона, а не обязательные требования React.

Если воспроизводим эти настройки в новой рабочей копии, сначала установим дополнительный плагин:

```bash
npm install -D eslint-plugin-simple-import-sort
```

Затем скопируем конфигурацию ESLint из демки. Группы импортов идут в порядке `@/`, `../`, `./`, внешние пакеты, но само правило сортировки не создаёт alias `@/` в Vite. В [package.json](../code/package.json) `classnames` — рабочая зависимость, линтер и сборщик — зависимости разработки. Lock-файл сохраняем, его внутреннее изменение на занятии не разбираем.

Старые `src/scripts`, `src/pages` и `src/styles` в новом проекте не нужны: их роли распределены между компонентами, хуками и CSS-модулями. Прежняя `about.html` с двумя ссылками в React-демку не перенесена; отдельной страницы и маршрутизации здесь нет. `mock.js` тоже не включён в новое приложение: данные для проверки подготовим отдельно.

## Итоговая проверка

### Подготовим длинный список

На отдельном учебном origin без ценных данных можно один раз выполнить в Console:

```js
localStorage.setItem('todos', JSON.stringify(
    Array.from({ length: 50 }, (_, id) => ({
        id,
        title: `Учебная задача ${id + 1}`,
        completed: false
    }))
));
location.reload();
```

Команда заменяет ключ `todos` целиком. Если там есть нужные задачи, сначала сохраните его содержимое. В код приложения этот seed не добавляем; иначе он будет сбрасывать пользовательские изменения. Перезагрузка нужна текущей вкладке: собственная запись не вызывает в ней `storage`.

### Проверим сценарии

1. Вкладка называется Todo Today, иконка и шрифт загрузились, Console без ошибок.
2. Enter и Add добавляют задачу в начало. Пробельный ввод отклоняется; после успешного добавления поле очищается.
3. Checkbox меняет оформление, повторный клик возвращает исходное состояние. Название с HTML-тегами показывается как текст.
4. Перезагрузка сохраняет список и статусы. Вторая вкладка того же origin получает изменения.
5. Диктовка заполняет управляемое поле; текст можно поправить. При ошибке или завершении кнопка возвращается в доступное состояние.
6. На длинном списке видны порции по 10 задач и задержка около 1,5 с. Конец списка не создаёт бесконечных загрузок.
7. Без `IntersectionObserver` доступна кнопка Load more; без SpeechRecognition доступен ручной ввод и сообщение по нажатию на микрофон.
8. На узком экране форма внизу, последние задачи доступны прокруткой; длинное название не ломает карточку. Особенно проверяем нижний отступ при многострочном сообщении об ошибке.
9. Навигация Tab показывает фокус, Enter отправляет форму, пробел переключает checkbox.

### Проверим линтер и сборку

Из папки приложения:

```bash
npm run lint
npm run build
npm run preview
```

Откроем адрес preview из терминала и проверим те же основные действия и загрузку ресурсов. Его origin может отличаться от dev-сервера, поэтому список там может быть пустым. Успешная сборка проверяет связность модулей, но не заменяет проверку микрофона, разрешений и мобильного интерфейса.

## Если что-то не работает

**Vite не запускается.** Проверьте версию Node.js, требования Vite и то, что команда запущена рядом с нужным `package.json`. Для React-демки нужна `npm run dev`, а не старая `npm start`.

**Модуль не найден.** Проверьте регистр имени папки, относительную глубину импорта и существование `index.jsx`. После переноса `App` путь к картинке начинается с `../assets`, из компонента на уровень глубже — с `../../assets`. Не оставляйте импорты удалённых CSS и SVG шаблона.

**Favicon возвращает 404.** Для `public/favicon.png` адрес — `/favicon.png`, для итогового исходника в `index.html` — `/src/assets/favicon.png`. После изменения иконки может потребоваться обновление с очисткой кеша.

**Стили модуля не применяются.** Проверьте суффикс `.module.css`, импорт `styles` и `className={styles.form}` вместо строки `"styles.form"`. Общие правила тегов не изолируются CSS Modules.

**Поле не редактируется или текст диктовки пропадает.** `value` должен быть связан с `title`, `onChange` — с `setTitle`, а распознавание должно вызывать тот же setter, не присваивать DOM-полю `value`.

**Данные исчезли после перехода на Vite.** Сравните протокол, хост и порт в адресной строке. `localhost` и `127.0.0.1` тоже разные хосты. Проверьте нужный origin в Application.

**Ошибка чтения сохранённых задач.** Проверьте JSON и то, что это массив. Сохраните повреждённую запись перед исправлением. Валидный JSON с неправильными полями задач может пройти текущую проверку массива и всё равно сломать рендер.

**React сообщает о `key` или неверном вызове хука.** У `TodoItem` в `map` нужен `key={todo.id}` с уникальными ID. Хуки вызываем на верхнем уровне; `useSpeechRecognition` не переносим в обработчик клика.

**`crypto.randomUUID` недоступен.** Проверьте поддержку и `window.isSecureContext`. Запуск по HTTP с адреса машины в локальной сети отличается от localhost; для удалённого доступа нужен безопасный контекст.

**Нет следующей порции.** В хранилище должно быть больше 10 задач; проверьте `hasMore`, DOM-узел в `sentinelRef.current` и отсутствие `display: none` у sentinel. Loader может включиться ещё до ручной прокрутки, если экран высокий.

**Loader завис после изменения списка во время ожидания.** Изменение `todos` отменяет таймер, но текущий cleanup отдельно не сбрасывает `isLoading`. Если новый sentinel не пересёк viewport, индикатор может остаться до следующей успешной подгрузки. Это ограничение демки; для демонстрации завершите загрузку или обновите страницу. Согласование отмены и состояния загрузки — отдельное улучшение.

**Ошибка `not-allowed` или `no-speech`.** Для первой проверьте разрешение на микрофон, для второй — выбранный микрофон и наличие речи. При неподдерживаемом API продолжайте с клавиатурой; таблица поддержки не гарантирует работу конкретного сервиса.

**Эффект часто создаётся заново.** Посмотрите на зависимости: новый callback при каждом рендере считается новым значением. Не убирайте зависимости ради подавления предупреждения; передавайте стабильный `setTitle`, а подписку всегда сопровождайте cleanup.

## Если осталось время

- Выделить `Header` и `Button`, сохранив props, доступные имена и оформление.
- Вынести `useForm`, когда есть понятный повторяющийся контракт, и сравнить с локальным `useState`.
- Проверять поля и уникальность ID при чтении массива из `localStorage`.
- Обсудить поведение пагинации при вставке до первого сохранённого `firstId` и отмене ожидающей загрузки.
- Включить `StrictMode` в рабочей копии и убедиться, что эффекты выдерживают повторное подключение.

## Карта переноса файлов

Это карта покрытия изменений между третьей и четвёртой работами. **show** — разбираем код или значимый фрагмент; **mention** — объясняем назначение/перенос без переписывания целиком; **intentionally omit** — сознательно не переносим в занятие, причина указана. Пути относятся к соответствующей папке `code`; разделы — к этому конспекту. Учительский план следует тем же этапам, техническую карту достаточно держать здесь.

| Изменённый файл | Тип | Решение | Раздел и причина |
| --- | --- | --- | --- |
| `.gitignore` | config | mention | §1: исключения зависимостей, логов и сборки |
| `REPORT.md` | docs | mention | Введение: история миграции, сверяем с исходниками |
| `eslint.config.js` | JS/config | mention | §9: правила, сортировка и установка плагина |
| `vite.config.js` | JS/config | mention | §1, §9: React-плагин, без alias |
| `package.json` | config | show | §1, §5, §9: команды и зависимости |
| `index.html` | HTML | show | §1–2: точка входа, favicon, шрифт |
| `src/main.jsx` | JSX | show | §1: монтирование и отсутствие StrictMode в финале |
| `src/app/App.jsx` | JSX | show | §3, §7–8: контейнер и композиция |
| `src/app/App.module.css` | CSS | show | §3: шапка, ширина, отступ мобильной формы |
| `src/app/global.module.css` | CSS | mention | §2–3: reset, переменные, общие селекторы |
| `src/components/TodoForm/index.jsx` | JSX | show | §4–5: управляемый ввод, кнопки и ошибки |
| `src/components/TodoForm/index.module.css` | CSS | show | §4: фиксированная форма, recording, error, фокус |
| `src/components/MicrophoneIcon/index.jsx` | JSX/SVG | mention | §5: копируем геометрию, обсуждаем currentColor и aria-hidden |
| `src/components/TodoItem/index.jsx` | JSX | show | §6: props, checkbox, условный класс |
| `src/components/TodoItem/index.module.css` | CSS | show | §6: completed, checkbox, длинный текст |
| `src/components/TodoList/index.jsx` | JSX | show | §6: map, key, скрытый заголовок |
| `src/components/TodoList/index.module.css` | CSS | mention | §6: список и visuallyHidden |
| `src/components/InfiniteScroll/index.jsx` | JSX | show | §8: loader, sentinel, ручная кнопка |
| `src/components/InfiniteScroll/index.module.css` | CSS | mention | §8: спиннер, анимация, геометрия sentinel |
| `src/hooks/useSpeechRecognition.js` | JS | show | §5: эффект, ref, события, очистка |
| `src/hooks/useLocalStorageTodos.js` | JS | show | §7: чтение, запись, состояние, storage |
| `src/hooks/useInfiniteScroll.js` | JS | show | §8: видимая часть, observer, таймер |
| `src/pages/index.html` — удалён | HTML | mention | §1–4: метаданные в корень, разметка в компоненты |
| `src/pages/about.html` — удалён | HTML | intentionally omit | §9: отдельная страница с навигационными ссылками не входит в демку |
| `src/scripts/index.js` — удалён | JS | mention | §1: запуск Store заменён main.jsx |
| `src/scripts/store.js` — удалён | JS | mention | §4, §6–8: действия и координация распределены между App и хуками |
| `src/scripts/mock.js` — удалён | JS | intentionally omit | Итоговая проверка: одноразовый seed вместо модуля приложения |
| `src/scripts/ui/index.js` — удалён | JS | mention | §3, §6: прямые импорты компонентов вместо barrel UI-функций |
| `src/scripts/ui/todo.js` — удалён | JS | mention | §6: TodoList/TodoItem вместо построения DOM |
| `src/scripts/ui/infinite-scroll.js` — удалён | JS | mention | §8: JSX вместо функций создания loader/sentinel |
| `src/scripts/web-api/local-storage.js` — удалён | JS | mention | §7: операции внутри useLocalStorageTodos |
| `src/scripts/web-api/speech-recognition.js` — удалён | JS | mention | §5: callback и state вместо DOM-trigger/target |
| `src/scripts/web-api/intersection-observer.js` — удалён | JS | mention | §8: хук с cleanup вместо класса менеджера |
| `src/styles/reset.css` — удалён | CSS | mention | §3: перенесён в global.module.css |
| `src/styles/common.css` — удалён | CSS | mention | §3–8: распределён между app и модулями компонентов |
| `src/styles/todo.css` — удалён | CSS | mention | §6: модуль карточки, completed вместо :has |

`src/assets/favicon.png` не изменился по содержимому, но его подключение разобрано в §2. Файлы удалённого Vite-демо перечислены в §1.2–3.1. `node_modules`, кеши, `dist`, source maps и внутренние изменения lock-файла намеренно исключены из учебного diff: это зависимости и генерируемые данные, а не шаги миграции интерфейса.
