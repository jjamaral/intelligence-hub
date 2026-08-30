# Changelog

## 0.1.3 - 2026-08-30

- Start ingress before initial external collection and bound provider requests with timeouts.
- Expose collector readiness and failures through `/health`.
- Add a useful ingress root response and richer Home Assistant sensor attributes.
- Add a highest-priority Fabrizio Romano FC Porto transfer source and dedicated sensor.
- Align CI with locked dependencies and validate the Docker build.
- Install timezone data in the runtime image for local quiet-hours behavior.

## 0.1.1 - 2026-08-30

- Fix Home Assistant App runtime entrypoint to execute the compiled `dist/index.js` artifact.
- Add a regression test covering package and Docker runtime entrypoints.

## 0.1.0 - Unreleased

- Initial local-first Home Assistant App foundation.
- FC Porto and AI RSS collection, classification, scoring and deduplication.
- SQLite persistence.
- Optional Twelve Data market quotes.
- Home Assistant states and push notifications with quiet hours.
- Health and data API endpoints.
