import Calculator from '../src/Calculator';
import { expect } from 'chai';

describe('Calculator', () => {
    let inst;

    beforeEach(() => {
        inst = new Calculator();
    });

    it ('should exist', () => {
        expect(Calculator).not.to.be.undefined;
    });

    it ('should add 2 and 5 to 7', () => {
        expect(inst.add(2, 5)).to.equal(7);
    });

    it ('should multiply 2 and 5 to 10', () => {
        expect(inst.multiply(2, 5)).to.equal(10);
    });

    it ('should subtract 5 and 2 to 3', () => {
        expect(inst.subtract(5, 2)).to.equal(3);
    });
});