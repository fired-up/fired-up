import cx from 'classnames';
import React from 'react';

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
  handlePlaceChanged: (address: IAddressAutocomplete) => void;
  placeholder?: string;
};

type AddressAutocompleteState = {
  error: string;
};

import './AddressAutocomplete.scss';

class AddressAutocomplete extends React.Component<
  AddressAutocompleteProps,
  AddressAutocompleteState
> {
  private autocompleteField = React.createRef<HTMLInputElement>();

  constructor(props) {
    super(props);

    this.state = {
      error: '',
    };
  }

  componentDidMount() {
    const options = {
      types: ['address'],
      componentRestrictions: {
        country: 'us',
      },
    };

    const autocomplete = new google.maps.places.Autocomplete(
      this.autocompleteField.current,
      options
    );

    autocomplete.addListener('place_changed', async () => {
      const components = {};
      const place = await autocomplete.getPlace();

      if (!place.formatted_address) {
        return this.setState({
          error: 'invalid_address',
        });
      }

      place.formatted_address.replace(', USA', '');

      for (const component of place.address_components) {
        if (component.types[0] === 'administrative_area_level_1') {
          components[component.types[0]] = component.short_name;
        } else {
          components[component.types[0]] = component.long_name;
        }
      }

      const address = {
        address_line1: `${components['street_number'] || ''} ${
          components['route']
        }`,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        locality: components['locality'],
        postal_code: components['postal_code'],
        region: components['administrative_area_level_1']
          ? `${components['administrative_area_level_1']}`
          : null,
      };

      this.props.handlePlaceChanged(address);
    });
  }

  readonly handleChange = () => {
    if (this.state.error) {
      this.setState({
        error: '',
      });
    }
  };

  render() {
    const inputClasses = cx('form-control', {
      'has-error': this.state.error,
    });

    return (
      <div className="address-autocomplete form-group">
        <i className="fa fa-search" aria-hidden="true" />
        <input
          className={inputClasses}
          onChange={this.handleChange}
          placeholder={this.props.placeholder}
          ref={this.autocompleteField}
          type="text"
        />
        {this.state.error && (
          <small className="form-text text-danger">
            Please select an address from the dropdown
          </small>
        )}
      </div>
    );
  }
}

export default AddressAutocomplete;
