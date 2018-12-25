import $ from 'jquery';
import {parseCode, get_flowTree} from './code-analyzer';
import * as js2flowchart from 'js2flowchart';

function applyFillers(shapesTreeEditor) {
    shapesTreeEditor.applyShapeStyles(
        shape => shape, {
            fillColor: '#ffffff'
        });
    shapesTreeEditor.applyShapeStyles(
        shape => shape.getNode().inPath, {
            fillColor: '#00ff10'
        });
}

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
    $('#codeFlowButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let flowTree = get_flowTree(codeToParse,JSON.parse('[' + $('#inputVector').val() + ']'));
        let shapesTree = js2flowchart.createSVGRender().buildShapesTree(flowTree);
        const shapesTreeEditor = js2flowchart.createShapesTreeEditor(shapesTree);
        applyFillers(shapesTreeEditor);
        $('#parsedCode').val(shapesTree.print());
        document.getElementById('flowChart').innerHTML = shapesTree.print();
    });
});
