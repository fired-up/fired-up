/* global google: true */
import _get from 'lodash/get';
import _isNumber from 'lodash/isNumber';
import _trimEnd from 'lodash/trimEnd';
import * as React from 'react';
import axios from 'axios';
import cx from 'classnames';
import qs from 'qs';

export interface IAddressAutocomplete {
  address_line1: string;
  lat: number;
  lng: number;
  locality: string;
  postal_code: string;

  /**
   * A state's name (eg. "New Mexico")
   */
  region: string;
}

type AddressAutocompleteProps = {
  bounds?: Array<Array<Number>>;
  className?: any;
  defaultValue?: string;
  errors?: string;
  field?: any;
  handlePlaceChanged: (address: IAddressAutocomplete) => void;
  handleReset?: () => void;
  placeholder?: string;
  setFieldTouched?: (
    fieldName: string,
    isTouched?: boolean,
    shouldValidate?: boolean
  ) => void;
  touched?: boolean;
  handleChange?: (event: any) => void;
};

type AddressAutocompleteState = {
  error: string;
  hasSelectedAddress: boolean;
};

class AddressAutocomplete extends React.Component<
  AddressAutocompleteProps,
  AddressAutocompleteState
> {
  private autocompleteField = React.createRef<HTMLInputElement>();

  state = {
    error: '',
    hasSelectedAddress: false,
  };

  componentDidMount() {
    const options = {
      types: ['address'],
      componentRestrictions: {
        country: 'us',
      },
    };

    if (this.props.defaultValue) {
      this.verifyDefaultAddress();
    }

    if (this.props.bounds) {
      const { bounds } = this.props;

      const googleMapsBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(bounds[0][0], bounds[0][1]),
        new google.maps.LatLng(bounds[1][0], bounds[1][1])
      );

      options.bounds = googleMapsBounds;
    }

    // @ts-ignore
    const autocomplete = new google.maps.places.Autocomplete(
      this.autocompleteField.current,
      options
    );

    autocomplete.setFields(['address_components', 'geometry']);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        return this.setState({
          error: 'invalid_address',
        });
      }

      const address = this.buildAddress(place);

      this.setState(
        {
          hasSelectedAddress: true,
        },
        () => {
          this.props.handlePlaceChanged(address);
        }
      );
    });
  }

  /**
   * @param {object} - A google maps Place
   */
  readonly buildAddress = place => {
    const components = {};

    for (const component of place.address_components) {
      if (
        component.types[0] === 'administrative_area_level_1' ||
        component.types[0] === 'route'
      ) {
        components[component.types[0]] = component.short_name;
      } else {
        components[component.types[0]] = component.long_name;
      }
    }

    const address = {
      address_line1: `${components['street_number'] || ''} ${
        components['route']
      }`,
      lat: _isNumber(place.geometry.location.lat)
        ? place.geometry.location.lat
        : place.geometry.location.lat(),
      lng: _isNumber(place.geometry.location.lng)
        ? place.geometry.location.lng
        : place.geometry.location.lng(),
      locality: components['locality'],
      postal_code: components['postal_code'],
      region: components['administrative_area_level_1']
        ? `${components['administrative_area_level_1']}`
        : null,
    };

    return address;
  };

  readonly verifyDefaultAddress = async () => {
    try {
      const params = qs.stringify({
        address: this.props.defaultValue,
        key: process.env.GOOGLE_MAPS_KEY,
        region: 'us',
      });

      const { data } = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?${params}`
      );
      const address = this.buildAddress(data.results[0]);

      let addressString = '';
      addressString += address.address_line1
        ? `${address.address_line1}, `
        : '';
      addressString += address.locality ? `${address.locality}, ` : '';
      addressString += address.region ? `${address.region}, ` : '';
      addressString += address.postal_code ? `${address.postal_code}` : '';
      addressString = _trimEnd(addressString, ', ');

      // Note: the returned response is literally the string ' undefined'
      if (address.address_line1 && address.address_line1 !== ' undefined') {
        this.autocompleteField.current.value = addressString;
        this.props.handlePlaceChanged(address);
      }
    } catch (err) {
      console.log(err);
    }
  };

  readonly handleChange = event => {
    if (this.props.handleChange) {
      this.props.handleChange(event);
    }

    if (this.state.error) {
      this.setState({
        error: '',
      });
    }
  };

  readonly handleBlur = e => {
    if (this.props.setFieldTouched) {
      this.props.setFieldTouched(this.props.field.name, true);
    }

    if (e.target.value === '') {
      this.props.handleReset && this.props.handleReset();
    }
  };

  readonly resetSearch = e => {
    e.preventDefault();
    this.autocompleteField.current.value = '';
    this.props.handleReset && this.props.handleReset();
    this.setState({
      hasSelectedAddress: false,
    });
  };

  render() {
    const inputClasses = cx('form-control', {
      'has-error': this.state.error,
      'is-invalid':
        (this.state.error || this.props.errors) && this.props.touched,
      [this.props.className]: this.props.className,
    });

    return (
      <div className="address-autocomplete">
        <style>
          {`
.address-autocomplete {
  position: relative;
  text-align: left;
}
`}
        </style>
        <input
          aria-label={this.props.placeholder}
          autoComplete="off"
          className={inputClasses}
          onBlur={this.handleBlur}
          onChange={this.handleChange}
          placeholder={this.props.placeholder}
          ref={this.autocompleteField}
          type="text"
        />
        {this.props.errors && this.props.touched && (
          <div className="invalid-feedback">{this.props.errors}</div>
        )}
      </div>
    );
  }
}

export default AddressAutocomplete;
