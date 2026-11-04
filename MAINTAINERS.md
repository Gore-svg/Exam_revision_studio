# Maintaining the revision hub

This repository holds all my exam revision studios across Computing and my other subjects. Each studio is a standalone HTML file for a particular paper or assessment. Open the hub, filter by subject, and choose a paper to revise.

## First-time GitHub setup

1. Extract the hub package into the root of your GitHub repository, beside your existing studio HTML files. Include the hidden `.github/workflows/revision-pages.yml` file. If you already use a Pages deployment workflow, merge this build into it or disable the old workflow so there is only one publisher.
2. Commit the files to the default branch. Under **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Publish revision studios → Run workflow** and choose the default branch. Once it succeeds, open the website URL shown in the deployment or under **Settings → Pages**.

## Add a studio

Upload the standalone HTML file and commit it to the default branch. Both layouts work:

- Repository root. Any HTML filename works except `index.html` and `404.html`. Put unrelated HTML outside the root and the `studios/` folder.
- Under `studios/`. Use any HTML filename, for example `studios/English/Year9_AT4.html`. The first folder after `studios/` supplies the subject tab.

The workflow rebuilds the catalogue on each push to the default branch. It uses the page's HTML title for its card. For a custom subject label, add `<meta name="revision-subject" content="Design and Technology">` inside the studio's `<head>`. Existing root-level files can stay where they are. To remove a listing, remove the corresponding studio file and redeploy.

If the generated catalogue is missing, a public site on its standard `github.io` URL can fall back to the public repository file list. This assumes Pages serves the repository root on the default branch and uses filenames for display. For a custom domain, private repository, or API rate limit, use the GitHub Actions build and check the latest deployment succeeded.

## Local preview and progress

Run `python3 build_catalog.py` from the repository root, then open `index.html` in your browser. Run the command again after adding or removing a file. GitHub Actions does this automatically for the hosted version.

The hub opens each studio directly. If a studio uses browser storage, progress stays in the visitor's browser profile. Downloaded copies and the hosted site use separate storage. Studios hosted on the same origin should each use a distinct storage key, especially if one studio was cloned to create another.
