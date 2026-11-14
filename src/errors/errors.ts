export class InvalidArgumentsError extends Error {
    constructor(message = 'Wrong arguments') {
        super(message);
        this.name = 'InvalidArgumentsError';
    }
}

export class HttpError extends Error {
    constructor(public readonly status: number) {
        super(`HTTP request failed with status ${status}`);
        this.name = 'HttpError';
    }
}
