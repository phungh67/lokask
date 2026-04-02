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

// 🟢 Define the shape of the niche data matching your Go backend /niches endpoint
export interface NicheOption {
  id: number;
  display_name: string;
}

interface ProfileExpertiseProps {
  mainNicheId: number | "";        // 🟢 Replaces the old string mainTag
  availableNiches: NicheOption[];  // 🟢 Replaces the hardcoded mainTagOptions
  tags: string[];                  // Maps to your postgres text[]
  languages: string[];             // Maps to your postgres text[]
  responseTime: string;            // Maps to your varchar
  
  onMainNicheChange: (id: number) => void;
  onTagsChange: (tags: string[]) => void;
  onLanguagesChange: (languages: string[]) => void;
}

const ProfileExpertise = ({
  mainNicheId,
  availableNiches,
  tags,
  languages,
  responseTime,
  onMainNicheChange,
  onTagsChange,
  onLanguagesChange,
}: ProfileExpertiseProps) => {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border space-y-6">
      <h3 className="text-lg font-semibold">Expertise & Details</h3>

      {/* Main Expertise (Niche ID) */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Main Expertise
        </Label>
        <Select 
          // 🟢 Convert integer ID to string for the Select component
          value={mainNicheId ? mainNicheId.toString() : ""} 
          onValueChange={(value) => onMainNicheChange(parseInt(value, 10))}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select your main expertise" />
          </SelectTrigger>
          <SelectContent>
            {/* 🟢 Safely map over the database-driven array */}
            {(availableNiches || []).map((niche) => (
              <SelectItem key={niche.id} value={niche.id.toString()}>
                {niche.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Hashtags (consultants.tags array) */}
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

      {/* Languages (consultants.languages text[] array) */}
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