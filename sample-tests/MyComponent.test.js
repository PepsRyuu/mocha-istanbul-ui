let MyComponent = require('./MyComponent');
let expect = require('chai').expect;

describe ('MyComponent', () => {
    describe('getMessage', () => {
        it ('should return a message', () => {
            expect(MyComponent.getMessage()).to.equal('hello world');
        });
    })

    describe ('getNumber', () => {
        it ('should return a number', () => {
            expect(MyComponent.getNumber()).to.equal(123);
        });

        it ('should give 456', () => {
            expect(MyComponent.getNumber()).to.equal(456);
        })
    });

    describe ('add', () => {
        it ('should add 1 + 2', () => {
            expect(MyComponent.add(1, 2)).to.equal(3);
        });

        it ('should add 1 + 3');

        it ('should add 4 + 5', () => {
            expect(MyComponent.add(4, 5)).to.equal(9);
        })
    });
});