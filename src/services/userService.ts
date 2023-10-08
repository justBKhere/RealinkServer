import { IUser } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { CustomError } from "../utils/customError";
import { User } from "../models/User";
import { base58ToUint8Array, uint8ArrayToBase58 } from "../utils/base58Utils";
import { CryptoUtils } from "../utils/cryptoUtils";
import {
  generate_Sol_Wallet,
  getWalletAddressesByUserId,
  getWalletBalance,
  reEncryptWalletData,
} from "./SolanaServices/solanaWalletService";
import { ISolanaWallet, SolanaWallet } from "../models/SolanaWallets";
import { tokenBlacklist } from "../middleware/blacklist";
import dotenv from "dotenv";
import { GetPortfolio } from "../utils/Shyft/shyftApiService";
import { WalletBlock } from "../models/SolanaSessionModel";
import { Types } from "mongoose";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "MytopSecret";

export class UserService {
  async findUserByUsername(username: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({
        username: { $regex: new RegExp(`^${username}$`, "i") },
      });
      return user;
    } catch (error) {
      throw new CustomError("Error finding user by username", 500);
    }
  }

  async createUser(userData: Partial<IUser>, username: string): Promise<IUser> {
    try {
      const userPassword = userData.password;
      // Hash the user's password before saving
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password!, salt);

      userData.username = username.toLowerCase();

      const newUser = new User(userData);
      await newUser.save();

      // Generate and save Solana wallet for this user
      console.log("userData Password", userPassword);
      await this.createSolanaWalletForUser(newUser._id, userPassword!);

      return newUser;
    } catch (error) {
      throw new CustomError("Error creating user", 500);
    }
  }

  async createSolanaWalletForUser(
    userId: string,
    password: string
  ): Promise<void> {
    // Generate a new Solana wallet
    const newWallet = generate_Sol_Wallet();
    const privateKey = newWallet.keypair.secretKey;
    const privateKeyString = uint8ArrayToBase58(privateKey);

    // Encrypt the private key and mnemonic using the user's password
    const encryptedPrivateKey = CryptoUtils.encrypt(privateKeyString, password);
    const encryptedMnemonic = CryptoUtils.encrypt(newWallet.mnemonic, password);

    const solanaWalletData = {
      userId: userId,
      createdWallets: [
        {
          publicKey: newWallet.publicAddress,
          encryptedPrivateKey: encryptedPrivateKey,
          encryptedMnemonic: encryptedMnemonic,
          name: "Default",
        },
      ],
      importedWallets: [],
      readonlyWallets: [],
    };

    const solWallet = new SolanaWallet(solanaWalletData);
    await solWallet.save();
  }

  async loginUser(username: string, password: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return null;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return null;
      }

      return user;
    } catch (error) {
      throw new CustomError("Error logging in", 500);
    }
  }

  async updateUser(
    username: string,
    newUserData: Partial<IUser>,
    oldPassword: string
  ): Promise<void> {
    try {
      const user = await User.findOne({ username });

      if (!user) {
        throw new CustomError("User not found", 404);
      }

      // Check if newUserData contains a new password
      if (newUserData.password) {
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newUserData.password, salt);

        // Re-encrypt wallet data using solanaWalletService
        await reEncryptWalletData(user._id, oldPassword, newUserData.password);

        newUserData.password = hashedNewPassword;
      }

      await User.updateOne({ username }, newUserData);
    } catch (error: any) {
      throw new CustomError(error.message || "Error updating user", 500);
    }
  }

  async resetPassword(token: string, password: string): Promise<void> {
    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        throw new CustomError("Invalid or expired reset token", 400);
      }

      user.password = password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;

      await user.save();
    } catch (error) {
      throw new CustomError("Error resetting password", 500);
    }
  }

  async sendResetPasswordEmail(email: string): Promise<void> {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        throw new CustomError("User with this email does not exist", 400);
      }

      const resetToken = crypto.randomBytes(20).toString("hex");
      user.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");
      user.resetPasswordExpire = new Date(Date.now() + 10 * (60 * 1000)); // 10 minutes

      await user.save();

      // Send email with reset link (you need to set up a Node mailer or similar service for this part)
      // The reset link includes the token
    } catch (error) {
      throw new CustomError("Error sending reset password email", 500);
    }
  }

  async deleteUser(username: string): Promise<void> {
    try {
      const user = await User.findOne({ username });

      if (!user) {
        console.error(
          `User with username ${username} not found and cannot be deleted.`
        );
        throw new CustomError("User not found", 404);
      }

      // Delete associated Solana wallet
      await SolanaWallet.deleteOne({ userId: user._id });

      console.log(
        `Solana wallet associated with username ${username} deleted successfully.`
      );

      // Delete the user
      await User.deleteOne({ username });

      console.log(`User with username ${username} deleted successfully.`);
    } catch (error: any) {
      if (error instanceof CustomError) {
        throw error;
      }
      console.error(
        `Error deleting user with username ${username} and their associated Solana wallet: ${error.message}`
      );
      throw new CustomError("Error deleting user and their wallet", 500);
    }
  }

  async generateToken(userId: string): Promise<string> {
    try {
      return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" });
    } catch (error) {
      throw new CustomError("Error generating token", 500);
    }
  }

  async getDecryptedMnemonicsByUserId(userId: string, password: string): Promise<string[]> {
    try {
      const userWallet = await SolanaWallet.findOne({ userId });
      if (!userWallet) {
        throw new CustomError("User wallet not found", 404);
      }

      // Combine the mnemonics from both created and imported wallets
      const allEncryptedMnemonics = [
        ...userWallet.createdWallets.map(wallet => wallet.encryptedMnemonic),
        ...userWallet.importedWallets.map(wallet => wallet.encryptedMnemonic)
      ];

      const decryptedMnemonics = allEncryptedMnemonics.map(encMnemonic => CryptoUtils.decrypt(encMnemonic, password));

      return decryptedMnemonics;
    } catch (error) {
      throw new CustomError("Error getting mnemonics", 500);
    }
  }
  async reEncryptWalletDataForSession(
    userId: string,
    oldPassword: string,
    jwtToken: string
  ): Promise<Partial<ISolanaWallet>> {
    const wallet = await SolanaWallet.findOne({ userId });

    if (!wallet) {
      throw new CustomError("Wallet not found for the specified user", 404);
    }
    console.log("jwtToken", jwtToken);
    const reEncrypt = (walletData: WalletBlock) => {
      const decryptedPrivateKey = CryptoUtils.decrypt(
        walletData.encryptedPrivateKey,
        oldPassword
      );
      console.log("decryptedPrivateKey", decryptedPrivateKey);
      const decryptedMnemonic = CryptoUtils.decrypt(
        walletData.encryptedMnemonic,
        oldPassword
      );
      return {
        publicKey: walletData.publicKey,
        encryptedPrivateKey: CryptoUtils.encrypt(decryptedPrivateKey, jwtToken),
        encryptedMnemonic: CryptoUtils.encrypt(decryptedMnemonic, jwtToken),
        name: walletData.name,
      };
    };

    const createdWallets = wallet.createdWallets.map(reEncrypt);
    const importedWallets = wallet.importedWallets.map(reEncrypt);
    const readonlyWallets = wallet.readonlyWallets; // Assuming no encryption needed for readonly wallets

    return {
      userId: wallet.userId,
      createdWallets,
      importedWallets,
      readonlyWallets,
    };
  }

  static async getWalletBalances(
    userId: string,
    network?: string
  ): Promise<any[]> {
    const walletAddresses = await getWalletAddressesByUserId(userId);

    const walletBalances = [];
    for (const address of walletAddresses) {
      const publicKey = address.publicKey;
      const balance = await getWalletBalance(publicKey, network);
      walletBalances.push({
        publicKey,
        balance,
      });
    }

    return walletBalances;
  }

  async getUserIdByUsername(username: string): Promise<string | null> {
    try {
      const user = await User.findOne({ username });

      if (!user) {
        return null;
      }

      return user._id.toString();
    } catch (error) {
      throw new CustomError("Error finding user by username", 500);
    }
  }
  async invalidateToken(token: string) {
    tokenBlacklist.add(token);
    console.log("Token blacklisted", tokenBlacklist);
  }
  async findUserbyID(userId: string): Promise<IUser | null> {
    try {
      const user = await User.findOne({ _id: userId });
      if (!user) {
        return null;
      }
      return user;
    } catch (error) {
      throw new CustomError("Error finding user by ID", 500);
    }
  }
  // Add other methods for handling two-factor authentication, QR code login, and other user-related operations
}
