/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import PropTypes from 'prop-types';

import macros from '../macros';


// Calculate the Google Maps links from a given section.
// This is used in both the mobile section panel and the desktop section panel.

class LocationLinks extends React.Component {
  render() {
    // Don't render anything if the class is online.
    if (this.props.section.online) {
      return null;
    }

    const elements = this.props.section.getLocations().map((location, index, locations) => {
      let buildingName;
      if (location.match(/\d+\s*$/i)) {
        buildingName = location.replace(/\d+\s*$/i, '');
      } else {
        buildingName = location;
      }

      let optionalComma = null;
      if (index !== locations.length - 1) {
        optionalComma = ', ';
      }

      if (location.toUpperCase() === 'TBA') {
        if (locations.length > 1) {
          return null;
        }

        return 'TBA';
      }

      if (location.toUpperCase() === 'BOSTON DEPT') {
        return <span key='Boston DEPT'>TBA &nbsp;(Boston Campus)</span>;
      }

      // The <a> tag needs to be on one line, or else react will insert spaces in the generated HTML.
      // And we only want spaces between these span elements, and not after the location and the comma.
      // eg YMCA, Hurting Hall and not YMCA , Hurting Hall
      return (
        <span key={ location }>
          <a target='_blank' rel='noopener noreferrer' href={ `https://maps.google.com/?q=${macros.collegeName} ${buildingName}` }>{location}</a>{optionalComma}
        </span>
      );
    });

    return (
      <span>
        {elements}
      </span>
    );
  }
}


LocationLinks.propTypes = {
  section: PropTypes.object.isRequired,
};


export default LocationLinks;
