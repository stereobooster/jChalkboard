/**
 * jChalkboard v0.01
 * https://github.com/stereobooster/jChalkboard
 */

;(function ( $, undefined ) {

    var pluginName = "chalkboard",
        defaults = {
            chalk: "rgba(255, 255, 255, .7)"
        };

    function Plugin( element, options ) {
        this.element = element;

        this.options = $.extend( {}, defaults, options) ;
        
        this._defaults = defaults;
        this._name = pluginName;
        
        this.init();
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

        init: function () {

            var that = this,
            ctx = this.element.getContext("2d");
            ctx.fillStyle = this.options.chalk;
            this.width = ctx.canvas.width;
            this.height = ctx.canvas.height;
            this.ctx = ctx;

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

        draw:function(x, y){
            if (this.last_x & this.last_y){
                var dx = this.last_x-x,
                dy = this.last_y-y,
                d = Math.abs(dx)+Math.abs(dy),
                n = Math.ceil(Math.abs(d)/4),
                i, nx, ny;
                for (i=0; i<n; i++){
                    nx = x+dx*(i/n);
                    ny = y+dy*(i/n);
                    this.brush_chulk(nx, ny, 7);
                }
            } else {
                this.brush_chulk(x, y, 7);
            }
            this.last_x = x;
            this.last_y = y;
        },

        brush_chulk:function(x,y,w){
            var i, nx, ny, d;
            for (i=0; i<20; i++){
                nx = Math.random()*w-w/2;
                ny = Math.random()*w-w/2;
                d = (nx+ny)/w;
                nx = Math.ceil(nx-d + x);
                ny = Math.ceil(ny-d + y);
                this.ctx.fillRect(nx,ny,1,1);
            }
        }

    }

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            var plug = $.data(this, "plugin_" + pluginName);
            if (!plug) {
                plug = new Plugin( this, options );
                $.data(this, "plugin_" + pluginName, plug);
            }
            if (options == "undo"){
                plug.undo();
            } else if (options == "redo") {
                plug.redo();
            } else if (options == "clear") {
                plug.clear_to_undo();
            }
        });
    }

})(jQuery);
