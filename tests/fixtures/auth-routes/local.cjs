exports.localEnabled = () => false;
exports.localAuth = () => { throw Error('unexpected local fallback'); };
exports.acceptInviteLocal = exports.localAuth;
exports.COOKIE = 'test';
exports.actorFor = () => { throw Error('unexpected local actor'); };
