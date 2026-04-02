---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments: ['_bmad-output/prd.md', '_bmad-output/planning-artifacts/architecture.md']
---

# Magic Brooms - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Magic Brooms, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can create an account with email and password
FR2: Users can log in and log out
FR3: Users can view and edit their profile (display name, avatar)
FR4: Instructors can assign or revoke instructor roles for other users
FR5: Users can recover their password via email
FR6: Users can browse a list of all available channels
FR7: Users can create new channels
FR8: Users can join and leave channels
FR9: Users can send real-time text messages in channels they've joined
FR10: Users can view message history in a channel
FR11: Users can react to messages with emoji reactions
FR12: Instructors can configure channel settings (name, description, channel type)
FR13: Instructors can moderate channels (delete messages, manage membership)
FR14: Users can create gallery cards with an image, title, description, and link
FR15: Users can browse gallery cards in a visual grid/card layout separate from the chat stream
FR16: Users can comment on gallery cards without cluttering the gallery browse view
FR17: Users can react to gallery cards
FR18: Instructors can designate a channel as gallery-type (visual cards) vs. standard chat
FR19: Users can view gallery card detail (full description, comments, link) by clicking into a card
FR20: Users can search across all messages using full-text search
FR21: Users can see search results with enough context to identify relevant conversations
FR22: Users can see unread indicators (badges) on channels with new activity
FR23: Users can see which channels have new messages since their last visit
FR24: The application presents a Sorcerer's Apprentice themed experience — adult, mystical, minimalist in tone
FR25: System messages, errors, and empty states use themed, personality-driven copy
FR26: Instructors can create and pre-populate channels before a cohort starts
FR27: Instructors can create multiple gallery cards in a batch workflow
FR28: Instructors can delete or archive channels

### NonFunctional Requirements

NFR1: Page load (initial) completes within 3 seconds on standard broadband
NFR2: Message delivery latency under 500ms end-to-end
NFR3: Gallery view renders within 1 second for up to 100 cards
NFR4: Search results return within 1 second
NFR5: All user-initiated actions (post, react, navigate) respond within 500ms
NFR6: User passwords are hashed and never stored in plaintext
NFR7: All data transmitted over HTTPS/WSS
NFR8: Authentication tokens expire and can be revoked
NFR9: Instructors cannot access other users' passwords
NFR10: User-uploaded images are validated and sanitized before storage
NFR11: System supports a single cohort of up to 50 concurrent users without degradation
NFR12: Message history and gallery cards persist indefinitely (no auto-deletion)
NFR13: Single-instance deployment is acceptable for MVP
NFR14: Semantic HTML throughout — headings, landmarks, form labels
NFR15: All interactive elements reachable via keyboard navigation
NFR16: Sufficient color contrast ratios (WCAG AA for text)
NFR17: Alt text on all user-uploaded and system images
NFR18: ARIA labels on custom interactive components
NFR19: Application recovers gracefully from WebSocket disconnection (auto-reconnect)
NFR20: No message loss — messages sent during brief disconnects are delivered on reconnect
NFR21: System handles browser refresh without data loss or session expiry

### Additional Requirements

- Architecture specifies a starter template: `npm create vite@latest magic-broom-chat -- --template react-swc-ts` — this impacts Epic 1 Story 1
- Tailwind CSS v4 setup via `@tailwindcss/vite` plugin post-scaffold
- shadcn/ui component library installation and configuration
- Supabase project creation + local dev setup (`supabase start` via Docker)
- Initial database schema: 7 migration files (profiles, channels, messages, gallery_cards, reactions, search indexes, RLS policies)
- Seed data for local development (default channels + test data)
- CI/CD pipeline: GitHub Actions for lint, type-check, test on PR; auto-deploy to Vercel on merge to main
- Environment configuration: `.env.local` for local dev, Vercel dashboard for production
- Supabase type generation: `supabase gen types typescript` after every migration
- Realtime pattern: Broadcast + Database Triggers (not postgres_changes) for all live updates
- TanStack Query for all server state management with optimistic updates
- Zustand for client-only UI state (sidebar, theme)
- snake_case ↔ camelCase transform at hooks layer boundary
- React Router for frontend routing
- Vercel deployment as static SPA via Vercel CLI
- Path aliases (`@/components`, `@/lib`, `@/hooks`) configured in Vite
- Feature-based project organization with co-located tests

### UX Design Requirements

No UX Design document exists. UX requirements will be addressed through the Sorcerer's Apprentice theming requirements (FR24, FR25) and accessibility NFRs (NFR14-18).

