import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/customError";
import { tokenBlacklist } from "./blacklist";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "MytopSecret";

// Define a custom interface that extends the default Request interface
interface AuthenticatedRequest extends Request {
  user?: any; // Replace 'any' with the actual type of the user object if available
}

export const checkTokenBlacklist = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1]; // Assuming you send the token in the Authorization header
  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }
  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ message: "Token is no longer valid." });
  }

  next();
};

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new CustomError("Authorization token not found", 401);
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    console.log("req.user", req.user);
    next();
  } catch (err) {
    throw new CustomError("Invalid token", 401);
  }
};
