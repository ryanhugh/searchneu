import React from "react";
import CSSModules from 'react-css-modules';
import css from './home.css'
import Row from './Row.js'
import he from 'he'
import elasticlunr from 'elasticlunr'
import 'semantic-ui-css/semantic.min.css'
import '../lib/base.css'

// Home page component
class Home extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			searchValue: ''
		}
		console.log('running constructor')
	}

	onClick(event) {
	    this.setState({searchValue: event.target.value});
	}

    render() {


    	console.log(this.state.searchValue, 'here')


	    return (
	    	<div>
			    <div id="top-header" className="ui center aligned icon header">
			        <h1 style={{fontSize:"50px"}}>Employee Directory</h1>
			        <h3 style={{color:"grey", fontSize:'29px', paddingBottom:"30px"}}>For Northeastern</h3>
			        
			        <div id="search-wrapper" className="sub header">
			            <label>
			                <i className="search icon"></i>
			            </label>
			            <input autoFocus type="search" id="seach_id" placeholder="Search Professors and Employees" autoComplete="off" spellCheck="false" tabIndex="0" onChange={this.onClick.bind(this)}/>
			        </div>
			    </div>

			    <div className="ui stackable grid container">
			        <div className="five column row">
				        <div className="page-home">
					        <table className="ui celled table content-wrapper" id="main_results_table_id" style={{display:"none"}}>
					            <thead>
						            <tr>
						                <th className="single line four wide">
						                    <h3>Professor/Employee</h3>
						                </th>
						                <th className="two wide">Phone</th>
						                <th className="two wide">Email</th>
						                <th className="two wide">Primary Appointment</th>
						                <th className="two wide">Primary Department</th>
						            </tr>
						        </thead>
						        <tbody>
						            <tr className="template_class_name" style={{display:"none"}}>
						                <td className="main name"></td>
						                <td className="icon phone"></td>
						                <td className="icon email"></td>
						                <td className="icon primaryappointment"></td>
						                <td className="icon primarydepartment"></td>
						            </tr>

						        </tbody>
						    </table>
					     </div>
			        </div>
			    </div>
		    </div>
	    );
    }
}

// <Row/>
export default CSSModules(Home, css);
