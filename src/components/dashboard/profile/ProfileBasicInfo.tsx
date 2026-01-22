import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProfileBasicInfoProps {
  name: string;
  city: string;
  country: string;
  quote: string;
  onNameChange: (value: string) => void;
  onCityChange: (city: string, country: string) => void;
  onQuoteChange: (value: string) => void;
}

const cityOptions = [
  { city: "Rome", country: "Italy" },
  { city: "Paris", country: "France" },
  { city: "Tokyo", country: "Japan" },
  { city: "Bangkok", country: "Thailand" },
  { city: "Barcelona", country: "Spain" },
  { city: "London", country: "UK" },
  { city: "New York", country: "USA" },
  { city: "Amsterdam", country: "Netherlands" },
];

const ProfileBasicInfo = ({
  name,
  city,
  country,
  quote,
  onNameChange,
  onCityChange,
  onQuoteChange,
}: ProfileBasicInfoProps) => {
  const quoteLength = quote.length;
  const maxQuoteLength = 100;

  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-muted-foreground">
          Display Name
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Your name"
          className="rounded-xl"
          maxLength={50}
        />
      </div>

      {/* City */}
      <div className="space-y-2">
        <Label htmlFor="city" className="text-sm font-medium text-muted-foreground">
          Location
        </Label>
        <Select
          value={`${city}, ${country}`}
          onValueChange={(value) => {
            const option = cityOptions.find((o) => `${o.city}, ${o.country}` === value);
            if (option) {
              onCityChange(option.city, option.country);
            }
          }}
        >
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select your city" />
          </SelectTrigger>
          <SelectContent>
            {cityOptions.map((option) => (
              <SelectItem key={`${option.city}-${option.country}`} value={`${option.city}, ${option.country}`}>
                {option.city}, {option.country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quote */}
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
