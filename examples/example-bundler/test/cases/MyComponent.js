import MyComponent from '../../src/MyComponent';

describe ('MyComponent', () => {
    it ('should be defined', () => {
        let ctx = shallow(<MyComponent />); 
        expect(ctx.text()).to.equal('Hello World');
    });
});