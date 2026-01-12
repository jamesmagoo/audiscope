# Learning API - Quiz Taking Flow

Complete sequence of API calls for the quiz-taking experience, from browsing quizzes to viewing results.

## Overview

The quiz-taking flow involves 7 distinct API interactions:
1. Browse available quizzes
2. View quiz details
3. Start quiz attempt
4. Submit answers (one per question)
5. Complete quiz
6. View results

---

## Step 1: Browse Available Quizzes

**Endpoint:** `GET /api/v1/learning/products/{product_id}/quizzes`

**Purpose:** List all quizzes available for a specific product

**Request:**
```http
GET /api/v1/learning/products/495ed2cc-1a9f-4183-ab6d-466714dbfe15/quizzes
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "quizzes": [
    {
      "id": "2369d19c-4fa4-4eca-bd1f-f4af98437c2a",
      "product_id": "495ed2cc-1a9f-4183-ab6d-466714dbfe15",
      "title": "TREO Abdominal Stent-Graft System - Knowledge Quiz",
      "difficulty": "beginner",
      "question_count": 10,
      "quiz_type": "product",
      "generation_id": "72f73fbb-e84b-42ab-a4a9-1b45ab96953b",
      "generated_at": "2026-01-09T22:37:07Z",
      "generated_by": "eu.anthropic.claude-3-5-sonnet-20240620-v1:0",
      "created_at": "2026-01-09T22:37:07Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

**Frontend Display:**
- Quiz cards showing title, difficulty, question count
- "Start Quiz" button

---

## Step 2: View Quiz Details

**Endpoint:** `GET /api/v1/learning/quizzes/{quiz_id}`

**Purpose:** Get full quiz information including all questions (before starting)

**Request:**
```http
GET /api/v1/learning/quizzes/2369d19c-4fa4-4eca-bd1f-f4af98437c2a
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "id": "2369d19c-4fa4-4eca-bd1f-f4af98437c2a",
  "product_id": "495ed2cc-1a9f-4183-ab6d-466714dbfe15",
  "organisation_id": "00000000-0000-0000-0000-000000000001",
  "title": "TREO Abdominal Stent-Graft System - Knowledge Quiz",
  "quiz_type": "product",
  "difficulty": "beginner",
  "question_count": 10,
  "questions": [
    {
      "id": "30673f63-7496-40a7-9f34-b6ad5b11c39e",
      "text": "What is the primary indication for the TREO Abdominal Stent-Graft System?",
      "type": "multiple_choice",
      "options": [
        {
          "index": 0,
          "text": "Endovascular treatment of infrarenal abdominal aortic aneurysms"
        },
        {
          "index": 1,
          "text": "Treatment of thoracic aortic aneurysms"
        },
        {
          "index": 2,
          "text": "Repair of aortic dissections"
        },
        {
          "index": 3,
          "text": "Management of peripheral artery disease"
        }
      ],
      "correct_answer": 0,
      "explanation": "The TREO Abdominal Stent-Graft System is indicated for the endovascular treatment of infrarenal abdominal aortic and aorto-iliac aneurysms...",
      "position": 1  // Note: Backend field, but frontend uses array index (0-based) for all tracking
    }
    // ... 9 more questions (positions 2-10, but frontend uses indices 1-9)
  ],
  "generated_by": "eu.anthropic.claude-3-5-sonnet-20240620-v1:0",
  "generated_at": "2026-01-09T22:37:07Z",
  "generation_id": "72f73fbb-e84b-42ab-a4a9-1b45ab96953b",
  "created_at": "2026-01-09T22:37:07Z"
}
```

**Frontend Display:**
- Quiz overview with title and difficulty
- Number of questions
- "Start Quiz" button
- Questions are NOT shown yet (revealed one at a time during quiz)

---

## Step 3: Start Quiz Attempt

**Endpoint:** `POST /api/v1/learning/quizzes/{quiz_id}/attempts`

**Purpose:** Create a new attempt record and begin the quiz

**Request:**
```http
POST /api/v1/learning/quizzes/2369d19c-4fa4-4eca-bd1f-f4af98437c2a/attempts
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}
```

**Response:** `201 Created`
```json
{
  "attempt_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quiz_id": "2369d19c-4fa4-4eca-bd1f-f4af98437c2a",
  "started_at": "2026-01-10T14:30:00Z",
  "status": "in_progress"
}
```

**What Happens:**
1. Backend creates attempt record in database with status "in_progress"
2. Links attempt to authenticated user (from JWT)
3. Records start timestamp
4. Returns attempt_id for subsequent API calls

**Frontend Action:**
- Store `attempt_id` in component state
- Display first question (position: 1)
- Show progress indicator (Question 1 of 10)

**Frontend Workaround:**
Currently makes additional call to `GET /quizzes/{id}` to get `total_questions` for progress bar (should be included in StartAttemptResponse)

---

## Step 3B: Resume In-Progress Quiz (Alternative Flow)

**Scenario:** User starts a quiz, answers some questions, exits, then returns later

**Purpose:** Allow users to continue from where they left off instead of starting over

### Detection of Active Attempt

**Endpoint:** `GET /api/v1/learning/user/quiz-attempts`

**Purpose:** Check if user has an active (in_progress) attempt for this quiz

**Request:**
```http
GET /api/v1/learning/user/quiz-attempts
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "attempts": [
    {
      "id": "a329df34-9f42-4812-9300-00dff2f136d8",
      "quiz_id": "2369d19c-4fa4-4eca-bd1f-f4af98437c2a",
      "status": "in_progress",
      "started_at": "2026-01-10T23:08:58Z"
    }
  ]
}
```

**Frontend Logic:**
```typescript
// In /dashboard/learning/quiz/{id}/page.tsx
const activeAttempt = userAttempts?.find(
  (attempt) => attempt.quiz_id === quizId && attempt.status === 'in_progress'
)

