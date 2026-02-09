# Learn with Jiji — Backend Assignment Task List

> Reference: VeidaLabs Server-Side Assignment (Learn with Jiji)

---

## Overview

**Goal:** Build a backend service that:

- Accepts a user query
- Fetches relevant learning resources from Supabase
- Returns a structured response (answer + resources)
- Uses Supabase for DB, Auth, and Storage
- Implements basic security and RLS

---

## 1. Project Setup

### 1.1 Initialize Project

- [ ] Create project folder
- [ ] Initialize git repository
- [ ] Initialize Node.js project

```bash
npm init -y
```

- [ ] #Install dependencies

```bash
npm install express cors dotenv @supabase/supabase-js
npm install --save-dev nodemon
```

### 1.2 Create Folder Structure

```
project-root/
│
├── src/
│   ├── index.js
│   ├── routes/
│   │   └── jiji.routes.js
│   ├── controllers/
│   │   └── jiji.controller.js
│   ├── services/
│   │   └── jiji.service.js
│   └── utils/
│       └── supabaseClient.js
│
├── supabase/
│   └── schema.sql
│
├── .env
├── .gitignore
└── README.md
```

### 1.3 Setup Environment Variables

- [ ] Create `.env`

```env
PORT=3000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] Add `.gitignore`

```gitignore
node_modules
.env
```

---

## 2. Supabase Setup

### 2.1 Create Supabase Project

- [ ] Go to Supabase dashboard
- [ ] Create new project
- [ ] Copy:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

### 2.2 Create Tables

Run SQL in Supabase SQL Editor:

```sql
-- profiles table
create table profiles (
  id uuid primary key references auth.users(id),
  email text,
  created_at timestamp default now()
);

-- queries table
create table queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  query_text text not null,
  created_at timestamp default now()
);

-- resources table
create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text,
  file_url text,
  topic text,
  created_at timestamp default now()
);
```

### 2.3 Insert Sample Resource Data

```sql
insert into resources (title, description, type, file_url, topic)
values
(
  'Presentation on RAG',
  'RAG powerpoint presentation',
  'ppt',
  'https://example.com/rag.pptx',
  'rag'
),
(
  'What is RAG Video',
  'RAG explanation video',
  'video',
  'https://example.com/rag.mp4',
  'rag'
);
```

### 2.4 Setup Storage

- [ ] Go to Storage
- [ ] Create bucket: `learning-resources`
- [ ] Upload:
  - Sample PPT
  - Sample video
- [ ] Copy public URLs
- [ ] Update resources table with URLs

---

## 3. Enable Row Level Security (RLS)

Enable RLS:

```sql
alter table profiles enable row level security;
alter table queries enable row level security;
alter table resources enable row level security;
```

Create policies:

```sql
create policy "Allow read resources"
on resources
for select
using (true);

create policy "Allow insert queries"
on queries
for insert
with check (true);

create policy "Allow read queries"
on queries
for select
using (true);
```

---

## 4. Backend Implementation

### 4.1 Create Supabase Client

**File:** `src/utils/supabaseClient.js`

- [ ] Import `createClient`
- [ ] Load env variables
- [ ] Export supabase client

### 4.2 Create Express Server

**File:** `src/index.js`

- [ ] Initialize express
- [ ] Add middleware:
  - `cors`
  - `express.json()`
- [ ] Register routes
- [ ] Start server

### 4.3 Create Route

**File:** `src/routes/jiji.routes.js`

**Endpoint:**

```
POST /ask-jiji
```

### 4.4 Create Controller

**File:** `src/controllers/jiji.controller.js`

**Tasks:**

- [ ] Read query from request body
- [ ] Validate input
- [ ] Call service
- [ ] Return response

### 4.5 Create Service

**File:** `src/services/jiji.service.js`

**Tasks:**

- [ ] Search resources table
- [ ] Save query into queries table
- [ ] Generate mock answer
- [ ] Return structured result

---

## 5. Request and Response Format

### Request

```http
POST /ask-jiji
Content-Type: application/json

{
  "query": "Explain RAG"
}
```

### Response

```json
{
  "answer": "Retrieval-Augmented Generation (RAG) combines search with LLMs...",
  "resources": [
    {
      "title": "Presentation on RAG",
      "type": "ppt",
      "url": "..."
    },
    {
      "title": "What is RAG Video",
      "type": "video",
      "url": "..."
    }
  ]
}
```

---

## 6. Input Validation

- [ ] Ensure query exists
- [ ] Ensure query is string
- [ ] Ensure query not empty
- [ ] Return 400 if invalid

---

## 7. Error Handling

- [ ] Handle database errors
- [ ] Handle invalid requests
- [ ] Handle empty results
- [ ] Return proper codes:
  - `200` success
  - `400` bad request
  - `500` server error

---

## 8. Testing

Start server:

```bash
npm run dev
```

Test endpoint using Postman:

```
POST http://localhost:3000/ask-jiji
```

**Body:**

```json
{
  "query": "Explain RAG"
}
```

**Verify response contains:**

- [ ] answer
- [ ] ppt resource
- [ ] video resource

---

## 9. README Creation

Include:

- [ ] Project overview
- [ ] Setup instructions
- [ ] How to run
- [ ] API documentation
- [ ] Supabase schema explanation
- [ ] RLS explanation
- [ ] Improvement suggestion

---

## 10. GitHub Submission

- [ ] Push code to GitHub
- [ ] Ensure `.env` not committed
- [ ] Ensure README included
- [ ] Ensure clean structure

---

## 11. Demo Video

Record short video showing:

- [ ] Supabase tables
- [ ] Storage bucket
- [ ] Backend running
- [ ] API call in Postman
- [ ] Response working

---

## Final Checklist

- [ ] Backend working
- [ ] Supabase connected
- [ ] Tables created
- [ ] Storage working
- [ ] RLS enabled
- [ ] API working
- [ ] README done
- [ ] GitHub repo ready
- [ ] Demo video recorded
