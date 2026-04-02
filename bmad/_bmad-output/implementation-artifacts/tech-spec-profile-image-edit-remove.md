---
title: 'Profile Image Edit & Remove'
slug: 'profile-image-edit-remove'
created: '2026-04-02'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['react-19', 'typescript', 'supabase-js', 'supabase-storage', 'tanstack-query', 'tailwind-v4', 'shadcn-ui', 'canvas-api']
files_to_modify: ['bmad/app/src/features/profile/ProfilePage.tsx', 'bmad/app/src/hooks/useProfile.ts']
code_patterns: ['mutations via useMutation + queryClient.setQueryData for optimistic updates', 'shadcn Avatar with AvatarImage/AvatarFallback/AvatarBadge', 'file upload pattern: supabase.storage.from(bucket).upload(path, file, {upsert})', 'profile state: useState + initialized flag pattern for form defaults']
test_patterns: ['manual browser testing via Playwright MCP']
---

# Tech-Spec: Profile Image Edit & Remove

**Created:** 2026-04-02

## Overview

### Problem Statement

Users can't change or remove their profile avatar from the UI. The backend hooks (useUploadAvatar, useUpdateProfile) and database schema (avatar_url column) already exist, but ProfilePage has no upload or remove UI.

### Solution

Make the avatar clickable with a camera/edit icon overlay on hover. Clicking triggers a file picker. Selected images are resized client-side before uploading to Supabase Storage. Add a "Remove photo" option that deletes the file from storage and nulls avatar_url.

### Scope

**In Scope:**
- Clickable avatar with hover overlay icon (camera/pencil)
- Hidden file input triggered on click
- Client-side image resize before upload (max ~400px, keep aspect ratio)
- Upload to Supabase Storage avatars bucket via existing useUploadAvatar hook
- Remove button that deletes file from storage AND sets avatar_url to null
- Loading state during upload

**Out of Scope:**
- Cropping UI
- Drag-and-drop upload
- Webcam capture
- Avatar selection from presets

## Context for Development

### Codebase Patterns

- Profile hooks in useProfile.ts already have useUploadAvatar (uploads to `avatars/{userId}/avatar.{ext}` with upsert) and useUpdateProfile (updates display_name and/or avatar_url)
- useUpdateProfile accepts optional `avatarUrl` param and uses `queryClient.setQueryData` for instant UI update
- useUploadAvatar returns the public URL string after upload
- ProfilePage uses shadcn Avatar (h-20 w-20) with AvatarImage + AvatarFallback (initials from displayName)
- ProfilePage uses a manual `initialized` state flag pattern to set form defaults from fetched data
- Avatar component supports AvatarBadge (positioned bottom-right, good for camera icon overlay)
- App uses Tailwind CSS v4 with Sorcerer's Apprentice theme (deep purples hue 280, warm amber hue 35)
- File inputs are hidden and triggered via ref.click() pattern (seen in useUploadCardImage in gallery)

### Files to Reference

| File | Purpose |
| ---- | ------- |
| bmad/app/src/features/profile/ProfilePage.tsx | Profile UI, needs avatar upload/remove UI |
| bmad/app/src/hooks/useProfile.ts | useUploadAvatar, useUpdateProfile, useRemoveAvatar (new) |
| bmad/app/src/components/ui/avatar.tsx | shadcn Avatar component with AvatarBadge |

### Technical Decisions

- Resize using Canvas API (no extra dependency needed)
- Max dimension 400px, JPEG output at 0.85 quality for smaller file sizes
- Upsert mode on storage means re-uploading overwrites the old file automatically
- For remove: call supabase.storage.from('avatars').remove([path]) then update profile
- Always upload as avatar.jpeg (consistent path, upsert replaces previous)

## Implementation Plan

### Tasks

