import * as React from 'react';
import _forEach from 'lodash/forEach';

import AddressAutocomplete, {
  IAddressAutocomplete,
} from '../AddressAutocomplete';
import { FieldProps, FormikValues, Formik, FormikProps } from 'formik';

let fields = [];

type ACProps = {
  bounds?: Array<Array<Number>>;
  className?: any;
  defaultValue?: string;
  errors: string;
  field: any;
  placeholder?: string;
  setFieldTouched: (
    fieldName: string,
    isTouched?: boolean,
    shouldValidate?: boolean
  ) => void;
  setFieldValue: (key: string, value: string) => void;
  touched: boolean;
};

const CustomFieldAddressAutocomplete = (props: ACProps) => {
  const handleAddressChange = (addressField: IAddressAutocomplete) => {
    _forEach(addressField, (value, key) => {
      fields.push(key);
      // @ts-ignore
      props.setFieldValue(key, value);
    });
  };

  const handleAddressReset = () => {
    _forEach(fields, field => {
      props.setFieldValue(field, '');
    });
  };

  // If somebody doesn't choose an address from dropdown, this helps us capture their input
  const handleChange = event => {
    props.setFieldValue(props.field.name, event.target.value);
  };

  return (
    <AddressAutocomplete
      bounds={props.bounds}
      className={props.className}
      defaultValue={props.defaultValue}
      errors={props.errors}
      field={props.field}
      handlePlaceChanged={handleAddressChange}
      handleReset={handleAddressReset}
      placeholder={props.placeholder}
      setFieldTouched={props.setFieldTouched}
      touched={props.touched}
      handleChange={handleChange}
    />
  );
};

export default CustomFieldAddressAutocomplete;