### FR Coverage Map

| FR | Epic | Description |
|---|---|---|
| FR1 | Epic 1 | Account creation (email/password) |
| FR2 | Epic 1 | Login and logout |
| FR3 | Epic 1 | View and edit profile |
| FR4 | Epic 5 | Instructor role assignment |
| FR5 | Epic 1 | Password recovery |
| FR6 | Epic 2 | Browse channel list |
| FR7 | Epic 2 | Create new channels |
| FR8 | Epic 2 | Join and leave channels |
| FR9 | Epic 2 | Real-time messaging |
| FR10 | Epic 2 | Message history |
| FR11 | Epic 2 | Emoji reactions on messages |
| FR12 | Epic 5 | Channel settings configuration |
| FR13 | Epic 5 | Channel moderation |
| FR14 | Epic 3 | Create gallery cards |
| FR15 | Epic 3 | Browse gallery grid |
| FR16 | Epic 3 | Comments on gallery cards |
| FR17 | Epic 3 | Reactions on gallery cards |
| FR18 | Epic 3 | Gallery-type channel designation |
| FR19 | Epic 3 | Gallery card detail view |
| FR20 | Epic 4 | Full-text search |
| FR21 | Epic 4 | Search results with context |
| FR22 | Epic 4 | Unread badges |
| FR23 | Epic 4 | New message indicators |
| FR24 | Epic 1 | Sorcerer's Apprentice theme |
| FR25 | Epic 1 | Themed system messages/copy |
| FR26 | Epic 5 | Pre-populate channels |
| FR27 | Epic 5 | Batch gallery card creation |
| FR28 | Epic 5 | Delete/archive channels |

## Epic List

### Epic 1: Project Foundation & User Authentication
Users can sign up, log in, recover their password, and manage their profile within a Sorcerer's Apprentice themed application.
**FRs covered:** FR1, FR2, FR3, FR5, FR24, FR25

### Epic 2: Channels & Real-Time Messaging
Users can browse channels, create new ones, join/leave channels, and have real-time conversations with message history and emoji reactions.
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11

### Epic 3: Gallery & Resource Sharing
Users can create visual gallery cards (image, title, description, link), browse them in a grid layout, view card details, comment on cards, and react to them.
**FRs covered:** FR14, FR15, FR16, FR17, FR18, FR19

### Epic 4: Search & Awareness
Users can search across all messages and gallery cards with contextual results, and see unread badges showing where new activity has occurred.
**FRs covered:** FR20, FR21, FR22, FR23

### Epic 5: Instructor Administration & Moderation
Instructors can configure channels, moderate content, assign roles, pre-populate channels, batch-create gallery cards, and archive channels.
**FRs covered:** FR4, FR12, FR13, FR26, FR27, FR28

## Epic 1: Project Foundation & User Authentication

Users can sign up, log in, recover their password, and manage their profile within a Sorcerer's Apprentice themed application.

### Story 1.1: Project Scaffold & Dev Environment

As a developer,
I want the project initialized with Vite + React + TypeScript + SWC, Tailwind v4, shadcn/ui, Supabase local dev, and path aliases configured,
So that all subsequent stories have a working foundation to build on.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** I run `npm install && npm run dev`
**Then** the Vite dev server starts and renders a placeholder page
**And** Tailwind CSS v4 is functional with utility classes rendering correctly
**And** shadcn/ui components.json is configured and at least one component (Button) is available
**And** path aliases (`@/components`, `@/lib`, `@/hooks`) resolve correctly
**And** `supabase start` launches a local Supabase instance
**And** a profiles migration creates the `profiles` table with `id`, `display_name`, `avatar_url`, `role` columns and a trigger on `auth.users`
**And** `.env.local` is gitignored and `.env.example` documents required vars
**And** ESLint and Vitest are configured and passing

### Story 1.2: Sorcerer's Apprentice Theme & App Shell

As a user,
I want the application to present a Sorcerer's Apprentice themed experience with an app layout shell,
So that the interface feels adult, mystical, and minimalist from the first interaction.

**Acceptance Criteria:**

**Given** the app is loaded
**When** I view the interface
**Then** CSS custom properties define theme tokens (colors, typography, spacing) reflecting a mystical/craftsperson aesthetic
**And** the AppLayout component renders a sidebar + content area shell
**And** system messages, error states, and empty states use themed, personality-driven copy
**And** the ThemeProvider context is available to all components
**And** color contrast meets WCAG AA requirements (NFR16)
**And** semantic HTML with proper landmarks is used throughout (NFR14)

