# FreePDF codebase structure

FreePDF keeps its existing Vite/React entry points and current tool implementations. Shared, framework-agnostic helpers are organized into small focused modules under `src/utils`.

## Organization

- `src/components`: layout, page, PWA, and workspace UI components.
- `src/config`: route, site, and tool configuration.
- `src/constants`: shared PDF constants.
- `src/data`: tool content and presentation metadata.
- `src/lib`: application-level browser actions such as navigation.
- `src/utils/arrays`: collection helpers.
- `src/utils/browser`: browser APIs and download helpers.
- `src/utils/errors`: error normalization.
- `src/utils/files`: file detection, sorting, and naming.
- `src/utils/formatting`: formatting and display helpers.
- `src/utils/identity`: lightweight IDs for UI records.
- `src/utils/pdf`: PDF byte and document helpers.
- `src/utils/validation`: input validation.
- `src/workers`: background merge and split workers.

## Compatibility

`src/utils/pdfWorkspaceUtils.js` remains as a compatibility barrel so existing workspace imports do not need to change. Merge, Split, and Compress implementations remain in place.
