import Griddle from 'griddle-react';
import React, { Component } from 'react';
import Firebase from '../../library/firebase';

class AdminIndex extends Component {
    constructor() {
        super();

        this.state = {
            signups: []
        }
    }

    componentDidMount() {
        Firebase
            .database()
            .ref('form-submissions')
            .once('value', ( snapshot ) => {
                let data = snapshot.val();
                let signups = [];

                for ( var i in data ) {
                    signups.push(data[i]);
                }

                this.setState({
                    signups
                })
            });  
    }
    

    renderSignups() {
        if ( this.state.signups.length > 0 ) {
            console.log(this.state.signups);
            return (
                <Griddle data={this.state.signups} />           
            )
        }
        
        return null;
    }

    render() {
        return (
            <div>
                <h1>Signups</h1>

                {this.renderSignups()}
            </div>
        )
    }
     
}

export default AdminIndex;