var APIBuilder = require('apibuilder'),
	_ = require('lodash'),
	request = require('request'),
	async = require('async'),
	pkginfo = require('pkginfo')(module) && module.exports,
	Connector = APIBuilder.Connector,
	Collection = APIBuilder.Collection,
	Instance = APIBuilder.Instance;

var loader = require('./loader');

// --------- in memory DB connector -------

module.exports = Connector.extend({

	// generated configuration

	config: APIBuilder.Loader(),
	name: 'appcelerator.swagger',
	pkginfo: _.pick(pkginfo, 'name', 'version', 'description', 'author', 'license', 'keywords', 'repository'),
	logger: APIBuilder.createLogger({}, { name: 'appcelerator.swagger' }),

	// implementation

	constructor: function constructor() {
	},

	fetchConfig: function fetchConfig(callback) {
		callback(null, this.config);
	},

	fetchMetadata: function fetchMetadata(callback) {
		callback(null, {
			fields: []
		});
	},

	fetchSchema: function fetchSchema(callback) {
		callback();
	},

	connect: function connect(callback) {
		loader.loadModels(this, callback);
	},

	disconnect: function disconnect(callback) {
		callback();
	},

	loginRequired: function loginRequired(request, callback) {
		// TODO: Implement.
		callback(null, false);
	},

	login: function login(request, callback) {
		// TODO: Implement.
	},

	execute: function execute() {
		var data = arguments[0],
			callback = arguments[arguments.length - 1],
			handleResponse = this.handleResponse,
			getPrimaryKey = this.getPrimaryKey,
			method = this.method,
			Model = this.model,
			options = {
				jar: this.connector.jar || (this.connector.jar = request.jar()),
				method: method.verb,
				uri: method.url,
				json: method.json
			};

		if (!_.isFunction(callback)) {
			throw new TypeError('The last argument to ' + this.methodName + ' must be a callback function.');
		}

		// Did we receive arguments?
		if (arguments.length > 1) {
			// Does our URL contain variables?
			if (options.uri.indexOf('{') >= 0) {
				var urlParams = options.uri.match(/\{[^}]+\}/g).map(function(v) {
					return v.slice(1, -1);
				});
				if (_.isString(data)) {
					var id = data;
					data = {};
					data[urlParams[0]] = id;
				}
				options.uri = _.template(options.uri.replace(/\{/g, "${"), data);
				data = _.omit(data, urlParams);
			}
			// TODO: Support sending data via query or headers, based on defined params.
			// Are we sending a body?
			if (method.verb === 'PUT' || method.verb === 'POST' || method.verb === 'PATCH') {
				options.body = data;
			}
			// Are we sending query string params?
			else {
				for (var key in data) {
					if (data.hasOwnProperty(key)) {
						options.uri += options.uri.indexOf('?') >= 0 ? '&' : '?';
						options.uri += key + '=' + encodeURIComponent(data[key]);
					}
				}
			}
		}

		request(options, function requestHandler(err, response, body) {
			handleResponse(err, body, function(err, result) {

				function createInstance(model) {
					var instance = Model.instance(model, true);
					instance.setPrimaryKey(getPrimaryKey(model));
					return instance;
				}

				if (err) {
					callback(err);
				}
				else {
					if (_.isArray(result)) {
						var array = result.map(createInstance);
						result = new Collection(Model, array);
					}
					else {
						result = createInstance(result);
					}
					callback(null, result);
				}
			});
		});
	}

});