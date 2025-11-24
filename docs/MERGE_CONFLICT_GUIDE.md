# Merge conflict guide for Stuffed Lamb

If you see conflicts while pulling this branch into `main`, keep the **incoming changes** from this branch anywhere the new cart-summarization or pickup/prompt logic is involved. Those updates are required for concise readbacks and robust pickup-time prompts.

## Quick resolution steps
1. Make sure you have the latest branches:
   ```bash
   git fetch origin
   ```
2. Check out `main` and merge this branch (replace `work` if your branch name differs):
   ```bash
   git checkout main
   git merge work
   ```
3. For each conflicted file, prefer the incoming version from `work`:
   ```bash
   git checkout --theirs <path>
   # or open the file and keep the "incoming" sections
   ```
   If you also have local-only edits you must preserve, apply them on top after keeping `--theirs`.
4. Once conflicts are resolved, complete the merge:
   ```bash
   git add .
   git commit
   ```
5. Run the suite to ensure everything still passes:
   ```bash
   npm test --silent
   ```

## When to keep current changes
If you have local operational tweaks (e.g., logging destination or environment-specific secrets), keep those **current** changes and re-apply the incoming feature updates manually. Otherwise, default to incoming changes so the latest behavior takes effect.
