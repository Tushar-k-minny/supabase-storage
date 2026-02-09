# Learn with Jiji Backend

> 🧠 AI Learning Companion Backend Service

A production-quality Express.js backend built with TypeScript, pnpm, and Supabase for the **Learn with Jiji** AI Learning Companion application.

## Tech Stack

| Technology     | Purpose           |
| -------------- | ----------------- |
| **Node.js**    | Runtime           |
| **pnpm**       | Package Manager   |
| **TypeScript** | Language          |
| **Express.js** | Web Framework     |
| **Supabase**   | Database & Auth   |
| **Zod**        | Schema Validation |

## Getting Started

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** package manager
  ```bash
  npm install -g pnpm
  ```
- **Supabase** account (free tier works) — [supabase.com](https://supabase.com)

---

### Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourusername/learn-with-jiji-backend.git
cd learn-with-jiji-backend

# Install dependencies
pnpm install
```

---

### Step 2: Configure Environment

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
# Required: Get these from Supabase Dashboard → Settings → API
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional
PORT=3000
NODE_ENV=development
```

> 💡 **Tip:** You can run without Supabase credentials — the app will work in "mock mode" with sample responses.

---

### Step 3: Setup Supabase Database

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Open **SQL Editor**
3. Copy and run the contents of `supabase/migrations/001_initial_schema.sql`

This creates:
- `profiles` table (users)
- `queries` table (user questions)
- `resources` table (PPT/video learning materials)
- Row Level Security (RLS) policies
- Sample data

---

### Step 4: Setup Supabase Storage (Optional)

1. Go to **Storage** in Supabase Dashboard
2. Create a bucket named `learning-materials`
3. Set it as **Public** (or configure signed URLs)
4. Upload sample files:
   - `presentations/sample.pptx`
   - `videos/sample.mp4`

---

### Step 5: Run the Server

```bash
# Development mode (with hot reload)
pnpm dev
```

You should see:

```
🧠 Learn with Jiji Backend

Server:      http://localhost:3000
Environment: development

Routes:
  GET  /health    → Health check
  POST /ask-jiji  → Ask Jiji a question
```

---

### Step 6: Test the API

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Ask Jiji (requires auth in production):**
```bash
curl -X POST http://localhost:3000/ask-jiji \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_JWT" \
  -d '{"query": "Explain RAG"}'
```

---

### Available Scripts

| Command       | Description                              |
| ------------- | ---------------------------------------- |
| `pnpm dev`    | Start development server with hot reload |
| `pnpm build`  | Compile TypeScript to JavaScript         |
| `pnpm start`  | Start production server (run build first)|
| `pnpm check`  | Run linter checks                        |
| `pnpm fix`    | Auto-fix linting issues                  |

## API Documentation

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "environment": "development"
  }
}
```

### Ask Jiji (Protected)

> ⚠️ **Authentication Required** - Include `Authorization: Bearer <token>` header

```http
POST /ask-jiji
Content-Type: application/json
Authorization: Bearer <supabase_jwt_token>
```

**Request Body:**

```json
{
  "query": "Explain RAG"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "answer": "Retrieval-Augmented Generation (RAG) combines search with LLMs...",
    "resources": [
      {
        "id": "uuid",
        "title": "Presentation on RAG",
        "type": "ppt",
        "url": "https://..."
      },
      {
        "id": "uuid",
        "title": "What is RAG video",
        "type": "video",
        "url": "https://..."
      }
    ]
  }
}
```

**Error Response (401 Unauthorized):**

```json
{
  "success": false,
  "error": "Authorization header required. Use: Bearer <token>"
}
```

**Error Response (400 Validation):**

```json
{
  "success": false,
  "error": "Validation failed: query: Query cannot be empty"
}
```

## Project Structure

```
├── src/
│   ├── config/
│   │   └── supabase.ts              # Supabase client configuration
│   ├── controllers/
│   │   └── ask-jiji.controller.ts   # Request handlers
│   ├── middleware/
│   │   ├── auth.middleware.ts       # JWT authentication & RBAC
│   │   ├── error-handler.middleware.ts  # Global error handling
│   │   └── validation.middleware.ts # Zod schema validation
│   ├── routes/
│   │   └── ask-jiji.routes.ts       # Express routes
│   ├── services/
│   │   ├── resource-service.ts      # Resource search & answers
│   │   └── storage-service.ts       # Supabase Storage operations
│   ├── types/
│   │   └── api-types.ts             # TypeScript interfaces
│   ├── utils/
│   │   └── logger.ts                # Pino logging utility
│   └── server.ts                    # Express app entry point
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql   # Tables, RLS, sample data
│       └── 002_storage_setup.sql    # Storage bucket setup
├── .env                             # Environment variables
├── .env.example                     # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Supabase Schema

> 📁 **SQL Migration Files**: See [`supabase/migrations/`](./supabase/migrations/) for complete database setup.

### Quick Setup

```bash
# Run migrations in Supabase SQL Editor or use Supabase CLI
npx supabase db push
```

### Tables

#### `profiles`

| Column     | Type        | Description        |
| ---------- | ----------- | ------------------ |
| id         | uuid (PK)   | Primary key        |
| email      | text        | User email (unique)|
| full_name  | text        | User's full name   |
| avatar_url | text        | Profile image URL  |
| created_at | timestamptz | Creation timestamp |
| updated_at | timestamptz | Last update        |

