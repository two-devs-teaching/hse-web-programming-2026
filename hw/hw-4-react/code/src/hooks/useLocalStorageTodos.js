import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'todos';

function readTodos() {
    try {
        const rawValue = localStorage.getItem(STORAGE_KEY) ?? '[]';
        const todos = JSON.parse(rawValue);

        if (!Array.isArray(todos)) {
            throw new Error('Invalid todos');
        }

        return {
            todos,
            error: ''
        };
    } catch {
        return {
            todos: [],
            error: 'Не удалось прочитать сохранённые задачи'
        };
    }
}

export function useLocalStorageTodos() {
    const [todos, setTodos] = useState([]);
    const [error, setError] = useState('');

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
        const updatedTodos = todos.map(todo => todo.id === id ? { ...todo, completed: !todo.completed } : todo);

        save(updatedTodos);
    }, [todos, save]);

    return {
        todos,
        error,
        addTodo,
        toggleTodo
    };
}
