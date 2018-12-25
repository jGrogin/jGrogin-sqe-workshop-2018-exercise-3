import assert from 'assert';
import {parseCode, get_flowTree} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('is parsing an empty function correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script"}'
        );
    });

    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration","declarations":[{"type":"VariableDeclarator","id":{"type":"Identifier","name":"a"},"init":{"type":"Literal","value":1,"raw":"1"}}],"kind":"let"}],"sourceType":"script"}'
        );
    });
});


describe('The flowTree creater', () => {
    it('is parsing an empty function correctly', () => {
        let tree = get_flowTree('', []);
        assert.deepEqual(tree.body, []);
    });

    it('is parsing a VariableDeclarator correctly', () => {
        let tree = get_flowTree('let a = 1;', []);
        assert.equal(tree.body.length, 1);
        assert.equal(tree.body[0].type, 'VariableDeclarator');
        assert.equal(tree.body[0].name, 'let a = 1');

    });

    it('is parsing a AssignmentExpression correctly', () => {
        let tree = get_flowTree('a = 1;', []);
        assert.equal(tree.body.length, 1);
        assert.equal(tree.body[0].type, 'AssignmentExpression');
        assert.equal(tree.body[0].name, 'a = 1');

    });
    it('is parsing a AssignmentExpression with arrays correctly', () => {
        let tree = get_flowTree('let a = []; a[0] = 1;', []);
        assert.equal(tree.body.length, 2);
        assert.equal(tree.body[0].name, 'let a = []');
        assert.equal(tree.body[1].name, 'a[0] = 1');

    });
    it('is parsing a AssignmentExpression with arrays2 correctly', () => {
        let found_error = false;
        try {
            get_flowTree('a=1;a[0] = 1;', []);
        }
        catch (TypeError) {
            found_error = true;
        }
        assert.equal(found_error, true);

    });
    it('is parsing a empty function correctly', () => {
        let tree = get_flowTree('function foo(x, y, z){}', []);
        assert.equal(tree.body.length, 1);
        assert.equal(tree.body[0].type, 'Function');
        assert.equal(tree.body[0].subType, 'FunctionDeclaration');
        assert.equal(tree.body[0].body.length, 0);
        assert.equal(tree.body[0].name, 'function foo(x, y, z)');
    });
    it('is parsing a function with if statements correctly', () => {
        let tree = get_flowTree('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '\n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '\n' +
            '    return c;\n' +
            '}', [1, 1, 2]);
        assert.equal(tree.body.length, 1);
        assert.equal(tree.body[0].body.length, 5);
        assert.equal(tree.body[0].body.every(x => x.inPath), true);
        assert.equal(tree.body[0].body[1].inPath, true);
        assert.equal(tree.body[0].body[3].body[1].inPath, true);
        assert.equal(tree.body[0].body[3].body[1].body[0].inPath, true);
    });
    it('is parsing a function with if statements with arrays correctly', () => {
        let tree = get_flowTree('function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = [0];\n' +
            '\n' +
            '    if (b < z) {\n' +
            '        c[0] = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c[0] = c + x + 5;\n' +
            '    } else {\n' +
            '        c[0] = c + z + 5;\n' +
            '    }\n' +
            '\n' +
            '    return c;\n' +
            '}', [1, 1, 2]);
        assert.equal(tree.body.length, 1);
        assert.equal(tree.body[0].body.length, 5);
        assert.equal(tree.body[0].body.every(x => x.inPath), true);
        assert.equal(tree.body[0].body[3].body[1].inPath, true);
        assert.equal(tree.body[0].body[3].body[1].body[0].inPath, true);
    });
    it('is parsing a function with if statements without alternate correctly', () => {
        let tree = get_flowTree('function foo(x){\n' +
            '    let c = 0;\n' +
            '    if (b < x) \n' +
            '        x;\n' +
            '    return c;\n' +
            '}\n', [1]);
        assert.equal(tree.body.length, 1);
        assert.equal(tree.body[0].body.length, 3);
        assert.equal(tree.body[0].body.every(x => x.inPath), true);
        assert.equal(tree.body[0].body[1].body.length, 1);
    });
    it('is parsing a function with while statement', () => {
        let tree = get_flowTree('function foo(x){\n' +
            ' let i = 1;\n' +
            ' while(i<x)\n' +
            '   i = i+1;\n' +
            'if(i==x)\n' +
            ' x;\n' +
            ' return i;\n' +
            '}', [10]);
        assert.equal(tree.body.length, 1);
        assert.equal(tree.body[0].body.length, 4);
        assert.equal(tree.body[0].body.every(x => x.inPath), true);
        assert.equal(tree.body[0].body[2].body[0].inPath, true);
    });
    it('is parsing a function with while statement endless loop', () => {
        let found_error = false;
        try {
            get_flowTree('function foo(){\n' +
                ' while(true)\n' +
                '   true;\n' +
                '    return 1;\n' +
                '}', []);
        }
        catch (Error) {
            found_error = true;
        }
        assert.equal(found_error, true);
    });

});