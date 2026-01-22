import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ProfileBioSectionProps {
  bio: string;
  onBioChange: (value: string) => void;
}

const ProfileBioSection = ({ bio, onBioChange }: ProfileBioSectionProps) => {
  const bioLength = bio.length;
  const maxBioLength = 500;

  return (
    <div className="bg-card rounded-2xl p-6 border border-border">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">About Me</h3>
        <span className={`text-xs ${bioLength > maxBioLength * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
          {bioLength}/{maxBioLength}
        </span>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bio" className="sr-only">
          Bio
        </Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Tell travelers about yourself, your expertise, and why you love your city..."
          className="min-h-[150px] rounded-xl resize-none"
          maxLength={maxBioLength}
        />
      </div>
    </div>
  );
};

export default ProfileBioSection;
