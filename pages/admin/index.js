import Layout from '../../layouts/admin';
import Griddle from 'griddle-react';
import React, { Component } from 'react';
import Firebase from '../../library/firebase';

import flatten from 'flat';

class AdminIndex extends Component {
    constructor() {
        super();

        this.state = {
            signups: []
        }
    }

    componentDidMount() {
        console.log('loading');
        
        Firebase
            .database()
            .ref('form-submissions')
            .once('value', ( snapshot ) => {
                let data = snapshot.val();
                let signups = [];

                console.log( data );

                for ( var i in data ) {
                    signups.push(flatten(data[i], { delimiter: '_' }));
                }

                console.log( signups );
                
                this.setState({
                    signups
                })
            });  
    }
    

    renderSignups() {
        if ( this.state.signups.length > 0 ) {
            return (
                <Griddle data={this.state.signups} styleConfig={{ classNames: { Table: "table" }}} />           
            )
        }
        
        return null;
    }

    render() {
        return (
            <Layout>
                 <div className="container">
                     <div className="row">
                        <div className="col">                
                            <h1>Signups</h1>

                            {this.renderSignups()}
                        </div>
                    </div>
                </div>
            </Layout>
        )
    }
     
}

export default AdminIndex;