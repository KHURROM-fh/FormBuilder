# FormBuilder & Interactive Chatbot Platform

A modern, responsive Form Builder and Chatbot Platform built with **Next.js 16**, **React 19**, **TypeScript**, **Tailwind CSS**, and **Django REST Framework**.

The platform allows users to create forms, customize questions, preview forms in desktop/mobile frames, publish them, share public links, embed chatbot widgets on external websites, collect responses, and view submissions from their dashboard.

---

## Key Features Built & Implemented

### 1. Main Pages & Navigation
- **`/` (Marketing Landing Page)**: Clean hero section, capability breakdown, interactive workflow showcase, and live chatbot preview.
- **`/how-it-works`**: Dedicated visual workflow guide with copyable embed snippet.
- **`/features`**: Detailed breakdown of Form Builder, Chatbot Widget, and Responses analytics.
- **`/dashboard` (Overview & Statistics)**:
  - 4 real-time metric cards (Total Forms, Published Forms, Total Responses, Completion Rate).
  - Recent forms table with inline action menu: Edit, Preview, Responses, Share, Duplicate, Delete (with confirmation dialog).
  - Recent submissions feed with quick links to response details.
- **`/dashboard/forms` (All Forms Directory)**:
  - Searchable by form title and description.
  - Filter by status (`All`, `Published`, `Draft`).
  - Sort by date updated, created, or title.
- **`/dashboard/forms/new` & `[id]/edit` (Form Builder)**:
  - **Left Panel (Question Types)**: Short Text, Email, Multiple Choice, Yes/No.
  - **Center Canvas (Live Form Editor)**: Inline editable title & description, up/down question reordering, duplicate question, delete question with confirmation, live indicator (`Saved` / `Saving...`).
  - **Right Panel (Question & Form Settings)**:
    - Label, placeholder, required toggle.
    - Add, edit, remove options for multiple choice questions.
    - Form settings: Welcome message, completion message, brand primary color picker, submit button label.
- **`/dashboard/forms/[id]/preview` (Interactive Form Preview)**:
  - Toggle between **Desktop** and **Mobile** device frames.
  - Toggle between **Standard Form** and **Chatbot Widget** layouts.
- **`/dashboard/forms/[id]/share` (Publish & Share Hub)**:
  - Publish / Unpublish toggle with draft protection.
  - One-click safe clipboard copy for direct public links.
  - Copyable 1-line JavaScript embed snippet:
    ```html
    <script src="http://localhost:3000/widget.js" data-form-id="feedback-survey" defer></script>
    ```
  - Live interactive widget demonstration previewing appearance on external host websites.
- **`/dashboard/forms/[id]/responses` (Submissions Management)**:
  - Summary metrics: Total Submissions, Latest Submission Date, Question Count.
  - Searchable submissions table by submission ID or answer content.
  - **View Details Modal**: Inspects complete user answers mapped to questions.
  - **Real CSV Export**: Generates and downloads a clean `.csv` file with question labels as column headers.
- **`/forms/[publicId]` & `/form/[publicId]` (Public Form Page)**:
  - Loads form definitions from persistent browser storage.
  - Friendly "Form Unavailable" screen if form is unpublished or deleted.
  - Standard Form mode with inline validation (required fields, regex email formatting).
  - Chatbot mode with conversational bubbles, progress indicator, previous question editing, and celebration state.
  - Floating Chatbot launcher button with minimize, expand, and restart controls.
- **`public/embed-test.html` & `public/widget.js`**:
  - Functional standalone script and external test page demonstrating live third-party website widget embedding.

---

## Frontend State & Persistence Architecture

The frontend data layer is implemented in [`src/lib/formStorage.ts`](file:///home/ferdoskhurrom/Khurrom/Form%20Builder/frontend/src/lib/formStorage.ts):
- **Collections**: Forms and Submissions are stored in separate `localStorage` keys (`formbuilder_forms_v1` and `formbuilder_submissions_v1`).
- **Initial Seed Data**: Comes with realistic demo forms (Customer Feedback Survey, Website Lead Capture, Feature Request Draft) and sample submissions.
- **Reset Demo Data**: Easily reset to initial demo state anytime using the "Reset Demo Data" action in the dashboard navigation.
- **Safe Clipboard Utility**: [`src/lib/clipboard.ts`](file:///home/ferdoskhurrom/Khurrom/Form%20Builder/frontend/src/lib/clipboard.ts) uses `navigator.clipboard` when available and falls back to a hidden textarea + `document.execCommand('copy')`, preventing crashes over non-HTTPS local network IPs (`http://10.10.28.168:3000`).
- **Backend-Ready Interface**: All storage operations use clean, promise/sync interfaces that can be swapped with real REST or Supabase endpoints with zero changes to UI components.

---

## Running the Application Locally

### 1. Frontend (Next.js)

```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start development server (runs on http://localhost:3000 and network IP)
npm run dev
```

Build verification:
```bash
npm run build
```

### 2. Backend (Django REST Framework)

```bash
cd backend

# Activate Python virtual environment
source venv/bin/activate

# Start Django server (runs on http://localhost:8000)
python manage.py runserver
```

---

## End-to-End User Workflow Test

1. Open `http://localhost:3000/dashboard` to see overview statistics and recent forms.
2. Click **Create New Form** to launch the 3-panel builder.
3. Add a question (e.g. Multiple Choice or Email), customize options, and click **Publish Form**.
4. On the Share page, copy the public link and open it in a separate tab (`/forms/[publicId]`).
5. Fill out the questions in **Standard Form** mode or switch to **Chatbot Mode** and submit.
6. Return to `/dashboard/forms/[id]/responses` — the new submission will appear in the table.
7. Click **View Details** to inspect answers or click **Export CSV** to download the spreadsheet file.
8. Open `http://localhost:3000/embed-test.html` to test the embedded chatbot widget on an external website.
