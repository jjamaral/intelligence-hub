# Intelligence Hub

## What it does

Intelligence Hub collects FC Porto and AI news, optionally reads market quotes, scores relevant items, publishes Home Assistant sensor states, and sends push notifications through a Home Assistant notify service.

Fabrizio Romano is the highest-priority FC Porto transfer source. Because an X profile is not an RSS endpoint, the app discovers relevant reports through a dedicated Google News RSS query and retains [the X profile](https://x.com/FabrizioRomano) as the canonical source reference. Matching reports receive a priority boost and are also published to a dedicated Home Assistant sensor.

## Configuration

- `news_poll_minutes`: news polling interval.
- `market_poll_minutes`: market polling interval.
- `alert_threshold`: minimum relevance score (0-100) for push notifications.
- `notify_service`: the notify service suffix, for example `mobile_app_pixel_9_pro`. Leave empty to disable push notifications.
- `twelve_data_api_key`: optional Twelve Data API key. Leave empty to disable market collection.
- `quiet_start` / `quiet_end`: local quiet-hours window. Alerts are stored but not pushed during this window.
- `market_symbols`: symbols to monitor. Defaults to SPY, TSLA, UBER and SPCX.

## Home Assistant entities

The MVP publishes `sensor.intelligence_fc_porto_news`, `sensor.intelligence_fabrizio_romano_news`, `sensor.intelligence_ai_news`, and one price sensor per configured market symbol. News sensors include `latest`, `latest_url`, `latest_source`, and `latest_published_at` attributes.

## Dashboard cards

Add a Manual card to a Home Assistant dashboard and paste:

```yaml
type: vertical-stack
cards:
  - type: markdown
    title: Intelligence Hub
    content: >-
      ## Fabrizio Romano
      **{{ states('sensor.intelligence_fabrizio_romano_news') }} reports**

      [{{ state_attr('sensor.intelligence_fabrizio_romano_news', 'latest') or
      'Waiting for the first report' }}]({{
      state_attr('sensor.intelligence_fabrizio_romano_news', 'latest_url') or
      'https://x.com/FabrizioRomano' }})
  - type: entities
    title: News intelligence
    entities:
      - entity: sensor.intelligence_fabrizio_romano_news
        name: Fabrizio Romano
        icon: mdi:account-star
      - entity: sensor.intelligence_fc_porto_news
        name: FC Porto
        icon: mdi:soccer
      - entity: sensor.intelligence_ai_news
        name: AI
        icon: mdi:brain
  - type: entities
    title: Markets
    show_header_toggle: false
    entities:
      - sensor.intelligence_spy_price
      - sensor.intelligence_tsla_price
      - sensor.intelligence_uber_price
      - sensor.intelligence_spcx_price
```

Market entities appear after a Twelve Data API key is configured and the first quote collection succeeds.

## API

Ingress exposes `/`, `/health`, `/api/news`, `/api/markets`, `/api/watches`, `POST /api/sync/news`, and `POST /api/sync/markets`. Health includes per-collector readiness and recent errors.

## Persistence and permissions

The SQLite database lives at `/data/intelligence-hub.db`, which is part of the app's persistent data. Home Assistant API access uses the Supervisor-provided `SUPERVISOR_TOKEN`; no long-lived access token is required.
