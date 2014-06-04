
// Use Parse.Cloud.define to define as many cloud functions as you want.
// For example:
Parse.Cloud.define("hello", function(request, response) {
  response.success("Hello world!");
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
    var user = new Parse.User();
    user.id = request.params.userid;
    var query = new Parse.Query("Trip");
    query.include('user');
    query.equalTo("user", user);

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
            var _headerNames = ["Title", "Date", "Start", "End", "Trip Total"];
            var _colDelim = '","',
                _rowDelim = '"\r\n"';
            var csv = "\"";
            csv +=  _headerNames.join(_colDelim);
            csv += _rowDelim;

            for ( var i = 0; i < results.length; ++i ) {
                csv += results[i].get("title").replace('"', '""') + _colDelim;
                var _date = results[i].get("date");
                csv += (_date.getMonth() + 1) + "/" + _date.getDate() + "/" + _date.getFullYear() + _colDelim;
                csv += results[i].get("startOdometer") + _colDelim;
                csv += results[i].get("endOdometer") + _colDelim;
                csv += results[i].get("endOdometer") - results[i].get("startOdometer");
                csv += _rowDelim;
            }

            response.success( { status: "success", data: csv } );
        },
        error: function() {
            response.success( { status: "error", data:"Trip lookup failed. Try again..."} );
        }
    });
});
