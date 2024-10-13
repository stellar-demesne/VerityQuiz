
var LEFT = 0;
var CENTRE = 1;
var RIGHT = 2;

var TRIANGLE = "Trigon";
var SQUARE = "Quadrate";
var CIRCLE = "Orbicular";

var SPLINTERS_LOCS = [CIRCLE, TRIANGLE, SQUARE];

var KNIGHT = "KNIGHT";
var OGRE = "OGRE";

var SPHERE = "Spherical";
var CUBE = "Hexehedral";
var TETRAHEDRON = "Pyramidial";
var CYLINDER = "Cylindric";
var PRISM = "Trilateral";
var CONE = "Conoid";

var SHAPE_TABLE = {
    "Trigon": { "Trigon": TETRAHEDRON, "Quadrate": PRISM, "Orbicular": CONE },
    "Quadrate": { "Trigon": PRISM, "Quadrate": CUBE, "Orbicular": CYLINDER },
    "Orbicular": { "Trigon": CONE, "Quadrate": CYLINDER, "Orbicular": SPHERE },
}

var SHAPE_TABLE_REMOVE = {
    "Spherical": { "Orbicular": CIRCLE },
    "Hexehedral": { "Quadrate": SQUARE },
    "Pyramidial": { "Trigon": TRIANGLE },
    "Cylindric": { "Quadrate": CIRCLE, "Orbicular": SQUARE },
    "Trilateral": { "Trigon": SQUARE, "Quadrate": TRIANGLE },
    "Conoid": { "Trigon": CIRCLE, "Orbicular": TRIANGLE },
}

var GUARDIAN_A = "GUARDIAN_A";
var GUARDIAN_B = "GUARDIAN_B";
var GUARDIAN_C = "GUARDIAN_C";
var GUARDIAN_D = "GUARDIAN_D";
var GUARDIAN_E = "GUARDIAN_E";
var GUARDIAN_F = "GUARDIAN_F";

var ALL_GUARDIANS = [GUARDIAN_A, GUARDIAN_B, GUARDIAN_C, GUARDIAN_D, GUARDIAN_E, GUARDIAN_F];

function size_of_shape(shape) {
    if (shape == null) {
        return 0;
    }
    if (shape == TRIANGLE || shape == SQUARE || shape == CIRCLE) {
        return 1;
    }
    return 2;
}

function combine_shapes(shape1, shape2) {
    if (shape1 == null) {
        return shape2;
    }
    if (shape2 == null) {
        return shape1;
    }
    if (SHAPE_TABLE[shape1]) {
        return SHAPE_TABLE[shape1][shape2];
    }
    return null;
}

function remove_shape(shape1, shape2) {
    // always 3d, 2d
    return SHAPE_TABLE_REMOVE[shape1][shape2];
}

function random_choose(targets_list, num_to_choose=1) {
    if (num_to_choose > targets_list.length) {
        return undefined;
    }
    var chosen = [];
    for (var i = 0; i < num_to_choose; i++) {
        var new_chosen_index = Math.floor(Math.random()*targets_list.length);
        while (chosen.includes(targets_list[new_chosen_index])) {
            new_chosen_index += 1;
            if (new_chosen_index == targets_list.length) {
                new_chosen_index = 0;
            }
        }
        chosen.push(targets_list[new_chosen_index]);
    }
    if (num_to_choose==1) {
        return chosen[0];
    }
    return chosen;
}

