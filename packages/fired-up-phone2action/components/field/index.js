import cx from 'classnames';
import React, { Component } from 'react';
//import states from '../../data/abbreviations-state.json';

class Field extends Component {
    renderField() {
        const { input, name, label, type, values, touched, errors } = this.props;

        const fieldClasses = cx({
            'form-control': true,
            'is-invalid': touched[name] && errors[name]   
        })

        if (type === 'title') {
            return (
              <select {...input} name={name} className={fieldClasses}>
                <option value="" />
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Miss">Miss</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Dr.">Dr.</option>
              </select>
            );
          } else if ( type === 'textarea' ) {
            return (
                <textarea {...input}
                    name={ name }
                    rows={ this.props.rows || 10 }
                    className={ fieldClasses }
                    initialvalue={ values[name] }
                />
            )
        }

        return (
            <input {...input}
                type={ type }      
                name={ name }          
                className={ fieldClasses }
                defaultValue={ values[name] }
            />
        );
    }

    render() {
        const { label, name, touched, errors, required } = this.props;

        const fieldWrapperClasses = cx({
            'form-group': true
        });

        return (
            <div className={ fieldWrapperClasses }>
                { label && <label>{ label }{ required ? '*' : '' }</label> }

                { this.renderField() }

                { (errors[name] && touched[name]) && <div className="invalid-feedback">{ errors[name] }</div> }
            </div>
        );
    }
}

export default Field;