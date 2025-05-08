# Team Project 20202-GVP - Restaurant Reservation System

## Team Members

- Neel Asheshbhai Shah - 018211557
- Vedant Tushar Mehta - 018207436
- Aarav Pranav Shah - 018211544

## Component Ownership

Each team member is responsible for specific components of the project:

- **Neel Asheshbhai Shah**: 
  - Frontend architecture
  - User interface components
  - Reservation management UI
  - Frontend-backend integration

- **Vedant Tushar Mehta**: 
  - Backend architecture
  - Database schema design
  - Authentication system
  - API development
  - Deployment configuration

- **Aarav Pranav Shah**: 
  - Restaurant and review APIs
  - Search and filtering functionality
  - Testing and quality assurance
  - Data validation and security
  - Deployment on GCP

## Project Documentation

- [Project Journal](https://docs.google.com/document/d/1TS9NoRIwt4UId85oS87dC9UE69MNtO2Z9WSfPYzfORA/edit?usp=sharing) - Contains detailed documentation of the project's progress, decisions, and milestones throughout the development cycle.

- [Sprint Planning Board](https://docs.google.com/spreadsheets/d/1FenO_zIaC9q9hONk2DmadfHh_6im6g3M45Z7zunPbt0/edit?usp=sharing) - Tracks sprint activities with details on team member tasks, priorities, story points, and completion status across six sprints.

- [UI Wireframes](https://app.visily.ai/projects/d083204c-5e04-4c2c-8d19-62d5b23f62d1/boards/1868393) - Visual designs and mockups for the project interface.

## Architecture Diagrams

The architecture of our restaurant reservation system follows a modern client-server model:

### Component Diagram
![Component Diagram](Architecture/ComponentDiagram.png)

### Deployment Diagram
![Deployment Diagram](Architecture/DeploymentDiagram.jpg)

### Database Schema
![Database Schema](Architecture/DbSchema.png)

### Deployment Screenshots

#### Auto Scaling Group Policy (AWS)
![Scaling](Deployment/Scaling.png)
This screenshot shows the AWS Auto Scaling group configuration, where the group automatically adjusts the number of running instances based on average CPU utilization, with a target value of 50% and a minimum/maximum capacity range. This ensures efficient resource usage and high availability under varying loads.

#### Load Balancer Resource Mapping (AWS)
![Resource Mapping](Deployment/Resource_mapping.png)
This diagram illustrates the AWS Application Load Balancer setup, mapping HTTP traffic to a target group of EC2 instances. The load balancer distributes incoming requests to multiple backend instances, supporting scalability and fault tolerance.

## Technology Stack

### Frontend
- **Framework**: Next.js 
- **UI Libraries**: Tailwind CSS, React 


### Backend
- **Framework**: Django 5.1.6, Django REST Framework 3.15.2
- **API Authentication**: JWT (djangorestframework_simplejwt 5.5.0)
- **Database**: PostgreSQL (psycopg2-binary 2.9.10)
- **Cloud Storage**: AWS S3 (boto3 1.38.3)


### Deployment
- Frontend: Docker containers deployed on AWS ECR with Auto Scaling Group and Load Balancer
- Backend: GCP Cloud SQL for database with auto-scaling instance group and load balancer

## Feature Set

Our Restaurant Reservation System provides the following key features:

1. **User Authentication**
   - User registration and login
   - Role-based access (Customer, Restaurant Manager, Admin)

2. **Restaurant Management**
   - Restaurant owners can create/edit restaurant profiles
   - Upload images, menus, and opening hours
   - Manage tables and seating capacity

3. **Reservation System**
   - Customers can search for restaurants by location, cuisine, and availability
   - Make, modify, and cancel reservations
   - View reservation history and upcoming bookings

4. **Table Management**
   - Real-time table availability tracking
   - Automatic table assignment based on party size
   - Configurable time slots based on restaurant settings

5. **Reviews and Ratings**
   - Customers can leave reviews and ratings after dining
   - Restaurant owners can respond to reviews
   - Average ratings displayed on restaurant profiles

6. **Notifications**
   - Email confirmations for reservations
   - Reminder notifications before reservation time
   - Cancellation and modification notifications

## Design Decisions

The project was designed with the following key principles in mind:

1. **Separation of Concerns**: 
   - Frontend and backend are completely decoupled
   - RESTful API design for clear communication between client and server

2. **Responsive Design**:
   - Responsive design approach using Tailwind CSS
   - Optimized for all device sizes from mobile to desktop

3. **Security**:
   - JWT-based authentication for secure API access
   - Input validation on both client and server side
   - Protection against common web vulnerabilities

4. **Performance**:
   - Server-side rendering for critical pages
   - Dynamic imports for code splitting
   - Optimized database queries with proper indexing

5. **Scalability**:
   - Multi-cloud deployment with AWS (frontend) and GCP (backend)
   - Auto-scaling groups to handle varying traffic loads
   - Load balancers to distribute requests efficiently
   - Cloud-managed database for reliability and scalability

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Docker and Docker Compose
- PostgreSQL (if running locally without Docker)

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/team-project-20202-gvp.git
   cd team-project-20202-gvp
   ```

2. Set up the backend:
   ```bash
   cd backend
   # Create a virtual environment (optional but recommended)
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create a .env file with necessary environment variables
   # Sample .env content:
   # DATABASE_URL=postgres://user:password@localhost:5432/restaurant_db
   # SECRET_KEY=your-secret-key
   # DEBUG=True
   # ALLOWED_HOSTS=localhost,127.0.0.1
   
   # Run migrations
   python manage.py migrate
   
   # Start the development server
   python manage.py runserver
   ```

3. The backend will be available at `http://localhost:8000/`

### Frontend Setup

1. Set up the frontend:
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Create a .env.local file with necessary environment variables
   # Sample .env.local content:
   # NEXT_PUBLIC_API_URL=http://localhost:8000/api
   
   # Start the development server
   npm run dev
   ```

2. The frontend will be available at `http://localhost:3000/`



[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/5Qp4_Wqy)

