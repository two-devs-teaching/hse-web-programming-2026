# Практика №3. Браузерные API

На второй практике мы добавили приложению **Todo Today** интерактивность с помощью JavaScript: перенесли задачи из HTML в массив данных, научились создавать DOM-элементы, разделили код на модули и собрали хранилище состояния `Store`.

Пока состояние приложения существует только в памяти. После перезагрузки страницы добавленные задачи исчезают, а исходный массив приходится передавать в `Store` при запуске приложения. Кроме того, задачи можно вводить только с клавиатуры, а длинный список отображается целиком.

На этой практике познакомимся с браузерными API и расширим приложение:

- сохраним задачи между перезагрузками страницы с помощью `localStorage`;
- сделаем `localStorage` постоянным источником данных приложения;
- реализуем порционную загрузку задач;
- будем загружать следующую порцию при приближении к концу списка с помощью `IntersectionObserver`;
- добавим голосовой ввод через Web Speech API;
- проверим поддержку голосового ввода перед использованием API.

В результате задачи будут храниться в браузере, большой список будет загружаться порциями, а поле ввода можно будет заполнить голосом.

## Что понадобится

Продолжим работу с результатом второй практики. Нам понадобятся:

- редактор кода;
- браузер с DevTools;
- установленный Node.js;
- проект **Todo Today** с настроенным Parcel;
- доступ к микрофону для проверки голосового ввода.

Полезные материалы:

