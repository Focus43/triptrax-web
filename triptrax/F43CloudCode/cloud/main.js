
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
        sum +=  results[i].get("endOdometer") - results[i].get("startOdometer") ;
      }
      response.success( sum );
    },
    error: function() {
      response.error("trip lookup failed" + _date);
    }
  });
});
