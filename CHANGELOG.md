# Changelog

## 0.1.6 - 2026-08-31

- Remove unsupported `entity_id` keys from Markdown dashboard cards.

## 0.1.5 - 2026-08-31

- Increment version so Home Assistant detects the dashboard and market card update.

## 0.1.4 - 2026-08-30

- Publish up to five recent stories per news sensor for native Home Assistant dashboards.
- Add a compact market overview sensor with prices, movements, and alert state.
- Add configurable market movement alerts without repeated notifications while a symbol remains above threshold.
- Publish collector readiness and errors to `sensor.intelligence_hub_status`.
- Add a responsive native Home Assistant dashboard configuration.

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
