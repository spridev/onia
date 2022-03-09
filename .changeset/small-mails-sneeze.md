---
'@onia/cute': patch
---

Fix an issue where the Typescript compiler was not able to find the `dom` type definitions. Those definitions are
required by some `@aws-sdk` packages.
