'use strict';

const DEBUG = process.env.NODE_ENV !== 'production' && !process.env.TEST;

const lublu = {
	log: function(s) {
		if(DEBUG) {
			console.log(s);
		}
	},

	table: function (name) {
		return 'lublu_' + name.toLowerCase();
	}
};

require('./lib/dao/psql/psql.dao.post')(lublu);
require('./lib/dao/psql/psql.dao.tag')(lublu);

require('./lib/connection')(lublu);
require('./lib/post')(lublu);
require('./lib/tag')(lublu);
require('./lib/page')(lublu);

module.exports = class {
	constructor(db) {
		this.db = new lublu.Connection(db);

		this.postDAO = new lublu.PsqlPostDAO(this.db);
		this.tagDAO = new lublu.PsqlTagDAO(this.db);
	}

	get posts() {
		return this.postDAO;
	}

	get tags() {
		return this.tagDAO;
	}

	Post(data) {
		if(Array.isArray(data)) {
			let posts = [];
			for(let d of data) {
				posts.push(new lublu.Post(d));
			}
			return posts;
		} else {
			return new lublu.Post(data);
		}
	}

	Tag(data) {
		return new lublu.Tag(data);
	}

	Page(dao, options) {
		return new lublu.Page(dao, options);
	}

	ui(app) {
		return require('./ui/ui.js')(app);
	}
}