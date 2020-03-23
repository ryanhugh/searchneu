import React, { useState } from 'react';
import '../../css/_Filters.scss';
import _ from 'lodash';

interface ToggleFilterProps {
  title: string,
  active: boolean,
  setActive: (a:boolean)=>void
}

export default function ToggleFilter({ title, active, setActive }: ToggleFilterProps) {
  const [id] = useState(_.uniqueId('react-switch-'));
  return (
    <div className='toggleFilter'>
      <div className='toggleName'>
        <p>
          {title}
        </p>
      </div>
      <div className='toggleSwitch'>
        <input
          checked={ active }
          onChange={ () => { setActive(!active) } }
          className='react-switch-checkbox'
          id={ id }
          type='checkbox'
        />
        <label
          className='react-switch-label'
          htmlFor={ id }
        >
          <span className='react-switch-button' />
        </label>
      </div>
    </div>
  );
}
