import Layout from '../../layouts/default';
import React, { Component } from 'react';
import FiredUpSignup from '../../packages/fired-up-signups';

class SignupSingle extends Component {
    constructor( props ) {
        super( props );

        const { url } = props;
        const slug = url.query.slug;

        // Demonstrate some of the postSignup actions with 
        let postSignup = {};

        if ( slug === 'redirect' ) {
            postSignup.postSubmitAction = 'redirect';
            postSignup.postSubmitRedirectURL = '/?thanks=true';            
        } else if ( slug === 'thanks' ) {
            postSignup.postSubmitAction = 'inline-thanks';
        } else if ( slug === 'share' ) {
            postSignup.postSubmitAction = 'share';
        }

        if ( slug ) {
            this.state = { 
                slug,
                postSignup
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
                                Single Signup - { this.state.slug }
            
                                <FiredUpSignup 
                                    campaign={ this.state.slug } 
                                    {...this.state.postSignup}
                                />
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