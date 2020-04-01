import { Formik, Field, FormikValues, FormikActions } from 'formik';
import cx from 'classnames';
import React from 'react';

import {
  buildInitialValues,
  storeUTM,
  validationBuilder,
} from './library/utils';
import forms, { processFields } from './library/forms';

import { userContext } from 'fired-up-core/src/library/user';
import CustomField from './components/CustomField';

interface IFormProps {
  buttonClass?: string;
  formCustomTasks?: Array<string>;
  formFields: Array<Array<any>>;
  formHandleSubmit?: Function;
  formId: string;
  formPhoneCheckboxCopy?: string;
  formSubmitLabel?: string;
  lang?: string;
}

interface IFormState {
  error?: any;
  fields: object;
}

class FiredUpForm extends React.Component<IFormProps, IFormState> {
  state = {
    fields: {},
    error: null,
  };

  static contextType = userContext;

  static defaultProps = {
    formFields: [],
    formId: '%default-form-id%',
    formSubmitLabel: 'Submit Form',
    formPhoneCheckboxCopy: 'Yes, I’d like to receive updates over text.',
  };

  private formRef = React.createRef<HTMLDivElement>();

  componentDidMount() {
    storeUTM();
    forms.getSignupContext();
  }

  readonly handleSubmit = async (
    fields: FormikValues,
    formikActions: FormikActions<FormikValues>
  ) => {
    const fieldsForSubmission = processFields(fields, this.props.formFields);

    // store fields in user traits
    let newValues = {};
    for (const i in fieldsForSubmission) {
      const value = fieldsForSubmission[i];

      if (value) {
        newValues[i] = value;
      }
    }

    try {
      await forms.submit(
        fieldsForSubmission,
        'signup',
        this.props.formId,
        this.props.formCustomTasks
      );

      this.formRef.current.dispatchEvent(
        new CustomEvent('firedup-forms-submitted', {
          bubbles: true,
          detail: {
            fields,
            formID: this.props.formId,
          },
        })
      );
    } catch (error) {
      this.formRef.current.dispatchEvent(
        new CustomEvent('firedup-forms-errored', {
          bubbles: true,
          detail: {
            error,
            formID: this.props.formId,
          },
        })
      );
    }

    formikActions.setStatus({
      isDoneSubmitting: true,
    });
    // formikActions.setSubmitting(false);

    if (typeof this.props.formHandleSubmit === 'function') {
      this.props.formHandleSubmit(fields);
    }
  };

  readonly handleChange = (name, value) => {
    const fields = {
      ...this.state.fields,
      [name]: value,
    };

    this.formRef.current.dispatchEvent(
      new CustomEvent('firedup-forms-changed', {
        bubbles: true,
        detail: {
          fields,
          formID: this.props.formId,
        },
      })
    );

    this.setState({ fields });
  };

  renderSubmitButton() {
    return (
      <button
        className={
          this.props.buttonClass ? this.props.buttonClass : 'btn btn-success'
        }
        type="submit"
      >
        {this.props.formSubmitLabel}
      </button>
    );
  }

  render() {
    const initialValues = buildInitialValues(this.props.formFields);
    const validationSchema = validationBuilder(
      this.props.formFields,
      this.state.fields,
      this.props.lang
    );

    return (
      <>
        {this.state.error && (
          <div className="text-danger">{this.state.error}</div>
        )}

        <Formik
          enableReinitialize={true}
          initialValues={initialValues}
          onSubmit={this.handleSubmit}
          validationSchema={validationSchema}
          render={formProps => {
            let submitButtonRendered = false;

            return (
              <form onSubmit={formProps.handleSubmit} ref={this.formRef}>
                {this.props.formFields.map((row, i) => {
                  return (
                    <div className="row form-group" key={i}>
                      {row.map((field, j) => {
                        const fieldWrapperClasses = cx({
                          [`field-${field.name}`]: !!field.name,
                          [`field-type-${field.type}`]: !!field.type,
                          col: !field.cols || isNaN(Number(field.cols)),
                          [`col-md-${field.cols}`]: !isNaN(Number(field.cols)),
                          'field-is-required':
                            field.name === 'postal_code' ||
                            field.name === 'email_address' ||
                            field.required,
                        });

                        const onChange = event => {
                          let value;
                          let name = field.name;

                          // When we create generated fields (think checkboxes in a checkbox group) that don't map cleanly
                          // to a top level formik field, the event.target.name will contain the correct field name to set
                          if (
                            field.type === 'checkbox_group' &&
                            event.target.name
                          ) {
                            name = event.target.name;
                          }

                          // Checkboxes & checkbox groups should set true or false as the value
                          if (
                            field.type === 'checkbox' ||
                            field.type === 'checkbox_group'
                          ) {
                            value = event.target.checked;
                          } else {
                            value = event.target.value;
                          }

                          formProps.setFieldValue(name, value);

                          // Sets field values to state so we can access them outside of formik
                          this.handleChange(name, value);
                        };

                        if (field.type === 'submit') {
                          submitButtonRendered = true;

                          return (
                            <div className={fieldWrapperClasses} key={j}>
                              {this.renderSubmitButton()}
                            </div>
                          );
                        }

                        return (
                          <div className={fieldWrapperClasses} key={j}>
                            <Field
                              component={CustomField}
                              label={field.label}
                              maxLength={field.maxLength}
                              name={field.name}
                              onChange={onChange}
                              placeholder={field.placeholder}
                              type={field.type}
                              values={field.values || null}
                              lang={this.props.lang}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}

                {!submitButtonRendered && (
                  <div className="row">
                    <div className="col">{this.renderSubmitButton()}</div>
                  </div>
                )}
              </form>
            );
          }}
        />
      </>
    );
  }
}

export default FiredUpForm;
