import React from 'react';
import Helmet from 'react-helmet';

class MetaProvider extends React.Component {
  static defaultProps = {
    meta: {},
  };

  static async getInitialProps({ req }) {
    if (req) {
      Helmet.renderStatic();
    }

    return {};
  }

  render() {
    const siteTitle = 'Fired Up';

    const pageTitle = `${
      this.props.meta.title ? this.props.meta.title + ' | ' : ''
    } ${siteTitle}`;

    return (
      <Helmet title={pageTitle}>
        <meta content="noindex" property="robots" />
        <link
          href="https://use.fontawesome.com/releases/v5.8.1/css/all.css"
          rel="stylesheet"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/static/img/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/static/img/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/static/img/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/static/img/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/static/img/favicon/safari-pinned-tab.svg"
          color="#5bbad5"
        />
        <meta name="theme-color" content="#ffffff" />
      </Helmet>
    );
  }
}

export default MetaProvider;
