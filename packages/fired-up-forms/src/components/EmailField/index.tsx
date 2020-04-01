import * as React from 'react';
import cx from 'classnames';
import _omit from 'lodash/omit';
import * as mailcheck from 'mailcheck';

type EmailProps = {
  error?: string;
  className: string;
  isInvalid: boolean;
  label?: string;
  placeholder: string;
  onBlur: (event) => void;
  onChange: (event) => void;
  setFieldValue: (fieldName: string, value: string) => void;
};

type EmailState = {
  suggestedEmail: string;
};

class CustomFieldEmail extends React.Component<EmailProps, EmailState> {
  state = {
    suggestedEmail: '',
  };

  readonly handleChange = event => {
    this.props.onChange(event);

    this.setState({
      suggestedEmail: '',
    });
  };

  readonly handleBlur = event => {
    this.props.onBlur(event);

    mailcheck.run({
      email: event.target.value,
      empty: () => {
        if (this.state.suggestedEmail === '') {
          return;
        }

        this.setState({
          suggestedEmail: '',
        });
      },
      suggested: suggestion => {
        this.setState({
          suggestedEmail: suggestion.full,
        });
      },
    });
  };

  readonly setEmail = event => {
    event.preventDefault();

    this.props.setFieldValue('email_address', this.state.suggestedEmail);

    this.setState({
      suggestedEmail: '',
    });
  };

  render() {
    const fieldClasses = cx(this.props.className, {
      'is-invalid': this.state.suggestedEmail,
      'is-invalid--warning': this.state.suggestedEmail,
    });

    return (
      <div>
        {this.props.label && (
          <label className="control-label">{this.props.label}</label>
        )}
        <input
          type="email"
          className={fieldClasses}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          aria-label={this.props.placeholder}
          {..._omit(this.props, [
            'className',
            'isInvalid',
            'onBlur',
            'onChange',
            'setFieldValue',
          ])}
        />
        {this.state.suggestedEmail && !this.props.isInvalid && (
          <div className="invalid-feedback invalid-feedback--warning">
            Did you mean{' '}
            <a href="#" onClick={this.setEmail}>
              {this.state.suggestedEmail}
            </a>
          </div>
        )}
        {this.props.isInvalid && (
          <div className="invalid-feedback">{this.props.error}</div>
        )}
      </div>
    );
  }
}

export default CustomFieldEmail;
