# Deployment Plan

Momentum should be deployed as one Node web service. Express already serves both the compiled Vite application and the API, so the project does not need separate front-end and back-end deployments. MongoDB Atlas remains the persistent database.

GitHub stores the source and gives the host a repository to deploy. GitHub Pages alone is not appropriate for this application because Pages only serves static files; it cannot run the Express API or keep server-side secrets.

## Recommended host

Use a [Render web service](https://render.com/docs/web-services) connected to the GitHub repository. Render can build after each push to `main`, supplies an HTTPS `onrender.com` address, and passes its assigned `PORT` value to the server.

The free web-service plan is adequate for a portfolio demonstration, but it [spins down after 15 minutes without traffic](https://render.com/docs/free). The first request after that can take about a minute. A paid instance avoids that delay if a consistently responsive demo becomes important.

## Render settings

Create a **Web Service**, select the repository, and use these values:

| Setting | Value |
| --- | --- |
| Branch | `main` |
| Root directory | Leave blank so commands run from the repository root |
| Runtime | Node |
| Build command | `npm ci && npm run build` |
| Start command | `STATIC=packages/app/dist node packages/server/dist/index.js` |
| Health check path | `/login.html` |

Add these environment variables in the Render dashboard. Do not put their values in GitHub or in this document.

| Variable | Value |
| --- | --- |
| `NODE_VERSION` | `24.18.0` |
| `MONGO_USER` | Atlas database username |
| `MONGO_PWD` | Atlas database-user password |
| `MONGO_CLUSTER` | Atlas cluster hostname only |
| `TOKEN_SECRET` | A new, long, random production secret |

Do not set `PORT`; Render supplies it. Use a separate production `TOKEN_SECRET` instead of copying a development secret.

## Atlas network access

Atlas only accepts connections from entries in the project's IP access list. After creating the Render service:

1. Open the service in Render.
2. Open **Connect**, then **Outbound**, and copy every listed outbound CIDR range. Render documents this under [Outbound IP Addresses](https://render.com/docs/outbound-ip-addresses).
3. In Atlas, open **Network Access** and add those ranges to the project's [IP access list](https://www.mongodb.com/docs/atlas/security/ip-access-list/).
4. Redeploy or restart the Render service and confirm that its logs show the database connection before the server begins listening.

This is narrower than allowing `0.0.0.0/0`, which permits connection attempts from every IPv4 address. If Render changes its published outbound ranges later, the Atlas entries must be updated.

The Atlas database user should have only the access the application needs for the `WebDev437` database. The Atlas website account and the database user are separate identities.

## Deployment verification

After Render reports a successful deploy:

1. Open `/login.html` at the assigned Render URL.
2. Register a temporary account with non-sensitive information.
3. Create, open, edit, and delete an event.
4. Refresh the page and confirm the remaining data persists.
5. Log out and log back in.
6. Check the browser console and Render logs for errors.
7. Remove the temporary account directly in Atlas if it should not remain as demo data.

Once this passes, add the live URL near the top of the README and in the GitHub repository's **About** section. Screenshots or a short walkthrough can be added afterward; the working URL and clear README are the higher-value evidence.

