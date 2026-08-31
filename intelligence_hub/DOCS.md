# Intelligence Hub

## What it does

Intelligence Hub collects FC Porto and AI news, optionally reads market quotes, scores relevant items, publishes Home Assistant sensor states, and sends push notifications through a Home Assistant notify service.

Fabrizio Romano is the highest-priority FC Porto transfer source. Because an X profile is not an RSS endpoint, the app discovers relevant reports through a dedicated Google News RSS query and retains [the X profile](https://x.com/FabrizioRomano) as the canonical source reference. Matching reports receive a priority boost and are also published to a dedicated Home Assistant sensor.

## Configuration

- `news_poll_minutes`: news polling interval.
- `market_poll_minutes`: market polling interval.
- `alert_threshold`: minimum relevance score (0-100) for push notifications.
- `market_alert_percent`: absolute daily market movement that triggers an alert. Defaults to 3%.
- `notify_service`: the notify service suffix, for example `mobile_app_pixel_9_pro`. Leave empty to disable push notifications.
- `twelve_data_api_key`: optional Twelve Data API key. Leave empty to disable market collection.
- `quiet_start` / `quiet_end`: local quiet-hours window. Alerts are stored but not pushed during this window.
- `market_symbols`: symbols to monitor. Defaults to SPY, TSLA, UBER and SPCX.

## Home Assistant entities

The app publishes `sensor.intelligence_fc_porto_news`, `sensor.intelligence_fabrizio_romano_news`, `sensor.intelligence_ai_news`, `sensor.intelligence_market_overview`, `sensor.intelligence_hub_status`, and one price sensor per configured market symbol. News sensors include an `items` attribute containing up to five recent stories. The market overview contains up to twelve current quotes and their alert state.

## Dashboard cards

Add one Manual card for trends. It combines the FC Porto and AI feeds, sorts them by date, and renders a source image (favicon) beside each story:

```yaml
type: markdown
title: Intelligence Hub — últimas tendências
content: |-
  {% set porto = state_attr('sensor.intelligence_fc_porto_news', 'items') or [] %}
  {% set ai = state_attr('sensor.intelligence_ai_news', 'items') or [] %}
  {% set items = (porto + ai) | sort(attribute='published_at', reverse=true) %}
  {% if not items %}
  ⏳ Ainda não existem notícias recolhidas.
  {% else %}
  {% for item in items[:5] %}
  <img src="https://www.google.com/s2/favicons?domain=news.google.com&sz=64" width="28" height="28" align="left" style="margin-right:10px">
  <a href="{{ item['url'] }}"><strong>{{ item['title'] }}</strong></a><br>
  _{{ item['source'] }} · {{ as_timestamp(item['published_at']) | timestamp_custom('%d %b %H:%M', true) }} · {{ item['category'] | replace('_', ' ') | title }} · {{ item['relevance'] }}/100_

  {% endfor %}
  {% endif %}
```

## API

Ingress exposes `/`, `/health`, `/api/news`, `/api/markets`, `/api/watches`, `POST /api/sync/news`, and `POST /api/sync/markets`. Health includes per-collector readiness and recent errors.

## Persistence and permissions

The SQLite database lives at `/data/intelligence-hub.db`, which is part of the app's persistent data. Home Assistant API access uses the Supervisor-provided `SUPERVISOR_TOKEN`; no long-lived access token is required.