### Story 1.3: User Registration

As a new student,
I want to create an account with my email and password,
So that I can access Magic Brooms.

**Acceptance Criteria:**

**Given** I am on the signup page
**When** I enter a valid email and password and submit the form
**Then** my account is created via Supabase Auth
**And** a profile record is created in the profiles table with default "student" role
**And** I am redirected to the main app view
**And** the signup form validates email format and password strength before submission
**And** if registration fails (duplicate email, weak password), a themed error message is displayed
**And** all form elements are keyboard-navigable and have proper labels (NFR15)
**And** a ProtectedRoute component redirects unauthenticated users to login

### Story 1.4: User Login & Logout

As a returning user,
I want to log in and log out of my account,
So that I can securely access my conversations.

**Acceptance Criteria:**

**Given** I am on the login page
**When** I enter valid credentials and submit
**Then** I am authenticated via Supabase Auth and redirected to the main app
**And** my session persists across browser refresh (NFR21)
**And** if login fails (wrong credentials), a themed error message is displayed
**And** I can log out from the app, clearing my session
**And** after logout, I am redirected to the login page
**And** authentication tokens expire and can be refreshed (NFR8)

### Story 1.5: Password Recovery

As a user who forgot their password,
I want to reset my password via email,
So that I can regain access to my account.

**Acceptance Criteria:**

**Given** I am on the forgot-password page
**When** I enter my registered email and submit
**Then** a password reset email is sent via Supabase Auth
**And** I see a confirmation message with themed copy
**And** if the email is not registered, no error is revealed (security best practice)
**And** the reset link allows me to set a new password
**And** after resetting, I can log in with the new password

### Story 1.6: User Profile Management

As a user,
I want to view and edit my display name and avatar,
So that my identity is visible to other students.

**Acceptance Criteria:**

**Given** I am logged in
**When** I navigate to my profile page
**Then** I can see my current display name and avatar
**And** I can update my display name and save changes
**And** I can upload an avatar image (validated for file type and size) (NFR10)
**And** changes are persisted to the profiles table
**And** if save fails, a themed error message is displayed
**And** the profile page is accessible via keyboard navigation (NFR15)

## Epic 2: Channels & Real-Time Messaging

Users can browse channels, create new ones, join/leave channels, and have real-time conversations with message history and emoji reactions.

### Story 2.1: Channel Data Model & Channel List

As a user,
I want to browse a list of all available channels,
So that I can find conversations to participate in.

**Acceptance Criteria:**

**Given** I am logged in
**When** I view the sidebar
**Then** I see a list of all channels with their names and descriptions
**And** channels and channel_members tables exist with proper schema and RLS policies
**And** the channel list is fetched via a `useChannels` hook using TanStack Query
**And** clicking a channel navigates to `/channels/:id`
**And** the channel list displays in the AppLayout sidebar

### Story 2.2: Channel Creation, Join & Leave

As a user,
I want to create new channels and join or leave existing ones,
So that I can organize conversations around topics I care about.

**Acceptance Criteria:**

**Given** I am logged in
**When** I click "Create Channel"
**Then** a dialog lets me enter a channel name and description
**And** the new channel is created and I am automatically joined as a member
**And** the channel appears in the sidebar immediately
**And** I can join channels I'm not a member of
**And** I can leave channels I've joined (except if it's the last member)
**And** joining/leaving updates the channel list without page refresh

### Story 2.3: Real-Time Messaging

As a channel member,
I want to send and receive real-time text messages,
So that I can communicate with my cohort instantly.

**Acceptance Criteria:**

**Given** I am in a channel I've joined
**When** I type a message and press send
**Then** the message appears in the chat immediately (optimistic update)
**And** other users in the channel see the message in real time via Broadcast
**And** the messages table stores all messages with proper schema (id, channel_id, user_id, content, created_at)
**And** a DB trigger broadcasts new messages to `room:{channel_id}:messages`
**And** message delivery latency is under 500ms (NFR2)
**And** the ChatView component renders a scrollable message stream
**And** message history loads from the database on channel entry
**And** the useMessages hook handles both history fetch and realtime subscription

### Story 2.4: Message Reconnection & Resilience

As a user with an unstable connection,
I want messages to be delivered even after brief disconnects,
So that I never miss what was said.

**Acceptance Criteria:**

