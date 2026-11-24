# Практика №5. Взаимодействие с бэкендом

На практике №3 мы научили **Todo Today** сохранять задачи в `localStorage`, загружать их порциями и заполнять поле голосом. Продолжим именно эту версию на обычном JavaScript: результат практики по React здесь не используется.

Теперь перенесём постоянное хранение задач на сервер. `Store` по-прежнему будет хранить рабочую копию для интерфейса, но получать и изменять данные станет через HTTP API.

На этой практике:

- прочитаем документацию API в Swagger UI и отправим запросы через Bruno;
- попробуем `fetch()` в браузере и разберём CORS;
- напишем функции получения, создания, изменения и удаления задач;
- разделим обработку ошибок между API-модулем и `Store`;
- добавим блокировку действий на время запроса и сообщение с повторной загрузкой;
- подключим серверную пагинацию к уже готовой бесконечной прокрутке.

На занятии пишем только фронтенд. Сервер уже подготовлен; краткое описание его устройства и команды запуска находятся в конце конспекта.

## Что понадобится

- Результат практики №3: `hw/hw-3-web-api/code`.
- Готовая реализация для сверки: `hw/hw-5-backend/code/frontend`.
- Node.js, npm, браузер с DevTools и установленный Bruno.
- Запущенный учебный сервер на `http://localhost:3000`.

В текущей работе папка `code` разделена на `frontend` и `backend`. Для лайвкодинга переносим результат №3 в `code/frontend`, сохраняя структуру `src`; сервер берём готовым. Все дальнейшие пути `src/...` относятся к фронтенду.

Запустим фронтенд из корня репозитория в отдельном терминале:

```bash
cd hw/hw-5-backend/code/frontend
npm ci
npm start
```

Откроем адрес, который напечатает Parcel, обычно `http://localhost:1234`. HTML через `file://` не открываем. В DevTools понадобятся **Console**, **Network** и **Elements**.

## 1. Познакомимся с API

### 1.1. Прочитаем Swagger-документацию

