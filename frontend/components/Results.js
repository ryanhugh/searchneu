import React from "react";
import CSSModules from 'react-css-modules';

import globe from './globe.svg'
import css from './results.css'
import Class from './models/Class'


// Results page component
class Results extends React.Component {


    // render
    render() {
	  	if (!this.props.classes || this.props.classes.length == 0) {
	  		return null;
	  	}

		var elements = this.props.classes.map((aClass) => {


			var sectionTable = null;

			if (aClass.sections && aClass.sections.length > 0) {
				sectionTable = (
					<table className={"ui celled striped table " + css.resultsTable}>
				      <thead>
				        <tr>
						    {/* TODO waitlist, if they have it. */}
					        <th> CRN </th>
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
				        	return (
				        		<tr key={section._id}>
						          <td> {section.crn} </td>
						          <td> {section.getProfs().join(', ')} </td>
						          <td> 
						          	{(function () {
						          		var booleans = section.getWeekDaysAsBooleans();
						          		if (!section.meetsOnWeekends()) {
						          			booleans = booleans.slice(1, 6)
						          		}

  						          		return booleans.map(function (meets) {
					          				return (
					          					<div className={(meets?css.weekDayBoxChecked:"") + " " + css.weekDayBox}></div>
				          					)
  						          		})


      						        })()} 
  						          </td>
						          
		                          <td>{section.getUniqueStartTimes().join(", ")}</td>
		                          <td>{section.getUniqueEndTimes().join(", ")}</td>
		                          <td>{section.getLocations().join(", ")}</td>
		                          <td> {section.seatsRemaining}/{section.seatsCapacity} </td>
		                          <td> <a target='_blank' rel="noopener noreferrer" href={section.prettyUrl || section.url}> <img src={globe} /> </a> </td>
						        </tr>
			        		)
				        })}
				      </tbody>
				    </table>

				)
			}

	    	return (
				<div key={aClass._id} className={css.container + " ui segment"}> 
					<div className={css.header}>
						{aClass.subject} {aClass.classId}: {aClass.name}
					</div>

					<div className={css.body}>
						{aClass.desc} 
						<br />
						{aClass.getPrereqsString()}
					</div>
					{sectionTable}
			    </div>
		    )
	    })

	    return (
	    	<div>
	    		{elements}
    		</div>
    	)

    }
}

export default Results;



						

   // (   <table className="ui celled table content-wrapper">
   // 	        <thead>
   // 	            <tr>
   // 	                <th className="single line four wide">
   // 	                    <h3>Class Name</h3>
   // 	                </th>
   // 	                <th className="two wide">Class Id</th>
   // 	                <th className="two wide">Email</th>
   // 	                <th className="two wide">Primary Appointment</th>
   // 	                <th className="two wide">Primary Department</th>
   // 	            </tr>
   // 	        </thead>
   // 	        <tbody>
   // 	            {this.props.classes.map(function (aClass) {
   // 	            	return (
   // 		            		<tr key={aClass._id}>
   // 				                <td className="main">{aClass.name}</td>
   // 				                <td className="icon">{aClass.classId}</td>
   // 				                <td className="icon"></td>
   // 				                <td className="icon"></td>
   // 				                <td className="icon"></td>
   // 				            </tr>
   // 	            		)
   // 	            })}
   // 	        </tbody>
   // 	    </table>)