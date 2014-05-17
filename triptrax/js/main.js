/**
 * Created with RubyMine.
 * By: superrunt
 * Date: 5/14/14
 * Time: 3:22 PM
 */

$.fn.serializeObject = function() {
    var o = Object.create(null),
        elementMapper = function(element) {
            element.name = $.camelCase(element.name);
            return element;
        },
        appendToResult = function(i, element) {
            var node = o[element.name];

            if ('undefined' !== typeof node && node !== null) {
                o[element.name] = node.push ? node.push(element.value) : [node, element.value];
            } else {
                o[element.name] = element.value;
            }
        };

    $.each($.map(this.serializeArray(), elementMapper), appendToResult);
    return o;
};

$(function() {

    Parse.initialize("Vd1Qs3EyW8r7JebCa7n9X6WXjvMxa711HJfKvWqJ", "q8fq25b1iNZyzyRqdIZHpXQKY5R4mTWU1QLeA374");

    // Trip Object
    // -----------------
    var Trip = Parse.Object.extend("Trip", {
        // Default attributes
        defaults: {
            title: "",
            date: new Date(),
            startOdometer: 0,
            endOdometer: 0
        },

        // Ensure that each todo created has `content`.
        initialize: function() {
            if (!this.get("title")) {
                this.set({"title": this.defaults.title});
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
        }
    });

    // View Objects
    // -----------------
    var LogInView = Parse.View.extend({
        events: {
            "submit form.login-form": "logIn",
            "submit form.signup-form": "signUp"
        },

        el: ".container",

        initialize: function() {
            _.bindAll(this, "logIn", "signUp", 'render');
            this.render();
        },

        logIn: function(e) {
            var self = this;
            var username = this.$("#login-username").val();
            var password = this.$("#login-password").val();

            Parse.User.logIn(username, password, {
                success: function(user) {
                    new ManageTripsView();
                    self.undelegateEvents();
//                    delete self;
                },

                error: function(user, error) {
                    self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
                    self.$(".login-form button").removeAttr("disabled");
                }
            });
        },

        signUp: function(e) {
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
        },

        // Re-render the contents of the trip item.
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },

        // Switch this view into editing
        edit: function() {
            $(this.el).addClass("editing");
//            this.input.focus();
        },

        // Close the editing mode, saving changes to the trip.
        save: function() {
            var data = $(this.el).find("form").serializeObject();
            data.date = new Date(data.date);
            data.startOdometer = parseInt(data.startOdometer);
            data.endOdometer = parseInt(data.endOdometer);
            data.user = Parse.User.current();
            this.model.setACL(new Parse.ACL(Parse.User.current()));
            this.model.save(data);
            $(this.el).removeClass("editing");
        },

        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function(e) {
            if (e.keyCode === 13) this.save();
        },

        // Remove the item, destroy the model.
        delete: function() {
            this.model.destroy();
        },

        // Close the editing mode without changes to the trip.
        cancel: function() {
            $(this.el).removeClass("editing");
        }
    });

    var ManageTripsView = Parse.View.extend({
        events: {
//            "keypress #new-todo":  "createOnEnter",
//            "click #clear-completed": "clearCompleted",
            "click .new": "newTrip",
            "click .log-out": "logOut"
//            "click ul#filters a": "selectFilter"
        },

        el: $(".container"),

        initialize: function() {
            var self = this;

            _.bindAll(this, 'addOne', 'addAll', 'render', 'logOut');

            // Main todo management template
            this.$el.html(_.template($("#manage-trips-template").html()));

            this.allCheckbox = this.$("#toggle-all")[0];

            // Create our collection of Todos
            this.trips = new TripsList();

            // Setup the query for the collection to look for todos from the current user
            this.trips.query = new Parse.Query(Trip);
            this.trips.query.equalTo("user", Parse.User.current());

            this.trips.bind('add',     this.addOne);
            this.trips.bind('reset',   this.addAll);
            this.trips.bind('all',     this.render);

            // Fetch all the trips for this user
            this.trips.fetch();

            state.on("change", this.filter, this);
        },

        render: function() {
//            var done = this.trips.done().length;
//            var remaining = this.trips.remaining().length;

//            this.$('#trips-stats').html(this.statsTemplate({
//                total:      this.todos.length,
//                done:       done,
//                remaining:  remaining
//            }));

//            this.delegateEvents();
//
//            this.allCheckbox.checked = !remaining;
        },

        newTrip: function() {
            var view = new TripView({model: new Trip()});
            $("#new-table").show();
            $("#new-trip").append(view.render().el);
        },

        addOne: function(trip) {
            var view = new TripView({model: trip});
            $("#trips-list").append(view.render().el);
        },

        addAll: function(collection, filter) {
            $("#trips-list").html("");
            $('#progress-bar').remove();
            this.trips.forEach(this.addOne);
        },

        logOut: function(e) {
            Parse.User.logOut();
            new LogInView();
            this.undelegateEvents();
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

        // Instead of generating a new element, bind to the existing skeleton of
        // the App already present in the HTML.
        el: $("#triptraxapp"),

        initialize: function() {
            this.render();
        },

        render: function() {
            if (Parse.User.current()) {
                new ManageTripsView();
            } else {
                new LogInView();
            }
        }
    });

    var state = new AppState();

    // Finally, we kick things off by creating the **App**.
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
