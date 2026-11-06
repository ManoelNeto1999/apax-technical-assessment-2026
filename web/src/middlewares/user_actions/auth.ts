import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import User, { IUser } from "../../models/userModel";
import ErrorHandler from "../../utils/errorHandler";
import asyncErrorHandler from "../helpers/asyncErrorHandler";

/**
 * Extend Express Request to include user
 * (Ideally place this in a global typings file)
 */
export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Check if user is authenticated
export const isAuthenticatedUser = asyncErrorHandler(
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authorization = req.get("Authorization");
    const token: unknown = authorization !== undefined
      ? /^Bearer\s+(\S+)$/i.exec(authorization)?.[1]
      : req.cookies?.token;
    if (typeof token !== "string" || !token) {
      return res.status(401).json({ success: false, message: "Please Login to Access" });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new ErrorHandler("JWT_SECRET is required for authentication", 500));
    }

    let decodedData: JwtPayload;
    try {
      const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
      if (typeof decoded === "string" || typeof decoded.id !== "string" ||
          !/^[a-f0-9]{24}$/i.test(decoded.id)) {
        return res.status(401).json({ success: false, message: "Invalid authentication token" });
      }
      decodedData = decoded;
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }

    const user = await User.findById(decodedData.id);
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid authentication token" });
    }

    req.user = user;
    next();
  }
);

// Role-based authorization
export const authorizeRoles =
  (...roles: string[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(`Role: ${req.user?.role} is not allowed`, 403)
      );
    }

    next();
  };