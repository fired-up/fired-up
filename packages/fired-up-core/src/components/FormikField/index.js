import cx from 'classnames';
import React from 'react';
import Select from 'react-select';

import 'react-select/scss/default.scss';

const stateData = require('./stateData.json');

class Field extends React.Component {
  constructor(props) {
    super(props);

    this.fieldRefs = {};

    let multiselectValue = [];

    if (props.type === 'multiselect' && props.values[props.name]) {
      multiselectValue = props.values[props.name].join(',');
    }

    this.state = {
      multiselectValue,
    };

    this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
    this.handleMultiSelectChange = this.handleMultiSelectChange.bind(this);
  }

  componentDidMount() {
    if (this.props.type === 'google-autocomplete') {
      const autocomplete = new google.maps.places.Autocomplete(
        this.fieldRefs[this.props.name],
        { types: ['address'] }
      );

      autocomplete.setComponentRestrictions({
        country: ['us', 'pr', 'vi', 'gu', 'mp'],
      });

      autocomplete.addListener('place_changed', () => {
        const address = {};
        const components = {};
        const place = autocomplete.getPlace();

        // Don't show "USA" in value since that looks silly
        const full = place.formatted_address.replace(', USA', '');
        this.props.setFieldValue(this.props.name, full);

        for (const component of place.address_components) {
          components[component.types[0]] = component.long_name;
        }

        // If somebody doesn't enter a full address and just a city name, we don't get
        address.address_line1 = `${components.street_number || ''} ${
          components.route
        }`;
        address.locality = components.locality
          ? `${components.locality}`
          : null;
        address.region = components.administrative_area_level_1
          ? `${components.administrative_area_level_1}`
          : null;
        address.postal_code = components.postal_code
          ? `${components.postal_code}`
          : null;

        address.region =
          stateData.longForm[
            components.administrative_area_level_1.toLowerCase()
          ];

        address.latitude = place.geometry.location.lat();
        address.longitude = place.geometry.location.lng();

        for (const i in address) {
          this.props.setFieldValue(i, address[i]);
        }
      });
    }
  }

  handleMultiSelectChange(value) {
    this.setState({ multiselectValue: value }, () => {
      this.props.setFieldValue(this.props.name, value.split(','));
    });
  }

  handleCheckboxChange(event) {
    this.props.setFieldValue(this.props.name, event.target.checked);
  }

  renderSelect(fieldClasses) {
    return (
      <select
        className={fieldClasses}
        name={this.props.name}
        value={this.props.values[this.props.name]}
        defaultValue=""
        defaultSelected=""
        {...this.props.input}
      >
        <option value="" disabled>
          Select an Option...
        </option>

        {this.props.selectOptions.map(option => {
          return (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          );
        })}
      </select>
    );
  }

  renderMultiselect() {
    return (
      <React.Fragment>
        <Select
          multi
          onChange={this.handleMultiSelectChange}
          options={this.props.selectOptions}
          placeholder="Select one or many"
          simpleValue
          value={this.state.multiselectValue}
        />
      </React.Fragment>
    );
  }

  renderTextarea(fieldClasses) {
    return (
      <textarea
        {...this.props.input}
        className={fieldClasses}
        defaultValue={this.props.values[this.props.name]}
        name={this.props.name}
        placeholder={this.props.placeholder}
        rows={this.props.rows || 4}
      />
    );
  }

  renderCheckbox() {
    return (
      <div className="form-check">
        <input
          {...this.props.input}
          className="form-check-input"
          defaultChecked={this.props.values[this.props.name]}
          id={`field-${this.props.name}`}
          onChange={this.handleCheckboxChange}
          type="checkbox"
        />
        <label
          className="form-check-label"
          htmlFor={`field-${this.props.name}`}
        >
          {this.props.placeholder}
        </label>
      </div>
    );
  }

  renderTitle(fieldClasses) {
    return (
      <select
        {...this.props.input}
        className={fieldClasses}
        name={this.props.name}
      >
        <option value="" />
        <option value="Mr.">Mr.</option>
        <option value="Ms.">Ms.</option>
        <option value="Miss">Miss</option>
        <option value="Mrs.">Mrs.</option>
        <option value="Dr.">Dr.</option>
      </select>
    );
  }

  renderGeoField(fieldClasses) {
    return (
      <input
        {...this.props.input}
        className={fieldClasses}
        defaultValue={this.props.values[this.props.name]}
        name={this.props.name}
        placeholder={this.props.placeholder}
        ref={me => {
          this.fieldRefs[this.props.name] = me;
        }}
        type="text"
      />
    );
  }

  renderInput(fieldClasses) {
    return (
      <input
        {...this.props.input}
        className={fieldClasses}
        defaultValue={this.props.values[this.props.name]}
        name={this.props.name}
        onBlur={this.props.handleBlur}
        placeholder={this.props.placeholder}
        type={this.props.type}
      />
    );
  }

  renderField() {
    const fieldClasses = cx({
      'form-control': true,
      'is-invalid':
        this.props.touched[this.props.name] &&
        this.props.errors[this.props.name],
    });

    switch (this.props.type) {
      case 'select':
        return this.renderSelect(fieldClasses);

      case 'multiselect':
        return this.renderMultiselect();

      case 'textarea':
        return this.renderTextarea(fieldClasses);

      case 'checkbox':
        return this.renderCheckbox();

      case 'title':
        return this.renderTitle(fieldClasses);

      case 'google-autocomplete':
        return this.renderGeoField(fieldClasses);

      default:
        return this.renderInput(fieldClasses);
    }
  }

  renderInvalidFeedback() {
    if (
      this.props.errors[this.props.name] &&
      this.props.touched[this.props.name]
    ) {
      return (
        <div className="invalid-feedback">
          {this.props.errors[this.props.name]}
        </div>
      );
    }

    return null;
  }

  renderLabel() {
    if (!this.props.label) {
      return null;
    }

    return (
      <label>
        {this.props.label}
        {this.props.required ? '*' : ''}
      </label>
    );
  }

  renderFieldHelper() {
    if (!this.props.helperText) {
      return null;
    }

    return (
      <small className="form-text text-muted">{this.props.helperText}</small>
    );
  }

  render() {
    const fieldWrapperClasses = cx({
      'form-group': true,
    });

    return (
      <div className={fieldWrapperClasses}>
        {this.renderLabel()}
        {this.props.helpTextAbove && (
          <div className="help-text">{this.props.helpTextAbove}</div>
        )}
        {this.renderField()}
        {this.renderFieldHelper()}
        {this.renderInvalidFeedback()}
      </div>
    );
  }
}

export default Field;
