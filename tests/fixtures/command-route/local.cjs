exports.localEnabled = () => false;
exports.commandLocal = () => { throw Error('unexpected local fallback'); };
exports.COOKIE = 'test';
exports.actorFor = () => { throw Error('unexpected local actor'); };
