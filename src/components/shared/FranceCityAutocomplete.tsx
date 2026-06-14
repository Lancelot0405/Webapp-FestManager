import type { Key } from '@heroui/react';
import { Autocomplete, EmptyState, Header, Label, ListBox, SearchField, Separator, useFilter } from '@heroui/react';

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

export default function FranceCityAutocomplete({ label = 'Nơi ở', value, onChange, placeholder = 'Chọn thành phố...', error }: Props) {
  const { contains } = useFilter({ sensitivity: 'base' });

  const selectedKey: Key | null = (() => {
    for (const group of FRANCE_CITIES) {
      const match = group.cities.find(c => c.name === value);
      if (match) return match.id;
    }
    return null;
  })();

  const handleChange = (key: Key | null) => {
    if (!key) { onChange(''); return; }
    for (const group of FRANCE_CITIES) {
      const match = group.cities.find(c => c.id === key);
      if (match) { onChange(match.name); return; }
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Autocomplete
        className="w-full"
        placeholder={placeholder}
        selectionMode="single"
        selectedKey={selectedKey}
        onSelectionChange={handleChange}
      >
        <Label className="text-xs font-medium text-foreground/80">{label}</Label>
        <Autocomplete.Trigger>
          <Autocomplete.Value />
          <Autocomplete.ClearButton />
          <Autocomplete.Indicator />
        </Autocomplete.Trigger>
        <Autocomplete.Popover>
          <Autocomplete.Filter filter={contains}>
            <SearchField autoFocus name="city-search" variant="secondary">
              <SearchField.Group>
                <SearchField.SearchIcon />
                <SearchField.Input placeholder="Tìm thành phố..." />
                <SearchField.ClearButton />
              </SearchField.Group>
            </SearchField>
            <ListBox renderEmptyState={() => <EmptyState>Không tìm thấy thành phố</EmptyState>}>
              {FRANCE_CITIES.map((group, i) => (
                <>
                  <ListBox.Section key={group.section}>
                    <Header>{group.section}</Header>
                    {group.cities.map(city => (
                      <ListBox.Item key={city.id} id={city.id} textValue={city.name}>
                        {city.name}
                        <ListBox.ItemIndicator />
                      </ListBox.Item>
                    ))}
                  </ListBox.Section>
                  {i < FRANCE_CITIES.length - 1 && <Separator key={`sep-${i}`} />}
                </>
              ))}
            </ListBox>
          </Autocomplete.Filter>
        </Autocomplete.Popover>
      </Autocomplete>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
