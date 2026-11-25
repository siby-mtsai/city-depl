# city-app: one NestJS codebase, many cities

Each city gets different features, payment gateways, currencies and limits from the **same build**.
There is no `if (city === 'mumbai')` anywhere in the code.

## Run

```bash
npm install
npm test            # 16 tests: config validation + per-city behaviour
npm run start:dev   # http://localhost:3000

curl -H "X-City: dubai" localhost:3000/city
curl -X POST -H "X-City: mumbai" -H "content-type: application/json" \
  -d '{"items":[{"sku":"tea","qty":2,"unitPrice":120}],"paymentMethod":"cash"}' \
  localhost:3000/orders
```

## How it fits together

| Piece | File | Job |
|---|---|---|
| City config | `config/cities/*.yaml` | What makes each city different (data, not code) |
| Schema | `src/city/city.schema.ts` | Validates every YAML file; app refuses to boot on a bad one |
| Middleware | `src/city/city.middleware.ts` | Picks the city from the `X-City` header or the subdomain |
| Context | `src/city/city-context.ts` | Makes the current city available anywhere (AsyncLocalStorage) |
| Flags | `src/features/feature-flag.service.ts` | The only place that decides if a feature is on |
| Guard | `@RequireFeature('live_tracking')` | Blocks a whole route in cities without that feature |
| Strategy | `src/payments/` | Razorpay for India, Stripe for Dubai, chosen by config |

## Common changes

**Add a city:** copy `config/cities/mumbai.yaml` to `pune.yaml` and edit it. No code changes.

**Add a feature:**
1. Add it to `FeaturesSchema` in `city.schema.ts`.
2. Set it to `true`/`false` in **every** city file (CI fails until you do).
3. Check it with `flags.isEnabled('x')` or `@RequireFeature('x')`.

**Add a payment gateway:** create a class implementing `PaymentProvider`, add it to
`GATEWAYS` in `payments.module.ts` and to `PAYMENT_PROVIDER_NAMES` in the schema.

**Emergency kill switch:** set `FEATURE_LIVE_TRACKING=off` and restart. It turns the feature off in every city.

## Deploying

One Docker image for all cities. Mount the city configs (Kubernetes ConfigMap, or bake them into the image)
and set `CITY_CONFIG_DIR` if they live somewhere other than `./config/cities`.

### CI/CD: city labels build city images

Add a city label when you raise a PR. CI runs the tests, then builds one image per labelled city that
contains **only that city's config**, and smoke-tests that it serves that city and rejects the others.

| Label | Builds |
|---|---|
| `city:mumbai`, `city:delhi`, `city:dubai` | that city (add several for several) |
| `city:all` | every city |

- A PR with no city label fails CI. Editing `config/cities/x.yaml` adds `x` automatically.
- Images go to `ghcr.io/<owner>/<repo>`:

| Event | Tags |
|---|---|
| PR | `<city>-pr-<number>` |
| Merge to `develop` | `<city>-develop`, `<city>-<sha>` (cities from the merged PR's labels) |
| Merge to `main` | `<city>-main`, `<city>-<sha>` |
| Tag `v1.2.3` | `<city>-1.2.3`, `<city>-latest` for every city |

- Build one locally: `docker build --build-arg CITY=dubai -t city-app:dubai .`

Branches: feature branch → PR into `develop` → PR `develop` into `main` for a release.

### Labels

- Labels live in `.github/labels.yml`; `city:<name>` labels are generated from `config/cities/`. Adding a city
  and merging it creates its label. Run **Actions → Labels → Run workflow** once after the first push.
- PRs are also auto-labelled by area (`area:payments`, `dependencies`, ...) via `.github/labeler.yml`.

When you outgrow YAML (non-engineers toggling flags, gradual % rollouts), replace the body of
`FeatureFlagService.isEnabled()` with Unleash, Flagsmith, LaunchDarkly or OpenFeature. Callers don't change.

## Notes

- `razorpay.provider.ts` and `stripe.provider.ts` are **stubs**. Plug in the real SDKs.
- `OrdersService.tracking()` returns fake data.
- In production, only trust `X-City` from your own gateway/apps, or derive the city from the user's profile.
