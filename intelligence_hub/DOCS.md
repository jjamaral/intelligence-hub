# Intelligence Hub

## What it does

Intelligence Hub collects FC Porto and AI news, optionally reads market quotes, scores relevant items, publishes Home Assistant sensor states, and sends push notifications through a Home Assistant notify service.

## Configuration

- `news_poll_minutes`: news polling interval.
- `market_poll_minutes`: market polling interval.
- `alert_threshold`: minimum relevance score (0-100) for push notifications.
- `notify_service`: the notify service suffix, for example `mobile_app_pixel_9_pro`. Leave empty to disable push notifications.
- `twelve_data_api_key`: optional Twelve Data API key. Leave empty to disable market collection.
- `quiet_start` / `quiet_end`: local quiet-hours window. Alerts are stored but not pushed during this window.
- `market_symbols`: symbols to monitor. Defaults to SPY, TSLA, UBER and SPCX.

## Home Assistant entities

The MVP publishes aggregate states such as `sensor.intelligence_fc_porto_news`, `sensor.intelligence_ai_news`, and one price sensor per configured market symbol.

## API

Ingress exposes `/health`, `/api/news`, `/api/markets`, `/api/watches`, `POST /api/sync/news`, and `POST /api/sync/markets`.

## Persistence and permissions

The SQLite database lives at `/data/intelligence-hub.db`, which is part of the app's persistent data. Home Assistant API access uses the Supervisor-provided `SUPERVISOR_TOKEN`; no long-lived access token is required.
