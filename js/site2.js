/* SITE SETUP */


/*
    MAP

*/

var m;
var layer;
var tilejson = {
    tilejson: '1.0.0',
    scheme: 'xyz',
    tiles: [
        'http://maps.cardume.art.br/v2/eduamazonia/{z}/{x}/{y}.png'
    ],
    grids: [
        'http://maps.cardume.art.br/v2/eduamazonia/{z}/{x}/{y}.grid.json'
    ],
    formatter: function(options, data) {
        return data
    }
}

jQuery(document).ready(function() {
    layer = new wax.mm.connector(tilejson);
    m = new MM.Map('map', new wax.mm.connector(tilejson), null, [
        easey.DragHandler(),
        easey.TouchHandler(),
        easey.MouseWheelHandler(),
        easey.DoubleClickHandler()
    ]);
    m.setCenterZoom(new MM.Location(-48,-7),4);

    wax.mm.zoomer(m).appendTo(m.parent);
    wax.mm.interaction()
        .map(m)
        .tilejson(tilejson)
        .on(wax.tooltip().animate(true).parent(m.parent).events());
    //wax.mm.legend(m, tilejson).appendTo(m.parent);

    var minZoom = 4;
    var maxZoom = 8;
    var topLeft = new MM.Location(9, -75);
    var bottomRight = new MM.Location(-28, -4);

    // -76.1133,-17.8115,-38.1445,6.3153

    m.setZoomRange(minZoom,maxZoom);
    
    m.coordLimits = [
        m.locationCoordinate(topLeft).zoomTo(minZoom),
        m.locationCoordinate(bottomRight).zoomTo(maxZoom)
    ];

    layer.tileLimits = [
        m.locationCoordinate(topLeft).zoomTo(minZoom),
        m.locationCoordinate(bottomRight).zoomTo(maxZoom)
    ];

});

// filter map



var filter_map;
var tilejson_filters = {
    tilejson: '1.0.0',
    scheme: 'xyz',
    tiles: [
        'http://maps.cardume.art.br/v2/eduamazonia_marcador/{z}/{x}/{y}.png'
    ],
    formatter: function(options, data) {
        return data
    }
}
var filter_map_ea;


jQuery(document).ready(function() {
    filter_map = new MM.Map('filter_map', new wax.mm.connector(tilejson_filters), null);
    filter_map.setCenterZoom(new MM.Location(-56,-5),4);

    wax.mm.zoomer(filter_map).appendTo(filter_map.parent);
    wax.mm.interaction()
        .map(filter_map)
        .tilejson(tilejson);

    filter_map_ea = easey().map(filter_map).easing('easeInOut');

    var minZoom = 4;
    var maxZoom = 8;
    var topLeft = new MM.Location(7, -77);
    var bottomRight = new MM.Location(-18, -43);

    filter_map.setZoomRange(minZoom,maxZoom);
    
    filter_map.coordLimits = [
        filter_map.locationCoordinate(topLeft).zoomTo(minZoom),
        filter_map.locationCoordinate(bottomRight).zoomTo(maxZoom)
    ];

    layer.tileLimits = [
        filter_map.locationCoordinate(topLeft).zoomTo(minZoom),
        filter_map.locationCoordinate(bottomRight).zoomTo(maxZoom)
    ];

});

function markerFactory(feature) {
    var d = document.createElement('div');
    d.className = 'cidade-marker';
    // $(d).data('cidade', feature.id);
    $(d)
        .attr('data-cidade', feature.id)
        .data('lat', feature.properties.geo_latitude)
        .data('lon', feature.properties.geo_longitude)
        .append('<span class="cidade-tip">' + feature.id + ' - ' + feature.properties.estado + '</span>');
    $('option[value="' + feature.id + '"]')
        .data('lat', feature.properties.geo_latitude)
        .data('lon', feature.properties.geo_longitude);
    return d;
}

$('.cidade-marker').live('click', function() {
    var lat = $(this).data('lat');
    var lon = $(this).data('lon');
    var markerId = $(this).data('cidade');
    navigateFilter(lat, lon, markerId);

    $('select.cidade option').attr('selected', false);
    $('select.cidade option[value="' + markerId + '"]').attr('selected', true);
    $('select.cidade').chosen().trigger('liszt:updated').change();

});