**Given** I am in a channel and my WebSocket connection drops
**When** the connection is restored
**Then** the app automatically reconnects via Supabase's built-in reconnect with exponential backoff
**And** any messages sent during the disconnect are fetched via a catch-up DB query
**And** the message stream shows no gaps
**And** a subtle reconnection indicator is shown during disconnect (themed copy)

### Story 2.5: Emoji Reactions on Messages

As a user,
I want to react to messages with emoji,
So that I can express quick feedback without writing a full reply.

**Acceptance Criteria:**

**Given** I am viewing a message in a channel
**When** I click the reaction button and select an emoji
**Then** my reaction is added to the message and displayed inline
**And** the reactions table stores reactions with user_id, message_id, emoji
**And** reactions are broadcast in real time via DB trigger to `room:{channel_id}:reactions`
**And** I can remove my own reaction by clicking it again
**And** multiple users can add the same emoji, showing a count
**And** the EmojiPicker component is shared and accessible via keyboard (NFR15)

## Epic 3: Gallery & Resource Sharing

Users can create visual gallery cards, browse them in a grid layout, view card details, comment on cards, and react to them.

### Story 3.1: Gallery Channel Type & Card Creation

As a user,
I want to create gallery cards with an image, title, description, and link in a gallery-type channel,
So that I can share resources and showcase projects visually.

**Acceptance Criteria:**

**Given** I am in a channel designated as gallery-type
**When** I click "New Card"
**Then** a dialog lets me upload an image, enter a title, description, and link
**And** the image is uploaded to Supabase Storage with file type and size validation (NFR10)
**And** the gallery_cards table stores the card with proper schema (id, channel_id, user_id, image_url, title, description, link, created_at)
**And** RLS policies allow authenticated users to create cards in channels they've joined
**And** the channel's `type` field (`'standard'` | `'gallery'`) determines which renderer is used
**And** if upload or creation fails, a themed error message is displayed

### Story 3.2: Gallery Grid Browse View

As a user,
I want to browse gallery cards in a visual grid layout,
So that I can quickly scan resources and projects without scrolling through chat messages.

**Acceptance Criteria:**

**Given** I navigate to a gallery-type channel
**When** the GalleryView loads
**Then** cards are displayed in a responsive grid layout (adapts to screen size)
**And** each card shows its image thumbnail, title, and a truncated description
**And** the grid renders within 1 second for up to 100 cards (NFR3)
**And** cards are fetched via a `useGalleryCards` hook using TanStack Query
**And** new cards appear in real time via Broadcast + DB trigger to `room:{channel_id}:cards`
**And** the grid is keyboard-navigable (NFR15)

### Story 3.3: Gallery Card Detail View

As a user,
I want to click into a gallery card to see its full description, link, and comments,
So that I can learn more about a resource and join the discussion.

**Acceptance Criteria:**

**Given** I am browsing the gallery grid
**When** I click on a card
**Then** I navigate to `/channels/:id/card/:cardId` showing the full detail view
**And** the detail view displays the full-size image, title, complete description, and clickable link
**And** the link opens in a new tab
**And** I can navigate back to the gallery grid
**And** alt text is displayed for the card image (NFR17)

### Story 3.4: Gallery Card Comments

As a user,
I want to comment on gallery cards without cluttering the gallery browse view,
So that I can discuss resources and projects in context.

**Acceptance Criteria:**

**Given** I am on a gallery card detail view
**When** I type a comment and submit
**Then** the comment appears below the card details
**And** comments are stored in the card_comments table (id, card_id, user_id, content, created_at)
**And** comments are broadcast in real time via DB trigger
**And** comments are only visible on the detail view, not in the gallery grid
**And** other users see new comments in real time
**And** the comment input is accessible with proper labels (NFR15)

### Story 3.5: Gallery Card Reactions

As a user,
I want to react to gallery cards with emoji,
So that I can quickly show appreciation for shared resources.

**Acceptance Criteria:**

**Given** I am viewing a gallery card (in grid or detail view)
**When** I click the reaction button and select an emoji
**Then** my reaction is added and displayed on the card
**And** reactions are stored in the reactions table with a reference to the gallery card
**And** reactions are broadcast in real time
**And** I can remove my own reaction by clicking it again
**And** reaction counts are visible on the card in the grid view
**And** the shared EmojiPicker from Epic 2 is reused

## Epic 4: Search & Awareness

Users can search across all messages and gallery cards with contextual results, and see unread badges showing where new activity has occurred.

### Story 4.1: Full-Text Search

As a user,
I want to search across all messages and gallery cards,
So that I can find resources and conversations I'm looking for.

