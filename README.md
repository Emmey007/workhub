# WorkHub: sign-in UI + Express + Mongoose (email only)

Only the **email address** is stored in MongoDB. The password field is never sent to the server
and nothing about it is stored. Add your own handling in `handlePassword()` in `public/app.js`.

## Run locally
    npm install
    cp .env.example .env      # then set MONGODB_URI
    npm start                 # http://localhost:3000

## How it works
- Pressing Next on the email screen (or Create account) calls `POST /api/email`.
- `server.js` validates it, lowercases it, and upserts it into the `emails` collection (no duplicates).
- The server answers the same way whether or not the email already existed.
- Protections: Helmet security headers + CSP, 2 KB body limit, rate limit (20/min), input validation,
  email never inserted into the page as HTML.

## Before going live
- Use MongoDB Atlas with a restricted database user and an IP allow-list; keep the URI only in `.env`.
- Serve over HTTPS (Render, Railway, a VPS behind Nginx, etc.).
- Add real Privacy/Cookie pages, since you're collecting email addresses.
- GitHub: enable Secret scanning + Push protection and require the Security checks on `main`.
