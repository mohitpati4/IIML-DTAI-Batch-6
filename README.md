# Taskflow — Personal Task Manager

A lightweight task manager built with Next.js, React and TypeScript. Designed for GitHub + Vercel deployment.

## Included
- Create, edit and delete tasks
- Start dates, due dates, categories and priority
- Status and percentage-based progress tracking
- Task-level progress notes with timestamps
- Dashboard counts for total, in-progress, completed and overdue tasks
- Search and filter by status / priority
- Upcoming, overdue and completed views
- Responsive layout for desktop and mobile

## Run locally
Requirements: Node.js 20.9+ and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy to Vercel
1. Create a new GitHub repository.
2. Extract this ZIP and push the project files to the repository.
3. In Vercel, choose **Add New → Project** and import the GitHub repository.
4. Keep the default Next.js build settings and deploy. No environment variables are required.

Every push to the connected GitHub branch can trigger a new Vercel deployment.

## Important storage note
This starter version saves tasks in the browser's `localStorage`. It requires no database and is useful for a single-browser personal workspace. Data does **not** automatically sync between devices or browsers, and clearing browser data can remove tasks.

For multi-device access, user accounts, shared workspaces, automatic reminders (email/push), and reliable cloud backup, connect a database such as Supabase or Neon and add an authentication provider. Vercel hosting by itself is not a database or notification service.

## Suggested next upgrades
- Supabase database + authentication
- Email reminders before due dates
- Recurring tasks
- Subtasks and dependencies
- Export / import CSV
- Weekly and monthly reports
