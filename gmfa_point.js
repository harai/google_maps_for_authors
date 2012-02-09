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

        var _this = this;

        var mkEl = function (e) {
            return $(document.createElement(e));
        };

        var mkText = function (e) {
            return document.createTextNode(e);
        };

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

        var isPointOnMap = function (point, container) {
            return 0 <= point.x && 0 <= point.y &&
                point.x < container.innerWidth() && point.y < container.innerHeight();
        };

        // map.getBounds().contains(location)
        // does not work well when the container has border.
        var isLocationShown = function (location, container) {
            var p = overlay.getProjection().fromLatLngToContainerPixel(location);
            return isPointOnMap(p, container);
        };

        var currentMarker = (function () {
            var marker = null;
            return {
                update: function (newMarker) {
                    if (marker !== null) {
                        marker.setMap(null);
                    }
                    marker = newMarker;
                },
                get: function () {
                    return marker;
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
            latInput.attr("value", location === null ? "" : location.lat());
            lngInput.attr("value", location === null ? "" : location.lng());
        };

        var deferred = function () {
            var nextFn = null;
            var nextDf = null;

            return {
                fire: function () {
                    if (nextFn !== null) {
                        var res = nextFn.apply(this, arguments);
                        nextDf.fire(res);
                    }
                },
                next: function (fn) {
                    nextFn = fn;
                    nextDf = deferred();
                    return nextDf;
                },
            };
        };

        var geocodeAddressLookup = function (location) {
            var df = deferred();
            geocoder.geocode({ 'latLng': location }, function (results, status) {
                df.fire(results, status);
            });
            return df;
        };

        var doAsync = function (fn) {
            var df = deferred();
            setTimeout(function () {
                df.fire(fn());
            }, 0);
            return df;
        };

        var placeMarker = function (location) {
            var marker = new google.maps.Marker($.extend({}, markerOp, {
                position: location,
                map: map,
            }));

            currentMarker.update(marker);

            
            var df = doAsync(function () {});
            if (op.addressInput !== null) {
                df = geocodeAddressLookup(location).next(function (results, status) {
                    var createNode = function (address) {
                        var a = mkEl("a").attr("href", "#").click(function (e) {
                            e.preventDefault();
                            op.addressInput.attr("value", address);
                        }).append(mkText("Also copy this address"));
                        return mkEl("div").addClass("address").append(mkText(address), mkEl("br"), a).get(0);
                    };
                    
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (results[1]) {
                            return createNode(results[1].formatted_address);
                        }
                        return mkText("No address here");
                    }
                    return mkText("Geocoder failed due to: " + status);
                });
            }

            df.next(function (option) {
                var createInfo = function () {
                    var loc = mkEl("div").addClass("location").append(
                        mkText("Latitude: " + location.lat().toFixed(5) + "..."),
                        mkEl("br"),
                        mkText("Longitude: " + location.lng().toFixed(5) + "..."));
    
    
                    var c = mkEl("div").addClass("infowindow").append(loc);
                    if (option) {
                        c.append(option);
                    }
                    return c.get(0);
                };

                var info = new google.maps.InfoWindow({
                    content: createInfo(),
                });
                info.open(map, marker);
            });

        };

        (function () {
            var lat = latInput.attr("value");
            var lng = lngInput.attr("value");
            if (lat !== null && lng !== null && lat !== "" && lng !== "") {
                placeMarker(new google.maps.LatLng(parseFloat(lat), parseFloat(lng)));
            }
        })();

        var focusOnMarkerLink = (function () {
            var a = mkEl("a").attr({
                href: "#",
                style: "text-decoration: none",
            }).click(function () {
                map.setCenter(currentMarker.get().getPosition());
            }).append(mkText("Focus on the marker"));
            var div = mkEl("div").attr({
                style: "position: absolute; top: 5px; left: 40px; z-index: 10; font-weight: bold; background: snow",
            }).addClass("showmarker").append(a);

            _this.append(div);

            return {
                show: function () {
                    div.show();
                },
                hide: function () {
                    div.hide();
                },
            };
        })();

        google.maps.event.addListener(map, 'bounds_changed', function () {
            var m = currentMarker.get();
            if (m !== null) {
                var loc = m.getPosition();
                if (isLocationShown(loc, _this)) {
                    focusOnMarkerLink.hide();
                } else {
                    focusOnMarkerLink.show();
                }
            }
        });

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
                if (isPointOnMap(p, _this)) {
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