var inside_state = {
    guardian_shapes: [TRIANGLE, SQUARE, CIRCLE],
    position: LEFT,
    waiting_shapes: [],
    inventory: [TRIANGLE, SQUARE],
    doubles: false,
    sent_symbols: [],
    shape_held: null,
    witness_ticks: 0,
    shadows: [true, true, true],
    knight_splinters: [KNIGHT, null, KNIGHT],
    ogre: false,
    yet_sorting: false,

    ghost_time: false,
    ghosts_triggered: false,

    // YOU ARE GUARDIAN_C for this!
    statues_circle: ALL_GUARDIANS,
    guardian_visible: GUARDIAN_A,

    reset: function () {
        // randomize starting state
        this.guardian_shapes = random_choose(SPLINTERS_LOCS, 3);
        this.position = random_choose([LEFT, CENTRE, RIGHT], 1);
        this.waiting_shapes = [];
        this.inventory = [this.guardian_shapes[this.position]];
        this.inventory.push(random_choose(SPLINTERS_LOCS, 1));
        if (this.inventory[0] == this.inventory[1]) {
            this.doubles = true;
        }
        else {
            this.doubles = random_choose([false, true], 1);
        }
        this.sent_symbols = [];
        this.shape_held = null;
        this.witness_ticks = 0;
        this.shadows = [true, true, true];
        this.knight_splinters = [KNIGHT, null, KNIGHT];
        this.ogre = false;
        if (!fast_strat) {
            this.yet_sorting = true;
        }
        else {
            this.yet_sorting = false;
        }

        this.ghost_time = false;
        this.ghosts_triggered = false;
        this.statues_circle = random_choose(ALL_GUARDIANS, 6);
        this.guardian_visible = random_choose([GUARDIAN_A, GUARDIAN_B], 1);
    },

    list_of_all_shapes: function () {
        var wall_shapes = []
        if (this.shape_held != null) {
            if (size_of_shape(this.shape_held) == 1) {
                wall_shapes.push(this.shape_held)
            }
            else {
                var firstshape;
                if (remove_shape(this.shape_held, TRIANGLE)) {
                    firstshape = TRIANGLE;
                }
                else if (remove_shape(this.shape_held, SQUARE)) {
                    firstshape = SQUARE;
                }
                else if (remove_shape(this.shape_held, CIRCLE)) {
                    firstshape = CIRCLE;
                }
                wall_shapes.push(firstshape);
                wall_shapes.push(remove_shape(this.shape_held, firstshape));
            }
        }
        wall_shapes = wall_shapes.concat(this.inventory.concat(this.waiting_shapes));
        wall_shapes.sort( function (a, b) {
            if (a[0] == b[0]) {
                return 0;
            }
            if (a[0] == 'T') {
                return -1;
            }
            if (b[0] == 'T') {
                return 1;
            }
            if (a[0] == 'C') {
                return -1;
            }
            return 1;
        });
        return wall_shapes;
    },

    kill_knight: function (loc) {
        if (this.ghost_time) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to kill a knight while dead or before calling out who you saw";
            return;
        }
        if (this.inventory.length == 1) {
            this.knight_splinters[loc] = this.inventory[0];
        }
        else {
            // if loc is 1: 3.
            // if loc is 3: 1.
            // this works.
            if (this.knight_splinters[2 - loc] == KNIGHT) {
                // the other knight still lives, we can do the randomness here.
                var chosen_index = random_choose([0, 1], 1);
                this.knight_splinters[loc] = this.inventory[chosen_index];
            }
            else {
                // we must do the opposite from the other knight
                if (this.inventory[0] == this.knight_splinters[2 - loc]) {
                    this.knight_splinters[loc] = this.inventory[1];
                }
                else {
                    this.knight_splinters[loc] = this.inventory[0];
                }
            }
        }
    },

    pickup: function (loc) {
        if (this.ghost_time) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to pick up a splinter while dead or before calling out who you saw";
            return;
        }
        if (size_of_shape(this.shape_held) == 2) {
            // picking up a third splinter? really?
            victory_state = END_DEFEAT
            end_explanatory_text = "You tried to pick up a third splinter.";
        }
        this.shape_held = combine_shapes(this.shape_held, this.knight_splinters[loc]);
        if (this.knight_splinters[loc] == this.inventory[0]) {
            // remove first
            this.inventory.splice(0, 1);
        }
        else {
            // remove *second*
            this.inventory.splice(1, 1);
        }
        this.knight_splinters[loc] = null;
        if (this.knight_splinters[LEFT] == null && this.knight_splinters[RIGHT] == null) {
            if (this.waiting_shapes.length >= 1) {
                this.ogre = true;
            }
        }
    },

    kill_ogre: function () {
        if (this.ghost_time) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to kill your ogre while dead and/or before calling out who you saw.";
            return;
        }
        this.ogre = false;
        if (this.waiting_shapes.length == 1) {
            // only one knight
            this.inventory = this.waiting_shapes.splice(0, 1);
            this.knight_splinters = [null, null, null];
            this.knight_splinters[random_choose([LEFT, RIGHT], 1)] = KNIGHT
        }
        else {
            this.inventory = this.waiting_shapes.splice(0, 2);
            this.knight_splinters = [KNIGHT, null, KNIGHT];
        }
    },

    register: function (loc) {
        // register ours
        if (loc == this.position) {
            // TODO: return immediately, timeout symbols-on-ground, merely recieve stuff?
            victory_state = END_DEFEAT;
            end_explanatory_text = "You cannot interact with your own statue.";
            return;
        }
        else {
            var size_registered = size_of_shape(this.shape_held)
            if (size_registered == 0) {
                // TODO: punish mistake?
                victory_state = END_DEFEAT;
                end_explanatory_text = "You tried to give someone a symbol without having a symbol in-hand!";
                return;
            }
            else if (size_registered == 1) {
                if (fast_strat || !this.yet_sorting) {
                    // these symbols are going to their final homes.
                    if (this.shape_held == this.guardian_shapes[loc]) {
                        victory_state = END_DEFEAT;
                        end_explanatory_text = "You gave a fellow solo guardian their own symbol. We're not doing sorting, here.";
                        return;
                    }
                    for (var i = 0; i < this.sent_symbols.length; i++) {
                        if (this.shape_held == this.sent_symbols[i][0] && loc == this.sent_symbols[i][1]) {
                            // repeat a send? straight to jail.
                            victory_state = END_DEFEAT;
                            end_explanatory_text = "You sent a symbol to a guardian that you had already sent that symbol to.";
                            return;
                        }
                    }

                }
                else if (this.yet_sorting) {
                    // We're doing sorting!
                    if (this.shape_held != this.guardian_shapes[loc]) {
                        victory_state = END_DEFEAT;
                        end_explanatory_text = "You sent a symbol to the wrong guardian while sorting is still happening.";
                        return;
                    }
                    // that's all the checks, actually. huh.
                }
                // transfer the one splinter
                if (!this.yet_sorting) {
                    // if we're still sorting, then shadows aren't disappearing, and the witness thus (TODO: maybe?) won't take notice?
                    // and we also don't need to track what we've sent, actually.
                    this.sent_symbols.push([this.shape_held, loc]);
                    this.witness_ticks += 1;
                }
                this.shape_held = null;
            }
            else if (size_registered == 2) {
                // TODO: fail if we do this? fail if we do this too many times?
                // discard combo shape, return to inventory
                for (var i = 0; i < 3; i++) {
                    var theoretical_part = remove_shape(this.shape_held, SPLINTERS_LOCS[i]);
                    if (theoretical_part) {
                        this.waiting_shapes.unshift(theoretical_part);
                        if (combine_shapes(theoretical_part, theoretical_part) == this.shape_held) {
                            this.waiting_shapes.unshift(theoretical_part);
                        }
                    }
                }
                this.shape_held = null;
            }
        }

        // #################### END - GIVING - PORTION
        // #################### START - RECIEVING - PORTION

        // check how many we recieve!
        if (this.yet_sorting) {
            // first, if we're still sorting, then we just recieve any needed of our own type.
            var desired_shape_count = 0;
            var wall_shapes = this.list_of_all_shapes();
            for (var i = 0; i < wall_shapes.length; i++) {
                if (wall_shapes[i] == this.guardian_shapes[this.position]) {
                    desired_shape_count += 1;
                }
            }
            if (desired_shape_count < 2) {
                this.waiting_shapes.push(this.guardian_shapes[this.position]);
            }
        }
        else {
            // otherwise, we do the full figuring
            var shadowcount = this.shadows[LEFT] + this.shadows[CENTRE] + this.shadows[RIGHT]
            if (shadowcount == 3 && this.doubles) {
                if (this.sent_symbols.length == 1) {
                    // we *can* recieve both, immediately
                    if (random_choose([false, true], 1)) {
                        //send from the one
                        if (this.guardian_shapes[this.position] == CIRCLE) {
                            this.waiting_shapes.push(SQUARE);
                            this.shadows[this.guardian_shapes.indexOf(SQUARE)] = false;
                        }
                        else {
                            this.waiting_shapes.push(CIRCLE);
                            this.shadows[this.guardian_shapes.indexOf(CIRCLE)] = false;
                        }
                    }
                    this.witness_ticks += 1;
                    if (random_choose([false, true], 1)) {
                        //send from the other
                        if (this.guardian_shapes[this.position] == TRIANGLE) {
                            // we must be wanting LEFT and RIGHT
                            this.waiting_shapes.push(SQUARE);
                            this.shadows[this.guardian_shapes.indexOf(SQUARE)] = false;
                        }
                        else {
                            // LEFT + CENTRE or CENTRE + RIGHT, don't care here.
                            this.waiting_shapes.push(TRIANGLE);
                            this.shadows[this.guardian_shapes.indexOf(TRIANGLE)] = false;
                        }
                    }
                    this.witness_ticks += 1;
                }
                else { // we've sent more than 1 symbol.
                    // we MUST recieve both, *now*.
                    if (this.guardian_shapes[this.position] != CIRCLE) {
                        this.shadows[this.guardian_shapes.indexOf(CIRCLE)] = false;
                        this.witness_ticks += 1;
                        this.waiting_shapes.push(CIRCLE);
                    }
                    if (this.guardian_shapes[this.position] != TRIANGLE) {
                        this.shadows[this.guardian_shapes.indexOf(TRIANGLE)] = false;
                        this.witness_ticks += 1;
                        this.waiting_shapes.push(TRIANGLE);
                    }
                    if (this.guardian_shapes[this.position] != SQUARE) {
                        this.shadows[this.guardian_shapes.indexOf(SQUARE)] = false;
                        this.witness_ticks += 1;
                        this.waiting_shapes.push(SQUARE);
                    }
                }
            }
            else if (this.sent_symbols.length == 2 && shadowcount == 1) {
                // did send already
                this.witness_ticks += 2;
            }
            else if (shadowcount > 1) {
                // the one room has shadowcount-1 symbols left to hand over
                var potential_shapes = [];
                for (var i = LEFT; i <= RIGHT; i++) {
                    if (i != this.position && this.shadows[i]) {
                        potential_shapes.push(this.guardian_shapes[i]);
                    }
                }
                // hand over one of them.
                var chosen_shape = random_choose(potential_shapes, 1);
                this.waiting_shapes.push(chosen_shape);
                this.shadows[this.guardian_shapes.indexOf(chosen_shape)] = false;
                this.witness_ticks += 1;
                // the third solo is also handing along shapes
                this.witness_ticks += 1;
            }
        }

        // #################### END - POSTSORT - PORTION

        if (this.inventory.length == 0 && this.waiting_shapes.length != 0) {
            this.ogre = true;
        }
        // TODO: outside dissection simulation?
        // if enough transfers happened, ghost time!
        if (this.witness_ticks >= 6 && !this.ghosts_triggered) {
            this.ghost_time = true;
            this.ghosts_triggered = true;
            display_phase_announcement();
            // TODO: clear floor of lingering symbols?
        }
    },

    possess_another_shape: function () {
        var wall_shapes = this.list_of_all_shapes();
        if (wall_shapes.length > 2) {
            // nu-uh.
            return true;
        }
        for (var i = 0; i < wall_shapes.length; i++) {
            if (wall_shapes[i] != this.guardian_shapes[this.position]) {
                return true;
            }
        }
        return false;
    },

    wait_for_sort: function () {
        if (!this.yet_sorting) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "Everyone already called for the splitting to happen. Calling for it again is wrong.";
            return;
        }
        var wall_shapes = this.list_of_all_shapes();
        var insufficiently_generous = this.possess_another_shape();
        if (insufficiently_generous) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to wait for others to have finished sorting when you've still got symbols to give away.";
            return;
        }
        // we've been generous enough! so now we recieve any yet-missing shapes.
        for (var i = wall_shapes.length; i < 2; i++) {
            this.waiting_shapes.push(this.guardian_shapes[this.position]);
        }
        // and now that things are sorted, we act like we started with doubles.
        this.doubles = true;
        this.yet_sorting = false;
        add_to_chat(`</br>"Sorted - now, split!"`)
    },

    ghost_callout: function (num) {
        if (this.ghost_time == false) {
            // we uh. can't see that yet. ignore this click.
            return;
        }
        if (this.statues_circle[num] == this.guardian_visible) {
            // do the string callout
            callout_for_inside_ghost(this.guardian_visible, num);
            // TODO: do we do the other callouts too? we should...
            // good job! now resume
            this.ghost_time = false;
        }
        else {
            // whoops. it was so simple, too...
            victory_state = END_DEFEAT;
            end_explanatory_text = "You messed up the statue callout.";
        }
    },

    leave: function () {
        if (size_of_shape(this.shape_held) < 2) {
            // not holding a double? fail.
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to leave without holding a 3D shape!";
            return;
        }
        if (!remove_shape(this.shape_held, this.guardian_shapes[this.position])) {
            // holding the right double...
            for (var i = LEFT; i <= RIGHT; i++) {
                if (i != this.position && this.shadows[i]) {
                    // a statue shadow remains that isn't yours!
                    victory_state = END_DEFEAT;
                    end_explanatory_text = "You tried to leave before you were down to only your own shadow.";
                    return;
                }
            }
            if (this.inventory.length != 0 || this.waiting_shapes.length != 0) {
                victory_state = END_DEFEAT;
                end_explanatory_text = "You tried to leave before all the symbols were in the right rooms.";
                return;
            }
            if (this.witness_ticks == 9) {
                // everything is done, no question.
                victory_state = END_VICTORY;
            }
            else if (this.witness_ticks >= 6) {
                // ... everything is *going* to be done, probably.
                victory_state = END_VICTORY;
            }
            else { 
                // trying to leave early? honestly... if the setup is right, sure.
                victory_state = END_VICTORY;
            }
        }
        else {
            //holding the wrong double? fail.
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to leave with the wrong 3D shape...";
            return;
        }
    },
}

