import * as esprima from 'esprima';
import * as js2flowchart from 'js2flowchart';
import * as staticeval from 'static-eval';

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

const parseCode_with_source = (codeToParse) => {
    return esprima.parseScript(codeToParse, {loc: true, range: true}, node => node.txt =
        codeToParse.substring(node.range[0], node.range[1]));
};

function handleBody(node, env) {
    node.body != null ? node.body.forEach(x => handleNode(x, env)) : null;
}

function handleFunctionDeclaration(node, env) {
    var paramList = node.name.match(/function[^(]*\(([^)]*)\)/)[1].split(/\W+/);
    paramList.forEach(x => env.env[x] = env.inputVector.pop());
    handleBody(node, env);
}

function isFunctionDeclaration(node) {
    return node.type === 'Function' && node.subType === 'FunctionDeclaration';
}

function updateEnv(env, key, value) {
    env.env[key] = value;
    env.oldEnv != null && env.oldEnv.env[key] != null ? updateEnv(env.oldEnv, key, value) : null;
}

function updateArrayEnv(env, key, index, value) {
    if (env.env[key] != null && env.env[key].constructor === Array)
        env.env[key][index] = value;
    else throw new TypeError('bad');
    env.oldEnv != null && env.oldEnv.env[key] != null ? updateArrayEnv(env.oldEnv, key, value) : null;
}

function isVarDeclaration(node) {
    return node.type === 'VariableDeclarator' || node.type === 'AssignmentExpression';
}

function handleDeclaration(node, env) {
    let expr = node.name.startsWith('let') ? node.name.slice(3) : node.name;
    let parsedExpr = parseCode_with_source(expr).body[0].expression;
    let value = staticeval(parsedExpr.right, env.env);
    parsedExpr.left.type === 'MemberExpression' ? updateArrayEnv(env, parsedExpr.left.object.txt,
        parsedExpr.left.property.txt, value) :
        updateEnv(env, parsedExpr.left.txt, value);
}

function isIfStatement(node) {
    return node.type === 'Conditional' && node.subType === 'IfStatement';
}

function handleIfStatement(node, env) {
    let parsedExpr = parseCode_with_source(node.name).body[0].expression;
    let envCopy = JSON.parse(JSON.stringify(env));
    envCopy.oldEnv = env;
    staticeval(parsedExpr, env.env) ? handleNode(node.body[0], envCopy) : node.body.length > 1 ? handleNode(node.body[1], envCopy) : null;
}

function isWhileStatement(node) {
    return node.type === 'Loop' && node.subType === 'WhileStatement';
}

let stack_limit = 20;

function handleWhileStatement(node, env) {
    let parsedExpr = parseCode_with_source(node.name).body[0].expression;
    let envCopy = JSON.parse(JSON.stringify(env));
    envCopy.oldEnv = env;
    if (staticeval(parsedExpr, env.env)) {
        handleBody(node, envCopy);
        if (stack_limit > 0){
            stack_limit--;
            handleNode(node, env);
            stack_limit++;
        }
        else throw new Error('exceeded stack limit');
    }
}

function handleNode(node, env) {
    node.inPath = true;
    if (isFunctionDeclaration(node)) {
        handleFunctionDeclaration(node, env);
    }
    else if (isVarDeclaration(node)) {
        handleDeclaration(node, env);
    }
    else if (isIfStatement(node)) {
        handleIfStatement(node, env);
    }
    else if (isWhileStatement(node)) {
        handleWhileStatement(node, env);
    }
    else {
        handleBody(node, env);
    }
}

function get_flowTree(codeToParse, inputVector) {
    const flowTree = js2flowchart.convertCodeToFlowTree(codeToParse);
    handleNode(flowTree, {env: {}, inputVector: inputVector.reverse()});
    return flowTree;
}

export {parseCode, get_flowTree};
