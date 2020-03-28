
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
  selected: FilterSelection,
  setActive: (f: FilterSelection) => void,
}

function FilterPanel({ options, selected, setActive }: FilterPanelProps) {
  return (
    <div className='FilterPanel'>
      {FILTERS_IN_ORDER.map(({ key, display, category }) => {
        const aFilter = selected[key];
        const setActiveFilter = (a) => setActive({ [key]: a });

        return (
          <>
            {category === 'Toggle'
          && <ToggleFilter title={ display } selected={ aFilter } setActive={ setActiveFilter } />}
            {category === 'Dropdown'
          && <DropdownFilter title={ display } options={ options[key] } selected={ aFilter } setActive={ setActiveFilter } />}
            {category === 'Checkboxes'
          && <CheckboxFilter title={ display } options={ options[key] } selected={ aFilter } setActive={ setActiveFilter } />}
          </>
        )
      })}
    </div>
  );
}

export default React.memo(FilterPanel, _.isEqual);
