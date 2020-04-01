import React, { ReactChild } from 'react';

import ButtonLink from '../ButtonLink';

import { Typography, Box, Button } from '@material-ui/core';

interface TableHeaderProps {
  action: string;
  href: string;
  title: string;
  size?: string;
  startIcon?: ReactChild;
}

function TableHeader(props: TableHeaderProps) {
  return (
    <Box display="flex">
      <Typography variant="h6">{props.title}</Typography>
      <Box marginLeft={2}>
        <Button
          color="primary"
          component={ButtonLink}
          href={props.href}
          size="small"
          variant="contained"
          startIcon={props.startIcon}
        >
          {props.action}
        </Button>
      </Box>
    </Box>
  );
}

export default TableHeader;
