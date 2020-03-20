import React from 'react';

interface FilterBreadcrumbProps {
  name: string,
  onClose: ()=>void,
}

export default function FilterBreadcrumb({ name, onClose }: FilterBreadcrumbProps) {
  return (
    <div className='FilterBreadcrumb'>
      <button
        className='FilterBreadcrumb__close'
        type='button'
        onClick={ onClose }
      >
        {name}
        <span className='FilterBreadcrumb__icon' />
      </button>
    </div>
  )
}
