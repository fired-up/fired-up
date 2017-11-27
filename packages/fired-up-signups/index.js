import React, { Component } from 'react';
import Firebase from '../../library/firebase';

class FiredUpSignup extends Component {
    constructor() {
        super();

        this.state = {
            view: 'form'
        }

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit( event ) {
        event.preventDefault();

        const { postSubmitAction, postSubmitRedirectURL, campaign } = this.props;

        Firebase
            .database()
            .ref('form-submissions')
            .push({
                fields: {
                    email: this.email.value
                },
                campaign: campaign,
                created_at: Firebase.database.ServerValue.TIMESTAMP
              });      

        if ( postSubmitAction ) {
            if ( postSubmitAction === 'redirect' ) {
                window.location = postSubmitRedirectURL;
            } else if ( postSubmitAction === 'inline-thanks' ) {
                this.setState({
                    view: 'inline-thanks'
                })
            } else if ( postSubmitAction === 'share' ) {
                this.setState({
                    view: 'share'
                })
            }
        }
    }

    render() {
        if ( this.state.view === 'form' ) {
            return (
                <form onSubmit={ this.handleSubmit }>
                    <label>Field:</label>
                    <input type="text" name="email" ref={ email => this.email = email } />
                    <button type="submit">Submit</button>
                </form>
            );
        } else if ( this.state.view === 'share' ) {
            return (
                <div> Share Module Here </div>
            );
        } else if ( this.state.view === 'inline-thanks' ) {
            return (
                <div>thanks!</div>
            )
        }
       
    }
}

export default FiredUpSignup;