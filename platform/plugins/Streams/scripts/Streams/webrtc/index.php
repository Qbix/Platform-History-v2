<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <title>Video Conference</title>
    <meta name="description" content="">
    <meta name="viewport" content="minimal-ui, shrink-to-fit=no, width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
    <link href='http://fonts.googleapis.com/css?family=Roboto:400' rel='stylesheet' type='text/css'>
    <link rel="stylesheet" href="src/css/main.css">
</head>
<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/1.7.3/socket.io.js"></script>
<script src="https://requirejs.org/docs/release/2.2.0/minified/require.js"></script>
<script type="text/javascript" src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
<script>
    window.onload = function() {
        loadcss('src/css/main.css?t=' + (+new Date));
        loadjs('src/js/app.js?t=' + (+new Date));
    }
    function loadjs(file) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = file;
        script.onload = function(){
        };
        document.body.appendChild(script);
    }

    function loadcss(file) {
        var stylesheet = document.createElement("link");
        stylesheet.type = "text/css";
        stylesheet.rel = 'stylesheet';
        stylesheet.href = file;
        stylesheet.media = 'screen,print';
        stylesheet.onload = function(){
        };
        document.head.appendChild(stylesheet);
    }
</script>
</body>
</html>
