# Content Generation API - UI Integration Guide

**Module:** Content Generation
**Base URL:** `/api/v1/content`
**Authentication:** Required (JWT Bearer token)

---

## Authentication

All endpoints require a JWT Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

**Required JWT Claims:**
- `user_id` - User identifier (required)
- `organisation_id` - Organization identifier (optional, defaults to global org)

---

## API Endpoints

### 1. Generate Quiz

**POST** `/api/v1/content/generate-quiz`

Generate AI-powered quiz questions from product IFU documents.

#### Request Body

```json
{
  "product_id": "uuid-string (required)",
  "audience_type": "new_rep | sales_rep | trainer | certification (required)",
  "difficulty": "beginner | intermediate | advanced (optional, default: intermediate)",
  "question_count": 10,
  "focus_areas": ["safety", "indications"]
}
```

#### Response (200 OK)

```json
{
  "generation_id": "uuid-string",
  "status": "success | partial | failed",
  "content": {
    "title": "Product Name - Knowledge Quiz",
    "difficulty": "beginner",
    "questions": [
      {
        "text": "What is the primary indication?",
        "type": "multiple_choice",
        "options": [
          { "index": 0, "text": "Option A" },
          { "index": 1, "text": "Option B" },
          { "index": 2, "text": "Option C" },
          { "index": 3, "text": "Option D" }
        ],
        "correct_answer": 1,
        "explanation": "Option B is correct because...",
        "position": 1
      }
    ]
  },
  "metadata": {
    "tokens_used": 1234,
    "generation_time_ms": 5678,
    "model_id": "anthropic.claude-3-5-sonnet-20241022-v2:0"
  }
}
```

#### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request body, invalid audience_type, difficulty, or question_count |
| 401 | Missing or invalid JWT token |
| 404 | Product not found or has no IFU content |
| 500 | Generation failed |
| 503 | LLM service temporarily unavailable |

```json
{
  "error": "Error message",
  "details": "Detailed error information (optional)"
}
```

---

### 2. List All Generations (NEW)

**GET** `/api/v1/content/generations`

Retrieve all content generations for the current user (across all products).

#### Query Parameters

- `limit` (optional, default: 20) - Number of results
- `offset` (optional, default: 0) - Pagination offset
- `organisation_id` (optional) - Filter by specific organisation (admin only)

**TODO**: Add support for `organisation_id` query parameter to allow admins to view all generations for their organisation, not just their own.

#### Response (200 OK)

