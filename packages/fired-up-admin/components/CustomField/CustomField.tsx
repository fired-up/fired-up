import cx from 'classnames';
import React from 'react';

const CustomInputComponent = ({
  field,
  form: { touched, errors, setFieldValue, values },
  ...props
}) => {
  const fieldClasses = cx('form-control', {
    'is-invalid': touched[field.name] && errors[field.name],
  });

  if (props.type === 'textarea') {
    return (
      <div>
        <textarea className={fieldClasses} {...field} {...props} />
        <div className="invalid-feedback">{errors[field.name]}</div>
      </div>
    );
  }

  if (props.type === 'radio') {
    const keys = Object.keys(props.values);

    const radioClasses = cx('radio', 'form-check', {
      'is-invalid': touched[field.name] && errors[field.name],
    });

    return (
      <div>
        {keys.map(key => {
          const value = props.values[key];

          return (
            <div className={radioClasses} key={key}>
              <label>
                <input
                  className="form-check-input"
                  checked={values[field.name] === key}
                  type="radio"
                  onClick={() => {
                    setFieldValue(field.name, key);
                  }}
                />
                {value}
              </label>
            </div>
          );
        })}
        <div className="invalid-feedback">{errors[field.name]}</div>
      </div>
    );
  }

  if (props.type === 'checkbox') {
    const keys = Object.keys(props.values);

    const checkboxClasses = cx('checkbox', 'form-check', {
      'is-invalid': touched[field.name] && errors[field.name],
    });

    return (
      <div>
        {keys.map(key => {
          const value = props.values[key];

          return (
            <div className={checkboxClasses} key={key}>
              <label>
                <input
                  className="form-check-input"
                  type="text"
                  value={key}
                  {...field}
                  {...props}
                />
                {value}
              </label>
            </div>
          );
        })}
        <div className="invalid-feedback">{errors[field.name]}</div>
      </div>
    );
  }

  return (
    <div>
      <input className={fieldClasses} type="text" {...field} {...props} />
      <div className="invalid-feedback">{errors[field.name]}</div>
    </div>
  );
};

export default CustomInputComponent;