if (activeAttempt) {
  // Resume existing attempt
  router.push(`/quiz/${quizId}/take?attemptId=${activeAttempt.id}`)
} else {
  // Start new attempt (Step 3)
  startQuizAttempt(quizId)
}
```

### Fetch Attempt State

**Endpoint:** `GET /api/v1/learning/quiz-attempts/{attempt_id}`

**Purpose:** Retrieve all answers submitted so far in this attempt

**Request:**
```http
GET /api/v1/learning/quiz-attempts/a329df34-9f42-4812-9300-00dff2f136d8
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "id": "a329df34-9f42-4812-9300-00dff2f136d8",
  "quiz_id": "2369d19c-4fa4-4eca-bd1f-f4af98437c2a",
  "user_id": "72354404-3081-708c-91b3-985bc8120253",
  "organisation_id": "00000000-0000-0000-0000-000000000001",
  "status": "in_progress",
  "started_at": "2026-01-10T23:08:58Z",
  "answers": [
    {
      "id": "7ae703fd-759b-47bd-991a-d452773c54a6",
      "question_id": "30673f63-7496-40a7-9f34-b6ad5b11c39e",
      "user_answer": 2,
      "is_correct": true,
      "answered_at": "2026-01-10T23:19:30Z"
    },
    {
      "id": "e7c44f40-1b2d-478a-93b8-4e76a1dcfeab",
      "question_id": "0781ae7c-86c9-4973-be2a-8459741c01b4",
      "user_answer": 0,
      "is_correct": true,
      "answered_at": "2026-01-11T19:12:15Z"
    },
    {
      "id": "f24e044b-885b-40d4-811a-c993bef218bf",
      "question_id": "67597be4-92ba-4089-a7d1-353a787a9b44",
      "user_answer": 1,
      "is_correct": false,
      "answered_at": "2026-01-11T19:17:47Z"
    }
  ],
  "created_at": "2026-01-10T23:08:58Z"
}
```

### Restoration Logic

**What Frontend Does:**

1. **Fetch quiz questions** (same as Step 2): `GET /quizzes/{quiz_id}`
2. **Map question IDs to array indices:**
   ```typescript
   // Build question map: question_id → array index (0, 1, 2...)
   const questionMap = quiz.questions.map((q, idx) => ({ id: q.id, position: idx }))
   ```

3. **Transform answers to use array index as key:**
   ```typescript
   // Backend returns: { question_id: "uuid-1", user_answer: 2 }
   // Frontend transforms to: { 0: 2 } (array index → selected option)

   const answersMap: Record<number, number> = {}
   attemptDetails.answers.forEach((answer) => {
     const arrayIndex = quiz.questions.findIndex(q => q.id === answer.question_id)
     if (arrayIndex !== -1) {
       answersMap[arrayIndex] = answer.user_answer
     }
   })
   // Result: { 0: 2, 1: 0, 2: 1 } (Q1, Q2, Q3 answered)
   ```

4. **Find first unanswered question:**
   ```typescript
   const firstUnanswered = quiz.questions.findIndex((q, index) => {
     return answersMap[index] === undefined
   })
   // If 3 answers exist (indices 0,1,2), firstUnanswered = 3 (Q4)
   ```

5. **Jump to first unanswered question:**
   ```typescript
   setCurrentQuestionIndex(firstUnanswered)  // Show Q4
   setUserAnswers(answersMap)  // Store Q1-Q3 answers for progress dots
   ```

**Frontend Display:**
- Progress dots: Q1, Q2, Q3 = green (answered) | Q4 = blue ring (current) | Q5-Q10 = gray
- Question display: Shows Q4 with no answer selected (ready to answer)
- Progress text: "Question 4 of 10" | "3 answered • 30% Complete"

**Critical Detail:**
The frontend uses **array index (0-indexed)** as the canonical position throughout, not the backend's `position` field. This ensures consistency with React array rendering and progress tracking.

---

## Step 4: Submit Answer to Question

**Endpoint:** `POST /api/v1/learning/quiz-attempts/{attempt_id}/answers`

**Purpose:** Submit user's answer and receive immediate feedback

**Request:**
```http
POST /api/v1/learning/quiz-attempts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/answers
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "question_position": 1,
  "selected_option_index": 0
}
```

**Request Body:**
- `question_position`: The question number (1-10)
- `selected_option_index`: The option the user selected (0-3)

**Response:** `200 OK`
```json
{
  "answer_id": "ans-12345",
  "is_correct": true,
  "explanation": "The TREO Abdominal Stent-Graft System is indicated for the endovascular treatment of infrarenal abdominal aortic and aorto-iliac aneurysms in adult patients with appropriate anatomy. This is the primary purpose of the device as stated in the product documentation."
}
```

**What Happens:**
1. Backend validates answer against correct_answer
2. Stores answer in database linked to attempt
3. Returns immediate feedback with explanation
4. Answer is immutable (can't be changed)

**Frontend Display:**
- Show ✅ "Correct!" or ❌ "Incorrect" banner
- Display explanation text
- "Continue" button to proceed to next question
- Disable answer options (no changes allowed)

**This Step Repeats:**
User answers questions 1 through 10, each with a POST request

---

## Step 5: Complete Quiz

**Endpoint:** `POST /api/v1/learning/quiz-attempts/{attempt_id}/complete`

**Purpose:** Finalize the quiz and calculate the score

**Request:**
```http
POST /api/v1/learning/quiz-attempts/a1b2c3d4-e5f6-7890-abcd-ef1234567890/complete
Authorization: Bearer <jwt_token>
Content-Type: application/json