var outside_state = {
    inside_callout: [TRIANGLE, SQUARE, CIRCLE],
    shapes: [PRISM, CYLINDER, CONE],
    dissected_shape: null,
    dissected_loc: null,
    count_shapes_invested: 0,
    shape_held: null,
    ghost_held: null,

    knight_splinters: [KNIGHT, KNIGHT, KNIGHT],
    ogres: [null, null, null],
    ghosts_present: false,
    acted_during_ghosts: false,
    spawn_statues: ALL_GUARDIANS,

    reset: function () {
        // randomize starting state
        this.inside_callout = random_choose(SPLINTERS_LOCS, 3);
        this.shapes = random_choose(SPLINTERS_LOCS, 3);
        for (var i = 0; i < 3; i++) {
            this.shapes[i] = combine_shapes(this.shapes[i], this.inside_callout[i]);
        }
        this.dissected_shape = null;
        this.dissected_loc = null;
        this.count_shapes_invested = 0;
        this.shape_held = null;
        this.ghost_held = null;
        this.knight_splinters = [KNIGHT, KNIGHT, KNIGHT];
        this.ogres = [null, null, null];
        this.ghosts_present = false;
        this.acted_during_ghosts = false;
        this.spawn_statues = random_choose(ALL_GUARDIANS, 6);
    },

    kill: function (loc) {
        if (this.ghosts_present || this.ghost_held != null) {
            if (this.acted_during_ghosts) {
                victory_state = END_DEFEAT;
                end_explanatory_text = "You delayed dealing with the ghosts too long.";
                return;
            }
            else {
                this.acted_during_ghosts = true;
            }
        }
        this.knight_splinters[loc] = SPLINTERS_LOCS[loc];
    },

    pickup: function (loc) {
        if (this.ghosts_present || this.ghost_held != null) {
            if (this.acted_during_ghosts) {
                victory_state = END_DEFEAT;
                end_explanatory_text = "You delayed dealing with the ghosts too long.";
                return;
            }
            else {
                this.acted_during_ghosts = true;
            }
        }
        var newshape = combine_shapes(this.shape_held, this.knight_splinters[loc]);
        if (newshape) {
            this.shape_held = newshape;
            this.knight_splinters[loc] = null;
            if (!this.knight_splinters.includes(KNIGHT)) {
                this.knight_splinters = [null, null, null];
                this.ogres = [OGRE, null, OGRE];
            }
        }
    },

    kill_ogre: function (loc) {
        this.ogres[loc] = null;
        if (!this.ogres.includes(OGRE)) {
            this.knight_splinters = [KNIGHT, KNIGHT, KNIGHT];
        }
    },

    dissect: function (loc) {
        if (this.ogres[LEFT] != null || this.ogres[RIGHT] != null) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to dissect while there were still the unstop ogres around! Not a good idea.";
            return;
        }
        if (this.ghosts_present || this.ghost_held != null) {
            if (this.acted_during_ghosts) {
                victory_state = END_DEFEAT;
                end_explanatory_text = "You delayed dealing with the ghosts too long.";
                return;
            }
            else {
                this.acted_during_ghosts = true;
            }
        }
        if (this.count_shapes_invested >= 7) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "Your dissection took too many steps.";
            return;
        }
        if (this.count_shapes_invested >= 4 && this.ghost_held != null) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "The witness noticed, and you didn't start trying to return the solo players to life.";
            return;
        }
        if (this.shape_held == null) {
            return;
        }
        if (this.dissected_loc != loc) {
            if (size_of_shape(this.shape_held) == 2) {
                //we're holding a combo shape
                this.shape_held = null;
            }
            else if (remove_shape(this.shapes[loc], this.shape_held)) {
                if (this.dissected_loc != null) {
                    // do the swap
                    this.shapes[this.dissected_loc] = combine_shapes(this.shape_held, remove_shape(this.shapes[this.dissected_loc], this.dissected_shape));
                    this.shapes[loc] = combine_shapes(this.dissected_shape, remove_shape(this.shapes[loc], this.shape_held));
                    this.dissected_loc = null;
                    this.dissected_shape = null;
                    this.shape_held = null;
                } else {
                    // setup for swap
                    this.dissected_loc = loc;
                    this.dissected_shape = this.shape_held;
                    this.shape_held = null;
                }
            }
        }
        this.count_shapes_invested += 1;
        if (this.count_shapes_invested == 3) {
            // spawn ghosts
            this.ghosts_present = true;
            this.spawn_statues = random_choose(ALL_GUARDIANS, 6);
            display_phase_announcement();
        }
    },

    pickup_ghost: function () {
        if (this.ogres[LEFT] != null || this.ogres[RIGHT] != null) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to pick up a ghost while ogres were still rampaging. That's a good way to not see which ghost you grabbed.";
            return;
        }
        this.ghosts_present = false;
        this.ghost_held = random_choose([GUARDIAN_A, GUARDIAN_B, GUARDIAN_C]);
        var chosen_callouts = random_choose([GUARDIAN_A, GUARDIAN_B, GUARDIAN_C], 2);
        callouts_for_outside_ghosts(chosen_callouts[0], this.spawn_statues.indexOf(chosen_callouts[0]),
                                    chosen_callouts[1], this.spawn_statues.indexOf(chosen_callouts[1]));
    },

    place_ghost: function (loc) {
        if (this.ghost_held != this.spawn_statues[loc]) {
            // wrong ghostie
            victory_state = END_DEFEAT;
            if (this.ghost_held) {
                end_explanatory_text = "You put the ghost in the wrong statue! Sure, it only kills you, but that is not good enough!";
            }
            else {
                end_explanatory_text = "You tried to interact with a statue at the back end of the room.</br>That's where ghosts go, that's not where dissection happens.";
            }
        }
        this.ghost_held = null;
    },

    wait: function () {
        if (this.ghosts_present) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to leave when there were still ghosts not returned to their statues. Dead players can't leave!";
            return;
        }
        if (this.ogres[LEFT] != null || this.ogres[RIGHT] != null) {
            victory_state = END_DEFEAT;
            end_explanatory_text = "You tried to wait for the solo players to exit while the unstop ogres were still rampaging.";
            return;
        }
        for (var i = LEFT; i <= RIGHT; i++) {
            if (this.shapes[i] != combine_shapes(this.inside_callout[(i+1) % 3], this.inside_callout[(i+2) % 3])) {
                victory_state = END_DEFEAT;
                end_explanatory_text = "You tried to wait for your friends without finishing the dissection.";
                return;
            }
        }
        victory_state = END_VICTORY;
    },
}

