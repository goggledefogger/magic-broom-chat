# 2026-04-22 — Gallery Edit Feature with RLS

## The Problem
Users needed the ability to edit gallery cards they had previously posted in gallery channels. This required an interface to modify the fields (title, description, image, link) and backend security to ensure only the original author could perform the edit.

## The Solution
1. **Row Level Security (RLS)**: Added a new `UPDATE` policy (`gallery_cards_update_owner`) on the `gallery_cards` table in Supabase. This policy enforces that `user_id = auth.uid()`, preventing unauthorized edits.
2. **Frontend Mutation Hook**: Created `useUpdateGalleryCard` in `useGalleryCards.ts` using React Query to submit updates and invalidate relevant caches upon success.
3. **UI Integration**: Added an "Edit Card" button on `GalleryCardDetail` that is visible exclusively to the author. Clicking the button opens a pre-filled dialog modal for editing the card's details.

## Deployment Note
The automatic Vercel deployment integration from the `main` branch was noted as broken (requiring a Vercel dashboard re-authentication). The code was pushed to `main` so that once the GitHub integration is re-linked, the changes will deploy.