{}
```

**Response:** `200 OK`
```json
{
  "attempt_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "completed",
  "score": 80.0,
  "correct_answers": 8,
  "total_questions": 10,
  "completed_at": "2026-01-10T14:45:00Z",
  "passed": true
}
```

**What Happens:**
1. Backend marks attempt as "completed"
2. Calculates final score (correct_answers / total_questions * 100)
3. Records completion timestamp
4. Determines pass/fail based on threshold (e.g., 70%)

**Frontend Action:**
- Navigate to results page: `/dashboard/learning/quiz/{quiz_id}/results?attemptId={attempt_id}`

**Frontend Workaround:**
Currently makes additional call to `GET /quiz-attempts/{id}` to get answers array for results page (should be included in CompleteQuizResponse)

---

## Step 6: View Quiz Results

**Endpoint:** `GET /api/v1/learning/quiz-attempts/{attempt_id}`

**Purpose:** Retrieve complete attempt details including all answers for results breakdown

**Request:**
```http
GET /api/v1/learning/quiz-attempts/a1b2c3d4-e5f6-7890-abcd-ef1234567890
Authorization: Bearer <jwt_token>
```

**Response:** `200 OK`
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "quiz_id": "2369d19c-4fa4-4eca-bd1f-f4af98437c2a",
  "user_id": "user-123",
  "organisation_id": "00000000-0000-0000-0000-000000000001",
  "started_at": "2026-01-10T14:30:00Z",
  "completed_at": "2026-01-10T14:45:00Z",
  "score": 80.0,
  "status": "completed",
  "created_at": "2026-01-10T14:30:00Z",
  "answers": [
    {
      "id": "ans-1",
      "question_id": "30673f63-7496-40a7-9f34-b6ad5b11c39e",
      "user_answer": 0,
      "is_correct": true,
      "answered_at": "2026-01-10T14:31:30Z",
      "time_taken_seconds": 45
    },
    {
      "id": "ans-2",
      "question_id": "0781ae7c-86c9-4973-be2a-8459741c01b4",
      "user_answer": 1,
      "is_correct": false,
      "answered_at": "2026-01-10T14:32:45Z",
      "time_taken_seconds": 60
    }
    // ... 8 more answers
  ]
}
```

