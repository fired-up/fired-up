import React from 'react';
import cx from 'classnames';

import CustomFieldEmail from '../EmailField';
import CustomFieldAddressAutocomplete from '../AddressAutocompleteField';

const CustomField = ({
  field,
  form: { touched, errors, setFieldValue, setFieldTouched, values },
  ...props
}) => {
  const fieldClasses = cx('form-control', {
    'is-invalid': touched[field.name] && errors[field.name],
  });

  if (props.type === 'textarea') {
    return (
      <div>
        {props.label && <label className="control-label">{props.label}</label>}
        <textarea
          aria-label={props.placeholder}
          className={fieldClasses}
          rows={6}
          {...field}
          {...props}
        />
        {touched[field.name] && (
          <div className="invalid-feedback">{errors[field.name]}</div>
        )}
      </div>
    );
  } else if (props.type === 'radio') {
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
        {touched[field.name] && (
          <div className="invalid-feedback">{errors[field.name]}</div>
        )}
      </div>
    );
  } else if (props.type === 'select') {
    const keys = Object.keys(props.values);

    return (
      <div>
        {props.label && (
          <label className="control-label" htmlFor={field.name}>
            {props.label}
          </label>
        )}
        <select className={fieldClasses} id={field.name} {...field} {...props}>
          <option value="" disabled>
            {props.lang !== 'es' ? 'Choose a response' : 'Elige una respuesta'}
          </option>

          {keys.map(key => {
            const value = props.values[key];

            return (
              <option key={key} value={value.value}>
                {value.label}
              </option>
            );
          })}
        </select>
        {touched[field.name] && (
          <div className="invalid-feedback">{errors[field.name]}</div>
        )}
      </div>
    );
  } else if (props.type === 'checkbox') {
    const checkboxClasses = cx('checkbox', 'form-check', {
      'is-invalid': touched[field.name] && errors[field.name],
    });

    return (
      <div className={checkboxClasses}>
        <label>
          <input
            type="checkbox"
            className="form-check-input"
            {...field}
            {...props}
            value={true}
          />
          {props.label}
        </label>
        {touched[field.name] && (
          <div className="invalid-feedback">{errors[field.name]}</div>
        )}
      </div>
    );
  } else if (props.type === 'address') {
    return (
      <>
        <label className="control-label">{props.label}</label>
        <CustomFieldAddressAutocomplete
          bounds={props.bounds}
          defaultValue={props.defaultValue}
          errors={errors[field.name]}
          field={field}
          placeholder={props.placeholder}
          setFieldTouched={setFieldTouched}
          setFieldValue={setFieldValue}
          touched={touched[field.name]}
        />
      </>
    );
  } else if (props.type === 'email') {
    const emailInvalid = touched[field.name] && errors[field.name];

    return (
      <CustomFieldEmail
        className={fieldClasses}
        error={errors[field.name]}
        isInvalid={emailInvalid}
        setFieldValue={setFieldValue}
        {...field}
        {...props}
      />
    );
  } else if (props.type === 'checkbox_group') {
    const checkboxGroupInvalid = touched[field.name] && errors[field.name];

    return (
      <div>
        {props.label && <label className="control-label">{props.label}</label>}

        {props.values.map((valueGroup, key) => {
          return (
            <div key={key} className="form-check">
              <label>
                <input
                  type="checkbox"
                  name={valueGroup.value}
                  value={valueGroup.value}
                  className="form-check-input"
                  onChange={event => {
                    props.onChange(event, valueGroup.value);
                    setFieldTouched(field.name);
                    setFieldValue(valueGroup.value, event.target.checked);
                  }}
                />
                {valueGroup.label}
              </label>
            </div>
          );
        })}

        {touched[field.name] && (
          <div className="invalid-feedback">{errors[field.name]}</div>
        )}
      </div>
    );
  }

  return (
    <div>
      {props.label && <label className="control-label">{props.label}</label>}
      <input
        className={fieldClasses}
        type="text"
        aria-label={props.placeholder}
        {...field}
        {...props}
      />
      {touched[field.name] && (
        <div className="invalid-feedback">{errors[field.name]}</div>
      )}
    </div>
  );
};

export default CustomField;
