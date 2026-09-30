# GitHub Setup

## Initial repository

```bash
git init
git add .
git commit -m "Initial kids ebook store"
git branch -M main
git remote add origin YOUR_GITHUB_REPOSITORY_URL
git push -u origin main
```

## Never commit secrets

Check before pushing:

```bash
git status
git diff --cached
```

Make sure these are ignored:

```text
.env
.env.local
.env.*.local
```

If a secret was ever committed:

1. Rotate the secret immediately.
2. Remove it from Git history.
3. Create a new secret.
4. Update Vercel/Supabase/Razorpay.

Do not rely on deleting the file from the latest commit.

## CI

The repository includes:

```text
.github/workflows/ci.yml
```

CI runs:

```text
npm ci
npm run release-check
npm run typecheck
npm run lint
npm test
npm run build
```

Protect `main` by requiring this check to pass.
