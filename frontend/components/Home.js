/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */

import React from 'react';
import ReactTooltip from 'react-tooltip';
import cx from 'classnames/bind';
import { Dropdown } from 'semantic-ui-react';

import 'semantic-ui-css/semantic.min.css';
import '../css/base.scss';

import aoun from './aouuuuuuuuun.png';
import SplashPage from './SplashPage/SplashPage';
import search from './search';
import FeedbackModal from './FeedbackModal';
import macros from './macros';
import ResultsLoader from './ResultsLoader';
import logo from './logo.svg';
import boston from './boston.svg';

// Home page component
class Home extends React.Component {
  constructor(props) {
    super(props);

    const parsedUrl = this.parseUrl();

    let selectedTermId;
    // Check the following sources, in order, for the current selected term. If any are found, use that one and don't continue.
    // 1. The url.
    // 2. Localstorage
    // 3. Default to Spring 2018.

    // After the term is found, keep it in localstorage in case the url is changed or the
    // Keeping this in localStorage makes it sticky across page loads.
    if (parsedUrl.selectedTermId) {
      selectedTermId = parsedUrl.selectedTermId;
    } else if (window.localStorage.selectedTermId) {
      selectedTermId = window.localStorage.selectedTermId;
    } else {
      // Defalt to Spring 2018 (need to make this dynamic in the future...)
      selectedTermId = '201830';
    }

    if (selectedTermId === '201810') {
      selectedTermId = '201910';
    }


    this.state = {
      results: [],

      // Value to set the search box to after the search box is rendered.
      // If the user navigates to a page, search for the query.
      searchQuery: parsedUrl.searchQuery,

      // If we a waiting on a user on a slow computer to click enter to search.
      // On desktop, the data is searched every time, but it is only searched after you click enter on mobile.
      waitingOnEnter: false,

      // Keeps track of whether to show the results or the splash screen.
      // Is the same as this.state.searchQuery.length === 0 most of the time, but when the search results are deleted,
      // they animate away instead of switching instantly.
      showSearchResults: false,

      // Keep track of which term the user is searching over. The employee data is the same regardless of the term.
      selectedTermId: selectedTermId,

      // Keep track of whether the feedback modal is open or not.
      feedbackModalOpen: false,
    };

    // Timer used to debounce search queries
    this.searchDebounceTimer = null;

    // Used in analytics to ensure you don't log the same query twice
    this.lastSearch = null;

    // Used in search to make sure you discard a result if the search requests did not come back in order.
    // Ensures that only the most recently selected values for term and search query are displayed.
    this.currentQueryAndTerm = null;

    // Reference to the raw DOM element of the input box.
    // Updated with react refs when the render function runs.
    this.inputElement = null;

    // Used to get the height of the results container element so we can move the stuff below the container up the amount it was transformed.
    this.resultsContainerElement = null;

    // Timer used for hidding the search results after an interval
    this.hideSearchResultsTimeout = null;

    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.onPopState = this.onPopState.bind(this);
    this.onDOMEventSearch = this.onDOMEventSearch.bind(this);
    this.onInputFocus = this.onInputFocus.bind(this);
    this.onSearchDebounced = this.onSearchDebounced.bind(this);
    this.onLogoClick = this.onLogoClick.bind(this);
    this.onTermdropdownChange = this.onTermdropdownChange.bind(this);
    this.openForm = this.openForm.bind(this);
    this.closeForm = this.closeForm.bind(this);

    // Count the number of times the user searched this session. Used for analytics.
    this.searchCount = 0;

    // Log the initial search or pageview.
    this.logSearch(this.state.searchQuery);
  }

  componentDidMount() {
    // Add a listener for location changes.
    window.addEventListener('popstate', this.onPopState);
    window.addEventListener(macros.searchEvent, this.onDOMEventSearch);

    if (this.inputElement) {
      this.inputElement.addEventListener('focus', this.onInputFocus);

      // Don't autofocus on mobile so when the user clicks it we can handle the event and move some elements around.
      if (!macros.isMobile) {
        this.inputElement.focus();
      }
    }

    if (this.state.searchQuery) {
      macros.log('Going to serach for', this.state.searchQuery, this.state.selectedTermId);
      this.search(this.state.searchQuery, this.state.selectedTermId);
    }
  }

  // Remove the listener when this component goes away.
  // Even this component will never go away in prod, it can go away in dev due to HMR.
  componentWillUnmount() {
    window.removeEventListener('onpopstate', this.onPopState);
    window.removeEventListener(macros.searchEvent, this.onDOMEventSearch);

    if (this.inputElement) {
      this.inputElement.removeEventListener('focus', this.onInputFocus);
    }
  }

