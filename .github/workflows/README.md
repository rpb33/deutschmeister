The deploy workflow runs quality checks on pull requests and pushes to main.
Only successful main-branch runs may publish the Pages artifact. Configure
Settings → Pages → Source → GitHub Actions before the first deployment.

The browser tests use the default /deutschmeister/ path. The final build uses
the actual repository name so forks can deploy without editing asset URLs.
