import { Dropdown } from 'semantic-ui-react';
import React, { memo } from 'react';
import { PropTypes } from 'prop-types';

export const termDropDownOptions = [
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
  {
    text: 'Fall 2019',
    value: '202010',
  },
];

function TermDropdown({ termId, onChange, compact = false }) {
  return (
    <Dropdown
      selection
      fluid
      compact={ compact }
      value={ termId }
      placeholder='Spring 2020'
      className={ `termdropdown ${compact ? 'termdropdown--compact' : ''}` }
      options={ termDropDownOptions }
      onChange={ onChange }
    />
  );
}

TermDropdown.propTypes = {
  termId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

TermDropdown.defaultProps = {
  compact: false,
};

export default memo(TermDropdown);