**Frontend Display:**
- Overall score (80% - 8/10 correct)
- Pass/Fail status
- Expandable question breakdown showing:
  - ✅/❌ for each question
  - User's answer
  - Correct answer (if wrong)
  - Explanation
- "Retake Quiz" button

**Frontend Workaround:**
Makes additional call to `GET /quizzes/{quiz_id}` to map `question_id` (UUID) to `question_position` (number) and get question text (should include position in answer DTO)

---

## Complete Sequence Diagram

```
┌──────────┐     ┌────────────┐     ┌─────────────────┐
│  User    │     │  Frontend  │     │   Backend API   │
└────┬─────┘     └─────┬──────┘     └────────┬────────┘
     │                 │                      │
     │ 1. Browse       │                      │
     │ Quizzes         │                      │
     ├────────────────>│  GET /products/{id}/quizzes
     │                 ├─────────────────────>│
     │                 │     Quiz List        │
     │                 │<─────────────────────┤
     │                 │                      │
     │ 2. Click Quiz   │                      │
     ├────────────────>│  GET /quizzes/{id}   │
     │                 ├─────────────────────>│
     │                 │   Quiz Details       │
     │                 │<─────────────────────┤
     │                 │                      │
     │ 3. Start Quiz   │                      │
     ├────────────────>│ POST /quizzes/{id}/attempts
     │                 ├─────────────────────>│
     │                 │   attempt_id         │
     │                 │<─────────────────────┤
     │                 │                      │
     │ 4. Answer Q1    │                      │
     ├────────────────>│ POST /quiz-attempts/{id}/answers
     │                 ├─────────────────────>│
     │                 │  is_correct, explanation
     │                 │<─────────────────────┤
     │   Show Feedback │                      │
     │<────────────────┤                      │
     │                 │                      │
     │ 5. Continue     │                      │
     ├────────────────>│ (Repeat for Q2-Q10) │
     │                 │                      │
     │ 6. Answer Q10   │                      │
     ├────────────────>│ POST /quiz-attempts/{id}/answers
     │                 ├─────────────────────>│
     │                 │  is_correct          │
     │                 │<─────────────────────┤
     │                 │                      │
     │ 7. Finish Quiz  │                      │
     ├────────────────>│ POST /quiz-attempts/{id}/complete
     │                 ├─────────────────────>│
     │                 │  score, passed       │
     │                 │<─────────────────────┤
     │                 │                      │
     │ 8. View Results │                      │
     ├────────────────>│ GET /quiz-attempts/{id}
     │                 ├─────────────────────>│
     │                 │  Full attempt + answers
     │                 │<─────────────────────┤
     │   Results Page  │                      │
     │<────────────────┤                      │
     │                 │                      │
```

