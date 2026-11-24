import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import type { ErrorRequestHandler } from 'express';
import { openApiDocument } from './openapi.js';
import { randomDelay } from './middleware/random-delay.js';
import { randomFailure } from './middleware/random-failure.js';
import { todosRouter } from './routes/todos.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors());

app.get('/openapi.json', (request, response) => {
    response.json(openApiDocument);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument, {
    customSiteTitle: 'Todo API — Swagger UI',
    swaggerOptions: { validatorUrl: null }
}));

// Сначала задерживаем запрос, затем можем вернуть 500 до любых изменений в файле.
app.use('/api', randomDelay, randomFailure);
app.use(express.json());
app.use('/api/todos', todosRouter);

app.use((request, response) => {
    response.status(404).json({ message: 'Эндпоинт не найден' });
});

const handleError: ErrorRequestHandler = (error, request, response, next) => {
    if (error.type === 'entity.parse.failed') {
        response.status(400).json({ message: 'Тело запроса должно быть корректным JSON' });

        return;
    }

    console.error(error);

    response.status(500).json({ message: 'Не удалось обработать запрос' });
};

app.use(handleError);

app.listen(port, () => {
    console.log(`Сервер запущен: http://localhost:${port}/api/todos`);
    console.log(`Swagger UI: http://localhost:${port}/api-docs`);
});