- [Web API](https://developer.mozilla.org/en-US/docs/Web/API)
- [Window: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Infinite loading в руководстве Motion](https://motion.dev/tutorials/react-infinite-loading)
- [SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)
- [Поддержка Speech Recognition на Can I use](https://caniuse.com/speech-recognition)

## 1. Local Storage

### 1.1. Познакомимся с `localStorage`

Во второй практике массив задач находился в памяти JavaScript. При обновлении страницы скрипт запускался заново, поэтому все сделанные пользователем изменения пропадали.

`localStorage` — часть Web Storage API, которая позволяет сохранять данные в браузере. Данные привязаны к источнику страницы — сочетанию протокола, домена и порта — и остаются доступными после перезагрузки и повторного открытия браузера.

Обратиться к хранилищу можно через `window.localStorage`. Обычно `window` опускают:

```js
localStorage.setItem('message', 'Hello');
```

Основные методы `localStorage`:

- `setItem(key, value)` — сохранить значение;
- `getItem(key)` — получить значение или `null`, если ключ не найден;
- `removeItem(key)` — удалить значение;
- `clear()` — очистить хранилище целиком.

`localStorage` хранит только строки. Объекты и массивы перед сохранением нужно преобразовать в JSON, а после чтения — восстановить:

```js
const todo = {
  id: 1,
  title: 'Learn Web API',
  completed: false
};

localStorage.setItem('todo', JSON.stringify(todo));

const rawTodo = localStorage.getItem('todo');
const savedTodo = JSON.parse(rawTodo);

console.log(savedTodo);
```

Выполним пример в консоли DevTools и обновим страницу. Объект останется в хранилище. Его также можно увидеть на вкладке **Application → Storage → Local Storage**.

Удалим экспериментальное значение:

```js
localStorage.removeItem('todo');
```

В приложении будем хранить весь массив задач под одним ключом `todos`.

### 1.2. Создадим модуль для работы с `localStorage`

Вынесем работу с браузерным хранилищем из `Store` в отдельный модуль. Создадим папку `web-api` и файл `local-storage.js`:

```text
src/
└── scripts/
    └── web-api/
        └── local-storage.js
```

В начале файла объявим ключ, под которым будем хранить массив задач:

```js
const LOCAL_STORAGE_TODOS_KEY = 'todos';
```

Ключ вынесен в константу, чтобы не повторять строку `'todos'` во всех функциях и не получить разные ключи из-за опечатки.

Добавим функцию чтения задач:

```js
export const getTodosByLS = () => {
    const rawTodos = localStorage.getItem(LOCAL_STORAGE_TODOS_KEY);

    if (!rawTodos) {
        const value = JSON.stringify([]);

        localStorage.setItem(LOCAL_STORAGE_TODOS_KEY, value);

        return [];
    } else {
        return JSON.parse(rawTodos);
    }
};
```

`getItem()` возвращает строку или `null`. Если значения ещё нет, функция создаёт в `localStorage` пустой массив и возвращает `[]`. При следующих вызовах сохранённая JSON-строка преобразуется обратно в массив с помощью `JSON.parse()`.

Таким образом, остальной части приложения не придётся самостоятельно проверять существование ключа или преобразовывать JSON. Она всегда будет получать из `getTodosByLS()` массив.

### 1.3. Научимся сохранять новые задачи

Добавим в `local-storage.js` функцию, которая сохраняет новую задачу:

```js
export const addTodoByLS = (todo) => {
    const rawTodos = localStorage.getItem(LOCAL_STORAGE_TODOS_KEY);

    if (!rawTodos) {
        const todos = [todo];
        const value = JSON.stringify(todos);

        localStorage.setItem(LOCAL_STORAGE_TODOS_KEY, value);
    } else {
        const todos = JSON.parse(rawTodos);

        todos.unshift(todo);

        const value = JSON.stringify(todos);

        localStorage.setItem(LOCAL_STORAGE_TODOS_KEY, value);
    }
};
```

Изменить отдельный элемент внутри `localStorage` нельзя. Поэтому функция выполняет последовательность «прочитать — изменить — записать»:

1. получает JSON-строку из хранилища;
2. преобразует её в массив;
3. добавляет новый объект в начало массива с помощью `unshift()`;
4. снова преобразует массив в JSON;
5. записывает обновлённую строку под тем же ключом.

Если ключа `todos` ещё нет, функция сразу создаёт массив из переданного объекта. Благодаря этому `addTodoByLS()` можно вызвать независимо от `getTodosByLS()`.

Новые задачи добавляются через `unshift()`, а не через `push()`, поэтому они будут находиться в начале сохранённого списка.

### 1.4. Сохраним изменение статуса задачи

Когда пользователь отмечает задачу выполненной, её новое состояние также нужно записать в браузерное хранилище. Добавим в `local-storage.js` функцию `completeTodoByLS()`:

```js
export const completeTodoByLS = (id) => {
    const rawTodos = localStorage.getItem(LOCAL_STORAGE_TODOS_KEY);

    if (!rawTodos) {
        throw new Error('TODOS_NOT_FOUND');
    }

    const todos = JSON.parse(rawTodos);
    
    for (const todo of todos) {
        if (todo.id === id) {
            todo.completed = !todo.completed;
        }
    }

    const value = JSON.stringify(todos);

    localStorage.setItem(LOCAL_STORAGE_TODOS_KEY, value);  
};
```

Функция получает идентификатор задачи, читает весь массив и ищет нужный объект. Когда идентификаторы совпадают, логическое значение `completed` меняется на противоположное:

```js
todo.completed = !todo.completed;
```

После изменения весь массив снова сериализуется и записывается в `localStorage`.

Если ключ `todos` отсутствует, изменять нечего. В этом случае функция выбрасывает ошибку `TODOS_NOT_FOUND`. Такое поведение помогает обнаружить нарушение ожидаемого порядка работы приложения, вместо того чтобы незаметно проигнорировать проблему.

### 1.5. Сделаем `localStorage` источником данных

До сих пор начальный массив передавался в конструктор `Store` из файла `data.js`. Теперь задачи должны загружаться из браузерного хранилища.

Импортируем функцию чтения в `store.js`:

```js
import { getTodosByLS } from './web-api/local-storage';
```

Изменим конструктор и начальную загрузку:

```js
export class Store {
    constructor() {
        this.todos = [];
    }

    init() {
        this.form();
        this._loadInitialTodos();
    }

    _loadInitialTodos() {
        this.todos = getTodosByLS();

        this.ui();
    }

    // Остальные методы класса
}
```

Раньше конструктор получал готовый массив извне:

```js
const store = new Store(TODOS);
```

Теперь `Store` самостоятельно запрашивает сохранённые задачи во время инициализации. Изменим `index.js`:

```js
import { Store } from './store';

const store = new Store();

document.addEventListener('DOMContentLoaded', () => store.init());
```

Импорт `TODOS` больше не нужен, а файл `data.js` можно удалить.

Свойство `this.todos` пока остаётся в классе, но его роль меняется. Оно хранит рабочую копию данных для отображения интерфейса, а постоянным источником данных становится `localStorage`. После перезагрузки страницы рабочая копия создаётся заново из сохранённого массива.

При первом запуске хранилище будет пустым, поэтому список задач тоже окажется пустым. Задачи, добавленные пользователем после этого, должны сохраняться между перезагрузками страницы.

### 1.6. Синхронизируем изменения с `localStorage`

Добавление задачи и изменение её статуса пока обновляют только `this.todos`. Подключим остальные функции нового модуля:

```js
import {
    addTodoByLS,
    getTodosByLS,
    completeTodoByLS
} from './web-api/local-storage';
```

Изменим обработчик завершения задачи:

```js
handleCompleteTodo(id) {
    // Обновляем внешнее хранилище
    completeTodoByLS(id);

    // Обновляем локальную рабочую копию
    for (const todo of this.todos) {
        if (todo.id === id) {
            todo.completed = !todo.completed;
        }
    }

    // Перерисовываем интерфейс
    this.ui();
}
```

Сначала новое состояние записывается в `localStorage`, затем обновляется рабочая копия `this.todos` и перерисовывается интерфейс.

Аналогично изменим добавление задачи:

```js
handleAddTodo(event) {
    event.preventDefault();

    const title = event.target.elements.todo.value;

    if (!title) {
        return;
    }
    
    event.target.elements.todo.value = '';

    const newTodo = {
        title,
        completed: false,
        id: Date.now()
    };

    // Обновляем внешнее хранилище
    addTodoByLS(newTodo);

    // Обновляем локальную рабочую копию
    this.todos.unshift(newTodo);

    // Перерисовываем интерфейс
    this.ui();
}
```

Объект задачи теперь создаётся непосредственно в обработчике. В качестве идентификатора используем результат `Date.now()` — количество миллисекунд, прошедших с начала эпохи Unix.

Прежние методы `_addTodo()` и `_completeTodo()` можно удалить: их работу теперь выполняют функции модуля `local-storage.js` и обновление рабочей копии внутри обработчиков.

Проверим результат:

1. добавим несколько задач;
2. отметим одну из них выполненной;
3. обновим страницу;
4. убедимся, что список и статусы задач сохранились;
5. посмотрим значение ключа `todos` на вкладке **Application → Storage → Local Storage**.

## 2. Intersection Observer

Сейчас приложение читает из `localStorage` и отображает все задачи одновременно. Для небольшого списка этого достаточно, но при большом количестве данных первоначальный рендеринг становится тяжелее.

Разобьём список на страницы и будем добавлять следующую порцию задач, когда пользователь приблизится к концу уже отображённой части. Момент приближения к концу списка определим с помощью `IntersectionObserver`.

### 2.1. Подготовим данные для порционной загрузки

Чтобы проверить подгрузку, нескольких задач недостаточно. Создадим файл `scripts/mock.js` с массивом из 50 тестовых задач:

```js
const MOCK_TODOS = [
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

    // Остальные тестовые задачи

    {
        id: 49,
        title: 'Review weekly progress',
        completed: false
    }
];
```

Добавим функцию, которая записывает подготовленный массив в `localStorage`:

```js
export const setMockData = () => {
    localStorage.setItem('todos', JSON.stringify(MOCK_TODOS));
};
```

В готовом коде эта функция записана короче:

```js
export const setMockData = () =>
    localStorage.setItem('todos', JSON.stringify(MOCK_TODOS));
```

Для однократного заполнения хранилища временно импортируем и вызовем функцию в `index.js`:

```js
import { setMockData } from './mock';

setMockData();
```

Откроем приложение и проверим на вкладке **Application → Storage → Local Storage**, что под ключом `todos` появился массив из 50 элементов.

После этого удалим временный импорт и вызов из `index.js`. Данные уже находятся в `localStorage` и сохранятся после обновления страницы.

`mock.js` нужен только для подготовки демонстрационных данных. В отличие от прежнего `data.js`, приложение не импортирует массив в `Store`: постоянным источником данных по-прежнему остаётся `localStorage`.

> `setMockData()` полностью перезаписывает значение ключа `todos`. Не следует оставлять её вызов в приложении, иначе при каждом открытии страницы пользовательские изменения будут сбрасываться.

### 2.2. Добавим пагинацию в модуль `localStorage`

Для бесконечной прокрутки нельзя каждый раз возвращать весь массив. Функция чтения должна получать только очередную порцию задач.

Используем пагинацию по курсору. Курсором будет идентификатор последней уже загруженной задачи, а `limit` задаст размер следующей порции.

Добавим в `local-storage.js` функцию `getTodosByLSWithPagination()`:

```js
export const getTodosByLSWithPagination = (cursor, limit) => {
    const todos = getTodosByLS();

    if (todos.length === 0) {
        return [];
    }

    if (!cursor) {
        return todos.slice(0, limit);
    }

    const cursorIndex = todos.findIndex(todo => todo.id === cursor);

    if (cursorIndex === -1) {
        return [];
    }

    const startIndex = cursorIndex + 1;

    return todos.slice(startIndex, startIndex + limit);
};
```

Функция работает в двух режимах:

- если курсор не передан, возвращает первые `limit` элементов;
- если курсор передан, находит соответствующую задачу и возвращает следующие `limit` элементов после неё.

Метод `slice()` не изменяет исходный массив. Второй аргумент задаёт индекс, перед которым нужно остановиться, поэтому конец диапазона вычисляется как `startIndex + limit`.

Например, при размере страницы `10` первый вызов выглядит так:

```js
getTodosByLSWithPagination(null, 10);
```

Он вернёт задачи с индексами от `0` до `9`. Для следующего вызова передадим идентификатор последней полученной задачи:

```js
getTodosByLSWithPagination(lastTodoId, 10);
```

Если курсор не найден или после него больше нет элементов, функция возвращает пустой массив. Так вызывающий код сможет определить, что данные закончились.

### 2.3. Создадим индикатор загрузки и sentinel

Для работы бесконечной прокрутки добавим в конец списка специальный элемент — **sentinel**. Он не виден пользователю, но `IntersectionObserver` сможет отслеживать его приближение к области просмотра.

Также понадобится индикатор, который будет отображаться во время загрузки следующей страницы.

Сгруппируем функции отображения в папке `ui`. Перенесём существующий `todo.js` в эту папку и создадим ещё два файла:

```text
src/scripts/
├── ui/
│   ├── index.js
│   ├── infinite-scroll.js
│   └── todo.js
└── web-api/
    ├── intersection-observer.js
    └── local-storage.js
```

В `ui/infinite-scroll.js` добавим функцию рендеринга индикатора:

```js
export const renderLoadingIndicator = () => {
    const loadingElement = document.createElement('div');
    
    loadingElement.className = 'loading-indicator';
    loadingElement.id = 'loading-indicator';
    loadingElement.innerHTML = `<div class="loading-spinner"></div>`;
    
    return loadingElement;
};
```

Рядом создадим функцию рендеринга sentinel-элемента:

```js
export const renderSentinel = () => {
    const sentinel = document.createElement('div');

    sentinel.className = 'sentinel';
    sentinel.id = 'sentinel';
    sentinel.style.height = '1px';
    sentinel.style.visibility = 'hidden';

    return sentinel;
};
```

Sentinel занимает один пиксель по высоте, но остаётся невидимым. Он нужен не для отображения, а как наблюдаемая точка в конце списка.

Экспортируем UI-функции через общий файл `ui/index.js`:

```js
export * from './infinite-scroll';
export * from './todo';
```

Теперь другие модули могут импортировать функции из папки целиком:

```js
import {
    groupTodos,
    renderTodoGroupList
} from './ui';
```

Для демонстрации пагинации будем сохранять порядок элементов из `localStorage`, не разделяя загруженную страницу на активную и завершённую группы. Изменим `groupTodos()` в `ui/todo.js`:

```js
export const groupTodos = (todos) => {
    const activeGroup = {
        id: 'active',
        title: 'Active',
        headless: true,
        todos
    };

    return [activeGroup];
};
```

Статус выполнения по-прежнему виден по состоянию чекбокса, но все загруженные задачи выводятся в исходном порядке.

У `.page` удалим фиксированную высоту `height: 100vh`, чтобы страница увеличивалась вместе со списком. Затем добавим стили индикатора, анимации и sentinel-элемента:

```css
.page {
    display: flex;
    justify-content: center;
}

.loading-indicator {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    gap: 15px;
}

.loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f3f3;
    border-top: 3px solid #8b8b8b;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.loading-indicator p {
    font-size: 16px;
    color: var(--color-text-secondary);
    margin: 0;
}

.sentinel {
    height: 1px;
    visibility: hidden;
}

@media (max-width: 720px) {
    .loading-indicator {
        padding-top: 12px;
        padding-bottom: 80px;
    }

    .todo-list:not(:has(> .loading-indicator)) > .todo-list__groups {
        padding-bottom: 120px;
    }
}
```

На узком экране индикатор получает дополнительное место снизу. Когда индикатора нет, селектор `:has()` добавляет нижний отступ списку задач. Так последние элементы не прилипают к краю экрана, а появление loader не создаёт лишний двойной отступ.

Правило `.loading-indicator p` пригодится, если рядом со спиннером появится текст загрузки. В текущем варианте индикатор содержит только `.loading-spinner`.

### 2.4. Настроим `IntersectionObserver`

`IntersectionObserver` асинхронно сообщает, когда наблюдаемый элемент пересекается с областью просмотра или другим заданным контейнером. Нам не придётся самостоятельно обрабатывать каждое событие `scroll` и вычислять координаты sentinel-элемента.

В файле `web-api/intersection-observer.js` импортируем созданные UI-функции и объявим класс для управления бесконечной прокруткой:

```js
import {
    renderLoadingIndicator,
    renderSentinel
} from '../ui';

export class InfiniteScrollManager {
    constructor(onLoadMore, pageSize = 10) {
        this.onLoadMore = onLoadMore;
        this.pageSize = pageSize;
        this.observer = null;
        this.sentinel = null;
        this.loadingIndicator = null;
        this.isLoading = false;
        this.hasMoreData = true;
    }
}
```

Конструктор получает функцию `onLoadMore`, которую нужно вызвать для загрузки следующей страницы. Остальные свойства хранят состояние механизма прокрутки:

- `observer` — экземпляр `IntersectionObserver`;
- `sentinel` — наблюдаемый элемент в конце списка;
- `loadingIndicator` — индикатор загрузки;
- `isLoading` — защита от одновременного запуска нескольких загрузок;
- `hasMoreData` — признак того, что в хранилище остались данные.

Добавим метод инициализации:

```js
init() {
    this.observer = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        {
            root: null,
            rootMargin: '50px',
            threshold: 0.1
        }
    );
}
```

Конструктор `IntersectionObserver` получает два аргумента:

1. функцию, которую браузер вызовет при изменении пересечения;
2. объект с настройками наблюдения.

Разберём переданные настройки:

- `root: null` — проверяем пересечение с областью просмотра браузера. Вместо `null` можно передать DOM-элемент, который является предком наблюдаемой цели;
- `rootMargin: '50px'` — расширяем границы области наблюдения на 50 пикселей с каждой стороны. Благодаря положительному отступу загрузка начнётся немного раньше, чем sentinel фактически появится на экране;
- `threshold: 0.1` — callback вызывается при пересечении порога в 10% площади наблюдаемого элемента.

Синтаксис `rootMargin` похож на CSS-свойство `margin`: можно передать от одного до четырёх значений в пикселях или процентах. Положительные значения расширяют область срабатывания, а отрицательные — сужают её.

`threshold` может быть одним числом от `0` до `1` или массивом чисел. Например, `0` реагирует уже на касание границы, `0.5` — на появление половины элемента, а `1` — на полную видимость.

В callback приходит массив `IntersectionObserverEntry`. Каждый объект описывает изменение пересечения одной наблюдаемой цели. Позже проверим свойство `entry.isIntersecting`, чтобы отличить появление sentinel от его выхода из области наблюдения.

### 2.5. Обработаем пересечение и загрузку данных

Добавим в `InfiniteScrollManager` обработчик пересечения:

```js
async handleIntersection(entries) {
    const entry = entries[0];
    
    if (entry.isIntersecting && !this.isLoading && this.hasMoreData) {
        this.isLoading = true;
        this.showLoading();
        
        try {
            const hasMore = await this.onLoadMore();

            this.hasMoreData = hasMore;
            
            if (!hasMore) {
                this.cleanup();
            }
        } catch (error) {
            console.error('Error loading more todos:', error);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
}
```

Мы наблюдаем только за одним sentinel, поэтому берём первый объект из `entries`. Загрузка начинается, только если одновременно выполняются три условия:

- `entry.isIntersecting` — sentinel пересёкся с расширенной областью просмотра;
- `!this.isLoading` — предыдущая загрузка уже завершилась;
- `this.hasMoreData` — в хранилище ещё могут быть задачи.

Функция `onLoadMore()` асинхронная. Она должна вернуть `true`, если можно ожидать ещё одну страницу, и `false`, если данные закончились.

Блок `finally` выполнится и после успешной загрузки, и после ошибки. Поэтому флаг `isLoading` и индикатор всегда вернутся в исходное состояние.

#### Покажем состояние загрузки

Добавим методы управления индикатором:

```js
showLoading() {
    if (!this.loadingIndicator) {
        this.loadingIndicator = renderLoadingIndicator();
    }
    
    if (this.sentinel && this.sentinel.parentNode) {
        this.sentinel.parentNode.insertBefore(
            this.loadingIndicator,
            this.sentinel
        );
    }
}

hideLoading() {
    if (this.loadingIndicator && this.loadingIndicator.parentNode) {
        this.loadingIndicator.parentNode.removeChild(
            this.loadingIndicator
        );
    }
}
```

Индикатор создаётся один раз и переиспользуется. Во время загрузки он вставляется непосредственно перед sentinel, а после завершения удаляется из DOM.

#### Подключим sentinel к наблюдателю

Метод `attachSentinel()` создаёт sentinel, добавляет его в контейнер и начинает наблюдение:

```js
attachSentinel(container) {
    if (!this.hasMoreData) {
        return;
    }

    this.sentinel = renderSentinel();

    container.appendChild(this.sentinel);
    
    if (this.observer) {
        this.observer.observe(this.sentinel);
    }
}
```

Само создание `IntersectionObserver` ещё не запускает наблюдение. Для каждой цели нужно отдельно вызвать метод `observe()`.

Перед перерисовкой интерфейса старый sentinel необходимо отключить и удалить:

```js
detachSentinel() {
    if (this.sentinel) {
        if (this.observer) {
            this.observer.unobserve(this.sentinel);
        }
        
        if (this.sentinel.parentNode) {
            this.sentinel.parentNode.removeChild(this.sentinel);
        }
        
        this.sentinel = null;
    }
}
```

`unobserve()` прекращает наблюдение только за переданным элементом. В отличие от него, `disconnect()` сразу отключает наблюдатель от всех целей.

Добавим полную очистку:

```js
cleanup() {
    this.detachSentinel();
    this.hideLoading();
    
    if (this.observer) {
        this.observer.disconnect();
    }
}
```

Она понадобится, когда следующей страницы больше нет. Для возможного повторного запуска добавим метод `reset()`:

```js
reset() {
    this.cleanup();

    this.hasMoreData = true;
    this.isLoading = false;
    
    if (this.observer) {
        this.observer.disconnect();
    }
    
    this.init();
}
```

После сброса менеджер снова считает, что данные могут быть доступны, и создаёт новый экземпляр `IntersectionObserver`.

### 2.6. Подключим бесконечную прокрутку к `Store`

Импортируем менеджер, обычное чтение хранилища и функцию чтения с пагинацией в `store.js`:

```js
import {
    addTodoByLS,
    getTodosByLS,
    completeTodoByLS,
    getTodosByLSWithPagination
} from './web-api/local-storage';
import {
    InfiniteScrollManager
} from './web-api/intersection-observer';
```

Создадим менеджер в конструкторе `Store` и зададим размер страницы:

```js
constructor() {
    this.todos = [];
    this.pageSize = 10;
    this.infiniteScrollManager = new InfiniteScrollManager(
        () => this._loadMoreTodos(),
        this.pageSize
    );
}
```

Стрелочная функция сохраняет контекст `Store`, поэтому внутри `_loadMoreTodos()` значение `this` будет указывать на нужный экземпляр.

Инициализируем наблюдатель до первого рендеринга:

```js
init() {
    this.infiniteScrollManager.init();        
    this.form();
    this._loadInitialTodos();
}
```

Начальная загрузка теперь получает только первую страницу:

```js
_loadInitialTodos() {
    this.todos = getTodosByLSWithPagination(
        null,
        this.pageSize
    );

    this.ui();
}
```

#### Загрузим следующую страницу

Добавим метод `_loadMoreTodos()`:

```js
async _loadMoreTodos() {
    if (this.todos.length === 0) {
        return false;
    }

    const lastTodoId = this.todos[this.todos.length - 1].id;
    
    // Добавляем искусственную задержку для демонстрации лоадера
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newTodos = getTodosByLSWithPagination(
        lastTodoId,
        this.pageSize
    );
    
    if (newTodos.length === 0) {
        return false;
    }

    this.todos.push(...newTodos);
    this.ui();
    
    return newTodos.length === this.pageSize;
}
```

В качестве курсора берём `id` последней задачи из рабочей копии. Оператор расширения `...` передаёт элементы новой страницы в `push()`, поэтому они добавляются в существующий массив, а не образуют вложенный массив.

Задержка в 1,5 секунды не нужна для работы API. Она имитирует сетевой запрос и позволяет увидеть индикатор загрузки. В реальном приложении на этом месте обычно находился бы `fetch()`.

Метод возвращает логическое значение для `InfiniteScrollManager`. Полная страница означает, что данные ещё могут быть доступны. Пустая или неполная страница означает, что мы приблизились к концу списка.

#### Обновим рендеринг списка

Раньше метод `ui()` заменял последний дочерний элемент контейнера. Теперь последним элементом может быть sentinel или индикатор, поэтому такое предположение больше не подходит.

Вынесем рендеринг задач в отдельный метод:

```js
_renderTodos(container) {
    const groups = groupTodos(this.todos);
    const groupsElement = renderTodoGroupList(
        groups,
        (event) => this.handleCompleteTodo(event)
    );

    const existingGroups = container.querySelectorAll(
        '.todo-list__groups'
    );

    existingGroups.forEach((group) => group.remove());

    container.appendChild(groupsElement);
}
```

Мы явно находим старые `.todo-list__groups`, удаляем их и добавляем заново созданный список. Остальные дочерние элементы контейнера при этом не затрагиваются.

После списка отобразим sentinel, только если загружены ещё не все задачи:

```js
_renderSentinel(container) {
    this.infiniteScrollManager.detachSentinel();

    const allTodos = getTodosByLS();
    
    if (this.todos.length < allTodos.length) {
        this.infiniteScrollManager.attachSentinel(container);
    }
}
```

Перед добавлением нового sentinel отключаем старый. Сравнение количества отображённых задач с полным массивом позволяет не оставлять наблюдаемую точку после загрузки последней страницы.

Итоговый метод `ui()` объединяет два этапа:

```js
ui() {
    const container = document.getElementsByClassName(
        'todo-list'
    )[0];

    this._renderTodos(container);
    this._renderSentinel(container);
}
```

Проверим бесконечную прокрутку:

1. обновим страницу — сначала должны появиться 10 задач;
2. прокрутим список вниз;
3. убедимся, что появился индикатор загрузки;
4. дождёмся добавления следующей десятки;
5. продолжим прокрутку до конца всех тестовых данных;
6. проверим, что после последней страницы индикатор и sentinel больше не появляются.

## 3. Speech Recognition

Добавим к форме голосовой ввод. Пользователь сможет нажать кнопку с микрофоном, произнести текст задачи и получить расшифровку в обычном поле ввода.

Для этого воспользуемся частью Web Speech API — интерфейсом `SpeechRecognition`.

### 3.1. Добавим кнопку голосового ввода

Разместим кнопку с иконкой микрофона между текстовым полем и кнопкой **Add**:

```html
<form class="todo-list__text-field" id="todo-form">
  <input type="text" name="todo">

  <button
    aria-label="Voice input"
    id="todo-voice-input"
    type="button"
  >
    <svg
      width="18"
      height="23"
      viewBox="0 0 18 23"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Контур иконки микрофона -->
    </svg>
  </button>

  <button type="submit">Add</button>
</form>
```

Атрибут `type="button"` важен: кнопка внутри формы по умолчанию имеет тип `submit`. Без явно заданного типа нажатие на микрофон отправляло бы форму.

У кнопки нет видимого текста, поэтому с помощью `aria-label` задаём доступное название для скринридеров.

Чтобы три элемента формы располагались компактнее, уменьшим расстояние между ними:

```css
.todo-list__text-field {
    max-height: 56px;
    display: flex;
    gap: 4px;
}
```

Кнопка микрофона получит уже существующие стили из правила `.todo-list__text-field > button`.

### 3.2. Проверим поддержку API

`SpeechRecognition` имеет ограниченную браузерную поддержку и не относится к возможностям Baseline. В одних браузерах доступен стандартный конструктор, в других — только версия с префиксом `webkit`, а некоторые браузеры не поддерживают распознавание речи.

Актуальное состояние поддержки можно проверить в двух местах:

- в таблице **Browser compatibility** на [странице `SpeechRecognition` в MDN](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#browser_compatibility);
- на странице [Speech Recognition API в Can I use](https://caniuse.com/speech-recognition).

Таблицы совместимости помогают принять решение при проектировании, но приложение должно проверить наличие API непосредственно перед использованием. Такая проверка называется **feature detection**.

Создадим файл `web-api/speech-recognition.js` и объявим функцию инициализации:

```js
export const initSpeechRecognition = (trigger, target) => {
    if (
        'webkitSpeechRecognition' in window ||
        'SpeechRecognition' in window
    ) {
        const SpeechRecognition =
            window.SpeechRecognition ||
            window.webkitSpeechRecognition;

        const recognition = new SpeechRecognition();

        // Настройка и обработчики появятся ниже.
    } else {
        trigger.addEventListener('click', (event) => {
            event.preventDefault();

            alert('Ваш браузер не поддерживает голосовой ввод');
        });
    }
};
```

Функция получает два элемента:

- `trigger` — кнопку, запускающую запись;
- `target` — поле, в которое нужно поместить распознанный текст.

Сначала выбираем стандартный `window.SpeechRecognition`. Если его нет, используем `window.webkitSpeechRecognition`. Проверять конкретное свойство надёжнее, чем пытаться определить браузер по `userAgent`.

Если оба варианта недоступны, кнопка остаётся на странице, но по нажатию объясняет пользователю причину, по которой голосовой ввод не запускается.

Наличие конструктора ещё не гарантирует успешное распознавание. Браузеру потребуется доступ к микрофону, а реализация API может зависеть от операционной системы, языка и подключения к интернету. Например, некоторые браузеры отправляют аудио внешнему сервису распознавания и не могут выполнять эту операцию офлайн. Возможные отказы обработаем через событие `error`.

### 3.3. Создадим и настроим распознавание речи

После выбора доступного конструктора создаём экземпляр распознавания:

```js
const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

const recognition = new SpeechRecognition();
```

Этот объект управляет одной сессией прослушивания микрофона и отправляет события во время распознавания.

Настроим его свойства:

```js
recognition.continuous = false;
recognition.interimResults = false;
recognition.lang = 'ru-RU';
```

Каждая настройка влияет на поведение сервиса:

- `continuous = false` — распознавание завершится после одного высказывания. При `true` сервис продолжал бы возвращать новые результаты, пока его не остановят;
- `interimResults = false` — браузер вернёт только окончательный результат. При `true` событие `result` могло бы приходить несколько раз с промежуточными, ещё изменяющимися вариантами;
- `lang = 'ru-RU'` — ожидаем русскую речь. Значение записывается в формате языкового тега BCP 47: сначала язык, затем регион.

Если `lang` не указать, браузер может взять язык из атрибута `lang` документа или из своих настроек. Явное значение делает поведение примера предсказуемым.

Для текстового поля задачи нам достаточно одного окончательного результата. Поэтому обе логические настройки имеют значение `false`.

### 3.4. Обработаем события распознавания

Сначала опишем две небольшие функции для переключения состояния кнопки:

```js
const onStart = () => {
    trigger.classList.add('recording');
    trigger.disabled = true;
};

const onEnd = () => {
    trigger.classList.remove('recording');
    trigger.disabled = false;
};
```

Во время записи кнопка получает класс `recording` и становится недоступной. Свойство `disabled` не позволяет запустить вторую сессию распознавания до завершения первой. Класс можно использовать как отдельный CSS-хук для дополнительного оформления активного состояния.

#### Запустим распознавание по нажатию

Добавим обработчик кнопки:

```js
trigger.addEventListener('click', (event) => {
    event.preventDefault();

    recognition.start();

    onStart();
});
```

Метод `start()` сообщает сервису, что нужно начать слушать микрофон. При первом запуске браузер может запросить у пользователя разрешение на его использование.

Хотя кнопка имеет `type="button"`, оставим `preventDefault()`: функция инициализации не будет зависеть от стандартного поведения переданного элемента.

#### Получим распознанный текст

Когда сервис распознает высказывание, он отправит событие `result`:

```js
recognition.addEventListener('result', (event) => {
    const transcript = event.results[0][0].transcript;

    target.value = transcript;

    onEnd();
});
```

`event.results` содержит список результатов. Каждый результат, в свою очередь, содержит варианты распознавания. В нашем примере берём:

- `[0]` — первый результат;
- ещё один `[0]` — наиболее вероятный вариант;
- `transcript` — строку с распознанным текстом.

Полученную строку записываем в `value` текстового поля. Задача при этом ещё не создаётся: пользователь может проверить текст и отправить форму обычной кнопкой **Add**.

#### Обработаем ошибку

Распознавание может завершиться ошибкой, например из-за запрета доступа к микрофону, отсутствия речи или недоступности сервиса:

```js
recognition.addEventListener('error', (event) => {
    alert('Ошибка голосового ввода: ' + event.error);

    onEnd();
});
```

Свойство `event.error` содержит короткий код причины. Независимо от причины возвращаем кнопку в обычное состояние.

#### Обработаем завершение сессии

Событие `end` возникает, когда сервис перестал слушать аудио и отключился:

```js
recognition.addEventListener('end', () => {
    onEnd();
});
```

Обработчик `end` служит общей страховкой: кнопка разблокируется даже в сценарии, который не привёл к `result`. Повторный вызов `onEnd()` безопасен — удаление отсутствующего класса и присваивание `false` свойству `disabled` не меняют результат.

### 3.5. Подключим голосовой ввод к `Store`

Экспортированная функция ничего не знает о конкретной форме. Она принимает готовые DOM-элементы, поэтому найдём их во время настройки `Store`.

Импортируем функцию в `store.js`:

```js
import {
    initSpeechRecognition
} from './web-api/speech-recognition';
```

Разделим настройку формы на два метода. Первый сохранит прежнюю подписку на отправку:

```js
_configureSubmit(todoForm) {
    todoForm.addEventListener(
        'submit',
        (event) => this.handleAddTodo(event)
    );
}
```

Второй найдёт кнопку микрофона и текстовое поле:

```js
_configureVoiceInput(todoForm) {
    const voiceInput = document.getElementById(
        'todo-voice-input'
    );
    const todoInput = todoForm.elements.todo;

    initSpeechRecognition(voiceInput, todoInput);
}
```

Коллекция `todoForm.elements` содержит элементы управления формы. Поле доступно под именем `todo`, потому что в HTML у него задан атрибут `name="todo"`.

Обновим метод `form()`:

```js
form() {
    const todoForm = document.getElementById('todo-form');
    
    this._configureSubmit(todoForm);
    this._configureVoiceInput(todoForm);
}
```

`Store` отвечает за поиск элементов конкретного приложения, а модуль `speech-recognition.js` — только за работу с браузерным API. Благодаря такому разделению функцию инициализации можно переиспользовать с другой кнопкой и другим текстовым полем.

### 3.6. Проверим готовое приложение

Запустим проект из папки `code`:

```bash
npm start
```

Откроем адрес, который выведет Parcel, в браузере с поддержкой `SpeechRecognition`.

Проверим приложение по шагам:

1. при первом открытии отображается только первая порция задач;
2. при приближении к концу списка появляется индикатор;
3. после задержки к списку добавляется следующая порция;
4. после загрузки всех задач новые запросы не запускаются;
5. добавленная задача остаётся после обновления страницы;
6. изменение чекбокса сохраняется в `localStorage`;
7. по нажатию на микрофон браузер запрашивает разрешение;
8. во время распознавания кнопка недоступна;
9. распознанный текст появляется в поле формы;
10. после результата или ошибки кнопка снова становится доступной.

При проверке голосового ввода произнесём короткую фразу по-русски. Настройка `lang = 'ru-RU'` не переводит речь, а сообщает сервису, какой язык он должен ожидать.

#### Как связаны части приложения

После всех изменений запуск выглядит так:

```text
index.js
└── создаёт Store и вызывает init()
    ├── InfiniteScrollManager.init()
    │   └── создаёт IntersectionObserver
    ├── form()
    │   ├── подключает submit
    │   └── подключает SpeechRecognition
    └── _loadInitialTodos()
        ├── читает первую страницу из localStorage
        ├── отображает задачи
        └── добавляет sentinel
```

Когда sentinel приближается к области просмотра, `InfiniteScrollManager` вызывает переданную ему функцию `_loadMoreTodos()`. `Store` получает следующую страницу из `localStorage`, обновляет рабочую копию и перерисовывает список.

Итоговое разделение ответственности:

| Модуль | Ответственность |
| --- | --- |
| `store.js` | Координирует данные, форму и перерисовку |
| `web-api/local-storage.js` | Читает и изменяет сохранённые задачи |
| `web-api/intersection-observer.js` | Следит за sentinel и управляет подгрузкой |
| `web-api/speech-recognition.js` | Управляет голосовым вводом |
| `ui/todo.js` | Создаёт DOM-элементы задач |
| `ui/infinite-scroll.js` | Создаёт sentinel и индикатор загрузки |

Готовую реализацию можно посмотреть в файлах:

- [`local-storage.js`](../code/src/scripts/web-api/local-storage.js)
- [`intersection-observer.js`](../code/src/scripts/web-api/intersection-observer.js)
- [`speech-recognition.js`](../code/src/scripts/web-api/speech-recognition.js)
- [`store.js`](../code/src/scripts/store.js)

#### Соберём проект

Проверим production-сборку:

```bash
npm run build
```

Parcel создаст оптимизированные файлы в папке `dist`. Успешная сборка дополнительно проверяет пути импортов после переноса `todo.js` в папку `ui`.

#### Если что-то не работает

**Список пуст после запуска.** Проверьте значение ключа `todos` на вкладке **Application → Storage → Local Storage**. Для демонстрации один раз вызовите `setMockData()`, а затем удалите вызов из `index.js`.

**Следующая страница не загружается.** В хранилище должно быть больше задач, чем значение `pageSize`. Проверьте наличие элемента `#sentinel` в DOM и убедитесь, что `InfiniteScrollManager.init()` вызывается до первого рендеринга.

**Индикатор появляется несколько раз.** Перед добавлением нового sentinel вызывайте `detachSentinel()`, а начало загрузки защищайте условием `!this.isLoading`.

**Страница не прокручивается.** Удалите у `.page` фиксированное значение `height: 100vh`, чтобы контейнер мог расти вместе со списком.

**Кнопка сообщает, что голосовой ввод не поддерживается.** Проверьте таблицы совместимости MDN и Can I use. Наличие `SpeechRecognition` можно проверить в консоли:

```js
'SpeechRecognition' in window ||
    'webkitSpeechRecognition' in window;
```

**Возникает ошибка `not-allowed`.** Разрешите странице доступ к микрофону в настройках браузера. Если разрешение было отклонено ранее, браузер может больше не показывать запрос автоматически.

**Распознавание не работает при открытии HTML-файла напрямую.** Запускайте проект через Parcel. Для некоторых реализаций Speech Recognition страница должна быть открыта через веб-сервер.

**Возникает ошибка `no-speech`.** Браузер не обнаружил речь до завершения сессии. Проверьте выбранный микрофон, уровень входного сигнала и повторите попытку.
