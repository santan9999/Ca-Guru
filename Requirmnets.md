# 📘 CA Guru AI – requirements.md

## 🧠 Overview  
**CA Guru AI** is an AI-powered assistant tailored for Chartered Accountancy (CA) students. It streamlines exam prep through intelligent Q&A, mock tests, adaptive learning, and progress tracking. Covering subjects like Taxation, Corporate Law, and Accounting Standards, it delivers real-time answers and smart study support via text and voice.

---

## 🚀 Tech Stack

| Purpose                 | Technology                   |
|------------------------|------------------------------|
| Frontend               | Next.js (App Router)         |
| Styling                | Tailwind CSS                 |
| Authentication         | Clerk                        |
| Database               | Neon.tech (PostgreSQL)       |
| Hosting                | Vercel                       |
| AI/LLM                 | OpenAI GPT-4 /oenrouter API             |
| Voice Input            | Web Speech API               |

---
create first students realted to the app
after every structure section ,check requirments and c
ask permision for every section
create first students realted to the app
after every structure section,check requirments and c
ask permision for every section
create first students realted to the app
after every structure section,check requirments and c
ask permision for every section
create first students realted to the app
after every structure section,check requirments and c
ask permision for every section
## 🔐 Authentication

- User sign-up/login via Clerk (email + social login)
- Role-based dashboards (Student, Admin)
- Session persistence and user-specific data

---

## 🧩 Key Features

### 1. 📚 Subject-Wise AI Q&A
- Input text or speak queries
- GPT-4 provides context-rich answers
- Subject tagging (e.g., Taxation, Law)

### 2. 🎯 Mock Tests
- Timed test modules (MCQs, descriptive)
- Admin can upload and manage question banks
- Results stored for review and progress

### 3. 📈 Progress Tracker
- Dashboard to view weekly/monthly stats
- Scores visualized with charts
- Daily streaks and consistency meter

### 4. 📊 Adaptive Learning
- Detects weak areas based on test results
- Suggests personalized practice content
- Recommends next topics to study

### 5. 🎤 Voice Query Support
- Voice-to-text using Web Speech API
- Sends auto request to GPT-4 with voice input
- Works across dashboard and mock tests

---

## 🛠 Admin Capabilities

Admins will have access to a dedicated panel to manage content and user engagement.

### 🔧 Admin Dashboard Features:
- 📤 **Upload/Update Question Banks**  
  Add, edit, or delete subject-wise mock test questions (MCQs and descriptive).
  
- 📘 **Manage Subjects and Categories**  
  Create new CA subjects, manage topics under each subject.

- 🧑‍🎓 **Manage Students**  
  View user list, deactivate/reactivate accounts, and monitor activity.

- 🧠 **Review AI Q&A History**  
  Analyze frequently asked questions, improve model prompts based on patterns.

- 📩 **Send Notifications or Reminders**  
  Push reminders to all users or specific users (e.g., “Mock test available for Audit”)

- 🧪 **Add Suggested Study Material**  
  Upload PDFs, links to ICAI notes, or embed YouTube videos.

- 📊 **View Analytics**  
  See usage stats, active users, test completion rates, and weak areas across users.

---

## 🗂 Folder Structure

