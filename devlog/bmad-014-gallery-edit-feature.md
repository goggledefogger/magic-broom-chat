# 2026-04-22 — Gallery Edit Feature with RLS

## The Problem
Users needed the ability to edit gallery cards they had previously posted in gallery channels. This required an interface to modify the fields (title, description, image, link) and backend security to ensure only the original author could perform the edit.

## The Solution
1. **Database & Row Level Security (RLS)**: 
   - Added a new `UPDATE` policy (`gallery_cards_update_owner`) on the `gallery_cards` table in Supabase. This policy enforces that `user_id = auth.uid()`, preventing unauthorized edits.
   - **Storage Bucket**: Created a new `gallery-images` public storage bucket to handle direct uploads.
   - **Storage RLS**: Added strict policies ensuring that authenticated users can only insert, update, and delete images within a folder matching their `userId` (`auth.uid()::text = (storage.foldername(name))[1]`).

2. **Frontend UX (Drag-and-Drop & Paste)**: 
   - Replaced the simple URL input with a robust drag-and-drop area.
   - Added an event listener to intercept `paste` events, allowing users to paste images directly from their clipboard into the modal.
   - Handled loading states and direct upload execution via `useUploadCardImage`.

3. **Frontend Mutation Hook**: 
   - Created `useUpdateGalleryCard` in `useGalleryCards.ts` using React Query to submit updates and invalidate relevant caches upon success.
   - Integrated the existing `useUploadCardImage` to push files to the new bucket.

## Deployment & CI Fixes
1. **GitHub Actions**: Introduced a `.github/workflows/ci.yml` pipeline that triggers on `main` pushes and PRs, ensuring `npm run build` passes before any merges.
2. **Vercel Root Directory Fix**: 
   - We discovered Vercel builds were failing with `vite: command not found` because Vercel was executing in the repository root rather than `bmad/app`.
   - Used the Vercel REST API to administratively patch the project's `rootDirectory` configuration to `bmad/app`, restoring reliable, green automatic deployments from `main`.
