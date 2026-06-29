import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const FRANCE_CITIES: { section: string; cities: { id: string; name: string }[] }[] = [
  {
    section: 'Miền Bắc',
    cities: [
      { id: 'paris', name: 'Paris' },
      { id: 'lille', name: 'Lille' },
      { id: 'rouen', name: 'Rouen' },
      { id: 'amiens', name: 'Amiens' },
      { id: 'reims', name: 'Reims' },
      { id: 'caen', name: 'Caen' },
      { id: 'le-havre', name: 'Le Havre' },
      { id: 'metz', name: 'Metz' },
      { id: 'nancy', name: 'Nancy' },
      { id: 'strasbourg', name: 'Strasbourg' },
      { id: 'rennes', name: 'Rennes' },
      { id: 'nantes', name: 'Nantes' },
      { id: 'brest', name: 'Brest' },
      { id: 'le-mans', name: 'Le Mans' },
      { id: 'tours', name: 'Tours' },
      { id: 'orleans', name: 'Orléans' },
      { id: 'dijon', name: 'Dijon' },
    ],
  },
  {
    section: 'Miền Trung',
    cities: [
      { id: 'lyon', name: 'Lyon' },
      { id: 'grenoble', name: 'Grenoble' },
      { id: 'clermont-ferrand', name: 'Clermont-Ferrand' },
      { id: 'saint-etienne', name: 'Saint-Étienne' },
      { id: 'limoges', name: 'Limoges' },
      { id: 'poitiers', name: 'Poitiers' },
      { id: 'bordeaux', name: 'Bordeaux' },
      { id: 'pau', name: 'Pau' },
      { id: 'biarritz', name: 'Biarritz' },
      { id: 'annecy', name: 'Annecy' },
      { id: 'valence', name: 'Valence' },
      { id: 'besancon', name: 'Besançon' },
      { id: 'mulhouse', name: 'Mulhouse' },
    ],
  },
  {
    section: 'Miền Nam',
    cities: [
      { id: 'marseille', name: 'Marseille' },
      { id: 'toulouse', name: 'Toulouse' },
      { id: 'montpellier', name: 'Montpellier' },
      { id: 'nice', name: 'Nice' },
      { id: 'nimes', name: 'Nîmes' },
      { id: 'avignon', name: 'Avignon' },
      { id: 'aix-en-provence', name: 'Aix-en-Provence' },
      { id: 'toulon', name: 'Toulon' },
      { id: 'perpignan', name: 'Perpignan' },
      { id: 'cannes', name: 'Cannes' },
      { id: 'antibes', name: 'Antibes' },
      { id: 'bayonne', name: 'Bayonne' },
      { id: 'montauban', name: 'Montauban' },
    ],
  },
];

interface Props {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  error?: string;
}

export default function FranceCityAutocomplete({
  label = 'Nơi ở',
  value,
  onChange,
  placeholder = 'Chọn thành phố...',
  error,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <span className="text-sm font-medium text-foreground/80">
          {label}
        </span>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between font-normal text-left h-10 px-3 border bg-background ${
              !value ? 'text-muted-foreground' : 'text-foreground'
            } ${error ? 'border-destructive' : 'border-input'}`}
          >
            <span>{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Tìm thành phố..." />
            <CommandList className="max-h-52">
              <CommandEmpty>Không tìm thấy thành phố</CommandEmpty>
              {FRANCE_CITIES.map((group) => (
                <CommandGroup key={group.section} heading={group.section}>
                  {group.cities.map((city) => (
                    <CommandItem
                      key={city.id}
                      value={city.name}
                      onSelect={() => {
                        onChange(value === city.name ? '' : city.name);
                        setOpen(false);
                      }}
                      data-checked={value === city.name}
                    >
                      {city.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

