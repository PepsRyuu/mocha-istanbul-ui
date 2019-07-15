import Calculator from './Calculator';

describe('Calculator', () => {
    let inst;

    beforeEach(() => {
        inst = new Calculator();
    });

    it ('should add 2 and 5 to 7', () => {
        expect(inst.add(2, 5)).toEqual(7);
    });

    it ('should multiply 2 and 5 to 10', () => {
        expect(inst.multiply(2, 5)).toEqual(10);
    });
});