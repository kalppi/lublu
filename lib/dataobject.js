const util = require('util');

module.exports = (lublu) => {
	lublu = lublu || {};
	
	lublu.DataObject = lublu.DataObject || class DataObject {
		constructor(type, db, data) {
			lublu.log(type + ':new');

			this.type = type;
			this.db = db;
			this.table = lublu.table(type.toLowerCase());
			this.data = data || {};
		}

		static factory(cl, db, data) {
			switch(cl) {
				case 'Post':
					return new lublu.Post(db, data);
			} 
		}

		set(data) {
			for(var k in data) {
				this.data[k] = data[k];
			}

			return this;
		}

		get(field) {
			if(this.data[field] !== undefined) {
				return this.data[field];
			} else {
				return null;
			}
		}

		fetch(fields) {
			return new Promise((resolve, reject) => {
				this.db.query(
					util.format('SELECT %s FROM %s WHERE id = %i', fields.join(', '), this.table, this.data.id)
				).then(rows => {
					this.set(rows[0]);
				}).catch(err => {
					reject(err);
				});
			});
		}

		clear(options) {
			return new Promise((resolve, reject) => {
				this.db.clear(this.table, options).then(() => {
					resolve();
				}).catch(err => {
					reject(err);
				});
			});
		}

		count() {
			lublu.log(this.type + ':count');

			return new Promise((resolve, reject) => {
				this.db.query(util.format('SELECT COUNT(*)::int as count FROM %s', this.table)).then(rows => {
					resolve(rows[0].count);
				}).catch(err => {
					reject(err);
				});
			});
		}

		delete() {
			return new Promise((resolve, reject) => {
				this.db.query(util.format('DELETE FROM %s WHERE id = $1', this.table), [this.data.id]).then(() => {
					resolve();
				}).catch(err => {
					reject(err);
				});
			});
		}

		save(fields, returning) {
			return new Promise((resolve, reject) => {
				if(this.data.id) {
					lublu.log(this.type + ':update');

					let data = {id: this.data.id};
					if(fields) {
						for(let k in this.data) {
							if(fields.indexOf(k) != -1) {
								data[k] = this.data[k];
							}
						}
					} else {
						data = this.data;
					}

					this.db.update(this.table, data, returning).then((ret) => {
						this.set(ret);

						resolve(this);
					}).catch((err) => {
						reject(err);
					});
				} else {
					lublu.log(this.type + ':insert');

					this.db.insert(this.table, this.data, returning).then((ret) => {
						this.set(ret);

						resolve(this);
					}).catch((err) => {
						reject(err);
					});
				}
			});
		}

		find(id) {
			lublu.log(this.type + ':find');

			return new Promise((resolve, reject) => {
				this.db.query(util.format('SELECT * FROM %s WHERE id = $1 LIMIT 1', this.table), [id]).then((res) => {
					if(res.length == 0) {
						lublu.log(this.type + ':find:not found');

						reject(new Error('not found'));
					} else {
						lublu.log(this.type + ':find:found');

						resolve(DataObject.factory(this.type, this.db, res[0]));
					}
				});
			});
		}

		findRandom() {
			lublu.log(this.type + ':findRandom');

			return new Promise((resolve, reject) => {
				this.db.query(util.format('SELECT * FROM %s ORDER BY random() LIMIT 1', this.table), []).then((res) => {
					if(res.length == 0) {
						lublu.log(this.type + ':findRandom:not found');

						reject(new Error('not found'));
					} else {
						lublu.log(this.type + ':findRandom:found');

						resolve(DataObject.factory(this.type, this.db, res[0]));
					}
				});
			});
		}

		findAll(options) {
			if(options && (options.offset !== undefined && options.limit !== undefined)) {
				lublu.log(this.type + ':find offset ' + options.offset + ' limit ' + options.limit);

				var sql = 'SELECT * FROM %s LIMIT $1 OFFSET $2';
				var data = [options.limit, options.offset];
			} else {
				lublu.log(this.type + ':find');

				var sql = 'SELECT * FROM %s';
				var data = [];
			}

			return new Promise((resolve, reject) => {
				this.db.query(util.format(sql, this.table), data).then((res) => {
					let posts = [];
					for(let a of res) {
						posts.push(DataObject.factory(this.type, this.db, a));
					}

					resolve(posts);
				});
			});
		}
	}
}