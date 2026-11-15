export class InvalidArgumentsError extends Error {
    constructor(message = 'Wrong arguments') {
        super(message);
        this.name = 'InvalidArgumentsError';
    }
}

export class AbortError extends Error {
    constructor(message = 'The operation was aborted') {
        super(message);
        this.name = 'AbortError';
    }
}

export class TimeoutError extends Error {
    constructor(message = 'The operation timed out') {
        super(message);
        this.name = 'TimeoutError';
    }
}

export class HttpError extends Error {
    constructor(public readonly status: number) {
        super(`HTTP request failed with status ${status}`);
        this.name = 'HttpError';
    }
}
