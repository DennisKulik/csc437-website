import { NextFunction, Request, Response } from "express";
type AuthTokenPayload = {
    username: string;
};
declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}
declare const router: import("express-serve-static-core").Router;
export declare function authenticateUser(req: Request, res: Response, next: NextFunction): void;
export default router;
