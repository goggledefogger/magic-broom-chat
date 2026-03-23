import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, useUpdateProfile } from '@/hooks/useProfile'

export function ProfilePage() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile(user?.id)
  const updateProfile = useUpdateProfile()
  const [displayName, setDisplayName] = useState('')
  const [initialized, setInitialized] = useState(false)
  const [saved, setSaved] = useState(false)

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
          <div className="flex justify-center">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-2xl">Your Profile</CardTitle>
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
              <p className="text-sm capitalize">{profile?.role ?? 'student'}</p>
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
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Back to channels
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
