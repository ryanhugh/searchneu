import React from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import { SearchItem } from './types';
import macros from './macros';
import EmployeePanel from './panels/EmployeePanel';
import DesktopClassPanel from './panels/DesktopClassPanel';
import MobileClassPanel from './panels/MobileClassPanel';

import Class from './classModels/Class';
import Keys from '../../common/Keys';

interface ResultsLoaderProps {
  results: SearchItem[],
  loadMore: () => void
}

function ResultsLoader({ results, loadMore }: ResultsLoaderProps) {
  return (
    <InfiniteScroll
      dataLength={ results.length }
      next={ loadMore }
      hasMore
      loader={ null }
    >
      <div className='ui container results-loader-container'>
        <div className='five column row'>
          <div className='page-home'>
            {results.map((result) => (
              <ResultItemMemoized
                key={ result.type === 'class' ? Keys.getClassHash(result.class) : result.employee.id }
                result={ result }
              />
            ))}
          </div>
        </div>
      </div>
    </InfiniteScroll>
  )
}

// Memoize result items to avoid unneeded re-renders and to reuse
// If the Panels are updated to function components, we can memoize them instead and remove this
const ResultItemMemoized = React.memo(({ result }:{result:SearchItem}) => {
  if (result.type === 'class') {
    const aClass = Class.create(result.class);
    aClass.loadSectionsFromServerList(result.sections);
    if (macros.isMobile) {
      return <MobileClassPanel aClass={ aClass } />;
    }

    return <DesktopClassPanel aClass={ aClass } />;
  }

  if (result.type === 'employee') {
    return <EmployeePanel employee={ result.employee } />;
  }

  macros.log('Unknown type', result.type);
  return null;
});

export default ResultsLoader;
