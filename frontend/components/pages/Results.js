import React, { useState } from 'react';
import { Dropdown } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import logo from '../images/logo.svg';

export default function TopSearchBar(props) {
  const [inputElement, setInputElement] = useState(null);
  return (
    <div className='SearchHeader'>
      <input
        type='search'
        id='search_id'
        autoComplete='off'
        spellCheck='false'
        tabIndex='0'
        className='SearchHeader_Input'
        onChange={ props.onClick }
        onKeyDown={ props.onKeyDown }
        defaultValue={ props.searchQuery }
        ref={ (element) => { setInputElement(element); } }
        updateRef={ props.updateRef(inputElement) }
      />
      <Dropdown
        selection
        defaultValue={ props.selectedTermId }
        placeholder='Spring 2018'
        className='SearchHeader_TermDropDown'
        options={ props.termDropDownOptions }
        onChange={ props.onTermdropdownChange }
      />
      <img src={ logo } className='SearchHeader_Logo' alt='logo' onClick={ props.onLogoClick } />
    </div>

  );
}

TopSearchBar.propTypes = {
  onClick: PropTypes.func.isRequired,
  updateRef: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  searchQuery: PropTypes.string,
  selectedTermId: PropTypes.string,
  termDropDownOptions: PropTypes.array,
  onTermdropdownChange: PropTypes.func.isRequired,
  onLogoClick: PropTypes.func.isRequired,


};


TopSearchBar.defaultProps = {
  searchQuery: '',
  selectedTermId: '',
  termDropDownOptions: [],

};
