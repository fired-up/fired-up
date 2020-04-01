import React from 'react';
import { Box } from '@material-ui/core';
import { fonts } from '../../styles/variables';

export default props => {
  return (
    <Box color="#e83e8c" fontFamily={fonts.monospace} fontSize="87.5%">
      {props.children}
    </Box>
  );
};