---

## API Call Count Summary

### New Quiz Flow (First Time Taking Quiz)
1. Browse: **1 call** - GET /products/{id}/quizzes
2. Details: **1 call** - GET /quizzes/{id}
3. Check for active attempt: **1 call** - GET /user/quiz-attempts
4. Start new attempt: **1 call** - POST /quizzes/{id}/attempts
5. Fetch quiz questions: **1 call** - GET /quizzes/{id} (from cache - instant)
6. Answer questions: **10 calls** - POST /quiz-attempts/{id}/answers (×10)
7. Complete: **1 call** - POST /quiz-attempts/{id}/complete
8. Fetch results: **1 call** - GET /quiz-attempts/{id}
9. Fetch quiz for question text: **1 call** - GET /quizzes/{id} (from cache - instant)

**Total: ~15-16 network calls** (for 10-question quiz)
**Cache hits: 2** (quiz details reused twice)

### Resume Quiz Flow (Returning to In-Progress Quiz)
1. Browse: **1 call** - GET /products/{id}/quizzes (from cache if recent)
2. Details page: **1 call** - GET /quizzes/{id} (from cache if recent)
3. Check for active attempt: **1 call** - GET /user/quiz-attempts
4. Detect active attempt → redirect to take page
5. Fetch attempt state: **1 call** - GET /quiz-attempts/{id}
6. Fetch quiz questions: **1 call** - GET /quizzes/{id} (from cache if within 5 min)
7. Restoration logic runs (frontend only)
8. Continue answering: **X calls** - POST /quiz-attempts/{id}/answers (×remaining questions)
9. Complete: **1 call** - POST /quiz-attempts/{id}/complete
10. Results: **2 calls** - GET /quiz-attempts/{id} + GET /quizzes/{id} (one from cache)

**Total: ~7-8 new network calls** (if 5 questions remaining)
**Cache hits: 2-3** (quiz details heavily cached)

### Ideal Implementation (Future Backend Improvements)
1. Browse: **1 call**
2. Start/Resume: **1 call** (combine attempt check + creation, return quiz in response)
3. Answers: **10 calls**
4. Complete: **1 call** (return full results in response)
5. Results: **0 calls** (already have all data)

**Target: 13 API calls** (13.3% reduction from current)

---

## State Management

### Frontend State During Quiz

```typescript
// Component state in quiz-taker.tsx
const [attemptId, setAttemptId] = useState<string | null>(null)
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
const [feedback, setFeedback] = useState<AnswerFeedback | null>(null)
const [userAnswers, setUserAnswers] = useState<Record<number, number>>({})
```

**State Transitions:**
1. **Initial Load:** `attemptId = null`, `currentQuestionIndex = 0`
2. **After Start:** `attemptId = "abc-123"`, show first question
3. **User Selects:** `selectedAnswer = 2`, enable submit button
4. **After Submit:** `feedback = { is_correct: true, explanation: "..." }`, show feedback
5. **User Clicks Continue:** `currentQuestionIndex++`, `selectedAnswer = null`, `feedback = null`
6. **Repeat 4-5** for all questions
7. **After Last Question:** Call complete endpoint, navigate to results

---

## Error Handling

### Common Error Scenarios

**1. Invalid Attempt ID (403 Forbidden)**
```json
{
  "error": "Forbidden",
  "message": "Quiz attempt does not belong to the authenticated user"
}
```
- User trying to access another user's attempt
- Frontend should redirect to quiz list

**2. Attempt Already Completed (400 Bad Request)**
```json
{
  "error": "Bad Request",
  "message": "Quiz attempt is already completed"
}
```
- User trying to submit answer after completing quiz
- Frontend should prevent this by checking status

