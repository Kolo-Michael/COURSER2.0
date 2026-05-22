COURSER - AI-Powered Learning Platform
Version 1.0
Date: May 2026
Table of Contents
Introduction
Overall Description
System Features
External Interface Requirements
Non-Functional Requirements
Database Architecture
System Architecture
Appendices
1. Introduction
1.1 Purpose
COURSER is an AI-powered learning management platform that enables students to browse, enroll in, and learn from courses. The platform features an AI tutor mascot, AI-generated course content, role-based access control, and a modern user interface.
1.2 Scope
The system provides:
Public landing page for marketing
User authentication with role-based access
Course browsing, searching, and filtering
Course enrollment and tracking
AI-powered course generation
Super Admin and Admin management panels
Student learning dashboard
1.3 Definitions and Acronyms

TermDefinitionCOURSERThe learning platform nameSuper AdminHighest privilege user who manages adminsAdminPrivileged user who manages courses and contentStudentRegular user who browses and enrolls in coursesJWTJSON Web Token for authenticationAIArtificial Intelligence for course generationCORSCross-Origin Resource SharingREST APIRepresentational State Transfer APISPASingle Page Application
1.4 References
FastAPI Documentation: https://fastapi.tiangolo.com/
React Documentation: https://react.dev/
Tailwind CSS: https://tailwindcss.com/
Neon PostgreSQL: https://neon.tech/
2. Overall Description
2.1 Product Perspective
COURSER is a full-stack web application consisting of:
Frontend: React SPA with TypeScript and Tailwind CSS
Backend: Python FastAPI REST API
Database: Neon PostgreSQL (cloud-hosted)
Authentication: JWT-based token authentication
2.2 User Characteristics

RoleDescriptionPrivilegesSuper AdminPlatform ownerCreate admins, manage all content, view all dataAdminCourse managerCreate/edit courses, generate AI courses, view enrollmentsStudentLearnerBrowse courses, enroll, view course contentVisitorUnauthenticated userView landing page, browse courses (limited)
2.3 Operating Environment
Frontend: Modern web browsers (Chrome, Firefox, Edge, Safari)
Backend: Python 3.11+, Uvicorn ASGI server
Database: PostgreSQL 15+ via Neon cloud
Development: Windows 10/11, PowerShell
2.4 Design Constraints
Must use free tier services (Neon PostgreSQL)
Responsive design for mobile, tablet, and desktop
Font Awesome for all icons
Blue primary color with orange accent, green/red for status
3. System Features
3.1 Authentication System
Priority: High
Actor: All Users
Description:
Users can create accounts and log in to access the platform. The system supports role-based access with JWT tokens.
Functional Requirements:

IDRequirementStatusAUTH-1User can sign up with username, email, password✅AUTH-2Password validation (8+ chars, uppercase, lowercase, digit)✅AUTH-3User can log in with username/email and password✅AUTH-4JWT access token (30 min) and refresh token (7 days)✅AUTH-5Token refresh on 401 responses✅AUTH-6Role-based redirect after login✅AUTH-7Super Admin can create Admin accounts✅AUTH-8Users can log out (token invalidation)✅
3.2 Landing Page
Priority: High
Actor: Visitors, All Users
Description:
A public-facing landing page that introduces the platform, showcases features, and drives sign-ups.
Functional Requirements:

IDRequirementStatusLAND-1Hero section with call-to-action✅LAND-2Feature showcase section✅LAND-3Trust indicators (stats, testimonials)✅LAND-4Navigation to Login/Signup✅LAND-5Navigation to Courses page✅LAND-6Responsive design✅LAND-7Coursera-style professional layout✅
3.3 Course Browsing
Priority: High
Actor: All Users
Description:
Users can browse available courses, filter by category, and search by title.
Functional Requirements:

IDRequirementStatusCOUR-1View all published courses✅COUR-2Filter courses by category✅COUR-3Search courses by title✅COUR-4View course details (title, description, level, duration)✅COUR-5See course price/free status✅COUR-6View modules and lessons in course detail✅COUR-7Hero slider with promotional content✅COUR-8Category sidebar with Font Awesome icons✅
3.4 Course Management
Priority: High
Actor: Admin, Super Admin
Description:
Administrators can create courses manually or generate them using AI.
Functional Requirements:

IDRequirementStatusCMGT-1Admin can create course with modules and lessons✅CMGT-2AI-powered course generation from topic✅CMGT-3Course includes title, description, level, duration, price✅CMGT-4Modules with ordered lessons✅CMGT-5Seed script for initial course data✅CMGT-6Categories management✅
3.5 Super Admin Dashboard
Priority: High
Actor: Super Admin
Description:
Super Admin can manage other admin accounts from a dedicated dashboard.
Functional Requirements:

IDRequirementStatusSADM-1Overview dashboard with stats✅SADM-2Create admin accounts✅SADM-3View list of all admins✅SADM-4Sidebar navigation with burger menu on mobile✅SADM-5Responsive design for all screen sizes✅
3.6 Student Dashboard
Priority: Medium
Actor: Student
Description:
Students have a personal dashboard to view their enrolled courses and progress.
Functional Requirements:

IDRequirementStatusDASH-1Welcome message with user name✅DASH-2Quick access to course browsing✅DASH-3Navigation to home and courses✅DASH-4Logout functionality✅
4. External Interface Requirements
4.1 User Interfaces

PageRouteDescriptionLanding Page/Public landing pageAuthentication/authLogin/Signup formsCourses/coursesCourse browsing with filtersCourse Detail/courses/:slugIndividual course viewStudent Dashboard/dashboardStudent learning dashboardSuper Admin/super-adminAdmin managementAdmin/adminCourse management
4.2 API Endpoints
Authentication

MethodEndpointDescriptionPOST/auth/signupRegister new studentPOST/auth/loginLogin and get tokensGET/auth/meGet current userPOST/auth/admin/createCreate admin (Super Admin)GET/auth/adminsList all admins (Super Admin)
Courses

MethodEndpointDescriptionGET/courses/categoriesList categoriesGET/courses/List courses (with filters)GET/courses/featuredFeatured coursesGET/courses/{slug}Course detailPOST/courses/admin/createCreate coursePOST/courses/admin/ai-generateAI generate course
4.3 Color Scheme

ColorHexUsagePrimary Blue#2563EB (blue-600)Buttons, links, headersDark Blue#1E3A8A (blue-900)Navigation, hero sectionsAccent Orange#F97316 (orange-500)Highlights, badgesSuccess Green#10B981 (green-500)Free badges, success messagesDanger Red#EF4444 (red-500)Logout, errorsWhite#FFFFFFCards, backgroundsLight Gray#F9FAFB (gray-50)Page backgrounds
5. Non-Functional Requirements
5.1 Performance
API response time < 500ms for course listing
Page load time < 3 seconds on broadband
Support for 100+ concurrent users
5.2 Security
Passwords hashed using SHA-256 with salt
JWT tokens with expiration
CORS properly configured
Role-based access control
Environment variables for secrets
5.3 Reliability
Database hosted on Neon cloud (99.9% uptime)
Graceful error handling on frontend
Automatic token refresh
5.4 Maintainability
Modular code structure (models, schemas, services, API)
TypeScript for frontend type safety
Environment-based configuration
5.5 Usability
Responsive design (mobile, tablet, desktop)
Intuitive navigation
Font Awesome icons for visual clarity
Clear error messages
6. Database Architecture
6.1 Entity-Relationship Diagram
text
┌──────────┐     ┌──────────────┐     ┌──────────┐│   Users  │────→│UserSessions  │     │Categories│└────┬─────┘     └──────────────┘     └────┬─────┘     │                                     │     │  ┌──────────────┐                   │     ├─→│ Conversations│                   │     │  └──────┬───────┘                   │     │         │                           │     │  ┌──────┴───────┐              ┌────┴─────┐     │  │   Messages   │              │  Courses  │     │  └──────────────┘              └────┬─────┘     │                                     │     │  ┌──────────────┐                   │     └─→│ Enrollments  │←──────────────────┘        └──────────────┘                                                       ┌──────────┐              │  Modules │              └────┬─────┘                   │              ┌────┴─────┐              │  Lessons │              └──────────┘
6.2 Table Definitions
Users Table

ColumnTypeDescriptionidUUIDPrimary keyusernameVARCHAR(50)Unique usernameemailVARCHAR(100)Unique emailhashed_passwordVARCHAR(255)SHA-256 hashed passwordfull_nameVARCHAR(100)Optional full nameroleVARCHAR(20)student, admin, super_adminis_activeBOOLEANAccount active statusis_verifiedBOOLEANEmail verified statuscreated_byUUIDCreator (for admins)created_atTIMESTAMPCreation timeupdated_atTIMESTAMPLast update timelast_loginTIMESTAMPLast login time
Courses Table

