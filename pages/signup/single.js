import React, { Component } from 'react';
import FiredUpSignup from '../../packages/fired-up-signups';

class SignupSingle extends Component {
    constructor() {
        super();
    }
    

    render() {
        return (
            <div>
                Single Signup
    
                <FiredUpSignup />
           </div>
        );
    }
}

export default SignupSingle;