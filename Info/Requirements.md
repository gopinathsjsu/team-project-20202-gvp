# Restaurant Reservation System

## Project Overview
This project aims to develop a Restaurant Reservation System with role-based access control, a cloud-deployed backend API, and a web or mobile UI. The system will enable customers to search for and book tables at restaurants, allow restaurant managers to manage listings, and provide administrators with oversight and analytics.

## Components
### APIs
- Input and output should be in JSON format.
- Must include error handling and input validation.
- APIs will be demonstrated via a web/mobile UI.

### User Roles and Functionalities
#### Customers
- Search for restaurants by:
  - Date
  - Time
  - Number of people
  - (Optional) City/State or Zip code
- View available restaurants with details:
  - Name
  - Cuisine type
  - Cost rating
  - Reviews and Ratings
  - Number of times booked today
- View clickable buttons with available time slots to book a table.
- View restaurant reviews.
- View restaurant location on Google Maps.
- Register/Login.
- Book a table (receive confirmation via email/SMS).
- Cancel a booking.

#### Restaurant Managers
- Add a new restaurant listing.
- Add/Update:
  - Name
  - Address
  - Contact information
  - Hours of operation
  - Available booking times
  - Table sizes
- Add/Update descriptions and photos.
- Login as Restaurant Manager (manual registration process).

#### Admins
- Remove restaurants.
- Approve new restaurants.
- View an analytics dashboard showing reservations for the last month.

### Deployment
- API and Database should be deployed on AWS or another cloud provider.
- Utilize an Auto-Scaled EC2 Cluster with a Load Balancer.
- Web or mobile UI should call the deployed APIs.

### Database
- Create a mock database with:
  - Restaurant listings
  - Customers
  - Restaurant Managers

## Project Management
### Team Responsibilities
- Each team member must own at least one software component.
- Maintain a Project Journal on GitHub including:
  - Weekly Scrum Reports answering:
    - What tasks did I work on/complete?
    - What am I planning to work on next?
    - What tasks are blocked?
  - Select two XP Core Values and summarize their application:
    - Communication
    - Simplicity
    - Feedback
    - Courage
    - Respect
  - Maintain a Scrum Backlog for each sprint (Google Sheets or screenshots from another tool).
  - Update the Story on the Task Board.
  - Track the Team's Burndown Chart.
  - Maintain project artifacts and code in the assigned GitHub repo.

### Design Artifacts
- **UI Wireframes**: Create for all screens (hand-drawn or using a tool like Pencil).
- **Component Diagram**: Show the overall architecture.
- **Deployment Diagram**: Use UML notation.

## Documentation
- Maintain a `README.md` file in the GitHub repository including:
  - All diagrams
  - Design decisions
  - Overall feature set

## Project Demo
- Teams will present a working prototype on "Demo Day."

## Grading Criteria
- **Team Score**: Evaluated on Demo Day (100 points total).
- **Individual Deductions**: Based on contributions.

### Scoring Breakdown
| Criteria | Weight |
|----------|--------|
| Implementation of Requirements (working software) | 70% |
| Component, Deployment Diagrams, Agile Scrum Process | 30% |

### Contribution Tracking
- Contributions must be visible on GitHub.
- Frequency and quality of commits will be evaluated.
- Significantly lesser contributions will result in individual deductions.
- Guidelines for GitHub contributions: [GitHub Help](https://help.github.com/articles/why-are-my-contributions-not-showing-up-on-my-profile/).
