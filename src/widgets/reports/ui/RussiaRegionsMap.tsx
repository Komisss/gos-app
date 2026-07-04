import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

import type { Region } from '@/entities/region/model/types';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { ScrollArea } from '@/shared/ui/scroll-area';

type RussiaMapGeography = {
  rsmKey: string;
  properties: {
    name?: string;
    name_latin?: string;
  };
};

type RussiaRegionsMapProps = {
  regions: Region[];
  onRegionClick?: (region: Region) => void;
};

type MapTooltipState = {
  x: number;
  y: number;
  name: string;
  externalCode: number | null;
};

const RUSSIA_REGIONS_GEOJSON_URL = '/maps/russia-regions.geojson';
const MAX_REGION_EXTERNAL_CODE = 1500;
const REGION_EXTERNAL_CODE_STEP = 100;

export function RussiaRegionsMap({
  regions,
  onRegionClick,
}: RussiaRegionsMapProps) {
  const [tooltip, setTooltip] = useState<MapTooltipState | null>(null);
  const regionByName = useMemo(() => {
    const map = new Map<string, Region>();

    regions.forEach((region) => {
      getRegionNameKeys(region.name).forEach((key) => {
        map.set(key, region);
      });
    });

    return map;
  }, [regions]);

  function getRegionByGeography(geo: RussiaMapGeography) {
    const name = geo.properties.name ?? '';
    const keys = getRegionNameKeys(name);

    for (const key of keys) {
      const region = regionByName.get(key);

      if (region) {
        return region;
      }
    }

    return null;
  }

  function toggleRegion(region: Region | null) {
    if (!region) {
      return;
    }

    onRegionClick?.(region);
  }

  function showTooltip(event: React.MouseEvent<SVGPathElement>, region: Region | null, fallbackName: string) {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();

    setTooltip({
      x: bounds ? event.clientX - bounds.left : event.clientX,
      y: bounds ? event.clientY - bounds.top : event.clientY,
      name: region?.name ?? fallbackName,
      externalCode: region?.externalCode ?? null,
    });
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold !text-slate-900">Карта России</h2>
        </div>
      </div>

      <div
        className="relative mt-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50"
        onMouseLeave={() => setTooltip(null)}
      >
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [95, 67],
            rotate: [-20, 0, 0],
            scale: 250,
          }}
          width={1040}
          height={540}
          className="h-[360px] w-full sm:h-[460px]"
        >
          <ZoomableGroup
            zoom={1}
            minZoom={1}
            maxZoom={8}
            translateExtent={[
              [-160, -90],
              [1200, 630],
            ]}
          >
            <Geographies geography={RUSSIA_REGIONS_GEOJSON_URL}>
              {({ geographies }: { geographies: RussiaMapGeography[] }) =>
                geographies.map((geo) => {
                  const region = getRegionByGeography(geo);
                  const regionName = region?.name ?? geo.properties.name ?? 'Регион';
                  const defaultFill = getRegionFill(region);
                  const hoverFill = getRegionHoverFill(region);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      role={region ? 'button' : 'img'}
                      tabIndex={region ? 0 : -1}
                      aria-label={regionName}
                      onClick={() => toggleRegion(region)}
                      onMouseEnter={(event) => showTooltip(event, region, regionName)}
                      onMouseMove={(event) => showTooltip(event, region, regionName)}
                      onMouseLeave={() => setTooltip(null)}
                      onFocus={() =>
                        setTooltip({
                          x: 16,
                          y: 16,
                          name: regionName,
                          externalCode: region?.externalCode ?? null,
                        })
                      }
                      onBlur={() => setTooltip(null)}
                      onKeyDown={(event) => {
                        if (region && (event.key === 'Enter' || event.key === ' ')) {
                          event.preventDefault();
                          toggleRegion(region);
                        }
                      }}
                      style={{
                        default: {
                          fill: defaultFill,
                          stroke: '#ffffff',
                          strokeWidth: 0.7,
                          outline: 'none',
                          cursor: region ? 'pointer' : 'default',
                        },
                        hover: {
                          fill: hoverFill,
                          stroke: '#ffffff',
                          strokeWidth: 0.7,
                          outline: 'none',
                          cursor: region ? 'pointer' : 'default',
                        },
                        pressed: {
                          fill: hoverFill,
                          stroke: '#ffffff',
                          strokeWidth: 0.7,
                          outline: 'none',
                        },
                      }}
                    >
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 max-w-64 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-lg"
            style={{
              left: `min(${tooltip.x + 12}px, calc(100% - 16rem))`,
              top: Math.max(tooltip.y - 12, 12),
            }}
          >
            <div className="font-semibold text-slate-900">{tooltip.name}</div>
            <div className="mt-1 text-xs text-slate-500">
              КПЭ: <span className="font-medium text-slate-700">{formatExternalCode(tooltip.externalCode)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 max-w-xl">
        <RegionSelectPopover regions={regions} onSelect={(region) => onRegionClick?.(region)} />
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-emerald-100" />
          Низкий КПЭ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-emerald-600" />
          Высокий КПЭ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-slate-200" />
          Не сопоставлен со справочником
        </span>
      </div>
    </section>
  );
}

function RegionSelectPopover({
  regions,
  onSelect,
}: {
  regions: Region[];
  onSelect: (region: Region) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const filteredRegions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const sortedRegions = [...regions].sort((left, right) => left.name.localeCompare(right.name, 'ru'));

    if (!normalizedQuery) {
      return sortedRegions;
    }

    return sortedRegions.filter((region) =>
      `${region.name} ${region.code} ${formatExternalCode(region.externalCode)}`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [query, regions]);

  function handleSelect(region: Region) {
    onSelect(region);
    setOpen(false);
    setQuery('');
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="min-h-10 w-full justify-between gap-2 border-slate-200 bg-white text-left font-normal"
        >
          <span className="min-w-0 truncate text-slate-500">Выберите регион</span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(560px,calc(100vw-3rem))] p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="h-9 border-slate-200 pl-9"
            placeholder="Поиск региона"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <ScrollArea className="mt-3 h-72 rounded-md border border-slate-200">
          <div className="p-1">
            {filteredRegions.length === 0 ? (
              <div className="px-3 py-8 text-center text-sm text-slate-500">
                Ничего не найдено.
              </div>
            ) : (
              filteredRegions.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-slate-100"
                  onClick={() => handleSelect(region)}
                >
                  <Check className="mt-0.5 size-4 text-[#465cd3] opacity-0" />
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-900">{region.name}</span>
                    <span className="block text-xs text-slate-500">
                      Код: {region.code || 'Не указан'} • КПЭ: {formatExternalCode(region.externalCode)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function getRegionFill(region: Region | null) {
  if (!region) {
    return '#e5e7eb';
  }

  return getGreenScaleColor(region.externalCode);
}

function getRegionHoverFill(region: Region | null) {
  if (!region) {
    return '#d1d5db';
  }

  return getGreenScaleColor(region.externalCode, 0.12);
}

function formatExternalCode(value: number | null) {
  return value === null ? 'Нет данных' : new Intl.NumberFormat('ru-RU').format(value);
}

function getGreenScaleColor(value: number | null, boost = 0) {
  if (value === null || !Number.isFinite(value)) {
    return '#dcfce7';
  }

  const steppedValue =
    Math.floor(Math.min(Math.max(value, 0), MAX_REGION_EXTERNAL_CODE) / REGION_EXTERNAL_CODE_STEP) *
    REGION_EXTERNAL_CODE_STEP;
  const ratio = Math.min(Math.max(steppedValue / MAX_REGION_EXTERNAL_CODE, 0), 1);
  const lightness = 92 - (ratio + boost) * 48;

  return `hsl(145 68% ${Math.max(35, lightness)}%)`;
}

function getRegionNameKeys(name: string) {
  const normalizedName = normalizeRegionName(name);
  const keys = new Set([normalizedName]);

  const aliases: Record<string, string[]> = {
    адыгея: ['республика адыгея'],
    алтай: ['республика алтай'],
    башкортостан: ['республика башкортостан'],
    бурятия: ['республика бурятия'],
    дагестан: ['республика дагестан'],
    ингушетия: ['республика ингушетия'],
    калмыкия: ['республика калмыкия'],
    карелия: ['республика карелия'],
    кемеровская: ['кемеровская кузбасс'],
    коми: ['республика коми'],
    'марий эл': ['республика марий эл'],
    мордовия: ['республика мордовия'],
    'саха якутия': ['якутия', 'республика саха', 'республика саха якутия'],
    'северная осетия алания': ['северная осетия', 'республика северная осетия алания'],
    татарстан: ['республика татарстан'],
    тыва: ['тува', 'республика тыва', 'республика тува'],
    удмуртская: ['удмуртия', 'удмуртская республика'],
    хакасия: ['республика хакасия'],
    чеченская: ['чечня', 'чеченская республика'],
    чувашская: ['чувашия', 'чувашская республика'],
    'кабардино балкарская': ['кабардино балкария'],
    'карачаево черкесская': ['карачаево черкесия'],
    'ханты мансийский': ['ханты мансийский югра'],
    'ямало ненецкий': ['ямало ненецкий автономный округ'],
  };

  Object.entries(aliases).forEach(([key, values]) => {
    if (normalizedName === key || values.map(normalizeRegionName).includes(normalizedName)) {
      keys.add(key);
      values.forEach((value) => keys.add(normalizeRegionName(value)));
    }
  });

  return Array.from(keys).filter(Boolean);
}

function normalizeRegionName(name: string) {
  return name
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[()[\],.]/g, ' ')
    .replace(/[—–-]/g, ' ')
    .replace(
      /(^|\s)(республика|область|край|автономная|автономный|округ|город|федерального|значения|кузбасс)(?=\s|$)/g,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
}
