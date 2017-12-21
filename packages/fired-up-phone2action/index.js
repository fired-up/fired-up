import axios from 'axios';
import { Formik } from 'formik';
import React, { Component } from 'react';
import { clone as _clone } from 'lodash';

import Firebase from './library/firebase';
import validate from './library/validate.js'
import Field from './components/field/index.js';

class FiredUpPhone2Action extends Component {
    constructor() {
        super();

        this.state = {
            error: '',
            view: 'form'
        }

        // yes, we need this, Formik loses `this`
        this.renderForm = this.renderForm.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }
    
    async handleSubmit( values, { setSubmitting, setErrors } ) {
        let url;
        const fields = _clone( values );        

        fields.campaign = this.props.campaign;
        
        if ( this.props.intent === 'email' ) {
            url = `${ this.props.functionsRoot }/P2AEmail`;
        } else {
            url = `${ this.props.functionsRoot }/P2ACall`;
        }

        const res = await axios.post( url, fields );

        if ( res.data.error ) {
            // Phone2action throws pretty confusing and not user level errors.
            // We need to sub in our own text for now, server side issue is most likely
            // 'call' intent being selected when 'email' is needed.
            setSubmitting( false );
            const error = res.data.error;

            this.setState({
                error: 'Sorry, there was an issue on our end. Please try again later.' 
            })
        } else {
            Firebase.writeAction( this.props.campaign, this.props.intent, fields );

            if ( this.props.thanksRedirect ) {
                // Allow Firebase write to complete.
                setTimeout(() => {
                    window.location = thanksRedirect;
                }, 150);
            } else {
                this.setState({
                    view: 'thanks'
                });
            }        
            
            // analytics events
        }        
    }

    renderEmailFields( field ) {
        if ( this.props.intent === 'email' ) {
            return (
                <div>
                    <Field
                        type="hidden"
                        name="subject"                        
                        {...field}
                    />
        
                    <Field
                        type="textarea"
                        name="body"
                        label="Email Message"
                        {...field}
                    />
                </div>
            );
        }
        
        return null;       
    }

    renderForm( meta ) {
        const { touched, handleSubmit, isSubmitting, values } = meta;

        const field = { 
            values: values, 
            errors: meta.errors,
            touched: meta.touched,
            input: {                
                onBlur: meta.handleBlur, 
                onChange: meta.handleChange,   
            }                                                          
        };

        return (
            <form onSubmit={ handleSubmit }>
                <Field
                    type="title"
                    name="prefix"
                    label="Title"
                    {...field}
                    required
                />
                
                <Field
                    type="text"
                    name="firstname"
                    label="First Name"
                    {...field}
                    required
                />

                <Field
                    type="text"
                    name="lastname"
                    label="Last Name"
                    {...field}
                    required
                />

                <Field
                    type="email"
                    name="email"
                    label="Email Address"
                    {...field}
                    required
                />

                <Field
                    type="tel"
                    name="phone"
                    label="Phone Number"
                    {...field}
                    required
                />

                <Field
                    type="text"
                    name="address"
                    label="Street Address"
                    {...field}
                    required
                />

                <Field
                    type="text"
                    name="zip"
                    label="Zip Code"
                    {...field}
                    required
                />
                                
                <button className="btn btn-primary" type="submit" disabled={ isSubmitting }>
                    {isSubmitting ? 'Submitting' : 'Submit'}
                </button>

                {this.renderEmailFields( field ) }
            </form>
        )
    }

    render() {
        const validator = validate.bind(this, { intent: this.props.intent });

        // If we want to prefill our form, we can set values here.
        const initialValues = {};
        

        if ( this.state.view === 'thanks' ) {
            return (
                <div dangerouslySetInnerHTML={{ __html: this.props.thanksContent }}></div>
            );
        }

        return (
            <div>
                {this.state.error &&
                    <div className="text-danger">
                        {this.state.error}
                    </div>
                }

                <Formik                    
                    validate={ validator }
                    render={ this.renderForm }
                    onSubmit={ this.handleSubmit }
                    initialValues={ initialValues }
                />
            </div>
        )
    } 
}

FiredUpPhone2Action.defaultProps = {
    intent: 'email',
    campaign: '12728',
    thanksRedirect: false,
    thanksContent: '<h2>Thank you for calling!</h2> Your will be connected with your representative shortly.',    

    functionsRoot: 'https://us-central1-fired-up-dev.cloudfunctions.net'
}; 

export default FiredUpPhone2Action;