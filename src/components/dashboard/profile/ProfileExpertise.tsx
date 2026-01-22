import { Lock } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import TagInput from "./TagInput";

interface ProfileExpertiseProps {
  mainTag: string;
  tags: string[];
  languages: string[];
  responseTime: string;
  onMainTagChange: (value: string) => void;
  onTagsChange: (tags: string[]) => void;
  onLanguagesChange: (languages: string[]) => void;
}

const mainTagOptions = [
  "Food & Neighborhoods",
  "History & Art",
  "Nightlife & Entertainment",
  "Adventure & Nature",
  "Shopping & Fashion",
  "Family Activities",
  "Photography Spots",
  "Local Culture",
];

const ProfileExpertise = ({
  mainTag,
  tags,
  languages,
  responseTime,
  onMainTagChange,
  onTagsChange,
  onLanguagesChange,
}: ProfileExpertiseProps) => {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
      <h3 className="text-lg font-semibold">Expertise & Details</h3>

      {/* Main Tag */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Main Expertise
        </Label>
        <Select value={mainTag} onValueChange={onMainTagChange}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select your main expertise" />
          </SelectTrigger>
          <SelectContent>
            {mainTagOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Hashtags
        </Label>
        <TagInput
          tags={tags}
          onChange={onTagsChange}
          placeholder="Add hashtag..."
          maxTags={5}
        />
        <p className="text-xs text-muted-foreground">
          Add up to 5 hashtags that describe your expertise
        </p>
      </div>

      {/* Languages */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Languages
        </Label>
        <TagInput
          tags={languages}
          onChange={onLanguagesChange}
          placeholder="Add language..."
          maxTags={5}
        />
      </div>

      {/* Response Time - Read Only */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium text-muted-foreground">
            Response Time
          </Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Lock className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Calculated from your average response time</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="px-4 py-3 bg-muted/50 rounded-xl text-sm text-muted-foreground">
          {responseTime || "Not enough data yet"}
        </div>
      </div>
    </div>
  );
};

export default ProfileExpertise;
