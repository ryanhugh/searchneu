import React from "react";
import CSSModules from 'react-css-modules';
import ReactTooltip from 'react-tooltip'

import globe from './globe.svg'
import css from './results.css'
import Class from './models/Class'
import macros from './macros'


// Results page component
class Results extends React.Component {

	componentDidUpdate(prevProps, prevState) {
		ReactTooltip.rebuild()
	}

    render() {
	  	if (!this.props.classes || this.props.classes.length == 0) {
	  		return null;
	  	}

		var elements = this.props.classes.map((aClass) => {

			// Render the section table if this class has sections
			var sectionTable = null;
			if (aClass.sections && aClass.sections.length > 0) {
				sectionTable = (
					<table className={"ui celled striped table " + css.resultsTable}>
				      <thead>
				        <tr>
						    {/* TODO waitlist, if they have it. */}
					        <th> 
					        	<div className = {css.inlineBlock} data-tip="Course Reference Number">
					        		CRN
					        	</div>
					        </th>
					        <th> Professors </th>
					        <th> Weekdays </th>
					        <th> Start </th>
					        <th> End </th>
					        <th> Location </th>
					        <th> Seats </th>
					        <th> Link </th>
					      </tr>
				      </thead>
				      <tbody>
					    {/* This tr is so the first row is a dark stripe instead of a light stripe. */}
				        <tr style={{display:'none'}}></tr>
				        {aClass.sections.map(function(section) {

				        	// Calculate the "Meets on Tuesday, Friday" or "No Meetings found" string that hovers over the weekday boxes
				        	var meetingDays = section.getWeekDaysAsStringArray()
				        	var meetingString
				        	if (meetingDays.length == 0) {
				        		meetingString = "No Meetings found"
				        	}
				        	else {
				        		meetingString = 'Meets on ' + meetingDays.join(', ')
				        	}

				        	// Calculate the weekday boxes eg [][x][][][x] for Tuesday Friday
				        	var booleans = section.getWeekDaysAsBooleans();
			          		if (!section.meetsOnWeekends()) {
			          			booleans = booleans.slice(1, 6)
			          		}

				          	var booleanElements = booleans.map(function (meets, index) {
		          				return (
		          					<div key={index} className={(meets?css.weekDayBoxChecked:"") + " " + css.weekDayBox}></div>
	          					)
			          		})

			          		// Calculate the Google Maps links
			          		var locationElements = section.getLocations().map(function(location, index, locations) {

			          			var buildingName
			          			if (location.match(/\d+\s*$/i)) {
			          				buildingName = location.replace(/\d+\s*$/i, '')
			          				console.log(buildingName)
			          			}
			          			else {
			          				buildingName = location
			          			}

			          			var optionalComma = null
			          			if (index != locations.length -1) {
			          				optionalComma = ','
			          			}

			          			if (location.toUpperCase() == 'TBA') {
			          				if (locations.length > 1)
			          				{
				          				return null;
			          				}
			          				else {
										return 'TBA'			          					
			          				}
			          			}

		          				return (
		          					<span>
			          					<a href={`https://maps.google.com/?q=${macros.collegeName} ${buildingName}`}>
			          						{location}
		          						</a> {optionalComma}
		          					</span>
	          					)
			          		})


				        	return (
				        		<tr key={section._id}>
						          <td> {section.crn} </td>
						          <td> {section.getProfs().join(', ')} </td>
						          <td> 
							          <div className={css.inlineBlock} data-tip={meetingString}>
							          	{booleanElements} 
	      						      </div>
  						          </td>
						          
		                          <td>{section.getUniqueStartTimes().join(", ")}</td>
		                          <td>{section.getUniqueEndTimes().join(", ")}</td>
		                          <td>
		                          	{locationElements}
		                          </td>
		                          <td>
		                          	<div data-tip="Open Seats/Total Seats" className={css.inlineBlock}>
			                          {section.seatsRemaining}/{section.seatsCapacity} 
		                          	</div> 
		                          </td>
		                          <td> 
		                          	<a target='_blank' rel="noopener noreferrer" className={css.inlineBlock} data-tip={"View on " + section.host} href={section.prettyUrl || section.url}> 
		                          		<img src={globe} /> 
		                          	</a> 
		                          </td>
						        </tr>
			        		)
				        })}
				      </tbody>
				    </table>

				)
			}


			// Render each class

			// Figure out the credits string
			var creditsString
			if (aClass.maxCredits === aClass.minCredits) {
				creditsString = `${aClass.minCredits} credits`
			}
			else {
				creditsString = `${aClass.maxCredits} to ${aClass.minCredits} credits`
			}


	    	return (
				<div key={aClass._id} className={css.container + " ui segment"}> 
					<div className={css.header}>
						{aClass.subject} {aClass.classId}: {aClass.name}
					</div>

					<div className={css.body}>
						{aClass.desc} 
						<br />
						<br />
						<div className = {css.leftPanel}>
							Prerequisites: {aClass.getPrereqsString()}
							<br />
							Corequisites: {aClass.getCoreqsString()}
						</div>
						<div className = {css.rightPanel}>
							Updated {aClass.getLastUpdateString()}
							<br />
							{creditsString}
						</div>
					</div>
					{sectionTable}
			    </div>
		    )
	    })

	    return (
	    	<div>
	    		{elements}
		    	<ReactTooltip effect="solid"/>
    		</div>
    	)

    }
}

export default Results;