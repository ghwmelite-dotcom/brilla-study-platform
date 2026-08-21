# Cloudflare Git deployment

BrillaPrep production Pages deployments are built from the `main` branch of
`ghwmelite-dotcom/brilla-study-platform` by the Cloudflare Workers and Pages
GitHub App.

## Required repository access

The GitHub App installation must include `brilla-study-platform`. Prefer
**Only select repositories** and grant access only to repositories that
Cloudflare actually deploys. Avoid **All repositories** as the steady-state
setting because it grants the app unnecessary access to unrelated and future
repositories.

## Verification after changing access

1. Merge a reviewed, low-risk pull request into `main`.
2. Confirm GitHub records a Cloudflare deployment check for the merge commit.
3. Confirm the Pages deployment source is `github:push`, not `ad_hoc`.
4. Confirm `https://brillaprep.org/`, `/my-plan`, and the Worker health endpoint
   return successful responses.
5. Confirm anonymous requests to protected guidance and counselor endpoints are
   rejected.

If steps 2 or 3 fail, verify the GitHub App is active and still has repository
access before attempting another deployment. Do not uninstall and reinstall the
app unless repository access and Cloudflare project settings have both been
verified and the integration remains broken.
