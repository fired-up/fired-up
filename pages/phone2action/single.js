import Layout from '../../layouts/default';
import React, { Component } from 'react';
import FiredUpPhone2Action from '../../packages/fired-up-phone2action';

class SignupSingle extends Component {
    constructor( props ) {
        super( props );

        const { url } = props;
        const slug = url.query.slug;

        if ( slug ) {
            this.state = { 
                slug
            }
        } else {           
            if ( typeof window !== 'undefined' ) {
                window.location = '/';
            }
         }
    }    

    render() {
        if ( this.state.slug ) {
            return (
                <Layout>
                    <div className="container">
                        <div className="row">
                            <div className="col">
                                Phone2Action - { this.state.slug }
            
                                <FiredUpPhone2Action />
                            </div>
                        </div>
                    </div>
                </Layout>
            );
        }
       
        return null;
    }
}

export default SignupSingle;