import type { NextFunction, Request, Response } from 'express';

export type AsyncHandler = (request: Request, response: Response, next: NextFunction) => Promise<void>;
