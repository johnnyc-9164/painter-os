import { httpRouter } from "convex/server";
import { publicMedia } from "./websiteMediaUpload";

import { authComponent, createAuth } from "./auth";

const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

http.route({
  path: "/company-website-media",
  method: "GET",
  handler: publicMedia,
});

export default http;