var PHASE_INSIDE = "INSIDE";
var PHASE_OUTSIDE = "OUTSIDE";

var current_phase = PHASE_OUTSIDE;

var interleave_modes = false;
var fast_strat = true;

var training_active = false;

var wins = 0;
var losses = 0;
var winstreak = 0;

var END_VICTORY = "VICTORY";
var END_DEFEAT = "DEFEAT";
var victory_state = null;
var victory_seen = false;

var end_explanatory_text = "";


function choose_one_only(chosen_phase) {
    interleave_modes = false;
    current_phase = chosen_phase;
    reset_scores();
}

function choose_full_encounter() {
    interleave_modes = true;
    current_phase = random_choose([PHASE_INSIDE, PHASE_OUTSIDE], 1);
    reset_scores();
}

function reset_scores() {
    wins = 0;
    losses = 0;
    winstreak = 0;
    victory_state = null;
    victory_seen = false;
    inside_state.reset();
    outside_state.reset();
    reset_chatbox();
    redraw_screen();
}

function continue_current_mode() {
    if (interleave_modes) {
        current_phase = random_choose([PHASE_INSIDE, PHASE_OUTSIDE], 1);
    }
    victory_seen = false;
    victory_state = null;
    end_explanatory_text = "";
    if (current_phase == PHASE_INSIDE) {
        inside_state.reset();
    }
    else {
        outside_state.reset();
    }
    insert_round_splitter_in_chatbox();
    add_starter_callouts_to_chatbox();
}

var elem;

function draw_scores() {
    elem = document.querySelector("#wins");
    elem.innerHTML = "Wins: " + wins;
    elem = document.querySelector("#losses");
    elem.innerHTML = "Losses: " + losses;
    elem = document.querySelector("#streak");
    elem.innerHTML = "Winstreak: " + winstreak;
}

function reset_chatbox() {
    elem = document.querySelector("#chatbox");
    // TODO: make this keep a few lines of any previous callouts
    elem.innerHTML = "--";
    add_starter_callouts_to_chatbox();
}

function insert_round_splitter_in_chatbox() {
    add_to_chat("</br>--");
}

function add_starter_callouts_to_chatbox() {
    if (current_phase == PHASE_INSIDE) {
        // phase == INSIDE
        var chat_text = "</br>";
        for (var i = LEFT; i <= RIGHT; i++) {
            if (inside_state.guardian_shapes[i] == TRIANGLE) {
                chat_text += 't';
            }
            if (inside_state.guardian_shapes[i] == SQUARE) {
                chat_text += 's';
            }
            if (inside_state.guardian_shapes[i] == CIRCLE) {
                chat_text += 'c';
            }
        }
        if (fast_strat) {
            chat_text += "</br>"
            if (inside_state.doubles) {
                chat_text += '"Doubles!"';
            }
            else {
                chat_text += '"No doubles."';
            }
        }
    }
    else {
        // phase == OUTSIDE
        var chat_text = "</br>";
        for (var i = LEFT; i <= RIGHT; i++) {
            if (outside_state.inside_callout[i] == TRIANGLE) {
                chat_text += 't';
            }
            if (outside_state.inside_callout[i] == SQUARE) {
                chat_text += 's';
            }
            if (outside_state.inside_callout[i] == CIRCLE) {
                chat_text += 'c';
            }
        }
        chat_text += "</br>"
        if (random_choose([true, false], 1)) {
            chat_text += '"Doubles!"';
        }
        else {
            chat_text += '"No doubles."';
        }
    }
    add_to_chat(chat_text);
}

function display_phase_announcement() {
    elem = document.querySelector("#phase-announcement");
    elem.setAttribute('class', 'phase-announced');
    // hide after a bit of time.
    setInterval( function () {
        elem = document.querySelector("#phase-announcement");
        elem.removeAttribute('class');
    }, 2000);
}

var stock_callouts = [" is at ", " in "];
var reverse_callouts = [" has ", " is "];

function callout_for_inside_ghost(guardian_1, loc_1) {
    var chat_addition = '</br>You call: "'
    if (random_choose([false, true], 1)) {
        // stock callout for guardian-1
        chat_addition += guardian_1.at(-1) + random_choose(stock_callouts, 1) + (loc_1 + 1);
    }
    else {
        // reverse for guardian-1
        chat_addition += (loc_1 + 1) + random_choose(reverse_callouts, 1) + guardian_1.at(-1);
    }
    add_to_chat(chat_addition + '"');
}

function callouts_for_outside_ghosts(guardian_1, loc_1, guardian_2, loc_2) {
    var chat_addition = '</br>"'
    if (random_choose([false, true], 1)) {
        // stock callout for guardian-1
        chat_addition += guardian_1.at(-1) + random_choose(stock_callouts, 1) + (loc_1 + 1);
    }
    else {
        // reverse for guardian-1
        chat_addition += (loc_1 + 1) + random_choose(reverse_callouts, 1) + guardian_1.at(-1);
    }
    chat_addition += `"</br>"`
    if (random_choose([false, true], 1)) {
        // stock callout for guardian-2
        chat_addition += guardian_2.at(-1) + random_choose(stock_callouts, 1) + (loc_2 + 1);
    }
    else {
        // reverse for guardian-2
        chat_addition += (loc_2 + 1) + random_choose(reverse_callouts, 1) + guardian_2.at(-1);
    }
    add_to_chat(chat_addition + '"');
}

function add_to_chat(newmessages) {
    elem = document.querySelector("#chatbox");
    elem.innerHTML += newmessages;
    var stringyversion = elem.innerHTML;
    var regex_for_breaks = `<br>`
    while ([...elem.innerHTML.matchAll(regex_for_breaks)].length > 6) {
        elem.innerHTML = elem.innerHTML.slice(elem.innerHTML.indexOf(regex_for_breaks)+4);
    }
}

function shapes_to_html_nodes(shapes_list) {
    var output_html_nodes = [];
    for (var i = 0; i < shapes_list.length; i++) {
        var new_node = document.createElement('div');
        new_node.setAttribute('class', 'wall-shape ' + shapes_list[i]);
        output_html_nodes.push(new_node);
    }
    if (output_html_nodes.length > 0) {
        output_html_nodes.at(0).setAttribute('id', "first-listed-shape");
    }
    if (output_html_nodes.length > 1) {
        output_html_nodes.at(-1).setAttribute('id', "last-listed-shape");
    }
    return output_html_nodes;
}

