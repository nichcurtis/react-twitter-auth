import React, { Component } from 'react';
import PropTypes from 'prop-types';
import 'whatwg-fetch'
import 'url-search-params-polyfill';


class TwitterLogin extends Component {

  constructor(props) {
    super(props);

    this.onButtonClick = this.onButtonClick.bind(this);
  }

  onButtonClick() {
    return this.getRequestToken();
  }

  getRequestToken() {
    return window.fetch(this.props.requestTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return response.json();
    }).then(data => {
      this.openPopup(data.oauth_token);
    }).catch(error => {
      return this.props.onFailure(error);
    });
  }

  openPopup(token) {
    const w = 450;
    const h = 300;
    const left = (screen.width/2)-(w/2);
    const top = (screen.height/2)-(h/2);
    const popup = window.open(`https://api.twitter.com/oauth/authenticate?oauth_token=${token}`, '', 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width='+w+', height='+h+', top='+top+', left='+left);

    this.polling(popup);
  }

  polling(popup) {
    const polling = setInterval(() => {
      if (!popup || popup.closed || popup.closed === undefined) {
        clearInterval(polling);
        this.props.onFailure(new Error('Popup has been closed by user'));
      }

      try {
        if (!popup.location.hostname.includes('api.twitter.com')) {
          if (popup.location.search) {
            const query = new URLSearchParams(popup.location.search);

            const oauthToken = query.get('oauth_token');
            const oauthVerifier = query.get('oauth_verifier');

            this.getOathToken(oauthVerifier, oauthToken);
          } else {
            this.props.onFailure(new Error(
              'OAuth redirect has occurred but no query or hash parameters were found. ' +
              'They were either not set during the redirect, or were removed—typically by a ' +
              'routing library—before Twitter react component could read it.'
            ));
          }

          clearInterval(polling);
          popup.close();
        }
      } catch (error) {
        // Ignore DOMException: Blocked a frame with origin from accessing a cross-origin frame.
        // A hack to get around same-origin security policy errors in IE.
      }
    }, 500);
  }

  getOathToken(oAuthVerifier, oauthToken) {
    return window.fetch(`${this.props.loginUrl}?oauth_verifier=${oAuthVerifier}&oauth_token=${oauthToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }).then(response => {
      return response.json();
    }).then(data => {
      this.props.onSuccess(data);
    }).catch(error => {
      return this.props.onFailure(error);
    });
  }

  render() {
    const twitterButton = React.createElement(
      this.props.tag, {
        onClick: this.onButtonClick
      }, this.props.children ? this.props.children : this.props.text
    );
    return twitterButton;
  }
}

TwitterLogin.propTypes = {
  tag: PropTypes.string,
  text: PropTypes.string,
  loginUrl: PropTypes.string.isRequired,
  requestTokenUrl: PropTypes.string.isRequired,
  onFailure: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired
};

TwitterLogin.defaultProps = {
  tag: 'button',
  text: 'Sign up with Twitter'
};

export default TwitterLogin;
