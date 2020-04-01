import React, { useState, useEffect } from 'react';

import EditIcon from '@material-ui/icons/Edit';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import CancelIcon from '@material-ui/icons/Cancel';
import { IconButton, Box, TextField, Button } from '@material-ui/core';

interface EditableFieldProps {
  content: string;
  onSave: (updatedContent: string) => void;
}

const EditableField = (props: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [updatedValue, setUpdatedValue] = useState(props.content);

  let initialValue;
  useEffect(() => {
    initialValue = props.content;
  }, []);

  function handleSave() {
    props.onSave(updatedValue);
  }

  function handleCancel() {
    setUpdatedValue(initialValue);
    setIsEditing(false);
  }

  function handleChange(e) {
    setUpdatedValue(e.target.value);
  }

  if (!isEditing) {
    return (
      <Box display="flex">
        {props.content}
        <Box marginLeft={1}>
          <IconButton
            color="primary"
            aria-label="edit field"
            component="span"
            size="small"
            onClick={() => setIsEditing(true)}
          >
            <EditIcon fontSize="inherit" />
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center">
      <TextField
        value={updatedValue}
        margin="none"
        size="small"
        onChange={handleChange}
      />
      <IconButton
        color="primary"
        aria-label="cancel"
        component="span"
        size="small"
      >
        <CancelIcon fontSize="inherit" onClick={handleCancel} />
      </IconButton>
      <IconButton
        color="primary"
        aria-label="save"
        component="span"
        size="small"
      >
        <CheckCircleIcon fontSize="inherit" />
      </IconButton>
    </Box>
  );
};

export default EditableField;
