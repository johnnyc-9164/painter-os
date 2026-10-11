const seam = () => globalThis[Symbol.for('painter.command.route.test')];
exports.getConvexBridge = () => ({
  fetchAuthQuery: async () => seam().user,
  fetchAuthMutation: async () => { seam().mutations++; return seam().mutate(); },
});
