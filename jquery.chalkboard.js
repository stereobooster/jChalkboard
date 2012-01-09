/**
 * jChalkboard v0.04
 * https://github.com/stereobooster/jChalkboard
 */

;(function ( $, undefined ) {

    var pluginName = "chalkboard",
        defaults = {
            chalk: "rgba(255, 255, 255, .7)",
            board: "rgba(5, 5, 5, 1)",
            interval: 50,
            optimize: true
        };

    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options) ;
        
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();
    }

    function now(){
        return (new Date).getTime();
    }

    Plugin.prototype = {
        mouse_down: false,
        last_x: undefined,
        last_y: undefined,
        ctx: undefined,
        width: undefined,
        height: undefined,
        undo_history: [],
        redo_history: [],
        brush: undefined,

        init: function () {

            var that = this,
            ctx = this.element.getContext("2d");
            this.width = ctx.canvas.width;
            this.height = ctx.canvas.height;
            this.ctx = ctx;

            this.set_brush();

            $("body").bind("mouseup", function (e) {
                that.clear_ui();
            });

            $(this.element).bind("mousedown", function (e) {
                e.preventDefault();
                e.stopPropagation();
                that.mouse_down = true;
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
        },

        set_brush: function (brush, color) {
            this.set_brush_raw(brush, color);
            this.record_brush();
        },

        set_brush_raw: function (brush, color) {
            if (brush == 'sponge' || brush == 'brush_sponge') {
                this.brush = 'brush_sponge';
                if (!color) {
                    color = this.options.board;
                }
            } else {
                this.brush = 'brush_chalk';
                if (!color) {
                    color = this.options.chalk;
                }
            }
            this.ctx.fillStyle = color;
            this.color = color;
        },
        
        record_brush: function () {
            if(this.record_flag){
                var time = now() - this.start;
                this.record_story.push([
                    time,
                    this.brush,
                    this.color
                    ]);
            }
        },

        record: function () {
            this.start = now();
            this.record_flag = true;
            this.record_story = [];
            if (this.options.optimize) {
                this.record_story = [[this.options.interval]];
            }
            this.record_brush();
        },

        record_stop: function () {
            this.record_flag = false;
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
                animation,
                interval;

            if (row && row.length == 1) {
                 interval = row[0];
                 i++;
            }

            animation = function () {
                time = now() - start_animation;
                while (true) {
                    row = record[i];
                    if (row) {
                        record_time = row[0]; 
                        if (interval) {
                            record_time = record_time * interval;
                        }
                        if(record_time < time) {
                            if (row.length == 3) {
                                brush = row[1];
                                that.set_brush_raw(row[1], row[2]);
                            } else {
                                that.draw_raw(row[1], row[2], row[3], row[4], brush);
                            }
                            i++;
                        } else {
                            if (i < record.length){
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

            animation();
        },

        clear_ui:function(){
            this.last_x = undefined;
            this.last_y = undefined;
            this.mouse_down = false;
        },

        clear_to_undo:function(){
            var d = this.ctx.getImageData(0,0,this.width, this.height);    
            this.undo_history.unshift(d);
            this.ctx.clearRect(0,0,this.width,this.height);
        },

        save:function(){
            var d = this.ctx.getImageData(0,0,this.width, this.height);    
            this.undo_history.unshift(d);
            this.redo_history = [];
        },

        undo:function(){
            this.clear_ui();
            if (this.undo_history.length > 0){
                var d = this.ctx.getImageData(0,0,this.width, this.height);    
                this.redo_history.unshift(d);

                this.ctx.clearRect(0,0,this.width,this.height);
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
            this.draw_raw(x, y, this.last_x, this.last_y, this.brush);
            if (this.record_flag) {
                var time = now() - this.start;
                if (this.options.optimize) {
                    time = Math.floor(time / this.options.interval); 
                }
                this.record_story.push([
                    time,
                    this.last_x, this.last_y,
                    x, y
                    ]);
            }
            this.last_x = x;
            this.last_y = y;
        },

        draw_raw: function (x, y, last_x, last_y, brush) {
            if (last_x & last_y){
                var dx = last_x-x,
                dy = last_y-y,
                d = Math.abs(dx)+Math.abs(dy),
                n = Math.ceil(Math.abs(d)/4),
                i, nx, ny;
                for (i=0; i<n; i++){
                    nx = x+dx*(i/n);
                    ny = y+dy*(i/n);
                    (this[brush])(nx, ny, 7);
                }
            } else {
                (this[brush])(nx, ny, 7);
            }
        },

        brush_chalk:function(x,y,w){
            var i, nx, ny, d;
            for (i=0; i<20; i++){
                nx = Math.random()*w-w/2;
                ny = Math.random()*w-w/2;
                d = (nx+ny)/w;
                nx = Math.ceil(nx-d + x);
                ny = Math.ceil(ny-d + y);
                this.ctx.fillRect(nx,ny,1,1);
            }
        },

        brush_sponge:function(x,y,w){
            this.ctx.beginPath();
            this.ctx.arc(x, y, 10, 0, Math.PI*2, true); 
            this.ctx.closePath();
            this.ctx.fill();
        }

    }

    $.fn[pluginName] = function ( command, options ) {
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
                plug.set_brush(command, options);
            } else if (command == "sponge") {
                plug.set_brush(command);
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
            }
        });
    }

})(jQuery);