function navigateFilter(lat, lon, markerId) {
    easey().map(filter_map)
        .to(filter_map.locationCoordinate({lat: lat, lon: lon})
        .zoomTo(8))
        .run(2000);

    $('.cidade-marker').removeClass('active');
    if(markerId)
        $('.cidade-marker[data-cidade="'+markerId+'"]').addClass('active');
}


/*

    GRAPHS

*/

// load graph core
google.load('visualization', '1', {packages: ['corechart']});

// declare data vars
var irregularidadesData;
var tiposData;
var programasData;
var cidadesData;

var selectedFilters = {};

$(document).ready(function() {
    // prepare general data
    $.getJSON('constatacoes.json.php?data=geral', function(data) {
        irregularidadesData = data;
    });

    // prepare tipos data
    $.getJSON('constatacoes.json.php?data=tipo', function(data) {
        tiposData = data;

        // setup dropdown
        $.each(tiposData, function(i, tipo) {
            $('select.tipo').append('<option value="' + tipo.tipo + '">' + tipo.tipo + '</option>');
        });
        jQuery('select.tipo').chosen().trigger('liszt:updated');
    });

    // prepare programas data
    $.getJSON('constatacoes.json.php?data=programa', function(data) {
        programasData = data;

        // setup dropdown
        $.each(programasData, function(i, programa) {
            $('select.programa').append('<option value="' + programa.programa + '">' + programa.programa_desc + '</option>');
        });
        jQuery('select.programa').chosen().trigger('liszt:updated');
    });

    // prepare cidades data
    $.getJSON('constatacoes.json.php?data=cidade', function(data) {
        cidadesData = data;

        // setup dropdown
        $.each(cidadesData, function(i, cidade) {
            $('select.cidade').append('<option value="' + cidade.cidade + '">' + cidade.cidade + ' - ' + cidade.estado + '</option>');
        });
        jQuery('select.cidade').chosen().trigger('liszt:updated');

        // setup marker layer
        var pointLayer = mmg().factory(markerFactory).url('cidades.geojson', function(feat, l) {
            mmg_interaction(l);
        });
        filter_map.addLayer(pointLayer);
    });

    $('select').chosen({allow_single_deselect:true}).change(function() {

        $('select.filter').each(function() {
            var filterValue = $(this).find('option:selected').val();
            var filterKey = $(this).data('type');
            selectedFilters[filterKey] = filterValue;
        });

        // navigate map if city
        if($(this).hasClass('cidade')) {
            var markerId = $(this).find('option:selected').val();
            var lat = $(this).find('option:selected').data('lat');
            var lon = $(this).find('option:selected').data('lon');
            navigateFilter(lat, lon, markerId);
        }

        theMagic(selectedFilters);

    });

});

function theMagic(selectedFilters) {
    var graphsContainer = $('#graphs');
    graphsContainer.empty();
    if(selectedFilters.cidade && !selectedFilters.tipo && !selectedFilters.programa) {
        /*--CIDADE
            gráfico coluna
            - programa
            - tipo
        */
        graphsContainer.append('<div id="graph01"></div>');
        drawCidade(selectedFilters.cidade, 'graph01');
    } else if(!selectedFilters.cidade && selectedFilters.tipo && !selectedFilters.programa) {
        /*--TIPO
            gráfico pizza
            - programa
            gráfico barra
            - cidade
        */
        graphsContainer.append('<div id="graph01"></div><div id="graph02"></div>');
        drawPieChart('Teste', selectedFilters, 'programa', 'graph01');
    } else if(!selectedFilters.cidade && !selectedFilters.tipo && selectedFilters.programa) {
        /*--PROGRAMA
            gráfico pizza
            - tipo
            gráfico barra
            - cidade
        */
        graphsContainer.append('<div id="graph01"></div><div id="graph02"></div>');
        drawPieChart('Teste 2', selectedFilters, 'tipo', 'graph01');
    } else if(selectedFilters.cidade && selectedFilters.tipo && !selectedFilters.programa) {
        /*--CIDADE+TIPO
            gráfico pizza
            - programa
            gráfico pizza (total)
            - programa
        */
        graphsContainer.append('<div id="graph01"></div><div id="graph02"></div>');
        drawPieChart('Teste 3', selectedFilters, 'programa', 'graph01');        
    } else if(!selectedFilters.cidade && selectedFilters.tipo && selectedFilters.programa) {
        /*--TIPO+PROGRAMA
            gráfico barra
            - cidade
        */
    } else if(selectedFilters.cidade && !selectedFilters.tipo && selectedFilters.programa) {
        /*--CIDADE+PROGRAMA
            gráfico pizza
            - tipo
            gráfico pizza (total)
            - tipo
        */
        graphsContainer.append('<div id="graph01"></div><div id="graph02"></div>');
        drawPieChart('Filtro', selectedFilters, 'tipo', 'graph01');
        selectedFilters.cidade = '';
        drawPieChart('Total', selectedFilters, 'tipo', 'graph02');
    } else if(selectedFilters.cidade && selectedFilters.tipo && selectedFilters.programa) {
        /*--CIDADE+TIPO+PROGRAMA
            só lista
        */
    }
}

