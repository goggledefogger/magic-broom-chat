-- Coalesce display_name across OAuth provider metadata fields on new user signup.
--
-- Email signup writes raw_user_meta_data->>'display_name' from the form.
-- GitHub OAuth populates 'full_name', 'name', 'user_name', and 'preferred_username'
-- but never 'display_name' — so without this coalesce, GitHub users land with
-- NULL display_name and show as "Unknown Apprentice" until they edit /profile.
-- Also captures avatar_url if the provider supplied one, so GitHub users show
-- up with their existing photo without a manual upload.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'user_name',
      NEW.raw_user_meta_data->>'preferred_username'
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
