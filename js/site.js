var url = 'http://a.tiles.mapbox.com/v3/miguelpeixe.eduamazonia_world,miguelpeixe.eduamazonia_estados_total,miguelpeixe.eduamazonia_cidades_total.jsonp';

wax.tilejson(url, function(tilejson) {

    var layer = new wax.mm.connector(tilejson);
    var m = new MM.Map('map', new wax.mm.connector(tilejson), null, [
        easey.DragHandler(),
        easey.TouchHandler(),
        easey.MouseWheelHandler(),
        easey.DoubleClickHandler()
    ]);
    m.setCenterZoom(new MM.Location(tilejson.center[1],
        tilejson.center[0]),
        5);

    wax.mm.zoomer(m).appendTo(m.parent);
    wax.mm.interaction()
        .map(m)
        .tilejson(tilejson)
        .on(wax.tooltip().animate(true).parent(m.parent).events());
    //wax.mm.legend(m, tilejson).appendTo(m.parent);

    var minZoom = 4;
    var maxZoom = 8;
    var topLeft = new MM.Location(tilejson.bounds[3], tilejson.bounds[0]);
    var bottomRight = new MM.Location(tilejson.bounds[1], tilejson.bounds[2]);

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

    /* layer.sourceCoordinate = function(coord) {
        var TL = this.tileLimits[0].zoomTo(coord.zoom).container();
        var BR = this.tileLimits[1].zoomTo(coord.zoom).container().right().down();
        if (coord.row < TL.row || coord.row >= BR.row || coord.column < TL.column || coord.column >= BR.column) {
            return null;
        }
        return coord;
    }; */

    //document.getElementById('title').innerHTML = tilejson.name;
    //document.getElementById('description').innerHTML = tilejson.description;
    //document.getElementById('attribution').innerHTML = tilejson.attribution;


    /* ----- scrolling function ---------

    var ea = easey().map(m).easing('easeInOut');

    scrolly = document.getElementById('teste');

    function update() {
        var pos = scrolly.scrollTop / 200;

        ea.from(positions[Math.floor(pos)])
        .to(positions[Math.ceil(pos)])
        .t(pos - Math.floor(pos));
    }

    scrolly.addEventListener('scroll', update, false);
    */

});