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

  componentDidMount() {
    if (typeof window !== 'undefined') {
      window.fbAsyncInit = function() {
        FB.init({
          appId: process.env.FACEBOOK_APP_ID,
          autoLogAppEvents: true,
          xfbml: true,
          version: 'v3.0',
        });
      };

      (function(d, s, id) {
        var js,
          fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = 'https://connect.facebook.net/en_US/sdk.js';
        fjs.parentNode.insertBefore(js, fjs);
      })(document, 'script', 'facebook-jssdk');
    }
  }

  renderMetaImage() {
    if (this.props.meta.image) {
      return [
        <meta
          content={this.props.meta.image}
          key={this.props.meta.image}
          property="og:image"
        />,
      ];
    }
  }

  renderMetaTags(metaInfo) {
    return metaInfo.map((metaBlock, i) => {
      return (
        <meta
          content={metaBlock.content}
          key={i}
          property={metaBlock.property}
        />
      );
    });
  }

  render() {
    const siteTitle = '';
    const facebookTitle = '';
    const twitterHandle = '';

    const pageTitle = `${
      this.props.meta.title ? this.props.meta.title + ' | ' : ''
    } ${siteTitle}`;

    const ogTitle = `${
      this.props.meta.title ? this.props.meta.title + ' | ' : ''
    } ${facebookTitle}`;

    const ogImage = this.props.meta.image;

    const ogDescription = this.props.meta.description;

    const metaInfo = [
      {
        property: 'og:title',
        content: ogTitle,
      },
      {
        property: 'og:description',
        content: ogDescription,
      },
      {
        property: 'og:image',
        content: ogImage,
      },
      {
        property: 'og:site_name',
        content: facebookTitle,
      },
      {
        property: 'description',
        content: ogDescription,
      },
      {
        property: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        property: 'twitter:site',
        content: twitterHandle,
      },
      {
        property: 'twitter:creator',
        content: twitterHandle,
      },
      {
        property: 'twitter:title',
        content: ogTitle,
      },
      {
        property: 'twitter:description',
        content: ogDescription,
      },
      {
        property: 'twitter:image',
        content: ogImage,
      },
    ];

    return (
      <Helmet title={pageTitle}>
        {this.props.meta.noindex && (
          <meta content="noindex" property="robots" />
        )}
        <link
          href="https://use.fontawesome.com/releases/v5.0.7/css/all.css"
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
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff" />
        {this.props.meta.description && (
          <meta name="description" content={this.props.meta.description} />
        )}
        {this.renderMetaImage()}
        {this.renderMetaTags(metaInfo)}
      </Helmet>
    );
  }
}

export default MetaProvider;
