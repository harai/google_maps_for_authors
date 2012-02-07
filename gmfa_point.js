(function ($) {
    $.fn.insertGMFAPoint = function (latInput, lngInput, markerContainer, options) {
        var op = $.extend({
            addressInput: null,
            showButton: null,
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

        var geocoder = new google.maps.Geocoder();

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

        if (op.addressInput !== null && op.showButton !== null) {
            op.showButton.click(function (e) {
                e.preventDefault();
                var ad = op.addressInput.attr("value");

                geocoder.geocode({ 'address': ad }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        map.setCenter(results[0].geometry.location);
                        map.setZoom(17);
                    } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
                        alert("No results");
                    } else {
                        alert("Geocode was not successful for the following reason: " + status);
                    }
                });
            })
        }

        var updateFields = function (location) {
            latInput.attr("value", location.lat());
            lngInput.attr("value", location.lng());
        };

        var placeMarker = function (location) {
            var marker = new google.maps.Marker($.extend({}, markerOp, {
                position: location,
                map: map,
            }));
            
            currentMarker.update(marker);
            
            if (op.addressInput !== null) {
                geocoder.geocode({ 'latLng': location }, function (results, status) {
                    var createInfo = function (address) {
                        var a = $(document.createElement("a")).attr("href", "#").click(function (e) {
                            e.preventDefault();
                            op.addressInput.attr("value", address);
                        }).append(document.createTextNode("Use this address"));

                        return $(document.createElement("div")).append(
                            document.createTextNode(address),
                            document.createElement("br"),
                            a).get(0);
                    };
                    
                    var msg = (function () {
                        if (status == google.maps.GeocoderStatus.OK) {
                            if (results[1]) {
                                return createInfo(results[1].formatted_address);
                            }
                            return "No address here";
                        } else {
                            return "Geocoder failed due to: " + status;
                        }
                    })();
                    var info = new google.maps.InfoWindow({
                        content: msg,
                    });
                    info.open(map, marker);
                });
            }
        };

        (function () {
            var lat = latInput.attr("value");
            var lng = lngInput.attr("value");
            if (lat !== null && lng !== null && lat !== "" && lng !== "") {
                placeMarker(new google.maps.LatLng(parseFloat(lat), parseFloat(lng)));
            }
        })();

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
                    var loc = overlay.getProjection().fromContainerPixelToLatLng(p);
                    updateFields(loc)
                    placeMarker(loc);
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
