export class CustomError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;

        // Logging the error with its details in the console
        console.error(`[CustomError]: ${message} - StatusCode: ${statusCode}`);

        Object.setPrototypeOf(this, CustomError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}