  // Runs when the user clicks back or forward in their browser.
  onPopState() {
    const parsedUrl = this.parseUrl();

    let newSelectedTermId = this.state.selectedTermId;
    if (parsedUrl.selectedTermId) {
      newSelectedTermId = parsedUrl.selectedTermId;
    }

    // Only search if the query is longer than 0
    this.search(parsedUrl.searchQuery, newSelectedTermId);

    if (this.inputElement) {
      this.inputElement.value = parsedUrl.searchQuery;
    }
  }

  onDOMEventSearch(event) {
    const query = event.detail;

    // Update the text box.
    if (this.inputElement) {
      this.inputElement.value = query;
    }

    // Update the url
    this.onSearchDebounced(query);

    // Scroll to the top
    document.body.scrollTop = 0;

    this.search(query, this.state.selectedTermId);
  }

  onInputFocus() {
    if (macros.isMobile) {
      this.setState({
        results: [],
        waitingOnEnter: true,
      });
    }
  }

  onLogoClick() {
    if (this.inputElement) {
      this.inputElement.value = '';
    }

    this.search('', this.state.selectedTermId);
  }

  // On mobile, this is called whenever the user clicks enter.
  // On desktop, this is called 500ms after they user stops typing.
  onSearchDebounced(searchQuery) {
    searchQuery = searchQuery.trim();

    this.updateUrl(this.state.selectedTermId, searchQuery);

    this.logSearch(searchQuery);
  }

  onClick(event) {
    if (macros.isMobile) {
      this.setState({
        results: [],
        searchQuery: event.target.value,
        waitingOnEnter: true,
      });
      return;
    }

    // Log the query 500 ms from now.
    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(this.onSearchDebounced.bind(this, event.target.value), 500);

    this.searchFromUserAction(event);
  }

  onKeyDown(event) {
    if (event.key !== 'Enter') {
      return;
    }

    if (macros.isMobile) {
      // Hide the keyboard on android phones.
      if (document.activeElement) {
        document.activeElement.blur();
      }

      this.onSearchDebounced(event.target.value);
    }

    this.searchFromUserAction(event);
  }

  onTermdropdownChange(event, data) {
    localStorage.selectedTermId = data.value;

    this.updateUrl(data.value, this.state.searchQuery);

    this.setState({
      selectedTermId: data.value,
    }, () => {
      if (this.state.searchQuery) {
        this.search(this.state.searchQuery, data.value);
      }
    });
  }

  // Parse termId and query from the url. The url might just be a search and it might be a search term and a termId
  parseUrl() {
    const pathname = decodeURIComponent(macros.replaceAll(window.location.pathname.slice(1), '+', ' '));
    const retVal = {};


    if (pathname.includes('/')) {
      // Must be something from the future or something, just treat the entire thing as a search
      if (macros.occurrences(pathname, '/') > 1) {
        retVal.searchQuery = pathname;
      } else {
        const splitPathname = pathname.split('/');

        if (splitPathname[0].length === 6) {
          retVal.selectedTermId = splitPathname[0];
          retVal.searchQuery = splitPathname[1];
        } else {
          retVal.searchQuery = pathname;
        }
      }
    } else {
      retVal.searchQuery = pathname;
    }

    return retVal;
  }

  closeForm() {
    this.setState({ feedbackModalOpen: false });
  }

  openForm() {
    this.setState({ feedbackModalOpen: true });
  }

  logSearch(searchQuery) {
    searchQuery = searchQuery.trim();
    if (searchQuery === this.lastSearch) {
      macros.log('Not logging because same as last search', searchQuery);
      return;
    }
    this.lastSearch = searchQuery;

    if (searchQuery) {
      this.searchCount++;
      window.ga('send', 'pageview', `/?search=${searchQuery}`);

      macros.logAmplitudeEvent('Search', { query: searchQuery.toLowerCase(), sessionCount: this.searchCount });
    } else {
      macros.logAmplitudeEvent('Homepage visit');
      window.ga('send', 'pageview', '/');
    }
  }

  // Called from ResultsLoader to load more
  loadMore() {
    this.search(this.state.searchQuery, this.state.selectedTermId, this.state.results.length + 10);
  }

