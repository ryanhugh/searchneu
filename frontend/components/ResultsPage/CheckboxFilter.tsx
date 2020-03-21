import React from 'react';
import CheckboxGroup from 'react-checkbox-group';
import { Option } from './filterTypes';


interface CheckboxFilterProps {
  title: string,
  options: Option[],
  active: string[],
  setActive: (a:string[])=>void

}

export default function CheckboxFilter({title, options, active, setActive }: CheckboxFilterProps) {
  return (

    <div className='CheckboxFilter'>
      <span className='CheckboxFilter__title'>{title}</span>
      <CheckboxGroup name='CheckboxFilter' value={ active } onChange={ setActive }>
        {(Checkbox) => (
          <>
            {options.map((option) => (
              <div className="CheckboxFilter__element">
                <label className='CheckboxFilter__text'>
                <Checkbox value={ option.key } />
                <span className='CheckboxFilter__checkbox' /> 
                {option.text}
                </label>
              </div>
            ))}
          </>
        )}

      </CheckboxGroup>
    </div>
  )
}