function draw_inside() {
    // disable outside, show inside.
    elem = document.querySelector("#outside-view");
    elem.setAttribute('style', "display: none");
    elem = document.querySelector("#inside-view");
    elem.setAttribute('style', "display: block");

    elem = document.querySelector("#wait-for-sort");
    if (fast_strat) {
        elem.setAttribute('style', "display: none");
    }
    else {
        elem.setAttribute('style', "display: block");
    }
    
    // decides shapes for wall
    var wall_shapes = inside_state.list_of_all_shapes();
    if (wall_shapes == []) {
        wall_shapes = ["empty-wall"];
    }
    // show wall shapes
    elem = document.querySelector("#projector-screen-inside")
    elem.replaceChildren(...shapes_to_html_nodes(wall_shapes));
    // show buff held, if any
    elem = document.querySelector("#shape_buff");
    if (inside_state.shape_held) {
        elem.innerHTML = inside_state.shape_held;
        elem.setAttribute('style', "display: block");
    }
    else {
        elem.setAttribute('style', "display: none");
    }
    // show the two knights, or splinters.
    if (inside_state.knight_splinters[LEFT] == KNIGHT) {
        elem = document.querySelector("#knight-inside-left .knight");
        elem.setAttribute('style', "display: block");
        elem = document.querySelector("#knight-inside-left .splinter");
        elem.setAttribute('style', "display: none");
    }
    else if (inside_state.knight_splinters[LEFT] != null) {
        elem = document.querySelector("#knight-inside-left .knight");
        elem.setAttribute('style', "display: none");
        elem = document.querySelector("#knight-inside-left .splinter");
        elem.setAttribute('style', "display: block");
        elem.setAttribute('class', "splinter " + inside_state.knight_splinters[LEFT]);
    }
    else {
        elem = document.querySelector("#knight-inside-left .knight");
        elem.setAttribute('style', "display: none");
        elem = document.querySelector("#knight-inside-left .splinter");
        elem.setAttribute('style', "display: none");
    }
    if (inside_state.knight_splinters[RIGHT] == KNIGHT) {
        elem = document.querySelector("#knight-inside-right .knight");
        elem.setAttribute('style', "display: block");
        elem = document.querySelector("#knight-inside-right .splinter");
        elem.setAttribute('style', "display: none");
    }
    else if (inside_state.knight_splinters[RIGHT] != null) {
        elem = document.querySelector("#knight-inside-right .knight");
        elem.setAttribute('style', "display: none");
        elem = document.querySelector("#knight-inside-right .splinter");
        elem.setAttribute('style', "display: block");
        elem.setAttribute('class', "splinter " + inside_state.knight_splinters[RIGHT]);
    }
    else {
        elem = document.querySelector("#knight-inside-right .knight");
        elem.setAttribute('style', "display: none");
        elem = document.querySelector("#knight-inside-right .splinter");
        elem.setAttribute('style', "display: none");
    }
    // show ogre, if present
    elem = document.querySelector("#ogre-inside");
    if (inside_state.ogre) {
        elem.setAttribute('style', "display: block");
    }
    else {
        elem.setAttribute('style', "display: none");
    }
    // show correct forward statues
    elem = document.querySelector("#guardian-left-inside");
    if (inside_state.position == LEFT) {
        elem.setAttribute('class', 'player_guardian');
    }
    else {
        elem.setAttribute('class', 'nonplayer_guardian');
    }
    elem = document.querySelector("#guardian-centre-inside");
    if (inside_state.position == CENTRE) {
        elem.setAttribute('class', 'player_guardian');
    }
    else {
        elem.setAttribute('class', 'nonplayer_guardian');
    }
    elem = document.querySelector("#guardian-right-inside");
    if (inside_state.position == RIGHT) {
        elem.setAttribute('class', 'player_guardian');
    }
    else {
        elem.setAttribute('class', 'nonplayer_guardian');
    }
    // show correct shadows
    elem = document.querySelector("#shadow-left");
    if (inside_state.shadows[LEFT]) {
        elem.setAttribute('class', inside_state.guardian_shapes[LEFT])
    }
    else {
        elem.setAttribute('class', 'no-shadow');
    }
    elem = document.querySelector("#shadow-centre");
    if (inside_state.shadows[CENTRE]) {
        elem.setAttribute('class', inside_state.guardian_shapes[CENTRE]);
    }
    else {
        elem.setAttribute('class', 'no-shadow');
    }
    elem = document.querySelector("#shadow-right");
    if (inside_state.shadows[RIGHT]) {
        elem.setAttribute('class', inside_state.guardian_shapes[RIGHT]);
    }
    else {
        elem.setAttribute('class', 'no-shadow');
    }
    // show statue circle, if ghosty
    elem = document.querySelector("#spawn-circle-inside");
    if (inside_state.ghost_time) {
        elem.removeAttribute('class');
        for (var i = 0; i < 6; i++) {
            elem = document.querySelector("#inside-guardian-statue-" + (i+1));
            elem.innerHTML = ""
            if ([GUARDIAN_A, GUARDIAN_B, GUARDIAN_C].includes(inside_state.statues_circle[i])) {
                // one of the inside people
                if (inside_state.statues_circle[i] == inside_state.guardian_visible) {
                    // the one we can see
                    elem.setAttribute('class', inside_state.statues_circle[i]);
                }
                else {
                    elem.setAttribute('class', 'invisible_guardian');
                }
                elem = document.querySelector("#inside-glow-"+(i+1));
                elem.setAttribute('class', 'pedestal-glow');
            }
            else {
                elem.setAttribute('class', inside_state.statues_circle[i]);
                elem = document.querySelector("#inside-glow-"+(i+1));
                elem.setAttribute('class', 'pedestal-not-glow');
            }
        }
        elem = document.querySelector("#quiz-area");
        elem.setAttribute('class', 'ghosted');
    }
    else {
        elem.setAttribute('class', "distant-statue-circle");
        for (var i = 0; i < 6; i++) {
            elem = document.querySelector("#inside-guardian-statue-" + (i+1));
            elem.setAttribute('class', inside_state.statues_circle[i]);
            elem = document.querySelector("#inside-glow-"+(i+1));
            elem.setAttribute('class', 'pedestal-not-glow');
        }
        elem = document.querySelector("#quiz-area");
        elem.removeAttribute('class');
    }
}

