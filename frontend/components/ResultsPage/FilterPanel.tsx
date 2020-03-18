import React from 'react';
import NUPathFilter from './NUPathFilter';
import { FilterOptions } from './filterTypes';
import { FilterSelection } from '../types';

export interface FilterPanelProps {
  options: FilterOptions,
  active: FilterSelection,
  setActive: (f: FilterSelection) => void,
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
