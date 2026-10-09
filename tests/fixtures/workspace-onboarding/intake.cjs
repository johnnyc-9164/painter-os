exports.intakeReads = (...args) => globalThis[Symbol.for('painter.intake.route.test')]('read', ...args);
exports.intakeSave = (...args) => globalThis[Symbol.for('painter.intake.route.test')]('save', ...args);
