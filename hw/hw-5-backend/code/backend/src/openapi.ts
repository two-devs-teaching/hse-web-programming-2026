export const openApiDocument = {
    openapi: '3.0.3',

    info: {
        title: 'Todo API',
        version: '1.0.0',
        description: 'Учебный REST API. Задачи хранятся в локальном JSON-файле.'
    },

    servers: [
        { url: '/api', description: 'Текущий сервер' }
    ],

    tags: [
        { name: 'Todos', description: 'Создание, получение, обновление и удаление задач' }
    ],

    paths: {
        '/todos': {
            get: {
                tags: ['Todos'],
                operationId: 'getTodos',
                summary: 'Получить страницу задач',
                description: 'Новые задачи находятся в начале списка. Для первой страницы не передавайте cursor.',

                parameters: [
                    {
                        name: 'limit',
                        in: 'query',
                        description: 'Количество задач на странице',
                        schema: { type: 'integer', minimum: 1, default: 10 }
                    },
                    {
                        name: 'cursor',
                        in: 'query',
                        description: 'id последней загруженной задачи. Задача должна существовать.',
                        schema: { type: 'integer', minimum: 0 }
                    }
                ],

                responses: {
                    '200': {
                        description: 'Страница задач и признак наличия следующей страницы',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/TodoPage' }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '500': { $ref: '#/components/responses/ServerError' }
                }
            },

            post: {
                tags: ['Todos'],
                operationId: 'createTodo',
                summary: 'Создать задачу',
                description: 'Сервер генерирует id и добавляет задачу в начало списка. По умолчанию completed равен false.',

                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/CreateTodo' }
                        }
                    }
                },

                responses: {
                    '201': {
                        description: 'Задача создана',
                        headers: {
                            Location: {
                                description: 'Адрес созданной задачи',
                                schema: { type: 'string', example: '/api/todos/1795521600000' }
                            }
                        },
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Todo' }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '500': { $ref: '#/components/responses/ServerError' }
                }
            }
        },

        '/todos/{id}': {
            parameters: [
                { $ref: '#/components/parameters/TodoId' }
            ],

            get: {
                tags: ['Todos'],
                operationId: 'getTodo',
                summary: 'Получить задачу по id',

                responses: {
                    '200': {
                        description: 'Задача найдена',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Todo' }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/ServerError' }
                }
            },

            patch: {
                tags: ['Todos'],
                operationId: 'updateTodo',
                summary: 'Обновить задачу',
                description: 'Передайте title, completed или оба поля. id задачи не изменяется.',

                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/UpdateTodo' }
                        }
                    }
                },

                responses: {
                    '200': {
                        description: 'Задача обновлена',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/Todo' }
                            }
                        }
                    },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/ServerError' }
                }
            },

            delete: {
                tags: ['Todos'],
                operationId: 'deleteTodo',
                summary: 'Удалить задачу',

                responses: {
                    '204': { description: 'Задача удалена. Тело ответа отсутствует.' },
                    '400': { $ref: '#/components/responses/BadRequest' },
                    '404': { $ref: '#/components/responses/NotFound' },
                    '500': { $ref: '#/components/responses/ServerError' }
                }
            }
        }
    },

    components: {
        parameters: {
            TodoId: {
                name: 'id',
                in: 'path',
                required: true,
                description: 'Идентификатор задачи',
                schema: { type: 'integer', minimum: 0, maximum: Number.MAX_SAFE_INTEGER },
                example: 0
            }
        },

        schemas: {
            Todo: {
                type: 'object',
                required: ['id', 'title', 'completed'],
                properties: {
                    id: { type: 'integer', minimum: 0, readOnly: true, example: 0 },
                    title: { type: 'string', example: 'Изучить Express' },
                    completed: { type: 'boolean', example: false }
                }
            },

            TodoPage: {
                type: 'object',
                required: ['todos', 'hasMore'],
                properties: {
                    todos: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Todo' }
                    },
                    hasMore: {
                        type: 'boolean',
                        description: 'Есть ли задачи после текущей страницы',
                        example: true
                    }
                }
            },

            CreateTodo: {
                type: 'object',
                required: ['title'],
                properties: {
                    title: {
                        type: 'string',
                        minLength: 1,
                        pattern: '\\S',
                        description: 'Непустой заголовок. Пробелы по краям удаляются.',
                        example: 'Изучить Express'
                    },
                    completed: { type: 'boolean', default: false }
                }
            },

            UpdateTodo: {
                type: 'object',
                anyOf: [
                    { required: ['title'] },
                    { required: ['completed'] }
                ],
                properties: {
                    title: {
                        type: 'string',
                        minLength: 1,
                        pattern: '\\S',
                        description: 'Непустой заголовок. Пробелы по краям удаляются.'
                    },
                    completed: { type: 'boolean' }
                },
                example: { completed: true }
            },

            Error: {
                type: 'object',
                required: ['message'],
                properties: {
                    message: { type: 'string' }
                }
            }
        },

        responses: {
            BadRequest: {
                description: 'Некорректный JSON, поля задачи, id или параметры пагинации',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { message: 'Передайте непустой title и/или булевый completed' }
                    }
                }
            },

            NotFound: {
                description: 'Задача не найдена',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { message: 'Задача не найдена' }
                    }
                }
            },

            ServerError: {
                description: 'Ошибка сервера',
                content: {
                    'application/json': {
                        schema: { $ref: '#/components/schemas/Error' },
                        example: { message: 'Искусственная ошибка сервера' }
                    }
                }
            }
        }
    }
};
