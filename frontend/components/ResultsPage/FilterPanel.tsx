
import React from 'react';
import _ from 'lodash';

import CheckboxFilter from './CheckboxFilter';
import DropdownFilter from './DropdownFilter';
import ToggleFilter from './ToggleFilter';
import {
  FilterOptions, FilterSelection, FILTER_ORDER, FILTER_SPECS, FilterCategory, FILTER_DISPLAY_TEXT,
} from './filters';

export interface FilterPanelProps {
  options: FilterOptions,
  active: FilterSelection,
  setActive: (f: FilterSelection) => void,
}

function FilterPanel({ options, active, setActive }: FilterPanelProps) {
  return (
    <div className='FilterPanel'>
      {FILTER_ORDER.map((filter) => {
        const cat: FilterCategory = FILTER_SPECS[filter];
        const title: string = FILTER_DISPLAY_TEXT[filter];
        const aFilter = active[filter];
        const setActiveFilter = (a) => setActive({ [filter]: a });

        return (
          <>
            {cat === 'Toggle'
          && <ToggleFilter title={ title } active={ aFilter } setActive={ setActiveFilter } />}
            {cat === 'Dropdown'
          && <DropdownFilter title={ title } options={ options[filter] } active={ aFilter } setActive={ setActiveFilter } />}
            {cat === 'Checkboxes'
          && <CheckboxFilter title={ title } options={ options[filter] } active={ aFilter } setActive={ setActiveFilter } />}
          </>
        )
      })}
    </div>
  );
}

export default React.memo(FilterPanel, _.isEqual);
