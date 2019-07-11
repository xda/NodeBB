
'use strict';

module.exports = function (redisClient, module) {
	var helpers = require('../helpers');

	module.sortedSetRemove = async function (key, value) {
		if (!key) {
			return;
		}
		const isValueArray = Array.isArray(value);
		if (!value || (isValueArray && !value.length)) {
			return;
		}
		if (!isValueArray) {
			value = [value];
		}

		if (Array.isArray(key)) {
			const batch = redisClient.batch();
			key.forEach(k => batch.zrem(k, value));
			await helpers.execBatch(batch);
		} else {
			await redisClient.async.zrem(key, value);
		}
	};

	module.sortedSetsRemove = async function (keys, value) {
		await module.sortedSetRemove(keys, value);
	};

	module.sortedSetsRemoveRangeByScore = async function (keys, min, max) {
		var batch = redisClient.batch();
		keys.forEach(k => batch.zremrangebyscore(k, min, max));
		await helpers.execBatch(batch);
	};
};
