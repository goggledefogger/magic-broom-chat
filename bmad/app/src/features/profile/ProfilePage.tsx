import { useState, useRef, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
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
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="group relative rounded-full p-[3px] bg-gradient-to-br from-[#54548E] to-[#2DA3CB] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
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
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Remove photo
              </button>
            )}
          </div>
          <CardTitle className="font-heading text-2xl">Your Profile</CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="What shall we call you?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Role</Label>
              <p className="text-sm capitalize text-accent">{profile?.role ?? 'student'}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
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
              className="text-sm text-accent hover:text-accent/80"
            >
              Back to channels
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
