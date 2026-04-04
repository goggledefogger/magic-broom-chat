import { useState, useRef, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile, useUploadAvatar, useRemoveAvatar } from '@/hooks/useProfile'

async function resizeImage(file: File, maxDim = 400): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('Failed to resize image'))
          resolve(new File([blob], 'avatar.jpeg', { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.85
      )
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile(user?.id)
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const removeAvatar = useRemoveAvatar()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [saved, setSaved] = useState(false)

  const isUploading = uploadAvatar.isPending || removeAvatar.isPending

  if (profile?.displayName && !initialized) {
    setDisplayName(profile.displayName)
    setInitialized(true)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return

    await updateProfile.mutateAsync({
      userId: user.id,
      displayName: displayName.trim(),
    })

    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    e.target.value = ''

    const resized = await resizeImage(file)
    const publicUrl = await uploadAvatar.mutateAsync({ userId: user.id, file: resized })
    await updateProfile.mutateAsync({ userId: user.id, avatarUrl: publicUrl })
  }

  const handleRemoveAvatar = async () => {
    if (!user) return
    await removeAvatar.mutateAsync({ userId: user.id })
  }

  const initials = (profile?.displayName ?? user?.email ?? '?')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">Loading your profile...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center p-4">
      <div className="card-elevated w-full max-w-sm rounded border border-border bg-card">
        <div className="flex flex-col items-center gap-2 px-6 pt-6 pb-2 text-center">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="group relative rounded-full ring-2 ring-primary/20 ring-offset-2 ring-offset-background focus:outline-none focus-visible:ring-primary/50"
          >
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-muted text-lg text-muted-foreground">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 transition-colors group-hover:bg-black/40">
              {isUploading ? (
                <svg className="h-6 w-6 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          {profile?.avatarUrl && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={isUploading}
              className="text-xs text-muted-foreground transition-colors hover:text-destructive"
            >
              Remove photo
            </button>
          )}
          <h1 className="font-heading text-3xl font-semibold text-[oklch(0.40_0.08_280)]">Your Profile</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 px-6 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="What shall we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-background/50 border-border/50 focus:border-primary/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Role</Label>
              <p className="text-sm capitalize text-foreground/80">{profile?.role ?? 'student'}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 px-6 pb-6">
            <Button
              type="submit"
              className="w-full"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending
                ? 'Saving...'
                : saved
                  ? 'Saved!'
                  : 'Update Profile'}
            </Button>
            <Link
              to="/channels"
              className="text-center text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Back to channels
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
