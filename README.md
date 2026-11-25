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

### CI/CD (image build only, no deployment yet)

`.github/workflows/ci.yml` runs the tests, builds the image, starts it and smoke-tests `/health` and `/city`.

| When | Image pushed to `ghcr.io/<owner>/<repo>` |
|---|---|
| Pull request | not pushed (build + test only) |
| PR with label `build:image` | `:pr-<number>` |
| Push to `develop` | `:develop`, `:<commit sha>` |
| Push to `main` | `:main`, `:<commit sha>` |
| Tag `v1.2.3` | `:1.2.3` |

Branches: work on feature branches → PR into `develop` → PR `develop` into `main` for a release.

### Labels

- All repo labels are defined in `.github/labels.yml`. Pushing a change to it (on `main` or `develop`) creates or
  updates them on GitHub; run **Actions → Labels → Run workflow** once after the first push.
- PRs are auto-labelled by changed files (`area:city-config`, `area:payments`, `dependencies`, ...) via `.github/labeler.yml`.
- Type labels (`feature`, `bug`, `chore`, `hotfix`) and `build:image` are added by hand.

When you outgrow YAML (non-engineers toggling flags, gradual % rollouts), replace the body of
`FeatureFlagService.isEnabled()` with Unleash, Flagsmith, LaunchDarkly or OpenFeature. Callers don't change.

## Notes

- `razorpay.provider.ts` and `stripe.provider.ts` are **stubs**. Plug in the real SDKs.
- `OrdersService.tracking()` returns fake data.
- In production, only trust `X-City` from your own gateway/apps, or derive the city from the user's profile.
