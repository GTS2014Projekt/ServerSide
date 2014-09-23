var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
//needed for logo
var favicon = require('serve-favicon');

// Database
var mongo = require('mongoskin');
var db = mongo.db("mongodb://localhost:27017/geofencing", {native_parser:true});

var routes = require('./routes/index');
var functions = require('./routes/functions');

var app = express();

// view engine setup
app.set('view engine', 'jade');
//route of jade scripts
app.set('views', path.join(__dirname, 'views'));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public/images/', express.static(__dirname + '/public/images/'));
//route of the favicon
app.use(favicon(path.join(__dirname, 'public','images','favicon.ico')));

// Make db accessible to our router
app.use(function(req,res,next){
    req.db = db;
    next();
});

//Make scripts accessible
app.use('/', routes);
app.use('/functions', functions);

// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;