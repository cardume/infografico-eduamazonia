/* SITE SETUP */

/*
    HOME MAP

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
        var tooltip = '';
        tooltip += '<div class="cidade-teaser dynamic-tip">';
        tooltip += '<h2>' + data.cidade + '</h2>';
        tooltip += '<h3>' + data.estado + '</h3>';
        tooltip += '<p class="total">';
        tooltip += '<span class="head">total de</span>';
        tooltip += '<span class="n">' + data.constatacoes + '</span>';
        tooltip += '<span class="foot">irregularidades</span>';
        tooltip += '</p>';
        tooltip += '<ul class="tipos">';
        if(data.despesa_irregular) tooltip += '<li><span>' + data.despesa_irregular + '</span> em despesa irregular</li>';
        if(data.desvio_de_finalidade) tooltip += '<li><span>' + data.desvio_de_finalidade + '</span> em desvio de finalidade</li>';
        if(data.falta_de_controle_administrativo) tooltip += '<li><span>' + data.falta_de_controle_administrativo + '</span> em falta de controle administrativo</li>';
        if(data.falta_de_controle_social) tooltip += '<li><span>' + data.falta_de_controle_social + '</span> em falta de controle social</li>';
        if(data.falta_de_prestacao_de_contas) tooltip += '<li><span>' + data.falta_de_prestacao_de_contas + '</span> em falta de prestação de contas</li>';
        tooltip += '</ul>';
        tooltip += '</div>';
        return tooltip;
    }
}

$(document).ready(function() {
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
        .on(wax.tooltip().animate(true).parent(m.parent).events())
        .on({
            on: function(e) {
                $('.default-tip').hide();
            },
            off: function(e) {
                $('.default-tip').show();
            }
        });

    var minZoom = 4;
    var maxZoom = 8;
    var topLeft = new MM.Location(9, -75);
    var bottomRight = new MM.Location(-37, -4);

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

// prepare links

$(document).ready(function() {
    $('nav#main-nav a').click(function() {
        var section = $(this).data('section');
        if(section) {
            loadSection(section);
            return false;
        }
    });
});

// prepare data navigation core

// load graph core
google.load('visualization', '1', {packages: ['corechart']});

// declare data vars
var irregularidadesData;
var currentData;
var eduamazonia = {};
var selectedFilters = {};
var categories = [];

var sectionLoaded = {};
sectionLoaded.navegue = false;

function loadSection(section) {

    $('.main-section').hide();
    $('#' + section).show();

    if(section == 'navegue' && sectionLoaded[section] == false) {    // prepare data and filters

        $.getJSON('constatacoes.json.php?data=geral', function(data) {
            irregularidadesData = data;
        });
        // prepare tipos data
        $.getJSON('constatacoes.json.php?data=tipo', function(data) {
            eduamazonia.tipo = data;

            // setup dropdown
            $.each(eduamazonia.tipo, function(i, tipo) {
                $('select.tipo').append('<option value="' + tipo.tipo + '">' + tipo.tipo + '</option>');
            });
            jQuery('select.tipo').chosen().trigger('liszt:updated');
        });
        // prepare programas data
        $.getJSON('constatacoes.json.php?data=programa', function(data) {
            eduamazonia.programa = data;

            // setup dropdown
            $.each(eduamazonia.programa, function(i, programa) {
                $('select.programa').append('<option value="' + programa.programa + '">' + programa.programa_desc + '</option>');
            });
            jQuery('select.programa').chosen().trigger('liszt:updated');
        });
        // prepare cidades data
        $.getJSON('constatacoes.json.php?data=cidade', function(data) {
            eduamazonia.cidade = data;

            // setup dropdown
            $.each(eduamazonia.cidade, function(i, cidade) {
                $('select.cidade').append('<option value="' + cidade.cidade + '">' + cidade.cidade + ' - ' + cidade.estado + '</option>');
            });
            jQuery('select.cidade').chosen().trigger('liszt:updated');

            // setup marker layer
            var pointLayer = mmg().factory(markerFactory).url('cidades.geojson', function(feat, l) {
                mmg_interaction(l);
            });
            filter_map.addLayer(pointLayer);
        });
        // select change event
        $('select').chosen({allow_single_deselect:true}).change(function() {

            categories = [];
            i = 0;
            $('select.filter').each(function() {
                var filterValue = $(this).find('option:selected').val();
                var filterKey = $(this).data('type');
                if(filterValue) {
                    selectedFilters[filterKey] = filterValue;
                } else {
                    categories[i] = filterKey;
                    delete selectedFilters[filterKey];
                    i++;
                }
            });

            // navigate map if city
            if($(this).hasClass('cidade')) {
                var markerId = $(this).find('option:selected').val();
                if(markerId) {
                    var lat = $(this).find('option:selected').data('lat');
                    var lon = $(this).find('option:selected').data('lon');
                    navigateFilter(lat, lon, 8, markerId);
                } else {
                    navigateFilter(-2, -57, 4);
                }
            }

            if(!$.isEmptyObject(selectedFilters)) {
                updateCurrentData();
            }
            updateSelectOptions();
            theMagic();
        });

        function updateSelectOptions() {
            if($.isEmptyObject(selectedFilters)) {
                $('select.filter option').attr('disabled', false);
                $('.cidade-marker').show();
                $('select.filter').chosen().trigger('liszt:updated');
            } else {
                $.each(categories, function(i, category) {
                    $('select.' + category + ' option').attr('disabled', true);
                    if(category == 'cidade')
                        $('.cidade-marker').hide();
                    $.each(currentData[category], function(key, data) {
                        var $option = $('select.' + category + ' option[value="' + data[category] + '"]');
                        $option.attr('disabled', false);
                        if(category == 'cidade')
                            $('.cidade-marker[data-cidade="' + data[category] + '"]').show();
                    });
                    $('select.' + category).chosen().trigger('liszt:updated');
                });
            }
        }

        function updateCurrentData() {
            currentData = {};
            $.each(categories, function(i, category) {
                currentData[category] = getCategoryCurrentData(selectedFilters, category);
            });
        }

        function getCategoryCurrentData(filters, category) {
            var availableCategoryData = [];
            var i = 0;
            $.each(eduamazonia[category], function(key, value) {
                var filtering = {};
                var count;
                filtering[category] = value[category];
                var mixedFilter = $.extend({}, filters, filtering);
                count = getIrregularidadesCount(mixedFilter);
                if(count >= 1) {
                    availableCategoryData[i] = value;
                    availableCategoryData[i].count = count;
                    i++;
                }
            });
            var sortedData = jLinq.from(availableCategoryData).sort('-count').select();
            return sortedData;
        }

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

        filter_map = new MM.Map('filter_map', new wax.mm.connector(tilejson_filters), null);
        filter_map.setCenterZoom(new MM.Location(-56,-5),4);

        wax.mm.zoomer(filter_map).appendTo(filter_map.parent);
        wax.mm.interaction()
            .map(filter_map)
            .tilejson(tilejson);

        var filter_map_ea = easey().map(filter_map).easing('easeInOut');

        var minZoom = 4;
        var maxZoom = 8;
        var topLeft = new MM.Location(6, -77);
        var bottomRight = new MM.Location(-15, -43);

        filter_map.setZoomRange(minZoom,maxZoom);

        filter_map.coordLimits = [
            filter_map.locationCoordinate(topLeft).zoomTo(minZoom),
            filter_map.locationCoordinate(bottomRight).zoomTo(maxZoom)
        ];

        layer.tileLimits = [
            filter_map.locationCoordinate(topLeft).zoomTo(minZoom),
            filter_map.locationCoordinate(bottomRight).zoomTo(maxZoom)
        ];

        sectionLoaded[section] = true;

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
            navigateFilter(lat, lon, 8, markerId);

            $('select.cidade option').attr('selected', false);
            $('select.cidade option[value="' + markerId + '"]').attr('selected', true);
            $('select.cidade').chosen().trigger('liszt:updated').change();
        });

        function navigateFilter(lat, lon, zoom, markerId) {
            easey().map(filter_map)
                .to(filter_map.locationCoordinate({lat: lat, lon: lon})
                .zoomTo(zoom))
                .run(2000);

            $('.cidade-marker').removeClass('active');
            if(markerId)
                $('.cidade-marker[data-cidade="'+markerId+'"]').addClass('active');
        }
    }
}

function getIrregularidadesCount(filters) {
    var data = jLinq.from(irregularidadesData);
    jQuery.each(filters, function(key, value) {
        data = data.starts(key, value);
    });
    return data.count();
}

function theMagic() {

    var tableData = {};

    var title = '';
    $.each(selectedFilters, function(filter, filterName) {
        title += filterName;
    });
    if(selectedFilters.cidade && !selectedFilters.programa && !selectedFilters.tipo) {
        title = selectedFilters.cidade;
    } else if(selectedFilters.cidade && selectedFilters.programa && !selectedFilters.tipo) {
        title = selectedFilters.programa + ' em ' + selectedFilters.cidade;
    } else if(selectedFilters.cidade && selectedFilters.programa && selectedFilters.tipo) {
        title = selectedFilters.tipo + ' em ' + selectedFilters.programa + ' na cidade de ' + selectedFilters.cidade;
    } else if(!selectedFilters.cidade && selectedFilters.programa && selectedFilters.tipo) {
        title = selectedFilters.tipo + ' em ' + selectedFilters.programa;
    }

    var $resultsContainer = $('#data');
    var $resultsHeader = $resultsContainer.find('header');

    $resultsHeader
        .empty()
        .append('<h2>' + title + '</h2>');

    var $dataTable = $resultsContainer.find('#data-table');
    $dataTable.empty();

    // LOADING CONTENT

    var $graphsContainer = $resultsContainer.find('#graphs');
    $graphsContainer.empty();
    // clear select options

    if(selectedFilters.cidade && !selectedFilters.tipo && !selectedFilters.programa) {
        /*--CIDADE
            gráfico coluna
            - programa
            - tipo
        */
        $graphsContainer.append('<div id="graph01" class="graph-container"></div>');
        drawCidade(selectedFilters, 'graph01');
        $('#graph01').before('<h3>Irregularidades por programa na cidade</h3>');
        tableData.programa = currentData.programa;

        // data table
        var tableContent = '';
        tableContent += '<table><tbody><tr><th class="n">Número de irregularidades</th><th>Programas do governo</th><th class="m">Média das cidades fiscalizadas</th></tr>';
        var totalCount = 0;
        var totalAverage = 0;
        $.each(eduamazonia.programa, function(i, programa) {
            var itemData = jLinq.from(tableData.programa).starts('programa', programa.programa).select();
            $.each(itemData, function(key, value) { itemData = value });
            var count = itemData.count;
            if(!count) count = '--';
            else totalCount = totalCount + count;
            var average = Math.ceil(programa.constatacoes/32);
            totalAverage = Math.ceil(totalAverage + (programa.constatacoes/32));
            tableContent += '<tr><td class="n">' + count + '</td><td>' + programa.programa_desc + '</td><td class="m">' + average + '</td></tr>';
        });
        tableContent += '<tr class="total"><td class="n">' + totalCount + '</td><td>TOTAL</td><td class="m">' + totalAverage + '</td></tr>';
        tableContent += '</tbody></table>';

        $dataTable.append(tableContent);

    } else if(!selectedFilters.cidade && selectedFilters.tipo && !selectedFilters.programa) {
        /*--TIPO
            gráfico pizza
            - programa
            gráfico barra
            - cidade
        */
        $graphsContainer.append('<div id="graph01" class="graph-container"></div><div id="graph02" class="graph-container"></div>');
        drawPieChart('', selectedFilters, 'programa', 'graph01');
        tableData.programa = currentData.programa;
        drawColumnChart('', selectedFilters, 'cidade', 'graph02');

        // data table
        var tableContent = '';
        tableContent += '<table><tbody><tr><th class="total">Total</th><th>Programas</th><th></th></tr>';
        var totalCount = 0;
        var totalAverage = 0;
        tableContent += '<tr><td rowspan="10" class="total"></td></tr>';
        $.each(eduamazonia.programa, function(i, programa) {
            var itemData = jLinq.from(tableData.programa).starts('programa', programa.programa).select();
            $.each(itemData, function(key, value) { itemData = value });
            var count = itemData.count;
            if(!count) count = '--';
            else totalCount = totalCount + count;
            tableContent += '<tr><td>' + programa.programa_desc + '</td><td class="n">' + count + '</td></tr>';
        });
        tableContent += '</tbody></table>';

        $dataTable.append(tableContent);
        $dataTable.find('td.total').text(totalCount);
        $dataTable.find('td.total').append('<span>irregularidades</span>');
    } else if(!selectedFilters.cidade && !selectedFilters.tipo && selectedFilters.programa) {
        /*--PROGRAMA
            gráfico pizza
            - tipo
            gráfico barra
            - cidade
        */
        $graphsContainer.append('<div id="graph01" class="graph-container"></div><div id="graph02" class="graph-container"></div>');
        drawPieChart('', selectedFilters, 'tipo', 'graph01');
        tableData.tipo = currentData.tipo;
        drawColumnChart('', selectedFilters, 'cidade', 'graph02');

        // data table
        var tableContent = '';
        tableContent += '<table><tbody><tr><th class="total">Total</th><th>Tipos de irregularidades</th><th></th></tr>';
        var totalCount = 0;
        var totalAverage = 0;
        tableContent += '<tr><td rowspan="6" class="total"></td></tr>';
        $.each(eduamazonia.tipo, function(i, tipo) {
            var itemData = jLinq.from(tableData.tipo).starts('tipo', tipo.tipo).select();
            $.each(itemData, function(key, value) { itemData = value });
            var count = itemData.count;
            if(!count) count = '--';
            else totalCount = totalCount + count;
            tableContent += '<tr><td>' + tipo.tipo + '</td><td class="n">' + count + '</td></tr>';
        });
        tableContent += '</tbody></table>';

        $dataTable.append(tableContent);
        $dataTable.find('td.total').text(totalCount);
        $dataTable.find('td.total').append('<span>irregularidades</span>');
    } else if(selectedFilters.cidade && selectedFilters.tipo && !selectedFilters.programa) {
        /*--CIDADE+TIPO
            gráfico pizza
            - programa
            gráfico pizza (total)
            - programa
        */
        $graphsContainer.append('<div id="graph01" class="graph-container"></div><div id="graph02" class="graph-container"></div>');
        drawPieChart('', selectedFilters, 'programa', 'graph01');
        tableData.programa = currentData.programa;
        selectedFilters.cidade = '';
        drawPieChart('Total', selectedFilters, 'programa', 'graph02');
    } else if(!selectedFilters.cidade && selectedFilters.tipo && selectedFilters.programa) {
        /*--TIPO+PROGRAMA
            gráfico barra
            - cidade
        */
        $graphsContainer.append('<div id="graph01" class="graph-container"></div>');
        drawColumnChart('', selectedFilters, 'cidade', 'graph01');
        tableData.cidade = currentData.cidade;
    } else if(selectedFilters.cidade && !selectedFilters.tipo && selectedFilters.programa) {
        /*--CIDADE+PROGRAMA
            gráfico pizza
            - tipo
            gráfico pizza (total)
            - tipo
        */
        $graphsContainer.append('<div id="graph01"></div><div id="graph02"></div>');
        drawPieChart('Filtro', selectedFilters, 'tipo', 'graph01');
        tableData.tipo = currentData.tipo;
        console.log(tableData);
        drawPieChart('Total', selectedFilters, 'tipo', 'graph02');

        // data table
        var tableContent = '';
        tableContent += '<table><tbody><tr><th class="total">Total</th><th>Tipos de irregularidades</th><th></th></tr>';
        var totalCount = 0;
        var totalAverage = 0;
        tableContent += '<tr><td rowspan="6" class="total"></td></tr>';
        $.each(eduamazonia.tipo, function(i, tipo) {
            var itemData = jLinq.from(tableData.tipo).starts('tipo', tipo.tipo).select();
            $.each(itemData, function(key, value) { itemData = value });
            var count = itemData.count;
            if(!count) count = '--';
            else totalCount = totalCount + count;
            tableContent += '<tr><td>' + tipo.tipo + '</td><td class="n">' + count + '</td></tr>';
        });
        tableContent += '</tbody></table>';

        $dataTable.append(tableContent);
        $dataTable.find('td.total').text(totalCount);
        $dataTable.find('td.total').append('<span>irregularidades</span>');
    } else if(selectedFilters.cidade && selectedFilters.tipo && selectedFilters.programa) {
        /*--CIDADE+TIPO+PROGRAMA
            só lista
        */
    }
}

