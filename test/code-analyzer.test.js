import assert from 'assert';
import {
    parseCode,
    get_flowTree,
    handleDeclaration,
    buildFlowTree,
    convert_flowTree,
    cfgNodes,
    cfgEdges, make_cfg
} from '../src/js/code-analyzer';

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
        get_flowTree('', []);
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
        let tree = get_flowTree('function foo(x, y, z){}', [1, 2, 3]);
        assert.equal(tree.body.length, 1);
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
        assert.equal(tree.body[0].body.length, 3);
        assert.equal(tree.body[0].body.every(x => x.inPath), true);
        assert.equal(tree.body[0].body[1].inPath, true);
        assert.equal(tree.body[0].body[1].body[1].inPath, true);
        assert.equal(tree.body[0].body[1].body[1].body[0].inPath, true);
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
        assert.equal(tree.body[0].body.length, 3);
        assert.equal(tree.body[0].body.every(x => x.inPath), true);
        assert.equal(tree.body[0].body[1].body[1].inPath, true);
        assert.equal(tree.body[0].body[1].body[1].body[0].inPath, true);
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
        assert.equal(found_error, false);
    });

});

describe('The flowTree handlers', () => {
    it('handleDeclaration', () => {
        let env = {env: {}};
        handleDeclaration({name: 'let a = 1'}, env);
        assert.deepEqual(env.env, {a: 1});
    });

});

