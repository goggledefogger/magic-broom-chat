---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
inputDocuments: ['_bmad-output/brainstorming/brainstorming-session-2026-03-21-2300.md', 'KICKOFF_PROMPT.md']
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: web_app
  domain: edtech
  complexity: medium
  projectContext: greenfield
---

# Product Requirements Document - Magic Brooms

**Author:** Danny
**Date:** 2026-03-21

## Executive Summary

Magic Brooms is a real-time web chat application and cohort home base for an AI-assisted software development course run by A Portland Career. It replaces scattered email and student portal sharing with a single space where course resources, project showcases, and peer collaboration live together. Students use the app while learning to build apps like it — creating a feedback loop where the platform itself is a teaching artifact.

The app is built around a Sorcerer's Apprentice theme: AI tools are the brooms — tireless, helpful, occasionally chaotic. The theme is adult and mystical in tone, minimalist in execution — more like a craftsperson's workshop with subtle magic than anything cartoonish. The platform makes student work visible and celebrated with minimal friction, serving students across all skill levels through a tiered contribution model where the architecture itself teaches separation of concerns.

### What Makes This Special

- **Gallery-first resource sharing** — course resources, links, and project showcases are posted as visual cards (image, title, link) browseable in a gallery view, with discussion threads attached but not cluttering the browse experience. Not a wiki, not a text stream.
- **Auto-generated project hype videos** — GitHub sync reads READMEs, pulls repo highlights, and generates FFmpeg + AI-crafted intro videos with an epic, lo-fi/glitchy creative style. A wrestling entrance for your code.
- **The app is the assignment** — students contribute to the platform they use daily. A beginner builds the emoji picker, an advanced student builds the WebSocket layer, everyone gets visible "built by" attribution.
- **Anxiety-reducing design** — pull-based notifications (unread badges, no push interruptions), no topic threading in MVP, warm UI aligned with A Portland Career's existing brand and color scheme.

## Project Classification

- **Type:** Web application (real-time SPA)
- **Domain:** EdTech — purpose-built for a software development course cohort
- **Complexity:** Medium — real-time messaging, multi-user collaboration, AI-generated content, but no heavy regulatory burden
- **Context:** Greenfield — new product, no existing codebase

## Success Criteria

### User Success

- Students find course resources (links, lessons, tips) in Magic Brooms without digging through email or the student portal
- Students discover useful content shared by peers — organic peer contributions, not just instructor-posted material
- Students share their own work and receive meaningful reactions — comments, ideas, collaboration offers
- Collaborative moments feel rewarding — when someone helps or contributes, both parties get visible recognition

### Business Success

- **Engagement depth over breadth** — success measured by quality of interactions (help given, ideas exchanged, projects collaborated on), not message count
- **Peer-to-peer value creation** — students helping each other, sharing resources, and testing each other's tools without instructor prompting
- **Post-course retention** — students keep using the platform after the course ends
- **Organic word-of-mouth** — engagement quality and student project showcases become shareable artifacts that attract future cohorts
- **Content flywheel** — student contributions become reusable course resources, reducing instructor content creation burden

### Technical Success

- Real-time messaging works reliably with low latency for a cohort-sized group (tens of users)
- Gallery view loads quickly and browsing feels smooth with many posts
- The app runs affordably — infrastructure costs appropriate for an educational project

### Measurable Outcomes

- 70%+ of enrolled students actively use Magic Brooms at least weekly during the course
- At least half of students share a project or resource within the first two weeks
- Peer-to-peer interactions outnumber instructor-to-student posts by end of course
- At least 30% of students remain active one month after course completion
- Students cite Magic Brooms contributions in portfolios or job applications

## Product Scope & Phased Development

### MVP Strategy

**Approach:** Experience MVP — the minimum that makes students say "this is where I want to be." The gallery-first resource sharing is the differentiator and must be in the MVP even though it's the most complex UI feature. Everything else stays lean.

**Resource Requirements:** Danny and Dan (co-instructors) with AI-assisted development. The course itself may contribute features post-MVP through student contributions.

### Phase 1: MVP

**Core User Journeys Supported:**
- Journey 1 (New Student Discovery) — full support
- Journey 2 (Mid-Course Collaboration) — partial (commenting works, @mentions and credit system deferred)
- Journey 3 (Instructor Setup) — partial (channel management and resource posting, analytics deferred)
- Journey 4 (Alumni) — deferred to Phase 2

**Must-Have Capabilities:**
- User authentication (sign up, log in, log out)
- Channel-based real-time messaging
- Gallery-style resource/showcase channel type (visual cards with image, title, description, link)
- Comments and reactions on gallery cards
- Basic full-text search across messages
- Unread badges (pull-based, no push notifications)
- Student-owned channel creation
- Instructor channel management and moderation
- Sorcerer's Apprentice theming — adult, mystical, minimalist

