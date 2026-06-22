import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CityOption } from "@/lib/consultants";

interface ProfileBasicInfoProps {
  fullName: string;
  displayName: string;
  cityId: number | ""; // 🟢 Strictly an ID (number)
  quote: string;
  availableCities: CityOption[];
  onFullNameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  onCityChange: (cityId: number) => void; // 🟢 Strictly returns a number
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
          <Label
            htmlFor="fullName"
            className="text-sm font-medium text-muted-foreground"
          >
            Full Legal Name
          </Label>
          <span className="text-xs text-muted-foreground">
            Private (Not shown to travelers)
          </span>
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
        <Label
          htmlFor="displayName"
          className="text-sm font-medium text-muted-foreground"
        >
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

      {/* 🟢 Strictly typed City Dropdown */}
      <div className="space-y-2 relative">
        <Label
          htmlFor="city"
          className="text-sm font-medium text-muted-foreground"
        >
          Location
        </Label>
        <Select
          // Select requires a string, so we convert the number to string here
          value={cityId ? cityId.toString() : ""}
          onValueChange={(value) => {
            // Parse back to integer before sending up to the parent component
            onCityChange(parseInt(value, 10));
          }}
        >
          <SelectTrigger className="rounded-xl w-full">
            <SelectValue placeholder="Select your city" />
          </SelectTrigger>
          <SelectContent>
            {/* Map over the real DB cities fetched by the parent component */}
            {(availableCities || []).map((option) => (
              <SelectItem key={option.id} value={option.id.toString()}>
                {option.name}, {option.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quote */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label
            htmlFor="quote"
            className="text-sm font-medium text-muted-foreground"
          >
            Tagline
          </Label>
          <span
            className={`text-xs ${quoteLength > maxQuoteLength * 0.9 ? "text-destructive" : "text-muted-foreground"}`}
          >
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