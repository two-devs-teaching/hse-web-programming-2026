import type { RequestHandler } from 'express';

export const overrideStatus: RequestHandler = (request, response, next) => {
    if (request.query.status === 'failure') {
        response.status(500).json({ message: 'Искусственная ошибка сервера' });

        return;
    }

    next();
};
