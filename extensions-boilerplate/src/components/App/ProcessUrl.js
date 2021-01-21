import React, { Component } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import qs from 'qs';
import config from '../utils/config';
import axios from 'axios';

function compareDate(date1, date2) {
    return (date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate())
}

function compareWeek(date1, date2) {
    date1 = new Date(date1.toISOString().split('T')[0])
    date2 = new Date(date2.toISOString().split('T')[0])
    const minusDays = (date1 - date2) / 1000 / 60 / 60 / 24
    return (date1.getDay() > minusDays)
}

function compareMonth(date1, date2) {
    return (date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth())
}

function compareYear(date1, date2) {
    return (date1.getFullYear() === date2.getFullYear())
}

export default class ProcessUrl extends Component {
    constructor(props) {
        super(props);

        const code = qs.parse(this.props.location.search, { ignoreQueryPrefix: true }).code || null;
        this.state = {
            code
            , expiresIn: null
            , refreshToken: null
            , accessToken: null
            , tokenType: null

            , userId: null
            , userEmail: null
            , userAvatar: null
            , userName: null

            , donatorsAll: {}
            , donatorsCurrYear: {}
            , donatorsCurrMonth: {}
            , donatorsCurrWeek: {}
            , donatorsCurrDay: {}
            , lastDate: null

            , topDonatorsAll: []
            , topDonatorsYear: []
            , topDonatorsMonth: []
            , topDonatorsWeek: []
            , topDonatorsDay: []

            , setIntervalHandler: null

        };

        this.requestAuthToken = this.requestAuthToken.bind(this);
        this.requestUserProfileInformation = this.requestUserProfileInformation.bind(this);
        this.requestDonationAlertsList = this.requestDonationAlertsList.bind(this);
        this.calculateTop = this.calculateTop.bind(this);
        this.startUpdate = this.startUpdate.bind(this);
    }

    async requestAuthToken() {
        const payload = {
            grant_type:         config.grant_type
            , client_id:        config.client_id
            , client_secret:    config.client_secret
            , redirect_uri:     config.redirect_uri_to_proc
            , code:             this.state.code
        };

        const authRes = (await axios.post('https://www.donationalerts.com/oauth/token', payload)).data;
        this.setState({expiresIn:   authRes.expires_in
                    , refreshToken: authRes.refresh_token
                    , accessToken:  authRes.access_token
                    , tokenType:    authRes.token_type
                });
        // console.log(authRes);
    }
    // chrome.exe --user-data-dir="C://Chrome dev session" --disable-web-security --user-data-dir="C://Users/User/AppData/Local/Google/Chrome/User Data"
    async requestUserProfileInformation() {
        
        const auth = {
            headers: {
                Authorization: `${this.state.tokenType} ${this.state.accessToken}`
            }
        };
        const userRes = (await axios.get('https://www.donationalerts.com/api/v1/user/oauth', auth)).data;
        this.setState({ userId:   userRes.data.id
                        , userEmail: userRes.data.email
                        , userAvatar: userRes.data.avatar
                        , userName: userRes.data.name
        });
        // console.log(userRes)
    };

    calculateTop() {
        const donatorsAll = this.state.donatorsAll
        const donatorsCurrYear = this.state.donatorsCurrYear
        const donatorsCurrMonth = this.state.donatorsCurrMonth
        const donatorsCurrWeek = this.state.donatorsCurrWeek
        const donatorsCurrDay = this.state.donatorsCurrDay
        // console.log("Donators", donatorsAll)

        const topDonatorsAll = []
        const topDonatorsYear = []
        const topDonatorsMonth = []
        const topDonatorsWeek = []
        const topDonatorsDay = []

        for (const prop in donatorsAll)  {
            // console.log("prop", prop)
            topDonatorsAll.push({userName: prop, amount: Math.round(donatorsAll[prop])})
        }
        for (const prop in donatorsCurrYear)  {
            topDonatorsYear.push({userName: prop, amount: Math.round(donatorsCurrYear[prop])})
        }
        for (const prop in donatorsCurrMonth)  {
            topDonatorsMonth.push({userName: prop, amount: Math.round(donatorsCurrMonth[prop])})
        }
        for (const prop in donatorsCurrWeek)  {
            topDonatorsWeek.push({userName: prop, amount: Math.round(donatorsCurrWeek[prop])})
        }
        for (const prop in donatorsCurrDay)  {
            topDonatorsDay.push({userName: prop, amount: Math.round(donatorsCurrDay[prop])})
        }

        topDonatorsAll.sort(function(a, b) {
            return b.amount - a.amount;
        })
        topDonatorsYear.sort(function(a, b) {
            return b.amount - a.amount;
        })
        topDonatorsMonth.sort(function(a, b) {
            return b.amount - a.amount;
        })
        topDonatorsWeek.sort(function(a, b) {
            return b.amount - a.amount;
        })
        topDonatorsDay.sort(function(a, b) {
            return b.amount - a.amount;
        })
        // console.log(topDonatorsAll)
        this.setState({topDonatorsAll: topDonatorsAll.slice(0, 20)})
        this.setState({topDonatorsYear: topDonatorsYear.slice(0, 20)})
        this.setState({topDonatorsMonth: topDonatorsMonth.slice(0, 20)})
        this.setState({topDonatorsWeek: topDonatorsWeek.slice(0, 20)})
        this.setState({topDonatorsDay: topDonatorsDay.slice(0, 20)})
    }


