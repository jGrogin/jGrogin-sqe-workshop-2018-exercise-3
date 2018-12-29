import $ from 'jquery';
import {parseCode, get_flowTree, make_cfg} from './code-analyzer';
import * as d3 from 'd3-graphviz';

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
        d3.graphviz('#flowChart')
            .renderDot('digraph { ' + make_cfg(flowTree.body[0]) + ' }');
    });
});
