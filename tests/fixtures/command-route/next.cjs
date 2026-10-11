exports.NextRequest = class {};
exports.NextResponse = {json: (value, init) => Response.json(value, init)};