  async search(searchQuery, selectedTermId, termCount = 5) {
    this.currentQueryAndTerm = searchQuery + selectedTermId;

    const results = await search.search(searchQuery, selectedTermId, termCount);

    if ((searchQuery + selectedTermId) !== this.currentQueryAndTerm) {
      macros.log('Did not come back in order, discarding ', this.currentQueryAndTerm, '!==', searchQuery, selectedTermId);
      return;
    }

    clearTimeout(this.hideSearchResultsTimeout);


    const newState = {
      showSearchResults: true,
      searchQuery: searchQuery,
      selectedTermId: selectedTermId,
      waitingOnEnter: false,
    };

    if (searchQuery.length !== 0) {
      newState.results = results;
    }


    this.setState(newState);


    // Hide the results after some delay
    if (searchQuery.length === 0) {
      this.hideSearchResultsTimeout = setTimeout(() => {
        this.setState({
          results: [],
          showSearchResults: false,
        });
      }, 2000);
    }
  }

  searchFromUserAction(event) {
    this.search(event.target.value, this.state.selectedTermId);
  }

  updateUrl(selectedTermId, searchQuery) {
    let encodedQuery = '';
    for (const letter of searchQuery) {
      if (letter === ' ') {
        encodedQuery += '+';
      } else {
        encodedQuery += encodeURIComponent(letter);
      }
    }

    // There was one error received by rollbar that said:
    // Uncaught SecurityError: Failed to execute 'pushState' on 'History': A history state object with URL 'https:' cannot be created in a document with origin 'https://searchneu.com' and URL 'https://searchneu.com/...'.
    // Which doesn't really make sense because 'https:' is not a valid URL,
    // but just in case there is a try-catch around this call (no real reason not to have one).
    // https://rollbar.com/ryanhugh/searchneu/items/10/
    try {
      window.history.pushState(null, null, `/${selectedTermId}/${encodedQuery}`);
    } catch (e) {
      macros.error('Could not change URL?', e);
    }
  }

