import React, { useEffect, useState, useCallback } from 'react';
import { Dropdown } from 'semantic-ui-react';
import PropTypes from 'prop-types';

export default function TopSearchBar(props) {
  // eslint-disable-next-line no-unused-vars
  const [inputElement, setInputElement] = useState(null);
  // let inputElement = null;
  // console.log("props.onClick", props.onClick);
  // console.log("props.onKeyDown", props.onKeyDown);
  console.log("props.searchQuery", props.searchQuery);
  console.log("props.inputElement", props.inputElement);
  // console.log("props.selectedTermId", props.selectedTermId);
  // console.log("props.termDropDownOptions", props.termDropDownOptions);
  // console.log("onTermdropdownChange", props.onTermdropdownChange);
  return (
    <div>
      <div>
        <input
          type='search'
          id='search_id'
          autoComplete='off'
          spellCheck='false'
          tabIndex='0'
          className='searchBox'
          onChange={ props.onClick }
          onKeyDown={ props.onKeyDown }
          defaultValue={ props.searchQuery }
          ref={ (element) => { setInputElement(element); } }
          updateRef={ props.updateRef(inputElement) }
        />
      </div>
      <Dropdown
        fluid
        selection
        defaultValue={ props.selectedTermId }
        placeholder='Spring 2018'
        className='termDropdown'
        options={ props.termDropDownOptions }
        onChange={ props.onTermdropdownChange }
      />
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
  inputElement: PropTypes.instanceOf(Element).isRequired,


};


TopSearchBar.defaultProps = {
  searchQuery: '',
  selectedTermId: '',
  termDropDownOptions: [],

};
