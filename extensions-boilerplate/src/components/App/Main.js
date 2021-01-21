import React, { Component } from 'react';
// import axios from 'axios';
// import { Redirect } from 'react-router-dom';
import config from '../utils/config';


export default class Main extends Component {
    constructor(props) {
        super(props)
        this.makeLoginRedirectUrl = this.makeLoginRedirectUrl.bind(this);
    }

    makeLoginRedirectUrl() {
        return `https://www.donationalerts.com/oauth/authorize?client_id=${config.client_id}&redirect_uri=${config.redirect_uri_to_proc}&response_type=${config.response_type}&scope=${config.scope}`
    }


    render() {
        return (
            <div>
                <a href={this.makeLoginRedirectUrl()}>Click</a>
            </div>
        );
    }
}
