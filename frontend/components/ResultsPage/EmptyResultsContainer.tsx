/*
 * This file is part of Search NEU and licensed under AGPL3.
 * See the license file in the root folder for details.
 */
import React from 'react';
import macros from '../macros';

interface EmptyResultsProps {
  query: string
}

/**
 * Empty page that signifies to user no results were found
 */
export default function EmptyResultsContainer({ query }: EmptyResultsProps) {
  return (
    <div className='Results_EmptyContainer'>
      <h3>
        No Results
      </h3>
      <div className='Results_EmptyBottomLine'>
        Want to&nbsp;
        <a
          target='_blank'
          rel='noopener noreferrer'
          href={ `https://google.com/search?q=${macros.collegeName} ${query}` }
        >
          search for&nbsp;
          <div className='ui compact segment Results_EmptyText'>
            <p>
              {query}
            </p>
          </div>
          &nbsp;on Google
        </a>
        ?
      </div>
    </div>
  );
}
