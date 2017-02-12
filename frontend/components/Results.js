import React from "react";
import CSSModules from 'react-css-modules';


// Results page component
class Results extends React.Component {


  // render
  render() {
  	if (!this.props.classes || this.props.classes.length == 0) {
  		return null;
  	}

    return (
      <table className="ui celled table content-wrapper">
	        <thead>
	            <tr>
	                <th className="single line four wide">
	                    <h3>Class Name</h3>
	                </th>
	                <th className="two wide">Class Id</th>
	                <th className="two wide">Email</th>
	                <th className="two wide">Primary Appointment</th>
	                <th className="two wide">Primary Department</th>
	            </tr>
	        </thead>
	        <tbody>
	            {this.props.classes.map(function (aClass) {
	            	return (
		            		<tr key={aClass._id}>
				                <td className="main">{aClass.name}</td>
				                <td className="icon">{aClass.classId}</td>
				                <td className="icon"></td>
				                <td className="icon"></td>
				                <td className="icon"></td>
				            </tr>
	            		)
	            })}
	        </tbody>
	    </table>
    );
  }
}

export default Results;



						