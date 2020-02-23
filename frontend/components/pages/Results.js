import React, { useState } from 'react';
import { Dropdown } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import logo from '../images/logo.svg';

export default function Results() {
  const [inputElement, setInputElement] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTermId, setSelectedTermId] = useState('');
  const onKeyDown = () => {
  };
  const onTermdropdownChange = () => {
  };
  const onLogoClick = () => {
  };
  const termDropDownOptions = [
    {
      text: 'Spring 2020',
      value: '202030',
    },
    {
      text: 'Fall 2019',
      value: '202010',
    },
    {
      text: 'Summer I 2019',
      value: '201940',
    },
    {
      text: 'Summer II 2019',
      value: '201960',
    },
    {
      text: 'Summer Full 2019',
      value: '201950',
    },
    {
      text: 'Spring 2019',
      value: '201930',
    },
  ];


  return (
    <div className='Results'>
      <input
        type='search'
        id='search_id'
        autoComplete='off'
        spellCheck='false'
        tabIndex='0'
        className='Results_Input'
        onKeyDown={ onKeyDown }
        defaultValue={ searchQuery }
        ref={ (element) => { setInputElement(element); } }
      />
      <Dropdown
        selection
        defaultValue={ selectedTermId }
        placeholder='Spring 2018'
        className='Results_TermDropDown'
        options={ termDropDownOptions }
        onChange={ onTermdropdownChange }
      />
      <img src={ logo } className='Results_Logo' alt='logo' onClick={ onLogoClick } />
    </div>

  );
}
