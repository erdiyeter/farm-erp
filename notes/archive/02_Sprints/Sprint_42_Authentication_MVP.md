# Sprint 42 - Authentication MVP

## Goal

Require a basic login before users can access the Farm ERP frontend.

## Scope

- Single default administrator account.
- Email/password login and logout.
- JWT access tokens and protected current-user endpoint.
- Persistent frontend login using local storage.
- Frontend route protection for application pages.

## Files Created

- `backend/app/models/user.py`
- `backend/app/schemas/auth.py`
- `backend/app/repositories/user.py`
- `backend/app/services/auth.py`
- `backend/app/routers/auth.py`
- `frontend/src/api/authApi.js`
- `frontend/src/context/authContext.js`
- `frontend/src/context/AuthProvider.jsx`
- `frontend/src/pages/Login.jsx`
- `notes/02_Sprints/Sprint_42_Authentication_MVP.md`

## Files Modified

- `backend/requirements.txt`
- `backend/app/models/__init__.py`
- `backend/app/init_db.py`
- `backend/app/main.py`
- `frontend/src/App.jsx`
- `frontend/src/App.css`

## Backend Changes

- Added the users table and default active administrator seed.
- Added password hashing with passlib bcrypt.
- Added JWT creation and validation with python-jose.
- Added login and protected current-user endpoints.

## Frontend Changes

- Added login API calls and page.
- Added a small authentication context with local-storage persistence.
- Added protected routes, logged-user display, and logout behavior.

## Security Decisions

- Passwords are stored only as bcrypt hashes.
- Access tokens expire after 24 hours.
- `/api/v1/auth/me` requires a bearer token.
- Existing business APIs remain unprotected for this sprint.

## Out of Scope

- Registration, password reset, email verification, and OAuth.
- Refresh tokens, roles, permissions, and multiple auth providers.
- Advanced token revocation or session management.

## Verification Checklist

- [ ] Install backend dependencies.
- [ ] Initialize the database and create the default administrator.
- [x] Compile backend modules.
- [ ] Verify successful and failed login behavior.
- [ ] Verify authenticated and unauthenticated `/auth/me` behavior.
- [x] Run frontend lint and production build.
- [ ] Verify redirect, refresh persistence, and logout in a browser.
