import React from 'react';
import CheckboxGroup from './CheckboxGroup';
import { Option } from './filters';


interface CheckboxFilterProps {
  title: string,
  options: Option[],
  selected: string[],
  setActive: (a: string[]) => void

}

export default function CheckboxFilter({
  title, options, selected, setActive,
}: CheckboxFilterProps) {
  return (

    <div className='CheckboxFilter'>
      <span className='CheckboxFilter__title'>{title}</span>
      <CheckboxGroup name='CheckboxFilter' value={ selected } onChange={ setActive }>
        {(Checkbox) => (
          <>
            {options.map((option) => (
              <div key={ option.value } className='CheckboxFilter__element'>
                <label className='CheckboxFilter__text'>
                  <Checkbox value={ option.value } />
                  <span className='CheckboxFilter__checkbox' />
                  {option.value}
                  <span className='CheckboxFilter__count'>
                    {option.count}
                  </span>
                </label>
              </div>
            ))}
          </>
        )}

      </CheckboxGroup>
    </div>
  )
}
