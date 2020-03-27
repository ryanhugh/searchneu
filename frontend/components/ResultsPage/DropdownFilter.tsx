import React from 'react';
import { Dropdown } from 'semantic-ui-react';
import { Option } from './filterTypes';

interface DropdownFilter {
  title: string,
  options: Option[],
  active: string[],
  setActive: (a:string[])=>void
}
export default function DropdownFilter({
  title, options, active, setActive,
}: DropdownFilter) {
  return (
    <div>
      <div className='filter__title'>{title}</div>
      <Dropdown
        onChange={ (e, { value }) => {
          setActive(value as string[]);
        } }
        value={ active }
        labeled
        options={ options.map((o:Option) => ({
          key:o.value, text:o.value, value:o.value, description: o.count,
        })) }
        search
        multiple
        selection
        fluid
        compact
        lazyLoad
      />
    </div>
  );
}