```json
{
  "generations": [
    {
      "id": "uuid-string",
      "product_id": "uuid-string",
      "product_name": "Product Name",
      "content_type": "quiz",
      "status": "success",
      "workflow_state": "draft",
      "content": {
        "title": "Product Quiz",
        "difficulty": "intermediate",
        "questions": []
      },
      "edited_by": "user-id",
      "edited_at": "2024-01-08T12:34:56Z",
      "is_published": false,
      "published_by": null,
      "published_at": null,
      "created_at": "2024-01-08T12:34:56Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

**Note**: `product_name` is included via SQL JOIN with products table.

#### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Invalid JWT token |
| 500 | Database error |

---

### 3. List Generations for Product

**GET** `/api/v1/content/products/{product_id}/generations`

Retrieve all content generations for a specific product.

#### Path Parameters

- `product_id` - UUID of the product

#### Query Parameters

- `limit` (optional, default: 20) - Number of results
- `offset` (optional, default: 0) - Pagination offset

#### Response (200 OK)

```json
{
  "generations": [
    {
      "id": "uuid-string",
      "product_id": "uuid-string",
      "content_type": "quiz",
      "status": "success",
      "workflow_state": "draft",
      "content": {
        "title": "Product Quiz",
        "difficulty": "intermediate",
        "questions": []
      },
      "edited_by": "user-id",
      "edited_at": "2024-01-08T12:34:56Z",
      "is_published": false,
      "published_by": null,
      "published_at": null,
      "created_at": "2024-01-08T12:34:56Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

---

### 4. Get Generation

**GET** `/api/v1/content/generations/{id}`

Retrieve a single generation by ID.

#### Path Parameters

- `id` - UUID of the generation

#### Response (200 OK)

```json
{
  "id": "uuid-string",
  "product_id": "uuid-string",
  "content_type": "quiz",
  "status": "success",
  "workflow_state": "draft",
  "content": {
    "title": "Product Quiz",
    "difficulty": "intermediate",
    "questions": [
      {
        "text": "Question text?",
        "type": "multiple_choice",
        "options": [
          { "index": 0, "text": "Option A" },
          { "index": 1, "text": "Option B" }
        ],
        "correct_answer": 0,
        "explanation": "Explanation text",
        "position": 1
      }
    ]
  },
  "original_content": {
    "// Same structure - for comparison"
  },
  "edited_by": "user-id",
  "edited_at": "2024-01-08T12:34:56Z",
  "is_published": false,
  "created_at": "2024-01-08T12:34:56Z"
}
```

#### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing id |
| 401 | Invalid JWT token |
| 404 | Generation not found |
| 500 | Database error |

---

### 5. Update Generation

**PUT** `/api/v1/content/generations/{id}`

Save edited content for a generation.

#### Path Parameters

- `id` - UUID of the generation

#### Request Body

```json
{
  "content": {
    "title": "Updated Quiz Title",
    "difficulty": "beginner",
    "questions": [
      {
        "text": "Updated question text?",
        "type": "multiple_choice",
        "options": [
          { "index": 0, "text": "Option A" },
          { "index": 1, "text": "Option B" },
          { "index": 2, "text": "Option C" },
          { "index": 3, "text": "Option D" }
        ],
        "correct_answer": 1,
        "explanation": "Updated explanation",
        "position": 1
      }
    ]
  }
}
```

**⚠️ Important:** The entire `content` object is replaced. Include all questions you want to keep.

#### Response (200 OK)

```json
{
  "generation_id": "uuid-string",
  "content": {
    "// Updated content"
  },
  "workflow_state": "edited",
  "edited_by": "user-id",
  "edited_at": "2024-01-08T12:34:56Z"
}
```

#### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid content structure or validation failed |
| 401 | Invalid JWT token |
| 404 | Generation not found |
| 500 | Database error |

---

### 6. Publish Generation

**POST** `/api/v1/content/generations/{id}/publish`

Mark content as published (ready for learning modules).

#### Path Parameters

- `id` - UUID of the generation

#### Request Body

None (empty body)

#### Response (200 OK)

```json
{
  "generation_id": "uuid-string",
  "is_published": true,
  "workflow_state": "published",
  "published_by": "user-id",
  "published_at": "2024-01-08T12:34:56Z"
}
```

#### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Already published or has failed status |
| 401 | Invalid JWT token |
| 404 | Generation not found |
| 500 | Database error |

---

## Data Types

### Audience Types

| Value | Description |
|-------|-------------|
| `new_rep` | Onboarding for new sales representatives |
| `sales_rep` | Standard sales training |
| `trainer` | L&D managers and trainers |
| `certification` | Formal product certification |

### Difficulty Levels

- `beginner`
- `intermediate`
- `advanced`

### Content Types

- `quiz` - Quiz questions
- `flashcard` - Flashcards (future)
- `learning_module` - Learning modules (future)

### Generation Statuses

| Status | Description | Can Edit? | Can Publish? |
|--------|-------------|-----------|--------------|
| `success` | Generated successfully | ✅ Yes | ✅ Yes |
| `partial` | Generated with warnings | ✅ Yes | ✅ Yes |
| `failed` | Generation failed | ❌ No | ❌ No |

### Workflow States

| State | Description | Actions Available |
|-------|-------------|-------------------|
| `draft` | Initial state after generation | Edit, Publish |
| `edited` | Content has been edited | Publish |
| `published` | Ready for learning modules | None (read-only) |

### Question Types

- `multiple_choice` - Multiple choice with 2-4 options
- `true_false` - True/false question

---

## Example Workflow

### Step 1: Generate a Quiz

```bash
curl -X POST http://localhost:5002/api/v1/content/generate-quiz \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "123e4567-e89b-12d3-a456-426614174000",
    "audience_type": "new_rep",
    "difficulty": "beginner",
    "question_count": 10,
    "focus_areas": ["safety", "indications"]
  }'
```

**Response:**
```json
{
  "generation_id": "456e7890-e89b-12d3-a456-426614174001",
  "status": "success",
  "content": { "..." },
  "metadata": { "..." }
}
```

### Step 2: List All Generations

```bash
curl -X GET "http://localhost:5002/api/v1/content/products/123e4567-e89b-12d3-a456-426614174000/generations?limit=20&offset=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 3: Get Generation for Editing

```bash
curl -X GET http://localhost:5002/api/v1/content/generations/456e7890-e89b-12d3-a456-426614174001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Step 4: Update with Edited Content

```bash
curl -X PUT http://localhost:5002/api/v1/content/generations/456e7890-e89b-12d3-a456-426614174001 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": {
      "title": "Updated Quiz",
      "difficulty": "beginner",
      "questions": [
        {
          "text": "What is the device used for?",
          "type": "multiple_choice",
          "options": [
            {"index": 0, "text": "Diagnosis"},
            {"index": 1, "text": "Treatment"},
            {"index": 2, "text": "Monitoring"},
            {"index": 3, "text": "Prevention"}
          ],
          "correct_answer": 0,
          "explanation": "The device is FDA-approved for diagnostic purposes.",
          "position": 1
        }
      ]
    }
  }'
```

### Step 5: Publish

```bash
curl -X POST http://localhost:5002/api/v1/content/generations/456e7890-e89b-12d3-a456-426614174001/publish \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## UI Implementation Notes

### Authentication
- Include JWT token in all requests
- Token must contain `user_id` claim
- Handle 401 errors by redirecting to login

### Status Handling
```javascript
// Example status check
if (generation.status === 'failed') {
  // Show error state - cannot edit or publish
  showError(generation.error_message);
} else if (generation.status === 'partial') {
  // Show warning but allow editing
  showWarning('Generated with some warnings');
}
```

### Workflow State UI
```javascript
// Determine available actions
const canEdit = !generation.is_published && generation.status !== 'failed';
const canPublish = !generation.is_published && generation.status !== 'failed';

if (generation.is_published) {
  // Show read-only view
  showReadOnlyMode();
}
```

### Content Validation
- API validates content structure on update
- Ensure edit forms preserve all required fields
- Quiz questions must have:
  - Non-empty `text`
  - Valid `type` (multiple_choice or true_false)
  - At least 2 options
  - Valid `correct_answer` index (0 to options.length-1)
  - Non-empty `explanation`

### Pagination
```javascript
// List generations with pagination
const limit = 20;
const offset = currentPage * limit;
const url = `/api/v1/content/products/${productId}/generations?limit=${limit}&offset=${offset}`;
```

### Error Handling
```javascript
// Standard error response structure
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    console.error(error.error);
    if (error.details) {
      console.error(error.details);
    }
  }
} catch (err) {
  // Handle network errors
}
```

---

## Common Scenarios

### Scenario 1: Generate and Immediately Edit
1. POST `/generate-quiz` → Get `generation_id`
2. GET `/generations/{id}` → Get full content
3. Edit content in UI
4. PUT `/generations/{id}` → Save changes

### Scenario 2: Browse Existing Generations
1. GET `/products/{product_id}/generations` → List all
2. Click on item → GET `/generations/{id}`
3. Display content (read-only if published)

### Scenario 3: Edit and Publish Workflow
1. GET `/generations/{id}` → Load content
2. Check `workflow_state`:
   - `draft` → Show "Edit" + "Publish" buttons
   - `edited` → Show "Publish" button
   - `published` → Read-only mode
3. PUT `/generations/{id}` → Save edits (state → `edited`)
4. POST `/generations/{id}/publish` → Publish (state → `published`)

### Scenario 4: Handle Generation Failure
1. POST `/generate-quiz` → Returns `status: "failed"`
2. Display `error_message` to user
3. Offer "Try Again" button to re-generate
4. Failed generations cannot be edited or published

---

## TypeScript Types (Optional)

```typescript
// Request Types
interface GenerateQuizRequest {
  product_id: string;
  audience_type: 'new_rep' | 'sales_rep' | 'trainer' | 'certification';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  question_count?: number;
  focus_areas?: string[];
}

interface UpdateContentRequest {
  content: QuizContent;
}

// Response Types
interface QuizContent {
  title: string;
  difficulty: string;
  questions: QuizQuestion[];
}

interface QuizQuestion {
  text: string;
  type: 'multiple_choice' | 'true_false';
  options: QuestionOption[];
  correct_answer: number;
  explanation: string;
  position: number;
}

interface QuestionOption {
  index: number;
  text: string;
}

interface GenerateQuizResult {
  generation_id: string;
  status: 'success' | 'partial' | 'failed';
  content?: QuizContent;
  metadata: {
    tokens_used: number;
    generation_time_ms: number;
    model_id: string;
  };
  error_message?: string;
}

interface Generation {
  id: string;
  product_id: string;
  content_type: 'quiz' | 'flashcard' | 'learning_module';
  status: 'success' | 'partial' | 'failed';
  workflow_state: 'draft' | 'edited' | 'published';
  content: QuizContent;
  original_content?: QuizContent;
  edited_by?: string;
  edited_at?: string;
  is_published: boolean;
  published_by?: string;
  published_at?: string;
  created_at: string;
}

interface ListGenerationsResult {
  generations: Generation[];
  total: number;
  limit: number;
  offset: number;
}

interface ErrorResponse {
  error: string;
  details?: string;
}
```

---

**Last Updated:** 2024-01-08
**API Version:** v1
**Backend Repository:** https://github.com/yourusername/core-api
