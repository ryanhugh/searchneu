import React from 'react';
import CheckboxGroup from 'react-checkbox-group';
import { Option } from './filterTypes';


interface ClassTypeFilterProps {
  options: Option[],
  active: string[],
  setActive: (a:string[])=>void

}

export default function ClassTypeFilter({ options, active, setActive }: ClassTypeFilterProps) {
  return (
    <div className='ClassTypeFilter'>
      <CheckboxGroup name='ClassTypeFilter' value={ active } onChange={ setActive }>
        {(Checkbox) => (
          <>
            {options.map((option) => (
              <label className="ClassTypeFilter__element">
                <Checkbox value={ option.key } />
                <span className='ClassTypeFilter__checkbox' /> 
                <label className='ClassTypeFilter__text'>
                {option.text}
                </label>
              </label>
            ))}
          </>
        )}

      </CheckboxGroup>
    </div>
  )
}
