import React from 'react';
import { Dropdown } from 'semantic-ui-react';
import { Option } from './filterTypes';

interface NUPathFilterProps {
  options: Option[],
  active: string[],
  setActive: (a:string[])=>void
}
export default function NUPathFilter({ options, active, setActive }: NUPathFilterProps) {
  return (
    <Dropdown
      onChange={ (e, { value }) => {
        setActive(value as string[]);
      } }
      value={ active }
      labeled
      options={ options }
      search
      multiple
      selection
      text='NUPaths'
    />
  );
}