function getCidadeGraphData(filters) {
    var data = [];
    data[0] = [];

    var cidade = filters.cidade;

    // setup header
    data[0][0] = 'Programa';
    jQuery.each(currentData.tipo, function(index, tipoData) {
        data[0][index+1] = tipoData.tipo;
    });

    // rows
    jQuery.each(currentData.programa, function(programaIndex, programaData) {
        data[programaIndex+1] = [];
        data[programaIndex+1][0] = programaData.programa_desc;
        jQuery.each(currentData.tipo, function(tipoIndex, tipoData) {
            data[programaIndex+1][tipoIndex+1] = getIrregularidadesCount({
                'programa': programaData.programa,
                'tipo': tipoData.tipo,
                'cidade': cidade
            });
        });
    });
    return data;
}

function getPieGraphData(filters, category) {
    var data = [];
    data[0] = [];
    data[0][0] = '';
    data[0][1] = '';
    jQuery.each(currentData[category], function(i, catData) {
        data[i+1] = [];
        data[i+1][0] = catData[category];
        data[i+1][1] = catData.count;
    });
    return data;
}

function getColumnGraphData(filters, category) {
    var data = [];
    data[0] = [];
    data[1] = [];
    data[0][0] = '';
    data[1][0] = '';
    jQuery.each(currentData[category], function(i, catData) {
        data[0][i+1] = catData[category];
        data[1][i+1] = catData.count;
    });
    return data;
}

