export const TOOL_ROUTES = {
  workspace: "/workspace",
  merge: "/merge",
  split: "/split",
  compress: "/compress",
  "pdf-to-image": "/pdf-to-image",
  "image-to-pdf": "/image-to-pdf",
  sign: "/sign",
  "password-protect": "/password-protect",
  metadata: "/metadata",
};

const ROUTE_TO_MODE = Object.fromEntries(
  Object.entries(TOOL_ROUTES).map(([mode, path]) => [
    path,
    mode,
  ])
);

const VALID_MODES = new Set(
  Object.keys(TOOL_ROUTES)
);
