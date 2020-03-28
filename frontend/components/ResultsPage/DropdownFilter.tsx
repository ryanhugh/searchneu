import React from 'react';
import { Dropdown } from 'semantic-ui-react';
import { Option } from './filters';

interface DropdownFilter {
  title: string,
  options: Option[],
  selected: string[],
  setActive: (a:string[])=>void
}
export default function DropdownFilter({
  title, options, selected, setActive,
}: DropdownFilter) {
  return (
    <div>
      <div className='filter__title'>{title}</div>
      <Dropdown
        onChange={ (e, { value }) => {
          setActive(value as string[]);
        } }
        value={ selected }
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