function draw_outside() {
    // disable inside, show outside
    elem = document.querySelector("#inside-view");
    elem.setAttribute('style', "display: none");
    elem = document.querySelector("#outside-view");
    elem.setAttribute('style', "display: block");
    // show all three shapes on wall
    elem = document.querySelector("#projector-screen-outside");
    elem.replaceChildren(...shapes_to_html_nodes(SPLINTERS_LOCS));
    // show buff held, if any
    elem = document.querySelector("#shape_buff");
    if (outside_state.shape_held) {
        elem.innerHTML = outside_state.shape_held;
        elem.setAttribute('style', "display: block");
    }
    else {
        elem.setAttribute('style', "display: none");
    }
    // show ghost held, if any
    elem = document.querySelector("#ghost_buff");
    if (outside_state.ghost_held) {
        elem.innerHTML = "holding Ghost: " + outside_state.ghost_held.at(-1);
        elem.setAttribute('style', "display: block");
    }
    else {
        elem.setAttribute('style', "display: none");
    }
    // show/hide knights/splinters outside
    elem = document.querySelector("#knight-outside-left .knight");
    if (outside_state.knight_splinters[LEFT] == KNIGHT) {
        elem.setAttribute('style', "display: block");
        elem = document.querySelector("#knight-outside-left .splinter");
        elem.setAttribute('style', "display: none");
    }
    else {
        elem.setAttribute('style', "display: none");
        elem = document.querySelector("#knight-outside-left .splinter");
        if (outside_state.knight_splinters[LEFT]) {
            elem.setAttribute('style', "display: block");
            elem.setAttribute('class', "splinter " + outside_state.knight_splinters[LEFT]);
        }
        else {
            elem.setAttribute('style', "display: none");
        }
    }
    elem = document.querySelector("#knight-outside-centre .knight");
    if (outside_state.knight_splinters[CENTRE] == KNIGHT) {
        elem.setAttribute('style', "display: block");
        elem = document.querySelector("#knight-outside-centre .splinter");
        elem.setAttribute('style', "display: none");
    }
    else {
        elem.setAttribute('style', "display: none");
        elem = document.querySelector("#knight-outside-centre .splinter");
        if (outside_state.knight_splinters[CENTRE]) {
            elem.setAttribute('style', "display: block");
            elem.setAttribute('class', "splinter " + outside_state.knight_splinters[CENTRE]);
        }
        else {
            elem.setAttribute('style', "display: none");
        }
    }
    elem = document.querySelector("#knight-outside-right .knight");
    if (outside_state.knight_splinters[RIGHT] == KNIGHT) {
        elem.setAttribute('style', "display: block");
        elem = document.querySelector("#knight-outside-right .splinter");
        elem.setAttribute('style', "display: none");
    }
    else {
        elem.setAttribute('style', "display: none");
        elem = document.querySelector("#knight-outside-right .splinter");
        if (outside_state.knight_splinters[RIGHT]) {
            elem.setAttribute('style', "display: block");
            elem.setAttribute('class', "splinter " + outside_state.knight_splinters[RIGHT]);
        }
        else {
            elem.setAttribute('style', "display: none");
        }
    }
    // show/hide ogres outside
    elem = document.querySelector("#ogre-outside-left");
    if (outside_state.ogres[LEFT]) {
        elem.setAttribute('style', "display: blcok");
    }
    else {
        elem.setAttribute('style', "display: none");
    }
    elem = document.querySelector("#ogre-outside-right");
    if (outside_state.ogres[RIGHT]) {
        elem.setAttribute('style', "display: blcok");
    }
    else {
        elem.setAttribute('style', "display: none");
    }
    // show shapes on statues outside
    elem = document.querySelector("#shape-left");
    elem.setAttribute('class', outside_state.shapes[LEFT]);
    elem = document.querySelector("#shape-centre");
    elem.setAttribute('class', outside_state.shapes[CENTRE]);
    elem = document.querySelector("#shape-right");
    elem.setAttribute('class', outside_state.shapes[RIGHT]);

    elem = document.querySelector("#left-selected");
    if (outside_state.dissected_loc == LEFT) {
        elem.setAttribute('class', 'pedestal-glow');
    }
    else {
        elem.setAttribute('class', 'pedestal-not-glow');
    }
    elem = document.querySelector("#centre-selected");
    if (outside_state.dissected_loc == CENTRE) {
        elem.setAttribute('class', 'pedestal-glow');
    }
    else {
        elem.setAttribute('class', 'pedestal-not-glow');
    }
    elem = document.querySelector("#right-selected");
    if (outside_state.dissected_loc == RIGHT) {
        elem.setAttribute('class', 'pedestal-glow');
    }
    else {
        elem.setAttribute('class', 'pedestal-not-glow');
    }

    // show/hide ghosts outside
    elem = document.querySelector("#ghosts-layer");
    if (outside_state.ghosts_present) {
        elem.setAttribute('style', "display: block");
    }
    else {
        elem.setAttribute('style', "display: none");
    }
    // show spawn statue circle (or show only glow, if that's active.)
    for (var i = 0; i < 6; i++) {
        elem = document.querySelector("#outside-guardian-statue-" + (i+1));
        if ((outside_state.ghosts_present || outside_state.ghost_held) && [GUARDIAN_A, GUARDIAN_B, GUARDIAN_C].includes(outside_state.spawn_statues[i])) {
            // one of the inside people
            elem.setAttribute('class', 'invisible_guardian');
            elem = document.querySelector("#outside-glow-" + (i+1));
            elem.setAttribute('class', 'pedestal-glow');
        }
        else {
            elem.setAttribute('class', outside_state.spawn_statues[i]);
            elem = document.querySelector("#outside-glow-" + (i+1));
            elem.setAttribute('class', 'pedestal-not-glow');
        }
    }
}

function redraw_screen() {
    if (interleave_modes) {
        elem = document.querySelector("#holder-options-choose-full");
        elem.setAttribute('class', 'this-is-a-button enabled-mode');
        if (current_phase == PHASE_OUTSIDE) {
            elem = document.querySelector("#holder-options-choose-outside");
            elem.setAttribute('class', 'this-is-a-button incidental-enabled-mode');
            elem = document.querySelector("#holder-options-choose-inside");
            elem.setAttribute('class', 'this-is-a-button');
        }
        else {
            elem = document.querySelector("#holder-options-choose-outside");
            elem.setAttribute('class', 'this-is-a-button');
            elem = document.querySelector("#holder-options-choose-inside");
            elem.setAttribute('class', 'this-is-a-button incidental-enabled-mode');
        }
    }
    else {
        elem = document.querySelector("#holder-options-choose-full");
        elem.setAttribute('class', 'this-is-a-button');
        if (current_phase == PHASE_OUTSIDE) {
            elem = document.querySelector("#holder-options-choose-outside");
            elem.setAttribute('class', 'this-is-a-button enabled-mode');
            elem = document.querySelector("#holder-options-choose-inside");
            elem.setAttribute('class', 'this-is-a-button');
        }
        else {
            elem = document.querySelector("#holder-options-choose-outside");
            elem.setAttribute('class', 'this-is-a-button');
            elem = document.querySelector("#holder-options-choose-inside");
            elem.setAttribute('class', 'this-is-a-button enabled-mode');
        }
    }
    show_training();
    elem = document.querySelector("#round-end-screen");
    if (victory_state && !victory_seen) {
        elem.showModal();
        elem = document.querySelector("#round-end-title");
        victory_seen = true;
        if (victory_state == END_DEFEAT) {
            losses += 1;
            winstreak = 0;
            elem.innerHTML = "<b>Defeat...</b>";
            elem = document.querySelector("#round-end-text");
            elem.innerHTML = end_explanatory_text;
        }
        else {
            wins += 1;
            winstreak += 1;
            elem.innerHTML = "<b>Victory!</b>";
            elem = document.querySelector("#round-end-text");
            elem.innerHTML = "You successfully did your part.";
        }
    }
    draw_scores();
    if (current_phase == PHASE_INSIDE) {
        draw_inside();
    }
    if (current_phase == PHASE_OUTSIDE) {
        draw_outside();
    }
}

function hide_round_end() {
    elem = document.querySelector("#round-end-screen");
    elem.close();
}

function is_tutorial_step_active(inherited_elem, inherited_query, activation_character="&gt;") {
    if (inherited_query) {
        elem.setAttribute("class", "tutorial-step current-tutorial-step");
        elem.innerHTML = activation_character;
    }
    else {
        elem.setAttribute("class", "tutorial-step");
        elem.innerHTML = "-"
    }
}

