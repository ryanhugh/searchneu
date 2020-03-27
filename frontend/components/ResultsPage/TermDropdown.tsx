import { Dropdown } from 'semantic-ui-react';
import React from 'react';

export const termDropDownOptions = [
  {
    text: 'Fall 2020',
    value: '202110',
  },
  {
    text: 'Summer I 2020',
    value: '202040',
  },
  {
    text: 'Summer II 2020',
    value: '202060',
  },
  {
    text: 'Summer Full 2020',
    value: '202050',
  },
  {
    text: 'Spring 2020',
    value: '202030',
  },
];

interface TermDropdownProps {
  termId: string,
  onChange: (t: string) => void,
  compact: boolean
}

function TermDropdown({ termId, onChange, compact = false }: TermDropdownProps) {
  return (
    <Dropdown
      selection
      fluid
      compact={ compact }
      value={ termId }
      placeholder='Spring 2020'
      className={ `termdropdown ${compact ? 'termdropdown--compact' : ''}` }
      options={ termDropDownOptions }
      onChange={ (e, data) => onChange(data.value as string) }
    />
  );
}

export default React.memo(TermDropdown);
