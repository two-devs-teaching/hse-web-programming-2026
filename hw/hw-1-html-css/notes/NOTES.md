# Практика №1. HTML и CSS

На этой практике мы сверстаем адаптивный список todo (todo list) **Todo Today** по макету из Figma.

Пока будем использовать только HTML и CSS. Интерактивность с помощью JavaScript и Web API добавим на следующих практиках.

## Что понадобится

Сначала подготовим инструменты, чтобы во время практики не отвлекаться на настройку окружения.

- редактор кода (например, [Visual Studio Code](https://code.visualstudio.com/))
- браузер с DevTools
- [Node.js LTS](https://nodejs.org/en/download)
- макет в Figma

Полезные материалы:

- [Заготовка HTML-документа](https://doka.guide/html/doctype/)
- [Parcel](https://parceljs.org/getting-started/webapp/)
- [Flexbox Froggy](https://flexboxfroggy.com/#ru)
- [Grid Garden](https://cssgridgarden.com/#ru)

## 1. Изучим макет

Перед вёрсткой разберём макет на смысловые части. Так будет проще выбрать HTML-теги, найти повторяющиеся компоненты и не копировать из Figma случайные стили. Обратим внимание на:

1. Размер основного контейнера и внешние отступы.
2. Основные блоки: шапка, форма и группы todo.
3. Повторяющийся компонент todo.
4. Шрифт, размеры и насыщенность текста.
5. Цвета, скругления и интервалы.
6. Состояния элементов: обычное, выполненное, наведение и фокус.
7. Отличия мобильной версии от десктопной.

Набросаем примерную структуру приложения. Для нашего проекта она будет выглядеть так:

```text
main.page
└── div.todo-list
    ├── header.todo-list__header
    ├── form.todo-list__text-field
    └── div.todo-list__groups
        ├── section.todo-group — Active
        │   └── ul → li → label.todo
        └── section.todo-group — Completed
            └── ul → li → label.todo
```

## 2. Создадим HTML-документ

Структура макета понятна. Теперь создадим минимальный HTML-документ и проверим, что браузер открывает его без дополнительных инструментов.

Создадим папки проекта:

```text
my-project/
└── src/
    ├── assets/
    ├── pages/
    │   └── index.html
    └── styles/
```

Добавим в `src/pages/index.html` минимальный документ:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Todo Today</title>
  </head>
  <body>
    <h1>Todo Today</h1>
  </body>
</html>
```

- `<!doctype html>` включает современный режим HTML.
- `lang` указывает язык содержимого. Если текст страницы русский, укажем `ru`.
- `head` содержит метаданные и подключения ресурсов.
- `body` содержит видимое содержимое страницы.
- `charset="utf-8"` задаёт кодировку.
- `viewport` включает корректный масштаб на мобильных устройствах.

Откроем файл `index.html` напрямую в браузере. Если видим заголовок, значит базовый HTML работает.

## 3. Установим Node.js

HTML- и CSS-страницу можно разрабатывать без Node.js: создать файлы и открыть HTML напрямую в браузере. Но такой процесс быстро становится неудобным: страницу приходится обновлять вручную, зависимости — подключать и обновлять самостоятельно, а готовую сборку — подготавливать отдельными инструментами.

Поэтому дальше мы будем работать через Node.js. Он запускает JavaScript вне браузера и служит основой для npm, Parcel и других инструментов фронтенда. С их помощью мы получим локальный сервер, hot reload, установку пакетов и итоговую сборку для публикации. Это ближе к процессу разработки реальных проектов.

Скачаем LTS-версию Node.js с [официального сайта](https://nodejs.org/en/download). Вместе с Node.js установится пакетный менеджер npm.

Проверим установку:

```bash
node --version
npm --version
```

Другой вариант — [NVM](https://github.com/nvm-sh/nvm), менеджер версий Node.js. Он позволяет установить несколько версий Node.js и переключаться между ними без повторной ручной установки.

После установки NVM выполним:

```bash
nvm install --lts
nvm use --lts
```

Для учебного проекта возьмём LTS-версию: она рассчитана на длительную поддержку и стабильную работу.

## 4. Инициализируем проект и установим Parcel

Node.js установлен. Теперь подготовим npm-проект и установим Parcel, чтобы автоматизировать запуск, обновление и сборку страницы.

npm устанавливается вместе с Node.js. Это пакетный менеджер: он загружает пакеты из реестра npm, сохраняет зависимости проекта и запускает команды из `package.json`.

Parcel улучшает процесс разработки:

- запускает локальный HTTP-сервер;
- следит за исходными файлами;
- применяет hot reload после сохранения изменений;
- обрабатывает связанные HTML, CSS, изображения и шрифты;
- собирает и оптимизирует итоговую версию проекта для публикации.

Hot reload и понятные команды улучшают DX — developer experience, то есть удобство и скорость работы разработчика. Parcel не является обязательной частью HTML или CSS: браузер по-прежнему получает обычные веб-ресурсы.

Откроем терминал в папке проекта и выполним:

```bash
npm init -y
npm install --save-dev parcel
```

Команда `npm init -y` создаёт файл `package.json` с базовыми значениями. Флаг `-y` автоматически принимает значения по умолчанию и не задаёт вопросы в терминале. В `package.json` мы будем хранить зависимости проекта и команды запуска.

Команда `npm install --save-dev parcel` устанавливает Parcel в проект. Флаг `--save-dev` записывает его в `devDependencies`, потому что Parcel нужен для разработки и сборки, но не нужен внутри готовой страницы в браузере, которую увидит пользователь.

Приведём содержимое `package.json` к следующему виду:

```json
{
  "name": "my-lovely-project",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "parcel ./src/pages/*.html",
    "build": "parcel build ./src/pages/*.html"
  },
  "devDependencies": {
    "parcel": "^2.16.4"
  }
}
```

Версию Parcel оставим той, которую записал `npm install`. Версия выше соответствует готовому примеру.

Поле `private: true` защищает проект от случайной публикации в реестр npm. В `scripts` мы даём короткие имена длинным командам: `start` запускает dev-сервер, а `build` создаёт итоговую сборку.

Запустим сервер:

```bash
npm start
```

Откроем адрес из терминала (по умолчанию это будет <http://localhost:1234>). Изменим текст `h1` и сохраним файл. Parcel автоматически обновит страницу — это и есть hot reload.

Структура проекта:
- `package.json` хранит команды и прямые зависимости
- `package-lock.json` фиксирует точные версии зависимостей
- папка `node_modules` содержит установленные пакеты

## 5. Настроим `.gitignore`

После установки Parcel в проекте появились объёмные автоматически созданные папки. Исключим их из git, чтобы репозиторий хранил только исходники и файлы, нужные для воспроизведения проекта.

Создадим `.gitignore` в корне проекта:

```gitignore
node_modules/
dist/
.parcel-cache/
.DS_Store
```

`.gitignore` перечисляет файлы и папки, которые git не должен отслеживать:

- `node_modules` занимает много места и восстанавливается командой `npm install`;
- `dist` создаётся заново командой `npm run build`;
- `.parcel-cache` содержит локальный кеш Parcel;
- `.DS_Store` создаётся операционной системой и не относится к проекту.

## 6. Настроим `head`

Проект запускается. Теперь настроим метаданные документа и подключим ресурсы, которые нужны до отображения основного содержимого: favicon, шрифт и CSS.

### Подключение favicon

Favicon — маленькая иконка во вкладке браузера. Положим её в `src/assets/favicon.png` и подключим:

```html
<link rel="icon" type="image/png" href="../assets/favicon.png">
```

### Подключение шрифта

#### Вариант 1. Подключение c помощью Google Fonts через HTML

Откроем страницу шрифта [Inter в Google Fonts](https://fonts.google.com/specimen/Inter), выберем нужные начертания и скопируем код подключения. Добавим его в `head` перед таблицами стилей:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap"
  rel="stylesheet"
>
```

Первые две ссылки заранее устанавливают соединение с серверами Google Fonts. Последняя ссылка подключает сам файл стилей со шрифтом.

Создадим файл со стилями `common.css` и подключим его после шрифта:

```html
<link rel="stylesheet" href="../styles/common.css">
```

#### Вариант 2. Импорт Google Fonts через CSS

Вместо HTML-ссылок шрифт можно импортировать в начале `common.css`:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700&display=swap");

:root {
  --typography-font: "Inter", "Courier New", Courier, monospace;
}
```

Директива `@import` должна находиться до обычных CSS-правил. Выберем один способ подключения и не будем подключать один шрифт одновременно через HTML и `@import`.

Подключение через `<link>` обычно загружается раньше и позволяет использовать `preconnect`. `@import` полезен, когда все подключения должны находиться в CSS.

#### Вариант 3. Локальный шрифт из проекта

Локальный шрифт работает без Google Fonts и внешнего подключения. Перед использованием проверим лицензию; для веба лучше взять компактный формат WOFF2.

Добавим файл:

```text
src/assets/fonts/Inter-Variable.woff2
```

Опишем шрифт в начале `common.css`:

```css
@font-face {
  font-family: "Inter";
  src: url("../assets/fonts/Inter-Variable.woff2") format("woff2");
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
}
```

Если каждое начертание лежит в отдельном файле, создадим несколько правил:

```css
@font-face {
  font-family: "Inter";
  src: url("../assets/fonts/Inter-Regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Inter";
  src: url("../assets/fonts/Inter-Bold.woff2") format("woff2");
  font-style: normal;
  font-weight: 700;
  font-display: swap;
}
```

Применим шрифт:

```css
body {
  font-family: "Inter", "Courier New", Courier, monospace;
}
```

Путь в `url()` считается относительно CSS-файла. `font-display: swap` временно показывает запасной шрифт вместо невидимого текста.

## 7. Добавим reset и глобальные стили

Ресурсы подключены, но браузер всё ещё применяет собственные стили. Создадим предсказуемую базу, на которой будет проще повторить макет.

Создадим файл `reset.css` и подключим его к остальным стилям в HTML-разметке:

```html
<link rel="stylesheet" href="../styles/reset.css">
<link rel="stylesheet" href="../styles/common.css">
```

Здесь важен порядок. Если два правила имеют одинаковую CSS-специфичность, победит правило из файла, подключённого ниже.

Добавим в `reset.css` [готовый reset Эрика Мейера](https://meyerweb.com/eric/tools/css/reset/). В конец reset добавим:

```css
* {
  box-sizing: border-box;
}
```

Браузер автоматически добавляет элементам собственные стили: отступы заголовков и списков, маркеры списков, границы полей и другие значения. Эти стили могут отличаться между браузерами и мешать точному переносу макета из Figma.

Reset приводит элементы к общей предсказуемой стартовой точке. После него мы сами задаём нужные отступы, размеры и оформление. Reset не делает страницу красивой и не заменяет основные стили проекта.

`box-sizing: border-box` включает padding и border в заданные `width` и `height`. Без него итоговый размер элемента может оказаться больше указанного.

Важно: не будем удалять состояние фокуса (`outline`) без заметной замены. Иначе пользователю клавиатуры будет непонятно, какой элемент сейчас выбран.

## 8. Создадим дизайн-токены

В макете повторяются цвета, шрифт и насыщенности. Вынесем их в CSS-переменные, чтобы хранить дизайн-значения централизованно и менять их в одном месте.

Добавим в `common.css`:

```css
:root {
  --color-bg-primary: #F9F5F4;
  --color-bg-secondary: #F3EFEE;
  --color-bg-inverse: #393433;

  --color-text-primary: #222222;
  --color-text-secondary: #121212;
  --color-text-inverse: #FFFFFF;

  --color-brand: #D1A28B;

  --typography-weight-bold: 700;
  --typography-weight-medium: 600;
  --typography-weight-regular: 500;

  --typography-font: "Inter", "Courier New", Courier, monospace;
}

html {
  height: 100vh;
}

body {
  height: 100%;
  background-color: var(--color-bg-primary);
  font-family: var(--typography-font);
}
```

`:root` — псевдокласс корневого элемента документа. В HTML он выбирает элемент `html`. CSS-переменные, объявленные в `:root`, доступны во всём документе. Будем называть токен по его роли: `--color-brand` лучше, чем `--pink`, потому что назначение цвета может сохраниться после смены палитры.

## 9. Создадим семантическую разметку

Базовые стили готовы. Теперь опишем смысловую структуру интерфейса: главное содержимое, заголовок и форму добавления todo.

Заменим временный `h1` внутри `body`:

```html
<main class="page">
  <div class="todo-list">
    <header class="todo-list__header">
      <img src="../assets/favicon.png" alt="">
      <h1>Todo Today</h1>
    </header>

    <form class="todo-list__text-field">
      <label class="visually-hidden" for="new-todo">New task</label>
      <input id="new-todo" type="text" name="todo" placeholder="New task">
      <button type="submit">Add</button>
    </form>

    <div class="todo-list__groups">
      <!-- Здесь будут группы todo -->
    </div>
  </div>
</main>
```

- `main` содержит главное содержимое страницы.
- `header` обозначает шапку смыслового блока.
- `form` объединяет поле и кнопку отправки.
- `type="submit"` явно задаёт поведение кнопки.
- Пустой `alt` скрывает декоративную картинку от скринридера.
- Placeholder не заменяет label, поэтому label скрыт только визуально.

Добавим в `common.css`:

```css
.visually-hidden {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}
```

Класс `visually-hidden` визуально скрывает элемент, но оставляет его доступным для скринридеров. Здесь он скрывает подпись поля и заголовок активных todo, сохраняя понятную структуру страницы для пользователей вспомогательных технологий.

Здесь не подойдут `display: none` или атрибут `hidden`: они скроют элемент и от скринридера. Подробнее: [Скрытие контента в Доке](https://doka.guide/a11y/content-hidden/).

## 10. Добавим группы todo

Каркас страницы пока не содержит todo. Добавим списки активных и выполненных todo, сохранив правильную семантику HTML.

Вставим внутрь `.todo-list__groups`:

```html
<section class="todo-group">
  <h2 class="visually-hidden">Active</h2>
  <ul class="todo-group__todos">
    <li>
      <label class="todo">
        <input type="checkbox">
        <span>Drink 8 glasses of water</span>
      </label>
    </li>
    <li>
      <label class="todo">
        <input type="checkbox">
        <span>Meditate for 10 minutes</span>
      </label>
    </li>
  </ul>
</section>

<section class="todo-group">
  <h2 class="todo-group__title">Completed</h2>
  <ul class="todo-group__todos">
    <li>
      <label class="todo">
        <input type="checkbox" checked>
        <span>Practice deep breathing exercises</span>
      </label>
    </li>
  </ul>
</section>
```

- Набор todo размечен списком `ul`, а отдельный todo — элементом `li`.
- У каждой `section` есть заголовок.
- `label` делает кликабельной всю строку todo.
- `checked` — булев атрибут. Значение `checked="true"` не требуется.
- Без JavaScript форма не добавляет todo и не переносит их между группами.

### Именование классов по BEM

BEM расшифровывается как Block, Element, Modifier — «Блок, Элемент, Модификатор». Подробнее: [официальная документация BEM](https://bem.info/ru/).

![Разбор BEM-классов на примере карточки](<./assets/[BEM] Card Component.png>)

- **Блок** — самостоятельный компонент с собственным смыслом: `todo-list`, `todo-group`, `todo`.
- **Элемент** — часть блока, которая не имеет самостоятельного смысла вне него: `todo-list__header`, `todo-list__text-field`, `todo-group__title`.
- **Модификатор** — вариант блока или элемента: например, `todo--completed` или `button--primary`.

```html
<article class="card">
  <img class="card__image" src="..." alt="">
  <h2 class="card__title">...</h2>
  <button class="card__button card__button--primary">...</button>
</article>
```

![BEM-классы в Todo Today](<./assets/[BEM] Todo Today.png>)

BEM-класс описывает продуктовое назначение стиля. `todo-group__title` сообщает, что это заголовок группы todo. Имя вроде `pink-text` описывает только текущий внешний вид и потеряет смысл после изменения дизайна.

Составное имя снижает риск случайного совпадения классов разных компонентов. Общий класс `.title` легко переопределить в другом месте, а `.todo-group__title` относится к конкретному блоку.

Так имя становится конкретнее, а риск случайного пересечения уменьшается. Но числовая CSS-специфичность не меняется: `.title` и `.todo-group__title` содержат по одному классу и имеют одинаковый вес `(0, 1, 0)`.

Название класса должно объяснять смысл элемента. Не будем переносить в имя внешний вид вроде `pink-text`.

## 11. Сверстаем контейнер, шапку и форму

HTML-структура уже повторяет основные блоки макета, но страница пока выглядит как обычный документ без оформления. Теперь добавим основные стили.

Перенесём из макета крупную геометрию: ширину контейнера, вертикальное центрирование и отступы, шапку и форму.

Добавим в `common.css`:

```css
.page {
  height: 100vh;
  display: flex;
  justify-content: center;
}

.todo-list {
  position: relative;
  width: 540px;
  margin: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.todo-list__header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.todo-list__header > img {
  width: 32px;
  height: 32px;
}

.todo-list__header > h1 {
  font-size: 36px;
  font-weight: var(--typography-weight-bold);
}

.todo-list__text-field {
  max-height: 56px;
  display: flex;
  gap: 12px;
}

.todo-list__text-field > input {
  width: 100%;
  background-color: var(--color-bg-secondary);
  padding: 20px 14px;
  height: 100%;
  font-size: 18px;
  border: none;
  border-radius: 12px;
  color: var(--color-text-primary);
  outline: none;
  transition: box-shadow 0.3s ease;
  font-family: var(--typography-font);
  font-weight: var(--typography-weight-regular);
}

.todo-list__text-field > button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
  background-color: var(--color-bg-inverse);
  color: var(--color-text-inverse);
  font-size: 18px;
  font-weight: var(--typography-weight-regular);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}
```

- `gap` задаёт расстояние между flex-элементами.
- `width: 100%` позволяет полю занять свободное место в строке.
- `height: 100%` связывает высоту поля и кнопки с высотой формы.
- Элементы формы получают шрифт через `font-family` и `font-weight`.

Как читать сложные селекторы:

- `.todo-list__header > img` выбирает `img`, который является непосредственным дочерним элементом `.todo-list__header`;
- символ `>` — дочерний комбинатор; изображение с более глубокой вложенностью этот селектор не выберет;
- `.todo-list__text-field > input` аналогично выбирает только прямой дочерний `input` формы;
- пробел без `>` означал бы любого потомка на любой глубине вложенности.

## 12. Сверстаем группы и todo

Основная геометрия готова. Оформим повторяющиеся группы и строки todo с помощью общих правил раскладки.

Добавим продолжение в `common.css`:

```css
.todo-list__groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.todo-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.todo-group__todos {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.todo-group__todos > li {
  width: 100%;
}

.todo-group__title {
  font-size: 14px;
  font-weight: var(--typography-weight-medium);
  color: var(--color-brand);
  text-transform: uppercase;
  padding-left: 8px;
}
```

Для стилей отдельного todo создадим файл `todo.css` и подключим его после общих стилей:

```html
<link rel="stylesheet" href="../styles/reset.css">
<link rel="stylesheet" href="../styles/common.css">
<link rel="stylesheet" href="../styles/todo.css">
```

Добавим в `todo.css`:

```css
.todo {
  display: flex;
  align-items: center;
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  gap: 15px;
}

.todo:hover {
  background-color: #fafafa;
  transform: translateX(2px);
}

.todo span {
  font-size: 18px;
  color: var(--color-text-primary);
  user-select: none;
}
```

Селектор `.todo-group__todos > li` выбирает только непосредственные элементы списка. Селектор `.todo span` выбирает любой `span` внутри `.todo`, независимо от глубины вложенности.

`:hover` — псевдокласс. Он выбирает существующий `.todo` только в состоянии наведения. Псевдокласс записывается с одним двоеточием и не добавляет новый HTML-элемент.

## 13. Добавим интерактивные состояния

Страница уже похожа на макет, но пока слабо реагирует на действия пользователя. Добавим обратную связь для наведения, нажатия и клавиатурного фокуса.

Добавим в `common.css`:

```css
.todo-list__text-field > input::placeholder {
  color: var(--color-text-secondary);
}

.todo-list__text-field > input:focus {
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.todo-list__text-field > button:hover {
  background-color: #1a1a1a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.todo-list__text-field > button:active {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.todo-list__text-field > button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}
```

- `:hover` срабатывает при наведении указателя.
- `:active` срабатывает во время нажатия.
- `:focus-visible` показывает клавиатурный фокус.
- Для кнопки стандартный `outline` заменён заметной тенью.

Разбор селекторов:

- `.todo-list__text-field > input::placeholder` выбирает псевдоэлемент placeholder у прямого дочернего `input`;
- `::placeholder` — псевдоэлемент: виртуальная часть элемента, которой нет отдельным тегом в HTML;
- `:focus`, `:hover`, `:active` и `:focus-visible` — псевдоклассы, которые описывают состояние существующего элемента;
- `.todo-list__text-field > button:focus-visible` читается справа налево: кнопка в состоянии видимого фокуса, являющаяся прямым ребёнком формы.

## 14. Сделаем кастомный checkbox

Системный checkbox выглядит по-разному в разных браузерах и не совпадает с макетом. Заменим только его визуальное оформление, но сохраним нативный `input` и управление с клавиатуры.

### Вариант с текстовым символом

Добавим в `todo.css`:

```css
.todo input[type="checkbox"] {
  appearance: none;
  width: 24px;
  height: 24px;
  border: 2px solid #d0d0d0;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.todo input[type="checkbox"]:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}

.todo input[type="checkbox"]:checked {
  background-color: #8b8b8b;
  border-color: #8b8b8b;
}

.todo input[type="checkbox"]:checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 14px;
  font-weight: bold;
}
```

Селектор `.todo input[type="checkbox"]` состоит из трёх частей:

- `.todo` ограничивает поиск компонентом todo;
- пробел выбирает потомка на любой глубине;
- `input[type="checkbox"]` объединяет селектор тега и селектор атрибута, поэтому выбирает только checkbox.

`:checked` — псевдокласс отмеченного checkbox. `::after` — псевдоэлемент, который создаёт декоративную область после содержимого элемента. Свойство `content` обязательно для отображения `::after`.

### Вариант с картинкой вместо символа

Положим изображение галки в `src/assets/check.svg`. Например, экспортируем белую галку из Figma.

Удалим правило с `::after` и зададим изображение фоном отмеченного checkbox:

```css
.todo input[type="checkbox"]:checked {
  border-color: #8b8b8b;
  background-color: #8b8b8b;
  background-image: url("../assets/check.svg");
  background-position: center;
  background-repeat: no-repeat;
  background-size: 14px 14px;
}
```

Можно оставить `::after` и поместить картинку в него:

```css
.todo input[type="checkbox"]:checked::after {
  content: "";
  position: absolute;
  inset: 4px;
  background: url("../assets/check.svg") center / contain no-repeat;
}
```

Выберем только один вариант. Путь считается относительно `todo.css`. Сам `input` остаётся в HTML, поэтому checkbox сохраняет своё состояние и управление клавишей `Space`.

Оформим выполненный todo:

```css
.todo:has(> input[type="checkbox"]:checked) {
  opacity: 0.8;
  background-color: transparent;
  outline: 2px solid #d0d0d0;
}
```

- `appearance: none` убирает системное оформление checkbox.
- `:checked` выбирает отмеченный checkbox.
- `:has(...)` выбирает `.todo`, внутри которого находится отмеченный checkbox.

`.todo:has(> input[type="checkbox"]:checked)` выбирает родительский `.todo`, если его прямой дочерний checkbox отмечен. Аргумент внутри `:has(...)` описывает условие поиска внутри `.todo`.

Проверим checkbox мышью, а затем клавишами `Tab` и `Space`. Так мы убедимся, что кастомное оформление не сломало управление с клавиатуры.

## 15. Добавим адаптивность

Десктопная версия готова. Теперь настроим интерфейс для узких экранов, чтобы форма и список оставались удобными на мобильном устройстве.

Директива `@media` применяет CSS-правила только при выполнении заданного условия. Она позволяет менять раскладку, размеры и отступы под доступное пространство экрана.

Условие `max-width: 720px` означает: применить вложенные правила, когда ширина viewport не превышает 720 px. Правила внутри media query дополняют или переопределяют обычные правила каскада.

Будем сужать окно браузера и найдём ширину, на которой интерфейс начинает ломаться. Затем добавим в конец `common.css`:

```css
@media (max-width: 720px) {
  .todo-list {
    margin: 16px;
  }

  .todo-list__text-field {
    position: fixed;
    z-index: 1;
    right: 0;
    bottom: 0;
    left: 0;
    max-height: none;
    padding: 22px 26px;
    background-color: var(--color-bg-primary);
    box-shadow: 0 -24px 32px 16px var(--color-bg-primary);
  }

  .todo-list__text-field > input,
  .todo-list__text-field > button {
    height: 56px;
  }

  .todo-list__groups {
    padding-bottom: 150px;
  }
}
```

Запятая группирует два независимых селектора. Поэтому одинаковая высота применяется и к `input`, и к `button`. В каждом селекторе `>` ограничивает выбор непосредственным дочерним элементом формы.

Форма закреплена у нижнего края. Дополнительный `padding-bottom` не даёт форме перекрыть последние todo.

Breakpoint выберем там, где ломается интерфейс, а не по названию устройства. Проверим ширину 320 px, промежуточные размеры и длинный текст.

## 16. Соберём проект

Dev-сервер удобен во время разработки. Перед публикацией создадим итоговую, или production-сборку, с обработанными и оптимизированными ресурсами.

Остановим dev-сервер сочетанием `Ctrl+C` и выполним:

```bash
npm run build
```

Parcel создаст итоговую сборку в папке `dist`.

Проверим результат:

- в терминале и консоли браузера нет ошибок;
- favicon, изображения и шрифт загружаются;
- заголовки идут в порядке `h1`, затем `h2`;
- элементы формы доступны с клавиатуры;
- фокус заметен;
- при ширине 320 px нет горизонтальной прокрутки;
- выполненный todo отличается от активного;
- повторяющиеся значения вынесены в CSS-переменные;
- `node_modules`, `dist` и `.parcel-cache` не добавлены в git.

## Дополнительные упражнения

Основная практика завершена. Теперь попробуем расширить проект: добавим фоновое изображение и ещё одну HTML-страницу.

### Фоновое изображение

Добавим декоративный фон через CSS и проверим, как путь к ресурсу считается относительно файла стилей.

```css
.page {
  background-image: url("../assets/pattern.png");
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}
```

Для значимого изображения с `alt` будем использовать `img`. `background-image` оставим для оформления, без которого содержимое страницы не потеряет смысл.

### Вторая HTML-страница

Добавим ещё один HTML-документ, чтобы увидеть работу обычной многостраничной навигации и сравнить её с SPA-роутингом.

Создадим `src/pages/about.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>About</title>
  </head>
  <body>
    <a href="./index.html">Main</a>
  </body>
</html>
```

Добавим ссылку в `index.html`:

```html
<a href="./about.html">About</a>
```

Скрипты `parcel ./src/pages/*.html` уже обрабатывают все HTML-файлы в `src/pages`. Это многостраничная навигация, а не клиентский роутинг SPA.

При многостраничной навигации браузер переходит по ссылке, загружает новый HTML-документ и заново создаёт страницу. Каждая страница имеет собственную точку входа. Состояние JavaScript в памяти при переходе теряется, если приложение не сохранило его отдельно.

В SPA браузер сначала загружает один HTML-документ и JavaScript-приложение. Клиентский роутер перехватывает переходы, меняет URL через History API и заменяет содержимое без полной перезагрузки документа. Для прямого открытия вложенного SPA-маршрута сервер обычно настраивают на возврат основного `index.html`.

Parcel собирает оба подхода, но сам не является SPA-роутером. В этой практике используется обычная многостраничная навигация.

## Если что-то не работает (troubleshooting)

Если проект перестал запускаться или изменения не появляются, сначала посмотрим на сообщение в терминале. Затем откроем Console и Network в DevTools. Ниже разберём частые случаи.

### Parcel показывает старую версию или ошибку сборки

Остановим dev-сервер сочетанием `Ctrl+C`. Удалим только автоматически созданные папки `dist` и `.parcel-cache`, затем снова запустим нужную команду:

```bash
rm -rf dist .parcel-cache
npm start
```

Для повторной итоговой сборки:

```bash
rm -rf dist .parcel-cache
npm run build
```

Удаление этих папок безопасно: Parcel создаёт их заново. Папку `src`, файл `package.json` и собственные ассеты не удаляем — это исходники проекта.

### Команда `parcel` или `npm start` не найдена

Проверим, что терминал открыт в папке с `package.json`, затем восстановим зависимости:

```bash
npm install
npm start
```

Если `npm` не найден, проверим установку Node.js командой `node --version` и активную версию NVM командой `nvm current`.

### Не загружается CSS, изображение или шрифт

- Проверим путь и регистр символов в имени файла.
- Учтём: путь в HTML считается относительно HTML-файла, а `url()` — относительно CSS-файла.
- Откроем вкладки Console и Network в DevTools. Ошибка `404` укажет отсутствующий ресурс.
- Проверим, что файл находится внутри `src` и связан с одной из HTML-страниц.

### Порт уже занят

Остановим другой dev-сервер или запустим Parcel на другом порту:

```bash
npx parcel ./src/pages/*.html --port 1235
```
