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

Add a Manual card to a Home Assistant dashboard and paste:

```yaml
type: vertical-stack
cards:
  - type: markdown
    title: Fabrizio Romano — destaque
    entity_id:
      - sensor.intelligence_fabrizio_romano_news
    content: |-
      {% set items = state_attr('sensor.intelligence_fabrizio_romano_news', 'items') or [] %}
      {% if not has_value('sensor.intelligence_fabrizio_romano_news') %}
      ⚠️ Notícias do Fabrizio temporariamente indisponíveis.
      {% elif not items %}
      À espera da primeira notícia do Fabrizio Romano sobre o FC Porto.
      {% else %}
      {% set item = items[0] %}
      ## [{{ item['title'] }}]({{ item['url'] }})
      _{{ item['source'] }} · {{ as_timestamp(item['published_at']) | timestamp_custom('%d %b %H:%M', true) }}_

      **{{ item['category'] | replace('_', ' ') | title }}** · relevância {{ item['relevance'] }}/100
      {% endif %}

  - type: markdown
    title: FC Porto — últimas notícias
    entity_id:
      - sensor.intelligence_fc_porto_news
    content: |-
      {% set items = state_attr('sensor.intelligence_fc_porto_news', 'items') or [] %}
      {% if not has_value('sensor.intelligence_fc_porto_news') %}
      ⚠️ Notícias do FC Porto temporariamente indisponíveis.
      {% elif not items %}
      Ainda não foram recolhidas notícias do FC Porto.
      {% else %}
      {% for item in items[:5] %}
      - [{{ item['title'] }}]({{ item['url'] }})
        _{{ item['source'] }} · {{ as_timestamp(item['published_at']) | timestamp_custom('%d %b %H:%M', true) }} · relevância {{ item['relevance'] }}/100_
      {% endfor %}
      {% endif %}

  - type: markdown
    title: Inteligência Artificial — últimas notícias
    entity_id:
      - sensor.intelligence_ai_news
    content: |-
      {% set items = state_attr('sensor.intelligence_ai_news', 'items') or [] %}
      {% if not has_value('sensor.intelligence_ai_news') %}
      ⚠️ Notícias de IA temporariamente indisponíveis.
      {% elif not items %}
      Ainda não foram recolhidas notícias de IA.
      {% else %}
      {% for item in items[:5] %}
      - [{{ item['title'] }}]({{ item['url'] }})
        _{{ item['source'] }} · {{ as_timestamp(item['published_at']) | timestamp_custom('%d %b %H:%M', true) }} · relevância {{ item['relevance'] }}/100_
      {% endfor %}
      {% endif %}

  - type: markdown
    title: Mercados
    entity_id:
      - sensor.intelligence_market_overview
      - sensor.intelligence_hub_status
    content: |-
      {% set market_status = state_attr('sensor.intelligence_hub_status', 'markets_status') %}
      {% set quotes = state_attr('sensor.intelligence_market_overview', 'quotes') or [] %}
      {% if market_status == 'disabled' %}
      A recolha de mercados está desativada. Configure `twelve_data_api_key` no add-on.
      {% elif not has_value('sensor.intelligence_market_overview') %}
      ⚠️ Dados de mercado temporariamente indisponíveis.
      {% elif not quotes %}
      À espera da primeira recolha de preços.
      {% else %}
      {% for quote in quotes %}
      {% set change = quote['change_percent'] | float(0) %}
      - **{{ quote['symbol'] }}** — {{ '%.2f' | format(quote['price'] | float(0)) }} {{ quote['currency'] }} · {% if change > 0 %}🟢 ▲{% elif change < 0 %}🔴 ▼{% else %}⚪ —{% endif %} {{ '%+.2f' | format(change) }}%{% if quote['alerting'] %} ⚠️{% endif %}
      {% endfor %}
      {% endif %}

  - type: markdown
    title: Estado da recolha
    entity_id:
      - sensor.intelligence_hub_status
    content: |-
      {% set overall = states('sensor.intelligence_hub_status') %}
      {% if overall == 'ready' %}
      ✅ Todos os coletores ativos estão saudáveis.
      {% elif overall == 'degraded' %}
      ⚠️ Alguns dados podem estar desatualizados.
      {% else %}
      ⏳ Recolha inicial em curso.
      {% endif %}

      - **Notícias:** {{ state_attr('sensor.intelligence_hub_status', 'news_status') or 'unknown' }}{% set news_error = (state_attr('sensor.intelligence_hub_status', 'news_errors') or []) | first %}{% if news_error %} — {{ news_error }}{% endif %}
      - **Mercados:** {{ state_attr('sensor.intelligence_hub_status', 'markets_status') or 'unknown' }}{% set market_error = (state_attr('sensor.intelligence_hub_status', 'markets_errors') or []) | first %}{% if market_error %} — {{ market_error }}{% endif %}
```

Market entities and price alerts appear after a Twelve Data API key is configured and the first quote collection succeeds. Notifications also require `notify_service`; quiet hours continue to apply.

## API

Ingress exposes `/`, `/health`, `/api/news`, `/api/markets`, `/api/watches`, `POST /api/sync/news`, and `POST /api/sync/markets`. Health includes per-collector readiness and recent errors.

## Persistence and permissions

The SQLite database lives at `/data/intelligence-hub.db`, which is part of the app's persistent data. Home Assistant API access uses the Supervisor-provided `SUPERVISOR_TOKEN`; no long-lived access token is required.
