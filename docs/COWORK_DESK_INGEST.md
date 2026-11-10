# Claude Cowork → Editorial desk drafts

Cowork can push unpublished bilingual drafts into the review queue.

## Endpoint

`POST https://www.thebharathnews.com/api/desk/ingest`

Headers:

```http
Authorization: Bearer <DESK_INGEST_SECRET>
Content-Type: application/json
```

Or `X-API-Key: <DESK_INGEST_SECRET>`.

Body: one article object, a JSON array, or `{ "articles": [ ... ] }` (max 10).

Drafts are always saved as `editorial_status: draft` with `isAiAssisted: true`. They never auto-publish.

## Example

```bash
curl -X POST https://www.thebharathnews.com/api/desk/ingest \
  -H "Authorization: Bearer $DESK_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "UAE updates golden visa rules for skilled workers",
    "summary": "What Indian professionals in the Gulf need to know.",
    "fullContent": "Full English article body here...",
    "category": "gcc",
    "language": "en",
    "author": "Bharath News Desk",
    "tags": ["uae", "visa", "nri"],
    "imageUrl": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=450&fit=crop&crop=center&editorial=1",
    "imageCredit": "Photo: Unsplash",
    "isAiAssisted": true,
    "translation": {
      "lang": "ml",
      "title": "Malayalam title",
      "summary": "Malayalam summary",
      "fullContent": "Malayalam full article..."
    }
  }'
```

## Editor flow

1. Cowork posts drafts here every 2 hours
2. Open https://www.thebharathnews.com/desk/review
3. Edit, request changes, or approve and publish

## Env

Set `DESK_INGEST_SECRET` in Railway and local `.env.local`.
