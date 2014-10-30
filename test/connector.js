var should = require('should'),
	async = require('async'),
	APIBuilder = require('apibuilder'),
	log = APIBuilder.createLogger({}, { name: 'appcelerator.analytics (test)', useConsole: true, level: 'info' }),
	config = new APIBuilder.Loader(),
	Connector = require('../lib');

describe('Connector', function() {

	var connector,
		AuthModel,
		FeedModel;

	before(function(next) {
		should.notEqual(config.login.username, 'YOUR_APPCELERATOR_USERNAME', 'Please configure a username and password!');
		should.notEqual(config.login.password, 'YOUR_APPCELERATOR_PASSWORD', 'Please configure a username and password!');

		connector = new Connector();
		connector.connect(function(err) {
			should(err).be.not.ok;

			AuthModel = connector.getModel('Auth');
			should(AuthModel).be.ok;
			FeedModel = connector.getModel('Feed');
			should(FeedModel).be.ok;

			next();
		});
	});

	after(function(next) {
		connector.disconnect(next);
	});

	it('should be able to fetch config', function(next) {
		connector.fetchConfig(function(err, config) {
			should(err).be.not.ok;
			should(config).be.an.Object;
			next();
		});
	});

	it('should be able to fetch metadata', function(next) {
		connector.fetchMetadata(function(err, meta) {
			should(err).be.not.ok;
			should(meta).be.an.Object;
			should(Object.keys(meta)).containEql('fields');
			next();
		});
	});

	it('should be able to find all instances', function(next) {

		AuthModel.createLogin(config.login, function(err) {
			should(err).be.not.ok;

			FeedModel.findAll(function(err, collection) {
				should(err).be.not.ok;
				should(collection.length).be.greaterThan(0);
				var first = collection[0];
				should(first.getPrimaryKey()).be.a.String;

				FeedModel.findOne(first.getPrimaryKey(), function(err, feed) {
					should(err).be.not.ok;
					should.equal(feed.getPrimaryKey(), first.getPrimaryKey());
					next();
				});
			});
		});

	});

});