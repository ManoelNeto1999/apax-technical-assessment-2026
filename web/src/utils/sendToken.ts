import { Response } from "express";
import { IUser } from "../models/userModel";

interface SendTokenOptions {
  httpOnly?: boolean;
  expires?: Date;
}

const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const token = user.getJWTToken();

  const options: SendTokenOptions = {
    expires: new Date(
      Date.now() +
        Number(process.env.COOKIE_EXPIRE ?? 7) * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt,
    },
    token,
  });
};

export default sendToken;