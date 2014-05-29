/**
 * Created with RubyMine.
 * By: superrunt
 * Date: 5/14/14
 * Time: 3:22 PM
 */

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
            endOdometer: 0
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
            "click .btn.login": "logIn",
            "click .btn.signup": "signUp"
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
//            this.input.focus();
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
            "click a.pagination": "goToPage"
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

            // this.allCheckbox = this.$("#toggle-all")[0];

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
            var _currentYear = new Date().getFullYear(); console.log(_currentYear);
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
        }
        // ,
        //
        // toggleModal: function () {
        //     var _transitions = this.support.transitions,
        //         _overlay = this.overlay,
        //         _supporTrans = this.support.transitions,
        //         _transEndEventName = this.transEndEventName;
        //
        //     if( _overlay.hasClass('open') ) {
        //         console.log("closing");
        //         _overlay.removeClass('open');
        //         _overlay.addClass('close');
        //         var onEndTransitionFn = function( ev ) {
        //             if( _transitions ) {
        //                 if( ev.propertyName !== 'visibility' ) return;
        //                 this.removeEventListener( _transEndEventName, onEndTransitionFn );
        //             }
        //             _overlay.removeClass('close');
        //         };
        //
        //         if( _supporTrans ) {
        //             _overlay.on( _transEndEventName, onEndTransitionFn );
        //         } else {
        //             onEndTransitionFn();
        //         }
        //     } else if( _overlay.hasClass('close') ) {
        //         console.log("opening");
        //         _overlay.removeClass('close');
        //         _overlay.addClass('open');
        //     }
        // }
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
_.template.formatdate = function (stamp) {
    var d = new Date(stamp.iso);
    return d.toLocaleDateString();
};

_.template.formatdatevalue = function (stamp) {
    var fragments = stamp.iso.split("T");
    return fragments[0];
};
