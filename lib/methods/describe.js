exports.describe = function describe() {
	var context = this,
		params = {};
	if (this.method.params) {
		for (var i = 0; i < this.method.params.length; i++) {
			var param = this.method.params[i];
			if (!param.name) {
				continue;
			}
			param.type = param.paramType || 'query';
			delete param.paramType;
			if (!param.description) {
				param.description = param.name;
			}
			param.optional = !param.required;
			params[param.name] = param;
		}
	}
	var path = '.' + this.method.path.replace(/\/\{([^}]+)\}/g, '/:$1');
	if (path.split('/')[1].toLowerCase() === this.model.name.toLowerCase()) {
		path = './' + path.split('/').slice(2).join('/');
	}

	return {
		generated: true,
		uiSort: this.method.path.length,
		description: this.method.meta && this.method.meta.summary || this.methodName,
		path: path,
		// TODO: depeondsOnAny might disable this...
		actionGroup: this.methodName,
		method: this.method.verb,
		parameters: params,
		action: function describedAction(req, resp, next) {
			try {
				resp.stream(context.model[context.methodName], req.params, next);
			}
			catch (E) {
				return next(E);
			}
		}
	};
};