#### `queries`

| Column            | Type        | Description              |
| ----------------- | ----------- | ------------------------ |
| id                | uuid (PK)   | Primary key              |
| user_id           | uuid (FK)   | FK to profiles           |
| query_text        | text        | User's question          |
| answer_text       | text        | AI-generated answer      |
| resources_returned| uuid[]      | Resources shown to user  |
| created_at        | timestamptz | Query timestamp          |

#### `resources`

| Column       | Type        | Description               |
| ------------ | ----------- | ------------------------- |
| id           | uuid (PK)   | Primary key               |
| title        | text        | Resource title            |
| description  | text        | Resource description      |
| type         | text        | 'ppt' or 'video'          |
| file_url     | text        | Public URL to resource    |
| storage_path | text        | Path in Supabase Storage  |
| tags         | text[]      | Searchable tags (GIN idx) |
| created_at   | timestamptz | Creation timestamp        |
| updated_at   | timestamptz | Last update               |

### Row Level Security (RLS)

RLS is enabled on all tables. See [`001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql) for complete policies.

| Table     | Policy                                    |
| --------- | ----------------------------------------- |
| profiles  | Users can CRUD their own profile only     |
| queries   | Users can view/insert their own queries   |
| resources | Authenticated users can read all resources|

```sql
-- Key policies implemented:
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own queries" ON queries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can view resources" ON resources FOR SELECT TO authenticated USING (true);
```

## Supabase Storage

### Bucket Setup

1. Create a storage bucket named `learning-materials` in your Supabase dashboard
2. Set it as **public** for easy resource access (or configure signed URLs)
3. Upload sample files with this structure:

```
learning-materials/
├── presentations/
│   ├── rag-intro.pptx          # Sample PPT file
│   ├── ml-fundamentals.pptx
│   └── transformers.pptx
└── videos/
    ├── rag-tutorial.mp4        # Sample video file
    ├── neural-networks.mp4
    └── llm-apps.mp4
```

### Sample Files

For testing, you can use any PPT and video files. Place them in the bucket structure above, then update the `resources` table with correct URLs:

```sql
-- Update file URLs after upload
UPDATE resources 
SET file_url = 'https://YOUR_PROJECT.supabase.co/storage/v1/object/public/learning-materials/presentations/rag-intro.pptx'
WHERE storage_path = 'presentations/rag-intro.pptx';
```

## Authentication

### How Auth Works

The application uses **Supabase Auth** with JWT tokens:

1. **Client obtains token**: User signs in via Supabase Auth (email/password, OAuth, etc.)
2. **Token sent in requests**: Client includes `Authorization: Bearer <token>` header
3. **Server validates**: Middleware calls `supabase.auth.getUser(token)` to verify
4. **User attached**: Valid user info is attached to `req.user` for route handlers

### Auth Middleware

```typescript
// Protected route example
import { authenticate } from "./middleware/auth.middleware.js";

router.get("/protected", authenticate, (req, res) => {
  res.json({ user: req.user });
});
```

### Mock Mode

When `SUPABASE_URL` and `SUPABASE_ANON_KEY` are not configured:
- Auth middleware allows requests with a mock user
- Useful for local development without Supabase setup
- Resources return empty arrays (no database connection)

### Sample Data

```sql
-- Insert sample resources (included in migration)
INSERT INTO resources (id, title, description, type, file_url, storage_path, tags) VALUES
  (uuid_generate_v4(), 'Introduction to RAG', 'Learn the basics of RAG', 'ppt', 
   'https://your-project.supabase.co/storage/v1/object/public/learning-materials/presentations/rag-intro.pptx',
   'presentations/rag-intro.pptx', ARRAY['rag', 'ai', 'llm']),
  (uuid_generate_v4(), 'RAG Tutorial Video', 'Step-by-step RAG guide', 'video',
   'https://your-project.supabase.co/storage/v1/object/public/learning-materials/videos/rag-tutorial.mp4',
   'videos/rag-tutorial.mp4', ARRAY['rag', 'tutorial', 'video']);
```

## Environment Variables

| Variable            | Required | Description                        |
| ------------------- | -------- | ---------------------------------- |
| `SUPABASE_URL`      | Yes\*    | Supabase project URL               |
| `SUPABASE_ANON_KEY` | Yes\*    | Supabase anonymous key             |
| `PORT`              | No       | Server port (default: 3000)        |
| `NODE_ENV`          | No       | Environment (default: development) |

\*Required for database functionality. Mock responses work without Supabase.

## Future Improvements

- [ ] **Real AI Integration** - Connect to OpenAI, Claude, or other LLM APIs
- [ ] **User Authentication** - Implement Supabase Auth flow
- [ ] **Query History** - Store and retrieve user query history
- [ ] **Rate Limiting** - Add request rate limiting middleware
- [ ] **Caching** - Implement Redis caching for frequent queries
- [ ] **Testing** - Add Jest/Vitest unit and integration tests
- [ ] **API Documentation** - Generate OpenAPI/Swagger docs
- [ ] **Monitoring** - Add Prometheus metrics and health checks
- [ ] **Docker** - Add Dockerfile for containerization

## Scripts

| Command      | Description                              |
| ------------ | ---------------------------------------- |
| `pnpm dev`   | Start development server with hot reload |
| `pnpm build` | Build TypeScript to JavaScript           |
| `pnpm start` | Start production server                  |

## License

ISC
