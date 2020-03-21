
import React from 'react';
import _ from 'lodash';
import DropdownFilter from './DropdownFilter';
import { FilterOptions } from './filterTypes';
import { FilterSelection } from '../types';

export interface FilterPanelProps {
  options: FilterOptions,
  active: FilterSelection,
  setActive: (f: FilterSelection) => void,
}

function FilterPanel({ options, active, setActive }: FilterPanelProps) {
  return (
    <div className='FilterPanel'>
      <DropdownFilter
        title='Subjects'
        options={ options.subject }
        active={ active.subject }
        setActive={ (a: string[]) => setActive({ subject: a }) }
      />
      <DropdownFilter
        title='NU Paths'
        options={ options.NUpath }
        active={ active.NUpath }
        setActive={ (a: string[]) => setActive({ NUpath: a }) }
      />
    </div>
  );
}

export default React.memo(FilterPanel, _.isEqual);
