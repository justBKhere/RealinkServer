import crypto from 'crypto';
import * as bs58 from 'bs58';

export class CryptoUtils {

    private static readonly ALGORITHM = 'aes-256-cbc';
    private static readonly IV_LENGTH = 16; 
    private static readonly SALT_LENGTH = 16;
    private static readonly KEY_LENGTH = 32;
    private static readonly ITERATIONS = 100000;
    private static readonly DIGEST = 'sha512';

    private static deriveKey(password: string, salt: Buffer): Buffer {
        return crypto.pbkdf2Sync(password, salt, this.ITERATIONS, this.KEY_LENGTH, this.DIGEST);
    }

    public static encrypt(text: string, password: string): string {
        const salt = Buffer.from(crypto.randomBytes(this.SALT_LENGTH));
        const key = this.deriveKey(password, salt);
        const iv = Buffer.from(crypto.randomBytes(this.IV_LENGTH));
        const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const encoded = bs58.encode(Buffer.concat([salt, iv, encrypted]));
        return encoded;
    }

    public static decrypt(text: string, password: string): string {
        const decoded = bs58.decode(text);
        const salt = Buffer.from(decoded.slice(0, this.SALT_LENGTH));
        const iv = Buffer.from(decoded.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH));
        const encryptedText = Buffer.from(decoded.slice(this.SALT_LENGTH + this.IV_LENGTH));
        const key = this.deriveKey(password, salt);
        const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    }
}
