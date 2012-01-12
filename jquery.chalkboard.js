/**
 * jChalkboard v0.08
 * https://github.com/stereobooster/jChalkboard
 */

;(function ( $, window, undefined ) {

    var pluginName = "chalkboard",
        document = window.document,
        defaults = {
            chalk_color: "rgba(255, 255, 255, .7)",
            chalk_width: 7,
            chalk_density: .4,
            board_color: "rgba(5, 5, 5, 1)",
            sponge_width: 40,
            interval: 50,
            optimize: 1,
            save_url: "/image.php",
            save_file_name: 0
        },
        now = function () {
            return (new Date).getTime();
        };

    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options) ;
        
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();
    }

    Plugin.prototype = {
        mouse_down: 0,
        last_x: undefined,
        last_y: undefined,
        ctx: undefined,
        width: undefined,
        height: undefined,
        undo_history: [],
        redo_history: [],
        brush: undefined,

        init: function () {

            this.canvas_support_test();

            if (!this.canvas) {
                this.element.addclass("no-canvas");
            } else {
                var that = this,
                    ctx = this.element.getContext("2d");

                this.width = ctx.canvas.width;
                this.height = ctx.canvas.height;

                ctx.fillStyle = this.options.board_color;            
                ctx.fillRect(0, 0, this.width, this.height);
                this.ctx = ctx;            

                this.set_brush();

                $("body").bind("mouseup", function (e) {
                    that.clear_ui();
                });

                $(this.element).bind("mousedown", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    that.mouse_down = 1;
                    that.save();
                }).bind("mouseleave", function () {
                    that.last_x = undefined;  
                    that.last_y = undefined;  
                }).bind("mousemove", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!that.mouse_down){
                        return;
                    }
                    var x = e.pageX - that.element.offsetLeft,
                        y = e.pageY - that.element.offsetTop;
                    that.draw(x,y);
                });                
            }

        },

        set_brush: function (brush, color, width) {
            if (brush == "sponge" || brush == "brush_sponge") {
                brush = "brush_sponge";
                if (!color) {
                    color = this.options.board_color;
                }
                if (!width) {
                    width = this.options.sponge_width;
                }
            } else {
                brush = "brush_chalk";
                if (!color) {
                    color = this.options.chalk_color;
                }
                if (!width) {
                    width = this.options.chalk_width;
                }
            }
            this.brush = brush;
            this.brush_width = width;
            this.color = color;
            this.set_brush_raw(color);
            this.record_brush();
        },

        record_brush: function(){
            if(this.record_flag){
                if (!this.start) {
                    this.start = now();
                }
                var time = now() - this.start;
                if (this.options.optimize) {
                    time = Math.floor(time / this.options.interval); 
                }
                this.record_story.push([
                    time,
                    this.color,
                    this.brush,
                    this.brush_width
                    ]);
            }
        },

        set_brush_raw: function (color) {
            this.ctx.fillStyle = color;
        },

        record: function () {
            this.start = undefined;
            this.record_flag = 1;
            this.record_story = [];
            if (this.options.optimize) {
                this.record_story = [[this.options.interval]];
            }
            this.record_brush();
            this.start = undefined; //start record timer from first user action
        },

        record_stop: function () {
            this.record_flag = 0;
            return this.record_story;
        },

        play: function (record) {
            if (!record) {
                record = this.record_story;
            }
            var start_animation = now(),
                time,
                record_time,
                i = 0,
                row = record[i],
                that = this,
                brush,
                width,
                animation,
                interval;

            if (row && row.length == 1) {
                 interval = row[0];
                 i++;
            }

            animation = function () {
                time = now() - start_animation;
                while (1) {
                    row = record[i];
                    if (row) {
                        record_time = row[0]; 
                        if (interval) {
                            record_time = record_time * interval;
                        }
                        if(record_time < time) {
                            if (row.length == 4) {
                                that.set_brush_raw(row[1]);
                                brush = row[2];
                                width = row[3];
                            } else {
                                that.draw_raw(row[1], row[2], row[3], row[4], brush, width);
                            }
                            i++;
                        } else {
                            if (i < record.length) {
                                setTimeout(animation, interval ? interval : that.options.interval);
                            }
                            break;
                        }
                        if (i >= record.length) {
                            break;
                        }
                    }
                }
            };

            if (record.length > i) {
                animation();   
            }
        },

        clear_ui:function(){
            this.last_x = undefined;
            this.last_y = undefined;
            this.mouse_down = 0;
        },

        clear_to_undo:function(){
            var d = this.ctx.getImageData(0, 0, this.width, this.height);    
            this.undo_history.unshift(d);

            var color = this.ctx.fillStyle;
            this.ctx.fillStyle = this.options.board_color;            
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = color;
        },

        save:function(){
            var d = this.ctx.getImageData(0, 0, this.width, this.height);    
            this.undo_history.unshift(d);
            this.redo_history = [];
        },

        undo:function(){
            this.clear_ui();
            if (this.undo_history.length > 0){
                var d = this.ctx.getImageData(0, 0, this.width, this.height);    
                this.redo_history.unshift(d);

                this.ctx.clearRect(0, 0, this.width, this.height);
                d = this.undo_history.shift();
                this.ctx.putImageData(d, 0, 0);
            }
        },

        redo:function(){
            this.clear_ui();
            if (this.redo_history.length > 0){
                this.clear_to_undo();
                var d = this.redo_history.shift();
                this.ctx.putImageData(d, 0, 0);
            }
        },

        draw: function (x, y) {
            this.draw_raw(this.last_x, this.last_y, x, y, this.brush, this.brush_width);
            if (this.record_flag) {
                if (!this.start) {
                    this.start = now();
                }
                var time = now() - this.start;
                if (this.options.optimize) {
                    time = Math.floor(time / this.options.interval); 
                }
                this.record_story.push([
                    time,
                    this.last_x == undefined ? -1 : this.last_x, // -1 shorter than null
                    this.last_y == undefined ? -1 : this.last_y,
                    x, y
                    ]);
            }
            this.last_x = x;
            this.last_y = y;
        },

        draw_raw: function (last_x, last_y, x, y, brush, width) {
            if (last_x >= 0 && last_y >= 0){
                var dx = last_x - x,
                    dy = last_y - y,
                    d = Math.abs(dx) + Math.abs(dy),
                    n = Math.ceil(Math.abs(d)/4),
                    i, nx, ny;
                for (i = 0; i < n; i++){
                    nx = x + dx*(i/n);
                    ny = y + dy*(i/n);
                    (this[brush])(nx, ny, width);
                }
            } else {
                (this[brush])(x, y, width);
            }
        },

        brush_chalk: function(x, y, w) {
            var i, nx, ny, d,
                i_max = Math.ceil(w*w*this.options.chalk_density);
            for (i = 0; i < i_max; i++){
                nx = Math.random()*w - w/2;
                ny = Math.random()*w - w/2;
                d = (nx + ny)/w;
                nx = Math.ceil(nx - d + x);
                ny = Math.ceil(ny - d + y);
                this.ctx.fillRect(nx, ny, 1, 1);
            }
        },

        brush_sponge: function(x, y, w) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, Math.ceil(w/2), 0, Math.PI*2, true); 
            this.ctx.closePath();
            this.ctx.fill();
        },

        save_to_file: function() {
            // var data = this.element.toDataURL("image/png");
            // document.location.href = data.replace("image/png", "image/octet-stream");
            $.ajax({
                url: this.options.save_url,
                data: {
                    data: data,
                    file: this.options.save_file_name
                },
                type: "POST"
            })
        },

        canvas_support_test: function() {
            var canvas = document.createElement("canvas");
            this.canvas = !!(canvas.getContext && canvas.getContext("2d"));
            this.toDataURL = !!canvas.toDataURL;
        }

    }

    $.fn[pluginName] = function ( command, options, width ) {
        return this.each(function () {
            var plug = $.data(this, "plugin_" + pluginName);
            if (!plug) {
                plug = new Plugin( this, command );
                $.data(this, "plugin_" + pluginName, plug);
            }
            if (command == "undo"){
                plug.undo();
            } else if (command == "redo") {
                plug.redo();
            } else if (command == "clear") {
                plug.clear_to_undo();
            } else if (command == "chalk") {
                plug.set_brush(command, options, width);
            } else if (command == "sponge") {
                plug.set_brush(command, undefined, options);
            } else if (command == "record") {
                plug.record();
            } else if (command == "stop") {
                if (options) {
                    options.record = plug.record_stop();
                } else {
                    plug.record_stop();
                }
            } else if (command == "play") {
                plug.play(options);
            } else if (command == "save") {
                plug.save_to_file();
            }
        });
    }

})(jQuery, window);
