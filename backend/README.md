# Backend (Rails API)

## Prerequisites
- Ruby: `3.2.x`
- Bundler: `2.5+`
- PostgreSQL: `14+`

## Setup
```bash
cd /Users/okamotodaichi/workspace/society_app/backend
bundle install
cp .env.example .env
bundle exec rails db:create db:migrate
```

## Run local server
```bash
bundle exec rails server -p 3000
```

Health check:
```bash
curl -sS http://127.0.0.1:3000/healthz
```

## Test environment (Issue08)
This project uses PostgreSQL for `test` as well.

1. Ensure test DB is available:
```bash
RAILS_ENV=test bundle exec rails db:create db:migrate
```

2. Run all request/model specs:
```bash
bundle exec rspec
```

3. If schema drift happens locally:
```bash
bundle exec rails db:migrate
RAILS_ENV=test bundle exec rails db:migrate
```

## Notes
- API auth is session-cookie based (Devise).
- CORS is configured in `config/initializers/cors.rb`.
- Keep `RAILS_MASTER_KEY`/secrets in env vars and never commit them.