  render() {
    let resultsElement = null;

    if (!this.state.showSearchResults) {
      resultsElement = <span className='splashPage'> <SplashPage /> </span>;
    } else if (this.state.results) {
      const memeMatches = {
        meme: true,
        memes: true,
      };

      if (memeMatches[this.state.searchQuery.toLowerCase().trim()]) {
        resultsElement = (
          <div className='aounContainer'>
            <img alt='Promised Aoun memes coming soon.' src={ aoun } />
          </div>
        );
      } else if (this.state.results.length === 0 && this.state.searchQuery.length > 0 && !this.state.waitingOnEnter) {
        resultsElement = (
          <div className='noResultsContainer'>
            <h3>No Results</h3>
            <div className='noResultsBottomLine'>
              Want to&nbsp;
              <a target='_blank' rel='noopener noreferrer' href={ `https://google.com/search?q=${macros.collegeName} ${this.state.searchQuery}` }>
                search for&nbsp;
                <div className='ui compact segment noResultsInputText'>
                  <p> {this.state.searchQuery} </p>
                </div>
                  &nbsp;on Google
              </a>
              ?
            </div>
          </div>
        );
      } else {
        resultsElement = (<ResultsLoader
          results={ this.state.results }
          loadMore={ this.loadMore }
        />);
      }
    }

    let hitEnterToSearch = null;
    if (document.activeElement === this.inputElement) {
      hitEnterToSearch = (
        <div className='hitEnterToSearch'>
          Hit Enter to Search ...
        </div>
      );
    }


    // Styles for the search header and the boston outline at the bottom of the above-the-fold content.
    const bostonContainerStyle = {};
    const topHeaderStyle = {};
    const resultsContainerStyle = {};

    // Don't animate anything on mobile.
    // and set the second state of the animations if there is something in the text box.
    if (!macros.isMobile && this.state.searchQuery.length !== 0) {
      topHeaderStyle.transform = 'translateY(-50%) translateY(230px)';
      resultsContainerStyle.transform = `translateY(-${window.innerHeight - 305}px)`;
      bostonContainerStyle.opacity = 0;
    }

    // On mobile only show the logo and the github corner if there are no results and the search box is not focused (the virtual keyboard is not on the screen).
    let containerClassnames = 'home-container';
    if (macros.isMobile) {
      // Show the compact view unless there is nothing entered into the text box and the text box is not focused.
      // (Aka show the compact view when the input is focused, when there are results, or when there are no results).
      if (this.state.searchQuery.length > 0 || document.activeElement === this.inputElement) {
        containerClassnames += ' mobileCompact';
      } else {
        containerClassnames += ' mobileFull';
      }
    }

    const termDropDownOptions = [
      {
        text: 'Spring 2018',
        value: '201830',
      },
      {
        text: 'Summer I 2018',
        value: '201840',
      },
      {
        text: 'Summer II 2018',
        value: '201860',
      },
      {
        text: 'Summer Full 2018',
        value: '201850',
      },
      {
        text: 'Fall 2018',
        value: '201910',
      },
    ];

    // Not totally sure why, but this height: 100% removes the extra whitespace at the bottom of the page caused by the upward translate animation.
    // Actually it only removes the extra whitespace on chrome. Need to come up with a better solution for other browsers.
    return (
      <div className={ containerClassnames }>

        <a target='_blank' rel='noopener noreferrer' href='https://github.com/ryanhugh/searchneu' className='githubCornerContainer'>
          {/* eslint-disable max-len */}
          <svg width='80' height='80' viewBox='0 0 250 250'>
            <path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z' />
            <path d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2' fill='currentColor' className='octopusArm' />
            <path d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z' fill='currentColor' /> {/* eslint-disable max-len*/}
          </svg>
          {/* eslint-enable max-len */}
        </a>

        <img src={ logo } className='logo' alt='logo' onClick={ this.onLogoClick } />

        <div className='bostonContainer' style={ bostonContainerStyle } >
          <img src={ boston } className='boston' alt='logo' />
        </div>

        <div>
          <div
            className={ cx({
              ui: true,
              center: true,
              spacing: true,
              aligned: true,
              icon: true,
              header: true,
              topHeader: true,
            }) }
            style={ topHeaderStyle }
          >
            <div className='centerTextContainer'>
              <h1 className='title'>
                Search For Northeastern
              </h1>
              <p className='subtitle'>
                Search for classes, professors, subjects, etc.
              </p>
              <div>
                <div className='sub header searchWrapper'>
                  <label htmlFor='search_id'>
                    <i className='search icon' />
                  </label>
                  <input
                    type='search'
                    id='seach_id'
                    autoComplete='off'
                    spellCheck='false'
                    tabIndex='0'
                    className='searchBox'
                    onChange={ this.onClick }
                    onKeyDown={ this.onKeyDown }
                    defaultValue={ this.state.searchQuery }
                    ref={ (element) => { this.inputElement = element; } }
                  />
                </div>
                <Dropdown
                  fluid
                  selection
                  defaultValue={ this.state.selectedTermId }
                  placeholder='Spring 2018'
                  className='termDropdown'
                  options={ termDropDownOptions }
                  onChange={ this.onTermdropdownChange }
                />
              </div>
              {hitEnterToSearch}
            </div>
          </div>
        </div>

        <div style={ resultsContainerStyle } className='resultsContainer' >
          <div ref={ (element) => { this.resultsContainerElement = element; } }>
            {resultsElement}
          </div>

          <div className='botttomPadding' />

          <div className='footer'>

            <div className='footer ui basic center aligned segment'>
              See an issue or want to add to this website? Fork it or create an issue on
              <a target='_blank' rel='noopener noreferrer' href='https://github.com/ryanhugh/searchneu'>
                &nbsp;GitHub
              </a>.
            </div>

            <div className='ui divider' />

            <div className='footer ui basic center aligned segment credits'>
              Made with coffee&nbsp;
              <i className='coffee circular small icon' />
              by&nbsp;
              <a target='_blank' rel='noopener noreferrer' href='http://github.com/ryanhugh'>
                Ryan Hughes
              </a>
              &nbsp;and love&nbsp;
              <i className='heart circular small icon' />
              from some awesome&nbsp;
              <a target='_blank' rel='noopener noreferrer' href='https://github.com/ryanhugh/searchneu/graphs/contributors'>
                Contributors
              </a>.
            </div>
            <div className='footer ui basic center aligned segment affiliation'>
              Search NEU is built for students by students & is not affiliated with NEU.
            </div>
            <div className='footer ui basic center aligned segment contact'>
              <a role='button' tabIndex={ 0 } onClick={ this.openForm }>
                Feedback
              </a>
              &nbsp;•&nbsp;
              <a role='button' tabIndex={ 0 } onClick={ this.openForm }>
                Report a bug
              </a>
              &nbsp;•&nbsp;
              <a role='button' tabIndex={ 0 } onClick={ this.openForm }>
                Contact
              </a>
            </div>

          </div>
        </div>

        <FeedbackModal closeForm={ this.closeForm } feedbackModalOpen={ this.state.feedbackModalOpen } />

        <ReactTooltip effect='solid' className='listIconTooltip' />
      </div>
    );
  }
}


export default Home;
