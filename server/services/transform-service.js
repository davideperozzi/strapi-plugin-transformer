'use strict';

const _ = require('lodash');
const { removeObjectKey } = require('../util/removeObjectKey');
const { prefixMedia } = require('../util/prefixMedia');

module.exports = () => ({
	/**
	 *
	 * @param {object} transforms
	 * @param {boolean} transforms.removeAttributesKey
	 * @param {boolean} transforms.removeAttributesKey
	 * @param {boolean} transforms.prefixMediaUrl
	 * @param {object} data
	 * @returns {object} transformed data
	 */
	transformResponse: function traverse(transforms, data) {
		// removeAttributeKey specific transformations
		if (transforms.removeAttributesKey) {
			// single
			if (_.has(data, 'attributes')) {
				return traverse(transforms, removeObjectKey(data, 'attributes'));
			}

			// collection
			if (_.isArray(data) && data.length && _.has(_.head(data), 'attributes')) {
				return data.map((e) => traverse(transforms, e));
			}
		}

		// fields
		_.forEach(data, (value, key) => {
			if (!value) {
				return;
			}

			// removeDataKey specific transformations
			if (transforms.removeDataKey) {
				// single
				if (_.isObject(value)) {
					data[key] = traverse(transforms, value);
				}

				// many
				if (_.isArray(value)) {
					data[key] = value.map((field) => traverse(transforms, field));
				}
			}

			// relation(s)
			if (_.has(value, 'data')) {
				let relation = null;

				// single
				if (_.isObject(value.data)) {
					relation = traverse(transforms, value.data);
				}

				// many
				if (_.isArray(value.data)) {
					relation = value.data.map((e) => traverse(transforms, e));
				}

				if (transforms.removeDataKey) {
					data[key] = relation;
				} else {
					data[key]['data'] = relation;
				}
			}

			// single component
			if (_.has(value, 'id')) {
				data[key] = traverse(transforms, value);
			}

			// repeatable component & dynamic zone
			if (_.isArray(value) && _.has(_.head(value), 'id')) {
				data[key] = value.map((p) => traverse(transforms, p));
			}

			// single media
			if (_.has(value, 'provider')) {
				return;
			}

			// multi media
			if (_.isArray(value) && _.has(_.head(value), 'provider')) {
				return;
			}
		});

		return data;
	},

	transformMedia: function traverse(data, prefix) {
		_.forEach(data, (value, key) => {
			if (!value) {
				return;
			}

			if (
				value.provider === 'local' &&
				typeof value.url === 'string' &&
				!value.url.startsWith(prefix)
			) {
				value.url = prefixMedia(value.url, prefix);

				if (
					typeof value.previewUrl === 'string' &&
					!value.previewUrl.startsWith(prefix)
				) {
					value.previewUrl = prefixMedia(value.previewUrl, prefix);
				}

				if (_.has(value, 'formats')) {
					_.forEach(
						value.formats,
						(f) => {
							if (typeof f.url === 'string') {
								f.url = prefixMedia(f.url, prefix)
							}
						}
					);
				}
			}

			if (_.isObject(value)) {
				traverse(value, prefix);
			}
		});

		return data;
	},

	response(settings, data, mediaPrefixUrl = '') {
		if (settings && settings.responseTransforms) {
			data = this.transformResponse(settings.responseTransforms, data);

			if (settings.responseTransforms.prefixMediaUrl) {
				data = this.transformMedia(data, mediaPrefixUrl);
			}
		}

		return data;
	},
});
