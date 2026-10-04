import { defineApp } from 'convex/server';
import contractorOs from '../../src/component/convex.config.js';

import painting from "../../src/trades/painting/component/convex.config.js";
import plumbing from "../../src/trades/plumbing/component/convex.config.js";
import roofing from "../../src/trades/roofing/component/convex.config.js";
import garage_door from "../../src/trades/garage_door/component/convex.config.js";
import electrical from "../../src/trades/electrical/component/convex.config.js";
import hvac from "../../src/trades/hvac/component/convex.config.js";
import concrete from "../../src/trades/concrete/component/convex.config.js";
import landscaping from "../../src/trades/landscaping/component/convex.config.js";
import drywall_framing from "../../src/trades/drywall_framing/component/convex.config.js";

const app = defineApp();
app.use(contractorOs, { env: { MODE: 'development' } });
app.use(painting);
app.use(plumbing);
app.use(roofing);
app.use(garage_door);
app.use(electrical);
app.use(hvac);
app.use(concrete);
app.use(landscaping);
app.use(drywall_framing);
export default app;
