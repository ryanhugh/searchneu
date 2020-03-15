import React from 'react';
import NUPathFilter from './NUPathFilter';
import { FilterOptions } from './filterTypes';

export type ActiveFilters = {
  online?: boolean,
  NUpath?: string[],
  subject?: string[],
  classType?: string[],
}

export interface FilterPanelProps {
  options: FilterOptions,
  active: ActiveFilters,
  setActive: (f: ActiveFilters) => void,
}

export default function FilterPanel({ options, active, setActive }: FilterPanelProps) {
  return (
    <NUPathFilter
      options={ options.NUpath }
      active={ active.NUpath }
      setActive={ (a) => setActive({ NUpath: a }) }
    />
  );
}
