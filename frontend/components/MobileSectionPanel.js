import React from 'react';
import PropTypes from 'prop-types';
import CSSModules from 'react-css-modules';
import classNames from 'classnames/bind';

import globe from './globe.svg';
import css from './MobileSectionPanel.css';
import macros from './macros';
import Keys from '../../common/Keys'



// clean up
import ClassPanelCss from './ClassPanel.css'

const cx = classNames.bind(css);


// MobileSectionPanel page component
class MobileSectionPanel extends React.Component {

  constructor(props) {
    super(props);
  
  }

  render() {
  	return (
  		<div className={css.container}>
			<div>
				<div className={css.crn +' '+ ClassPanelCss.inlineBlock}>
				    14579
			    </div>
			    <div style={{float:"right"}}>
				    <a target="_blank" rel="noopener noreferrer" data-tip="View on neu.edu" href="https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&amp;crn_in=14579" currentitem="false">
			            <img src="frontend/components/globe.svg" alt="globe"/>
			        </a>
		        </div>
			</div>
			<div>
		        David William Sprague
		    </div>
		    <div>
		        <span>
		            <a target="_blank" rel="noopener noreferrer" href="https://maps.google.com/?q=Northeastern University Hastings Suite ">Hastings Suite 103</a>
		        </span>
		    </div>
		    <div>
		        <span data-tip="Meets on Monday" currentitem="false">
		            <div className={ClassPanelCss.weekDayBox + ' ' + ClassPanelCss.weekDayBoxChecked}></div>
		            <div className={ClassPanelCss.weekDayBox}></div>
		            <div className={ClassPanelCss.weekDayBox}></div>
		            <div className={ClassPanelCss.weekDayBox}></div>
		            <div className={ClassPanelCss.weekDayBox}></div>
		        </span>
		        &nbsp;&nbsp;
		        <span> 
			    	4:35 pm - 5:40 pm
		        </span>
		    </div>
		    <div>
		        <div>
		        0/19 Open Seats
		        </div>
		    </div>
		    <div>
		        <div>
		            0/0 Open Waitlist Seats 
		        </div>
		    </div>
  		</div>
  	);
  }



}


MobileSectionPanel.propTypes = {
  section: PropTypes.object.isRequired,
};


export default CSSModules(MobileSectionPanel, css);
