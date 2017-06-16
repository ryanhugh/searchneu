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
    console.log(props)
  
  }


  getNameWithoutMiddleName() {

  	let prof = this.props.section.getProfs()[0];
  	let indexOfFirstSpace = prof.indexOf(' ');
  	let indexOfLastSpace = prof.length - prof.split("").reverse().join("").indexOf(' ');
  	let newName = prof.slice(0, indexOfFirstSpace) + ' ' + prof.slice(indexOfLastSpace);
  	return newName


  }

  render() {
  	return (
  		<div className={css.container}>
  		<div className = {css.globe}>
		    <a target="_blank" rel="noopener noreferrer" data-tip="View on neu.edu" href="https://wl11gp.neu.edu/udcprod8/bwckschd.p_disp_detail_sched?term_in=201810&amp;crn_in=14579">
	            <img src="frontend/components/globe.svg" alt="globe"/>
	        </a>
        </div>

        <div className={css.title}>{this.getNameWithoutMiddleName() + ' @ ' + this.props.section.getUniqueStartTimes()[0]}</div>
		<table className={css.table}>
		    <tbody>
		      <tr className={css.firstRow}>
			    <td className={css.firstColumn}>CRN</td>
			    <td className = {css.secondColumn}>{this.props.section.crn}</td> 
			  </tr>
		      <tr>
			    <td className={css.firstColumn}>Profs</td>
			    <td className = {css.secondColumn}>David William Sprague</td> 
			  </tr>
		      <tr>
			    <td className={css.firstColumn}>Place</td>
			    <td className = {css.secondColumn}>
			    	<a target="_blank" rel="noopener noreferrer" href="https://maps.google.com/?q=Northeastern University Hastings Suite ">Hastings Suite 103</a>
		    	</td> 
			  </tr>
		      <tr>
			    <td className={css.firstColumn}>Days</td>
			    <td className = {css.secondColumn}>
			    	<span data-tip="Meets on Monday">
			            <div className={ClassPanelCss.weekDayBox + ' ' + ClassPanelCss.weekDayBoxChecked}></div>
			            <div className={ClassPanelCss.weekDayBox}></div>
			            <div className={ClassPanelCss.weekDayBox}></div>
			            <div className={ClassPanelCss.weekDayBox}></div>
			            <div className={ClassPanelCss.weekDayBox}></div>
			        </span>
		    	</td> 
			  </tr>
		      <tr>
			    <td className={css.firstColumn}>Times</td>
			    <td className = {css.secondColumn}>
			    	4:35 - 5:40 pm
		    	</td> 
			  </tr>
		      <tr className={css.lastRow}>
			    <td className={css.firstColumn}>Seats</td>
			    <td className = {css.secondColumn}>
			    	 0/19 Avalible
		    	</td> 
			  </tr>
		  </tbody>
		</table>












		<div style={{display:'none'}}>
			<div>
				<div className={css.crn +' '+ ClassPanelCss.inlineBlock}>
				    14579
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
		        <span data-tip="Meets on Monday">
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
  		</div>
  	);
  }



}


MobileSectionPanel.propTypes = {
  section: PropTypes.object.isRequired,
};


export default CSSModules(MobileSectionPanel, css);
