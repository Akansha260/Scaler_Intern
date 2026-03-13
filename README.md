# TaskWeave

A full-stack project management application inspired by Trello, built with Next.js, Express, and PostgreSQL.

## Features

### 1. Board Management
- **Create Boards**: Easily create new project boards with descriptive titles.
- **Detailed View**: Open any board to see all associated lists and cards in a single workspace.

### 2. List Management
- **Full CRUD**: Create, edit titles, and delete lists as your project evolves.
- **Reorder with Ease**: Drag and drop to reorder lists across the board to match your workflow.

### 3. Card Management
- **Task Creation**: Add cards to any list with just a title.
- **Rich Details**: Edit card titles and add detailed descriptions to provide context.
- **Flexible Organization**:
  - **Move or Reorder**: Drag and drop cards within a list or between different lists.
  - **Archive**: Hide cards from view without deleting them, keeping your workspace clutter-free.
  - **Delete**: Permanently remove tasks when they are no longer needed.

### 4. Card Details & Productivity
- **Visual Labels**: Add and remove color-coded tags to categorize tasks at a glance.
- **Due Dates**: Set deadlines on cards to stay on top of your schedule.
- **Interactive Checklists**: Add sub-tasks with progress tracking (mark as complete/incomplete).
- **Team Assignment**: Assign one or more members to specific cards for clear ownership.

### 5. Search & Filter
- **Powerful Search**: Quickly find any card by searching for keywords in its title.
- **Granular Filtering**: Narrow down your view by filtering cards based on labels, members, or due dates.

### 6. Accessibility & Design
- **Colorblind Friendly**: Specially designed patterns for labels to ensure accessibility for all users.
- **Modern UI**: A sleek, dark-themed interface built for performance and visual clarity.
- **Persistence**: Fully integrated with a PostgreSQL database for real-time updates across sessions.

## Tech Stack

**Frontend:**
- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS 4**
- **Lucide React** (Icons)
- **Hello Pangea DND** (Drag and Drop)

**Backend:**
- **Node.js**
- **Express 5**
- **PostgreSQL** (Database)
- **pg** (PostgreSQL client)
- **Nodemon** (Development server)

## App Flow

1. **Client**: The Next.js frontend provides a responsive UI for interacting with boards.
2. **API**: The Express backend handles RESTful requests for boards, lists, cards, and users.
3. **Database**: PostgreSQL stores all persistent data, including complex relationships like card-labels and card-members.

## Setup Instructions

### Prerequisites
- **Node.js**: v18 or higher.
- **PostgreSQL**: Installed and running locally.

### 1. Database Setup
1. Create a database named `trello_clone` in PostgreSQL.
2. Navigate to the `server` directory.
3. Create a `.env` file (if not already present) with your database credentials:
   ```env
   DB_USER=your_postgres_user
   DB_HOST=localhost
   DB_NAME=trello_clone
   DB_PASSWORD=your_password
   DB_PORT=5432
   PORT=5000
   ```
4. Run the database setup and seeding script (located at `db/setup.js`) by running this command from the `server` directory:
   ```bash
   node db/setup.js
   ```
   Or use the npm script:
   ```bash
   npm run seed
   ```

### 2. Running Locally

**Start the Backend:**
```bash
cd server
npm install
npm run dev
```

**Start the Frontend:**
```bash
cd client
npm install
npm run dev
```

The application will be available at `http://localhost:3000` (Frontend) and `http://localhost:5000` (Backend API).

## Assumptions

- **Environment**: Assumes a Unix-like or Windows terminal with Node.js installed.
- **Database**: Assumes PostgreSQL is listening on the default port `5432`.
- **CORS**: Configured to allow interactions between `localhost:3000` and `localhost:5000`.
