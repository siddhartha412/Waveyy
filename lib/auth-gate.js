import { toast } from "sonner";

export function requireAuthToPlay(user) {
  if (user) return true;
  toast.error("Please log in to play music");
  return false;
}
