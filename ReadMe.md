# Webtography

Scrapes a website via Wget.

1. Get a GitHub token [here](https://github.com/settings/tokens/new). Only the _public_repo_ is needed.
2. `curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","token":"xyz","url":"http://www.webcom.dk/"}' https://webtography.herokuapp.com/`
3. Soon after you'll see that site mirrored in a new repository on your GitHub account.
