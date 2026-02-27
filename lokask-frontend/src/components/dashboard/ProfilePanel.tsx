import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Consultant } from "@/types/consultant";
import ProfilePhotoSection from "./profile/ProfilePhotoSection";
import ProfileBasicInfo from "./profile/ProfileBasicInfo";
import ProfileBioSection from "./profile/ProfileBioSection";
import ProfileExpertise from "./profile/ProfileExpertise";

interface ProfilePanelProps {
  consultant: Consultant;
  onSave: (updates: Partial<Consultant>) => void;
}

interface ProfileFormData {
  name: string;
  city: string;
  country: string;
  quote: string;
  bio: string;
  avatar: string;
  coverImage: string;
  galleryImages: string[];
  mainTag: string;
  tags: string[];
  languages: string[];
}

const ProfilePanel = ({ consultant, onSave }: ProfilePanelProps) => {
  const { toast } = useToast();
  
  // Map the real backend keys (avatarUrl, coverUrl, tag) to the form data
  const [formData, setFormData] = useState<ProfileFormData>({
    name: consultant.name || "",
    city: consultant.city || "",
    country: consultant.country || "",
    quote: consultant.quote || "",
    bio: consultant.bio || "",
    avatar: consultant.avatarUrl || "",
    coverImage: consultant.coverUrl || "",
    galleryImages: consultant.galleryImages || [],
    mainTag: consultant.tag || "",
    tags: consultant.tags || [],
    languages: consultant.languages || [],
  });

  const [initialData, setInitialData] = useState<ProfileFormData>(formData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [formData, initialData]);

  const handleSave = () => {
    // Map the form data back to the database keys when saving
    onSave({
      name: formData.name,
      city: formData.city,
      country: formData.country,
      quote: formData.quote,
      bio: formData.bio,
      avatarUrl: formData.avatar, 
      coverUrl: formData.coverImage,
      galleryImages: formData.galleryImages,
      tag: formData.mainTag,
      tags: formData.tags,
      languages: formData.languages,
    });
    setInitialData(formData);
    toast({
      title: "Profile updated!",
      description: "Your changes have been saved successfully.",
    });
  };

  const handleDiscard = () => {
    setFormData(initialData);
    toast({
      title: "Changes discarded",
      description: "Your profile has been reset to the last saved version.",
    });
  };

  const handlePreview = () => {
    window.open(`/consultant/${consultant.id}`, "_blank");
  };

  // File upload handlers (create object URLs for preview)
  const handleAvatarChange = (file: File) => {
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, avatar: url }));
  };

  const handleCoverChange = (file: File) => {
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverImage: url }));
  };

  const handleGalleryAdd = (file: File) => {
    const url = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, url],
    }));
  };

  const handleGalleryRemove = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="flex-1 bg-secondary/20 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Edit your profile</h1>
            <p className="text-muted-foreground mt-1">
              Update your public profile information
            </p>
          </div>
          <Button variant="outline" onClick={handlePreview} className="gap-2 rounded-full">
            Preview
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          {/* Photos + Basic Info */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-6">Profile Information</h3>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Photos */}
              <ProfilePhotoSection
                avatar={formData.avatar}
                coverImage={formData.coverImage}
                galleryImages={formData.galleryImages}
                onAvatarChange={handleAvatarChange}
                onCoverChange={handleCoverChange}
                onGalleryAdd={handleGalleryAdd}
                onGalleryRemove={handleGalleryRemove}
              />

              {/* Basic Info */}
              <ProfileBasicInfo
                name={formData.name}
                city={formData.city}
                country={formData.country}
                quote={formData.quote}
                onNameChange={(name) => setFormData((prev) => ({ ...prev, name }))}
                onCityChange={(city, country) =>
                  setFormData((prev) => ({ ...prev, city, country }))
                }
                onQuoteChange={(quote) => setFormData((prev) => ({ ...prev, quote }))}
              />
            </div>
          </div>

          {/* Bio */}
          <ProfileBioSection
            bio={formData.bio}
            onBioChange={(bio) => setFormData((prev) => ({ ...prev, bio }))}
          />

          {/* Expertise */}
          <ProfileExpertise
            mainTag={formData.mainTag}
            tags={formData.tags}
            languages={formData.languages}
            responseTime={consultant.responseTime || "~2 hours"}
            onMainTagChange={(mainTag) => setFormData((prev) => ({ ...prev, mainTag }))}
            onTagsChange={(tags) => setFormData((prev) => ({ ...prev, tags }))}
            onLanguagesChange={(languages) =>
              setFormData((prev) => ({ ...prev, languages }))
            }
          />

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
            <Button
              variant="ghost"
              onClick={handleDiscard}
              disabled={!hasChanges}
              className="rounded-full"
            >
              Discard
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="rounded-full px-8"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePanel;