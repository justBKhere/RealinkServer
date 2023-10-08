import { NextFunction, Request, Response } from "express";
import { UserService } from "../services/userService";
import { CustomError } from "../utils/customError";

import bcrypt from "bcryptjs";
import {
  getWalletAddressesByUserId,

} from "../services/SolanaServices/solanaWalletService";
import { Session } from "../models/SolanaSessionModel";

const userService = new UserService();

export const register = async (req: Request, res: Response) => {
  let { username, email, password } = req.body;
  username = username.toLowerCase();
  try {
    // check if username exists
    const userExists = await userService.findUserByUsername(username);

    if (userExists) {
      throw new CustomError("Username already exists", 400);
    }

    // create a new user
    const user = await userService.createUser(
      { username, email, password },
      username
    );

    const jwtToken = await userService.generateToken(user._id);
    user.activeSession = true; // Assuming you save this state to the database or have this field on the user model

    // Get the wallet details of the user
    const walletDetails = await getWalletAddressesByUserId(user._id);
    const userPrimaryWallet = walletDetails[0].publicKey;
    const result = {
      jwtToken,
      userPrimaryWallet,
    }

    res
      .status(200)
      .json({
        message: "User and wallet created successfully",
        result,
      });
  } catch (error: any) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  let { username, password } = req.body;
  username = username.toLowerCase();
  try {
    console.log(`Attempting to log in user: ${username}`);

    const user = await userService.loginUser(username, password);

    if (!user) {
      console.error(`Login failed for user: ${username}`);
      throw new CustomError("Invalid username or password", 400);
    }

    console.log(`User ${username} authenticated successfully`);

    // user is authenticated, generate a token
    const jwtToken = await userService.generateToken(user._id);
    user.activeSession = true;

    console.log(`Token generated for user: ${username}`);

    // Re-encrypt wallet data for the session
    const sessionWalletData = await userService.reEncryptWalletDataForSession(user._id.toString(), password, jwtToken);
    console.log(`Wallet data re-encrypted for user: ${username}`);

    // Check if a session for the user already exists
    let session = await Session.findOne({ userId: user._id });
    if (session) {
      console.log(`Updating existing session for user: ${username}`);
      // Update existing session data
      session.createdWallets = sessionWalletData.createdWallets!;
      session.importedWallets = sessionWalletData.importedWallets!;
      session.readonlyWallets = sessionWalletData.readonlyWallets!;
    } else {
      console.log(`Creating new session for user: ${username}`);
      // Create new session data
      session = new Session(sessionWalletData);
    }

    // Save session data to the database
    await session.save();
    console.log(`Session data saved to database for user: ${username}`);

    const walletDetails = await getWalletAddressesByUserId(user._id);
    const userPrimaryWallet = walletDetails[0].publicKey;
    const result = {
      jwtToken,
      userPrimaryWallet,
    };

    res.status(200).json({ message: "Logged in successfully", result });
  } catch (error: any) {
    console.error(`Error while logging in user ${username}: ${error.message}`);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
};



export const logout = async (req: Request, res: Response) => {
  const decodedToken: any = req;
  const userId = decodedToken.user.id;
  const user = await userService.findUserbyID(userId);
  if (user) {
    user.activeSession = false;
    await user.save();
    const token: any = req.headers.authorization?.split(" ")[1];
    userService.invalidateToken(token);
    res.status(200).json({ message: "Logged out successfully" });
  } else {
    res.status(400).json({ message: "User not found" });
  }
};

export const update = async (req: Request, res: Response) => {
  const { username, email, password, oldPassword } = req.body;
  const nothing = 0;
  try {
    const user = await userService.findUserByUsername(username);

    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Ensure old password is provided
    if (!oldPassword) {
      throw new CustomError("Old password is required", 400);
    }

    // Match old password with the one in the database
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new CustomError("Old password is incorrect", 401);
    }

    await userService.updateUser(
      username,
      { username, email, password },
      oldPassword
    );

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error: any) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  try {
    await userService.resetPassword(token, password);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error: any) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    await userService.sendResetPasswordEmail(email);

    res.status(200).json({ message: "Reset link sent to email" });
  } catch (error: any) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {

  const decodedToken: any = req;
  const userId = decodedToken.user.id;
  const { password } = req.body;
  try {
    console.log("userId", userId);
    const user = await userService.findUserbyID(userId);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Verify if the provided password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new CustomError("Invalid password provided", 401); // Unauthorized
    }

    await userService.deleteUser(user.username);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error: any) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
};


export const getUser = async (req: Request, res: Response) => {
  const decodedToken: any = req;
  const userId = decodedToken.user.id;

  try {
    const user = await userService.findUserbyID(userId);
    if (!user) {
      throw new CustomError("User not found", 404);
    }

    // Extract desired properties from the user object
    const userData = {
      username: user.username,
      emailID: user.email, // Adjust based on your schema's field name for email
    };

    // Fetch the wallet addresses linked to the user using the service
    const walletAddresses = await getWalletAddressesByUserId(
      user._id.toString()
    );

    // Combine user data and wallet addresses
    const combinedData = {
      ...userData,
      wallets: walletAddresses,
    };

    res.status(200).json(combinedData);
  } catch (error: any) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }
};

export const getMnemonics = async (req: Request, res: Response) => {
  const decodedToken: any = req;
  const userId = decodedToken.user.id;
  const { password } = req.body;
  try {
    const user = await userService.findUserbyID(userId);
    if (!user) {
      throw new CustomError("User not found", 404);
    }
    const mnemonics = await userService.getDecryptedMnemonicsByUserId(userId, password);
    res.status(200).json(mnemonics);
  } catch (error: any) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    res.status(error.statusCode).json({ error: error.message });
  }

}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    res.status(err.statusCode).json({ error: err.message });
  }
};
