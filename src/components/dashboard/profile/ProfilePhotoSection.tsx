import { useRef } from "react";
import { Camera, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";

interface ProfilePhotoSectionProps {
  avatar: string;
  coverImage: string;
  galleryImages: string[];
  onAvatarChange: (file: File) => void;
  onCoverChange: (file: File) => void;
  onGalleryAdd: (file: File) => void;
  onGalleryRemove: (index: number) => void;
}

const ProfilePhotoSection = ({
  avatar,
  coverImage,
  galleryImages,
  onAvatarChange,
  onCoverChange,
  onGalleryAdd,
  onGalleryRemove,
}: ProfilePhotoSectionProps) => {
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (file: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      callback(file);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Avatar */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Profile Photo
        </Label>
        <div className="flex items-center gap-4">
          <div
            className="relative w-24 h-24 rounded-full overflow-hidden bg-muted cursor-pointer group"
            onClick={() => avatarInputRef.current?.click()}
          >
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Camera className="h-6 w-6 text-white" />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Click to upload a new photo</p>
            <p className="text-xs">Recommended: Square image, at least 400x400px</p>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e, onAvatarChange)}
          />
        </div>
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Cover Image
        </Label>
        <div
          className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-muted cursor-pointer group"
          onClick={() => coverInputRef.current?.click()}
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-8 w-8 text-white" />
          </div>
        </div>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, onCoverChange)}
        />
      </div>

      {/* Gallery */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          Gallery ({galleryImages.length}/6)
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {galleryImages.map((image, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-xl overflow-hidden bg-muted group"
            >
              <img
                src={image}
                alt={`Gallery ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onGalleryRemove(index)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
          {galleryImages.length < 6 && (
            <div
              className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
              onClick={() => galleryInputRef.current?.click()}
            >
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileChange(e, onGalleryAdd)}
        />
      </div>
    </div>
  );
};

export default ProfilePhotoSection;
