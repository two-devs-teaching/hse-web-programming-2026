import { Router } from 'express';
import { getTodos, saveTodos } from '../storage.js';
import type { Todo } from '../types.js';

export const todosRouter = Router();

todosRouter.get('/', (request, response) => {
    const { cursor, limit = '10' } = request.query;
    const pageSize = Number(limit);

    if (typeof limit !== 'string' || !Number.isSafeInteger(pageSize) || pageSize < 1) {
        response.status(400).json({ message: 'limit должен быть положительным целым числом' });

        return;
    }

    const todos = getTodos();
    let startIndex = 0;

    if (cursor !== undefined) {
        const cursorId = Number(cursor);

        if (typeof cursor !== 'string' || cursor.trim() === '' || !Number.isSafeInteger(cursorId) || cursorId < 0) {
            response.status(400).json({ message: 'cursor должен быть идентификатором задачи' });

            return;
        }

        const cursorIndex = todos.findIndex(todo => todo.id === cursorId);

        if (cursorIndex === -1) {
            response.status(400).json({ message: 'Задача с указанным cursor не найдена' });

            return;
        }

        startIndex = cursorIndex + 1;
    }

    const page = todos.slice(startIndex, startIndex + pageSize);
    const hasMore = startIndex + page.length < todos.length;

    response.json({ todos: page, hasMore });
});

// Проверяем id для всех ручек, работающих с отдельной задачей.
todosRouter.param('id', (request, response, next, id: string) => {
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) {
        response.status(400).json({ message: 'id должен быть неотрицательным целым числом' });

        return;
    }

    next();
});

todosRouter.get('/:id', (request, response) => {
    const todos = getTodos();
    const todo = todos.find(todo => todo.id === Number(request.params.id));

    if (!todo) {
        response.status(404).json({ message: 'Задача не найдена' });

        return;
    }

    response.json(todo);
});

todosRouter.post('/', (request, response) => {
    const { title, completed = false } = request.body ?? {};

    if (typeof title !== 'string' || !title.trim() || typeof completed !== 'boolean') {
        response.status(400).json({ message: 'Нужны непустой title и булевый completed' });

        return;
    }

    const todos = getTodos();
    const lastId = todos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0);

    const newTodo: Todo = {
        id: Math.max(Date.now(), lastId + 1),
        title: title.trim(),
        completed
    };

    todos.unshift(newTodo);
    saveTodos(todos);

    response.status(201).location(`/api/todos/${newTodo.id}`).json(newTodo);
});

todosRouter.patch('/:id', (request, response) => {
    const { title, completed } = request.body ?? {};

    const hasInvalidTitle = title !== undefined && (typeof title !== 'string' || !title.trim());
    const hasInvalidCompleted = completed !== undefined && typeof completed !== 'boolean';
    const hasNoChanges = title === undefined && completed === undefined;

    if (hasInvalidTitle || hasInvalidCompleted || hasNoChanges) {
        response.status(400).json({ message: 'Передайте непустой title и/или булевый completed' });

        return;
    }

    const todos = getTodos();
    const todo = todos.find(todo => todo.id === Number(request.params.id));

    if (!todo) {
        response.status(404).json({ message: 'Задача не найдена' });

        return;
    }

    if (title !== undefined) {
        todo.title = title.trim();
    }

    if (completed !== undefined) {
        todo.completed = completed;
    }

    saveTodos(todos);

    response.json(todo);
});

todosRouter.delete('/:id', (request, response) => {
    const todos = getTodos();
    const todoIndex = todos.findIndex(todo => todo.id === Number(request.params.id));

    if (todoIndex === -1) {
        response.status(404).json({ message: 'Задача не найдена' });

        return;
    }

    todos.splice(todoIndex, 1);
    saveTodos(todos);

    response.status(204).end();
});