function show_training() {
    if (training_active) {
        var query_boolean;
        elem = document.querySelector("#holder-options-choose-training");
        elem.setAttribute('class', 'this-is-a-button incidental-enabled-mode');
        elem = document.querySelector("#tutorial-panes");
        elem.setAttribute('class', 'active');
        if (current_phase == PHASE_OUTSIDE) {
            elem = document.querySelector("#outside-steps");
            elem.setAttribute('style', 'display: block');
            elem = document.querySelector("#inside-steps");
            elem.setAttribute('style', 'display: none');
            // outside knight-time?
            elem = document.querySelector("#outside-step-knight");
            query_boolean = !outside_state.knight_splinters.includes(CIRCLE)
                         && !outside_state.knight_splinters.includes(TRIANGLE)
                         && !outside_state.knight_splinters.includes(SQUARE)
                         && outside_state.shape_held == null;
            is_tutorial_step_active(elem, query_boolean, "?");
            // outside splinter-time?
            elem = document.querySelector("#outside-step-splinter");
            query_boolean = ( outside_state.knight_splinters.includes(CIRCLE)
                           || outside_state.knight_splinters.includes(TRIANGLE)
                           || outside_state.knight_splinters.includes(SQUARE)
                         ) && outside_state.shape_held == null;
            is_tutorial_step_active(elem, query_boolean);
            // outside dissecting-time?
            elem = document.querySelector("#outside-step-dissect");
            query_boolean = false;
            for (var i = LEFT; i <= RIGHT; i++) {
                query_boolean |= (outside_state.shapes[i] != combine_shapes(outside_state.inside_callout[(i+1) % 3], outside_state.inside_callout[(i+2) % 3]))
            }
            query_boolean = outside_state.shape_held != null && query_boolean;
            is_tutorial_step_active(elem, query_boolean);
            // outside ogres?
            elem = document.querySelector("#outside-step-ogres");
            query_boolean = outside_state.ogres[LEFT] != null || outside_state.ogres[RIGHT] != null
            is_tutorial_step_active(elem, query_boolean);
            // outside ghosts
            // grabbing?
            elem = document.querySelector("#outside-step-ghost-grab");
            query_boolean = outside_state.ghosts_present;
            is_tutorial_step_active(elem, query_boolean);
            // dropping?
            elem = document.querySelector("#outside-step-ghost-deposit");
            query_boolean = outside_state.ghost_held;
            is_tutorial_step_active(elem, query_boolean);
        }
        else {
            elem = document.querySelector("#outside-steps");
            elem.setAttribute('style', 'display: none');
            elem = document.querySelector("#inside-steps");
            elem.setAttribute('style', 'display: block');
            if (fast_strat) {
                elem = document.querySelector("#inside-steps-faststrat");
                elem.setAttribute('style', 'display: block');
                elem = document.querySelector("#inside-steps-slowstrat");
                elem.setAttribute('style', 'display: none');
                var shadowcount = (inside_state.shadows[LEFT] + inside_state.shadows[CENTRE] + inside_state.shadows[RIGHT]);
                var knight_present = inside_state.knight_splinters.every((x) => {return (!x || x == KNIGHT)});
                var splinter_present = !inside_state.ogre && !inside_state.knight_splinters.every((x) => {return (!x || x == KNIGHT)});
                // time to kill knight?
                elem = document.querySelector("#inside-fast-step-knight");
                query_boolean = ((inside_state.shape_held == null    || shadowcount == 1)
                              && (knight_present                     || inside_state.ogre)
                              && (inside_state.inventory.length != 0 || inside_state.waiting_shapes.length != 0)
                             && !inside_state.ghost_time);
                is_tutorial_step_active(elem, query_boolean);
                // time to pick up a splinter?
                elem = document.querySelector("#inside-fast-step-splinter");
                query_boolean = splinter_present;
                is_tutorial_step_active(elem, query_boolean);
                // got a splinter to register?
                elem = document.querySelector("#inside-fast-step-register");
                query_boolean = inside_state.sent_symbols.length < 2 && inside_state.shape_held != null;
                is_tutorial_step_active(elem, query_boolean);
                // time to announce?
                elem = document.querySelector("#inside-fast-step-announce");
                query_boolean = inside_state.ghost_time;
                is_tutorial_step_active(elem, query_boolean);
                // time to leave?
                elem = document.querySelector("#inside-fast-step-exit");
                query_boolean = !inside_state.ghost_time
                             && shadowcount == 1
                             && (inside_state.inventory.length != 0 || inside_state.waiting_shapes.length != 0);
                is_tutorial_step_active(elem, query_boolean);
            }
            else { // slow-strat
                elem = document.querySelector("#inside-steps-faststrat");
                elem.setAttribute('style', 'display: none');
                elem = document.querySelector("#inside-steps-slowstrat");
                elem.setAttribute('style', 'display: block');
                var stuff_to_sort = inside_state.yet_sorting && inside_state.possess_another_shape();
                var my_shape = inside_state.guardian_shapes[inside_state.position]
                var knight_or_mine = [KNIGHT, my_shape];
                var all_shapes = inside_state.list_of_all_shapes();
                // knight?
                elem = document.querySelector("#inside-slow-step-knight");
                // if we are sorting and can't see a splinter to hand away
                // OR
                // if we have sorted and can't see a splinter to split away
                // OR
                // if we have sorted and split and there is a knight alive.
                var stuff_to_sort_that_isnt_on_ground = stuff_to_sort
                                           && knight_or_mine.includes(inside_state.knight_splinters[LEFT])
                                           && knight_or_mine.includes(inside_state.knight_splinters[RIGHT]);
                var stuff_to_split_that_isnt_on_ground = !inside_state.yet_sorting
                                               && inside_state.held_shape == null
                                               && all_shapes.includes(my_shape)
                                               && inside_state.knight_splinters[LEFT] != my_shape
                                               && inside_state.knight_splinters[RIGHT] != my_shape;
                var stuff_to_exit_that_isnt_on_ground = !inside_state.yet_sorting
                                               && !all_shapes.includes(my_shape)
                                               && (inside_state.knight_splinters.includes(KNIGHT)
                                                || inside_state.ogre);
                query_boolean = (stuff_to_sort_that_isnt_on_ground
                              || stuff_to_split_that_isnt_on_ground
                              || stuff_to_exit_that_isnt_on_ground
                                );
                is_tutorial_step_active(elem, query_boolean);
                // sorting splinter?
                elem = document.querySelector("#inside-slow-step-splinter");
                query_boolean = inside_state.shape_held == null &&
                               (!knight_or_mine.includes(inside_state.knight_splinters[LEFT]) ||
                                !knight_or_mine.includes(inside_state.knight_splinters[RIGHT]) );
                is_tutorial_step_active(elem, query_boolean && stuff_to_sort);
                // sorting register?
                elem = document.querySelector("#inside-slow-step-register");
                query_boolean = inside_state.yet_sorting
                             && inside_state.shape_held != my_shape
                             && inside_state.shape_held != null
                             && SPLINTERS_LOCS.includes(inside_state.shape_held);
                is_tutorial_step_active(elem, query_boolean);
                // call for sort?
                elem = document.querySelector("#inside-slow-step-call-for-split");
                query_boolean = inside_state.yet_sorting && all_shapes.every( (x) => (x == my_shape) );
                is_tutorial_step_active(elem, query_boolean);
                // splitting?
                elem = document.querySelector("#inside-slow-step-split");
                query_boolean = !inside_state.yet_sorting &&
                                (inside_state.shape_held == my_shape ||
                                 inside_state.knight_splinters[LEFT] == my_shape ||
                                 inside_state.knight_splinters[RIGHT] == my_shape);
                is_tutorial_step_active(elem, query_boolean);
                // noticed?
                elem = document.querySelector("#inside-slow-step-announce");
                query_boolean = inside_state.ghost_time;
                is_tutorial_step_active(elem, query_boolean);
                // statue-calling?
                elem = document.querySelector("#inside-slow-step-exit");
                query_boolean = !inside_state.ghost_time && !all_shapes.includes(my_shape);
                is_tutorial_step_active(elem, query_boolean);
            }
        }
    }
    else {
        elem = document.querySelector("#holder-options-choose-training");
        elem.setAttribute('class', 'this-is-a-button');
        elem = document.querySelector("#tutorial-panes");
        elem.removeAttribute('class');
    }
}