    mergeObj(obj, index, value) {
        if (!(index in obj)){
            obj[index] = value
        } else {
            obj[index] += value
        }
    }

    componentWillUnmount() {
        // When you want to cancel it:
        clearInterval(this.state.setIntervalHandler);
    }

    startUpdate() {
        this.requestDonationAlertsList()
        let handle = setInterval(this.requestDonationAlertsList, 30000)
        this.setState({setIntervalHandler: handle})
    }

    async requestDonationAlertsList() {
           
        const donat = {
            headers: {
                Authorization: `${this.state.tokenType} ${this.state.accessToken}`
            }
        };

        const donatorsAll = {}
        const donatorsCurrYear = {}
        const donatorsCurrMonth = {}
        const donatorsCurrWeek = {}
        const donatorsCurrDay = {}
        let donatRes = (await axios.get('https://www.donationalerts.com/api/v1/alerts/donations', donat)).data
        let check = 0
        let date = null
        const currData = new Date()
        console.log(donatRes)
        for (let i = 1; i <= donatRes.meta.last_page; ++i)
        {
            if (donatRes.data && donatRes.data.length && !(date)) {
                date = donatRes.data[0].created_at
            }
            if (i !== 1) {
                donatRes = (await axios.get(donatRes.links.next, donat));
                donatRes = donatRes.data;
            }
            for (let index = 0; index < donatRes.data.length; ++index) {
                if (this.state.lastDate && donatRes.data[index].created_at <= this.state.lastDate) {
                    check = 1
                    break
                }
                if (donatRes.data[index].username === "") {
                    continue
                }

                if (compareDate(currData, new Date(donatRes.data[index].created_at))) {
                    this.mergeObj(donatorsCurrDay, donatRes.data[index].username, donatRes.data[index].amount_in_user_currency)
                }

                if (compareWeek(currData, new Date(donatRes.data[index].created_at))) {
                    this.mergeObj(donatorsCurrWeek, donatRes.data[index].username, donatRes.data[index].amount_in_user_currency)
                }

                if (compareMonth(currData, new Date(donatRes.data[index].created_at))) {
                    this.mergeObj(donatorsCurrMonth, donatRes.data[index].username, donatRes.data[index].amount_in_user_currency)
                }

                if (compareYear(currData, new Date(donatRes.data[index].created_at))) {
                    this.mergeObj(donatorsCurrYear, donatRes.data[index].username, donatRes.data[index].amount_in_user_currency)
                }

                this.mergeObj(donatorsAll, donatRes.data[index].username, donatRes.data[index].amount_in_user_currency)
                
            }
            if (check === 1) {
                break
            }
        }

        const merger = (obj1, obj2) => {
            const concatObj = {...obj1};
            for (const prop in obj2) {
                if (prop in obj1) {
                    concatObj[prop] += obj2[prop];
                } else {
                    concatObj[prop] = obj2[prop];
                }
            }
            return concatObj;
        }

        if (donatRes.data && donatRes.data.length) {
            this.setState({lastDate: date})
        }

        this.setState({donatorsAll: merger(this.state.donatorsAll, donatorsAll),
            donatorsCurrDay: merger(this.state.donatorsCurrDay, donatorsCurrDay),
            donatorsCurrWeek: merger(this.state.donatorsCurrWeek, donatorsCurrWeek),
            donatorsCurrMonth: merger(this.state.donatorsCurrMonth, donatorsCurrMonth),
            donatorsCurrYear: merger(this.state.donatorsCurrYear, donatorsCurrYear)}, () => {

            console.log(this.state.lastDate);
            console.log("All", this.state.donatorsAll);
            console.log("Year", this.state.donatorsCurrYear);
            console.log("Month", this.state.donatorsCurrMonth);
            console.log("Week", this.state.donatorsCurrWeek);
            console.log("Day", this.state.donatorsCurrDay)
            this.calculateTop()
        })
        
    };

    
    render() {
        return (
            <div>
                {/* <p>Code: {this.state.code}</p> */}
                <button onClick={this.requestAuthToken}>Auth</button>

                {this.state.accessToken ?
                    (<React.Fragment>
                        <Tabs>
                            <TabList>
                                <Tab>All</Tab>
                                <Tab>Year</Tab>
                                <Tab>Month</Tab>
                                <Tab>Week</Tab>
                                <Tab>Day</Tab>
                            </TabList>

                            <TabPanel>
                            {/* All */}
                            {this.state.lastDate ?

                                this.state.topDonatorsAll.map((el) => (

                                    <div key = {el.userName}>
                            
                                        <hr/>
                                        <ul>
                                            <li><b>userName:</b> {el.userName}   </li>
                                            <li><b>current_donat:</b> {el.amount} </li>
                                        </ul>
                                    </div>
                                )) : null
                            }
                            </TabPanel>
                            <TabPanel>
                            {/* Year */}
                            {this.state.lastDate ?
                                this.state.topDonatorsYear.map((el) => (

                                    <div key = {el.userName}>
                            
                                        <hr/>
                                        <ul>
                                            <li><b>userName:</b> {el.userName}   </li>
                                            <li><b>current_donat:</b> {el.amount} </li>
                                        </ul>
                                    </div>
                                )) : null
                            }
                            </TabPanel>
                            <TabPanel>
                            {/* Month */}
                            {this.state.lastDate ?
                                this.state.topDonatorsMonth.map((el) => (

                                    <div key = {el.userName}>
                            
                                        <hr/>
                                        <ul>
                                            <li><b>userName:</b> {el.userName}   </li>
                                            <li><b>current_donat:</b> {el.amount} </li>
                                        </ul>
                                    </div>
                                )) : null
                            }
                            </TabPanel>
                            <TabPanel>
                            {/* Week */}
                            {this.state.lastDate ?
                                this.state.topDonatorsWeek.map((el) => (

                                    <div key = {el.userName}>
                            
                                        <hr/>
                                        <ul>
                                            <li><b>userName:</b> {el.userName}   </li>
                                            <li><b>current_donat:</b> {el.amount} </li>
                                        </ul>
                                    </div>
                                )) : null
                            }
                            </TabPanel>
                            <TabPanel>
                            {/* Day */}
                            {this.state.lastDate ?
                                this.state.topDonatorsDay.map((el) => (

                                    <div key = {el.userName}>
                            
                                        <hr/>
                                        <ul>
                                            <li><b>userName:</b> {el.userName}   </li>
                                            <li><b>current_donat:</b> {el.amount} </li>
                                        </ul>
                                    </div>
                                )) : null
                            }
                            </TabPanel>
                        </Tabs>
                        {/* <hr/>
                        <ul>
                            <li><b>accessToken:</b> {this.state.accessToken}   </li>
                            <li><b>refreshToken:</b> {this.state.refreshToken} </li>
                            <li><b>expiresIn:</b> {this.state.expiresIn}       </li>
                            <li><b>tokenType:</b> {this.state.tokenType}       </li>
                        </ul> */}
                        <button onClick={this.requestUserProfileInformation}>UserInfo</button>
                        {this.state.userId ?
                            (<>
                                <hr/>
                                <ul>
                                    <li><b>userName:</b> {this.state.userName}   </li>
                                    <li><b>userAvatar:</b></li>
                                    <img src={this.state.userAvatar} alt="userAvatar" />
                                    <li><b>userEmail:</b> {this.state.userEmail}       </li>
                                </ul>
                            </>) : null
                        }
                        {/* All
                        {this.state.lastDate ?

                            this.state.topDonatorsAll.map((el) => (

                                <div key = {el.userName}>
                        
                                    <hr/>
                                    <ul>
                                        <li><b>userName:</b> {el.userName}   </li>
                                        <li><b>current_donat:</b> {el.amount} </li>
                                    </ul>
                                </div>
                            )) : null
                        } */}
                        {/* Year
                        {this.state.lastDate ?
                            this.state.topDonatorsYear.map((el) => (

                                <div key = {el.userName}>
                        
                                    <hr/>
                                    <ul>
                                        <li><b>userName:</b> {el.userName}   </li>
                                        <li><b>current_donat:</b> {el.amount} </li>
                                    </ul>
                                </div>
                            )) : null
                        } */}
                        {/* Month
                        {this.state.lastDate ?
                            this.state.topDonatorsMonth.map((el) => (

                                <div key = {el.userName}>
                        
                                    <hr/>
                                    <ul>
                                        <li><b>userName:</b> {el.userName}   </li>
                                        <li><b>current_donat:</b> {el.amount} </li>
                                    </ul>
                                </div>
                            )) : null
                        } */}
                        {/* Week
                        {this.state.lastDate ?
                            this.state.topDonatorsWeek.map((el) => (

                                <div key = {el.userName}>
                        
                                    <hr/>
                                    <ul>
                                        <li><b>userName:</b> {el.userName}   </li>
                                        <li><b>current_donat:</b> {el.amount} </li>
                                    </ul>
                                </div>
                            )) : null
                        } */}
                        {/* Day
                        {this.state.lastDate ?
                            this.state.topDonatorsDay.map((el) => (

                                <div key = {el.userName}>
                        
                                    <hr/>
                                    <ul>
                                        <li><b>userName:</b> {el.userName}   </li>
                                        <li><b>current_donat:</b> {el.amount} </li>
                                    </ul>
                                </div>
                            )) : null
                        } */}
                        <button onClick={this.startUpdate}>DonatInfo</button>
                    </React.Fragment>) : null
                }
            </div>
        );
    }
}
