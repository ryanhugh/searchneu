import React from "react";
import CSSModules from 'react-css-modules';
import css from './results.css'

import Class from './models/Class'


// Results page component
class Results extends React.Component {


    // render
    render() {
	  	if (!this.props.classes || this.props.classes.length == 0) {
	  		return null;
	  	}



		var elements = this.props.classes.map(function (aClass) {

			console.log(aClass)

			// aClass.loadPrereqs(this.props.termData.termDump.classMap)

			var sections = [];
			if (aClass.crns) {
				aClass.crns.forEach(function(crn) {
					
				})
			}



	    	return (
				<div key={aClass._id} className={css.container + " ui segment"}> 
					<div className={css.header}>
						{aClass.subject} {aClass.classId}: {aClass.name}
					</div>

					<div className={css.body}>
						{aClass.desc} {aClass.getPrereqsString()}
					</div>


				  	<table className={"ui celled striped table " + css.resultsTable}>
				      <thead>
				        <tr>
					        <th> Git Repository </th>
					        <th> Git Repository </th>
					        <th> Git Repository </th>
					      </tr>
				      </thead>
				      <tbody>
				        <tr style={{display:'none'}}>
				          <td className="collapsing" >
				            <i className="folder icon"></i> node_modules
				          </td>
				          <td>Initial commit</td>
				          <td className="right aligned collapsing">10 hours ago</td>
				        </tr>
				        <tr>
				          <td>
				            <i className="folder icon"></i> test
				          </td>
				          <td>Initial commit</td>
				          <td className="right aligned">10 hours ago</td>
				        </tr>
				        <tr>
				          <td>
				            <i className="folder icon"></i> build
				          </td>
				          <td>Initial commit</td>
				          <td className="right aligned">10 hours ago</td>
				        </tr>
				        <tr>
				          <td>
				            <i className="file outline icon"></i> package.json
				          </td>
				          <td>Initial commit</td>
				          <td className="right aligned">10 hours ago</td>
				        </tr>
				        <tr>
				          <td>
				            <i className="file outline icon"></i> Gruntfile.js
				          </td>
				          <td>Initial commit</td>
				          <td className="right aligned">10 hours ago</td>
				        </tr>
				      </tbody>
				    </table>
			    </div>
		    )
	    }.bind(this))

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