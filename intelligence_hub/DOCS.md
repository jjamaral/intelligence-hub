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

Add one Manual card for trends and one for markets. The trend card combines the FC Porto and AI feeds, sorts them by date, and renders a source image (favicon) beside each story:

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

```yaml
type: markdown
title: Mercados — cotações atuais
content: |-
  {% set quotes = state_attr('sensor.intelligence_market_overview', 'quotes') or [] %}
  {% if not quotes %}
  ⏳ Sem cotações disponíveis. Configure a API key do Twelve Data.
  {% else %}
  {% for quote in quotes %}
  {% set change = quote['change_percent'] | float(0) %}
  {% if quote['symbol'] == 'SXR8:XETR' %}{% set label = 'SXR8 ETF' %}{% elif quote['symbol'] == 'UBER' %}{% set label = 'Uber' %}{% elif quote['symbol'] == 'TSLA' %}{% set label = 'Tesla' %}{% else %}{% set label = quote['symbol'] %}{% endif %}
  {% if change > 0 %}<font color="green">▲</font>{% elif change < 0 %}<font color="red">▼</font>{% else %}—{% endif %} **{{ label }}** · {{ '%.2f' | format(quote['price'] | float(0)) }} {{ quote['currency'] }} · {% if change > 0 %}<font color="green">+{{ '%.2f' | format(change) }}%</font>{% elif change < 0 %}<font color="red">{{ '%.2f' | format(change) }}%</font>{% else %}0.00%{% endif %}{% if quote['alerting'] %} ⚠️{% endif %}
  {% endfor %}
  {% endif %}

  **SpaceX:** empresa privada, sem cotação pública em tempo real.
```

Market entities and price alerts appear after a Twelve Data API key is configured and the first quote collection succeeds. `SXR8:XETR` is the Xetra symbol used by Twelve Data. SpaceX is private and therefore cannot have a genuine public stock quote; the card labels that explicitly instead of showing an unrelated symbol. Notifications also require `notify_service`; quiet hours continue to apply.

## API

Ingress exposes `/`, `/health`, `/api/news`, `/api/markets`, `/api/watches`, `POST /api/sync/news`, and `POST /api/sync/markets`. Health includes per-collector readiness and recent errors.

## Persistence and permissions

The SQLite database lives at `/data/intelligence-hub.db`, which is part of the app's persistent data. Home Assistant API access uses the Supervisor-provided `SUPERVISOR_TOKEN`; no long-lived access token is required.
