import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
}

const TagInput = ({ tags, onChange, placeholder = "Add new...", maxTags = 5 }: TagInputProps) => {
  const [inputValue, setInputValue] = useState("");

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed) && tags.length < maxTags) {
      onChange([...tags, trimmed]);
      setInputValue("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 p-3 border border-border rounded-xl bg-background min-h-[48px] focus-within:ring-2 focus-within:ring-primary/20">
      {tags.map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-2 hover:text-primary/70 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {tags.length < maxTags && (
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(inputValue)}
          placeholder={placeholder}
          className="flex-1 min-w-[120px] border-0 p-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
        />
      )}
    </div>
  );
};

export default TagInput;
