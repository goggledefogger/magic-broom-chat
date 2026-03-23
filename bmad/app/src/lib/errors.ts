const THEMED_ERRORS: Record<string, string> = {
  'Invalid login credentials': 'The enchantment failed — check your email and password.',
  'User already registered': 'This apprentice has already been registered.',
  'Email not confirmed': 'Your invitation scroll has not been confirmed yet. Check your email.',
  'Password should be at least 6 characters': 'A proper incantation requires at least 6 characters.',
}

export function handleSupabaseError(error: { message: string; code?: string }): string {
  return THEMED_ERRORS[error.message] ?? error.message ?? 'An unexpected disturbance in the workshop.'
}
