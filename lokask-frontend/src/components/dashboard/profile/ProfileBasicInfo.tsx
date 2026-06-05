import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the shape of the city data coming from your Go backend
interface CityOption {
  id: number;
  name: string;
  country: string;
}

interface ProfileBasicInfoProps {
  fullName: string;      // Maps to users.full_name
  displayName: string;   // Maps to users.alias
  cityId: number | "";   // Maps to consultants.city_id
  quote: string;         // Maps to consultants.quote
  availableCities: CityOption[]; // Fetched dynamically from the database
  onFullNameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onCityChange: (cityId: number) => void;
  onQuoteChange: (value: string) => void;
}

const ProfileBasicInfo = ({
  fullName,
  displayName,
  cityId,
  quote,
  availableCities,
  onFullNameChange,
  onDisplayNameChange,
  onCityChange,
  onQuoteChange,
}: ProfileBasicInfoProps) => {
  const quoteLength = quote.length;
  const maxQuoteLength = 100;

  return (
    <div className="space-y-5">
      {/* Full Legal Name (users.full_name) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="fullName" className="text-sm font-medium text-muted-foreground">
            Full Legal Name
          </Label>
          <span className="text-xs text-muted-foreground">Private (Not shown to travelers)</span>
        </div>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          placeholder="Your full legal name"
          className="rounded-xl"
          maxLength={100} // Matches your varchar(100)
        />
      </div>

      {/* Display Name (users.alias) */}
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-sm font-medium text-muted-foreground">
          Public Display Name
        </Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          placeholder="How travelers will see you"
          className="rounded-xl"
          maxLength={50} // Matches your varchar(50)
        />
      </div>

      {/* City (consultants.city_id) */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-medium text-muted-foreground">
          Location
        </Label>
        <Select
          // Convert integer to string for the Select component
          value={cityId ? cityId.toString() : ""}
          onValueChange={(value) => {
            // Parse back to integer when the user selects an option
            onCityChange(parseInt(value, 10));
          }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select your city" />
          </SelectTrigger>
          <SelectContent>
            {/* Dynamically render the actual cities from your database */}
            {(availableCities || []).map((option) => (
              <SelectItem key={option.id} value={option.id.toString()}>
                {option.name}, {option.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quote (consultants.quote) */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="quote" className="text-sm font-medium text-muted-foreground">
            Tagline
          </Label>
          <span className={`text-xs ${quoteLength > maxQuoteLength * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {quoteLength}/{maxQuoteLength}
          </span>
        </div>
        <Input
          id="quote"
          value={quote}
          onChange={(e) => onQuoteChange(e.target.value)}
          placeholder="A short tagline about what you offer..."
          className="rounded-xl"
          maxLength={maxQuoteLength}
        />
      </div>
    </div>
  );
};

export default ProfileBasicInfo;