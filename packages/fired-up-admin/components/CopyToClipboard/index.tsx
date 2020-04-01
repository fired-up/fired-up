import cx from 'classnames';
import React, { RefObject } from 'react';

import autosize from 'fired-up-utils/autoresize';

import { Button, Input, Box } from '@material-ui/core';

interface CopyToClipboardProps {
  content: string;
  onCopy: (url: string) => void;
  type?: 'textArea' | 'textInput';
}

interface CopyToClipboardState {
  copied: boolean;
}

class CopyToClipboard extends React.Component<
  CopyToClipboardProps,
  CopyToClipboardState
> {
  static defaultProps: any;

  state = {
    copied: false,
  };

  private textInputRef = React.createRef<HTMLInputElement>();

  componentDidMount() {
    if (this.props.type === 'textArea') {
      autosize(this.textInputRef.current);
    }
  }

  readonly handleLinkSelect = () => {
    const copyTextArea: RefObject<HTMLInputElement> = this.textInputRef;
    copyTextArea.focus();
    copyTextArea.select();

    try {
      document.execCommand('copy');
      this.setState({ copied: true }, () => {
        if (this.props.onCopy) {
          this.props.onCopy(this.props.content);
        }
      });
    } catch (err) {
      console.log('Unable to copy');
    }

    window.setTimeout(() => {
      this.setState({ copied: false });
    }, 3500);
  };

  renderCopyableText() {
    if (typeof window !== 'undefined') {
      window.ref = this.textInputRef;
    }

    if (this.props.type === 'textArea') {
      return (
        <textarea
          autoCorrect="false"
          className="form-control copy-input"
          readOnly={true}
          ref={this.textInputRef}
          spellCheck={false}
          value={this.props.content}
        />
      );
    }

    return (
      <Input
        inputProps={{ ref: input => (this.textInputRef = input) }}
        type="text"
        value={this.props.content}
        style={{
          width: '100%',
        }}
      />
    );
  }

  render() {
    const containerClass = cx('copy-to-clipboard', {
      'type-textarea': this.props.type === 'textArea',
      'type-input': this.props.type === 'textInput',
    });

    return (
      <div className={containerClass}>
        <Box display="flex">
          {this.renderCopyableText()}
          <Box marginLeft={1}>
            <Button
              color="primary"
              disabled={this.state.copied}
              onClick={this.handleLinkSelect}
              variant="contained"
            >
              {this.state.copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>
        </Box>
      </div>
    );
  }
}

CopyToClipboard.defaultProps = {
  type: 'textInput',
};

export default CopyToClipboard;
