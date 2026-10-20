# TaskFlow – Task Manager (MERN)

React + Vite, Tailwind CSS, Redux Toolkit (RTK Query), Headless UI  |  Node.js, Express, MongoDB (Mongoose)

## Roles and workflow

| | Employee | Admin |
|---|---|---|
| Sees | only own tasks | all tasks |
| Create task | for himself | for any user(s) (assign) |
| Update status | To Do -> In Progress | any status |
| Finish work | **Submit for review** (note + photos) | **Approve** (complete) or **Send back** with feedback |
| Trash | moves own task to trash, can restore | moves to trash, restore |
| Delete forever | not allowed | **only admin** |
| Users | - | create, edit, reset password, disable / activate, delete |
| Comments | yes (on own tasks) | yes |

Task status flow: `To Do -> In Progress -> Under Review (submitted) -> Completed`
(admin can send a submitted task back to `In Progress` with feedback).

## Features
Secure login (JWT cookie + bcrypt) · role-based access · user management · task assignment ·
priority (high / medium / normal / low) · status tracking · due date · image upload (stored on **your** server,
`server/uploads`) · trash / soft delete · comments + activity timeline · sub-tasks · search + filters + sorting ·
list and board view · dashboard with charts · in-app notifications · dark theme.

## Run locally

Needs: Node.js 18+ and MongoDB (local or Atlas).

```bash
# 1) backend
cd server
cp .env.example .env        # then edit MONGODB_URI and JWT_SECRET
npm install
npm run seed                # creates the first admin (admin@example.com / Admin@123)
npm run dev                 # http://localhost:8800

# 2) frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:3000
```

Open http://localhost:3000 and log in as admin, then create employees from **Team -> Add user**.

## Folder structure
```
server/  controllers, models, routes, middleware, uploads/ (images), seed.js, index.js
client/  src/pages, src/components, src/redux (RTK Query api slices), src/utils
```
