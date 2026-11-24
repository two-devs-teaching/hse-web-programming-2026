import { groupTodos, renderTodoGroupList } from './ui';
import { getTodos, createTodo, updateTodo, deleteTodo } from './api';
import { initSpeechRecognition } from './web-api/speech-recognition';
import { InfiniteScrollManager } from './web-api/intersection-observer';

export class Store {
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

    init() {
        this.infiniteScrollManager.init();
        this.form();
        this._loadInitialTodos();
    }

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

    _configureSubmit(todoForm) {
        todoForm.addEventListener('submit', (event) => this.handleAddTodo(event));
    }

    _configureVoiceInput(todoForm) {
        const voiceInput = document.getElementById('todo-voice-input');
        const todoInput = todoForm.elements.todo;

        initSpeechRecognition(voiceInput, todoInput);
    }

    form() {
        const todoForm = document.getElementById('todo-form');
        const retryButton = document.getElementById('todo-retry');

        this._configureSubmit(todoForm);
        this._configureVoiceInput(todoForm);

        retryButton.addEventListener('click', () => this._loadInitialTodos());
    }

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
}
