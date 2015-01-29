/**
 * Created with RubyMine.
 * By: superrunt
 * Date: 5/14/14
 * Time: 3:22 PM
 */
var tableToExcel = (function() {
  var uri = 'data:application/vnd.ms-excel;base64,'
    , template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
    , base64 = function(s) { return window.btoa(unescape(encodeURIComponent(s))) }
    , format = function(s, c) { return s.replace(/{(\w+)}/g, function(m, p) { return c[p]; }) };
  return function(table, name) {
    if (!table.nodeType) table = document.getElementById(table);
    var ctx = {worksheet: name || 'Worksheet', table: table.innerHTML};
    window.location.href = uri + base64(format(template, ctx));
};
})();

$(function() {

    Parse.initialize("Vd1Qs3EyW8r7JebCa7n9X6WXjvMxa711HJfKvWqJ", "q8fq25b1iNZyzyRqdIZHpXQKY5R4mTWU1QLeA374");

    // Trip Object
    // -----------------
    var Trip = Parse.Object.extend("Trip", {
        // Default attributes
        defaults: {
            title: "New Trip",
            date: new Date(),
            startOdometer: 0,
            endOdometer: 0,
            distance: -1,
            type: "Business"
        },

        // Ensure that each trip created has date and title.
        initialize: function() {
            if (!this.get("title")) {
                this.set(this.defaults.title);
            }
            if (!this.get("date")) {
                this.set(this.defaults.date);
            }
        }
    });

    // Trips Collection
    // ---------------
    var TripsList = Parse.Collection.extend({

        // Reference to this collection's model.
        model: Trip,

        // Trips are sorted by date
        comparator: function(trip) {
            return -trip.get('date');
        },

        initialize: function() {
            this.on('change:date', function() { this.sort() }, this);
            this.on('destroy', function() { this.sort() }, this);
            this.on('add', function() { this.sort() }, this);
        }
    });

    // View Objects
    // -----------------
    var LogInView = Parse.View.extend({
        events: {
            "click .btn.login":          "logIn",
            "click .btn.signup":         "signUp",
            "click a.forgot-password":   "showLostPasswordForm",
            "click .btn.retrieve":       "retrievePassword"
        },

        el: ".container",

        initialize: function() {
            _.bindAll(this, "logIn", "signUp", 'render');
            this.render();
        },

        logIn: function(e) {
            e.preventDefault();
            var self = this;
            var username = this.$("#login-username").val();
            var password = this.$("#login-password").val();

            Parse.User.logIn(username, password, {
                success: function(user) {
                    new ManageTripsView();
                    self.undelegateEvents();
                    self = null;
                },

                error: function(user, error) {
                    self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
                    self.$(".login-form button").removeAttr("disabled");
                }
            });
        },

        signUp: function(e) {
            e.preventDefault();
            var self = this;
            var username = this.$("#signup-username").val();
            var password = this.$("#signup-password").val();

            Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
                success: function(user) {
                    new ManageTripsView();
                    self.undelegateEvents();
                    self = null;
                },

                error: function(user, error) {
                    self.$(".signup-form .error").html(error.message).show();
                    self.$(".signup-form button").removeAttr("disabled");
                }
            });

            this.$(".signup-form button").attr("disabled", "disabled");

            return false;
        },

        showLostPasswordForm: function() {
            $("input#user-email").show();
            $(".btn.retrieve").show();
        },

        retrievePassword: function() {
            $(".lostpwd-form .alert").hide();
            Parse.User.requestPasswordReset( $("input#user-email").val(), {
                success: function(data) {
                    // Password reset request was sent successfully
                    var _message = "An email with instructions have been sent to " + $("input#user-email").val();
                    $(".lostpwd-form .alert-success").html(_message).show();
                },
                error: function(error) {
                    // Show the error message
                    $(".lostpwd-form .alert-danger").html(error.message).show();
                }
            });
        },

        render: function() {
            this.$el.html(_.template($("#login-template").html()));
            this.delegateEvents();
        }
    });

    var TripView = Parse.View.extend({

        tagName:  "tr",
        // Cache the template function for a single item.
        template: _.template($('#trip-template').html()),

        events: {
            "click .edit-me"    : "edit",
            "click .delete-me"  : "delete",
            "click .save"       : "save",
            "click .cancel"     : "cancel",
            "keypress .editing" : "updateOnEnter"
        },

        initialize: function() {
            _.bindAll(this, 'render', 'cancel', 'delete', 'save', 'edit', 'updateOnEnter');
            this.model.bind('save', this.render);
            this.model.bind('delete', this.remove);
            this.modal = new Modal();
        },

        // Re-render the contents of the trip item.
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            $(this.el).attr("id", this.model.cid);
            return this;
        },

        // Switch this view into editing
        edit: function() {
            $(this.el).addClass("editing");
        },

        // Close the editing mode, saving changes to the trip.
        save: function() {
            var elm =  $(this.el);
            // reset potential messages etc
            $(this.el).removeClass("saveme");
            $("div.alert-warning.savefirst").addClass("hidden");

            $(this.el).find(".fa-check-circle").addClass("fa-spin");
            $(this.el).find(".fa-check-circle").addClass("fa-spinner");
            $(this.el).find(".fa-check-circle").removeClass("fa-check-circle");

            var data = $(this.el).find("form").serializeObject();
            data.date = new Date(data.date);
            data.startOdometer = parseInt(data.startOdometer);
            data.endOdometer = parseInt(data.endOdometer);
            data.user = Parse.User.current();
            this.model.setACL(new Parse.ACL(Parse.User.current()));
            $("#mileage-total").html('<i class="fa fa-spinner fa-spin"></i>');
            this.model.save(data, {
                success: function(trip) {
                    $("tbody#trips-list tr").first().removeClass("editing");
                    elm.find(".fa-spinner").addClass("fa-check-circle");
                    elm.find(".fa-spinner").removeClass("fa-spin");
                    elm.find(".fa-spinner").removeClass("fa-spinner");
                    // Update total mileage
                    Parse.Cloud.run('totalMileage', { userid: data.user.id, year: new Date().getFullYear() }, {
                      success: function (result) {
                        $("#mileage-total").html(result + " miles");
                      },
                      error: function (error) {
                        // console.log(error);
                      }
                    });
                },
                error: function(trip, error) {
                    // Execute any logic that should take place if the save fails.
                    // error is a Parse.Error with an error code and description.
                    alert('Failed to create new object, with error code: ' + error.description);
                }
            });

        },

        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function(e) {
            if (e.keyCode === 13) this.save();
        },

        // Remove the item, destroy the model.
        delete: function() {
            this.modal.toggleModal( $("#usure"));
            var self = this;

            $("#usure .btn.yes").one('click', function () {
                self.modal.toggleModal();
                $(self.el).addClass('waiting');
                self.model.destroy({
                  wait: true,
                  success: function ( data ) {
                      $("#mileage-total").html('<i class="fa fa-spinner fa-spin"></i>');
                      Parse.Cloud.run('totalMileage', { userid: data.attributes.user.id, year: new Date().getFullYear() }, {
                        success: function (result) {
                            $("#mileage-total").html(result + " miles");
                        },
                        error: function (error) {
                            console.log(error);
                        }
                      });
                  },
                  error: function ( error ) {
                      console.log( error );
                      self.model.elm.removeClass('waiting');
                      self.model.elm.addClass('danger');
                      self = null;
                  }
                });
            });

            $("#usure .btn.cancel").one('click', this.modal.toggleModal);
        },

        // Close the editing mode without changes to the trip.
        cancel: function() {
            $(this.el).removeClass("editing");
            $('#new-trip').html("");
            $('#new-table').hide();
        }
    });

    var ManageTripsView = Parse.View.extend({

        queryCount: 0,
        queryLimit: 20,
        querySkip: 0,
        pages: 1,
        currentPage: 1,

        events: {
            "click .new": "newTrip",
            "click .log-out": "logOut",
            "click a.pagination": "goToPage",
            "click button.export": "openExportDialog"
        },

        el: $(".container"),

        initialize: function() {
            var self = this;

            _.bindAll(this, 'addOne', 'addAll', 'render', 'logOut', 'goToPage');

            // Main trip management template
            this.template = _.template($("#manage-trips-template").html());
            this.$el.html(this.template);

            // Modal setup
            this.modal = new Modal();

            // Create our collection of Todos
            this.trips = new TripsList();

            // Setup the query for the collection
            this.trips.query = new Parse.Query(Trip);
            this.trips.query.equalTo("user", Parse.User.current());
            this.trips.query.descending("date");

            this.trips.query.count({
                success: function(count) {
                    self.queryCount = count;
                    self.paginationAndFetch();
                },
                error: function(error) {
                    // if there's an error, it's likely because Parse times out when over 1000...
                    self.queryCount = 1000;
                    self.paginationAndFetch();
                }
            });

            this.trips.bind('add',     this.addOne);
            this.trips.bind('reset',   this.addAll);
            this.trips.bind('all',     this.render);

            // set the header user info
            $("ul.nav.navbar-right").html('<li><div class="user pull-left">Hi, ' + Parse.User.current().get("username") + '</div><a href="#" class="log-out pull-right">(Log out)</a></li>');

            state.on("change", this.filter, this);

            $(".log-out").on('click', function () {
                Parse.User.logOut();
                App.render();
                // change the header user info
                $("ul.nav.navbar-right").html('<li><a href="/" class="log-in">Log In</a></li>');
            });
        },

        render: function() {
            this.modal.init($('button.overlay-close'));
            var _currentYear = new Date().getFullYear();
            Parse.Cloud.run('totalMileage', { userid: Parse.User.current().id, year: _currentYear }, {
              success: function (result) { $("#mileage-total").html(result + " miles"); }});
        },

        paginationAndFetch: function () {
            this.trips.query.skip(this.querySkip);
            this.trips.query.limit(this.queryLimit);

            this.pages = Math.ceil(this.queryCount / this.queryLimit);
            this.currentPage = (this.queryLimit - this.querySkip) / this.queryLimit;
            // pagination template
            this.paginationTemplate = _.template($("#pagination-template").html());
            this.$el.find("ul.pagination").html(this.paginationTemplate({ currentPage: this.currentPage, range: _.range( 1, this.pages + 1 ) }));

            $("a.paginate").on('click', this.goToPage);
            // Fetch all the trips for this user
            this.trips.fetch();
        },

        newTrip: function( e ) {
            var _openTrip = {},
                _t = null;
            if ( this.trips.some( function (trip) {
                if ( trip.isNew() ) {
                    _openTrip = trip;
                    return true;
                }
            }) ) {
                var _elm = $(this.el).find("tr#" + _openTrip.cid);
                _elm.addClass("saveme");
                $("div.alert-warning.savefirst").removeClass("hidden");
                var _reset = function () {
                    _elm.removeClass("saveme");
                    _elm = null;
                };
                _t = setTimeout(_reset, 2000);
            } else {
                var trip = new Trip();
                this.trips.add(trip);
            }
        },

        addOne: function(trip) {
            var view = new TripView({model: trip});
            // render trip if not already fired by other event  TODO: this is heavy, must update
            if ( $("#trips-list tr#" + trip.cid).length === 0 ) {
                $("#trips-list").append(view.render().el);
                if ( trip.isNew() ) {
                    $(view.$el).addClass("editing");
                }
            }
        },

        addAll: function(collection, filter) {
            $("#trips-list").html("");
            $('#progress-bar').remove();
            this.template.pages = this.pages;
            this.template.currentPage = this.currentPage;
            this.trips.forEach(this.addOne);
        },

        logOut: function(e) {
            Parse.User.logOut();
            new LogInView();
            this.undelegateEvents();
        },

        goToPage: function (e) {
            e.preventDefault();
            var pageNum = e.target.text;
            this.querySkip = (pageNum - 1) * this.queryLimit;
            this.currentPage = pageNum;
            this.paginationAndFetch();
        },

        export: function ( start, end, downloadElm ) {

            var startDate, endDate, filename, _linkText, self;
            // get dates
            if ( start && end ) {
                startDate = start.toDate();
                endDate = end.toDate();
                filename = "custom_" + start.toISOString() + "--" + end.toISOString();
            } else {
                var _today = new Date();
                var _range = $(this).attr('data-range');
                var _curYear = _today.getFullYear();
                var _lastYear = _curYear - 1;

                switch ( _range ) {
                    case "lastyear":
                        startDate = new Date( _lastYear + "-01-01 00:00:00");
                        endDate = new Date( _lastYear + "-12-31 23:59:59");
                        filename = "mileage_" + _lastYear;
                        break;
                    case "1q":
                        startDate = new Date( _curYear + "-01-01 00:00:00");
                        endDate = new Date( _curYear + "-03-31 23:59:59");
                        filename = "mileage_q1_" + _curYear;
                        break;
                    case "2q":
                        startDate = new Date( _curYear + "-04-01 00:00:00");
                        endDate = new Date( _curYear + "-06-30 23:59:59");
                        filename = "mileage_q2_" + _curYear;
                        break;
                    case "3q":
                        startDate = new Date( _curYear + "-07-01 00:00:00");
                        endDate = new Date( _curYear + "-09-31 23:59:59");
                        filename = "mileage_q3_" + _curYear;
                        break;
                    case "4q":
                        startDate = new Date( _curYear + "-10-01 00:00:00");
                        endDate = new Date( _curYear + "-12-31 23:59:59");
                        filename = "mileage_q4_" + _curYear;
                        break;
                }
            }

            // update UI
            if ( downloadElm ) {
                _linkText = $(downloadElm).html();
                $(downloadElm).html('<i class="fa fa-spinner fa-spin"></i>');
                self = $(downloadElm);
            } else {
                _linkText = $(this).html();
                $(this).html('<i class="fa fa-spinner fa-spin"></i>');
                self = this;
            }

            var csvData = "";
            Parse.Cloud.run("exportDataByDateRange", { userid: Parse.User.current().id, start: startDate, end: endDate }, {
                success: function (result) {
                    if (result.status === "error") {
                      var _alert = $(self).siblings("div.alert-danger");
                      _alert.text(result.message).removeClass("fadedout");
                      $(self).html(_linkText);
                      setTimeout(function() { _alert.addClass("fadedout"); }, 4000);
                      return;
                    }
                    csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(result.data);
                    $(self).attr({
                        'download': filename + ".csv",
                        'href': csvData
                    });

                    $(self).removeClass("btn-info");
                    $(self).addClass("btn-success");
                    $(self).text("Download File");

                    $(self).one('click', function () {
                        $(this).removeClass("btn-success").addClass('btn-info');
                        if ( $(this).hasClass("daterange") ) {
                            setTimeout( function() {
                                $(self).removeAttr("href");
                                $(self).removeAttr("download");
                            }, 1000);
                            $(this).html(_linkText);
                        } else {
                            $(this).html(_linkText + ' <small>(Download)</small>');
                        }
                    });
              },
              error: function (error) {
                console.log(error);
              }
            });
        },

        openExportDialog: function () {
            var _exportDiv = $("div#export");
            this.modal.toggleModal(_exportDiv);

            _exportDiv.find("a.btn-info.preset").one('click', this.export);

            _exportDiv.find("a.btn-info.daterange").on('click', function () {
                var _dateChooser = _exportDiv.find("a.btn.daterangechooser");
                if ( _dateChooser.hasClass('hidden') ) {
                    _dateChooser.removeClass('hidden');
                } else {
                    _dateChooser.addClass('hidden');
                }
            });
            var self = this;
            this.setUpDatePicker( self );

            _exportDiv.find("button.cancel").one('click', this.modal.toggleModal);
        },

        setUpDatePicker: function ( context ) {
            var _exportDiv = $("div#export");
            _exportDiv.find("a.btn.daterangechooser").daterangepicker(
                {
                  ranges: {
                     'Today': [moment(), moment()],
                     'Yesterday': [moment().subtract('days', 1), moment().subtract('days', 1)],
                     'Last 7 Days': [moment().subtract('days', 6), moment()],
                     'Last 30 Days': [moment().subtract('days', 29), moment()],
                     'This Month': [moment().startOf('month'), moment().endOf('month')],
                     'Last Month': [moment().subtract('month', 1).startOf('month'), moment().subtract('month', 1).endOf('month')]
                  },
                  startDate: moment().subtract('days', 29),
                  endDate: moment()
                },
                function(start, end) {
                    _exportDiv.find("a.btn.daterangechooser span").html(start.format('MM/DD/YYYY') + ' - ' + end.format('MM/DD/YYYY'));
                    context.export(start, end, '#export a.btn-info.daterange');
                }
            );
        }
    });

    // The Application
    // ---------------

    var AppState = Parse.Object.extend("AppState", {
        defaults: {
            filter: "all"
        }
    });

    var AppView = Parse.View.extend({

        el: $("#triptraxapp"),

        initialize: function() {
            this.render();
        },

        render: function() {
            if ( Parse.User.current() ) {
                new ManageTripsView();
            } else {
                new LogInView();
            }
        }
    });

    var state = new AppState();

    var App = new AppView();
});

// Formatters
_.template.distanceunit = function () {
    return Parse.User.current().get("lengthUnit");
};

_.template.formatdistance = function (dist, startOdometer, endOdometer) {
    var d;
    if ( dist !== -1 || (endOdometer !== 0 && startOdometer !== 0) ) {
        d = dist !== -1 ? dist : endOdometer - startOdometer;
        return d.toLocaleString('en-US', { maximumSignificantDigits: 3 }) + " " + Parse.User.current().get("lengthUnit");
    } else {
        return "-";
    }
};

_.template.formattype = function (t) {
    var type = !t ? "business" : t;
    return "<div class='" + type.toLowerCase() + "'></div>";
};

_.template.formatdate = function (stamp) {
    //var d = new Date(stamp.iso);
    //return d.toLocaleDateString();
    var fragments = stamp.iso.split("T");
    var dateFrag = fragments[0].split("-");
    return dateFrag[1] + "/" + dateFrag[2] + "/" + dateFrag[0];
};

_.template.formatdatevalue = function (stamp) {
    var fragments = stamp.iso.split("T");
    return fragments[0];
};