describe('The flowTree converter', () => {
    it('convert_flowTree', () => {
        let flowTree = buildFlowTree('function foo(x, y, z){\n' +
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
            '}', [1, 2, 3]);
        assert.equal(flowTree.body[0].body.length, 5);
        convert_flowTree(flowTree);
        assert.equal(flowTree.body[0].body.length, 3);
    });

});
describe('The cfg maker', () => {
    it('cfgNodes', () => {
        let flowTree = get_flowTree('function foo(x, y, z){\n' +
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
            '}', [1, 2, 3]);
        let cfg = {nodes: '', n: 0};
        cfgNodes(flowTree.body[0], cfg);
        assert.equal(cfg.n, 7);
        assert.equal(cfg.nodes.includes('let a = x + 1\nlet b = a + y\nlet c = 0'), true);
        assert.equal(cfg.nodes.includes('return c'), true);

    });

    it('cfgEdges', () => {
        let flowTree = get_flowTree('function foo(x, y, z){\n' +
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
            '}', [1, 2, 3]);
        let cfg = {
            nodes: 'n0[label="-1-\n' +
            'let a = x + 1\n' +
            'let b = a + y\n' +
            'let c = 0", shape="box" style=filled fillcolor="#00ff10"]\n' +
            'n1[label="-2-\n' +
            '(b < z)", shape="diamond" style=filled fillcolor="#00ff10"]\n' +
            'n2[label="-3-\n' +
            'c = c + 5", shape="box" style=filled fillcolor="#ffffff"]\n' +
            'n3[label="-4-\n' +
            '(b < z * 2)", shape="diamond" style=filled fillcolor="#00ff10"]\n' +
            'n4[label="-5-\n' +
            'c = c + x + 5", shape="box" style=filled fillcolor="#00ff10"]\n' +
            'n5[label="-6-\n' +
            'c = c + z + 5", shape="box" style=filled fillcolor="#ffffff"]\n' +
            'n6[label="", shape="circle" style=filled fillcolor="#00ff10"]\n' +
            'return[label="-7-\n' +
            'return c", shape="box" style=filled fillcolor="#00ff10"]', edges: '', n: 7
        };
        cfgNodes(flowTree.body[0],{nodes: '', n: 0});
        cfgEdges(flowTree.body[0], cfg);
        assert.equal(cfg.n, 7);
        assert.equal(cfg.edges.includes('n0->n1[label=""]'), true);
        assert.equal(cfg.edges.includes('n1->n2[label="T"]'), true);
        assert.equal(cfg.edges.includes('n1->n3[label="F"]'), true);
        assert.equal(cfg.edges.includes('n3->n4[label="T"]'), true);
        assert.equal(cfg.edges.includes('n3->n5[label="F"]'), true);
        assert.equal(cfg.edges.includes('n2->n6[label=""]'), true);
        assert.equal(cfg.edges.includes('n4->n6[label=""]'), true);
        assert.equal(cfg.edges.includes('n5->n6[label=""]'), true);
    });
    it('cfgEdges', () => {
        let flowTree = get_flowTree('function foo(x, y, z){\n' +
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
            '}', [1, 2, 3]);
        let cfg = {
            nodes: 'n0[label="-1-\n' +
            'let a = x + 1\n' +
            'let b = a + y\n' +
            'let c = 0", shape="box" style=filled fillcolor="#00ff10"]\n' +
            'n1[label="-2-\n' +
            '(b < z)", shape="diamond" style=filled fillcolor="#00ff10"]\n' +
            'n2[label="-3-\n' +
            'c = c + 5", shape="box" style=filled fillcolor="#ffffff"]\n' +
            'n3[label="-4-\n' +
            '(b < z * 2)", shape="diamond" style=filled fillcolor="#00ff10"]\n' +
            'n4[label="-5-\n' +
            'c = c + x + 5", shape="box" style=filled fillcolor="#00ff10"]\n' +
            'n5[label="-6-\n' +
            'c = c + z + 5", shape="box" style=filled fillcolor="#ffffff"]\n' +
            'n6[label="", shape="circle" style=filled fillcolor="#00ff10"]\n' +
            'return[label="-7-\n' +
            'return c", shape="box" style=filled fillcolor="#00ff10"]', edges: '', n: 7
        };
        cfgNodes(flowTree.body[0],{nodes: '', n: 0});
        cfgEdges(flowTree.body[0], cfg);
        assert.equal(cfg.n, 7);
        assert.equal(cfg.edges.includes('n0->n1[label=""]'), true);
        assert.equal(cfg.edges.includes('n1->n2[label="T"]'), true);
        assert.equal(cfg.edges.includes('n1->n3[label="F"]'), true);
        assert.equal(cfg.edges.includes('n3->n4[label="T"]'), true);
        assert.equal(cfg.edges.includes('n3->n5[label="F"]'), true);
        assert.equal(cfg.edges.includes('n2->n6[label=""]'), true);
        assert.equal(cfg.edges.includes('n4->n6[label=""]'), true);
        assert.equal(cfg.edges.includes('n5->n6[label=""]'), true);
    });
    it('make cfg', () => {
        let flowTree = buildFlowTree('function foo(x){\n' +
            '   let c = 0;\n' +
            '   while (c < x) {\n' +
            '       c = c + 1;\n' +
            '   }\n' +
            '   return c;\n' +
            '}');
        let cfg = make_cfg(flowTree.body[0]);
        assert.equal(cfg.includes('n3->return'), true);
        assert.equal(cfg.includes('n0->n1'), true);
        assert.equal(cfg.includes('n1->n2'), true);
        assert.equal(cfg.includes('n2->n1'), true);
        assert.equal(cfg.includes('n1->n3'), true);
        assert.equal(cfg.includes('n0[label="-1-\n' + 'let c = 0"'), true);
        assert.equal(cfg.includes('n1[label="-2-\n' + 'c < x"'), true);
        assert.equal(cfg.includes('n2[label="-3-\n' + 'c = c + 1"'), true);
        assert.equal(cfg.includes('n3[label=""'), true);
        assert.equal(cfg.includes('return[label="-4-\n' + 'return c"'), true);
    });
    it('make cfg2', () => {
        let flowTree = buildFlowTree('function foo(x){\n' +
            '   let c = 0;\n' +
            '   while (c < x);' +
            '   return c;\n' +
            '}');
        let cfg = make_cfg(flowTree.body[0]);
        assert.equal(cfg.includes('n2->return'), true);
        assert.equal(cfg.includes('n0->n1'), true);
        assert.equal(cfg.includes('n1->n1'), true);
        assert.equal(cfg.includes('n1->n2'), true);
        assert.equal(cfg.includes('n0[label="-1-\n' + 'let c = 0"'), true);
        assert.equal(cfg.includes('n1[label="-2-\n' + 'c < x"'), true);
        assert.equal(cfg.includes('n2[label=""'), true);
        assert.equal(cfg.includes('return[label="-3-\n' + 'return c"'), true);

    });
});
