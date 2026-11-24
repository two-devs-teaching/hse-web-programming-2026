import type { RequestHandler } from 'express';

export const randomFailure: RequestHandler = (request, response, next) => {
    if (Math.random() < 0.25) {
        response.status(500).json({ message: 'Искусственная ошибка сервера' });

        return;
    }

    next();
};
