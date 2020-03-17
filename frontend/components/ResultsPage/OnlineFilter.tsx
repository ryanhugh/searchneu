import React from 'react';
import '../../css/_Filters.scss';

interface OnlineFilterProps {
  active: boolean,
  setActive: (a:boolean)=>void
}

export default function OnlineFilter({ active, setActive }: OnlineFilterProps) {
  return (
    <div className='onlineToggle'>
      <input
        checked={ active }
        onChange={ () => { setActive(!active) } }
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
    </div>
  );
}
