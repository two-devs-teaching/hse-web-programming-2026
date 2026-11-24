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