function getIrregularidadesCount(filters) {
    var data = jLinq.from(irregularidadesData);
    jQuery.each(filters, function(key, value) {
        data = data.starts(key, value);
    });
    return data.count();
}

function getConstatacoes(filters) {
    var data = constatacoesData;
    jQuery.each(filters, function(key, value) {
        data = data.starts(key, value);
    });
    var count = data.count();
    var results = data.select();

    var output = {
        filters: filters,
        count: count,
        results: results
    };
    return output;
}

function getCidadeGraphData(cidade) {
    var data = [];
    data[0] = [];

    // setup header
    data[0][0] = 'Programa';
    jQuery.each(tiposData, function(index, tipoData) {
        data[0][index+1] = tipoData.tipo;
    });

    // rows
    jQuery.each(programasData, function(programaIndex, programaData) {
        data[programaIndex+1] = [];
        data[programaIndex+1][0] = programaData.programa_desc;
        jQuery.each(tiposData, function(tipoIndex, tipoData) {
            data[programaIndex+1][tipoIndex+1] = getIrregularidadesCount({
                'programa': programaData.programa,
                'tipo': tipoData.tipo,
                'cidade': cidade
            });
        });
    });

    return data;
}

function getGraphData(filters, output) {
    var data = [];
    data[0] = [];
    if(output == 'tipo') {
        data[0][0] = 'Tipo';
        var outputData = tiposData;
    } else if(output == 'programa') {
        data[0][0] = 'Programa';
        var outputData = programasData;
    }
    if(output == 'cidade') {
        data[0][0] = 'Cidade';
        var outputData = cidadesData;
    }
    data[0][1] = 'Irregularidades';
    jQuery.each(outputData, function(i, outData) {
        data[i+1] = [];
        data[i+1][0] = outData[output];
        filters[output] = outData[output];
        data[i+1][1] = getIrregularidadesCount(filters);
    });
    return data;
}

function drawPieChart(title, filters, output, containerId) {
    var wrapper = new google.visualization.ChartWrapper({
        chartType: 'PieChart',
        dataTable: getGraphData(filters, output),
        options: {
            title: title,
            width: 473,
            height: 400,
            backgroundColor: 'transparent'
        },
        containerId: containerId
    });
    wrapper.draw();
    return;
}

function drawCidade(cidade, containerId) {
    var wrapper = new google.visualization.ChartWrapper({
        chartType: 'ComboChart',
        dataTable: getCidadeGraphData(cidade),
        options: {
            title:'Irregularidades na cidade',
            width:473,
            height:400,
            backgroundColor: 'transparent',
            vAxis: {title: 'Irregularidades'},
            hAxis: {title: 'Programa'},
            seriesType: 'bars'
        },
        containerId: containerId
    });
    wrapper.draw();
    return;
}

function drawBarChart(title, filters, output) {
    var wrapper = new google.visualization.ChartWrapper({
        chartType: 'BarChart',
        dataTable: getSimpleGraphData(filters, output),
        options: {
            title: title,
            width: 600,
            height: 1500,
            backgroundColor: 'transparent',
            colors: ['#f00']
        },
        containerId: 'visualization'
    });
    wrapper.draw();
}