**Explicitly Deferred from MVP:**
- User presence (online/offline/idle) — not needed for cohort of ~20
- @mentions with notifications
- GitHub repo linking and sync
- Bookmarking/saving
- Celebration animations
- Direct messaging
- Pinning content
- Engagement analytics

### Phase 2: Growth

- User presence (online/offline/idle)
- @mentions with credit/notification system
- GitHub integration with automatic project sync
- Direct messaging
- Bookmarking/saving
- Pinning content
- Engagement analytics (views, comments per card)
- Celebration/recognition moments
- Generative SVG avatars
- Alumni access and cross-cohort visibility

### Phase 3: Expansion

- Auto-generated project hype videos (FFmpeg + AI, lo-fi/glitchy aesthetic)
- Tiered contribution labels on features (starter / intermediate / advanced)
- "Built by" attribution system
- Help threads with automatic code context
- Content export / cohort carry-forward between cohorts

### Vision (Future)

- Course-aware Broom Companion AI bot (RAG-grounded in course materials)
- LLM-ready data export / MCP server
- Portfolio-as-byproduct auto-generation from contribution history
- Activity-derived presence (status from Git/IDE activity)
- Topic-based threading (Zulip's signature feature)
- Alumni network features for cross-cohort connection
- Build log as content — "how this was built" stories attached to features
- Ideas-made-visible — tracing lineage from brainstorm comment to shipped feature
- Personal project bridge — the app as infrastructure for students' other work
- BMAD skill integration — chat data flowing into development workflows
- Meta-learning loop — self-aware design where building the tool you use is an explicit pedagogical choice

### Risk Mitigation

**Technical:** The gallery-style channel type is the riskiest MVP feature — custom UI with no off-the-shelf equivalent. Mitigate by building it as a variant of the channel view (same data model, different renderer) rather than a separate system.

**Market:** Low risk — the "market" is a known cohort with known instructors. Validation happens immediately through usage.

**Resource:** If time is tight, the fallback MVP is standard chat channels with a simpler card-link format (title + URL + description, no image upload). This preserves resource-sharing value without gallery UI complexity.

## User Journeys

### Journey 1: New Student — First Week Discovery

**Persona:** Alex, a career changer two weeks into A Portland Career's AI-assisted development course. Has some coding experience but has never used an AI coding tool. Feels behind compared to classmates who already have CS backgrounds.

**Opening Scene:** Alex gets an invite link to Magic Brooms on day one. The onboarding is quick — sign up, pick a username, and they're in. The landing screen shows a few channels: #resources, #project-showcase, #general, and a welcome message with a subtle mystical tone that feels warm without being cheesy. There's already a gallery of links from Danny and Dan — the same tips and tools they mentioned in class yesterday, now browseable instead of buried in an email thread.

**Rising Action:** Alex browses the #resources gallery, flipping through cards — each one has a thumbnail, a short description, and a link. They find the Claude Code setup guide they couldn't find in their inbox last night. They click into it, see a couple of comments from other students ("this step tripped me up, here's what worked"), and feel less alone. Later that week, they push their first project to GitHub and post it to #project-showcase with a screenshot and a one-liner description.

**Climax:** The next morning, Alex opens Magic Brooms and sees reactions on their post — a classmate left a comment saying "I tried this and it works great, have you thought about adding a --verbose flag?" Another student starred it. Alex realizes this isn't a grading rubric — people actually looked at their work and had ideas.

**Resolution:** By the end of week two, Alex checks Magic Brooms before email. They've commented on three classmates' projects and posted a second project. The app feels like the course's living room — not a classroom, not a Slack workspace, just the place where the cohort hangs out and helps each other.

**Requirements revealed:** Onboarding flow, channel browsing, gallery view for resources, project showcase posting, reactions/comments, unread indicators.

---

### Journey 2: Student — Mid-Course Collaboration & Struggle

**Persona:** Sam, a bootcamp grad halfway through the course. Comfortable with JavaScript but hitting a wall on the real-time features of their personal project. Tends to struggle silently rather than ask for help.

**Opening Scene:** Sam has been lurking in Magic Brooms for a few weeks — reading resources, occasionally reacting to posts, but hasn't shared their own project yet. Their WebSocket implementation keeps dropping connections and they've spent two evenings stuck on it.

**Rising Action:** Sam notices a classmate, Jordan, posted a project in #project-showcase that has real-time features working. Sam clicks into the card, reads the description, and sees Jordan linked their GitHub repo. Sam leaves a comment: "How did you handle reconnection logic? Mine keeps dropping." Jordan replies with a code snippet and a suggestion. Another student chimes in with a link to a resource card in #resources that covers exactly this pattern.

**Climax:** Sam fixes their implementation using the combined input from two classmates and a resource they'd never found on their own. They post their updated project to #project-showcase — their first showcase post. The description includes "thanks to @Jordan and @Riley for the WebSocket help."

**Resolution:** Sam goes from lurker to contributor. The barrier wasn't skill — it was visibility. Seeing other people's work, being able to ask in context (on a project card, not in a general chat void), and getting credited for helping made collaboration feel natural instead of vulnerable.

**Requirements revealed:** Comment threads on showcase cards, @mentions with notifications, cross-linking between resources and showcase posts, GitHub repo links on project cards, contributor attribution.

---

### Journey 3: Instructor — Course Setup & Resource Curation

**Persona:** Danny (co-instructor with Dan). Runs the AI-assisted development course at A Portland Career. Currently shares resources via email and the student portal, which means things get lost and students ask for the same links repeatedly.

**Opening Scene:** Before a new cohort starts, Danny logs in and sets up the channels — #resources, #project-showcase, #general, a couple of topic-specific channels. He creates a batch of resource cards in the gallery: setup guides, tool links, lesson recaps, recommended reading. Dan adds a few of his own favorites.

**Rising Action:** During the course, Danny posts new resources as they come up in class — "here's that thing I showed today" takes 30 seconds instead of composing an email. He can see which resources get the most views and comments, giving him signal on what's landing. When students post projects, Danny and Dan leave substantive feedback directly on the showcase cards.

**Climax:** Midway through the cohort, Danny realizes he hasn't sent a "resources" email in three weeks. Everything lives in Magic Brooms now. Students are finding things on their own, sharing with each other, and the resource gallery has grown with student contributions alongside instructor posts. A student shares a tool Danny hadn't seen — he pins it.

**Resolution:** By end of cohort, the Magic Brooms instance is a living archive of the course. Danny exports the best resource cards and showcase posts as starting content for the next cohort. The student-generated content is higher quality than what he could have curated alone.

**Requirements revealed:** Channel management (create, configure), batch resource card creation, analytics/engagement visibility (views, comments), pinning, instructor role with moderation capabilities, content export/carry-forward between cohorts.

---

### Journey 4: Alumni — Post-Course Connection

**Persona:** Morgan, graduated from the course two months ago. Now working as a junior developer, still refining their portfolio and occasionally wanting to bounce ideas off former classmates.

**Opening Scene:** Morgan sees an unread badge — someone commented on their showcase project from the course. A current student found it while browsing alumni projects and had a question about the architecture.

**Rising Action:** Morgan answers the question, checks what the current cohort is building, and sees a few interesting projects. They share a tool they discovered at their new job that would have helped during the course. They post it to #resources with a note: "wish I'd had this during week 4."

**Climax:** A current student DMs Morgan asking about job hunting with a portfolio built from course projects. Morgan shares their experience and links to their Magic Brooms contributions as an example of how they presented their work to employers.

**Resolution:** Morgan stays loosely connected — not daily, but checking in when something catches their eye. The cohort boundary softens. The platform becomes a professional network that grew organically from a course, not a LinkedIn connection request.

**Requirements revealed:** Alumni access persistence (accounts don't expire), cross-cohort content visibility, DM/direct messaging, alumni-contributed resources alongside instructor content, low-friction re-engagement.

---

### Journey Requirements Summary

| Capability | Revealed By | Phase |
|---|---|---|
| Onboarding / sign-up flow | Journey 1 (Alex) | MVP |
| Channel browsing & creation | Journeys 1, 3 | MVP |
| Gallery view for resources & showcases | Journeys 1, 2, 3 | MVP |
| Project showcase posting (card format) | Journeys 1, 2 | MVP |
| Comments & reactions on cards | Journeys 1, 2, 3 | MVP |
| Unread badges (pull-based) | Journeys 1, 4 | MVP |
| Instructor channel management & moderation | Journey 3 (Danny) | MVP |
| Resource card batch creation | Journey 3 (Danny) | MVP |
| Search across messages & cards | All journeys | MVP |
| @mentions with credit/notification | Journey 2 (Sam) | Phase 2 |
| GitHub repo linking on project cards | Journey 2 (Sam) | Phase 2 |
| Bookmarking / saving | Journey 1 (Alex) | Phase 2 |
| Pinning content | Journey 3 (Danny) | Phase 2 |
| Engagement analytics (views, comments) | Journey 3 (Danny) | Phase 2 |
| Direct messaging | Journey 4 (Morgan) | Phase 2 |
| Alumni access persistence | Journey 4 (Morgan) | Phase 2 |
| Cross-cohort content visibility | Journey 4 (Morgan) | Phase 2 |
| Content export / cohort carry-forward | Journey 3 (Danny) | Phase 3 |
| Celebration animations | Journey 1 (Alex) | Phase 2 |
| User presence (online/offline/idle) | All journeys | Phase 2 |

## Innovation & Novel Patterns

### Detected Innovation Areas

- **Auto-generated project hype videos** — FFmpeg + AI-crafted intro videos generated from GitHub repos. No existing chat or educational platform does this. Turns "show your project" into a celebratory moment.
- **Gallery-first chat hybrid** — resource and showcase channels render as browseable visual cards, not message streams. Discussion attaches to cards without cluttering the browse experience.
- **Platform-as-curriculum** — the app students use daily is also the app they contribute to, with tiered complexity and visible attribution making the codebase itself a teaching tool.

### Validation Approach

- Video generation validated through a standalone prototype (Python + FFmpeg + LLM) before integrating into the platform
- Gallery view validated by shipping it as the default for #resources and #project-showcase and observing whether students browse vs. ignore
- Platform-as-curriculum validated by tracking student contributions across skill tiers

## Web App Specific Requirements

### Technical Architecture Considerations

- **Application type:** SPA with real-time WebSocket connections for messaging
- **Rendering strategy:** Client-side rendering — no SSR needed (private app, no SEO requirement)
- **Real-time layer:** WebSocket-based for messaging and notification badges
- **Media handling:** Image uploads for gallery cards, video generation (FFmpeg + AI) as an async background process

### Browser Support

- Modern evergreen browsers only: Chrome, Firefox, Safari, Edge (latest 2 versions)
- Mobile browser support (responsive) for on-the-go access, but not a primary target

### Responsive Design

- Desktop-first design (primary usage during course work)
- Responsive down to tablet/mobile for browsing and quick interactions
- Gallery view adapts grid layout to screen size

### Performance Targets

- Initial page load under 3 seconds on standard broadband
- Message delivery latency under 500ms
- Gallery view renders within 1 second for up to 100 cards
- Search results return within 1 second
- Video generation is async — minutes are acceptable, with progress indicator

## Functional Requirements

### User Management

- FR1: Users can create an account with email and password
- FR2: Users can log in and log out
- FR3: Users can view and edit their profile (display name, avatar)
- FR4: Instructors can assign or revoke instructor roles for other users
- FR5: Users can recover their password via email

### Channels & Messaging

- FR6: Users can browse a list of all available channels
- FR7: Users can create new channels
- FR8: Users can join and leave channels
- FR9: Users can send real-time text messages in channels they've joined
- FR10: Users can view message history in a channel
- FR11: Users can react to messages with emoji reactions
- FR12: Instructors can configure channel settings (name, description, channel type)
- FR13: Instructors can moderate channels (delete messages, manage membership)

### Gallery & Resource Sharing

- FR14: Users can create gallery cards with an image, title, description, and link
- FR15: Users can browse gallery cards in a visual grid/card layout separate from the chat stream
- FR16: Users can comment on gallery cards without cluttering the gallery browse view
- FR17: Users can react to gallery cards
- FR18: Instructors can designate a channel as gallery-type (visual cards) vs. standard chat
- FR19: Users can view gallery card detail (full description, comments, link) by clicking into a card

### Search

- FR20: Users can search across all messages using full-text search
- FR21: Users can see search results with enough context to identify relevant conversations

### Notifications & Awareness

- FR22: Users can see unread indicators (badges) on channels with new activity
- FR23: Users can see which channels have new messages since their last visit

### Theming & Identity

- FR24: The application presents a Sorcerer's Apprentice themed experience — adult, mystical, minimalist in tone
- FR25: System messages, errors, and empty states use themed, personality-driven copy

### Administration

- FR26: Instructors can create and pre-populate channels before a cohort starts
- FR27: Instructors can create multiple gallery cards in a batch workflow
- FR28: Instructors can delete or archive channels

## Non-Functional Requirements

### Performance

- Page load (initial) completes within 3 seconds on standard broadband
- Message delivery latency under 500ms end-to-end
- Gallery view renders within 1 second for up to 100 cards
- Search results return within 1 second
- All user-initiated actions (post, react, navigate) respond within 500ms

### Security

- User passwords are hashed and never stored in plaintext
- All data transmitted over HTTPS/WSS
- Authentication tokens expire and can be revoked
- Instructors cannot access other users' passwords
- User-uploaded images are validated and sanitized before storage

### Scalability

- System supports a single cohort of up to 50 concurrent users without degradation
- Message history and gallery cards persist indefinitely (no auto-deletion)
- Single-instance deployment is acceptable for MVP

### Accessibility

- Semantic HTML throughout — headings, landmarks, form labels
- All interactive elements reachable via keyboard navigation
- Sufficient color contrast ratios (WCAG AA for text)
- Alt text on all user-uploaded and system images
- ARIA labels on custom interactive components

### Reliability

- Application recovers gracefully from WebSocket disconnection (auto-reconnect)
- No message loss — messages sent during brief disconnects are delivered on reconnect
- System handles browser refresh without data loss or session expiry
