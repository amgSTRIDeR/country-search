export class InvalidArgumentsError extends Error {
    constructor(message = 'Wrong arguments') {
        super(message);
        this.name = 'InvalidArgumentsError';
    }
}
