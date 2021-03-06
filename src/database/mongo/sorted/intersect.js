'use strict';

module.exports = function (db, module) {
	module.sortedSetIntersectCard = async function (keys) {
		if (!Array.isArray(keys) || !keys.length) {
			return 0;
		}

		var pipeline = [
			{ $match: { _key: { $in: keys } } },
			{ $group: { _id: { value: '$value' }, count: { $sum: 1 } } },
			{ $match: { count: keys.length } },
			{ $group: { _id: null, count: { $sum: 1 } } },
		];

		const data = await db.collection('objects').aggregate(pipeline).toArray();
		return Array.isArray(data) && data.length ? data[0].count : 0;
	};


	module.getSortedSetIntersect = async function (params) {
		params.sort = 1;
		return await getSortedSetRevIntersect(params);
	};

	module.getSortedSetRevIntersect = async function (params) {
		params.sort = -1;
		return await getSortedSetRevIntersect(params);
	};

	async function getSortedSetRevIntersect(params) {
		var sets = params.sets;
		var start = params.hasOwnProperty('start') ? params.start : 0;
		var stop = params.hasOwnProperty('stop') ? params.stop : -1;
		var weights = params.weights || [];
		var aggregate = {};

		if (params.aggregate) {
			aggregate['$' + params.aggregate.toLowerCase()] = '$score';
		} else {
			aggregate.$sum = '$score';
		}

		var limit = stop - start + 1;
		if (limit <= 0) {
			limit = 0;
		}

		var pipeline = [{ $match: { _key: { $in: sets } } }];

		weights.forEach(function (weight, index) {
			if (weight !== 1) {
				pipeline.push({
					$project: {
						value: 1,
						score: {
							$cond: {
								if: {
									$eq: ['$_key', sets[index]],
								},
								then: {
									$multiply: ['$score', weight],
								},
								else: '$score',
							},
						},
					},
				});
			}
		});

		pipeline.push({ $group: { _id: { value: '$value' }, totalScore: aggregate, count: { $sum: 1 } } });
		pipeline.push({ $match: { count: sets.length } });
		pipeline.push({ $sort: { totalScore: params.sort } });

		if (start) {
			pipeline.push({ $skip: start });
		}

		if (limit > 0) {
			pipeline.push({ $limit: limit });
		}

		var project = { _id: 0, value: '$_id.value' };
		if (params.withScores) {
			project.score = '$totalScore';
		}
		pipeline.push({ $project: project });

		let data = await db.collection('objects').aggregate(pipeline).toArray();

		if (!params.withScores) {
			data = data.map(item => item.value);
		}
		return data;
	}
};
