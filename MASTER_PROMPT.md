# MASTER PROMPT – 24H Hackathon Management Website
Excel Engineering College – Department of Information Technology, Komarapalayam (NH-544 Salem Main Road, Pallakkapalayam, Sankari West Post, Komarapalayam – 637303, Namakkal District, TN)

Use the attached UI screenshot ONLY as a visual model (dark aurora + glassmorphism, cyan/blue/violet/green glow, sticky header, hero + countdown, pillars, timeline, rules, prizes, judges, FAQ, footer). Do NOT copy its sample data.

## Prompt 1 – Project setup
Build a 5-page site: Home, Registration, Login (Team/Admin), Team Dashboard, Admin Dashboard. Stack: HTML, CSS, JS (later Node + Express + MongoDB). Files: index.html, style.css, app.js.

## Prompt 2 – Home + Registration
Home: hero with animated countdown, About, Highlights, Timeline, Rules (expandable), Prizes, Judges/Mentors, FAQ, Register button. Registration: 4 steps (Team, Members, Payment + screenshot, Done with Team ID). Collect full details only for the team leader; collect only each other team member's name and store members as a list of name strings. Teams select their track and matching problem statement after login in the Team Dashboard. Every event value (date, fee, tracks, problems, prizes, judges, rules, contact) is admin-editable; never hard-code assumptions.

## Prompt 3 – Login + Access control
Team login: User ID = Leader Name, Password = Leader Mobile. Team dashboard shows ONLY that team's data. Admin login is separate. Two roles only: Admin, Team.

## Prompt 4 – Admin Dashboard
Stats, event/timeline/rules/prizes/judges/FAQ/announcements CRUD, team search/view/edit/delete, participant name-only edit, payment + registration status, team account create/edit/reset password/enable/disable, Team ID edit (24H001 format).

## Prompt 5 – Design + Responsive
Aurora animated background, glass cards, hover glow, scroll-safe animations, hamburger menu on mobile, admin tables become cards on small screens, high contrast, reduced-motion support.

## Prompt 6 – Backend upgrade (production)
Replace localStorage with Node/Express + MongoDB, hashed passwords (bcrypt), JWT sessions, server-side role checks, image upload storage, and change the default admin password.
