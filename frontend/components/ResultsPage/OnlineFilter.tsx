import React, { useState } from 'react';
import '../../css/_Filters.scss';

interface OnlineFilterProps {
  active: boolean,
  setActive: (a:boolean)=>void
}

const ToggleSwitch = ({ active, setActive }) => {
  return (
    <>
      <input
        checked={ active }
        onChange={ setActive }
        className='react-switch-checkbox'
        id='react-switch-new'
        type='checkbox'
      />
      <label
        style={{ background:active && '#AE4543' }} // Color is currently same as darker red in Figma
        className='react-switch-label'
        htmlFor='react-switch-new'
      >
        <span className='react-switch-button' />
      </label>
    </>
  )
};

/*
<Checkbox
      toggle
      onChange={ () => {
        setActive(!active);
      } }
      checked={ active }
    />
 */

export default function OnlineFilter({ active, setActive }: OnlineFilterProps) {
  const [value, setValue] = useState(false);
  return (
    <div className='onlineToggle'>
      <ToggleSwitch
        active={ value }
        setActive={ () => setValue(!value) }
      />
    </div>
  );
}
