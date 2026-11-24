import { readFileSync, writeFileSync } from 'node:fs';
import type { Todo } from './types.js';

// Путь одинаково работает при запуске из src и из dist.
const todosFile = new URL('../data/todos.json', import.meta.url);

export const getTodos = (): Todo[] => {
    const rawTodos = readFileSync(todosFile, 'utf-8');

    return JSON.parse(rawTodos);
};

export const saveTodos = (todos: Todo[]) => {
    const value = JSON.stringify(todos, null, 4);

    // Синхронная запись упрощает учебный пример: запросы не перезаписывают изменения друг друга.
    writeFileSync(todosFile, `${value}\n`);
};