- [ ] Task 1: Add `useRemoveAvatar` hook
  - File: `bmad/app/src/hooks/useProfile.ts`
  - Action: Add a new `useRemoveAvatar` mutation that:
    1. Lists files in `avatars/{userId}/` to find the current avatar filename
    2. Calls `supabase.storage.from('avatars').remove([path])` to delete the file
    3. Calls `useUpdateProfile` pattern to set `avatar_url` to null
    4. Invalidates the profile query via `queryClient.setQueryData`
  - Notes: The storage path uses `{userId}/avatar.{ext}` but extension varies. Use list + remove pattern.

- [ ] Task 2: Add `resizeImage` utility function
  - File: `bmad/app/src/features/profile/ProfilePage.tsx` (inline, no separate util file needed)
  - Action: Create an async function that takes a File, draws it to a canvas at max 400px (preserving aspect ratio), and returns a new File as JPEG at 0.85 quality
  - Notes: Uses Canvas API. `canvas.toBlob('image/jpeg', 0.85)` wrapped in a Promise.

- [ ] Task 3: Add avatar upload/remove UI to ProfilePage
  - File: `bmad/app/src/features/profile/ProfilePage.tsx`
  - Action:
    1. Import `useUploadAvatar` and new `useRemoveAvatar` from useProfile
    2. Add a hidden `<input type="file" accept="image/*">` with a ref
    3. Wrap the Avatar in a clickable `<button>` with hover overlay showing a camera icon (use an inline SVG or unicode)
    4. On file select: call resizeImage, then useUploadAvatar, then useUpdateProfile with the returned URL
    5. Show a loading spinner on the avatar during upload (replace AvatarFallback content or overlay)
    6. Add a "Remove photo" text button below the avatar (only visible when avatarUrl exists)
    7. On remove click: call useRemoveAvatar, which deletes from storage and nulls avatar_url
  - Notes: Keep the existing display name form unchanged. Avatar editing is independent of the form submit.

- [ ] Task 4: Ensure avatars storage bucket exists
  - Action: Check via Supabase MCP that the `avatars` bucket exists and is public. Create it if not.
  - Notes: The useUploadAvatar hook already references this bucket. It must exist for uploads to work.

### Acceptance Criteria

- [ ] AC 1: Given a user on the profile page, when they hover over their avatar, then a semi-transparent overlay with a camera icon appears
- [ ] AC 2: Given a user clicks their avatar, when they select an image file, then the image is resized to max 400px and uploaded, and the avatar updates immediately
- [ ] AC 3: Given a user has an avatar set, when they click "Remove photo", then the file is deleted from Supabase Storage and the avatar reverts to initials
- [ ] AC 4: Given a user with no avatar, when viewing the profile page, then no "Remove photo" button is shown
- [ ] AC 5: Given an upload is in progress, when the user sees the avatar area, then a loading indicator is visible
- [ ] AC 6: Given a user selects a very large image (e.g. 4000x3000), when it uploads, then the stored file is resized to max 400px dimension
- [ ] AC 7: Given a user uploads a new avatar to replace an existing one, when the upload completes, then the old file is overwritten (upsert) and the new image displays

## Additional Context

### Dependencies

No new npm packages needed. Canvas API and FileReader are built into browsers.

### Testing Strategy

Manual browser testing via Playwright MCP:
1. Navigate to profile page, verify avatar shows initials (no image)
2. Hover over avatar, verify overlay appears
3. Upload an image, verify it appears as the avatar
4. Reload page, verify avatar persists
5. Click "Remove photo", verify avatar reverts to initials
6. Verify "Remove photo" button is hidden when no avatar is set

### Notes

- The avatars bucket may need to be created in Supabase if it doesn't exist yet. Task 4 handles this.
- Cache busting: Supabase Storage public URLs are stable. After upsert, browsers may cache the old image. Appending a timestamp query param to the URL (`?t=timestamp`) solves this.
- The existing useUploadAvatar hardcodes the extension from the filename. Since we're converting to JPEG via canvas, we should always use `.jpeg` as the extension in the upload path.
