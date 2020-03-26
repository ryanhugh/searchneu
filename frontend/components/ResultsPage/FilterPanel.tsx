
import React from 'react';
import _ from 'lodash';

import CheckboxFilter from './CheckboxFilter';
import DropdownFilter from './DropdownFilter';
import { FilterOptions } from './filterTypes';
import { FilterSelection } from '../types';
import ToggleFilter from './ToggleFilter';

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
        options={ options.nupath }
        active={ active.nupath }
        setActive={ (a: string[]) => setActive({ nupath: a }) }
      />
      <ToggleFilter
        title='Online Classes Only'
        active={ active.online }
        setActive={ (a) => setActive({ online: a }) }
      />
      <CheckboxFilter
        title='Schedule Type'
        options={ options.classType }
        active={ active.classType }
        setActive={ (a) => setActive({ classType: a }) }
      />
    </div>
  );
}

export default React.memo(FilterPanel, _.isEqual);
