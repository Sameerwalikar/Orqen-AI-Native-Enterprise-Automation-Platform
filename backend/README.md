# Backend API

Node.js + Express.js backend server with PostgreSQL and Prisma

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Create a `.env` file in the backend directory
   - Add the following variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"
   PORT=5000
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

   # Google OAuth (required for Google Sign-In)
   GOOGLE_CLIENT_ID="your-google-oauth-client-id.apps.googleusercontent.com"
   ```
   
   **JWT_SECRET Explanation:**
   - This is used to sign and verify JWT tokens for authentication
   - For **local development**, you can use any long random string (minimum 32 characters)
   - For **production**, use a strong, randomly generated secret
   - Generate a secure secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
   - **Never commit** the `.env` file to version control

3. Set up the database:
```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run migrate

# (Optional) Open Prisma Studio to view/edit data
npm run prisma:studio
```

4. Start the server:
```bash
npm start
# or for development
npm run dev
```

## Database Schema

### User Model
- `id` - Auto-incrementing integer (Primary Key)
- `firstName` - String
- `gmail` - Unique email string
- `password` - String (hashed)
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

## API Endpoints

### General
- `GET /` - Welcome message
- `GET /health` - Health check endpoint

### Authentication (`/api/auth`)
- `POST /api/auth/sign-up` - Register a new user
  - Body: `{ "firstName": "string", "gmail": "string", "password": "string" }`
- `POST /api/auth/sign-in` - Login user
  - Body: `{ "gmail": "string", "password": "string" }`

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- CORS
- dotenv
