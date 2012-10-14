# jChalkboard

## Acknowledgements

Code based on [chalkboard-js](https://bitbucket.org/jlm/chalkboard-js) and [jQuery Boilerplate](/zenorocha/jquery-boilerplate/)

## Demo

see `index.html`

## Usage

Add jQuery and jChalkboard

```html
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js"></script>
<script src="jquery.chalkboard.js"></script>
```

```javascript
$(function(){ 
$('#board')
    .chalkboard({
        board_color: '#244b1c',
        chalk_width: 5
    });
});
```

## Canvas fallback

https://github.com/Modernizr/Modernizr/wiki/HTML5-Cross-browser-Polyfills

## TODO

  - implement eraser (sponge) with the help of `context.globalCompositeOperation = "destination-out"`
  - implement `background` option
  - add chalkboard backgrounds [link](http://foolishfire.com/2012/09/11/free-downloadable-chalkboard-backgrounds/)
  - add origin check for `image.php`
  - add online demo
  - document API (`play`, `recodrd` e.t.c)
  - jshint
  - rack application as alternative to php script