**Acceptance Criteria:**

**Given** I am logged in
**When** I type a query into the SearchBar
**Then** results are returned from both messages and gallery cards using PostgreSQL tsvector full-text search
**And** tsvector indexes are created on messages.content and gallery_cards (title, description)
**And** search results return within 1 second (NFR4)
**And** each result shows enough context to identify the conversation (channel name, snippet, timestamp, author)
**And** clicking a message result navigates to that channel
**And** clicking a gallery card result navigates to the card detail view
**And** the SearchBar is accessible with proper ARIA labels (NFR18)
**And** the useSearch hook manages query state via TanStack Query

### Story 4.2: Unread Indicators & New Activity Badges

As a user,
I want to see which channels have new messages since my last visit,
So that I can prioritize where to catch up.

**Acceptance Criteria:**

**Given** I am logged in and viewing the channel list
**When** new messages arrive in channels I've joined
**Then** unread badges (counts) appear next to those channels in the sidebar
**And** `channel_members.last_read_at` tracks my read position per channel
**And** entering a channel updates `last_read_at` to the current timestamp
**And** unread counts are computed by comparing `last_read_at` against message timestamps
**And** badge counts update in real time as new messages arrive via existing broadcast subscriptions
**And** the useUnreadCounts hook provides per-channel unread state
**And** channels with unread messages are visually distinguished (bold name, badge count)
**And** unread indicators are pull-based only — no push notifications

## Epic 5: Instructor Administration & Moderation

Instructors can configure channels, moderate content, assign roles, pre-populate channels, batch-create gallery cards, and archive channels.

### Story 5.1: Channel Configuration & Type Management

As an instructor,
I want to configure channel settings including name, description, and channel type (standard/gallery),
So that I can organize the cohort's communication spaces.

**Acceptance Criteria:**

**Given** I am logged in as an instructor
**When** I open channel settings
**Then** I can edit the channel name and description
**And** I can change the channel type between `'standard'` and `'gallery'`
**And** changes are saved and reflected immediately for all users
**And** RLS policies restrict channel configuration to instructor role only
**And** students see the settings button as disabled or hidden
**And** if save fails, a themed error message is displayed

### Story 5.2: Channel Moderation

As an instructor,
I want to delete messages and manage channel membership,
So that I can maintain a productive learning environment.

**Acceptance Criteria:**

**Given** I am logged in as an instructor
**When** I view a channel
**Then** I can delete any message (not just my own)
**And** message deletion is broadcast in real time to all channel members
**And** I can remove members from a channel
**And** RLS policies enforce that only instructors can delete others' messages
**And** deleted messages are removed from the UI for all users immediately
**And** students cannot see delete controls on other users' messages

### Story 5.3: Instructor Role Management

As an instructor,
I want to assign or revoke the instructor role for other users,
So that co-instructors can help manage the platform.

**Acceptance Criteria:**

**Given** I am logged in as an instructor
**When** I view a user's profile or a user management interface
**Then** I can promote a student to instructor or demote an instructor to student
**And** the role change updates the `profiles.role` column immediately
**And** RLS policies enforce that only instructors can change roles
**And** I cannot access other users' passwords (NFR9)
**And** the role change takes effect immediately without requiring the target user to re-login

### Story 5.4: Channel Pre-Population & Archival

As an instructor,
I want to create and pre-populate channels before a cohort starts, and archive channels when they're no longer needed,
So that the platform is ready on day one and stays organized.

**Acceptance Criteria:**

**Given** I am logged in as an instructor
**When** I create a new channel
**Then** I can set it up with a name, description, and type before any students join
**And** I can archive a channel, making it read-only and visually de-emphasized in the sidebar
**And** archived channels remain accessible for viewing history but cannot receive new messages
**And** I can delete a channel entirely if needed
**And** RLS policies restrict archival and deletion to instructor role

### Story 5.5: Batch Gallery Card Creation

As an instructor,
I want to create multiple gallery cards at once,
So that I can efficiently populate resource channels before a cohort starts.

**Acceptance Criteria:**

**Given** I am in a gallery-type channel as an instructor
**When** I select "Batch Create Cards"
**Then** I can enter multiple cards (title, description, link, image) in a batch workflow
**And** batch creation is handled via a Supabase Edge Function for server-side processing
**And** all cards are created and appear in the gallery
**And** if any card in the batch fails validation, the error is reported per-card without blocking the others
**And** a progress indicator shows batch creation status
**And** the batch workflow is only available to instructors