function drawPieChart(title, filters, categories, containerId) {
    var wrapper = new google.visualization.ChartWrapper({
        chartType: 'PieChart',
        dataTable: getPieGraphData(filters, categories),
        options: {
            width: 450,
            height: 400,
            backgroundColor: 'transparent'
        },
        containerId: containerId
    });
    wrapper.draw();
    return;
}

function drawColumnChart(title, filters, categories, containerId) {
    var wrapper = new google.visualization.ChartWrapper({
        chartType: 'ColumnChart',
        dataTable: getColumnGraphData(filters, categories),
        options: {
            width: 450,
            height: 500,
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
            width:450,
            height:400,
            backgroundColor: 'transparent',
            hAxis: {title: 'Programa'},
            seriesType: 'bars',
            isStacked: true
        },
        containerId: containerId
    });
    wrapper.draw();
    return;
}

/* CAROUSEL */

$(document).ready(function() {
    $('#carousel').carousel({
        slideSpeed: 700,
    });
});

(function($) {

    $.fn.carousel = function(options) {

        // prepare container
        var $carouselContainer = $(this);
        var $carouselController = $(this).find('nav');
        var carouselID = $carouselContainer.attr('id');
        var slideSpeed = options.slideSpeed;
        var slideCount = $carouselContainer.find('.carousel-content > li').length;

        $carouselContainer.find('.carousel-content').each(function() {
            var slideWidth = $(this).find('> li').width();
            var carouselContainerWidth = slideWidth * slideCount;
            $(this).width(carouselContainerWidth);
        });

        $carouselController.find('a').click(function() {
            goToSlide($(this).parent().data('slide'));
            if(options.autoRotate)
                $.doTimeout(carouselID, slideTimer, function() { nextSlide(); return true; });
            return false;
        });

        if(options.autoRotate) $.doTimeout(carouselID, slideTimer, function() { nextSlide(); return true; });

        function goToSlide(slideRef) {
            $carouselController.find('li').removeClass('active');
            $carouselController.find("[data-slide='" + slideRef + "']").addClass('active');

            var $slideToGo = $('.carousel-content').find("[data-slide='" + slideRef + "']");
            var slidePosition = $slideToGo.position();
            var slideLeftOffset = slidePosition.left;

            $carouselContainer.find('.carousel-content').stop().animate({
                left: -slideLeftOffset
            }, slideSpeed);
        }

        $carouselContainer.find('.next').click(function() {
            nextSlide();
            return false;
        });

        $carouselContainer.find('.prev').click(function() {
            prevSlide();
            return false;
        });

        function nextSlide() {
            var currentSlideID = $carouselController.find('li.active').data('slide');
            var $nextSlide = $carouselContainer.find("[data-slide='" + currentSlideID + "']").next();

            if($nextSlide.length)
                var nextSlideID = $nextSlide.data('slide');
            else
                var nextSlideID = $carouselContainer.find('li:nth-child(1)').data('slide');

            goToSlide(nextSlideID);
        }

        function prevSlide() {
            var currentSlideID = $carouselController.find('li.active').data('slide');
            var $nextSlide = $carouselContainer.find("[data-slide='" + currentSlideID + "']").prev();

            if($nextSlide.length)
                var nextSlideID = $nextSlide.data('slide');
            else
                var nextSlideID = $carouselContainer.find('li:last-child').data('slide');

            goToSlide(nextSlideID);            
        }

    };

})(jQuery);