elem = document.querySelector("#options-choose-inside");
elem.setAttribute('onclick', "choose_one_only(PHASE_INSIDE)");
elem = document.querySelector("#options-choose-outside");
elem.setAttribute('onclick', "choose_one_only(PHASE_OUTSIDE)");
elem = document.querySelector("#options-choose-full");
elem.setAttribute('onclick', "choose_full_encounter()");
elem = document.querySelector("#sorting");
elem.setAttribute('onclick', "switch_inside_strat()");

function switch_inside_strat() {
    elem = document.querySelector("#sorting");
    fast_strat = elem.checked;
    if (current_phase == PHASE_INSIDE || interleave_modes) {
        continue_current_mode();
        reset_scores();
    }
    redraw_screen();
}

elem = document.querySelector("#score-reset");
elem.setAttribute('onclick', "continue_current_mode(); reset_scores();");

elem = document.querySelector("#options-choose-tutorial");
elem.setAttribute('onclick', "show_tutorial(); draw_giant_text_thing()");
elem = document.querySelector("#close-explanation-screen");
elem.setAttribute('onclick', "close_tutorial()");
elem = document.querySelector("#explanation-screen");
elem.setAttribute('onclick', "draw_giant_text_thing()");

var tutorial_pane = false;

function show_tutorial() {
    elem = document.querySelector("#explanation-screen");
    tutorial_pane = true;
    elem.showModal();
}
function close_tutorial() {
    elem = document.querySelector("#explanation-screen");
    elem.close();
}

function draw_giant_text_thing() {
    elem = document.querySelector("#explanation-page-texts");
    var all_elem = elem.querySelectorAll("div")
    for (var i = 0; i < all_elem.length; i++) {
        all_elem[i].setAttribute('style', 'display: none');
    }
    elem = document.querySelector("#explanation-page-select :checked");
    elem = document.querySelector("div#"+elem.id)
    elem.setAttribute('style', 'display: block');
}

elem = document.querySelector("#options-choose-training");
elem.setAttribute('onclick', "activate_training()");

function activate_training() {
    training_active = !training_active;
    wins = 0;
    losses = 0;
    winstreak = 0;
    redraw_screen();
}

elem = document.querySelector("#round-end-screen");
elem.setAttribute('onclose', "continue_current_mode(); redraw_screen();");
elem = document.querySelector("#round-end-button");
elem.setAttribute('onclick', "hide_round_end();");

elem = document.querySelector("#knight-inside-left .knight");
elem.setAttribute('onclick', "inside_state.kill_knight(LEFT)");
elem = document.querySelector("#knight-inside-left .splinter");
elem.setAttribute('onclick', "inside_state.pickup(LEFT)");
elem = document.querySelector("#knight-inside-right .knight");
elem.setAttribute('onclick', "inside_state.kill_knight(RIGHT)");
elem = document.querySelector("#knight-inside-right .splinter");
elem.setAttribute('onclick', "inside_state.pickup(RIGHT)");
elem = document.querySelector("#ogre-inside");
elem.setAttribute('onclick', "inside_state.kill_ogre()");

elem = document.querySelector("#guardian-left-inside");
elem.setAttribute('onclick', "inside_state.register(LEFT)");
elem = document.querySelector("#guardian-centre-inside");
elem.setAttribute('onclick', "inside_state.register(CENTRE)");
elem = document.querySelector("#guardian-right-inside");
elem.setAttribute('onclick', "inside_state.register(RIGHT)");

elem = document.querySelector("#inside-statue-1");
elem.setAttribute('onclick', "inside_state.ghost_callout(0)");
elem = document.querySelector("#inside-statue-2");
elem.setAttribute('onclick', "inside_state.ghost_callout(1)");
elem = document.querySelector("#inside-statue-3");
elem.setAttribute('onclick', "inside_state.ghost_callout(2)");
elem = document.querySelector("#inside-statue-4");
elem.setAttribute('onclick', "inside_state.ghost_callout(3)");
elem = document.querySelector("#inside-statue-5");
elem.setAttribute('onclick', "inside_state.ghost_callout(4)");
elem = document.querySelector("#inside-statue-6");
elem.setAttribute('onclick', "inside_state.ghost_callout(5)");

elem = document.querySelector("#leave");
elem.setAttribute('onclick', "inside_state.leave()");
elem = document.querySelector("#wait-for-sort");
elem.setAttribute('onclick', "inside_state.wait_for_sort()");


elem = document.querySelector("#knight-outside-left .knight");
elem.setAttribute('onclick', "outside_state.kill(LEFT)");
elem = document.querySelector("#knight-outside-left .splinter");
elem.setAttribute('onclick', "outside_state.pickup(LEFT)");
elem = document.querySelector("#knight-outside-centre .knight");
elem.setAttribute('onclick', "outside_state.kill(CENTRE)");
elem = document.querySelector("#knight-outside-centre .splinter");
elem.setAttribute('onclick', "outside_state.pickup(CENTRE)");
elem = document.querySelector("#knight-outside-right .knight");
elem.setAttribute('onclick', "outside_state.kill(RIGHT)");
elem = document.querySelector("#knight-outside-right .splinter");
elem.setAttribute('onclick', "outside_state.pickup(RIGHT)");

elem = document.querySelector("#ogre-outside-left");
elem.setAttribute('onclick', "outside_state.kill_ogre(LEFT)");
elem = document.querySelector("#ogre-outside-right");
elem.setAttribute('onclick', "outside_state.kill_ogre(RIGHT)");

elem = document.querySelector("#ghost-1");
elem.setAttribute('onclick', "outside_state.pickup_ghost(LEFT)");
elem = document.querySelector("#ghost-2");
elem.setAttribute('onclick', "outside_state.pickup_ghost(CENTRE)");
elem = document.querySelector("#ghost-3");
elem.setAttribute('onclick', "outside_state.pickup_ghost(RIGHT)");

elem = document.querySelector("#statue-left-outside");
elem.setAttribute('onclick', "outside_state.dissect(LEFT)");
elem = document.querySelector("#guardian-left-outside");
elem.setAttribute('class', 'nonplayer_guardian');
elem = document.querySelector("#statue-centre-outside");
elem.setAttribute('onclick', "outside_state.dissect(CENTRE)");
elem = document.querySelector("#guardian-centre-outside");
elem.setAttribute('class', 'nonplayer_guardian');
elem = document.querySelector("#statue-right-outside");
elem.setAttribute('onclick', "outside_state.dissect(RIGHT)");
elem = document.querySelector("#guardian-right-outside");
elem.setAttribute('class', 'nonplayer_guardian');

elem = document.querySelector("#outside-statue-1");
elem.setAttribute('onclick', "outside_state.place_ghost(0)");
elem = document.querySelector("#outside-statue-2");
elem.setAttribute('onclick', "outside_state.place_ghost(1)");
elem = document.querySelector("#outside-statue-3");
elem.setAttribute('onclick', "outside_state.place_ghost(2)");
elem = document.querySelector("#outside-statue-4");
elem.setAttribute('onclick', "outside_state.place_ghost(3)");
elem = document.querySelector("#outside-statue-5");
elem.setAttribute('onclick', "outside_state.place_ghost(4)");
elem = document.querySelector("#outside-statue-6");
elem.setAttribute('onclick', "outside_state.place_ghost(5)");

elem = document.querySelector("#wait");
elem.setAttribute('onclick', "outside_state.wait()");


elem = document.querySelector("#quiz-area");
elem.setAttribute('onclick', "redraw_screen()");

choose_one_only(PHASE_OUTSIDE);

