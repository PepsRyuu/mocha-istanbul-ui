let { expect } = require('chai');

describe('Simple Tests', () => {
    it ('should add two numbers', () => {
        expect(1 + 2).to.equal(3);
    });

    it ('should subtract two numbers', () => {
        expect(2 - 1).to.equal(1);
    });  

    it ('should fail this test', () => {
        expect(1).to.equal(2);
    });

    describe('Nested Suite', () => {
        it ('should be pending');
    });
});

describe('second suite', () => {
    it ('should also be pending');
});