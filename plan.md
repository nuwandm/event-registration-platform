

---

# Prompt

```text
You are a Senior Full Stack Software Architect and MERN Stack Developer.

Your task is to design and develop a production-ready Event Registration & Attendance Management System.

## Tech Stack

Build the application using:

Frontend
- React 19
- Vite
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod Validation
- TanStack Query
- React Router
- Axios

Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer (temporary upload)
- Cloudinary (I will provide credentials)
- QR Code Generator
- QR Code Scanner API
- REST API

Architecture
- Clean Architecture
- Service Layer
- Repository Pattern where appropriate
- Modular Folder Structure
- Reusable Components
- Environment Variables
- Production Ready

--------------------------------------------------

PROJECT GOAL

The application should allow an administrator to create events.

Users can register for an event through a public registration page.

During registration they must upload the bank transfer receipt.

The administrator reviews every registration.

If approved,
the system generates a unique QR Code.

At the event entrance,
staff scan the QR code.

The system validates it and marks attendance.

The QR code can only be used once.

--------------------------------------------------

MAIN MODULES

1. Authentication

Admin Login

Only admins can

- Login
- Create Events
- Approve Registrations
- Scan QR Codes
- View Reports

No public login is required.

--------------------------------------------------

2. Event Management

Admin can

Create Event

Fields

- Event Name
- Description
- Venue
- Event Date
- Registration Open Date
- Registration Close Date
- Maximum Participants (optional)
- Registration Fee
- Bank Details
- Banner Image
- Status
    - Draft
    - Published
    - Closed

CRUD operations.

--------------------------------------------------

3. Public Registration

Each published event has a public URL

Example

/events/:slug/register

Registration Form

Basic Information

- Full Name
- NIC / Passport
- Email
- Mobile Number
- Address
- Organization (optional)
- Designation (optional)

Upload

- Bank Transfer Receipt

Image or PDF

Store files in Cloudinary.

Validation

Do not allow duplicate registration using NIC or Email for the same event.

After submission

Status becomes

Pending Approval

Show success page

"Your registration has been submitted successfully.
You will receive your QR code once approved."

--------------------------------------------------

4. Registration Management

Admin Dashboard

List all registrations

Filters

- Pending
- Approved
- Rejected
- Attended
- Not Attended

Admin can

View registration

Preview uploaded receipt

Approve

Reject

Add remarks

--------------------------------------------------

5. QR Code Generation

When registration is approved

Automatically generate

Unique Registration Number

Example

EVT-2026-000123

Generate QR Code

The QR Code should NOT contain user information.

Instead encode

- Registration ID
- Secure Token

Example

{
"id":"xxxxx",
"token":"encrypted-token"
}

Store QR code.

Display it inside the user confirmation page.

Also allow download as PNG.

--------------------------------------------------

6. Attendance

Admin opens

Attendance Scanner

Use camera

Scan QR

Validation

If valid

Display

✔ Registered

Show

Name

Event

Registration Number

Photo (if available)

Status

Then

Mark Attendance

Attendance Time

Save

Prevent duplicate scans

If scanned again

Show

Already Checked In

Display previous check-in time.

--------------------------------------------------

7. Dashboard

Statistics

Events

Pending Registrations

Approved

Rejected

Today's Attendance

Attendance %

Charts

Registration Trend

Attendance Trend

--------------------------------------------------

8. Reports

Export

CSV

Excel

PDF

Reports

Registrant List

Attendance List

Pending Approval

Approved Users

Rejected Users

--------------------------------------------------

DATABASE DESIGN

Collections

admins

events

registrations

attendanceLogs

Suggested Registration Schema

- eventId
- fullName
- nic
- email
- mobile
- address
- organization
- designation
- receiptUrl
- receiptPublicId
- status
- qrToken
- registrationNumber
- attendanceStatus
- attendanceTime
- adminRemarks
- createdAt
- updatedAt

--------------------------------------------------

ADMIN UI

Dashboard

Sidebar

- Dashboard
- Events
- Registrations
- Attendance Scanner
- Reports
- Settings

Use

shadcn/ui

Cards

Data Tables

Dialogs

Toasts

Dropdowns

Badges

Pagination

Loading Skeletons

Responsive Design

--------------------------------------------------

PUBLIC UI

Landing Page

Upcoming Events

Each event card

Title

Date

Venue

Register Button

Registration Form

Success Page

QR Page (after approval)

Modern minimal UI

Tailwind + shadcn only

--------------------------------------------------

API DESIGN

Auth

POST /api/auth/login

Events

GET /events

GET /events/:slug

POST /events

PUT /events/:id

DELETE /events/:id

Registration

POST /register/:eventId

GET /registrations

PUT /registrations/:id/approve

PUT /registrations/:id/reject

Attendance

POST /attendance/scan

GET /attendance/event/:id

--------------------------------------------------

SECURITY

JWT Authentication

Password Hashing

Rate Limiting

Helmet

CORS

Input Validation

XSS Protection

Mongo Injection Protection

Secure QR Tokens

Prevent QR Forgery

--------------------------------------------------

FILE STORAGE

Use Cloudinary.

Receipt Upload

Allowed

jpg

jpeg

png

pdf

Maximum Size

10MB

Store

Secure URL

Public ID

--------------------------------------------------

USER FLOW

Admin

Login

↓

Create Event

↓

Publish Event

↓

Share Registration Link

↓

Users Register

↓

Upload Payment Receipt

↓

Pending Approval

↓

Admin Verifies Receipt

↓

Approve

↓

Generate QR

↓

User Receives QR

↓

Event Day

↓

Scan QR

↓

Validate

↓

Attendance Marked

--------------------------------------------------

CODING STANDARDS

- TypeScript for frontend and backend
- Reusable Components
- Reusable Hooks
- Reusable API Services
- Error Handling Middleware
- Logging
- DTO Validation
- Environment Variables
- Clean Folder Structure
- Responsive Design
- Accessible Components
- Production Ready Code

--------------------------------------------------

DELIVERABLES

Build the project step by step.

Before writing code,

first generate:

1. Complete Project Architecture

2. Folder Structure

3. Database Schema

4. API Specification

5. Component Hierarchy

6. UI Wireframe Description

7. Development Roadmap

After the architecture is approved,

implement one module at a time.

Never skip planning.

Write clean, maintainable, scalable production-quality code.
```


