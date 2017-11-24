import React, { Component } from 'react';
import Firebase from '../../library/firebase';

class FiredUpSignup extends Component {
    constructor() {
        super();

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit( event ) {
        event.preventDefault();

        Firebase
            .database()
            .ref('form-submissions')
            .push({
                fields: {
                    email: this.email.val()
                },
                created_at: Firebase.database.FieldValue.serverTimestamp(),
              });      
    }

    render() {
        return (
            <form onSubmit={ this.handleSubmit }>
                <label>Field:</label>
                <input type="text" name="email" ref={email => this.email = email } />
                <button type="submit">Submit</button>
            </form>
        );
    }
}

export default FiredUpSignup;