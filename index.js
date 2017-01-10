var express = require('express');
var handlebars = require('express-handlebars');
var multer = require('multer');
var _ = require('lodash');
require('dotenv').config();

var app = express();

app.engine('.hbs', handlebars({
	extname: '.hbs',
	helpers: {
		ifCond: function (v1, operator, v2, options) {
			switch (operator) {
				case '===':
					return (v1 === v2) ? options.fn(this) : options.inverse(this);
				case '==':
					return (v1 == v2) ? options.fn(this) : options.inverse(this);
				case '!==':
					return (v1 !== v2) ? options.fn(this) : options.inverse(this);
				case '&&':
					return (v1 && v2) ? options.fn(this) : options.inverse(this);
				case '||':
					return (v1 || v2) ? options.fn(this) : options.inverse(this);
				case '<':
					return (v1 < v2) ? options.fn(this) : options.inverse(this);
				case '<=':
					return (v1 <= v2) ? options.fn(this) : options.inverse(this);
				case '>':
					return (v1 > v2) ? options.fn(this) : options.inverse(this);
				case '>=':
					return (v1 >= v2) ? options.fn(this) : options.inverse(this);
				case 'in':
					return (_.isArray(v2) && v2.indexOf(v1) !== -1) ? options.fn(this) : options.inverse(this);
			}
		}
	}
}));

app.set('views', './web/views');
app.set('view engine', '.hbs');

app.use(express.static('web/public'));

var upload = multer({
	dest: 'tmp/'
});
app.all('/', upload.single('input'), require('./web/routes/index'));

app.listen(process.env.PORT || 3000);