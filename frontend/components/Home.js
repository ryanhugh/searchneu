import React from 'react';
import CSSModules from 'react-css-modules';
import 'semantic-ui-css/semantic.min.css';
import ReactTooltip from 'react-tooltip';
import classNames from 'classnames/bind';

import '../css/base.css';

import aoun from './aouuuuuuuuun.png'
import search from './search';
import css from './home.css';
import macros from './macros';
import ResultsLoader from './ResultsLoader';


const cx = classNames.bind(css);

// Home page component
class Home extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      results: [],

      // Value to set the search box to after the search box is rendered.
      // If the user navigates to a page, search for the query.
      searchTerm: this.getSearchQueryFromUrl(),

      // If we a waiting on a user on a slow computer to click enter to search.
      // On desktop, the data is searched every time, but it is only searched after you click enter on mobile.
      waitingOnEnter: false,
    };

    // Timer used to debounce search queries
    this.searchDebounceTimer = null;

    // Used in analytics to ensure you don't log the same query twice
    this.lastSearch = null;

    // Used in search to make sure you discard a result if the search requests did not come back in order
    this.currentQuery = null;

    // Reference to the raw DOM element of the input box.
    // Updated with react refs when the render function runs.
    this.inputElement = null;

    this.onClick = this.onClick.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.loadMore = this.loadMore.bind(this);
    this.onPopState = this.onPopState.bind(this);
    this.onSearchDebounced = this.onSearchDebounced.bind(this);

    // Count the number of times the user searched this session. Used for analytics. 
    this.searchCount = 0;

    // Log the initial search or pageview.
    this.logSearch(this.state.searchTerm);
  }

  getSearchQueryFromUrl() {
    return decodeURIComponent(macros.replaceAll(location.pathname.slice(1), '+', ' '))
  }

  // Runs when the user clicks back or forward in their browser.
  onPopState() {
    let query = this.getSearchQueryFromUrl()

    // Only search if the query is longer than 0
    if (query) {
      this.search(query)
    }
    else {
      this.setState({
        results: [],
        searchTerm: query,
      });
    }

    if (this.inputElement) {
      this.inputElement.value = query
    }
  }

  // Remove the listener when this component goes away. 
  // Even this component will never go away in prod, it can go away in dev due to HMR. 
  componentWillUnmount() {
    window.removeEventListener('onpopstate', this.onPopState);
  }

  logSearch(searchTerm) {
    searchTerm = searchTerm.trim();
    if (searchTerm === this.lastSearch) {
      console.log('Not logging because same as last search', searchTerm);
      return;
    }
    this.lastSearch = searchTerm;

    if (searchTerm) {
      this.searchCount ++;
      window.ga('send', 'pageview', `/?search=${searchTerm}`);
      window.amplitude.logEvent('Search', {'query': searchTerm, sessionCount: this.searchCount});
    } else {
      window.amplitude.logEvent('Homepage visit');
      window.ga('send', 'pageview', '/');
    }
  }


  // On mobile, this is called whenever the user clicks enter.
  // On desktop, this is called 500ms after they user stops typing.
  onSearchDebounced(searchTerm) {
    searchTerm = searchTerm.trim()

    let encodedQuery = ''
    for (const letter of searchTerm) {
      if (letter === ' ') {
        encodedQuery += '+'
      }
      else {
        encodedQuery += encodeURIComponent(letter)
      }
    }

    // There was one error received by rollbar that said:
    // Uncaught SecurityError: Failed to execute 'pushState' on 'History': A history state object with URL 'https:' cannot be created in a document with origin 'https://searchneu.com' and URL 'https://searchneu.com/...'.
    // Which doesn't really make sense because 'https:' is not a valid URL,
    // but just in case there is a try-catch around this call (no real reason not to have one). 
    // https://rollbar.com/ryanhugh/searchneu/items/10/
    try {
      history.pushState(null, null, `/${encodedQuery}`);
    }
    catch (e) {
      macros.error("Could not change URL?", e)
    }
    this.logSearch(searchTerm);
  }


  async componentDidMount() {

    // Add a listener for location changes. 
    window.addEventListener('popstate', this.onPopState);

    if (this.state.searchTerm) {
      console.log('Going to serach for', this.state.searchTerm);
      this.search(this.state.searchTerm);
    }

    // If testing locally, bring up some results without typing in anything.
    // (This is just for testing, feel free to change it to whatever.)
    else if (macros.DEV) {
      this.search('cs');
    } else {
      // Force an update on the screen so the loading bar disappears and the page shows.
      this.forceUpdate();
    }
  }

  // Called from ResultsLoader to load more
  loadMore() {
    this.search(this.state.searchTerm, this.state.results.length + 10);
  }

  async search(searchTerm, termCount = 5) {
    this.currentQuery = searchTerm;
    const results = await search.search(searchTerm, termCount);

    if (searchTerm !== this.currentQuery) {
      console.log('Did not come back in order, discarding ', searchTerm);
      return;
    }

    this.setState({
      results: results,
      searchTerm: searchTerm,
      waitingOnEnter: false,
    });
  }

  searchFromUserAction(event) {
    if (!event.target.value) {
      this.setState({
        results: [],
        searchTerm: event.target.value,
      });
      return;
    }

    this.search(event.target.value);
  }


  onClick(event) {
    if (macros.isMobile) {
      this.setState({
        results: [],
        searchTerm: event.target.value,
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


  render() {
    let resultsElement = null;

    if (this.state.results) {

      let memeMatches = {
        meme: true,
        memes: true,
      }

      if (memeMatches[this.state.searchTerm.toLowerCase().trim()]) {
        resultsElement = (
          <div className = { css.aounContainer }> 
            <img src={aoun}/> 
          </div>
        )
      }
      else if (this.state.results.length === 0 && this.state.searchTerm.length > 0 && !this.state.waitingOnEnter) {
        resultsElement = (
          <div className={ css.noResultsContainer }>
            <h3>No Results</h3>
            <div className={ css.noResultsBottomLine }>
              Want to&nbsp;
              <a target='_blank' rel='noopener noreferrer' href={ `https://google.com/search?q=${macros.collegeName} ${this.state.searchTerm}` }>
                search for&nbsp;
                  <div className={ `ui compact segment ${css.noResultsInputText}` }>
                    <p> {this.state.searchTerm} </p>
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
    if (this.state.waitingOnEnter) {
      hitEnterToSearch = (
        <div className={ css.hitEnterToSearch }>
          Hit Enter to Search ...
        </div>
      );
    }

    let mobileSearchBoxStyle = {}
    if (macros.isMobile) {
      mobileSearchBoxStyle = {
        width: '95%',
        marginRight: '10px',
        marginLeft: '10px',
        maxWidth: 'none'
      }
    }

    return (
      <div>

        <a href='https://github.com/ryanhugh/searchneu' className='github-corner'>
          {/* eslint-disable max-len */}
          <svg width='80' height='80' viewBox='0 0 250 250' className={ css.githubCornerIcon } >
            <path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z' />
            <path d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2' fill='currentColor' className={ `${css.octopusArm} octo-arm` } />
            <path d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z' fill='currentColor' className='octo-body' /> {/* eslint-disable max-len*/}
          </svg>
          {/* eslint-enable max-len */}
        </a>

        <div className={ css.topPadding } />
        <div>
          <div id='top-header' className={cx({
            ui: true,
            center: true,
            aligned: true,
            icon: true,
            header: true,
            mobileHeader: macros.isMobile
          })}>
            <h1 className={ css.title }>
            Search
          </h1>
            <h3 className={ css.subtitle }>
              For Northeastern
            </h3>
            <div className = {css.semester}>
              Fall 2017
            </div>
            <div id='search-wrapper' className='sub header' style = {mobileSearchBoxStyle}>
              <label htmlFor='search_id'>
                <i className='search icon' />
              </label>
              <input
                autoFocus 
                type='search'
                id='seach_id'
                placeholder='Search Classes, Professors, and Employees'
                autoComplete='off'
                spellCheck='false'
                tabIndex='0'
                onChange={ this.onClick }
                onKeyDown={ this.onKeyDown }
                defaultValue={ this.state.searchTerm }
                ref={(element) => { this.inputElement = element; }}
              />
            </div>
            {hitEnterToSearch}
          </div>
          {resultsElement}
        </div>
        <div className={ css.botttomPadding } />


        <div className='ui divider' />

        <div className='footer ui basic center aligned segment'>
          See an issue or want to add to this website? Fork it or create an issue on
          <a target='_blank' rel='noopener noreferrer' href='https://github.com/ryanhugh/searchneu'>
            &nbsp;GitHub
          </a>.
        </div>

        <div className='ui divider' />

        <div className={'footer ui basic center aligned segment ' + css.credits}>
          Made with&nbsp;
          <i className='rocket circular small icon' />
          &nbsp;by&nbsp;
          <a target='_blank' rel='noopener noreferrer' href='http://github.com/ryanhugh'>
            Ryan Hughes
          </a>
          &nbsp;and UI inspired by&nbsp;
          <a target='_blank' rel='noopener noreferrer' href='https://github.com/2factorauth/twofactorauth'>
            Two Factor Authenticaton
          </a>.
        </div>

        <div className={"footer ui basic center aligned segment " + css.contact}>
          <a target='_blank' rel='noopener noreferrer' href="https://docs.google.com/forms/d/e/1FAIpQLSckWpmBBFPGYycZc54rirDaxINcx14_ApTkisamyfF7Mmo6Gw/viewform">
            Feedback
          </a>
          &nbsp;•&nbsp;
          <a target='_blank' rel='noopener noreferrer' href="https://docs.google.com/forms/d/e/1FAIpQLSckWpmBBFPGYycZc54rirDaxINcx14_ApTkisamyfF7Mmo6Gw/viewform">
            Report a bug
          </a>
          &nbsp;•&nbsp;
          <a target='_blank' rel='noopener noreferrer' href="https://docs.google.com/forms/d/e/1FAIpQLSckWpmBBFPGYycZc54rirDaxINcx14_ApTkisamyfF7Mmo6Gw/viewform">
            Contact
          </a>
        </div>


        <ReactTooltip effect='solid' className={ css.listIconTooltip } />
      </div>
    );
  }
}


export default CSSModules(Home, css);