**3. Question Already Answered (409 Conflict)**
```json
{
  "error": "Conflict",
  "message": "Question has already been answered in this attempt"
}
```
- User trying to answer same question twice
- Frontend should prevent this by tracking answered questions in `userAnswers` state
- **Common during resume:** If restoration logic fails to detect answered questions, user may attempt to re-answer
- **Debug**: Check console logs for `[Quiz Restoration]` - if mapping fails, this error will occur
- **Fix**: Ensure `question_id` → array index mapping is correct in restoration logic

**4. Missing Request Body (400 Bad Request)**
```json
{
  "error": "EOF"
}
```
- POST request sent without JSON body
- Ensure `body: JSON.stringify({})` for empty bodies

---

## Authentication

All endpoints require JWT authentication:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**JWT Token includes:**
- `sub`: User ID (automatically linked to attempts)
- `org_id`: Organization ID (for data scoping)

**Security:**
- Backend validates JWT on every request
- Attempts are scoped to authenticated user
- Users cannot access other users' attempts

---

## Performance Considerations

### Caching Strategy

The frontend uses **React Query** for intelligent caching with different strategies per data type:

**Quiz Details (`useQuizDetail`):**
- **staleTime:** 5 minutes
- **refetchOnMount:** false
- **Rationale:** Quiz questions are static and don't change during active quizzes
- **Benefit:** Eliminates duplicate quiz fetches when resuming or navigating

**Attempt State (`useAttemptResults`):**
- **staleTime:** 5 seconds (very short)
- **refetchOnMount:** true (always fetch on component mount)
- **Rationale:** Attempt data changes frequently (user answers questions), need fresh data when re-entering quiz
- **Benefit:** Shows latest progress when resuming quiz, even if exited 1 second ago

**User Attempts List (`useUserAttempts`):**
- **staleTime:** 10 seconds
- **refetchOnMount:** true
- **Rationale:** Need to detect new/updated attempts when navigating back to quiz page
- **Benefit:** Correctly identifies active attempts for resume flow

**Cache Coordination:**
When fetching attempt details, the hook checks if quiz data exists in cache:
```typescript
const quizData = queryClient.getQueryData(['learning', 'quiz', quizId])
if (quizData) {
  // Use cached quiz, avoid duplicate fetch
}
```

**Result:** On resume flow, only 1 new network request (GET /quiz-attempts/{id}) instead of 2, since quiz is cached.

### Database Indexes

For optimal performance, backend should have:
```sql
CREATE INDEX idx_quiz_attempts_user_quiz ON quiz_attempts(user_id, quiz_id);
CREATE INDEX idx_answers_attempt ON answers(attempt_id);
```

---

## Future Enhancements

### Recommended Backend Changes

1. **Add to StartAttemptResponse:**
   - `total_questions` (eliminates extra API call)

2. **Add to CompleteQuizResponse:**
   - `answers[]` array (eliminates extra API call)
   - `quiz_id`, `started_at` (for complete context)

3. **Add to AnswerDTO:**
   - `question_position` (eliminates need to fetch quiz for mapping)

4. **Add Quiz Pause/Resume:**
   - Allow saving progress mid-quiz
   - `PUT /quiz-attempts/{id}/pause`
   - `POST /quiz-attempts/{id}/resume`

5. **Add Time Limits:**
   - Optional per-quiz or per-question time limits
   - Auto-submit when time expires

---

## Testing Checklist

- [ ] Browse quizzes - shows all available quizzes
- [ ] Click quiz - displays quiz details
- [ ] Start quiz - creates attempt and shows first question
- [ ] Answer questions - immediate feedback for each answer
- [ ] Progress bar - updates correctly (Question X of Y)
- [ ] Complete quiz - redirects to results page
- [ ] Results page - shows score and question breakdown
- [ ] Retake quiz - starts new attempt
- [ ] Multiple concurrent attempts - each tracked separately
- [ ] Auth validation - cannot access other users' attempts
- [ ] Error handling - graceful handling of network errors

---

## Related Documentation

- [Backend Changes Required](../../Desktop/backend-changes-required.md)
- [Frontend API Comparison](../../Desktop/learning-api-comparison.md)
- [Content Generation API](./content-generation-api.md)
