import React from 'react';
import { Checkbox } from 'semantic-ui-react';

interface OnlineFilterProps {
  active: boolean,
  setActive: (a:boolean)=>void
}



export default function OnlineFilter({ active, setActive }: OnlineFilterProps) {
  return (
    <Checkbox
      toggle
      onChange={ () => {
        setActive(!active);
      } }
      checked={ active }
    />
  );
}