ColumnTypeDescriptionidUUIDPrimary keytitleVARCHAR(200)Course titleslugVARCHAR(200)URL-friendly titledescriptionTEXTFull descriptionshort_descriptionVARCHAR(500)Brief descriptionlevelVARCHAR(20)beginner/intermediate/advanceddurationVARCHAR(50)Course durationpriceFLOATCourse price (0 = free)is_publishedBOOLEANVisibilityis_featuredBOOLEANFeatured statusis_ai_generatedBOOLEANAI-generated flagcategory_idUUIDForeign key to categoriesinstructor_idUUIDForeign key to users
7. System Architecture
7.1 Technology Stack
text
┌─────────────────────────────────────┐│            FRONTEND                 ││  React 18 + TypeScript + Tailwind  ││  Vite Build Tool                    ││  React Router + Axios              ││  Font Awesome Icons                │└──────────────┬──────────────────────┘               │ HTTP/REST               │ JWT Auth┌──────────────┴──────────────────────┐│            BACKEND                  ││  FastAPI (Python 3.11+)            ││  SQLAlchemy 2.0 (Async)            ││  Pydantic Schemas                  ││  JWT Authentication                ││  CORS Middleware                    │└──────────────┬──────────────────────┘               │ Asyncpg               │┌──────────────┴──────────────────────┐│           DATABASE                  ││  Neon PostgreSQL (Cloud)           ││  Serverless, Auto-scaling          │└─────────────────────────────────────┘
7.2 Project Structure
text
Courser/├── frontend/                    # React SPA│   ├── src/│   │   ├── components/         # Reusable components│   │   │   ├── LoginForm.tsx│   │   │   └── SignupForm.tsx│   │   ├── contexts/           # React contexts│   │   │   └── AuthContext.tsx│   │   ├── pages/              # Page components│   │   │   ├── LandingPage.tsx│   │   │   ├── AuthPage.tsx│   │   │   ├── Dashboard.tsx│   │   │   ├── CoursesPage.tsx│   │   │   ├── CourseDetailPage.tsx│   │   │   ├── SuperAdminPage.tsx│   │   │   └── AdminPage.tsx│   │   ├── services/           # API services│   │   │   └── api.ts│   │   └── App.tsx│   └── package.json│├── backend/                     # FastAPI Backend│   ├── app/│   │   ├── api/                # Route handlers│   │   │   ├── auth.py│   │   │   └── courses.py│   │   ├── core/               # Config & database│   │   │   ├── config.py│   │   │   └── database.py│   │   ├── models/             # SQLAlchemy models│   │   │   ├── user.py│   │   │   ├── session.py│   │   │   ├── course.py│   │   │   └── conversation.py│   │   ├── schemas/            # Pydantic schemas│   │   │   ├── auth.py│   │   │   └── course.py│   │   ├── services/           # Business logic│   │   │   └── auth_service.py│   │   └── main.py             # App entry point│   ├── .env                    # Environment variables│   ├── init_db.py              # Database initialization│   ├── seed_courses.py         # Course seeding│   └── create_super_admin.py   # Super admin creation│├── .gitignore└── README.md
8. Appendices
8.1 Installation Guide
Clone the repository
Set up Neon PostgreSQL database
Configure .env file in backend
Run python init_db.py to create tables
Run python create_super_admin.py for initial admin
Run python seed_courses.py for sample courses
Start backend: uvicorn app.main:app --reload
Start frontend: npm run dev
8.2 Default Credentials

RoleEmailPasswordSuper Adminsuperadmin@smarttutor.comSuperAdmin123!
8.3 API Documentation
Available at http://localhost:8000/docs when backend is running.
8.4 Known Issues
CORS requires custom middleware (not built-in)
Course total_lessons returns 0 until optimized
Admin list endpoint requires role validation fix
8.5 Future Enhancements
Email verification
Password reset
Course progress tracking
AI chat tutor integration
Payment gateway
Certificates of completion
Mobile app
Document Approval

RoleNameDateSignatureDeveloperProject Owner
End of Document how can i use them on this project 