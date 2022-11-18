const prefixMedia = (url, prefix = '') => {
	return prefix.replace(/\/$/) + '/' + url.replace(/^\//, '');
}

module.exports = {
	prefixMedia
};