# Практика №2. JavaScript

На первой практике мы сверстали адаптивный список задач **Todo Today** с помощью HTML и CSS. Карточки todo были записаны непосредственно в HTML, поэтому их нельзя было добавлять, переносить между группами или создавать из данных.

На этой практике добавим приложению интерактивность с помощью JavaScript:

- перенесём данные о задачах из HTML в JavaScript;
- научимся создавать DOM-элементы программно;
- разделим код на модули;
- отделим состояние приложения от его отображения;
- будем заново отображать список после изменения данных;
- обработаем выполнение и добавление задач.

В результате HTML будет содержать только постоянный каркас страницы, а группы и карточки todo JavaScript построит из массива данных.

## Что понадобится

Продолжим работу с проектом первой практики. Нам понадобятся:

- редактор кода;
- браузер с DevTools;
- установленный Node.js;
- проект **Todo Today** с настроенным Parcel.

Полезные материалы:

- [JavaScript в браузере](https://doka.guide/js/how-the-browser-creates-pages/)
- [Тег script](https://doka.guide/html/script/)
- [DOM](https://doka.guide/js/dom/)
- [События](https://doka.guide/js/events/)
- [Экспорт и импорт](https://doka.guide/js/modules/)

## 1. Подготовим HTML к работе с JavaScript

Возьмём результат первой практики. Раньше все карточки todo были записаны непосредственно в `index.html`. Один и тот же код приходится повторять вручную по несколько раз, а для добавления задачи нужно изменять HTML.

В этой практике карточки будет создавать JavaScript, поэтому удалим из `.todo-list` статический элемент `.todo-list__groups`. Оставим только шапку и форму:

```html
<main class="page">
  <div class="todo-list">
    <header class="todo-list__header">
      <img src="../assets/favicon.png" alt="">
      <h1>Todo Today</h1>
    </header>

    <form class="todo-list__text-field" id="todo-form">
      <input type="text" name="todo">
      <button type="submit">Add</button>
    </form>
  </div>
</main>
```

Добавим форме идентификатор `todo-form`. Позже с его помощью найдём форму из JavaScript и подпишемся на событие отправки.

После удаления статической разметки список задач временно исчезнет со страницы. Это ожидаемо: сначала перенесём данные в JavaScript, а затем напишем функции, которые восстановят прежнюю HTML-структуру программно.

## 2. Выполним первый скрипт

JavaScript можно написать прямо внутри HTML с помощью элемента `script`. Добавим его в конец `body`, после `main`:

```html
<main class="page">
  <!-- Содержимое страницы -->
</main>

<script>
  console.log('JavaScript works');

  const todoList = document.querySelector('.todo-list');
  console.log(todoList);
</script>
```

Откроем в DevTools вкладку Console. В ней должны появиться строка `JavaScript works` и найденный DOM-элемент `.todo-list`.

Объект `document` представляет загруженный HTML-документ. Метод `querySelector()` ищет первый элемент, подходящий под CSS-селектор, и возвращает его. Если подходящего элемента нет, результатом будет `null`.

Скрипт расположен после основной разметки, поэтому к моменту его выполнения браузер уже создал элементы `main`, `.todo-list` и формы. Если поместить обычный `script` в `head`, браузер остановит разбор HTML, загрузит и выполнит скрипт, а элементов из `body` в DOM в этот момент ещё не будет.

Встроенный `script` удобен для небольшого эксперимента. Код приложения лучше хранить в отдельном файле: так HTML остаётся компактным, JavaScript проще редактировать, переиспользовать и разделять на модули.

## 3. Вынесем JavaScript в отдельный файл

Создадим папку `src/scripts` и файл `index.js`:

```text
src/
├── pages/
│   └── index.html
└── scripts/
    └── index.js
```

Перенесём JavaScript из HTML в `index.js`:

```js
console.log('JavaScript works');

const todoList = document.querySelector('.todo-list');
console.log(todoList);
```

Вместо встроенного кода подключим файл в конце `body`:

```html
<script src="../scripts/index.js"></script>
```

Атрибут `src` содержит путь к JavaScript-файлу. Браузер загрузит файл и выполнит находящийся в нём код. Один и тот же внешний файл можно подключить на нескольких страницах, а браузер может сохранить его в кеше.

### Почему скрипт часто подключают в конце `body`

Обычный `script` без дополнительных атрибутов блокирует разбор HTML. Встретив его, браузер приостанавливает построение документа, загружает файл и выполняет код. Только после этого браузер продолжает читать HTML.

Если такой скрипт находится в `head`, элементы из `body` ещё не существуют:

```html
<head>
  <script src="../scripts/index.js"></script>
</head>
```

Поэтому вызов `document.querySelector('.todo-list')` вернёт `null`.

Если подключить тот же файл перед закрывающим тегом `body`, основная разметка уже будет разобрана:

```html
<body>
  <main class="page">
    <!-- Содержимое страницы -->
  </main>

  <script src="../scripts/index.js"></script>
</body>
```

Такой вариант прост и предсказуем: скрипт может обращаться ко всем расположенным выше элементам, а загрузка файла не останавливает разбор основной части страницы.

Однако у этого способа есть недостаток: браузер обнаруживает файл и начинает загружать его только после почти полного чтения HTML. Скрипт с `defer` или `type="module"` можно разместить в `head`, чтобы начать загрузку раньше и выполнить код после построения документа.

### Способы подключения внешнего скрипта

Поведение `script` зависит от его атрибутов:

| Подключение | Загрузка | Выполнение | Сохраняет порядок файлов |
| --- | --- | --- | --- |
| `<script src="index.js"></script>` | Во время разбора HTML | Сразу после загрузки, блокируя дальнейший разбор | Да |
| `<script src="index.js" defer></script>` | Параллельно с разбором HTML | После разбора HTML, перед `DOMContentLoaded` | Да |
| `<script src="index.js" async></script>` | Параллельно с разбором HTML | Сразу после загрузки | Нет |
| `<script src="index.js" type="module"></script>` | Параллельно с разбором HTML | После разбора HTML | Для зависимостей отвечает система модулей |

`defer` подходит для обычных скриптов, которым нужен готовый DOM. Несколько таких файлов выполнятся в порядке подключения.

`async` подходит для независимых скриптов, например аналитики. Файл выполнится сразу после загрузки и может прервать разбор HTML. Если подключено несколько `async`-скриптов, первым выполнится тот, который раньше загрузился. Поэтому зависимые друг от друга файлы так подключать нельзя. `async`-скрипты также не задерживают событие `DOMContentLoaded`.

Модульный скрипт (`type="module"`) по умолчанию ведёт себя подобно `defer`: браузер загружает его вместе с зависимостями параллельно с разбором HTML, а выполняет после построения документа. Внутри него можно использовать `import` и `export`. Код модуля имеет собственную область видимости и автоматически выполняется в строгом режиме.

Позже мы разделим приложение на несколько модулей, поэтому сразу выберем `type="module"`:

```html
<script src="../scripts/index.js" type="module"></script>
```

В готовом проекте этот элемент находится в конце `body`. Для модульного скрипта это не обязательно: его можно перенести в `head`, и он всё равно дождётся завершения разбора HTML. Здесь нижнее подключение наглядно показывает, где начинается JavaScript-приложение, и сохраняет знакомую структуру страницы.

## 4. Дождёмся построения DOM

Событие `DOMContentLoaded` возникает, когда браузер полностью разобрал HTML и построил DOM. Подпишемся на него в `index.js`:

```js
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM is ready');
});
```

Метод `addEventListener()` регистрирует функцию-обработчик. Браузер вызовет её, когда произойдёт указанное событие.

Обычный скрипт в конце `body` уже может обращаться к расположенной выше разметке. Модульный скрипт также по умолчанию выполняется после разбора документа. Поэтому в нашем проекте обработчик `DOMContentLoaded` не является единственным способом дождаться DOM, но явно обозначает момент инициализации приложения:

```js
document.addEventListener('DOMContentLoaded', () => store.init());
```

Позже вместо временного `console.log()` мы вызовем здесь метод `store.init()`, который подключит обработчики формы и впервые отобразит список задач.

## 5. Представим todo в виде данных

В первой практике содержание и состояние каждой задачи хранились в HTML:

```html
<label class="todo">
  <input type="checkbox">
  <span>Drink 8 glasses of water</span>
</label>
```

Теперь отделим данные от разметки. Временно добавим в `index.js` массив `TODOS`:

```js
const TODOS = [
  {
    id: 0,
    title: 'Drink 8 glasses of water',
    completed: false
  },
  {
    id: 1,
    title: 'Meditate for 10 minutes',
    completed: false
  },
  {
    id: 2,
    title: 'Read a chapter of a book',
    completed: false
  },
  {
    id: 3,
    title: 'Go for a 30-minute walk',
    completed: false
  },
  {
    id: 4,
    title: 'Write in a gratitude journal',
    completed: false
  },
  {
    id: 5,
    title: 'Review daily goals before sleeping',
    completed: false
  },
  {
    id: 6,
    title: 'Practice deep breathing exercises',
    completed: true
  },
  {
    id: 7,
    title: 'Plan meals for the day',
    completed: true
  },
  {
    id: 8,
    title: 'Stretch for 15 minutes',
    completed: true
  }
];
```

`TODOS` — массив объектов. Каждый объект описывает одну задачу:

- `id` — уникальный идентификатор;
- `title` — текст задачи;
- `completed` — логическое значение со статусом выполнения.

Теперь источник данных находится в JavaScript. Одну функцию рендеринга можно применить к каждому объекту массива, вместо того чтобы вручную повторять одинаковую HTML-разметку.

Имя константы записано в верхнем регистре, чтобы показать: переменная содержит исходный набор данных и не будет переназначена. Само объявление через `const` не делает массив неизменяемым — его элементы по-прежнему можно менять и добавлять.

## 6. Создадим функцию рендеринга карточки

Функция рендеринга принимает данные и создаёт соответствующий DOM-элемент. Начнём с одной карточки todo:

```js
const renderTodoCard = (todo, onComplete) => {
  const { id, title, completed } = todo;

  const todoElement = document.createElement('label');
  const checkboxElement = document.createElement('input');
  const titleElement = document.createElement('span');

  todoElement.id = `todo-${id}`;
  todoElement.className = 'todo';

  checkboxElement.type = 'checkbox';
  checkboxElement.checked = completed;
  checkboxElement.name = `todo-input-${id}`;
  checkboxElement.onclick = onComplete;

  titleElement.textContent = title;

  todoElement.appendChild(checkboxElement);
  todoElement.appendChild(titleElement);

  return todoElement;
};
```

Разберём функцию по шагам:

1. Деструктуризация получает `id`, `title` и `completed` из объекта `todo`.
2. `document.createElement()` создаёт элементы, но пока не добавляет их на страницу.
3. Свойства `id`, `className`, `type`, `checked` и `name` настраивают созданные элементы.
4. В `onclick` записывается функция, которую браузер вызовет при изменении checkbox.
5. `textContent` добавляет название задачи как текст.
6. `appendChild()` собирает карточку из дочерних элементов.
7. `return` возвращает готовый DOM-элемент вызывающему коду.

Для пользовательского текста используем `textContent`, а не `innerHTML`. Браузер не будет воспринимать введённые символы как HTML-разметку. Например, строка `<strong>Task</strong>` отобразится именно как текст.

Параметр `onComplete` делает функцию независимой от способа хранения данных. Карточка знает, какую функцию вызвать при нажатии, но не изменяет общий массив самостоятельно. Позже хранилище передаст ей подходящий обработчик.

Проверим функцию на одном todo:

```js
document.addEventListener('DOMContentLoaded', () => {
  const todoElement = renderTodoCard(TODOS[0], () => {
    console.log('Todo clicked');
  });

  document.querySelector('.todo-list').appendChild(todoElement);
});
```

После загрузки страницы появится первая карточка. При нажатии на checkbox в консоль будет выведено сообщение.

## 7. Опишем функцию с помощью JSDoc

[JSDoc](https://jsdoc.app/) — формат комментариев, который описывает параметры, возвращаемое значение и назначение функции. Добавим комментарий перед `renderTodoCard`:

```js
/**
 * Создаёт DOM-элемент todo-карточки.
 * @param {Object} todo - Данные todo-карточки.
 * @param {number} todo.id - Идентификатор задачи.
 * @param {string} todo.title - Название задачи.
 * @param {boolean} todo.completed - Статус выполнения задачи.
 * @param {Function} onComplete - Обработчик изменения статуса.
 * @returns {HTMLElement} DOM-элемент todo-карточки.
 */
const renderTodoCard = (todo, onComplete) => {
  // Код функции
};
```

Редактор использует JSDoc для подсказок при вызове функции и может предупредить о несовпадении типов. Сам JavaScript эти комментарии не выполняет и не проверяет: во время работы программы они остаются обычными комментариями.

Тип `todo.id` указан как `number`, потому что исходные идентификаторы и результат `Date.now()`, который мы используем позже, являются числами. Описание JSDoc должно соответствовать реальным данным.

## 8. Создадим список карточек

`renderTodoCard()` создаёт одну карточку. Теперь напишем функцию, которая применит её ко всем объектам массива и соберёт семантический список `ul`:

```js
const renderTodoList = (todos, onComplete) => {
  const todoList = document.createElement('ul');

  todoList.className = 'todo-group__todos';

  for (const todo of todos) {
    const handleComplete = () => onComplete(todo.id);

    const todoContainer = document.createElement('li');
    const todoElement = renderTodoCard(todo, handleComplete);

    todoContainer.appendChild(todoElement);
    todoList.appendChild(todoContainer);
  }

  return todoList;
};
```

Цикл `for...of` последовательно перебирает объекты массива `todos`. Для каждого объекта функция:

1. создаёт контейнер `li`;
2. создаёт карточку с помощью `renderTodoCard()`;
3. помещает карточку внутрь `li`;
4. добавляет `li` в общий список `ul`.

В результате JavaScript создаёт ту же семантическую структуру, которую мы использовали в первой практике:

```html
<ul class="todo-group__todos">
  <li>
    <label class="todo">
      <input type="checkbox">
      <span>Drink 8 glasses of water</span>
    </label>
  </li>
</ul>
```

Для каждой карточки создаётся отдельная функция `handleComplete`:

```js
const handleComplete = () => onComplete(todo.id);
```

Она запоминает `id` текущей задачи. Когда пользователь нажмёт на checkbox, карточка вызовет `handleComplete`, а та передаст идентификатор задачи общему обработчику `onComplete`.

Такой механизм называется callback: одна функция передаётся другой функции как аргумент, чтобы быть вызванной позже. Функции рендеринга не решают, как именно изменить данные. Они только сообщают наружу, с какой задачей произошло действие.

Добавим JSDoc:

```js
/**
 * Создаёт DOM-список todo-карточек.
 * @param {Array<Object>} todos - Массив todo.
 * @param {Function} onComplete - Обработчик изменения статуса.
 * @returns {HTMLElement} DOM-элемент списка.
 */
const renderTodoList = (todos, onComplete) => {
  // Код функции
};
```

Для быстрой проверки временно вызовем функцию после построения DOM:

```js
document.addEventListener('DOMContentLoaded', () => {
  const todoList = renderTodoList(TODOS, (todoId) => {
    console.log('Todo clicked:', todoId);
  });

  document.querySelector('.todo-list').appendChild(todoList);
});
```

На странице появятся все карточки из массива. При нажатии на checkbox в консоли будет отображаться идентификатор соответствующей задачи.

## 9. Разделим задачи на группы

В интерфейсе есть две группы: активные и выполненные задачи. Создадим функцию, которая разделит исходный массив по свойству `completed`:

```js
const groupTodos = (todos) => {
  const activeGroup = {
    id: 'active',
    title: 'Active',
    headless: true,
    todos: todos.filter(({ completed }) => !completed)
  };

  const completedGroup = {
    id: 'completed',
    title: 'Completed',
    todos: todos.filter(({ completed }) => completed)
  };

  return [
    activeGroup,
    completedGroup
  ];
};
```

Метод `filter()` создаёт новый массив только из тех элементов, для которых функция вернула `true`:

```js
todos.filter(({ completed }) => !completed);
```

Здесь параметр объекта сразу деструктурируется. В активную группу попадают задачи с `completed: false`, а в выполненную — с `completed: true`.

`filter()` не изменяет исходный массив `todos`. Функция `groupTodos()` возвращает новый массив с двумя объектами групп. Каждый объект содержит данные, необходимые для построения секции:

- `id` — идентификатор группы;
- `title` — её заголовок;
- `todos` — задачи группы;
- `headless` — признак визуально скрытого заголовка.

Заголовок Active скрыт только визуально. Он остаётся в DOM, чтобы у каждой секции был доступный заголовок.

## 10. Отобразим группы задач

Сначала создадим функцию рендеринга одной группы:

```js
const renderTodoGroup = (group, onComplete) => {
  const { id, title, headless, todos } = group;

  const groupElement = document.createElement('section');
  const titleElement = document.createElement('h2');
  const todoList = renderTodoList(todos, onComplete);

  groupElement.id = `todo-group-${id}`;
  groupElement.className = 'todo-group';

  titleElement.textContent = title;
  titleElement.className = 'todo-group__title';

  if (headless) {
    titleElement.classList.add('visually-hidden');
  }

  groupElement.appendChild(titleElement);
  groupElement.appendChild(todoList);

  return groupElement;
};
```

Метод `classList.add()` добавляет элементу ещё один CSS-класс, не удаляя уже установленный `todo-group__title`.

Функция создаёт ту же структуру группы, которая была написана вручную в первой практике:

```html
<section class="todo-group" id="todo-group-active">
  <h2 class="todo-group__title visually-hidden">Active</h2>
  <ul class="todo-group__todos">
    <!-- Карточки -->
  </ul>
</section>
```

Теперь объединим все группы в общий контейнер:

```js
const renderTodoGroupList = (groups, onComplete) => {
  const groupList = document.createElement('div');

  groupList.className = 'todo-list__groups';

  for (const group of groups) {
    const todoGroup = renderTodoGroup(group, onComplete);

    groupList.appendChild(todoGroup);
  }

  return groupList;
};
```

Получилась цепочка функций, каждая из которых отвечает за свой уровень интерфейса:

```text
renderTodoGroupList
└── renderTodoGroup
    └── renderTodoList
        └── renderTodoCard
```

Проверим полный рендеринг:

```js
document.addEventListener('DOMContentLoaded', () => {
  const groups = groupTodos(TODOS);

  const groupsElement = renderTodoGroupList(groups, (todoId) => {
    console.log('Todo clicked:', todoId);
  });

  document.querySelector('.todo-list').appendChild(groupsElement);
});
```

После загрузки страницы JavaScript:

1. разделит исходные данные на две группы;
2. создаст карточку для каждой задачи;
3. соберёт карточки в списки;
4. поместит списки в секции;
5. добавит общий контейнер на страницу.

Визуально приложение снова будет похоже на результат первой практики, но теперь вся повторяющаяся разметка строится из данных.

## 11. Разделим код на модули

Сейчас массив данных, функции рендеринга и запуск приложения находятся в одном `index.js`. По мере роста проекта такой файл становится сложнее читать и изменять.

Разделим код по ответственности:

```text
src/
└── scripts/
    ├── data.js
    ├── todo.js
    └── index.js
```

- `data.js` хранит начальные данные;
- `todo.js` группирует задачи и создаёт DOM-элементы;
- `index.js` служит точкой входа и запускает приложение.

### Экспортируем данные

Перенесём массив `TODOS` в `data.js` и добавим перед объявлением ключевое слово `export`:

```js
export const TODOS = [
  {
    id: 0,
    title: 'Drink 8 glasses of water',
    completed: false
  },
  // Остальные задачи
];
```

Именованный экспорт делает переменную доступной другим модулям. Без `export` константа `TODOS` существовала бы только внутри `data.js`.

### Экспортируем функции

Перенесём функции рендеринга и группировки в `todo.js`.

Вспомогательные функции оставим внутренними:

```js
const renderTodoCard = (todo, onComplete) => {
  // Создание одной карточки
};

const renderTodoList = (todos, onComplete) => {
  // Создание списка карточек
};

const renderTodoGroup = (group, onComplete) => {
  // Создание одной группы
};
```

Из других файлов нам понадобятся только две функции, поэтому экспортируем их:

```js
export const renderTodoGroupList = (groups, onComplete) => {
  // Создание контейнера со всеми группами
};

export const groupTodos = (todos) => {
  // Разделение задач на Active и Completed
};
```

Так модуль предоставляет небольшой публичный интерфейс. Остальные функции остаются деталями реализации `todo.js`: их можно изменять, не затрагивая код, который использует модуль.

### Импортируем значения в точке входа

Подключим данные и функции в `index.js`:

```js
import { TODOS } from './data';
import {
  groupTodos,
  renderTodoGroupList
} from './todo';

document.addEventListener('DOMContentLoaded', () => {
  const groups = groupTodos(TODOS);

  const groupsElement = renderTodoGroupList(groups, (todoId) => {
    console.log('Todo clicked:', todoId);
  });

  document.querySelector('.todo-list').appendChild(groupsElement);
});
```

Имена внутри фигурных скобок должны совпадать с именами экспортов. Относительный путь начинается с `./`, то есть поиск файла начинается в папке текущего модуля.

В проекте используются пути без расширения:

```js
import { TODOS } from './data';
```

Такую запись разрешает Parcel. При непосредственном запуске нативных ES-модулей в браузере обычно нужно указывать полный путь:

```js
import { TODOS } from './data.js';
```

Поэтому проект следует открывать через `npm start`, а не двойным нажатием на `index.html`. Dev-сервер корректно обрабатывает импорты, а страница загружается по HTTP.

### Подключим точку входа как модуль

Чтобы браузер разрешил использовать `import` и `export`, в HTML должен быть указан `type="module"`:

```html
<script src="../scripts/index.js" type="module"></script>
```

Без `type="module"` браузер воспримет `index.js` как обычный скрипт и покажет в консоли синтаксическую ошибку при встрече с `import`.

Браузер начинает с `index.js`, находит его импорты, затем загружает их зависимости. Получается граф модулей:

```text
index.js
├── data.js
└── todo.js
```

У каждого модуля собственная область видимости. Переменные верхнего уровня не попадают в глобальный объект `window` и не конфликтуют с одноимёнными переменными из других файлов.

## 12. Добавим хранилище состояния

Сейчас `index.js` одновременно получает данные, группирует их, создаёт интерфейс и обрабатывает события. Вынесем управление состоянием приложения в отдельный модуль `store.js`.

Под состоянием будем понимать данные, которые могут изменяться во время работы приложения. Для Todo Today это массив задач:

```text
состояние todos
      ↓
группировка данных
      ↓
создание DOM-элементов
      ↓
интерфейс страницы
```

Создадим `src/scripts/store.js`:

```js
import {
  groupTodos,
  renderTodoGroupList
} from './todo';

export class Store {
  todos = [];

  constructor(todos) {
    this.todos = todos;
  }

  init() {
    this.ui();
  }

  ui() {
    const groups = groupTodos(this.todos);

    const groupsElement = renderTodoGroupList(groups, (todoId) => {
      console.log('Todo clicked:', todoId);
    });

    const container = document.getElementsByClassName('todo-list')[0];

    container.appendChild(groupsElement);
  }
}
```

`Store` объявлен с помощью класса. Класс описывает данные и поведение будущих объектов:

- поле `todos` хранит текущее состояние;
- `constructor()` получает начальный массив при создании объекта;
- `init()` запускает приложение;
- `ui()` строит интерфейс из текущего состояния.

Ключевое слово `this` указывает на конкретный экземпляр `Store`. Выражение `this.todos` обращается к массиву задач этого экземпляра.

Метод `ui()` сначала превращает массив задач в группы, затем передаёт группы функциям рендеринга и добавляет результат в `.todo-list`.

На этом шаге обработчик карточки пока только выводит идентификатор задачи в консоль. Изменение состояния добавим следующим этапом.

### Запустим Store из точки входа

Обновим `index.js`:

```js
import { TODOS } from './data';
import { Store } from './store';

const store = new Store(TODOS);

document.addEventListener('DOMContentLoaded', () => store.init());
```

Оператор `new` создаёт экземпляр класса и вызывает его `constructor()`. В результате переменная `store` получает собственное состояние и методы для работы с ним.

`index.js` остаётся небольшой точкой входа:

1. импортирует начальные данные;
2. создаёт хранилище;
3. запускает его после построения DOM.

Граф модулей теперь выглядит так:

```text
index.js
├── data.js
└── store.js
    └── todo.js
```

Такое разделение не является полноценной архитектурой большого приложения, но уже отделяет три разные ответственности:

- данные — `data.js`;
- отображение — `todo.js`;
- состояние и действия пользователя — `store.js`.

Массив `todos` становится единым источником правды. Интерфейс строится на его основе и не должен хранить отдельную, независимую копию состояния.

## 13. Изменим статус задачи и обновим интерфейс

При нажатии на checkbox функция рендеринга передаёт в `Store` идентификатор задачи. Добавим метод, который найдёт эту задачу и переключит её статус:

```js
_completeTodo(todoId) {
  for (const todo of this.todos) {
    if (todo.id === todoId) {
      todo.completed = !todo.completed;
    }
  }
}
```

Оператор `!` меняет логическое значение на противоположное:

```js
true  → false
false → true
```

Знак подчёркивания в имени `_completeTodo` показывает, что метод предназначен для внутреннего использования классом. Это соглашение между разработчиками, а не настоящее ограничение языка: вызвать такой метод снаружи технически возможно.

Для настоящего приватного метода в современном JavaScript используется синтаксис с `#`, например `#completeTodo()`, но в готовом проекте применяется соглашение с `_`.

Добавим публичный обработчик действия пользователя:

```js
handleCompleteTodo(todoId) {
  this._completeTodo(todoId);
  this.ui();
}
```

Он выполняет два последовательных действия:

1. изменяет состояние;
2. заново отображает интерфейс.

Передадим обработчик функциям рендеринга внутри `ui()`:

```js
const groupsElement = renderTodoGroupList(
  groups,
  (todoId) => this.handleCompleteTodo(todoId)
);
```

Стрелочная функция сохраняет нужное значение `this` и передаёт идентификатор карточки в метод экземпляра `Store`.

Теперь полный путь события выглядит так:

```text
нажатие на checkbox
        ↓
onComplete(todo.id)
        ↓
store.handleCompleteTodo(todoId)
        ↓
store._completeTodo(todoId)
        ↓
изменение todos
        ↓
store.ui()
        ↓
новый DOM
```

После изменения `completed` задача должна переместиться между группами Active и Completed. Одного изменения массива для этого недостаточно: DOM не синхронизируется с обычным JavaScript-объектом автоматически. Поэтому после обновления состояния снова вызывается `ui()`.

### Заменим старый интерфейс новым

Если при каждом вызове `ui()` использовать `appendChild()`, на странице появятся дубликаты групп. Вместо добавления заменим ранее созданный контейнер:

```js
ui() {
  const groups = groupTodos(this.todos);

  const groupsElement = renderTodoGroupList(
    groups,
    (todoId) => this.handleCompleteTodo(todoId)
  );

  const container = document.getElementsByClassName('todo-list')[0];

  container.replaceChild(groupsElement, container.lastChild);
}
```

Метод `replaceChild(newChild, oldChild)` удаляет старый дочерний узел и ставит новый на его место.

В текущей разметке первый вызов `ui()` заменяет пробельный текстовый узел после формы. После этого последним дочерним узлом становится `.todo-list__groups`, и следующие вызовы заменяют уже его.

Этот вариант работает с текущей HTML-структурой, но зависит от того, какой узел оказался последним. Например, после изменения форматирования `lastChild` может указывать на форму или другой элемент.

Более устойчивый вариант — искать контейнер групп явно:

```js
const currentGroups = container.querySelector('.todo-list__groups');

if (currentGroups) {
  currentGroups.replaceWith(groupsElement);
} else {
  container.appendChild(groupsElement);
}
```

При первом рендеринге контейнера ещё нет, поэтому он добавляется. При следующих рендерах найденный `.todo-list__groups` заменяется новым.

Мы используем простой полный рендер: после каждого изменения заново создаём все группы и карточки. Для небольшого учебного списка это понятный подход. В крупных интерфейсах обычно стараются обновлять только изменившиеся части или используют библиотеку, которая делает это автоматически.

## 14. Добавим новую задачу через форму

Форма уже есть в HTML:

```html
<form class="todo-list__text-field" id="todo-form">
  <input type="text" name="todo">
  <button type="submit">Add</button>
</form>
```

Будем обрабатывать событие `submit` самой формы, а не `click` кнопки. Тогда добавление сработает и при нажатии на кнопку, и при нажатии Enter в текстовом поле.

Найдём форму и зарегистрируем обработчик в новом методе `form()`:

```js
form() {
  const todoForm = document.getElementById('todo-form');

  todoForm.addEventListener(
    'submit',
    (event) => this.handleAddTodo(event)
  );
}
```

Метод `addEventListener()` позволяет подписать элемент на событие. Стрелочная функция сохраняет `this`, поэтому внутри `handleAddTodo()` можно обращаться к текущему экземпляру `Store`.

Вызовем настройку формы при инициализации приложения:

```js
init() {
  this.form();
  this.ui();
}
```

Сначала подключаем обработчик формы, затем впервые отображаем список задач.

### Получим данные формы

Добавим метод `handleAddTodo()`:

```js
handleAddTodo(event) {
  event.preventDefault();

  const title = event.target.elements.todo.value;

  if (!title) {
    return;
  }

  event.target.elements.todo.value = '';

  this._addTodo(title);
  this.ui();
}
```

По умолчанию отправка формы перезагружает страницу. Метод `event.preventDefault()` отменяет это браузерное поведение, чтобы состояние приложения не потерялось.

`event.target` — форма, которая отправила событие. Коллекция `elements` содержит её поля, а свойство `todo` соответствует атрибуту `name`:

```html
<input name="todo">
```

Поэтому значение поля можно получить так:

```js
event.target.elements.todo.value;
```

Если строка пустая, `return` завершает обработчик и задача не добавляется. После успешной проверки очищаем поле.

Текущая проверка пропускает строку, состоящую только из пробелов. При необходимости её можно усилить с помощью `trim()`:

```js
const title = event.target.elements.todo.value.trim();

if (!title) {
  return;
}
```

### Изменим состояние

Добавим внутренний метод `_addTodo()`:

```js
_addTodo(title) {
  this.todos.push({
    id: Date.now(),
    title,
    completed: false
  });
}
```

Метод `push()` добавляет новый объект в конец массива. Новая задача получает:

- идентификатор из текущего времени;
- название из поля формы;
- начальный статус `completed: false`.

`Date.now()` возвращает количество миллисекунд, прошедших с 1 января 1970 года. Для небольшого учебного приложения этого достаточно, хотя в реальном проекте идентификатор обычно создаёт сервер или используется `crypto.randomUUID()`.

После `_addTodo(title)` обработчик вызывает `this.ui()`. Интерфейс заново строится из обновлённого массива, и новая карточка появляется в группе Active.

Полный путь события:

```text
отправка формы
      ↓
preventDefault()
      ↓
чтение и проверка title
      ↓
_addTodo(title)
      ↓
изменение todos
      ↓
ui()
      ↓
обновлённый список
```

На этом этапе `Store` обрабатывает оба действия пользователя:

- изменение статуса задачи;
- добавление новой задачи.

Оба обработчика следуют одному правилу: сначала изменить состояние, затем вызвать `ui()`.

## 15. Проверим готовое приложение

Итоговая структура проекта:

```text
src/
├── assets/
│   └── favicon.png
├── pages/
│   ├── about.html
│   └── index.html
├── scripts/
│   ├── data.js
│   ├── index.js
│   ├── store.js
│   └── todo.js
└── styles/
    ├── common.css
    ├── reset.css
    └── todo.css
```

JavaScript-файлы распределены по ответственности:

- `data.js` содержит начальный массив задач;
- `todo.js` группирует данные и создаёт DOM-элементы;
- `store.js` хранит состояние и обрабатывает действия пользователя;
- `index.js` создаёт и запускает приложение.

Итоговый поток данных:

```text
data.js
   ↓
new Store(TODOS)
   ↓
store.init()
   ↓
groupTodos(this.todos)
   ↓
renderTodoGroupList(...)
   ↓
DOM
```

Действия пользователя проходят в обратную сторону:

```text
событие в DOM
      ↓
обработчик Store
      ↓
изменение this.todos
      ↓
store.ui()
      ↓
новый DOM
```

### Запустим проект

Установим зависимости, если они ещё не установлены:

```bash
npm install
```

Запустим dev-сервер:

```bash
npm start
```

Откроем адрес, который Parcel выведет в терминале. По умолчанию это <http://localhost:1234>.

Проверим основные сценарии:

- при загрузке отображаются шесть активных и три выполненные задачи;
- нажатие на checkbox переносит задачу между группами;
- новая задача добавляется в группу Active;
- форма отправляется и кнопкой Add, и клавишей Enter;
- пустая строка не создаёт задачу;
- после добавления поле очищается;
- в Console нет ошибок;
- мобильные стили из первой практики продолжают работать.

Откроем вкладку Elements в DevTools и убедимся, что карточки действительно созданы JavaScript. В исходном `index.html` их нет, но после запуска они появляются в DOM.

Состояние пока хранится только в памяти. После обновления страницы массив снова создаётся из `TODOS`, поэтому добавленные задачи и изменённые статусы сбрасываются. Сохранение данных в `localStorage` можно добавить как отдельное упражнение.

### Соберём проект

Остановим dev-сервер сочетанием `Ctrl+C` и выполним:

```bash
npm run build
```

Parcel пройдёт по графу импортов от `index.js`, обработает связанные модули и создаст production-сборку в папке `dist`.

После сборки проверим:

- команда завершилась без ошибок;
- в `dist` появились собранные HTML, CSS и JavaScript;
- в исходном HTML подключён скрипт с `type="module"`;
- пути импортов разрешаются Parcel;
- `dist`, `.parcel-cache` и `node_modules` не добавлены в git.

## Дополнительные упражнения

Основная практика завершена. Попробуем расширить приложение и закрепить работу с состоянием, DOM и событиями.

### Не добавлять строки из пробелов

Применим `trim()` перед проверкой названия:

```js
const title = event.target.elements.todo.value.trim();

if (!title) {
  return;
}
```

Метод удаляет пробельные символы в начале и конце строки. В результате значение вроде `"   "` станет пустой строкой и не будет добавлено.

### Удаление задачи

Добавим к карточке кнопку Delete. При нажатии она должна передать `id` задачи в `Store`, удалить соответствующий объект из `todos` и вызвать `ui()`.

Для удаления можно использовать `filter()`:

```js
this.todos = this.todos.filter((todo) => todo.id !== todoId);
```

Нужно не забыть передать новый callback через всю цепочку функций рендеринга.

### Счётчик активных задач

Посчитаем задачи с `completed: false` и выведем количество рядом с заголовком:

```js
const activeCount = this.todos.filter(
  ({ completed }) => !completed
).length;
```

Счётчик должен обновляться после добавления задачи и изменения её статуса.

### Сделать обновление DOM устойчивее

Заменим зависимость от `container.lastChild` на явный поиск `.todo-list__groups`. Проверим, что приложение продолжает работать после изменения пробелов и комментариев в HTML.

## Если что-то не работает (troubleshooting)

Сначала откроем Console и Network в DevTools. Сообщение об ошибке обычно содержит имя файла и номер строки.

### `Cannot use import statement outside a module`

Проверим подключение точки входа:

```html
<script src="../scripts/index.js" type="module"></script>
```

Без `type="module"` браузер не разрешает использовать `import` и `export`.

### Модуль не найден

Проверим относительный путь и регистр символов в имени файла:

```js
import { Store } from './store';
```

Запустим проект через `npm start`. Пути без расширения обрабатывает Parcel. При использовании нативных модулей без сборщика укажем расширение `.js`.

### `Cannot read properties of null`

JavaScript не нашёл ожидаемый DOM-элемент. Проверим:

- совпадает ли `id="todo-form"` с аргументом `getElementById()`;
- существует ли `.todo-list` в HTML;
- запускается ли инициализация после построения DOM;
- не был ли нужный элемент удалён предыдущим рендером.

### Форма перезагружает страницу

Убедимся, что обработчик подписан на `submit` и в его начале вызывается:

```js
event.preventDefault();
```

Также проверим, что `form()` вызывается внутри `init()`.

### Группы дублируются

При повторном вызове `ui()` нельзя каждый раз использовать только `appendChild()`. Старый `.todo-list__groups` нужно заменить новым элементом.

### Задача не переходит между группами

Проверим последовательность:

1. карточка вызывает callback с `todo.id`;
2. `_completeTodo()` находит задачу;
3. значение `completed` меняется;
4. `handleCompleteTodo()` вызывает `ui()`.

При строгом сравнении `===` типы идентификаторов тоже должны совпадать.

### Изменения JavaScript не появляются

Остановим dev-сервер сочетанием `Ctrl+C`, удалим только кеш и результат предыдущей сборки, затем снова запустим проект:

```bash
rm -rf .parcel-cache dist
npm start
```

Исходные файлы из `src` не удаляем.
