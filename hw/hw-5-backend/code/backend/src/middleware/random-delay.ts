import type { RequestHandler } from 'express';

const MIN_DELAY = 300;
const MAX_DELAY = 5000;

export const randomDelay: RequestHandler = (request, response, next) => {
    const delay = MIN_DELAY + Math.floor(Math.random() * (MAX_DELAY - MIN_DELAY + 1));

    setTimeout(next, delay);
};
