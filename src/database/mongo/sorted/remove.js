'use strict';

module.exports = function (db, module) {
	var helpers = require('../helpers');

	module.sortedSetRemove = async function (key, value) {
		if (!key) {
			return;
		}
		const isValueArray = Array.isArray(value);
		if (!value || (isValueArray && !value.length)) {
			return;
		}

		if (isValueArray) {
			value = value.map(helpers.valueToString);
		} else {
			value = helpers.valueToString(value);
		}

		await db.collection('objects').deleteMany({
			_key: Array.isArray(key) ? { $in: key } : key,
			value: isValueArray ? { $in: value } : value,
		});
	};

	module.sortedSetsRemove = async function (keys, value) {
		if (!Array.isArray(keys) || !keys.length) {
			return;
		}
		value = helpers.valueToString(value);

		await db.collection('objects').deleteMany({ _key: { $in: keys }, value: value });
	};

	module.sortedSetsRemoveRangeByScore = async function (keys, min, max) {
		if (!Array.isArray(keys) || !keys.length) {
			return;
		}
		var query = { _key: { $in: keys } };

		if (min !== '-inf') {
			query.score = { $gte: parseFloat(min) };
		}
		if (max !== '+inf') {
			query.score = query.score || {};
			query.score.$lte = parseFloat(max);
		}

		await db.collection('objects').deleteMany(query);
	};
};
