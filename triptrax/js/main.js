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
            title: "empty trip...",
            done: false
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
            return trip.get('date');
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

        //... is a list tag.
        tagName:  "tr",

        // Cache the template function for a single item.
        template: _.template($('#trip-template').html()),

        // The DOM events specific to an item.
        events: {
            "click .edit-me"              : "edit"
//            ,
//            "dblclick label.todo-content" : "edit",
//            "click .todo-destroy"   : "clear",
//            "keypress .edit"      : "updateOnEnter",
//            "blur .edit"          : "close"
        },

        // The TodoView listens for changes to its model, re-rendering. Since there's
        // a one-to-one correspondence between a Trip and a TripView in this
        // app, we set a direct reference on the model for convenience.
        initialize: function() {
            _.bindAll(this, 'render', 'close', 'remove');
            this.model.bind('change', this.render);
            this.model.bind('destroy', this.remove);
        },

        // Re-render the contents of the trip item.
        render: function() {
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },

        // Toggle the `"done"` state of the model.
        toggleDone: function() {
            this.model.toggle();
        },

        // Switch this view into `"editing"` mode, displaying the input field.
        edit: function() {
            console.log("edit me!");
//            $(this.el).addClass("editing");
//            this.input.focus();
        },

        // Close the `"editing"` mode, saving changes to the todo.
        close: function() {
            this.model.save({content: this.input.val()});
            $(this.el).removeClass("editing");
        },

        // If you hit `enter`, we're through editing the item.
        updateOnEnter: function(e) {
            if (e.keyCode === 13) this.close();
        },

        // Remove the item, destroy the model.
        delete: function() {
            this.model.destroy();
        }

    });

    var ManageTripsView = Parse.View.extend({
        events: {
//            "keypress #new-todo":  "createOnEnter",
//            "click #clear-completed": "clearCompleted",
//            "click #toggle-all": "toggleAllComplete",
            "click .log-out": "logOut"
//            "click ul#filters a": "selectFilter"
        },

        el: $(".container"),

        initialize: function() {
            var self = this;

            _.bindAll(this, 'addOne', 'addAll', 'render', 'logOut');

            // Main todo management template
            this.$el.html(_.template($("#manage-trips-template").html()));

            this.input = this.$("#new-trip");
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

        addOne: function(todo) {
            var view = new TripView({model: todo});
            $("#trips-list").append(view.render().el);
        },

        addAll: function(collection, filter) {
            $("#trips-list").html("");
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
    var d = new Date(stamp.iso),
        fragments = [
            d.getDate(),
            d.getMonth() + 1,
            d.getFullYear()
        ];
    return fragments.join('/');
};