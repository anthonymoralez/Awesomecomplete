/* Simple usage
 *   - a text input with class address: <input type="text" class="address" />
 *
 * to have it place a GMarker on a GMap and update the maps extent as the user 
 * inputs an address you need to define a GMap in the variable 'map' like so:
 *
 * if (GBrowserIsCompatible()) {
 *   map = new GMap2(jQuery('#map_id').get(0));
 * }
 *
 * to use GMap you must include the gmaps api with an API key like so: 
 * <script src="http://maps.google.com/maps?file=api&amp;v=2.x&amp;key=#YOUR KEY HERE#" type="text/javascript"></script>
 *
 *
 */
function createDraggableMarkerAt(latlng) {
  var the_marker;
    the_marker = new GMarker(latlng, { draggable: true });
    the_marker.enableDragging();
    GEvent.addListener(the_marker,"dragend", function(latlng) {
      var geoCoder = new GClientGeocoder();
      geoCoder.getLocations(latlng, function(response) {
        if (!response || response.Status.code != 200) {
          the_marker.hide();
          the_marker.openInfoWindowHtml("Sorry, we couldn't place the pin exactly there");
        } else {
          place = response.Placemark[0];
          jQuery('.address').val(place.address);
        }
      });
    }); 
  return the_marker;
}

function dropMoveablePin(map, lat, lng) {
  var marker = createDraggableMarkerAt(new GLatLng(lat, lng));
  map.addOverlay(marker);
  return marker;
}

function dropPin(map, lat, lng, options) {
  var point = new GLatLng(lat, lng);
  var markerOpts = {};
  if (options && options.titleText && options.markerIcon) {
    markerOpts = {title: options.titleText, icon: options.markerIcon};
  }
  var marker = new GMarker(point, markerOpts);
  if (options) {
   if (options.link && options.titleText) {
    var infoWindowMarkup = "<a href='"+options.link+"'>"+options.titleText+"</a>";
   }
   if (options.address) {
     infoWindowMarkup = infoWindowMarkup + "<address>"+options.address+"</address>";
   }
    marker.bindInfoWindowHtml(infoWindowMarkup);
  }
  return marker;
}


function centerMapOnMarker(map, marker) {
  try {
    if(map.getCenter() != marker.getLatLng()) {
      map.setCenter(marker.getLatLng(), 15);
    }
    map.savePosition();
  } catch(err) {
  }
}



var renderDataItem = function(dataItem) {
  if (dataItem === undefined) {
    return '';
  } else {
    return '<p class="completion_option">' + dataItem[this.nameField] + '</p>';
  }
};

var updateMap = function(dataItem) {
  if (dataItem && typeof(map) !== 'undefined') {
    marker = dropMoveablePin(map, dataItem.Point.coordinates[1], dataItem.Point.coordinates[0]);
    centerMapOnMarker(map, marker);
  }
};

jQuery.fn.awesomecompleteAddress = function(options) {
  var options = $.extend({}, $.fn.awesomecompleteAddress.defaults, options);
  this.awesomecomplete({ 
    nameField: 'address',
    typingDelay: 600,
    renderFunction: renderDataItem,
    dataMethod: function(term, $awesomecomplete) {
      var geocoder = new GClientGeocoder(); 
      geocoder.getLocations(term, function(response) {
        if (response.Placemark) {
	 if (options.international) {
	   possible_completions = response.Placemark;
	 } else {
           possible_completions = jQuery.map(response.Placemark, function(place) {
             if (place.AddressDetails.Country) {
               if (place.AddressDetails.Country.CountryNameCode != 'US') {
                 return undefined;
               }
             } else {
               return undefined;
             }
             return place;
           });
	 }  

        updateMap(possible_completions[0])
        $awesomecomplete.onData(possible_completions);

        }
      });
    }
  });
  return this;
};

jQuery.fn.awesomecompleteAddress.defaults = { international: true }

jQuery(document).ready(function () {
  jQuery('.address').awesomecompleteAddress();
});
