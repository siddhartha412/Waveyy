import { toast } from "sonner";

export function requireAuthToPlay(user) {
  // Allowing guest playback
  return true;
}
