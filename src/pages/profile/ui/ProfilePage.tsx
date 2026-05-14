import { useAuth } from '@/features/auth/model/AuthContext';
import { ProfileForm } from '@/widgets/profile/ui/ProfileForm';

export default function ProfilePage() {
  const { session } = useAuth();

  return <ProfileForm user={session} />;
}
