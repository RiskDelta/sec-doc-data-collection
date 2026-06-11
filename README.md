# RiskDelta SEC Document Annotation

Minimal Vercel-ready Next.js app for uploading RiskDelta candidate CSVs and collecting human labels.

## Local Setup

```bash
cp .env.example .env
npm install
npm run db:init
npm run dev
```

Set `DATABASE_URL` in `.env` before running `npm run db:init` or starting the app.

## Vercel Deployment

1. Create a Postgres database and run `db/schema.sql` against it.
2. Add `DATABASE_URL` and `ADMIN_PASSWORD` to the Vercel project environment variables.
3. Deploy this folder as a Next.js project.
4. Use `/admin` for CSV upload and user data management.
5. Give annotators the app homepage `/`; they enter their user ID and password and only see rows for that ID.

## Workflow

Admin:

1. Open `http://localhost:3000/admin`.
2. Enter the admin password from `ADMIN_PASSWORD`.
3. Enter a user key, for example `annotator-a`.
4. Set or generate a user password.
5. Upload that user's CSV batch.
6. Review uploaded users, passwords, and completion progress.

Annotator:

1. Open `http://localhost:3000`.
2. Enter the assigned user ID and password.
3. Review rows in pages of 20.
4. Click a row to open `/annotate/{user-key}/{candidate_id}`.
5. Save labels. The row is marked `completed = true` and the user returns to the row list.

## Annotation Fields

The app stores the source CSV columns as read-only context and lets annotators fill:

- `primary_label`
- `secondary_label`
- `rationale_old`
- `rationale_new`
- `confidence`
- `annotator`
- `notes`

Completion is stored separately in:

- `completed`
- `completed_at`

The current MVP label set is:

- `addition`
- `removal`
- `actualization`
- `severity_increase`
- `severity_decrease`
- `specificity_increase`
- `specificity_decrease`
- `neutral_or_unclear`
