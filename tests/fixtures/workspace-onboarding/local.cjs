exports.localEnabled = () => globalThis[Symbol.for('painter.workspace.local.test')] === true;
exports.COOKIE = 'test';
exports.actorFor = () => ({id: 'local-owner', tenantId: 'local-company'});
exports.snapshotLocal = actor => ({workspace: {id: actor.tenantId, name: 'Local Painting'}});
