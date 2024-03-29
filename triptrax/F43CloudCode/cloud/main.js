
// GET LAST LOGGED TRIP
Parse.Cloud.define("lastTripEndodometer", function( request, response ) {
  var user = new Parse.User();
  user.id = request.params.userid;
  var query = new Parse.Query("Trip");
  query.include('user');
  query.equalTo("user", user);
  query.descending("createdAt");
  query.limit(1);
  query.find({
    success: function(results) {
      response.success( results[0].get("endOdometer") );
    },
    error: function() {
      response.error("trip lookup failed" + _date);
    }
  });
});

// GET TOTAL MILEAGE FOR USER
Parse.Cloud.define("totalMileage", function( request, response ) {
  var user = new Parse.User();
  user.id = request.params.userid;
  var query = new Parse.Query("Trip");
  query.include('user');
  query.equalTo("user", user);
  var _date = new Date ("January 1, " + request.params.year);
  query.greaterThanOrEqualTo("date", _date);
  query.find({
    success: function(results) {
      var sum = 0;
      for ( var i = 0; i < results.length; ++i ) {
        sum += results[i].get("endOdometer") - results[i].get("startOdometer");
      }
      response.success( sum );
    },
    error: function() {
      response.error("trip lookup failed" + _date);
    }
  });
});

// EXPORT DATA BASED ON DATE RANGE
Parse.Cloud.define('exportDataByDateRange', function ( request, response ) {

    var userQuery = new Parse.Query(Parse.User);
    userQuery.get(request.params.userid, {
        success: function( user ) {

            var query = new Parse.Query("Trip");
            query.include('user');
            query.equalTo("user", user);
            var lengthUnit = user.get('lengthUnit');
            var divisor = (lengthUnit == "miles") ? 1609.344 : 1000;
            var _startDate = new Date (request.params.start),
                _endDate = new Date (request.params.end);
            query.greaterThanOrEqualTo("date", _startDate);
            query.lessThanOrEqualTo("date", _endDate);

            query.find({
                success: function(results) {
                    if ( results.length < 1 ) {
                        response.success( { status: "error", message: "There are no trips stored for that time period." } );
                        return;
                    }

                    var _headerNames = ["Title", "Date", "Start", "End", "Trip Total (" + lengthUnit + ")", "Method"];
                    var _colDelim = '","',
                        _rowDelim = '"\r\n';
                    var csv = "\"";
                    csv +=  _headerNames.join(_colDelim);
                    csv += _rowDelim;

                    for ( var i = 0; i < results.length; ++i ) {
                        var _title = ( results[i].get("title") != "" ) ? results[i].get("title").replace('"', '""') : "< no description >";
                        csv += '"' + _title + _colDelim;
                        var _date = results[i].get("date");
                        csv += (_date.getMonth() + 1) + "/" + _date.getDate() + "/" + _date.getFullYear() + _colDelim;
                        csv += results[i].get("distance" && results[i].get("distance") >= 0) ? "" + _colDelim : results[i].get("startOdometer") + _colDelim;
                        csv += results[i].get("distance" && results[i].get("distance") >= 0) ? "" + _colDelim : results[i].get("endOdometer") + _colDelim;

                        if ( results[i].get("distance") && results[i].get("distance") >= 0 ) {
                            csv += (results[i].get("distance")/divisor).toFixed(2) + _colDelim;
                        } else {
                            csv += results[i].get("endOdometer") - results[i].get("startOdometer") + _colDelim;
                        }

                        if ( results[i].get("distance") && results[i].get("distance") >= 0 ) {
                            csv += "GPS";
                        } else {
                            csv += "Manual";
                        }

                        csv += _rowDelim;
                    }
                    response.success( { status: "success", data: csv } );
                },
                error: function() {
                    response.success( { status: "error", data:"Trip lookup failed. Try again..."} );
                }
            });
        },

        error: function(object, error) {
            response.success( { status: "error", data:"User lookup failed. Try again..."} );
        }
    });

});