Откроем [Swagger UI учебного сервера](http://localhost:3000/api-docs). Машиночитаемое описание доступно по адресу [openapi.json](http://localhost:3000/openapi.json).

**OpenAPI** описывает адреса, методы, параметры и форматы данных. **Swagger UI** показывает это описание как интерактивную документацию. Это разные роли: JSON-файл содержит контракт, а интерфейс помогает его прочитать и попробовать запросы. Подробнее — [OpenAPI и инструменты Swagger](https://swagger.io/docs/specification/v3_0/about/).

В нашем API базовый адрес — `http://localhost:3000/api`. К нему добавляется путь конкретной операции:

| Метод и путь | Действие | Успешный ответ |
| --- | --- | --- |
| `GET /todos?limit=10` | Получить первую страницу | `200`, объект `{ todos, hasMore }` |
| `GET /todos?limit=10&cursor=9` | Получить страницу после задачи с ID `9` | `200`, объект `{ todos, hasMore }` |
| `GET /todos/{id}` | Получить одну задачу | `200`, объект задачи |
| `POST /todos` | Создать задачу | `201`, созданная задача |
| `PATCH /todos/{id}` | Изменить переданные поля | `200`, обновлённая задача |
| `DELETE /todos/{id}` | Удалить задачу | `204`, без тела ответа |

Значение `9` во втором примере подходит, только если такая задача существует. В приложении курсором будет ID последней полученной задачи, а не фиксированное число.

Развернём `GET /todos`, нажмём **Try it out**, зададим `limit = 10`, оставим `cursor` незаполненным и нажмём **Execute**. Посмотрим URL запроса, HTTP-статус и тело ответа. Сервер возвращает объект с двумя полями:

```js
{
    todos: [
        { id: 0, title: 'Drink 8 glasses of water', completed: false }
    ],
    hasMore: true
}
```

Это пример формы ответа, а не обещание конкретного содержимого: данные могли измениться. `todos` — очередная порция, `hasMore` — остались ли задачи после неё. Для первой страницы `cursor` вообще не передаём.

В схемах найдём `Todo`, `CreateTodo` и `UpdateTodo`. При создании отправляем непустой `title` и при необходимости `completed`. Числовой `id` назначает сервер. В `PATCH` можно передать только изменяемое поле, например `{ completed: true }`.

> Учебный сервер специально задерживает API-запросы на 300–5000 мс и примерно в 25% случаев возвращает `500` до выполнения операции. Поэтому даже корректный запрос может завершиться ошибкой. Посмотрим сообщение и повторим его вручную.

Проверка: можем по документации назвать адрес, метод, входные данные и ожидаемый ответ каждой операции.

### 1.2. Отправим те же запросы через Bruno

Bruno позволяет сохранять запросы и повторять их независимо от страницы нашего приложения. Основные действия показаны в [официальном руководстве Bruno](https://docs.usebruno.com/introduction/quick-start).

1. Создадим коллекцию **Todo API**.
2. Создадим HTTP-запрос с методом `GET` и адресом `http://localhost:3000/api/todos?limit=10`.
3. Отправим его и посмотрим статус, время выполнения и JSON ответа.
4. Создадим второй запрос: `POST http://localhost:3000/api/todos`.
5. Выберем JSON-тело и проверим заголовок `Content-Type: application/json`.
6. Отправим тело:

```json
{
    "title": "Попробовать API через Bruno",
    "completed": false
}
```

При успехе получим `201` и объект с новым `id`. Сохраним этот ID: он пригодится для `GET /todos/{id}`, `PATCH` и `DELETE`. Повторный успешный `POST` создаёт ещё одну задачу.

Можно также импортировать OpenAPI через **Import Collection**: выбрать OpenAPI и загрузить JSON из `http://localhost:3000/openapi.json` либо заранее сохранить его в файл. После импорта проверим базовый URL: спецификация задаёт относительный `/api`, а запросы Bruno должны обращаться к полному `http://localhost:3000/api`. Расположение пункта импорта зависит от интерфейса установленной версии; [официальное руководство по импорту](https://github.com/usebruno/bruno-docs/blob/main/v3/open-api/importOAS.mdx) описывает оба способа.

Проверка: повторный `GET` видит созданную задачу в начале списка. Swagger и Bruno обращаются к одним серверным данным.

## 2. Попробуем `fetch()` в браузере

### 2.1. Получим ответ в Console

Перейдём на вкладку **нашего фронтенда**, откроем Console и выполним:

```js
async function demoGetTodos() {
    try {
        const response = await fetch('http://localhost:3000/api/todos?limit=10', {
            method: 'GET'
        });

        console.log(response.status, response.ok);

        if (!response.ok) {
            throw new Error(`Ошибка запроса: ${response.status}`);
        }

        const data = await response.json();

        console.log(data.todos, data.hasMore);
    } catch (error) {
        console.error(error);
    }
}

demoGetTodos();
```

`fetch()` возвращает `Promise<Response>`. `await` приостанавливает выполнение этой асинхронной функции до результата. Сам объект `Response` содержит статус и заголовки; `response.json()` асинхронно читает тело и преобразует JSON в значение JavaScript. Эти операции разъясняются отдельно в [справке `fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/fetch) и [справке `Response.json()`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json).

`method: 'GET'` можно опустить: это значение по умолчанию. Но сначала запишем его явно и найдём метод в **Network → Headers**. Параметры `limit` и `cursor` передаются в URL; тела у этого GET-запроса нет.

Разберём заголовки: `Content-Type` описывает формат тела сообщения, `Accept` — желаемый формат ответа. Для GET без тела `Content-Type: application/json` не требуется. В итоговом API-модуле этот заголовок будет только у запросов с JSON-телом. Назначение настроек описано в [RequestInit](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit).

Проверка: в Network виден GET, а Console выводит данные после завершения запроса. Демонстрационная функция остаётся только в Console; в `index.js` её не переносим.

### 2.2. Почему возникает CORS

Адреса `http://localhost:1234` и `http://localhost:3000` имеют разные **origin**, потому что отличаются порты. Origin состоит из протокола, хоста и порта.

Браузер проверяет разрешение сервера на чтение ответа другим origin. В учебном сервере CORS уже настроен: в Network найдём заголовок ответа `Access-Control-Allow-Origin`. Код сервера на занятии менять не потребуется.

При JSON POST, а также PATCH и DELETE браузер обычно сначала отправляет проверочный `OPTIONS` — **preflight**. Для простого GET без дополнительных заголовков он обычно не нужен. Preflight может кешироваться, поэтому отдельный OPTIONS виден не при каждом повторе. Подробности — [руководство MDN по CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS).

Если запрос проходит в настольном Bruno, но не проходит из фронтенда, проверим Console браузера и CORS-заголовки. Swagger UI здесь открывается на origin API, поэтому его успешный запрос тоже не проверяет доступ с origin фронтенда.

`mode: 'no-cors'` не решает задачу получения JSON: ответ становится непрозрачным для JavaScript. Исправлять нужно настройки доступа на сервере. Заголовок `Access-Control-Allow-Origin` относится к **ответу**, добавлять его в запрос фронтенда не нужно. См. [описание режимов запроса](https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#mode).

Проверка: на вкладке фронтенда получаем доступный для чтения JSON; понимаем, чем это отличается от запроса в Bruno.

## 3. Напишем модуль API

### 3.1. Вынесем получение страницы в отдельную функцию

Создадим `src/scripts/api/index.js`. Сначала можно записать минимальную функцию, которая повторяет удачный эксперимент из Console:

```js
const API_URL = 'http://localhost:3000/api';

export const getTodos = async (cursor = null, limit = 10) => {
    const params = new URLSearchParams({ limit });

    if (cursor !== null) {
        params.set('cursor', cursor);
    }

    const response = await fetch(`${API_URL}/todos?${params}`, {
        method: 'GET'
    });

    if (!response.ok) {
        throw new Error(`Ошибка запроса: ${response.status}`);
    }

    return response.json();
};
```

Это промежуточная версия: ниже заменим её реализацией с общей функцией `request()`.

`URLSearchParams` собирает query-параметры. Значения в URL станут строками. Проверяем именно `cursor !== null`, поскольку `0` — допустимый ID. Проверка `if (cursor)` пропустила бы его.

После вызова `await getTodos()` получим `{ todos, hasMore }`, а не массив. Это отличие от прежней `getTodosByLSWithPagination()` важно учесть в `Store`.

Пока функция только объявлена. После подключения к `Store` в разделе 5 проверим в Network, что URL содержит `limit=10`, а для первой страницы не содержит `cursor=null`.

### 3.2. Создадим задачу через POST

Прежде чем обобщать код, разберём отправку данных на отдельном запросе в Console:

```js
async function demoCreateTodo() {
    try {
        const response = await fetch('http://localhost:3000/api/todos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'Изучить fetch', completed: false })
        });

        if (!response.ok) {
            throw new Error(`Ошибка запроса: ${response.status}`);
        }

        console.log(await response.json());
    } catch (error) {
        console.error(error);
    }
}

demoCreateTodo();
```

`body` содержит строку JSON, а заголовок сообщает серверу формат этой строки. Передача обычного объекта без `JSON.stringify()` не создаёт JSON-тело. Настройки отправки разобраны в [руководстве по Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#setting_a_body).

В **Network → Payload** увидим `title` и `completed`, а в **Response** — созданную задачу с `id`. На фронтенде больше не генерируем ID через `Date.now()`: используем объект, который вернул сервер.

Проверка: после успешного `201` повторный GET возвращает созданную задачу. Демонстрационный POST не оставляем в точке входа: иначе каждый запуск страницы создавал бы новую задачу.

### 3.3. Обработаем ошибки внутри `request()`

Получение и создание различаются методом, путём и телом, но одинаково проверяют ответ. Вынесем эту часть в общую функцию в начале `api/index.js`:

```js
const API_URL = 'http://localhost:3000/api';

const request = async (path, { method = 'GET', body } = {}) => {
    const options = { method };

    if (body !== undefined) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${path}`, options);

    if (!response.ok) {
        const error = await response.json().catch(() => null);

        throw new Error(error?.message ?? `Ошибка запроса: ${response.status}`);
    }

    if (response.status === 204) {
        return;
    }

    return response.json();
};
```

Второй аргумент необязательный. Если настройки не передали, получим метод `GET` и отсутствие тела. Проверка `body !== undefined` добавляет JSON-заголовок и сериализацию только тогда, когда есть что отправлять.

Здесь учитываем разные способы отказа:

- **Сетевая ошибка или CORS.** `fetch()` отклоняет Promise; ошибка сама передаётся вызывающему коду.
- **HTTP-ошибка.** Ответ `400`, `404` или `500` сам по себе не отклоняет Promise от `fetch()`. Поэтому проверяем `response.ok` и выбрасываем `Error`.
- **Ошибка чтения JSON.** Тело может оказаться пустым или содержать другой формат. Ошибку разбора успешного ответа передаём выше; при чтении сообщения неуспешного ответа используем запасной текст со статусом.

В выражении `error?.message ?? ...` оператор `?.` безопасно читает поле при `null`, а `??` подставляет запасной текст, если сообщения нет. Локальный `.catch(() => null)` относится только к попытке прочитать JSON ошибки; он не превращает неудачную операцию в успех.

Ответ `204 No Content` нельзя разбирать как JSON: тела нет. Поэтому выходим до вызова `response.json()`. Метод чтения тела возвращает Promise и может завершиться ошибкой разбора; см. [Response.json()](https://developer.mozilla.org/en-US/docs/Web/API/Response/json).

Уровню API достаточно вернуть данные или отклонить Promise. Он не знает, где на странице показывать сообщение. Общий `try/catch`, который только вывел бы ошибку в Console и вернул `undefined`, помешал бы вызывающему коду отличить ошибку от успешного ответа без тела.

### 3.4. Завершим функции конкретных операций

Заменим промежуточную `getTodos()` и добавим остальные экспорты после `request()`:

```js
export const getTodos = (cursor = null, limit = 10) => {
    const params = new URLSearchParams({ limit });

    if (cursor !== null) {
        params.set('cursor', cursor);
    }

    return request(`/todos?${params}`);
};

export const getTodo = (id) => request(`/todos/${id}`);

export const createTodo = (todo) => request('/todos', {
    method: 'POST',
    body: todo
});

export const updateTodo = (id, changes) => request(`/todos/${id}`, {
    method: 'PATCH',
    body: changes
});

export const deleteTodo = (id) => request(`/todos/${id}`, {
    method: 'DELETE'
});
```

Обёртки возвращают Promise от `request()`, поэтому сами не обязаны иметь `async`. `getTodo()` предусмотрена для получения одной задачи, но текущий интерфейс её не вызывает.

`PATCH` и `DELETE` расширяют исходный план с GET и POST: они присутствуют в готовом фронтенде. Через PATCH сохраним чекбокс, через DELETE добавим удаление. Для DELETE сервер вернёт `204`, и результатом `await deleteTodo(id)` будет `undefined`.

Проверка: в модуле остались одна общая обработка ответа и пять функций операций. Временные функции из Console не включены в приложение.

## 4. Подготовим интерфейс к асинхронным операциям

### 4.1. Добавим сообщение об ошибке

Теперь ответ приходит не сразу, а запрос может завершиться неудачей. Подготовим место для сообщения до подключения нового `Store`. В `src/pages/index.html` сразу после формы добавим:

```html
<div class="todo-list__error" id="todo-error" role="alert" hidden>
    <p id="todo-error-message"></p>
    <button id="todo-retry" type="button">Повторить загрузку</button>
</div>
```

`hidden` изначально скрывает блок. `role="alert"` помогает вспомогательным технологиям сообщить об ошибке, а `type="button"` задаёт обычную кнопку. Существующие форма, поле `name="todo"` и кнопка микрофона сохраняются.

В `src/styles/todo.css` добавим стили сообщения и состояния недоступности:

```css
.todo input:disabled,
.todo button:disabled,
#todo-form button:disabled,
#todo-retry:disabled {
    cursor: wait;
    opacity: 0.5;
}

.todo-list__error {
    padding: 16px;
    border-radius: 12px;
    background-color: #fce8e6;
    color: #9c2920;
}

.todo-list__error p {
    margin-bottom: 12px;
}

.todo-list__error button {
    padding: 8px 12px;
    border: 1px solid currentColor;
    border-radius: 6px;
    background-color: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
}
```

CSS только оформляет `:disabled`; включать и выключать элементы будем из JavaScript. В Console временно снимем `hidden` с `#todo-error`, проверим внешний вид и вернём его обратно. В коде HTML блок остаётся скрытым.

### 4.2. Добавим состояние и вспомогательные методы `Store`

В `src/scripts/store.js` заменим импорт функций `localStorage` на API. Остальные импорты сохраняются:

```js
import { groupTodos, renderTodoGroupList } from './ui';
import { getTodos, createTodo, updateTodo, deleteTodo } from './api';
import { initSpeechRecognition } from './web-api/speech-recognition';
import { InfiniteScrollManager } from './web-api/intersection-observer';
```

Конструктор теперь выглядит так:

```js
constructor() {
    this.todos = [];
    this.pageSize = 10;
    this.hasMore = false;
    this.isSaving = false;

    this.infiniteScrollManager = new InfiniteScrollManager(
        () => this._loadMoreTodos(),
        this.pageSize
    );
}
```

`hasMore` будем получать от сервера. `isSaving` защищает операции изменения от повторного запуска; в текущем коде этот же флаг используется и при первоначальной загрузке. Для подгрузки страниц у `InfiniteScrollManager` уже есть отдельный `isLoading`.

Добавим два метода:

```js
_setSaving(isSaving) {
    this.isSaving = isSaving;

    const controls = document.querySelectorAll(
        '.todo input, .todo button, #todo-form button[type="submit"], #todo-retry'
    );

    controls.forEach(control => control.disabled = isSaving);
}

_showError(error) {
    const errorContainer = document.getElementById('todo-error');
    const errorMessage = document.getElementById('todo-error-message');

    errorContainer.hidden = !error;
    errorMessage.textContent = error ? `Не удалось выполнить запрос. ${error.message}` : '';
}
```

`_showError(error)` показывает сообщение, а `_showError()` без аргумента очищает его. Используем `textContent`, чтобы сообщение воспринималось как текст.

`_setSaving(true)` блокирует чекбоксы, кнопки удаления, Add и повторную загрузку. Поле ввода и микрофон этот селектор не блокирует: пока сервер отвечает, пользователь может начать вводить следующую задачу.

Проверка: вызов блокировки меняет свойство `disabled` у перечисленных элементов, а ошибка появляется в подготовленном HTML-блоке.

## 5. Обновим `Store`

### 5.1. Получим первую страницу с сервера

Заменим синхронное чтение `localStorage` асинхронным запросом:

```js
async _loadInitialTodos() {
    this.infiniteScrollManager.reset();
    this._setSaving(true);
    this._showError();

    try {
        const { todos, hasMore } = await getTodos(null, this.pageSize);

        this.todos = todos;
        this.hasMore = hasMore;
    } catch (error) {
        this.hasMore = false;
        this._showError(error);
    } finally {
        this._setSaving(false);
        this.ui();
    }
}
```

Перед запросом сбрасываем менеджер прокрутки: после окончания списка или ошибки его observer мог быть отключён. Скрываем прежнее сообщение и блокируем действия. После успеха заменяем рабочую копию первой страницей и запоминаем `hasMore`.

Это второй уровень обработки ошибки. В `request()` мы проверили HTTP-статус и сформировали `Error`; здесь решаем, как отобразить неудачу пользователю. При сетевом отказе сюда также попадёт ошибка от `fetch()`.

`finally` выполнится в обоих случаях: управление разблокируется, интерфейс перерисуется. При ошибке первой загрузки `this.todos` останется пустым; при ошибке повторной загрузки ранее полученные задачи сохранятся в памяти. В обоих случаях `hasMore = false` останавливает подгрузку до новой попытки.

Подписка на повторную загрузку появится в `form()`. Настройка submit и голосового ввода остаётся прежней:

```js
form() {
    const todoForm = document.getElementById('todo-form');
    const retryButton = document.getElementById('todo-retry');

    this._configureSubmit(todoForm);
    this._configureVoiceInput(todoForm);

    retryButton.addEventListener('click', () => this._loadInitialTodos());
}
```

Повторная загрузка начинает список **с первой страницы**. Кнопка не повторяет последний POST, PATCH или DELETE. Если создание не удалось, после восстановления соединения отправим форму ещё раз.

Чтобы проверить первую страницу уже сейчас, вместе с этим методом обновим `_renderSentinel()` и `ui()` из следующего пункта. Так промежуточный вариант не будет сравнивать серверные задачи с прежним `localStorage`.

### 5.2. Подключим серверный `hasMore` к прокрутке

Раньше `_renderSentinel()` читал весь массив из `localStorage` и сравнивал его длину с `this.todos.length`. Теперь полный массив находится на сервере, а признак продолжения уже пришёл в ответе:

```js
_renderSentinel(container) {
    this.infiniteScrollManager.detachSentinel();
    this.infiniteScrollManager.hasMoreData = this.hasMore;

    if (this.hasMore) {
        this.infiniteScrollManager.attachSentinel(container);
    }
}

ui() {
    const container = document.getElementsByClassName('todo-list')[0];

    this._renderTodos(container);
    this._renderSentinel(container);
    this._setSaving(this.isSaving);
}
```

Последняя строка повторно применяет блокировку к новым DOM-элементам: после рендера прежние чекбоксы и кнопки уже удалены.

Теперь заменим `_loadMoreTodos()`:

```js
async _loadMoreTodos() {
    if (this.todos.length === 0 || !this.hasMore) {
        return false;
    }

    const lastTodoId = this.todos[this.todos.length - 1].id;

    try {
        const { todos, hasMore } = await getTodos(lastTodoId, this.pageSize);

        this.todos.push(...todos);
        this.hasMore = hasMore;
        this.ui();

        return hasMore;
    } catch (error) {
        this._showError(error);

        // Не повторяем неудачный запрос при каждом срабатывании observer.
        this.infiniteScrollManager.detachSentinel();

        return false;
    }
}
```

Курсор по-прежнему берём у последней загруженной задачи. Вместо `slice()` локального массива ждём серверную страницу и добавляем её элементы через `push(...todos)`.

Убираем прежнюю искусственную задержку `setTimeout(..., 1500)` из `Store`: теперь задержка есть у настоящего HTTP-запроса. Loader показывает уже существующий `InfiniteScrollManager`; его исходник и стили loader в `common.css` менять не нужно. Спиннер используется при подгрузке, отдельного спиннера первой страницы в готовом коде нет.

При ошибке возвращаем `false`, чтобы менеджер прекратил наблюдение и убрал индикатор. Уже загруженные задачи остаются видны. `this.hasMore` в этой ветке не меняется: это последнее известное значение от сервера, а не признак успешности запроса. Для восстановления нажмём «Повторить загрузку» — список начнётся заново.

Проверка: видим первую страницу, прокрутка добавляет следующие. После ответа с `hasMore: false` sentinel исчезает. При ошибке сообщение остаётся, а спиннер и автоматические повторения прекращаются.

### 5.3. Создадим задачу и обновим рабочую копию

Заменим `handleAddTodo()`:

```js
async handleAddTodo(event) {
    event.preventDefault();

    const input = event.target.elements.todo;
    const title = input.value.trim();

    if (!title || this.isSaving) {
        return;
    }

    this._setSaving(true);
    this._showError();

    try {
        const newTodo = await createTodo({ title, completed: false });

        this.todos.unshift(newTodo);

        if (input.value.trim() === title) {
            input.value = '';
        }
    } catch (error) {
        this._showError(error);
    } finally {
        this._setSaving(false);
        this.ui();
    }
}
```

Порядок действий принципиален: запрос → успешный ответ → изменение `this.todos` → рендер. В массив добавляем именно серверный объект, уже содержащий `id`.

`trim()` убирает пробелы по краям и не позволяет отправить строку из одних пробелов. Проверка `this.isSaving` защищает обработчик от повторного запуска, даже если submit пришёл через клавишу Enter.

Поле очищаем только после успеха и только если его текст всё ещё совпадает с отправленным. Если за время ожидания пользователь ввёл другой текст, оставим его. При ошибке введённая задача также остаётся в поле.

Проверка: успешное создание добавляет задачу в начало; ID совпадает с ответом POST. При неудаче задача в массив не попадает, текст остаётся, Add снова становится доступной.

### 5.4. Сохраним изменение чекбокса

Обработчик получает ID и находит текущее серверное состояние в рабочей копии:

```js
async handleCompleteTodo(id) {
    if (this.isSaving) {
        return;
    }

    const todo = this.todos.find(todo => todo.id === id);

    this._setSaving(true);
    this._showError();

    try {
        const updatedTodo = await updateTodo(id, { completed: !todo.completed });

        // Меняем локальные данные только после успешного ответа сервера.
        this.todos = this.todos.map(todo => todo.id === id ? updatedTodo : todo);
    } catch (error) {
        this._showError(error);
    } finally {
        this._setSaving(false);
        this.ui();
    }
}
```

Отправляем новое значение `completed`, а после ответа заменяем нужную задачу объектом сервера. Остальные элементы `map()` возвращает без изменений.

Сам HTML-чекбокс реагирует на клик сразу. Но `this.todos` до успешного PATCH не меняется. Поэтому рендер в `finally` при ошибке восстанавливает прежнее состояние чекбокса.

Проверка: отметка сохраняется после перезагрузки. При ошибке возвращается прежний статус и появляется сообщение.

### 5.5. Удалим задачу после успешного ответа

В `Store` добавим новый обработчик:

```js
async handleDeleteTodo(id) {
    if (this.isSaving) {
        return;
    }

    this._setSaving(true);
    this._showError();

    try {
        await deleteTodo(id);

        this.todos = this.todos.filter(todo => todo.id !== id);

        // После удаления всей загруженной страницы начинаем загрузку сначала.
        if (this.todos.length === 0 && this.hasMore) {
            await this._loadInitialTodos();
        }
    } catch (error) {
        this._showError(error);
    } finally {
        this._setSaving(false);
        this.ui();
    }
}
```

После `204` удаляем объект из рабочей копии через `filter()`. При ошибке не меняем массив. Если удалены все загруженные задачи, а на сервере есть продолжение, загружаем первую страницу заново: прежней последней задачи для курсора уже нет.

При удалении отдельных элементов не пытаемся дополнить страницу ровно до десяти задач — такого поведения в текущем коде нет.

Проверка обработчика появится после добавления кнопки удаления в следующем разделе.

## 6. Добавим кнопку удаления

### 6.1. Изменим DOM карточки

В `src/scripts/ui/todo.js` карточка раньше целиком была `label`. Теперь сделаем общую оболочку `div.todo`, внутри которой находятся `label` с чекбоксом и текстом и отдельная кнопка удаления. Так нажатие на × не относится к подписи чекбокса.

Заменим `renderTodoCard()`:

```js
const renderTodoCard = (todo, onComplete, onDelete) => {
    const { id, title, completed } = todo;

    const todoElement = document.createElement('div');
    const labelElement = document.createElement('label');
    const checkboxElement = document.createElement('input');
    const titleElement = document.createElement('span');
    const deleteElement = document.createElement('button');

    todoElement.id = `todo-${id}`;
    todoElement.className = 'todo';
    labelElement.className = 'todo__label';

    checkboxElement.type = 'checkbox';
    checkboxElement.checked = completed;
    checkboxElement.name = `todo-input-${id}`;
    checkboxElement.onclick = onComplete;

    titleElement.textContent = title;

    deleteElement.type = 'button';
    deleteElement.className = 'todo__delete';
    deleteElement.textContent = '×';
    deleteElement.setAttribute('aria-label', `Удалить задачу: ${title}`);
    deleteElement.onclick = onDelete;

    labelElement.appendChild(checkboxElement);
    labelElement.appendChild(titleElement);
    todoElement.appendChild(labelElement);
    todoElement.appendChild(deleteElement);

    return todoElement;
};
```

У кнопки есть доступное имя с названием задачи. `id` задачи — число; поправим соответствующую JSDoc-аннотацию с `string` на `number` и добавим описание аргумента `onDelete` у функций рендера.

### 6.2. Передадим обработчик через функции рендера

Аргумент `onDelete` должен пройти всю цепочку:

```text
renderTodoGroupList(groups, onComplete, onDelete)
└── renderTodoGroup(group, onComplete, onDelete)
    └── renderTodoList(todos, onComplete, onDelete)
        └── renderTodoCard(todo, handleComplete, handleDelete)
```

Добавим третий аргумент в сигнатуры `renderTodoList`, `renderTodoGroup`, `renderTodoGroupList` и в их внутренние вызовы. В цикле `renderTodoList()` свяжем обработчики с конкретным ID:

```js
for (const todo of todos) {
    const handleComplete = () => onComplete(todo.id);
    const handleDelete = () => onDelete(todo.id);

    const todoContainer = document.createElement('li');
    const todoElement = renderTodoCard(todo, handleComplete, handleDelete);

    todoContainer.appendChild(todoElement);
    todoList.appendChild(todoContainer);
}
```

Завершим подключение в `Store._renderTodos()`:

```js
_renderTodos(container) {
    const groups = groupTodos(this.todos);
    const groupsElement = renderTodoGroupList(
        groups,
        (id) => this.handleCompleteTodo(id),
        (id) => this.handleDeleteTodo(id)
    );

    const existingGroups = container.querySelectorAll('.todo-list__groups');
    existingGroups.forEach((group) => group.remove());

    container.appendChild(groupsElement);
}
```

`groupTodos()` остаётся прежней: одна группа сохраняет порядок серверных данных, чекбокс показывает статус. Сам UI-модуль не вызывает `fetch()` — он сообщает `Store`, какое действие выбрал пользователь.

Проверка: клик по × приводит к DELETE нужного ID; после успеха карточка исчезает, после ошибки остаётся. Клик по тексту по-прежнему переключает чекбокс.

### 6.3. Обновим стили карточки

В `todo.css` уберём `cursor: pointer` у `.todo`: теперь кликабельные части имеют собственные стили. Добавим:

```css
.todo__label {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
    gap: 15px;
    cursor: pointer;
}

.todo__delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    padding: 0;
    border: none;
    border-radius: 6px;
    background-color: transparent;
    color: #8b8b8b;
    font-size: 28px;
    cursor: pointer;
}

.todo__delete:hover {
    background-color: #f3efee;
    color: var(--color-text-primary);
}

.todo__delete:focus-visible {
    outline: 2px solid var(--color-brand);
}
```

В существующее правило `.todo input[type="checkbox"]` добавим `flex-shrink: 0`, а в `.todo span` — `overflow-wrap: anywhere`. Чекбокс и кнопка сохранят размер, длинный текст сможет переноситься. `min-width: 0` позволит подписи сжиматься внутри flex-карточки.

После появления вложенного `label` чекбокс больше не является прямым ребёнком `.todo`. Поэтому заменим старый селектор `.todo:has(> input[type="checkbox"]:checked)`:

```css
.todo:has(input[type="checkbox"]:checked) {
    opacity: 0.8;
    background-color: transparent;
    outline: 2px solid #d0d0d0;
}
```

Правило ищет отмеченный чекбокс среди потомков карточки. Актуальная совместимость доступна в [MDN: `:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/:has#browser_compatibility). Сам механизм уже использовался в проекте; здесь меняется глубина поиска.

Проверка: длинная задача не вытесняет кнопку удаления, Tab выделяет кнопку, отмеченная карточка сохраняет оформление. При отправке запроса controls получают оформление `:disabled` из раздела 4.

## 7. Соберём изменения вместе

### 7.1. Что осталось от предыдущей практики

Точка входа `scripts/index.js` не меняется: создаёт `Store` и вызывает `init()` после `DOMContentLoaded`. Порядок внутри `Store.init()` также прежний:

```js
init() {
    this.infiniteScrollManager.init();
    this.form();
    this._loadInitialTodos();
}
```

`web-api/intersection-observer.js`, `web-api/speech-recognition.js`, `ui/infinite-scroll.js` и `ui/index.js` переносим без изменений. Голосовой ввод по-прежнему только заполняет поле; POST отправляется после submit. Встроенная проверка наличия `SpeechRecognition` или `webkitSpeechRecognition` сохраняется. Для повторной проверки микрофона см. [справку и совместимость SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition#browser_compatibility).

Файл `web-api/local-storage.js` в готовой версии тоже сохранён, но `Store` его больше не импортирует. Старые данные под ключом `todos` не переносятся на сервер автоматически и на серверный список не влияют. Удалять ключ для работы нового приложения не требуется.

`mock.js` в новой версии отсутствует: наполнение теперь берётся с сервера. Если при подготовке в `index.js` оставался временный импорт или вызов `setMockData()`, уберём его вместе с файлом. В исходнике практики №3 точка входа уже не вызывает эту функцию.

HTML страницы `about.html`, `common.css`, `reset.css` и favicon не меняются. `package.json` фронтенда меняет название, версию и описание проекта; Parcel и команды `start`/`build` остаются прежними.

### 7.2. Как теперь движутся данные

```text
событие в UI
└── Store: проверка ввода, блокировка, очистка сообщения
    └── api: метод, URL, JSON, проверка HTTP-ответа
        └── сервер
            ├── успех → Store обновляет this.todos → ui()
            └── ошибка → Store показывает сообщение → ui()
```

Для чтения страниц цепочка начинается с `_loadInitialTodos()` или callback менеджера прокрутки. Постоянные данные находятся на сервере, `this.todos` — только загруженная часть списка в памяти текущей страницы.

| Модуль | Ответственность |
| --- | --- |
| `api/index.js` | Отправка HTTP-запросов, JSON, проверка статусов |
| `store.js` | Состояние, пользовательские действия, ошибки и координация UI |
| `ui/todo.js` | DOM карточек и передача событий по ID |
| `web-api/intersection-observer.js` | Sentinel, loader и защита от параллельных подгрузок |
| `web-api/speech-recognition.js` | Распознавание речи и заполнение поля |

### 7.3. Проверим приложение

1. Откроем страницу. Успешный GET показывает до десяти задач; при `500` появляется сообщение с повторной загрузкой.
2. Прокрутим список. При наличии продолжения видны новые GET с курсором, loader исчезает после ответа. Если sentinel сразу находится в области наблюдения, подгрузка может начаться без ручной прокрутки.
3. Дойдём до `hasMore: false`: новые запросы по прокрутке прекращаются.
4. Добавим задачу. Проверим POST, серверный ID и появление карточки в начале.
5. Во время POST начнём вводить другой текст: после успеха он должен остаться.
6. Переключим чекбокс, проверим PATCH; удалим тестовую задачу, проверим DELETE и пустой ответ `204`.
7. Перезагрузим страницу: серверные изменения сохраняются.
8. Для воспроизводимого сетевого отказа включим **Offline** в Network или остановим сервер, затем отправим форму. Сообщение появляется, текст остаётся, управление разблокируется. Для проверки именно `500` используем случайные отказы учебного сервера.
9. Вернём сеть или запустим сервер и нажмём «Повторить загрузку». Получим первую страницу; неуспешные операции изменения повторяем своим действием.
10. Проверим голосовой ввод, если он поддерживается и разрешён, и отсутствие неожиданных ошибок в Console.

Offline отключает новые сетевые запросы. Для надёжного показа установим его **до** действия, а не посреди уже отправленного запроса.

Соберём фронтенд из `hw/hw-5-backend/code/frontend`:

```bash
npm run build
```

Успешная сборка проверяет, в частности, пути импортов. Она не проверяет доступность API: сетевые сценарии проверяем отдельно в браузере.

### 7.4. Если что-то не работает

**`Failed to fetch`, запроса нет или он красный.** Проверим, запущен ли сервер, совпадает ли `API_URL` с его адресом, выключен ли Offline. Если Console сообщает CORS, посмотрим заголовки ответа и origin страницы.

**Получаем `500` при корректных данных.** Учебный сервер намеренно моделирует отказы. Посмотрим сообщение «Искусственная ошибка сервера» и повторим действие. Длительность до пяти секунд также предусмотрена примером.

**Получаем `400` при создании.** Проверим JSON-тело, `Content-Type`, непустой строковый `title` и булевый `completed`. Строка `"false"` не равна логическому `false`.

**`Unexpected end of JSON input` после удаления.** Для ответа `204` нужен ранний `return` до `response.json()`.

**Задачи в Local Storage есть, а на странице другие.** Новый `Store` получает данные сервера. Автоматической миграции старого массива нет.

**Не подгружается продолжение.** Проверим `hasMore`, `#sentinel`, query `cursor` в Network и отсутствие сообщения об ошибке. После неудачной подгрузки нажмём повторную загрузку.

**Сервер сообщает, что cursor не найден.** Задачу могли удалить в другом клиенте. Начнём загрузку с первой страницы. Курсор — ID существующей задачи, а не номер страницы.

**Удаление вызывает `onDelete is not a function`.** Проверим передачу третьего аргумента через все четыре функции рендера и callback в `Store._renderTodos()`.

**Отмеченная карточка потеряла оформление.** В `:has()` больше не должно быть `>` перед `input`: между карточкой и чекбоксом появился `label`.

**После перерисовки кнопки снова доступны во время запроса.** Проверим вызов `_setSaving(this.isSaving)` в конце `ui()`.

### 7.5. Что можно улучшить самостоятельно

Текущий пример разделяет `isSaving` для действий и `isLoading` менеджера прокрутки. Это не полная защита от гонок: подгрузка страницы и изменение задачи могут идти одновременно. `reset()` также не отменяет уже отправленный запрос.

Как отдельное продолжение можно добавить отмену устаревших запросов, согласовать загрузку с изменениями, сделать отдельный индикатор первой страницы и повторять именно неудавшуюся страницу. Эти возможности в готовой реализации не добавлены.

Готовый фронтенд для сверки:

- [`api/index.js`](../code/frontend/src/scripts/api/index.js)
- [`store.js`](../code/frontend/src/scripts/store.js)
- [`ui/todo.js`](../code/frontend/src/scripts/ui/todo.js)
- [`pages/index.html`](../code/frontend/src/pages/index.html)
- [`styles/todo.css`](../code/frontend/src/styles/todo.css)

## Приложение. Готовый бэкенд

Бэкенд находится в `hw/hw-5-backend/code/backend`. Это учебный сервер на Node.js, TypeScript и Express. Он принимает HTTP-запросы, проверяет параметры и поля задач, читает или изменяет массив и возвращает JSON. Данные хранятся в `data/todos.json`, поэтому переживают перезапуск сервера. Полноценная база данных в этом примере не используется.

Сервер выдаёт Swagger UI на `/api-docs` и OpenAPI JSON на `/openapi.json`, разрешает обращения фронтенда через CORS и специально моделирует задержки и ошибки API. Вероятность отказа — 25%, задержка — от 300 до 5000 мс. Искусственный отказ происходит до изменения файла данных. В реальных сетевых сбоях ответ может потеряться уже после сохранения, поэтому слепое автоматическое повторение POST способно создать дубликат.

### Как запустить

Из корня репозитория откроем отдельный терминал:

```bash
cd hw/hw-5-backend/code/backend
npm ci
npm run dev
```

Дождёмся сообщения о запуске. По умолчанию адрес API — `http://localhost:3000/api/todos`. Этот терминал оставляем работающим рядом с терминалом Parcel.

Для запуска собранного сервера из той же папки:

```bash
npm run build
npm start
```

`npm start` у сервера запускает уже собранный `dist/index.js`, поэтому предварительная сборка обязательна. Для обычной работы на практике достаточно `npm run dev`.

Порт можно задать через переменную `PORT`; при его изменении нужно также изменить константу `API_URL` во фронтенде и адреса запросов Bruno. Ошибка `EADDRINUSE` означает, что выбранный порт уже занят.

Устройство сервера достаточно понимать как цепочку «HTTP-запрос → проверка → чтение/изменение JSON-файла → HTTP-ответ». Реализовывать эту цепочку на занятии не требуется.
