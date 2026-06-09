# CIG Media Platform

A centralized Event & Media Management Platform for clubs and societies to upload, organize, access, and interact with media content seamlessly.

## 🔗 Live Demo
https://cig-media-platform-pi.vercel.app/

## 🚀 Features

### Core Features
- **Event Management** — Create and manage events with categories, dates, and descriptions. Sort by name, date, or category.
- **Album System** — Organize media into event-wise albums with public/private access control.
- **Media Upload** — Drag-and-drop bulk upload with preview. Supports images and videos. Powered by Cloudinary.
- **Access Control** — Four roles: Admin, Photographer, Member, Viewer with enforced permissions.
- **Social Features** — Like, comment, favourite, download with watermark, and share photos.
- **Real-time Notifications** — Instant notifications when someone likes or comments on your photo.

### AI/ML Features
- **Auto-tagging** — Automatic AI-generated tags for every uploaded photo using TensorFlow.js MobileNet (runs entirely in browser, no external API).
- **Advanced Search** — Search by event name, category, tags, and username.
- **Facial Recognition** — Upload a selfie to find all photos containing your face using face-api.js. Handles multiple faces in a single photo.

### Cloud & Storage
- **Cloudinary** — Optimized cloud storage with automatic compression and thumbnail generation.
- **Watermarking** — Automatic watermark added on download with club name.

### Bonus Features
- **QR Code Sharing** — Each album has a QR code for instant sharing.
- **Admin Panel** — Manage user roles from a dedicated admin interface.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Storage | Cloudinary |
| AI Tagging | TensorFlow.js + MobileNet |
| Face Recognition | face-api.js |
| Styling | Tailwind CSS |
| Deployment | Vercel |

## 📁 Project Structure
cig-media-platform/
├── app/
│   ├── admin/              # Admin panel for role management
│   ├── api/upload/         # Cloudinary upload API route
│   ├── components/         # Navbar component
│   ├── dashboard/          # Main dashboard
│   ├── events/             # Events list, create, detail pages
│   │   └── [id]/
│   │       └── albums/     # Albums and media pages
│   ├── face-search/        # Facial recognition feature
│   ├── favourites/         # User favourites page
│   ├── media/              # Individual media page
│   ├── search/             # Advanced search page
│   ├── login/              # Login page
│   └── signup/             # Signup page
├── lib/
│   ├── supabase.js         # Supabase client
│   ├── supabaseServer.js   # Supabase admin client
│   ├── autoTag.js          # AI auto-tagging utility
│   └── useProfile.js       # Role-based auth hook
└── public/
└── models/             # face-api.js ML models

## 🗄️ Database Schema

- **profiles** — User profiles with roles (admin, photographer, member, viewer)
- **events** — Club events with metadata
- **albums** — Event-wise media albums
- **media** — Photos and videos with AI tags
- **likes** — Photo likes
- **comments** — Photo comments
- **favourites** — Saved photos
- **notifications** — Real-time user notifications

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- Supabase account
- Cloudinary account

### Steps

1. Clone the repository
```bash
git clone https://github.com/HR7608/cig-media-platform.git
cd cig-media-platform
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` file

4. Run the database schema in Supabase SQL Editor

5. Start the development server
```bash
npm run dev
```

## 👥 Roles & Permissions

| Action | Admin | Photographer | Member | Viewer |
|---|---|---|---|---|
| Create Events | ✅ | ✅ | ❌ | ❌ |
| Create Albums | ✅ | ✅ | ❌ | ❌ |
| Upload Media | ✅ | ✅ | ❌ | ❌ |
| Like/Comment | ✅ | ✅ | ✅ | ❌ |
| Download | ✅ | ✅ | ✅ | ✅ |
| Manage Roles | ✅ | ❌ | ❌ | ❌ |

## 🏛️ Multi-Club Deployment Model

This platform is designed to be deployed independently by each club:

- Each club gets their own deployment (Vercel), database (Supabase), and storage (Cloudinary)
- Complete data isolation between clubs
- The first user to sign up automatically becomes the Admin
- Admin then assigns roles to photographers and members
- Any club can deploy their own instance in under 30 minutes using this repository

### Planned Enhancement
A future version will support multi-club architecture where:
- Clubs register on a central platform
- Each club gets an isolated workspace
- Super-admin manages all clubs from one dashboard
