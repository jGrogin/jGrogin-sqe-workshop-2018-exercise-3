import $ from 'jquery';
import {parseCode, get_flowTree, make_cfg} from './code-analyzer';
import * as js2flowchart from 'js2flowchart';
import * as esgraph from 'esgraph';
import * as gd from 'graphdracula';
import * as d3 from 'd3-graphviz';

function applyFillers(shapesTreeEditor) {
    shapesTreeEditor.applyShapeStyles(
        shape => shape, {
            fillColor: '#ffffff'
        });
    shapesTreeEditor.applyShapeStyles(
        shape => shape.getNode().inPath, {
            fillColor: '#00ff10'
        });
    shapesTreeEditor.applyShapeStyles(
        shape => shape.getNode().type === 'Program', {
            fillColor: '#ffffff'
        });
}

String.prototype.replaceAll = function (search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};
String.prototype.replaceAllArr = function (search, replacement) {
    let res = this;
    for (let i = 0; i < search.length && i < replacement.length; i++) {
        res = res.replaceAll(search[i], replacement[i]);
    }
    return res;
};
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
    $('#codeHTML').click(() => {
        document.getElementById('flowChart').innerHTML = $('#parsedCode').val();

    });
    $('#codeFlowButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let flowTree = get_flowTree(codeToParse, JSON.parse('[' + $('#inputVector').val() + ']'));
        let shapesTree = js2flowchart.createSVGRender().buildShapesTree(flowTree);
        const shapesTreeEditor = js2flowchart.createShapesTreeEditor(shapesTree);
        let cfg = esgraph(parseCode(' let a =   1;\n' +
            '    let b = 2;\n' +
            '    let c = 0;\n'));
        let gr = esgraph.dot(cfg);
        // let v = viz.parse(gr);
        applyFillers(shapesTreeEditor);
        // console.log(shapesTree);
        // console.log(shapesTreeEditor);
        // console.log(shapesTree.getShapes());
        // console.log(shapesTree.getShapes()[10]);
        // console.log(shapesTree.getShapes()[10]);
        // shapesTree.getShapes().pop(); shapesTree.getShapes()[9].state.connectionArrow = shapesTree.getShapes()[0];
        document.getElementById('flowChart').innerHTML = shapesTree.print().replaceAllArr([
            'font-family="monospace" font-size="13" fill="#222">+', 'font-family="monospace" font-size="13" fill="#222">-'
        ], [
            'font-family="monospace" font-size="13" fill="#222">T', 'font-family="monospace" font-size="13" fill="#222">F'
        ]);
        // document.getElementById('flowChart').getElementsByTagName('tspan').item(1).setAttribute('dy', '1.2em');
        // console.log(document.getElementById('flowChart').getElementsByTagName('tspan'));
        $('#parsedCode').val(document.getElementById('flowChart').innerHTML);
        // d3.graphviz('#flowChart')
        //     .renderDot('digraph {a -> b}');
        // document.getElementById('flowChart').innerHTML = vizjs(esgraph(parseCode('let a =1;let b =2;let f =4;')), { format: 'svg'});
        // var temp = document.createElement('temp');
        // temp.innerHTML = shapesTree.print().replaceAllArr([
        //     'font-family="monospace" font-size="13" fill="#222">+', 'font-family="monospace" font-size="13" fill="#222">-'
        // ], [
        //     'font-family="monospace" font-size="13" fill="#222">T', 'font-family="monospace" font-size="13" fill="#222">F'
        // ]);
        // console.log(temp.getElementsByTagName('g').item(0).getElementsByTagName('title').item(0).innerHTML);
        // console.log(temp.getElementsByTagName('g'));
        // var list = temp.getElementsByTagName('g');
        // for (let item of list) {
        //     item.getElementsByTagName('title').length>0?item.id = item.getElementsByTagName('title').item(0).innerHTML:null;
        // }
        // // temp.getElementsByTagName('g').forEach(x => {
        // //     x.id = x.getElementsByTagName('title').item(0).innerHTML;
        // // });
        // console.log(temp.getElementsByTagName('g'));
        // document.getElementById('flowChart').innerHTML = temp.innerHTML;
        // console.log(cfg);
        console.log(gr);console.log(make_cfg(flowTree.body[0]));
        d3.graphviz('#flowChart')
            .renderDot('digraph { '+make_cfg(flowTree.body[0]) + ' }');


    });
});
