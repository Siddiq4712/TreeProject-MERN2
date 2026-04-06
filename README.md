## TreeNadu

TreeNadu is a MERN-based tree plantation management platform for volunteers, sponsors, landowners, organizers, and admins. It helps teams create plantation events, allocate land, join field work, sponsor trees, monitor growth, and review impact.

## What This Application Does

The platform is designed to support the full plantation workflow:

1. Land is added and prepared for plantation use.
2. An organizer creates a plantation event with goals, location, and contact details.
3. Volunteers join the event and take up plantation tasks.
4. Sponsors contribute funds or resources and can sponsor specific trees.
5. Tree status and health are updated during and after planting.
6. Admins monitor users, reports, donations, and overall impact.

## User Roles And Responsibilities

### Volunteer

- Join plantation events.
- Perform field tasks like digging, planting, watering, fertilizing, and guarding.
- Update tree progress and help maintain accurate activity records.

### Sponsor

- Fund or procure resources for events.
- Sponsor specific trees.
- Track the impact of donations and see which trees were supported.

### Organizer

- Create and manage plantation events.
- Assign land, define goals, and coordinate campaign details.
- Review participation requests and monitor event readiness.

### Landowner

- Add and manage land records.
- Share land that can be used for plantation events.
- Track how many events and trees are associated with each property.

### Admin

- Manage user types and platform access.
- Review reports on events, trees, volunteer activity, and donations.
- Monitor the overall health and progress of the platform.

## Main Modules

### Home / Dashboard

- Shows a high-level overview of events and platform activity.
- Gives quick-start guidance based on the logged-in user role.
- Helps new users understand what to do first.

### Event Studio

- Create plantation events.
- Add event goals, land details, contact person details, media plans, volunteer counts, and sponsorship assumptions.
- Review event requests and monitor progress.

### Explore Events

- Browse open events.
- Search by location, event ID, or species.
- Join an event as a volunteer or sponsor.

### Land Hub

- Add land with area, address, soil type, water availability, and location details.
- View land portfolio and track how land is used by events and trees.

### Tree Tracker

- View all related trees in one place.
- Check tree sponsor, planter, growth stage, height, and health status.
- Use the historical tree form for older trees that were planted before using the app.

### Admin Dashboard

- Review user mix across volunteers, sponsors, landowners, organizations, and admins.
- Monitor total events, trees, donations, volunteer hours, and report snapshots.

## How To Use The Application

### 1. Start The Project

Backend:

```bash
cd backend
npm install
npm start
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## First-Time Usage Flow

### For Organizers

1. Register as `Organizer`.
2. Add land in `Land Hub` if land is already available.
3. Create a new event in `Event Studio`.
4. Set tree count, expected volunteers, maintenance plan, and contact details.
5. Wait for volunteers and sponsors to join.
6. Track event progress and tree status updates.

### For Volunteers

1. Register as `Volunteer`.
2. Open `Explore Events`.
3. Select an event and join it.
4. Choose labor tasks and contribute volunteer work.
5. Update tree tasks as work is completed.

### For Sponsors

1. Register as `Sponsor`.
2. Open `Explore Events`.
3. Join an event as a sponsor.
4. Add funding or procurement details.
5. Monitor sponsored trees and contribution impact.

### For Landowners

1. Register as `Landowner`.
2. Add land in `Land Hub`.
3. Share land for organizers to use in plantation events.
4. Monitor trees and events connected to your land.

### For Admins

1. Sign in with the admin account configured in `.env`.
2. Open the `Admin` section from the sidebar.
3. Review user statistics, reports, donation impact, and activity levels.

## Key Product Flow

1. Admin or organizer prepares the system and confirms land.
2. Organizer creates a plantation event.
3. Volunteers and sponsors join the event.
4. Trees are tracked from planning to maintenance.
5. Admin reviews reports and platform-wide impact.

## Current Feature Highlights

- Role-based authentication and access
- Admin dashboard
- Event creation with detailed plantation planning
- Land portfolio management
- Tree tracking and historical tree import
- Sponsor contribution tracking
- Volunteer task and hour tracking
- Reporting snapshots for donations, events, and trees

## Recommended Next Enhancements

- Payment gateway integration for real donations
- Reminder engine for watering and maintenance alerts
- Map-based tree and land visualization
- Spot-level land subdivision inside events
- Exportable PDF or CSV reports
- Notification center for volunteers and sponsors
