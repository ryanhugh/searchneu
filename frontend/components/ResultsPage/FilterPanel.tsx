
import React from 'react';
import _ from 'lodash';

import CheckboxFilter from './CheckboxFilter';
import DropdownFilter from './DropdownFilter';
import ToggleFilter from './ToggleFilter';
import {
  FilterOptions, FilterSelection, FILTERS_IN_ORDER,
} from './filters';

export interface FilterPanelProps {
  options: FilterOptions,
  active: FilterSelection,
  setActive: (f: FilterSelection) => void,
}

function FilterPanel({ options, active, setActive }: FilterPanelProps) {
  return (
    <div className='FilterPanel'>
      {FILTERS_IN_ORDER.map(({ key, display, category }) => {
        const aFilter = active[key];
        const setActiveFilter = (a) => setActive({ [key]: a });

        return (
          <>
            {category === 'Toggle'
          && <ToggleFilter title={ display } active={ aFilter } setActive={ setActiveFilter } />}
            {category === 'Dropdown'
          && <DropdownFilter title={ display } options={ options[key] } active={ aFilter } setActive={ setActiveFilter } />}
            {category === 'Checkboxes'
          && <CheckboxFilter title={ display } options={ options[key] } active={ aFilter } setActive={ setActiveFilter } />}
          </>
        )
      })}
    </div>
  );
}

export default React.memo(FilterPanel, _.isEqual);
