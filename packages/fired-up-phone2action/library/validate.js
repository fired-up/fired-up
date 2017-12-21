const validPhone = new RegExp(/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/);
const validEmail = new RegExp(/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i);

const validate = ( rules, values ) => {    
    let errors = {};

    if ( rules.intent !== 'call' ) {
        if ( !values.subject ) {
            errors.subject = 'Required';
        }

        if ( !values.body ) {
            errors.body = 'Required';
        }
    }

    if ( rules.phoneRequired || rules.intent === 'call') {
        

        if ( !values.phone ) {
            errors.phone = 'Required';
        } else if ( !validPhone.test( values.phone ) ) {
            errors.phone = 'Invalid Phone Number';
        }
    } else {
        if ( values.phone && !validPhone.test( values.phone ) ) {
            errors.phone = 'Invalid Phone Number';
        }
    }

    if ( rules.prefixRequired ) {
        if ( !values.prefix ) {
            errors.prefix = 'Required';
        }
    }

    // always required
    if ( !values.firstname ) {
        errors.firstname = 'Required';
    }

    if ( !values.lastname ) {
        errors.lastname = 'Required';
    }

    if ( !values.email ) {
        errors.email = 'Required';
    } else if ( !validEmail.test( values.email ) ) {
        errors.email = 'Invalid email address';
    }

    if ( !values.address ) {
        errors.address = 'Required';
    }

    if ( !values.zip ) {
        errors.zip = 'Required';
    }

    return errors;
    
}

export default validate;