import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ConsultantNotesProps {
  notes: string[];
  onUpdate: (notes: string[]) => void;
}

const ConsultantNotes = ({ notes, onUpdate }: ConsultantNotesProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (newNote.trim()) {
      onUpdate([...notes, newNote.trim()]);
      setNewNote("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddNote();
    } else if (e.key === "Escape") {
      setIsAdding(false);
      setNewNote("");
    }
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border">
      <h3 className="font-medium mb-3 flex items-center gap-2">
        <span className="text-base">📝</span>
        Consultant Notes
      </h3>

      <ul className="space-y-2 mb-3">
        {notes.map((note, index) => (
          <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{note}</span>
          </li>
        ))}
      </ul>

      {isAdding ? (
        <div className="flex gap-2">
          <Input
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note..."
            className="h-8 text-sm"
            autoFocus
          />
          <Button size="sm" className="h-8" onClick={handleAddNote}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => {
              setIsAdding(false);
              setNewNote("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-muted-foreground hover:text-foreground"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add note
        </Button>
      )}
    </div>
  );
};

export default ConsultantNotes;
