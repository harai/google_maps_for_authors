(function ($) {
    $.fn.insertGMFAPoint = function (latInput, lngInput, markerContainer, options) {
        var op = $.extend({
            addressInput: null,
            icon: "http://maps.google.co.jp/mapfiles/ms/icons/blue-dot.png",
            iconSize: {
                width: 32,
                height: 32,
            },
            iconPoint: {
                bottom: 0,
                left: 16,
            },
        }, options);

        // null/undefined is legal
        var mapOp = $.extend({}, $.fn.insertGMFAPoint.mapOptions, op.map);
        var markerOp = $.extend({
            icon: op.icon,
        }, $.fn.insertGMFAPoint.markerOptions, op.marker);

        var iconImg = (function () {
            var img = $(document.createElement("img")).attr({
                src: op.icon,
                alt: "pointer",
                style: "width: " + op.iconSize.width + "px; height: " + op.iconSize.height + "px; z-index: 1000000000;",
            });
            markerContainer.append(img);

            return img;
        })();

        var map = new google.maps.Map(this.get(0), mapOp);
        var overlay = new google.maps.OverlayView();
        overlay.draw = function () {};
        overlay.setMap(map);

        var currentMarker = (function () {
            var marker = null;
            return {
                update: function (newMarker) {
                    if (marker !== null) {
                        marker.setMap(null);
                    }
                    marker = newMarker;
                },
            };
        })();

        var placeMarker = function (location) {
            currentMarker.update(new google.maps.Marker($.extend({}, markerOp, {
                position: location,
                map: map,
            })));
            latInput.attr("value", location.lat());
            lngInput.attr("value", location.lng());
        };

        var _this = this;
        iconImg.draggable({
            helper: 'clone',
            cursorAt: op.iconPoint,
            start: function () {
                iconImg.hide();
            },
            stop: function (ev) {
                iconImg.show("scale");

                var o = _this.offset();
                var bl = parseInt(_this.css("border-left-width"), 10);
                var bt = parseInt(_this.css("border-top-width"), 10);
                var p = new google.maps.Point(ev.pageX - o.left - bl, ev.pageY - o.top - bt);
                // nothing should happen if dropped outside the map
                if (0 <= p.x && 0 <= p.y && p.x < _this.innerWidth() && p.y < _this.innerHeight()) {
                    placeMarker(overlay.getProjection().fromContainerPixelToLatLng(p));
                }
            }
        });

        return this;
    };
    
    $.fn.insertGMFAPoint.mapOptions = {
        zoom: 10,
        center: new google.maps.LatLng(35.681382, 139.766084),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
    };
    
    $.fn.insertGMFAPoint.markerOptions = {
        animation: google.maps.Animation.DROP,
    };
})(jQuery);
