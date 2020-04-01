import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import React from 'react';
import { Editor } from 'react-draft-wysiwyg';
import { EditorState, convertToRaw, ContentState } from 'draft-js';

import './WYSIWYG.scss';

interface EditorComponentProps {
  content: string;
}

interface EditorComponentState {
  editorState: any;
  hasReceivedContent: boolean;
}

class EditorComponent extends React.Component<
  EditorComponentProps,
  EditorComponentState
> {
  constructor(props) {
    super(props);

    this.state = {
      hasReceivedContent: false,
      editorState: '',
    };

    this.onEditorStateChange = this.onEditorStateChange.bind(this);
  }

  componentDidUpdate() {
    if (this.state.hasReceivedContent) {
      return;
    }

    if (this.props.content) {
      this.updateEditorState(this.props.content);
      this.setState({
        hasReceivedContent: true,
      });
    }
  }

  updateEditorState(html) {
    const contentBlock = htmlToDraft(html);
    if (contentBlock) {
      const contentState = ContentState.createFromBlockArray(
        contentBlock.contentBlocks
      );

      const editorState = EditorState.createWithContent(contentState);
      this.setState({ editorState });
    }
  }

  readonly onEditorStateChange = editorState => {
    this.setState({
      editorState,
    });
  };

  /**
   * Provides access to content as a string
   * access via a ref on containing <WYSIWYG />
   * eg. `this.wysiwyg.current.getContent()`
   * https://reactjs.org/docs/refs-and-the-dom.html#creating-refs
   */
  readonly getContent = () => {
    if (!this.state.editorState) {
      return false;
    }

    return draftToHtml(
      convertToRaw(this.state.editorState.getCurrentContent())
    );
  };

  render() {
    const { editorState } = this.state;

    return (
      <div className="wysiwyg">
        <Editor
          editorClassName="form-control"
          editorState={editorState}
          onEditorStateChange={this.onEditorStateChange}
          toolbar={{
            options: [
              'inline',
              'blockType',
              'fontSize',
              'fontFamily',
              'list',
              'textAlign',
              'colorPicker',
              'link',
              'image',
              'remove',
              'history',
            ],
          }}
          wrapperClassName="wysiwyg-wrapper"
        />
      </div>
    );
  }
}

export default EditorComponent;
