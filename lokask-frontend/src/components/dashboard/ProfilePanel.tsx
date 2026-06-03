import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Consultant } from "@/types/consultant";
import ProfilePhotoSection from "./profile/ProfilePhotoSection";
import ProfileBasicInfo from "./profile/ProfileBasicInfo";
import ProfileBioSection from "./profile/ProfileBioSection";
import ProfileExpertise from "./profile/ProfileExpertise";
import {
  getNiches,
  uploadConsultantMedia,
  updateConsultantProfile,
  Niche,
} from "@/lib/consultants";

import { getCities, CityOption, uploadAvatar } from "@/lib/users";

export interface ProfileUpdatePayload {
  full_name: string;
  display_name: string;
  city_id: number | "";
  quote: string;
  bio: string;
  main_niche_id: number | "";
  tags: string[];
  languages: string[];

  avatar_url: string;
  cover_url: string;
  gallery_images: string[];
}

interface ProfilePanelProps {
  consultant: Consultant;
  onSaveSuccess?: () => void;
}

interface ProfileFormData {
  fullName: string;
  displayName: string;
  cityId: number | "";
  quote: string;
  bio: string;
  avatar: string;
  coverImage: string;
  galleryImages: string[];
  mainNicheId: number | "";
  tags: string[];
  languages: string[];
}

const ProfilePanel = ({ consultant, onSaveSuccess }: ProfilePanelProps) => {
  const { toast } = useToast();

  const [availableCities, setAvailableCities] = useState<CityOption[]>([]);
  const [availableNiches, setAvailableNiches] = useState<Niche[]>([]);

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: consultant.name || "",
    displayName: consultant.displayName || "",
    cityId: (consultant as Consultant & { cityId?: number }).cityId || "",
    quote: consultant.quote || "",
    bio: consultant.bio || "",
    avatar: consultant.avatarUrl || "",
    coverImage: consultant.coverUrl || "",
    galleryImages: consultant.galleryImages || [],
    mainNicheId:
      (consultant as Consultant & { mainNicheId?: number }).mainNicheId || "",
    tags: consultant.tags || [],
    languages: consultant.languages || [],
  });

  const [initialData, setInitialData] = useState<ProfileFormData>(formData);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [citiesData, nichesData] = await Promise.all([
          getCities(),
          getNiches(),
        ]);
        setAvailableCities(citiesData);
        setAvailableNiches(nichesData);
      } catch (error) {
        console.error("Failed to load dropdown options", error);
        toast({
          title: "Warning",
          description: "Could not load cities and niches from the server.",
          variant: "destructive",
        });
      }
    };

    loadDropdownData();
  }, [toast]);

  useEffect(() => {
    const changed = JSON.stringify(formData) !== JSON.stringify(initialData);
    setHasChanges(changed);
  }, [formData, initialData]);

  const handleSave = async () => {
    try {
      await updateConsultantProfile({
        full_name: formData.fullName,
        display_name: formData.displayName,
        city_id: formData.cityId === "" ? 0 : formData.cityId,
        quote: formData.quote,
        bio: formData.bio,
        main_niche_id: formData.mainNicheId === "" ? 0 : formData.mainNicheId,
        tags: formData.tags,
        language: formData.languages,
      });

      setInitialData(formData);
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved successfully.",
      });

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error: any) {
      console.error("Save failed:", error);
      toast({
        title: "Failed to update profile",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    }
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

  // File Upload Handlers
  const handleAvatarChange = async (file: File) => {
    try {
      const response = await uploadAvatar(file);
      setFormData((prev) => ({ ...prev, avatar: response.avatar_url }));
      toast({ title: "Avatar uploaded successfully!" });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleCoverChange = async (file: File) => {
    const localOptimisticUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, coverImage: localOptimisticUrl }));

    try {
      const response = await uploadConsultantMedia(file, "cover");
      setFormData((prev) => ({ ...prev, coverImage: response.media_url }));
      toast({ title: "Cover updated successfully!" });
    } catch (error) {
      toast({ title: "Cover upload failed", variant: "destructive" });
    }
  };

  const handleGalleryAdd = async (file: File) => {
    const localOptimisticUrl = URL.createObjectURL(file);
    setFormData((prev) => ({
      ...prev,
      galleryImages: [...prev.galleryImages, localOptimisticUrl],
    }));

    try {
      const response = await uploadConsultantMedia(file, "gallery");
      setFormData((prev) => ({
        ...prev,
        galleryImages: prev.galleryImages.map((img) =>
          img === localOptimisticUrl ? response.media_url : img,
        ),
      }));
      toast({ title: "Image added to gallery!" });
    } catch (error) {
      toast({ title: "Gallery upload failed", variant: "destructive" });
      setFormData((prev) => ({
        ...prev,
        galleryImages: prev.galleryImages.filter(
          (img) => img !== localOptimisticUrl,
        ),
      }));
    }
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
          <Button
            variant="outline"
            onClick={handlePreview}
            className="gap-2 rounded-full"
          >
            Preview
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>

        {/* Form Sections */}
        <div className="space-y-8">
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold mb-6">Profile Information</h3>
            <div className="grid md:grid-cols-2 gap-8">
              <ProfilePhotoSection
                avatar={formData.avatar}
                coverImage={formData.coverImage}
                galleryImages={formData.galleryImages}
                onAvatarChange={handleAvatarChange}
                onCoverChange={handleCoverChange}
                onGalleryAdd={handleGalleryAdd}
                onGalleryRemove={handleGalleryRemove}
              />

              <ProfileBasicInfo
                fullName={formData.fullName}
                displayName={formData.displayName}
                cityId={formData.cityId}
                quote={formData.quote}
                availableCities={availableCities}
                onFullNameChange={(fullName) =>
                  setFormData((prev) => ({ ...prev, fullName }))
                }
                onDisplayNameChange={(displayName) =>
                  setFormData((prev) => ({ ...prev, displayName }))
                }
                onCityChange={(cityId) =>
                  setFormData((prev) => ({ ...prev, cityId }))
                }
                onQuoteChange={(quote) =>
                  setFormData((prev) => ({ ...prev, quote }))
                }
              />
            </div>
          </div>

          <ProfileBioSection
            bio={formData.bio}
            onBioChange={(bio) => setFormData((prev) => ({ ...prev, bio }))}
          />

          <ProfileExpertise
            mainNicheId={formData.mainNicheId}
            availableNiches={availableNiches}
            tags={formData.tags}
            languages={formData.languages}
            responseTime={consultant.responseTime || "~2 hours"}
            onMainNicheChange={(mainNicheId) =>
              setFormData((prev) => ({ ...prev, mainNicheId }))
            }
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
