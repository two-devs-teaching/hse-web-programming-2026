/**
 * Функция для рендеринга todo-карточки
 * @param {Object} todo - Данные для todo-карточки
 * @param {number} todo.id - Идентификатор задачи
 * @param {string} todo.title - Заголовок задачи
 * @param {boolean} todo.completed - Статус выполнения задачи
 * @param {Function} onComplete - Обработчик клика на карточку
 * @param {Function} onDelete - Обработчик удаления задачи
 * @returns {HTMLElement} - DOM-элемент todo-карточки
 */
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

/**
 * Функция для рендеринга списка todo-карточек
 * @param {Array<Object>} todos - Массив данных для todo-карточек
 * @param {Function} onComplete - Обработчик завершения задачи
 * @param {Function} onDelete - Обработчик удаления задачи
 * @returns {HTMLElement} - DOM-элемент с todo-карточками
 */
const renderTodoList = (todos, onComplete, onDelete) => {
    const todoList = document.createElement('ul');

    todoList.className = 'todo-group__todos';

    for (const todo of todos) {
        const handleComplete = () => onComplete(todo.id);
        const handleDelete = () => onDelete(todo.id);

        const todoContainer = document.createElement('li');
        const todoElement = renderTodoCard(todo, handleComplete, handleDelete);

        todoContainer.appendChild(todoElement);
        todoList.appendChild(todoContainer);
    }

    return todoList;
};

/**
 * Функция для рендеринга группы todo-карточек
 * @param {Object} group - Данные для группы todo-карточек
 * @param {string} group.id - Идентификатор группы
 * @param {string} group.title - Заголовок группы
 * @param {boolean} group.headless - Флаг скрытия заголовка группы
 * @param {Array<Object>} group.todos - Массив todo-карточек в группе
 * @param {Function} onComplete - Обработчик завершения задачи
 * @param {Function} onDelete - Обработчик удаления задачи
 * @returns {HTMLElement} - DOM-элемент группы todo-карточек
 */
const renderTodoGroup = (group, onComplete, onDelete) => {
    const { id, title, headless, todos } = group;

    const groupElement = document.createElement('section');
    const titleElement = document.createElement('h2');
    const todoList = renderTodoList(todos, onComplete, onDelete);

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

/**
 * Функция для рендеринга списка групп todo-карточек
 * @param {Array<Object>} groups - Массив групп todo-карточек
 * @param {Function} onComplete - Обработчик завершения задачи
 * @param {Function} onDelete - Обработчик удаления задачи
 * @returns {HTMLElement} - DOM-элемент со списком групп todo-карточек
 */
export const renderTodoGroupList = (groups, onComplete, onDelete) => {
    const groupList = document.createElement('div');

    groupList.className = 'todo-list__groups';

    for (const group of groups) {
        const todoGroup = renderTodoGroup(group, onComplete, onDelete);

        groupList.appendChild(todoGroup);
    }

    return groupList;
};

/**
 * Функция для группировки todo-карточек по статусу выполнения
 * @param {Array<Object>} todos - Массив всех todo-карточек
 * @returns {Array<Object>} - Массив групп с активными и завершенными задачами
 */
export const groupTodos = (todos) => {
    const activeGroup = {
        id: 'active',
        title: 'Active',
        headless: true,
        todos
    };

    return [activeGroup];
};
